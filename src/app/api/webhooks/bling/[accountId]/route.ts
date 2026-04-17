import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { decrypt } from '@/lib/crypto';

interface BlingOrderPayload {
  desconto: string;
  observacoes: string;
  observacaointerna: string;
  data: string;
  numero: string;
  numeroOrdemCompra: string;
  vendedor: string;
  valorfrete: string;
  outrasdespesas: string;
  totalprodutos: string;
  totalvenda: string;
  situacao: string;
  dataSaida: string;
  loja: string;
  numeroPedidoLoja: string;
  tipoIntegracao: string;
  dataPrevista: string;
  cliente: {
    id: string;
    nome: string;
    cnpj: string;
    ie: string | null;
    rg: string;
    endereco: string;
    numero: string;
    complemento: string;
    cidade: string;
    bairro: string;
    cep: string;
    uf: string;
    email: string;
    celular: string;
    fone: string;
  };
  nota: {
    serie: string;
    numero: string;
    dataEmissao: string;
    situacao: string;
    valorNota: string;
    chaveAcesso: string | null;
  };
  transporte: {
    tipo_frete: string;
    qtde_volumes: string;
    peso_bruto: string;
    enderecoEntrega: {
      nome: string;
      endereco: string;
      numero: string;
      complemento: string;
      cidade: string;
      bairro: string;
      cep: string;
      uf: string;
    };
    volumes: {
      volume: {
        id: string;
        servico: string;
        codigoServico: string;
        codigoRastreamento: string;
        urlRastreamento: string;
      };
    }[];
    servico_correios: string;
  };
  itens: {
    item: {
      codigo: string;
      descricao: string;
      quantidade: string;
      valorunidade: string;
      un: string;
    };
  }[];
  parcelas: {
    parcela: {
      valor: string;
      dataVencimento: string;
      forma_pagamento: {
        descricao: string;
      };
    };
  }[];
}

interface BlingWebhookRequest {
  retorno: {
    pedidos: {
      pedido: BlingOrderPayload;
    }[];
  };
}

function mapBlingStatus(blingStatus: string): string {
  const statusMap: Record<string, string> = {
    'Em aberto': 'em_aberto',
    'Aguardando pagamento': 'em_aberto',
    'Pago': 'atendido',
    'Pago parcialmente': 'atendido',
    'Atendido': 'atendido',
    'Faturado': 'atendido',
    'Verificado': 'verificado',
    'Em separação': 'em_separacao',
    'Concluído': 'concluido',
    'Cancelado': 'cancelado',
  };
  return statusMap[blingStatus] || 'em_aberto';
}

function parseValue(value: string | undefined): number {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
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

    let payload: BlingWebhookRequest;

    if (rawBody.startsWith('data=')) {
      const jsonStr = decodeURIComponent(rawBody.replace('data=', ''));
      payload = JSON.parse(jsonStr);
    } else {
      payload = JSON.parse(rawBody);
    }

    if (!payload.retorno?.pedidos?.length) {
      return NextResponse.json({ error: 'Nenhum pedido fornecido' }, { status: 400 });
    }

    const results = [];

    for (const pedidoWrapper of payload.retorno.pedidos) {
      const orderData = pedidoWrapper.pedido;

      if (!orderData.numero && !orderData.loja) {
        continue;
      }

      const status = mapBlingStatus(orderData.situacao || '');

      const orderPayload: Record<string, unknown> = {
        numero: orderData.numero || orderData.numeroPedidoLoja || 'N/A',
        status,
        loja: orderData.loja || 'N/A',
        transportadora: orderData.transporte?.servico_correios || orderData.transporte?.volumes?.[0]?.volume?.servico || 'N/A',
        valor: parseValue(orderData.totalvenda),
        cliente: {
          nome: orderData.cliente?.nome,
          telefone: orderData.cliente?.fone || orderData.cliente?.celular,
          email: orderData.cliente?.email,
          documento: orderData.cliente?.cnpj || orderData.cliente?.rg,
          endereco: orderData.cliente?.endereco,
          numero: orderData.cliente?.numero,
          complemento: orderData.cliente?.complemento,
          cidade: orderData.cliente?.cidade,
          bairro: orderData.cliente?.bairro,
          cep: orderData.cliente?.cep,
          uf: orderData.cliente?.uf,
        },
        dataCriacao: orderData.data ? new Date(orderData.data) : new Date(),
      };

      if (orderData.nota?.numero) {
        orderPayload.notaFiscal = {
          serie: orderData.nota.serie,
          numero: orderData.nota.numero,
          dataEmissao: orderData.nota.dataEmissao,
          situacao: orderData.nota.situacao,
          valor: parseValue(orderData.nota.valorNota),
          chaveAcesso: orderData.nota.chaveAcesso,
        };
      }

      if (orderData.transporte?.volumes?.length) {
        orderPayload.rastreamento = orderData.transporte.volumes.map(v => ({
          codigo: v.volume.codigoRastreamento,
          url: v.volume.urlRastreamento,
          servico: v.volume.servico,
        }));
      }

      if (status === 'atendido' && !orderPayload.dataFaturamento) {
        orderPayload.dataFaturamento = new Date();
      } else if (status === 'verificado') {
        orderPayload.dataVerificacao = new Date();
      }

      const blingId = orderData.numero || orderData.numeroPedidoLoja || orderData.loja;

      const order = await prisma.order.upsert({
        where: {
          blingId_accountId: {
            blingId: blingId,
            accountId: account.id,
          },
        },
        update: orderPayload,
        create: {
          accountId: account.id,
          blingId: blingId,
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

      results.push({
        orderId: order.id,
        numero: order.numero,
        status: order.status,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      orders: results,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}