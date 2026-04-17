import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { attachProductsToOrders } from "@/lib/order-presenter"
import { WhatsAppService } from "@/lib/whatsapp"
import { orderSchema } from "@/lib/zod"
import { OrderStatus } from "@/types"
import { requireAdminAuth } from "@/lib/api-auth"

const ORDER_STATUSES = new Set(Object.values(OrderStatus))

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function normalizePhone(phone: string | null | undefined) {
  if (!phone) {
    return null
  }

  const digits = phone.replace(/\D/g, "")

  return digits.length >= 10 ? digits : null
}

function describeSelectionRule(group: {
  name: string
  minSelect: number
  maxSelect: number
}) {
  if (group.minSelect > 0 && group.maxSelect > 0) {
    return `entre ${group.minSelect} e ${group.maxSelect} item(ns)`
  }

  if (group.minSelect > 0) {
    return `ao menos ${group.minSelect} item(ns)`
  }

  if (group.maxSelect > 0) {
    return `ate ${group.maxSelect} item(ns)`
  }

  return "uma quantidade valida de itens"
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")?.trim().toUpperCase() || null

    if (status && !ORDER_STATUSES.has(status as OrderStatus)) {
      return NextResponse.json(
        {
          error: "Status de pedido invalido",
          allowed: Array.from(ORDER_STATUSES),
        },
        { status: 400 }
      )
    }

    const orders = await prisma.order.findMany({
      where: status ? { status: status as OrderStatus } : undefined,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const serializedOrders = await attachProductsToOrders(orders, (ids) =>
      prisma.product.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      })
    )

    return NextResponse.json(serializedOrders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Erro ao buscar pedidos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = orderSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: validation.error.errors },
        { status: 400 }
      )
    }

    const customerName = validation.data.customerName.trim()
    const customerPhone = validation.data.customerPhone?.trim() || null
    const normalizedCustomerPhone = normalizePhone(customerPhone)
    const orderType = validation.data.orderType
    const address = validation.data.address?.trim() || null
    const { items, paymentMethod } = validation.data
    const changeFor = validation.data.changeFor

    if (!customerName) {
      return NextResponse.json(
        { error: "Nome do cliente obrigatorio" },
        { status: 400 }
      )
    }

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "delivery_fee",
            "min_order_value",
            "accepts_pickup",
            "store_open",
            "payment_pix",
            "payment_credit_card",
            "payment_debit_card",
            "payment_cash",
            "payment_on_site",
          ],
        },
      },
    })

    const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]))
    const parsedDeliveryFee = Number(settingsMap.get("delivery_fee"))
    const parsedMinOrderValue = Number(settingsMap.get("min_order_value"))
    const deliveryFee = Number.isFinite(parsedDeliveryFee) ? parsedDeliveryFee : 6.9
    const minOrderValue = Number.isFinite(parsedMinOrderValue) ? parsedMinOrderValue : 0
    const acceptsPickup = settingsMap.get("accepts_pickup")
      ? settingsMap.get("accepts_pickup") === "true"
      : true
    const storeOpen = settingsMap.get("store_open")
      ? settingsMap.get("store_open") === "true"
      : true
    const paymentSettings: Record<string, boolean> = {
      PIX: settingsMap.get("payment_pix")
        ? settingsMap.get("payment_pix") === "true"
        : true,
      CREDIT_CARD: settingsMap.get("payment_credit_card")
        ? settingsMap.get("payment_credit_card") === "true"
        : true,
      DEBIT_CARD: settingsMap.get("payment_debit_card")
        ? settingsMap.get("payment_debit_card") === "true"
        : true,
      CASH: settingsMap.get("payment_cash")
        ? settingsMap.get("payment_cash") === "true"
        : true,
      ON_SITE: settingsMap.get("payment_on_site")
        ? settingsMap.get("payment_on_site") === "true"
        : false,
    }

    if (!storeOpen) {
      return NextResponse.json(
        { error: "A loja esta fechada no momento" },
        { status: 400 }
      )
    }

    if (orderType === "delivery" && !address) {
      return NextResponse.json(
        { error: "Informe o endereco para pedidos de entrega" },
        { status: 400 }
      )
    }

    if (orderType === "pickup" && !acceptsPickup) {
      return NextResponse.json(
        { error: "A loja nao esta aceitando retirada no momento" },
        { status: 400 }
      )
    }

    if (!paymentSettings[paymentMethod]) {
      return NextResponse.json(
        { error: "Forma de pagamento indisponivel no momento" },
        { status: 400 }
      )
    }

    const productIds = Array.from(new Set(items.map((item) => item.productId)))
    const addonIds = Array.from(
      new Set(items.flatMap((item) => item.addonIds))
    )

    const [products, addonGroups, addons] = await Promise.all([
      prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
      }),
      prisma.addonGroup.findMany({
        where: {
          OR: [
            { productId: null },
            {
              productId: {
                in: productIds,
              },
            },
          ],
        },
      }),
      addonIds.length
        ? prisma.addon.findMany({
            where: {
              id: {
                in: addonIds,
              },
            },
          })
        : Promise.resolve([]),
    ])

    const productMap = new Map(products.map((product) => [product.id, product]))
    const addonGroupMap = new Map(addonGroups.map((group) => [group.id, group]))
    const addonMap = new Map(addons.map((addon) => [addon.id, addon]))

    let subtotal = 0

    const orderItemsData = items.map((item) => {
      const product = productMap.get(item.productId)

      if (!product) {
        throw new Error(`Produto nao encontrado: ${item.productId}`)
      }

      if (!product.available) {
        throw new Error(`Produto indisponivel: ${product.name}`)
      }

      const selectedAddons = item.addonIds.map((addonId) => {
        const addon = addonMap.get(addonId)

        if (!addon) {
          throw new Error(`Complemento nao encontrado: ${addonId}`)
        }

        const group = addonGroupMap.get(addon.groupId)

        if (!group) {
          throw new Error(`Grupo de complemento nao encontrado para: ${addon.name}`)
        }

        if (group.productId && group.productId !== product.id) {
          throw new Error(`Complemento invalido para o produto ${product.name}: ${addon.name}`)
        }

        return addon
      })

      const selectedCountByGroup = selectedAddons.reduce<Record<string, number>>(
        (acc, addon) => {
          acc[addon.groupId] = (acc[addon.groupId] || 0) + 1
          return acc
        },
        {}
      )

      const applicableGroups = addonGroups.filter(
        (group) => group.productId === null || group.productId === product.id
      )

      for (const group of applicableGroups) {
        const selectedCount = selectedCountByGroup[group.id] || 0

        if (group.required && selectedCount < group.minSelect) {
          throw new Error(
            `Selecione ${describeSelectionRule(group)} em ${group.name} para o produto ${product.name}`
          )
        }

        if (group.maxSelect > 0 && selectedCount > group.maxSelect) {
          throw new Error(
            `Selecione ${describeSelectionRule(group)} em ${group.name} para o produto ${product.name}`
          )
        }
      }

      const addonsPrice = selectedAddons.reduce(
        (sum, addon) => sum + Number(addon.price),
        0
      )
      const basePrice = Number(product.price)
      const baseCostPrice = Number(product.costPrice)
      const unitPrice = roundMoney(basePrice + addonsPrice)

      subtotal = roundMoney(subtotal + unitPrice * item.quantity)

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: unitPrice,
        costPrice: baseCostPrice,
        addons: selectedAddons.map((addon) => ({
          id: addon.id,
          name: addon.name,
          price: Number(addon.price),
        })),
      }
    })

    if (subtotal < minOrderValue) {
      return NextResponse.json(
        {
          error: `Pedido minimo nao atingido. Minimo atual: R$ ${minOrderValue
            .toFixed(2)
            .replace(".", ",")}`,
        },
        { status: 400 }
      )
    }

    const deliveryCost = orderType === "delivery" ? roundMoney(deliveryFee) : 0
    const total = roundMoney(subtotal + deliveryCost)

    const order = await prisma.order.create({
      data: {
        customerName,
        customerPhone,
        address,
        paymentMethod,
        changeFor: changeFor ?? null,
        subtotal,
        deliveryFee: deliveryCost,
        total,
        status: "PENDING",
        items: {
          create: orderItemsData.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            costPrice: item.costPrice,
            addons: item.addons,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    if (normalizedCustomerPhone) {
      WhatsAppService.sendOrderConfirmation({
        orderId: order.id,
        customerPhone: normalizedCustomerPhone,
        customerName,
        total: Number(order.total),
        orderCode: order.id.slice(0, 8).toUpperCase(),
      }).catch((error) => {
        console.error("Falha ao enviar confirmacao do pedido:", error)
      })
    }

    const [serializedOrder] = await attachProductsToOrders([order], (ids) =>
      prisma.product.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      })
    )

    return NextResponse.json(serializedOrder, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao criar pedido",
      },
      { status: 500 }
    )
  }
}
