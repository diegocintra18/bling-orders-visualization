'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/types';

export default function DelayedOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDelayedOrders = async () => {
      setIsLoading(true);
      try {
        const data = await api.getDelayedOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching delayed orders:', error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDelayedOrders();
  }, []);

  const calculateDelay = (dataFaturamento?: string) => {
    if (!dataFaturamento) return '-';
    const fatDate = new Date(dataFaturamento);
    const now = new Date();
    const diffMs = now.getTime() - fatDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    return `${diffHours}h`;
  };

  const handleMarkAsPicked = async (orderId: string) => {
    try {
      await api.markOrderAsPicked(orderId);
      setOrders(orders.filter((o) => o.id !== orderId));
    } catch (error) {
      console.error('Error marking order as picked:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Pedidos Atrasados
        </h1>
        <span className="text-sm text-slate-500">
          Mais de 24h após faturamento sem verificação
        </span>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {orders.length} pedido(s) atrasado(s)
          </h2>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Loja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Transportadora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Atraso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhum pedido atrasado
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {order.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="pending">
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || '-'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {order.loja || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {order.transportadora || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-red-600 font-medium">
                        {calculateDelay(order.dataFaturamento)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsPicked(order.id)}
                      >
                        Marcar como separado
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
