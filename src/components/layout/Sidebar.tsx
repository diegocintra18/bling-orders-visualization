'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  Settings,
  Store,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
  { name: 'Atrasados', href: '/orders/delayed', icon: AlertTriangle },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Contas', href: '/accounts', icon: Store },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 w-64">
      <div className="flex items-center justify-center h-16 border-b border-slate-800">
        <h1 className="text-xl font-bold text-blue-400">Bling Orders</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </button>
      </div>
    </div>
  );
}