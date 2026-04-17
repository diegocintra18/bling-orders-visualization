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

    console.log('OAuth callback:', { hasCode: !!code, hasState: !!state, error });

    if (error) {
      return NextResponse.redirect(new URL(`/accounts?error=${error}`, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/accounts?error=missing_params', request.url));
    }

    const account = await prisma.account.findUnique({
      where: { oauthState: state }
    });

    if (!account) {
      console.error('No account found for state:', state);
      return NextResponse.redirect(new URL('/accounts?error=invalid_state', request.url));
    }

    if (!account.blingClientId || !account.blingClientSecret) {
      console.error('Account missing credentials');
      return NextResponse.redirect(new URL('/accounts?error=no_credentials_saved', request.url));
    }

    const clientId = decrypt(account.blingClientId);
    const clientSecret = decrypt(account.blingClientSecret);
    const baseUrl = new URL(request.headers.get('origin') || 'http://localhost:3000').origin;
    const redirectUri = `${baseUrl}/api/auth/bling/callback`;

    console.log('Exchanging code for tokens');
    const tokens = await getInitialTokens(clientId, clientSecret, code, redirectUri);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        blingAccessToken: tokens.access_token,
        blingRefreshToken: tokens.refresh_token,
        blingTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        oauthState: null
      },
    });

    console.log('OAuth completed successfully');
    return NextResponse.redirect(new URL('/accounts?success=oauth_complete', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/accounts?error=oauth_failed', request.url));
  }
}