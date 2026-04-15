import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/authGuard';
import { createBlingClient } from '@/lib/bling';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'AccountId é obrigatório' }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const client = await createBlingClient(
      account.blingClientId,
      account.blingClientSecret,
      account.blingAccessToken || undefined,
      account.blingRefreshToken || undefined,
      account.blingTokenExpiry || undefined
    );

    const credentials = client.getCredentials();

    if (credentials.accessToken !== account.blingAccessToken || 
        credentials.refreshToken !== account.blingRefreshToken) {
      await prisma.account.update({
        where: { id: accountId },
        data: {
          blingAccessToken: credentials.accessToken,
          blingRefreshToken: credentials.refreshToken,
          blingTokenExpiry: credentials.tokenExpiry,
        },
      });
    }

    const blingOrders = await client.getOrders();

    let synced = 0;
    let created = 0;

    for (const blingOrder of blingOrders) {
      const existing = await prisma.order.findFirst({
        where: {
          blingId: blingOrder.id.toString(),
          accountId: account.id,
        },
      });

      if (existing) {
        await prisma.order.update({
          where: { id: existing.id },
          data: {
            numero: blingOrder.numero,
            status: mapBlingStatus(blingOrder.status),
            loja: blingOrder.loja || 'N/A',
            transportadora: blingOrder.transportadora || 'N/A',
            valor: blingOrder.valorTotal || 0,
            cliente: blingOrder.cliente,
            dataCriacao: new Date(blingOrder.data),
            dataFaturamento: blingOrder.status === 'faturado' ? new Date(blingOrder.data) : undefined,
          },
        });
        synced++;
      } else {
        await prisma.order.create({
          data: {
            accountId: account.id,
            numero: blingOrder.numero,
            blingId: blingOrder.id.toString(),
            status: mapBlingStatus(blingOrder.status),
            loja: blingOrder.loja || 'N/A',
            transportadora: blingOrder.transportadora || 'N/A',
            valor: blingOrder.valorTotal || 0,
            cliente: blingOrder.cliente,
            dataCriacao: new Date(blingOrder.data),
            dataFaturamento: blingOrder.status === 'faturado' ? new Date(blingOrder.data) : undefined,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      message: 'Sincronização concluída',
      synced,
      created,
      total: blingOrders.length,
    });
  } catch (error) {
    console.error('Sync orders error:', error);
    return NextResponse.json({ error: 'Erro na sincronização' }, { status: 500 });
  }
}

function mapBlingStatus(blingStatus: string): string {
  const statusMap: Record<string, string> = {
    'Faturado': 'faturado',
    'Verificado': 'verificado',
    'Concluido': 'concluido',
    'Cancelado': 'cancelado',
  };
  return statusMap[blingStatus] || 'faturado';
}
