import { NextRequest, NextResponse } from 'next/server';
import { getInitialTokens } from '@/lib/bling';
import { encrypt } from '@/lib/crypto';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/accounts?error=${error}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/accounts?error=no_code', request.url));
    }

    const [accountId, clientId, clientSecret, redirectUri] = atob(state).split('|');

    if (!accountId || !clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(new URL('/accounts?error=invalid_state', request.url));
    }

    const tokens = await getInitialTokens(clientId, clientSecret, code, redirectUri);

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.redirect(new URL('/accounts?error=account_not_found', request.url));
    }

    await prisma.account.update({
      where: { id: accountId },
      data: {
        blingClientId: encrypt(clientId),
        blingClientSecret: encrypt(clientSecret),
        blingAccessToken: tokens.access_token,
        blingRefreshToken: tokens.refresh_token,
        blingTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return NextResponse.redirect(new URL('/accounts?success=oauth_complete', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/accounts?error=oauth_failed', request.url));
  }
}
