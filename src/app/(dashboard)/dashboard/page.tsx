'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Percent,
} from 'lucide-react';
import type { OrderStats, Order } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, ordersData] = await Promise.all([
          api.getOrderStats(),
          api.getOrders(),
        ]);
        setStats(statsData);
        const orders = ordersData.orders || ordersData || [];
        setRecentOrders(Array.isArray(orders) ? orders.slice(0, 10) : []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'faturado':
        return 'pending';
      case 'verificado':
        return 'verified';
      case 'concluido':
        return 'completed';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d atrás`;
    if (diffHours > 0) return `${diffHours}h atrás`;
    return 'Recente';
  };

  const statCards = [
    {
      title: 'Pedidos Hoje',
      value: stats?.totalToday || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Conferidos Hoje',
      value: stats?.verifiedToday || 0,
      icon: CheckCircle,
      color: 'bg-emerald-500',
    },
    {
      title: 'Pedidos Atrasados',
      value: stats?.delayedCount || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Taxa de Conferência',
      value: `${stats?.completionRate || 0}%`,
      icon: Percent,
      color: 'bg-purple-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="flex items-center">
              <div className={`${card.color} p-3 rounded-lg mr-4`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Pedidos Recentes
          </h2>
        </CardHeader>
        {recentOrders.length === 0 ? (
          <CardContent>
            <p className="text-center text-slate-500 py-8">
              Nenhum pedido encontrado
            </p>
          </CardContent>
        ) : (
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
                    Tempo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {order.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(order.status) as any}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || '-'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {order.loja || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {order.transportadora || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatTimeAgo(order.dataCriacao)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
