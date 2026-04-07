import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { mpPreference } from '@/lib/mercadopago';

const pixPaymentSchema = z.object({
  orderId: z.string().min(1, 'ID do pedido é obrigatório'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = pixPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { orderId } = validation.data;

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

    // Build items for MercadoPago preference
    const preferenceItems = order.items.map((item) => ({
      id: item.productId,
      title: productNameMap.get(item.productId) || `Produto ${item.productId.slice(0, 8)}`,
      unit_price: Number(item.price),
      quantity: item.quantity,
      currency_id: 'BRL',
    }));

    // Create MercadoPago preference with PIX as payment method
    const preference = await mpPreference.create({
      body: {
        items: preferenceItems,
        payment_methods: {
          excluded_payment_types: [
            { id: 'ticket' },
            { id: 'debit_card' },
          ],
          installments: 1,
        },
        metadata: {
          orderId: order.id,
        },
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/payments/webhook`,
        external_reference: order.id,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.id}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.id}`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.id}`,
        },
      },
    });

    // Extract PIX data from preference
    const prefData = preference as {
      point_of_interaction?: {
        transaction_data?: {
          qr_code?: string;
          qr_code_base64?: string;
        };
      };
    };

    const qrCode = prefData.point_of_interaction?.transaction_data?.qr_code || '';
    const qrCodeBase64 = prefData.point_of_interaction?.transaction_data?.qr_code_base64 || '';

    if (!qrCode && !qrCodeBase64) {
      return NextResponse.json(
        {
          preferenceId: preference.id,
          init_point: preference.init_point,
          sandbox_init_point: preference.sandbox_init_point,
          error: 'Não foi possível gerar dados PIX. Use o link de pagamento.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      preferenceId: preference.id,
      qrCode,
      qrCodeBase64,
      ticketUrl: preference.init_point || preference.sandbox_init_point,
    });
  } catch (error) {
    console.error('Error creating PIX payment:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pagamento PIX' },
      { status: 500 }
    );
  }
}
