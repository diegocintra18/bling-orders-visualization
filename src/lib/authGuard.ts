import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, TokenPayload } from './auth';
import prisma from './prisma';

export async function getAuthUser(request: NextRequest): Promise<TokenPayload | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  return null;
}

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { role: true },
  });

  if (dbUser?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    );
  }

  return null;
}
