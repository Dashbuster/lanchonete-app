import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { orderSchema } from '@/lib/zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = orderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { customerName, customerPhone, address, items, paymentMethod, changeFor } =
      validation.data;

    // Calculate subtotal from product prices
    let subtotal = 0;
    const orderItemsData: {
      productId: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Produto não encontrado: ${item.productId}` },
          { status: 404 }
        );
      }

      if (!product.available) {
        return NextResponse.json(
          { error: `Produto indisponível: ${product.name}` },
          { status: 400 }
        );
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(product.price),
      });
    }

    // Get delivery fee from settings
    const deliverySetting = await prisma.setting.findUnique({
      where: { key: 'delivery_fee' },
    });

    const deliveryFee = deliverySetting
      ? Number(deliverySetting.value)
      : 0;

    const total = subtotal + deliveryFee;

    // Create order and items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerName,
          customerPhone: customerPhone || null,
          address: address || null,
          paymentMethod,
          changeFor: changeFor || null,
          subtotal,
          deliveryFee,
          total,
          status: 'PENDING',
          items: {
            create: orderItemsData.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    );
  }
}
