import { NextRequest, NextResponse } from 'next/server';
import { getBlingOAuthUrl } from '@/lib/bling';
import { getAuthUser } from '@/lib/authGuard';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { accountId, callbackUrl } = await request.json();

    if (!accountId || !callbackUrl) {
      return NextResponse.json(
        { error: 'Account ID e Callback URL são obrigatórios' },
        { status: 400 }
      );
    }

    const state = btoa(encodeURIComponent(accountId));
    const oauthUrl = getBlingOAuthUrl('', callbackUrl, state);

    return NextResponse.json({ url: oauthUrl, state: accountId });
  } catch (error) {
    console.error('OAuth URL error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar URL de autorização' },
      { status: 500 }
    );
  }
}
