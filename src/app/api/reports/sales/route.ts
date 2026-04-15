import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminAuth } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

type ReportOrder = {
  status: string
  total: unknown
  deliveryFee: unknown
  paymentMethod: string
  customerPhone: string | null
  customerName: string | null
  createdAt: Date
  items: Array<{
    productId: string
    quantity: number
    price: unknown
    costPrice: unknown
  }>
}

function normalizeDateRange(fromParam: string | null, toParam: string | null) {
  const today = new Date()
  const toDate = toParam ? new Date(toParam) : new Date(today)
  toDate.setHours(23, 59, 59, 999)

  const fromDate = fromParam ? new Date(fromParam) : new Date(toDate)
  fromDate.setHours(0, 0, 0, 0)

  if (fromDate > toDate) {
    const safeFrom = new Date(toDate)
    safeFrom.setHours(0, 0, 0, 0)
    return { fromDate: safeFrom, toDate }
  }

  return { fromDate, toDate }
}

function getPreviousRange(fromDate: Date, toDate: Date) {
  const rangeMs = toDate.getTime() - fromDate.getTime()
  const previousTo = new Date(fromDate.getTime() - 1)
  const previousFrom = new Date(previousTo.getTime() - rangeMs)

  return { previousFrom, previousTo }
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function buildPeriodSummary(orders: ReportOrder[]) {
  const validOrders = orders.filter((order) => order.status !== "CANCELLED")
  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED")
  const cancelledOrders = orders.filter((order) => order.status === "CANCELLED")
  const activeOrders = orders.filter((order) =>
    ["PENDING", "CONFIRMED", "PREPARING", "READY"].includes(order.status)
  )

  const totalRevenue = validOrders.reduce((sum, order) => sum + Number(order.total), 0)
  const totalOrders = validOrders.length
  const cancelledOrdersCount = cancelledOrders.length
  const deliveredOrdersCount = deliveredOrders.length
  const activeOrdersCount = activeOrders.length

  const uniqueClients = new Set(
    validOrders
      .map((order) => (order.customerPhone || order.customerName || "").trim())
      .filter(Boolean)
  ).size

  const itemsProfit = validOrders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((itemsSum, item) => {
        return itemsSum + (Number(item.price) - Number(item.costPrice)) * item.quantity
      }, 0)
    )
  }, 0)

  const deliveryRevenue = validOrders.reduce((sum, order) => sum + Number(order.deliveryFee), 0)
  const totalProfit = itemsProfit + deliveryRevenue
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  const cancellationRate = orders.length > 0 ? (cancelledOrdersCount / orders.length) * 100 : 0

  return {
    totalRevenue,
    totalOrders,
    totalClients: uniqueClients,
    totalProfit,
    avgTicket,
    profitMargin,
    cancellationRate,
    deliveredOrders: deliveredOrdersCount,
    cancelledOrders: cancelledOrdersCount,
    activeOrders: activeOrdersCount,
    cancelledRevenue: cancelledOrders.reduce((sum, order) => sum + Number(order.total), 0),
    deliveredRevenue: deliveredOrders.reduce((sum, order) => sum + Number(order.total), 0),
    deliveryRevenue,
  }
}

