import { NextRequest, NextResponse } from 'next/server';
import { getBlingOAuthUrl } from '@/lib/bling';
import { getAuthUser } from '@/lib/authGuard';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID é obrigatório' }, { status: 400 });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });

    if (!account || !account.blingClientId || !account.blingClientSecret) {
      return NextResponse.json({ error: 'Conta não encontrada ou sem credenciais' }, { status: 400 });
    }

    const clientId = decrypt(account.blingClientId);
    const baseUrl = new URL(request.url).origin;
    const redirectUri = `${baseUrl}/api/auth/bling/callback?accountId=${accountId}`;

    const oauthUrl = getBlingOAuthUrl(clientId, redirectUri, 'bling-oauth');

    return NextResponse.json({ url: oauthUrl });
  } catch (error) {
    console.error('OAuth URL error:', error);
    return NextResponse.json({ error: 'Erro ao gerar URL de autorização' }, { status: 500 });
  }
}
