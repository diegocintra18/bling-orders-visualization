import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

interface BlingWebhookPayload {
  id?: number;
  numero?: string;
  data?: string;
  status?: string;
  cliente?: {
    nome?: string;
    telefone?: string;
  };
  loja?: string;
  transportadora?: string;
  valorTotal?: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const signature = request.headers.get('x-bling-signature');
    if (signature && account.webhookToken) {
      const expectedSignature = crypto
        .createHmac('sha256', account.webhookToken)
        .update(JSON.stringify(await request.json()))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
      }
    }

    const payload: BlingWebhookPayload = await request.json();

    if (!payload.id) {
      return NextResponse.json({ error: 'ID do pedido não fornecido' }, { status: 400 });
    }

    const status = mapBlingStatus(payload.status || 'Faturado');

    const orderData: any = {
      numero: payload.numero || payload.id.toString(),
      status,
      loja: payload.loja || 'N/A',
      transportadora: payload.transportadora || 'N/A',
      valor: payload.valorTotal || 0,
      cliente: payload.cliente,
      dataCriacao: payload.data ? new Date(payload.data) : new Date(),
    };

    if (status === 'faturado') {
      orderData.dataFaturamento = new Date();
    } else if (status === 'verificado') {
      orderData.dataVerificacao = new Date();
    } else if (status === 'concluido') {
      orderData.dataConclusao = new Date();
    }

    const order = await prisma.order.upsert({
      where: {
        blingId_accountId: {
          blingId: payload.id.toString(),
          accountId: account.id,
        },
      },
      update: orderData,
      create: {
        accountId: account.id,
        blingId: payload.id.toString(),
        ...orderData,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

function mapBlingStatus(blingStatus: string): string {
  const statusMap: Record<string, string> = {
    'Faturado': 'faturado',
    'Verificado': 'verificado',
    'Concluído': 'concluido',
    'Cancelado': 'cancelado',
  };
  return statusMap[blingStatus] || 'faturado';
}
