import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { secret, email, password, name } = await request.json();

    const setupSecret = process.env.SETUP_SECRET;
    if (!setupSecret || secret !== setupSecret) {
      return NextResponse.json({ error: 'Secret inválido' }, { status: 401 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Usuário já existe' }, { status: 200 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const setupSecret = process.env.SETUP_SECRET;
    if (!setupSecret) {
      return NextResponse.json({ error: 'SETUP_SECRET não configurado' }, { status: 500 });
    }

    const userCount = await prisma.user.count();

    return NextResponse.json({
      usersExist: userCount > 0,
      userCount,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao verificar usuários' }, { status: 500 });
  }
}
