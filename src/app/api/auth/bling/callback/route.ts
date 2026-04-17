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

    console.log('OAuth callback:', { code: !!code, state: state?.substring(0, 50), error });

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL(`/accounts?error=${error}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/accounts?error=no_code', request.url));
    }

    if (!state) {
      return NextResponse.redirect(new URL('/accounts?error=no_state', request.url));
    }

    let decodedState: string;
    try {
      decodedState = atob(state);
    } catch (e) {
      console.error('Failed to decode state:', e);
      return NextResponse.redirect(new URL('/accounts?error=invalid_state_format', request.url));
    }

    const parts = decodedState.split('|');
    console.log('State parts:', parts.length);

    if (parts.length < 4) {
      console.error('Invalid state format, parts:', parts.length);
      return NextResponse.redirect(new URL('/accounts?error=invalid_state', request.url));
    }

    const [accountId, clientId, clientSecret, redirectUri] = parts;

    if (!accountId) {
      return NextResponse.redirect(new URL('/accounts?error=no_account_id', request.url));
    }

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/accounts?error=no_credentials', request.url));
    }

    const tokens = await getInitialTokens(clientId, clientSecret, code, redirectUri);

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      console.error('Account not found:', accountId);
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

    console.log('OAuth completed for account:', accountId);
    return NextResponse.redirect(new URL('/accounts?success=oauth_complete', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/accounts?error=oauth_failed', request.url));
  }
}