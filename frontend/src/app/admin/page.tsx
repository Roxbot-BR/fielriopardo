'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar, Users, Target, Trophy, Newspaper, Bus,
  ArrowRight, Activity, Clock, Plus, CheckCircle,
  Lock, Unlock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface AdminStats {
  totalMatches: number;
  totalPredictions: number;
  activeUsers: number;
  lastMatchLabel: string;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  championship: string;
  bolaoOpen: boolean;
  status: string;
}

const quickActions = [
  {
    href: '/admin/jogos',
    icon: Trophy,
    title: 'Jogos & Bolão',
    desc: 'Criar partidas, abrir/fechar bolão e registrar resultados ao vivo',
    color: 'from-orange-600/20 to-orange-600/5',
    border: 'border-orange-500/30',
    iconBg: 'bg-orange-600',
    hint: 'Gerenciar Jogos',
  },
  {
    href: '/admin/usuarios',
    icon: Users,
    title: 'Participantes',
    desc: 'Visualizar cadastros, ativar ou desativar participantes do bolão',
    color: 'from-blue-600/20 to-blue-600/5',
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-600',
    hint: 'Ver Participantes',
  },
  {
    href: '/admin/noticias',
    icon: Newspaper,
    title: 'Notícias',
    desc: 'Publicar artigos, notícias e curiosidades sobre o Corinthians',
    color: 'from-sky-600/20 to-sky-600/5',
    border: 'border-sky-500/30',
    iconBg: 'bg-sky-500',
    hint: 'Publicar Notícia',
  },
  {
    href: '/admin/caravanas',
    icon: Bus,
    title: 'Caravanas',
    desc: 'Cadastrar caravanas, fotos de destaque e galeria de fotos',
    color: 'from-rose-600/20 to-rose-600/5',
    border: 'border-rose-500/30',
    iconBg: 'bg-rose-600',
    hint: 'Gerenciar Caravanas',
  },
];

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<AdminStats>('/admin/stats').catch(() => ({ data: null })),
      api.get<Match[]>('/matches/upcoming').catch(() => ({ data: [] })),
    ]).then(([statsRes, matchesRes]) => {
      if (statsRes.data) setStats(statsRes.data);
      const upcoming = Array.isArray(matchesRes.data) ? matchesRes.data : [];
      if (upcoming.length > 0) setNextMatch(upcoming[0]);
    }).finally(() => setLoading(false));
  }, []);

  const firstName = user?.fullName?.split(' ')[0] ?? 'Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl border border-[#2d2d2d] bg-gradient-to-r from-[#0d0d0d] to-[#111] p-6">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[#C8A951]/70 text-sm font-medium">{greeting},</p>
            <h1 className="text-3xl font-black text-white mt-0.5">{firstName} 🦅</h1>
            <p className="text-gray-400 text-sm mt-1">
              Painel Admin · Fiel Rio Pardo · São José do Rio Pardo – SP
            </p>
          </div>
          <Badge variant="gray" className="self-start sm:self-auto text-base px-4 py-2 border-[#C8A951]/40 text-[#C8A951]">
            🛡️ ADMINISTRADOR
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Calendar, value: stats?.totalMatches ?? 0, label: 'Total Jogos', color: 'bg-blue-600' },
          { icon: Target, value: stats?.totalPredictions ?? 0, label: 'Total Palpites', color: 'bg-[#C8A951]' },
          { icon: Users, value: stats?.activeUsers ?? 0, label: 'Participantes Ativos', color: 'bg-[#C8A951]' },
          { icon: Trophy, value: stats?.lastMatchLabel ?? '—', label: 'Último Jogo', color: 'bg-purple-600' },
        ].map(({ icon: Icon, value, label, color }) => (
          <Card key={label} variant="default">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} shrink-0`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white leading-none">{value}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next Match Banner */}
      {nextMatch && (
        <Card variant="default">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs text-[#C8A951] font-bold uppercase tracking-wider mb-1">
                  ⚽ Próximo Jogo
                </p>
                <p className="text-xl font-black text-white">
                  {nextMatch.homeTeam} <span className="text-[#C8A951]">×</span> {nextMatch.awayTeam}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {formatDateTime(nextMatch.matchDate)} · {nextMatch.championship}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold',
                  nextMatch.bolaoOpen
                    ? 'bg-[#C8A951]/20 text-[#C8A951] border border-[#C8A951]/30'
                    : 'bg-gray-700/40 text-gray-400 border border-gray-600/30'
                )}>
                  {nextMatch.bolaoOpen ? <Unlock size={12} /> : <Lock size={12} />}
                  {nextMatch.bolaoOpen ? 'Bolão Aberto' : 'Bolão Fechado'}
                </div>
                <Link
                  href="/admin/jogos"
                  className="bg-[#C8A951] hover:bg-[#b8963f] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus size={13} /> Gerenciar
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-[#C8A951]" />
          <h2 className="text-lg font-bold text-white">Funções do Admin</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map(({ href, icon: Icon, title, desc, color, border, iconBg, hint }) => (
            <Link key={href} href={href}>
              <div className={cn(
                'group h-full rounded-xl border bg-gradient-to-br p-5 transition-all duration-200',
                'hover:scale-[1.01] hover:shadow-lg hover:shadow-black/40 cursor-pointer',
                color, border
              )}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} shrink-0`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base mb-1 group-hover:text-[#C8A951] transition-colors">
                      {title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                    <div className="flex items-center gap-1 mt-3 text-[#C8A951]/60 group-hover:text-[#C8A951] transition-colors">
                      <span className="text-xs font-medium">{hint}</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
