import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/authGuard';
import { encrypt } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        blingClientId: true,
        blingAccountId: true,
        blingTokenExpiry: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      accounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        blingAccountId: acc.blingAccountId,
        hasToken: !!acc.blingClientId,
        tokenExpiry: acc.blingTokenExpiry,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
        orderCount: acc._count.orders,
      }))
    );
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { name, clientId, clientSecret, accessToken, refreshToken } = await request.json();

    if (!name || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Nome, Client ID e Client Secret são obrigatórios' },
        { status: 400 }
      );
    }

    const encryptedClientId = encrypt(clientId);
    const encryptedClientSecret = encrypt(clientSecret);

    const webhookToken = crypto.randomUUID();

    const account = await prisma.account.create({
      data: {
        name,
        blingClientId: encryptedClientId,
        blingClientSecret: encryptedClientSecret,
        blingAccessToken: accessToken || null,
        blingRefreshToken: refreshToken || null,
        webhookToken,
      },
    });

    return NextResponse.json({
      id: account.id,
      name: account.name,
      webhookToken: account.webhookToken,
      message: 'Conta criada com sucesso. Configure o webhook no Bling.',
    });
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 400 }
    );
  }
}
