import { NextRequest, NextResponse } from 'next/server';
import { getBlingOAuthUrl } from '@/lib/bling';
import { getAuthUser } from '@/lib/authGuard';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { clientId, accountId, callbackUrl } = await request.json();

    if (!clientId || !accountId || !callbackUrl) {
      return NextResponse.json(
        { error: 'Client ID, Account ID e Callback URL são obrigatórios' },
        { status: 400 }
      );
    }

    const state = btoa(`${accountId}|${clientId}|${callbackUrl}`);
    const oauthUrl = getBlingOAuthUrl(clientId, callbackUrl, state);

    return NextResponse.json({ url: oauthUrl });
  } catch (error) {
    console.error('OAuth URL error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar URL de autorização' },
      { status: 500 }
    );
  }
}
