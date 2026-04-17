import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { decrypt } from '@/lib/crypto';

interface BlingWebhookPayload {
  eventId: string;
  date: string;
  version: string;
  event: string;
  companyId: number;
  data: {
    id: number;
    numero?: string;
    data?: string;
    situacao?: {
      id?: number;
      descricao?: string;
    };
    cliente?: {
      nome?: string;
      telefone?: string;
    };
    loja?: string;
    transportadora?: string;
    valorTotal?: number;
  };
}

function verifySignature(payload: string, signature: string, clientSecret: string): boolean {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', clientSecret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

function mapBlingStatus(blingStatus: string): string {
  const statusMap: Record<string, string> = {
    'Faturado': 'faturado',
    'Verificado': 'verificado',
    'Concluído': 'concluido',
    'Cancelado': 'cancelado',
    'Aguardando Liberação': 'pendente',
    'Aguardando Pagamento': 'pendente',
  };
  return statusMap[blingStatus] || 'faturado';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const rawBody = await request.text();

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const signature = request.headers.get('x-bling-signature-256');
    
    if (signature && account.blingClientSecret) {
      try {
        const clientSecret = decrypt(account.blingClientSecret);
        const isValid = verifySignature(rawBody, signature, clientSecret);
        
        if (!isValid) {
          console.log('Invalid signature');
        }
      } catch (e) {
        console.error('Error verifying signature:', e);
      }
    }

    const payload: BlingWebhookPayload = JSON.parse(rawBody);

    if (!payload.data?.id) {
      return NextResponse.json({ error: 'ID do pedido não fornecido' }, { status: 400 });
    }

    const event = payload.event || '';
    const orderData = payload.data;

    let status = 'faturado';
    if (event.includes('updated') || event.includes('Atualizado')) {
      status = 'verificado';
    }

    const orderPayload: Record<string, unknown> = {
      numero: orderData.numero || orderData.id.toString(),
      status: mapBlingStatus(orderData.situacao?.descricao || ''),
      loja: orderData.loja || 'N/A',
      transportadora: orderData.transportadora || 'N/A',
      valor: orderData.valorTotal || 0,
      cliente: orderData.cliente,
      dataCriacao: orderData.data ? new Date(orderData.data) : new Date(),
    };

    if (status === 'faturado') {
      orderPayload.dataFaturamento = new Date();
    } else if (status === 'verificado') {
      orderPayload.dataVerificacao = new Date();
    }

    const order = await prisma.order.upsert({
      where: {
        blingId_accountId: {
          blingId: orderData.id.toString(),
          accountId: account.id,
        },
      },
      update: orderPayload,
      create: {
        accountId: account.id,
        blingId: orderData.id.toString(),
        numero: orderPayload.numero as string,
        status: orderPayload.status as string,
        loja: orderPayload.loja as string,
        transportadora: orderPayload.transportadora as string,
        valor: orderPayload.valor as number,
        cliente: orderPayload.cliente as Prisma.InputJsonValue,
        dataCriacao: orderPayload.dataCriacao as Date,
        dataFaturamento: orderPayload.dataFaturamento as Date | undefined,
        dataVerificacao: orderPayload.dataVerificacao as Date | undefined,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
      eventId: payload.eventId,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
