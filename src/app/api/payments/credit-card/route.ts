import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { mpClient } from '@/lib/mercadopago';

const creditCardPaymentSchema = z.object({
  orderId: z.string().min(1, 'ID do pedido é obrigatório'),
  cardToken: z.string().min(1, 'Token do cartão é obrigatório'),
  installments: z.number().int().min(1).default(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = creditCardPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { orderId, cardToken, installments } = validation.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Fetch product names since OrderItem has no product relation
    const productIds = order.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productNameMap = new Map(products.map((p) => [p.id, p.name]));

    // Build items for MercadoPago payment
    const items = order.items.map((item) => ({
      id: item.productId,
      title: productNameMap.get(item.productId) || `Produto ${item.productId.slice(0, 8)}`,
      unit_price: Number(item.price),
      quantity: item.quantity,
      currency_id: 'BRL',
    }));

    // Capture payment with credit card using MercadoPago SDK
    // payment_method_id is omitted so MercadoPago detects it from the token
    const payment = await mpClient.payment.create({
      transaction_amount: Number(order.total),
      token: cardToken,
      description: `Pedido ${order.id}`,
      installments: installments,
      payer: {
        email: order.customerPhone
          ? `customer_${order.customerPhone.replace(/\D/g, '')}@placeholder.com`
          : 'customer@placeholder.com',
      },
      additional_info: {
        items: items,
      },
      metadata: {
        orderId: order.id,
      },
    });

    // Update order with payment info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: 'CREDIT_CARD',
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      transactionAmount: payment.transaction_amount,
      installments: payment.installments,
    });
  } catch (error) {
    console.error('Error creating credit card payment:', error);

    // Check for MercadoPago API error
    const mpError = error as { cause?: { error?: string; message?: string } };
    const message =
      mpError.cause?.error || mpError.cause?.message || 'Erro ao processar pagamento';

    return NextResponse.json(
      {
        error: 'Erro ao processar pagamento com cartão de crédito',
        details: message,
      },
      { status: 400 }
    );
  }
}
