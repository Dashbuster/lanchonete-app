import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const addonsWhere: Record<string, unknown> = {};
    if (productId) {
      addonsWhere.productId = productId;
    }

    const addons = await prisma.addon.findMany({
      where: addonsWhere,
      orderBy: { name: 'asc' },
    });

    const groups = await prisma.addonGroup.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ groups, addons });
  } catch (error) {
    console.error('Error fetching addon groups:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar grupos de complementos' },
      { status: 500 }
    );
  }
}
