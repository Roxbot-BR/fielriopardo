'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Newspaper, Bus, Trophy, Shirt,
  ChevronLeft, Menu, Settings, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/jogos', label: 'Jogos & Bolão', icon: Trophy },
  { href: '/admin/bolao', label: 'Config. Bolão', icon: Settings },
  { href: '/admin/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/admin/usuarios', label: 'Participantes', icon: Users },
  { href: '/admin/noticias', label: 'Notícias', icon: Newspaper },
  { href: '/admin/caravanas', label: 'Caravanas', icon: Bus },
  { href: '/admin/elenco', label: 'Elenco', icon: Shirt },
  { href: '/admin/uniformes', label: 'Uniformes', icon: Shirt },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => {
      setCollapsed(!mq.matches ? true : false);
      if (mq.matches) setMobileOpen(false);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(href));

  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-black relative">
        {mobileOpen && (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={cn(
            'bg-[#0d0d0d] border-r border-[#2d2d2d] flex flex-col transition-all duration-200 z-40',
            'fixed md:sticky top-0 h-screen',
            collapsed ? 'w-16' : 'w-60',
            mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        >
          <div className="flex items-center justify-between p-3 border-b border-[#2d2d2d]">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <img src="/logo.jpeg" alt="Logo" width={30} height={30} className="rounded-full ring-1 ring-[#C8A951] object-cover" loading="lazy" />
                <div>
                  <p className="text-[#C8A951] font-bold text-xs uppercase tracking-wider">Admin</p>
                  <p className="text-gray-500 text-[10px]">Painel de Gestão</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors hidden md:inline-flex"
            >
              {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors md:hidden"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <nav className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
            {!collapsed && (
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 py-1.5">
                Funções
              </p>
            )}
            {sidebarLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive(href)
                    ? 'bg-[#C8A951]/10 text-[#C8A951] border border-[#C8A951]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
                {!collapsed && isActive(href) && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C8A951]" />
                )}
              </Link>
            ))}
          </nav>

          {!collapsed && (
            <div className="p-3 border-t border-[#2d2d2d]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#C8A951] animate-pulse" />
                <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">Online</p>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-auto w-full min-w-0">
          <div className="md:hidden sticky top-0 z-20 bg-black/95 border-b border-[#2d2d2d] px-3 py-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCollapsed(false);
                setMobileOpen(true);
              }}
              className="p-2 rounded text-gray-300 hover:text-white hover:bg-white/5"
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
            <span className="text-xs text-[#C8A951] font-bold uppercase tracking-wider">Admin</span>
          </div>
          <div className="max-w-6xl mx-auto p-3 sm:p-6">{children}</div>
        </main>
      </div>
    </>
  );
}
