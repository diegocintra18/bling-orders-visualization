'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function BlingCallbackContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(`Erro: ${errorParam}`);
      return;
    }

    if (code && state) {
      router.push(`/accounts?success=oauth_complete&code=${code}&state=${state}`);
    } else {
      router.push('/accounts');
    }
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/accounts')}
            className="text-blue-600 hover:underline"
          >
            Voltar para contas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Processando callback...</p>
      </div>
    </div>
  );
}

export default function BlingCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BlingCallbackContent />
    </Suspense>
  );
}
