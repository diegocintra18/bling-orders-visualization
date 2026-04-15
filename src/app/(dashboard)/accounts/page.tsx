'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Edit2, Trash2, RefreshCw, Link2, CheckCircle, XCircle } from 'lucide-react';
import type { BlingAccount } from '@/types';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<BlingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BlingAccount | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    clientId: '',
    clientSecret: '',
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/bling/callback` : ''
  });
  const [oauthStep, setOauthStep] = useState<'credentials' | 'authorize'>('credentials');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    
    if (error) {
      alert(`Erro na autorização: ${error}`);
      window.history.replaceState({}, '', '/accounts');
    } else if (success === 'oauth_complete') {
      alert('Conta autorizada com sucesso!');
      window.history.replaceState({}, '', '/accounts');
      fetchAccounts();
    }
  }, []);

  const handleOpenModal = (account?: BlingAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({ 
        name: account.name, 
        clientId: '',
        clientSecret: '',
        redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/bling/callback` : ''
      });
      setOauthStep('credentials');
    } else {
      setEditingAccount(null);
      setFormData({ 
        name: '', 
        clientId: '',
        clientSecret: '',
        redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/bling/callback` : ''
      });
      setOauthStep('credentials');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setFormData({ name: '', clientId: '', clientSecret: '', redirectUri: '' });
    setOauthStep('credentials');
  };

  const handleAuthorize = async () => {
    if (!formData.clientId || !formData.clientSecret) {
      alert('Client ID e Client Secret são obrigatórios');
      return;
    }

    setIsAuthorizing(true);
    try {
      const response = await fetch('/api/auth/bling/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formData.clientId,
          accountId: editingAccount?.id,
          callbackUrl: formData.redirectUri
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao gerar URL de autorização');
      }
    } catch (error) {
      console.error('Error authorizing:', error);
      alert('Erro ao autorizar conta');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAccount) {
      if (!formData.name || !formData.clientId || !formData.clientSecret) {
        alert('Todos os campos são obrigatórios');
        return;
      }

      try {
        await api.createAccount(formData.name, formData.clientId, formData.clientSecret);
        handleCloseModal();
        fetchAccounts();
      } catch (error) {
        console.error('Error creating account:', error);
        alert('Erro ao criar conta');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await api.deleteAccount(id);
        fetchAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const handleSync = async (id: string) => {
    try {
      const result = await api.syncOrders(id);
      alert(`Sincronização concluída: ${result.created || 0} novos, ${result.synced || 0} atualizados`);
      fetchAccounts();
    } catch (error) {
      console.error('Error syncing account:', error);
      alert('Erro ao sincronizar conta.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Contas Bling
        </h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Conta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {accounts.length} conta(s) conectada(s)
          </h2>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pedidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Ações
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
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma conta conectada. Clique em "Adicionar Conta" para começar.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {account.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {account.hasToken ? (
                        <span className="inline-flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Autorizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-yellow-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {account.orderCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {account.createdAt ? new Date(account.createdAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSync(account.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        {!account.hasToken && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(account)}
                            title="Autorizar conta"
                          >
                            <Link2 className="w-4 h-4 text-blue-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingAccount ? 'Autorizar Conta' : 'Adicionar Conta'}
              </h2>
            </CardHeader>
            <CardContent>
              {oauthStep === 'credentials' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Nome"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Minha Conta Bling"
                    required
                  />
                  <Input
                    label="Client ID"
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData({ ...formData, clientId: e.target.value })
                    }
                    placeholder="Seu Client ID do Bling"
                    required
                  />
                  <Input
                    label="Client Secret"
                    type="password"
                    value={formData.clientSecret}
                    onChange={(e) =>
                      setFormData({ ...formData, clientSecret: e.target.value })
                    }
                    placeholder="Seu Client Secret do Bling"
                    required
                  />
                  <Input
                    label="Redirect URI"
                    value={formData.redirectUri}
                    onChange={(e) =>
                      setFormData({ ...formData, redirectUri: e.target.value })
                    }
                    placeholder="https://seu-app.com/callback"
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCloseModal}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingAccount ? 'Salvar' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Clique no botão abaixo para autorizar sua conta Bling.
                  </p>
                  <Button
                    onClick={handleAuthorize}
                    disabled={isAuthorizing}
                    className="w-full"
                  >
                    {isAuthorizing ? 'Redirecionando...' : 'Autorizar no Bling'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
