import { NextResponse } from 'next/server';
import { mpPayment } from '@/lib/mercadopago';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Handle MercadoPago payment webhook
    if (type === 'payment' && data?.id) {
      const paymentId = data.id;

      // Fetch payment details from MercadoPago
      const payment = await mpPayment.get({ id: paymentId });

      const orderId =
        payment.metadata?.orderId || payment.external_reference;

      if (!orderId) {
        console.error('Webhook: no orderId found in payment metadata');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Fetch current order to check status before updating
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder) {
        console.error(`Webhook: order ${orderId} not found`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Don't modify orders that are already completed or delivered
      if (
        currentOrder.status === 'DELIVERED' ||
        currentOrder.status === 'READY'
      ) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Check if payment was approved
      if (payment.status === 'approved' || payment.status === 'authorized') {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CONFIRMED',
            paymentMethod:
              payment.payment_type_id === 'credit_card'
                ? 'CREDIT_CARD'
                : payment.payment_type_id === 'debit_card'
                  ? 'DEBIT_CARD'
                  : 'PIX',
          },
        });
      } else if (
        payment.status === 'rejected' ||
        payment.status === 'cancelled'
      ) {
        // Only cancel if the order is still pending or confirmed
        if (
          currentOrder.status === 'PENDING' ||
          currentOrder.status === 'CONFIRMED'
        ) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'CANCELLED',
              paymentMethod:
                payment.payment_type_id === 'credit_card'
                  ? 'CREDIT_CARD'
                  : payment.payment_type_id === 'debit_card'
                    ? 'DEBIT_CARD'
                    : 'PIX',
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to MercadoPago to avoid retries
    return NextResponse.json(
      { error: 'Erro ao processar webhook', received: true },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Webhook endpoint active' });
}
