import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/authGuard';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalToday, verifiedToday, delayedCount, totalOrders] = await Promise.all([
      prisma.order.count({
        where: {
          dataCriacao: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.order.count({
        where: {
          dataVerificacao: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.order.count({
        where: {
          status: 'faturado',
          dataFaturamento: {
            lte: twentyFourHoursAgo,
          },
        },
      }),
      prisma.order.count(),
    ]);

    const verifiedTotal = await prisma.order.count({
      where: {
        status: { in: ['verificado', 'concluido'] },
      },
    });

    const completionRate = totalOrders > 0 
      ? Math.round((verifiedTotal / totalOrders) * 100) 
      : 0;

    return NextResponse.json({
      totalToday,
      verifiedToday,
      delayedCount,
      completionRate,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
