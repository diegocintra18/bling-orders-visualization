import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/authGuard';
import { decrypt } from '@/lib/crypto';

const BLING_API_BASE = 'https://api.bling.com.br/api/v3';

interface BlingOrderResponse {
  id: number;
  numero: string;
  data: string;
  dataPrevista?: string;
  situacao: {
    id: number;
    tipo: string;
    cor: string;
    descricao: string;
  };
  cliente?: {
    id: number;
    nome: string;
    tipoPessoa: string;
    documento: string;
    telefone?: string;
    email?: string;
  };
  itens?: {
    item: {
      id: number;
      codigo?: string;
      descricao: string;
      quantidade: number;
      valorUnitario: number;
      desconto: number;
      complemento?: string;
    };
  }[];
  parcelas?: {
    parcela: {
      id: number;
      valor: number;
      dataVencimento: string;
      obs?: string;
    };
  }[];
  cidade?: string;
  estado?: string;
  loja?: string;
  naturezaOperacao?: string;
  tipoIntegracao?: string;
  numeroPedidoLoja?: string;
  transportadora?: string;
  valorFrete?: number;
  valorDesconto?: number;
  valorExtra?: number;
  totalVenda: number;
  totalProdutos: number;
  situacaoEnum: string;
}

interface BlingApiResponse {
  data: BlingOrderResponse | BlingOrderResponse[];
}

function mapBlingSituacaoToStatus(situacao: string): string {
  const statusMap: Record<string, string> = {
    'Em aberto': 'em_aberto',
    'Aguardando pagamento': 'em_aberto',
    'Pago': 'atendido',
    'Pago parcialmente': 'atendido',
    'Cancelado': 'cancelado',
    'Verificado': 'verificado',
    'Em separação': 'em_separacao',
    'Direcionamento': 'em_aberto',
    'Faturado': 'atendido',
    'Atendido': 'atendido',
    'Em运送': 'em_aberto',
  };
  return statusMap[situacao] || 'em_aberto';
}

async function fetchOrderFromBling(accessToken: string, orderId: number): Promise<BlingOrderResponse | null> {
  try {
    const response = await fetch(`${BLING_API_BASE}/pedidos/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'enable-jwt': '1',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Bling API error:', response.status);
      return null;
    }

    const data: BlingApiResponse = await response.json();
    
    if (data.data) {
      return Array.isArray(data.data) ? data.data[0] : data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching from Bling:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (!order.account.blingAccessToken) {
      return NextResponse.json({ error: 'Conta não autorizada no Bling' }, { status: 400 });
    }

    const blingOrder = await fetchOrderFromBling(order.account.blingAccessToken, parseInt(order.blingId));

    if (!blingOrder) {
      return NextResponse.json({ error: 'Pedido não encontrado no Bling' }, { status: 404 });
    }

    const status = mapBlingSituacaoToStatus(blingOrder.situacao?.descricao || '');
    const situacaoDescricao = blingOrder.situacao?.descricao || '';
    const situacaoId = blingOrder.situacao?.id;

    const updateData: Record<string, unknown> = {
      numero: blingOrder.numero,
      status,
      loja: blingOrder.loja || 'N/A',
      transportadora: blingOrder.transportadora || 'N/A',
      valor: blingOrder.totalVenda,
      cliente: blingOrder.cliente ? {
        nome: blingOrder.cliente.nome,
        telefone: blingOrder.cliente.telefone,
        email: blingOrder.cliente.email,
        documento: blingOrder.cliente.documento,
      } : null,
    };

    if (blingOrder.data) {
      updateData.dataCriacao = new Date(blingOrder.data);
    }

    if (situacaoDescricao === 'Pago' || situacaoDescricao === 'Faturado' || situacaoDescricao === 'Atendido') {
      updateData.dataFaturamento = new Date();
    }

    if (status === 'verificado') {
      updateData.dataVerificacao = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        numero: updatedOrder.numero,
        status: updatedOrder.status,
        situacaoBling: situacaoDescricao,
        situacaoIdBling: situacaoId,
      },
    });
  } catch (error) {
    console.error('Sync order error:', error);
    return NextResponse.json({ error: 'Erro ao sincronizar pedido' }, { status: 500 });
  }
}
