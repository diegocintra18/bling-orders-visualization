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
    const accountId = searchParams.get('account');
    const status = searchParams.get('status');
    const store = searchParams.get('store');
    const transportadora = searchParams.get('transportadora');
    const search = searchParams.get('search');
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (accountId) where.accountId = accountId;
    if (status) where.status = status;
    if (store) where.loja = store;
    if (transportadora) where.transportadora = transportadora;
    if (search) where.numero = { contains: search, mode: 'insensitive' };

    if (dataInicio || dataFim) {
      where.dataCriacao = {};
      if (dataInicio) where.dataCriacao.gte = new Date(dataInicio);
      if (dataFim) where.dataCriacao.lte = new Date(dataFim);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { dataCriacao: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
