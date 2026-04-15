'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';
import type { Order, OrderFilters, BlingAccount } from '@/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<BlingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, accountsData] = await Promise.all([
        api.getOrders(filters),
        api.getAccounts(),
      ]);
      setOrders(ordersData.orders || []);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    setFilters({ ...filters, search });
    fetchData();
  };

  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    fetchData();
  };

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

  const calculateDelay = (dataFaturamento?: string) => {
    if (!dataFaturamento) return '-';
    const fatDate = new Date(dataFaturamento);
    const now = new Date();
    const diffMs = now.getTime() - fatDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return '-';
  };

  const isDelayed = (dataFaturamento?: string) => {
    if (!dataFaturamento) return false;
    const fatDate = new Date(dataFaturamento);
    const now = new Date();
    const diffMs = now.getTime() - fatDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 24;
  };

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'faturado', label: 'Faturado' },
    { value: 'verificado', label: 'Verificado' },
    { value: 'concluido', label: 'Concluído' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Pedidos
        </h1>
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Buscar pedido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Select
              label="Conta"
              options={[
                { value: '', label: 'Todas as contas' },
                ...accounts.map((a) => ({ value: a.id, label: a.name })),
              ]}
              value={filters.accountId || ''}
              onChange={(e) => handleFilterChange('accountId', e.target.value)}
            />
            <Select
              label="Status"
              options={statusOptions}
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            />
            <Input
              type="date"
              label="Data inicio"
              value={filters.dataInicio || ''}
              onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
            />
            <Input
              type="date"
              label="Data fim"
              value={filters.dataFim || ''}
              onChange={(e) => handleFilterChange('dataFim', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhum pedido encontrado
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.status === 'faturado' ? (
                        <span
                          className={`text-sm font-medium ${
                            isDelayed(order.dataFaturamento)
                              ? 'text-red-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {calculateDelay(order.dataFaturamento)}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
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
