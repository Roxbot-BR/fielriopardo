'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, Calendar, Bot, ShieldAlert, Settings, FileText,
  Trophy, Newspaper, Bus, ArrowRight, TrendingUp, Activity,
  CheckCircle, AlertCircle, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface MasterStats {
  totalUsers: number;
  totalMatches: number;
  activeAgents: number;
  lastAudit: string;
  totalPredictions?: number;
  openBolao?: number;
}

interface AuditLog {
  id: string;
  action: string;
  module: string;
  description: string;
  createdAt: string;
  user?: { nick: string; name: string };
}

const quickActions = [
  {
    href: '/master/settings',
    icon: Settings,
    title: 'Configurações',
    desc: 'API keys, SMTP, parâmetros do sistema',
    color: 'from-[#C8A951]/20 to-[#C8A951]/5',
    border: 'border-[#C8A951]/30',
    iconBg: 'bg-[#C8A951]',
    badge: 'Sistema',
  },
  {
    href: '/master/users',
    icon: Users,
    title: 'Usuários',
    desc: 'Criar admins, gerenciar roles e permissões',
    color: 'from-blue-600/20 to-blue-600/5',
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-600',
    badge: 'Gestão',
  },
  {
    href: '/master/agents',
    icon: Bot,
    title: 'Agentes AI',
    desc: 'Monitorar e disparar agentes de notícias e bolão',
    color: 'from-[#C8A951]/20 to-[#C8A951]/5',
    border: 'border-[#C8A951]/30',
    iconBg: 'bg-[#C8A951]',
    badge: 'IA',
  },
  {
    href: '/master/audit',
    icon: FileText,
    title: 'Auditoria',
    desc: 'Logs de todas as ações realizadas no sistema',
    color: 'from-purple-600/20 to-purple-600/5',
    border: 'border-purple-500/30',
    iconBg: 'bg-purple-600',
    badge: 'Segurança',
  },
  {
    href: '/admin/jogos',
    icon: Trophy,
    title: 'Jogos & Bolão',
    desc: 'Criar partidas, abrir/fechar bolão, registrar resultados',
    color: 'from-orange-600/20 to-orange-600/5',
    border: 'border-orange-500/30',
    iconBg: 'bg-orange-600',
    badge: 'Conteúdo',
  },
  {
    href: '/admin/noticias',
    icon: Newspaper,
    title: 'Notícias',
    desc: 'Publicar e gerenciar notícias do Corinthians',
    color: 'from-sky-600/20 to-sky-600/5',
    border: 'border-sky-500/30',
    iconBg: 'bg-sky-500',
    badge: 'Conteúdo',
  },
  {
    href: '/admin/caravanas',
    icon: Bus,
    title: 'Caravanas',
    desc: 'Gerenciar caravanas, fotos e galeria',
    color: 'from-rose-600/20 to-rose-600/5',
    border: 'border-rose-500/30',
    iconBg: 'bg-rose-600',
    badge: 'Conteúdo',
  },
  {
    href: '/admin/usuarios',
    icon: Users,
    title: 'Participantes',
    desc: 'Ver e moderar participantes do bolão',
    color: 'from-teal-600/20 to-teal-600/5',
    border: 'border-teal-500/30',
    iconBg: 'bg-teal-600',
    badge: 'Bolão',
  },
];

function getTimeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export default function MasterPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MasterStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<MasterStats>('/master/stats').catch(() => ({ data: null })),
      api.get<{ data: AuditLog[] }>('/master/audit?limit=6').catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, logsRes]) => {
      if (statsRes.data) setStats(statsRes.data);
      const logsData = (logsRes.data as any)?.data ?? (logsRes.data as any) ?? [];
      setLogs(Array.isArray(logsData) ? logsData.slice(0, 6) : []);
    }).finally(() => setLoading(false));
  }, []);

  const firstName = user?.fullName?.split(' ')[0] ?? 'Master';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#C8A951]/40 bg-gradient-to-r from-[#0d0d0d] via-[#111] to-[#0a0a0a] p-6">
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[#C8A951]/70 text-sm font-medium">{greeting},</p>
            <h1 className="text-3xl font-black text-white mt-0.5">
              {firstName} 🦅
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Painel Master · Fiel Rio Pardo · São José do Rio Pardo – SP
            </p>
          </div>
          <Badge variant="gold" className="self-start sm:self-auto text-base px-4 py-2">
            ⚙️ SUPER ADMIN
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, value: stats?.totalUsers ?? 0, label: 'Usuários', color: 'bg-[#C8A951]', trend: '+3 esta semana' },
          { icon: Calendar, value: stats?.totalMatches ?? 0, label: 'Jogos', color: 'bg-blue-600', trend: 'Total cadastrados' },
          { icon: Bot, value: stats?.activeAgents ?? 0, label: 'Agentes Ativos', color: 'bg-[#C8A951]', trend: 'Rodando agora' },
          { icon: ShieldAlert, value: logs.length, label: 'Logs Recentes', color: 'bg-purple-600', trend: 'Últimas ações' },
        ].map(({ icon: Icon, value, label, color, trend }) => (
          <Card key={label} variant="default">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} shrink-0`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-black text-white leading-none">{value}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{label}</p>
                  <p className="text-[11px] text-gray-600 mt-1">{trend}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-[#C8A951]" />
          <h2 className="text-lg font-bold text-white">Acesso Rápido</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(({ href, icon: Icon, title, desc, color, border, iconBg, badge }) => (
            <Link key={href} href={href}>
              <div className={cn(
                'group h-full rounded-xl border bg-gradient-to-br p-4 transition-all duration-200',
                'hover:scale-[1.02] hover:shadow-lg hover:shadow-black/40 cursor-pointer',
                color, border
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg} shrink-0`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                    {badge}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm mb-1 group-hover:text-[#C8A951] transition-colors">
                  {title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                <div className="flex items-center gap-1 mt-3 text-[#C8A951]/60 group-hover:text-[#C8A951] transition-colors">
                  <span className="text-[11px] font-medium">Acessar</span>
                  <ArrowRight size={11} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Audit */}
      {logs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#C8A951]" />
              <h2 className="text-lg font-bold text-white">Atividade Recente</h2>
            </div>
            <Link href="/master/audit" className="text-xs text-[#C8A951] hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <Card variant="default">
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {logs.map((log, i) => (
                  <div key={log.id ?? i} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5">
                      {log.action?.includes('error') || log.action?.includes('fail')
                        ? <AlertCircle size={15} className="text-red-400" />
                        : <CheckCircle size={15} className="text-[#C8A951]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {log.user?.nick ?? 'Sistema'} · {log.module} · {getTimeAgo(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
