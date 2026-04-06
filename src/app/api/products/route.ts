import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const availableParam = searchParams.get('available');

    const where: Record<string, unknown> = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (availableParam !== null) {
      where.available = availableParam === 'true';
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    // Fetch addons for all products through addon-groups
    const productIds = products.map((p) => p.id);
    let addonsByProduct: Record<string, unknown[]> = {};

    if (productIds.length > 0) {
      const groups = await prisma.addonGroup.findMany({
        where: {
          productId: { in: productIds },
        },
        include: { addons: true },
      });

      // Group addons by product id (via addon groups)
      addonsByProduct = groups.reduce(
        (acc, group) => {
          const pid = group.productId;
          if (pid) {
            if (!acc[pid]) acc[pid] = [];
            acc[pid].push(...group.addons);
          }
          return acc;
        },
        {} as Record<string, unknown[]>
      );
    }

    const productsWithAddons = products.map((product) => ({
      ...product,
      addons: addonsByProduct[product.id] || [],
    }));

    return NextResponse.json(productsWithAddons);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, description, price, category, available, prepTime } =
      validation.data;

    const categoryExists = await prisma.category.findUnique({
      where: { id: category },
    });

    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price,
        image: null,
        categoryId: category,
        available: available !== false,
        prepTime: prepTime ?? 0,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
  }
}
