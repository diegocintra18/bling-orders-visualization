import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/authGuard';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!['faturado', 'verificado', 'concluido'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const updateData: any = { status };

    if (status === 'verificado') {
      updateData.dataVerificacao = new Date();
    } else if (status === 'concluido') {
      updateData.dataConclusao = new Date();
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
