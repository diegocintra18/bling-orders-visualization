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

    const body = await request.json();
    const { name, clientId, clientSecret } = body;

    console.log('Creating account:', { name, hasClientId: !!clientId, hasClientSecret: !!clientSecret });

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
        webhookToken,
      },
    });

    console.log('Account created:', account.id);

    return NextResponse.json({
      id: account.id,
      name: account.name,
      webhookToken: account.webhookToken,
      message: 'Conta criada com sucesso.',
    });
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json({
      error: 'Erro ao criar conta: ' + (error as Error).message,
      details: error
    }, { status: 400 });
  }
}
