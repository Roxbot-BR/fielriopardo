'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Settings, Users, Bot, FileText, Mail,
  ChevronLeft, Menu, Calendar, Newspaper, Bus, Trophy,
  ChevronDown, ChevronRight, Bell, GitMerge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';

interface SidebarItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  children?: { href: string; label: string }[];
}

const sidebarSections: { title: string; items: SidebarItem[] }[] = [
  {
    title: 'Sistema',
    items: [
      { href: '/master', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/master/settings', label: 'Configurações', icon: Settings },
      { href: '/master/users', label: 'Usuários', icon: Users },
      { href: '/master/agents', label: 'Agentes AI', icon: Bot },
      { href: '/master/audit', label: 'Auditoria', icon: FileText },
      { href: '/master/email-templates', label: 'E-mail Templates', icon: Mail },
      { href: "/master/notificacoes", label: "Notificações Push", icon: Bell },
      { href: "/master/merge-accounts", label: "Mesclar Contas", icon: GitMerge },
    ],
  },
  {
    title: 'Conteúdo',
    items: [
      { href: '/admin/jogos', label: 'Jogos & Bolão', icon: Trophy },
      { href: '/admin/noticias', label: 'Notícias', icon: Newspaper },
      { href: '/admin/caravanas', label: 'Caravanas', icon: Bus },
      { href: '/admin/usuarios', label: 'Participantes', icon: Calendar },
    ],
  },
];

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== '/master' && pathname.startsWith(href));

  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-black">
        <aside
          className={cn(
            'bg-[#0d0d0d] border-r-2 border-[#C8A951] flex flex-col transition-all duration-200 sticky top-0 h-screen',
            collapsed ? 'w-16' : 'w-64'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-[#C8A951]/40">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Image src="/logo.jpeg" alt="Logo" width={30} height={30} className="rounded-full ring-1 ring-[#C8A951] object-cover" />
                <div>
                  <p className="text-[#C8A951] font-black text-xs uppercase tracking-widest">Master</p>
                  <p className="text-[#C8A951]/50 text-[10px] uppercase">Super Admin</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 text-[#C8A951] hover:text-white hover:bg-[#C8A951]/10 rounded transition-colors"
            >
              {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
            {sidebarSections.map((section) => (
              <div key={section.title} className="mb-2">
                {!collapsed && (
                  <p className="text-[10px] font-bold text-[#C8A951]/40 uppercase tracking-widest px-3 py-1.5">
                    {section.title}
                  </p>
                )}
                {section.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href!}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive(href!)
                        ? 'bg-[#C8A951]/15 text-[#C8A951] border border-[#C8A951]/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={17} className="shrink-0" />
                    {!collapsed && <span>{label}</span>}
                    {!collapsed && isActive(href!) && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C8A951]" />
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          {!collapsed && (
            <div className="p-3 border-t border-[#C8A951]/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#C8A951] animate-pulse" />
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Sistema Online
                </p>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
