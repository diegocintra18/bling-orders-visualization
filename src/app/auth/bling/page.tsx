'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

function BlingAuthContent() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      router.push('/accounts?error=bling_auth_failed');
      return;
    }

    if (code) {
      window.location.href = `/callback/bling?code=${code}`;
    } else {
      const authUrl = api.getBlingAuthUrl();
      window.location.href = authUrl;
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Redirecionando para Bling...</p>
      </div>
    </div>
  );
}

export default function BlingAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BlingAuthContent />
    </Suspense>
  );
}