import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$connect();
    
    const databases = await prisma.$runCommandRaw({
      listDatabases: 1
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Conexão com MongoDB estabelecida com sucesso',
      databases: (databases as any).databases?.map((d: any) => d.name) || []
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao conectar com MongoDB',
      error: error.message || 'Erro desconhecido',
      code: error.code,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'não definido'
      }
    }, { status: 500 });
  }
}
