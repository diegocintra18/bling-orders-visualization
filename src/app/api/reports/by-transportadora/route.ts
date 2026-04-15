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
        transportadora: true,
        status: true,
      },
    });

    const transportadoraData: Record<string, { transportadora: string; totalFaturados: number; totalConferidos: number }> = {};

    orders.forEach(order => {
      if (!transportadoraData[order.transportadora]) {
        transportadoraData[order.transportadora] = { 
          transportadora: order.transportadora, 
          totalFaturados: 0, 
          totalConferidos: 0 
        };
      }
      transportadoraData[order.transportadora].totalFaturados++;
      if (order.status === 'verificado' || order.status === 'concluido') {
        transportadoraData[order.transportadora].totalConferidos++;
      }
    });

    return NextResponse.json(Object.values(transportadoraData));
  } catch (error) {
    console.error('By transportadora report error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
