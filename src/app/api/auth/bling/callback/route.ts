import { NextRequest, NextResponse } from 'next/server';
import { getInitialTokens } from '@/lib/bling';
import { decrypt } from '@/lib/crypto';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('OAuth callback received:', { hasCode: !!code, hasState: !!state, error });

    if (error) {
      return NextResponse.redirect(new URL(`/accounts?error=${error}`, request.url));
    }

    if (!code || !state) {
      console.error('Missing code or state:', { code, state });
      return NextResponse.redirect(new URL('/accounts?error=missing_params', request.url));
    }

    let decodedState: string;
    try {
      decodedState = atob(state);
    } catch (e) {
      console.error('Failed to decode state:', e);
      return NextResponse.redirect(new URL('/accounts?error=invalid_state', request.url));
    }

    const parts = decodedState.split('|');
    console.log('State parts count:', parts.length);

    if (parts.length < 1) {
      return NextResponse.redirect(new URL('/accounts?error=invalid_state', request.url));
    }

    const accountId = parts[0];
    console.log('Account ID from state:', accountId);

    if (!accountId) {
      return NextResponse.redirect(new URL('/accounts?error=no_account_id', request.url));
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      console.error('Account not found:', accountId);
      return NextResponse.redirect(new URL('/accounts?error=account_not_found', request.url));
    }

    console.log('Account found:', { id: account.id, hasClientId: !!account.blingClientId });

    if (!account.blingClientId || !account.blingClientSecret) {
      console.error('Account missing credentials');
      return NextResponse.redirect(new URL('/accounts?error=no_credentials_saved', request.url));
    }

    const clientId = decrypt(account.blingClientId);
    const clientSecret = decrypt(account.blingClientSecret);
    const redirectUri = `${request.nextUrl.origin}/api/auth/bling/callback`;

    console.log('Exchanging code for tokens...');
    const tokens = await getInitialTokens(clientId, clientSecret, code, redirectUri);

    await prisma.account.update({
      where: { id: accountId },
      data: {
        blingAccessToken: tokens.access_token,
        blingRefreshToken: tokens.refresh_token,
        blingTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    console.log('OAuth completed successfully');
    return NextResponse.redirect(new URL('/accounts?success=oauth_complete', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/accounts?error=oauth_failed', request.url));
  }
}