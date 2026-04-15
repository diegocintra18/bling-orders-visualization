'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import type { DailyReport, ReportByStore, ReportByTransportadora } from '@/types';

export default function ReportsPage() {
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [reportsByStore, setReportsByStore] = useState<ReportByStore[]>([]);
  const [reportsByTransportadora, setReportsByTransportadora] = useState<ReportByTransportadora[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'store' | 'transportadora'>('daily');

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const [daily, byStore, byTransportadora] = await Promise.all([
          api.getDailyReports(),
          api.getReportsByStore(),
          api.getReportsByTransportadora(),
        ]);
        setDailyReports(daily);
        setReportsByStore(byStore);
        setReportsByTransportadora(byTransportadora);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const calculatePercentage = (conferidos: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.round((conferidos / total) * 100)}%`;
  };

  const getTotalConferidos = () => dailyReports.reduce((sum, r) => sum + r.totalConferidos, 0);
  const getTotalFaturados = () => dailyReports.reduce((sum, r) => sum + r.totalFaturados, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Relatórios
      </h1>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'daily'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Diário
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'store'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Por Loja
        </button>
        <button
          onClick={() => setActiveTab('transportadora')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'transportadora'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Por Transportadora
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : activeTab === 'daily' ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Pedidos Conferidos por Dia
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Faturados</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                  {getTotalFaturados()}
                </p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Total Conferidos</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                  {getTotalConferidos()}
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-purple-600 dark:text-purple-400">Taxa de Conferência</p>
                <p className="text-2xl.font-bold text-purple-900 dark:text-purple-200">
                  {calculatePercentage(getTotalConferidos(), getTotalFaturados())}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Faturados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Conferidos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Taxa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {dailyReports.map((report) => (
                    <tr key={report.date} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {new Date(report.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {report.totalFaturados}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {report.totalConferidos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                        {calculatePercentage(report.totalConferidos, report.totalFaturados)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : activeTab === 'store' ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Faturados x Conferidos por Loja
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Loja
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Faturados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Conferidos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Taxa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {reportsByStore.map((report) => (
                    <tr key={report.store} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {report.store}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {report.totalFaturados}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {report.totalConferidos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                        {calculatePercentage(report.totalConferidos, report.totalFaturados)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Faturados x Conferidos por Transportadora
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Transportadora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Faturados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Conferidos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Taxa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {reportsByTransportadora.map((report) => (
                    <tr key={report.transportadora} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {report.transportadora}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {report.totalFaturados}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {report.totalConferidos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                        {calculatePercentage(report.totalConferidos, report.totalFaturados)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}