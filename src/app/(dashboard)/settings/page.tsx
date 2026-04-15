'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsPage() {
  const [messageTemplate, setMessageTemplate] = useState(
    'Olá! Seu pedido #{numero} foi conferido com sucesso. Em breve receberá o código de rastreamento.'
  );
  const [webhookUrl, setWebhookUrl] = useState('');

  const saveTemplate = () => {
    localStorage.setItem('whatsapp_template', messageTemplate);
    alert('Template salvo com sucesso!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Configurações
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              WhatsApp (Em breve)
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-500 dark:text-slate-400">
              A integração com WhatsApp estará disponível em breve. 
              Por enquanto, você pode configurar o template de mensagem.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Template de Mensagem
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Variáveis disponíveis: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{numero}'}</code>
            </p>
            <textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <div className="flex justify-end">
              <Button onClick={saveTemplate}>Salvar Template</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Webhook Bling
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure a URL do webhook no painel do Bling para receber atualizações automáticas:
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium">URL do Webhook:</p>
            <code className="block p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/api/webhooks/bling/{account_id}`
                : '/api/webhooks/bling/{account_id}'}
            </code>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Como configurar:</strong><br/>
              1. Acesse o painel do Bling<br/>
              2. Vá em Configurações &rarr; Integrações &rarr; Webhooks<br/>
              3. Adicione a URL acima substituindo <code>{'{account_id}'}</code> pelo ID da conta
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            URLs de API
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Autenticação:</p>
              <code className="block p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono mt-1">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/login
              </code>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Pedidos:</p>
              <code className="block p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono mt-1">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api/orders
              </code>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Contas:</p>
              <code className="block p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono mt-1">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api/accounts
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
