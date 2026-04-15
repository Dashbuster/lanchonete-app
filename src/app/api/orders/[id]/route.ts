import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { attachProductsToOrders } from "@/lib/order-presenter"
import { OrderStatus } from "@/types"
import { WhatsAppService } from "@/lib/whatsapp"
import { requireAdminAuth } from "@/lib/api-auth"

interface Params {
  params: { id: string }
}

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
})

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
}

function normalizePhone(phone: string | null | undefined) {
  if (!phone) {
    return null
  }

  const digits = phone.replace(/\D/g, "")
  return digits.length >= 10 ? digits : null
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  try {
    if (!params?.id) {
      return NextResponse.json(
        { error: "ID do pedido e obrigatorio" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Pedido nao encontrado" },
        { status: 404 }
      )
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

    return NextResponse.json(serializedOrder)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Erro ao buscar pedido" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  try {
    if (!params?.id) {
      return NextResponse.json(
        { error: "ID do pedido e obrigatorio" },
        { status: 400 }
      )
    }

    const existing = await prisma.order.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Pedido nao encontrado" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = updateStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { status } = validation.data

    const allowed = ALLOWED_TRANSITIONS[existing.status as OrderStatus] || []
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Transicao invalida: nao e possivel ir de "${existing.status}" para "${status}"` },
        { status: 400 }
      )
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: {
        items: true,
      },
    })

    const customerPhone = normalizePhone(order.customerPhone)
    const orderCode = order.id.slice(0, 8).toUpperCase()
    const customerName = order.customerName || "Cliente"

    if (
      status === OrderStatus.CONFIRMED &&
      existing.status !== OrderStatus.CONFIRMED &&
      customerPhone
    ) {
      WhatsAppService.sendPaymentConfirmed({
        orderId: order.id,
        customerPhone,
        customerName,
        total: Number(order.total),
        orderCode,
      }).catch((error) => {
        console.error("Falha ao enviar confirmacao de pagamento:", error)
      })
    }

    if (
      status === OrderStatus.READY &&
      existing.status !== OrderStatus.READY &&
      order.address &&
      customerPhone
    ) {
      WhatsAppService.sendOutForDelivery({
        orderId: order.id,
        customerPhone,
        customerName,
        orderCode,
      }).catch((error) => {
        console.error("Falha ao enviar aviso de saida para entrega:", error)
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

    return NextResponse.json(serializedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar pedido" },
      { status: 500 }
    )
  }
}
