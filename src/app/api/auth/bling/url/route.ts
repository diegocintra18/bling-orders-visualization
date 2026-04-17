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

    const callbackWithAccount = `${callbackUrl}?accountId=${accountId}`;
    const state = 'bling-oauth';
    const oauthUrl = getBlingOAuthUrl('', callbackWithAccount, state);

    return NextResponse.json({ url: oauthUrl });
  } catch (error) {
    console.error('OAuth URL error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar URL de autorização' },
      { status: 500 }
    );
  }
}
