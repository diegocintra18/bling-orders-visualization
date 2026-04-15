'use client';

import { User, Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pedido por número..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {user?.name || 'Usuário'}
          </span>
        </div>
      </div>
    </header>
  );
}