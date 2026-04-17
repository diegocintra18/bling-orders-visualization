import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$connect();

    const userCount = await prisma.user.count();

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Conexão com PostgreSQL estabelecida com sucesso',
      userCount,
      database: 'bling-orders'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao conectar com PostgreSQL',
      error: error.message || 'Erro desconhecido',
      code: error.code,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) || 'não definido'
      }
    }, { status: 500 });
  }
}
