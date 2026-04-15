import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  try {
    const { searchParams } = request.nextUrl;
    const productId = searchParams.get('productId');

    const groups = await prisma.addonGroup.findMany({
      where: productId
        ? {
            productId,
          }
        : undefined,
      include: {
        addons: {
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const addons = groups.flatMap((group) => group.addons);

    return NextResponse.json({ groups, addons });
  } catch (error) {
    console.error('Error fetching addon groups:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar grupos de complementos' },
      { status: 500 }
    );
  }
}