function buildComparison(currentValue: number, previousValue: number) {
  const diff = currentValue - previousValue

  return {
    current: currentValue,
    previous: previousValue,
    diff,
    percent:
      previousValue === 0 ? (currentValue > 0 ? 100 : 0) : (diff / previousValue) * 100,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  try {
    const { searchParams } = request.nextUrl
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    const { fromDate, toDate } = normalizeDateRange(fromParam, toParam)
    const { previousFrom, previousTo } = getPreviousRange(fromDate, toDate)

    const [orders, previousOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        include: {
          items: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: previousFrom,
            lte: previousTo,
          },
        },
        include: {
          items: true,
        },
      }),
    ])

    const currentSummary = buildPeriodSummary(orders)
    const previousSummary = buildPeriodSummary(previousOrders)

    const productIds = [
      ...new Set(
        orders
          .filter((order) => order.status !== "CANCELLED")
          .flatMap((order) => order.items.map((item) => item.productId))
      ),
    ]

    const products = productIds.length
      ? await prisma.product.findMany({
          where: {
            id: {
              in: productIds,
            },
          },
          select: {
            id: true,
            name: true,
            image: true,
          },
        })
      : []

    const productMap = new Map(products.map((product) => [product.id, product]))

    const dailyMap = new Map<
      string,
      { date: string; revenue: number; profit: number; orders: number }
    >()

    for (const order of orders.filter((entry) => entry.status !== "CANCELLED")) {
      const date = order.createdAt.toISOString().split("T")[0]
      const current = dailyMap.get(date) || {
        date,
        revenue: 0,
        profit: 0,
        orders: 0,
      }

      current.revenue += Number(order.total)
      current.orders += 1
      current.profit +=
        order.items.reduce((itemsSum, item) => {
          return itemsSum + (Number(item.price) - Number(item.costPrice)) * item.quantity
        }, 0) + Number(order.deliveryFee)

      dailyMap.set(date, current)
    }

    const productSalesMap = new Map<
      string,
      {
        name: string
        quantity: number
        revenue: number
        profit: number
        image: string | null
      }
    >()

    for (const order of orders.filter((entry) => entry.status !== "CANCELLED")) {
      for (const item of order.items) {
        const product = productMap.get(item.productId)
        const current = productSalesMap.get(item.productId) || {
          name: product?.name || "Produto removido",
          quantity: 0,
          revenue: 0,
          profit: 0,
          image: product?.image || null,
        }

        current.quantity += item.quantity
        current.revenue += Number(item.price) * item.quantity
        current.profit += (Number(item.price) - Number(item.costPrice)) * item.quantity

        productSalesMap.set(item.productId, current)
      }
    }

    const paymentMap = new Map<string, { method: string; count: number; revenue: number }>()

    for (const order of orders.filter((entry) => entry.status !== "CANCELLED")) {
      const current = paymentMap.get(order.paymentMethod) || {
        method: order.paymentMethod,
        count: 0,
        revenue: 0,
      }

      current.count += 1
      current.revenue += Number(order.total)
      paymentMap.set(order.paymentMethod, current)
    }

    const paymentBreakdown = Array.from(paymentMap.values())
      .map((item) => ({
        ...item,
        percentage:
          currentSummary.totalRevenue > 0
            ? (item.revenue / currentSummary.totalRevenue) * 100
            : 0,
      }))
      .sort((left, right) => right.revenue - left.revenue)

    return NextResponse.json({
      period: {
        from: toDateKey(fromDate),
        to: toDateKey(toDate),
      },
      previousPeriod: {
        from: toDateKey(previousFrom),
        to: toDateKey(previousTo),
      },
      totalRevenue: currentSummary.totalRevenue,
      totalOrders: currentSummary.totalOrders,
      totalClients: currentSummary.totalClients,
      totalProfit: currentSummary.totalProfit,
      avgTicket: currentSummary.avgTicket,
      profitMargin: currentSummary.profitMargin,
      cancellationRate: currentSummary.cancellationRate,
      deliveredOrders: currentSummary.deliveredOrders,
      cancelledOrders: currentSummary.cancelledOrders,
      activeOrders: currentSummary.activeOrders,
      deliveredRevenue: currentSummary.deliveredRevenue,
      cancelledRevenue: currentSummary.cancelledRevenue,
      deliveryRevenue: currentSummary.deliveryRevenue,
      comparisons: {
        revenue: buildComparison(
          currentSummary.totalRevenue,
          previousSummary.totalRevenue
        ),
        profit: buildComparison(
          currentSummary.totalProfit,
          previousSummary.totalProfit
        ),
        orders: buildComparison(
          currentSummary.totalOrders,
          previousSummary.totalOrders
        ),
        avgTicket: buildComparison(
          currentSummary.avgTicket,
          previousSummary.avgTicket
        ),
      },
      dailySales: Array.from(dailyMap.values()),
      topProducts: Array.from(productSalesMap.values()).sort(
        (left, right) => right.quantity - left.quantity
      ),
      paymentBreakdown,
    })
  } catch (error) {
    console.error("Error fetching sales report:", error)
    return NextResponse.json(
      { error: "Erro ao gerar relatorio financeiro" },
      { status: 500 }
    )
  }
}
