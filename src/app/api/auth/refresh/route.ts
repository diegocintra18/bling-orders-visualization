import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateTokens } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token não encontrado' },
        { status: 401 }
      );
    }

    const payload = verifyRefreshToken(refreshToken);

    const tokens = generateTokens({
      userId: payload.userId,
      email: payload.email,
    });

    const response = NextResponse.json({
      access: tokens.access,
      refresh: tokens.refresh,
    });

    response.cookies.set('access_token', tokens.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    });

    response.cookies.set('refresh_token', tokens.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    );
  }
}
