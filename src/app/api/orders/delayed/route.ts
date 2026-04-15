import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/authGuard';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        status: 'faturado',
        dataFaturamento: {
          lte: twentyFourHoursAgo,
        },
      },
      orderBy: { dataFaturamento: 'asc' },
      include: {
        account: { select: { name: true } },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Get delayed orders error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
