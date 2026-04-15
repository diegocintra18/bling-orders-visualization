import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/authGuard';
import { encrypt } from '@/lib/crypto';
import { createBlingClient } from '@/lib/bling';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      id: account.id,
      name: account.name,
      blingAccountId: account.blingAccountId,
      hasToken: !!account.blingClientId,
      tokenExpiry: account.blingTokenExpiry,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      orderCount: account._count.orders,
    });
  } catch (error) {
    console.error('Get account error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { name, clientId, clientSecret, accessToken, refreshToken } = await request.json();

    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    
    if (clientId && clientSecret) {
      updateData.blingClientId = encrypt(clientId);
      updateData.blingClientSecret = encrypt(clientSecret);
      
      if (accessToken || refreshToken) {
        const client = await createBlingClient(
          encrypt(clientId),
          encrypt(clientSecret),
          accessToken,
          refreshToken
        );
        updateData.blingAccessToken = accessToken;
        updateData.blingRefreshToken = refreshToken;
        updateData.blingTokenExpiry = client.getCredentials().tokenExpiry;
      }
    }

    const account = await prisma.account.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: account.id,
      name: account.name,
      message: 'Conta atualizada com sucesso',
    });
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.account.delete({ where: { id } });

    return NextResponse.json({ message: 'Conta deletada com sucesso' });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
