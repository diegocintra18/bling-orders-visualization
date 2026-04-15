import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/authGuard';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        dataCriacao: true,
        status: true,
      },
    });

    const dailyData: Record<string, { date: string; totalFaturados: number; totalConferidos: number }> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { date: dateKey, totalFaturados: 0, totalConferidos: 0 };
    }

    orders.forEach(order => {
      const dateKey = order.dataCriacao.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].totalFaturados++;
        if (order.status === 'verificado' || order.status === 'concluido') {
          dailyData[dateKey].totalConferidos++;
        }
      }
    });

    return NextResponse.json(Object.values(dailyData));
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
