import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const dateFilter: Record<string, unknown> = {};

    if (fromParam) {
      dateFilter.gte = new Date(fromParam);
    }
    if (toParam) {
      // Set end of day for the "to" date
      const toDate = new Date(toParam);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    // Fetch all orders for the period
    const orders = await prisma.order.findMany({
      where:
        Object.keys(dateFilter).length > 0
          ? { createdAt: dateFilter as Record<string, Date> }
          : undefined,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Collect all product IDs to map names (OrderItem has no product relation)
    const allProductIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))];
    const products = allProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: allProductIds } },
          select: { id: true, name: true },
        })
      : [];
    const productNameMap = new Map(products.map((p) => [p.id, p.name]));

    // Calculate totalRevenue
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );

    // ordersCount
    const ordersCount = orders.length;

    // averageTicket
    const averageTicket = ordersCount > 0 ? totalRevenue / ordersCount : 0;

    // dailySales: aggregate revenue by date
    const dailyMap = new Map<string, number>();
    for (const order of orders) {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      const current = dailyMap.get(dateStr) || 0;
      dailyMap.set(dateStr, current + Number(order.total));
    }

    const dailySales = Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // topProducts: aggregate quantity sold
    const productMap = new Map<string, { name: string; quantity: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const existing = productMap.get(item.productId);
        const productName = productNameMap.get(item.productId) ?? 'Produto removido';
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          productMap.set(item.productId, {
            name: productName,
            quantity: item.quantity,
          });
        }
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20);

    // salesByPaymentMethod
    const paymentMap = new Map<string, number>();
    for (const order of orders) {
      const method = order.paymentMethod;
      const current = paymentMap.get(method) || 0;
      paymentMap.set(method, current + Number(order.total));
    }

    const salesByPaymentMethod = Array.from(paymentMap.entries()).map(
      ([method, total]) => ({ method, total })
    );

    return NextResponse.json({
      totalRevenue,
      ordersCount,
      averageTicket,
      dailySales,
      topProducts,
      salesByPaymentMethod,
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório de vendas' },
      { status: 500 }
    );
  }
}
