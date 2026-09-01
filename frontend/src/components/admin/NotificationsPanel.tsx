'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Send, Users, Activity, CheckCircle, XCircle, Loader2, Smartphone, BellOff, BellRing } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Stats {
  totalSubscribers: number;
  totalSent: number;
  todaySent: number;
}

interface SubscribedUser {
  id: string;
  nick: string;
}

interface UserOverview {
  id: string;
  nick: string;
  has_push: boolean;
  pwa_installed: boolean;
}

const QUICK_TEMPLATES = [
  {
    label: '⚽ Bolão Aberto',
    title: '⚽ Bolão Aberto!',
    body: 'O bolão está aberto para palpites! Acesse agora e faça sua aposta.',
    url: '/bolao',
  },
  {
    label: '🏆 Ranking Atualizado',
    title: '🏆 Ranking Atualizado!',
    body: 'O ranking do bolão foi atualizado. Veja sua posição agora!',
    url: '/bolao/ranking',
  },
  {
    label: '⏰ Lembrete Palpite',
    title: '⏰ Não esqueça de palpitar!',
    body: 'O bolão fecha em breve. Ainda dá tempo de dar seu palpite!',
    url: '/bolao',
  },
  {
    label: '🖤 Aviso Geral',
    title: '🖤🤍 Fiel Rio Pardo',
    body: '',
    url: '/',
  },
];

export default function NotificationsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<SubscribedUser[]>([]);
  const [overview, setOverview] = useState<UserOverview[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const [target, setTarget] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const loadData = async () => {
    setLoadingStats(true);
    try {
      const [statsRes, usersRes, overviewRes] = await Promise.all([
        api.get<Stats>('/notifications/stats'),
        api.get<SubscribedUser[]>('/notifications/users'),
        api.get<UserOverview[]>('/notifications/overview'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setOverview(overviewRes.data);
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    setUrl(tpl.url);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }
    setSending(true);
    setLastResult(null);
    try {
      const { data } = await api.post<{ sent: number; failed: number; total: number }>(
        '/notifications/send-manual',
        { target, title: title.trim(), body: body.trim(), url: url.trim() || '/' },
      );
      setLastResult(data);
      toast.success(`✅ Notificação enviada para ${data.sent} dispositivos!`);
      loadData();
    } catch {
      toast.error('Erro ao enviar notificação');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Bell className="text-[#C8A951]" size={24} /> Notificações Push
        </h1>
        <p className="text-gray-400 text-sm mt-1">Envie notificações manualmente para os assinantes do app</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Assinantes Push', value: stats?.totalSubscribers, icon: Users, color: 'text-blue-400' },
          { label: 'App Instalado', value: overview.filter(u => u.pwa_installed).length, icon: Smartphone, color: 'text-purple-400' },
          { label: 'Enviadas Hoje', value: stats?.todaySent, icon: Activity, color: 'text-green-400' },
          { label: 'Total Enviadas', value: stats?.totalSent, icon: Bell, color: 'text-[#C8A951]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{label}</p>
              <p className="text-2xl font-black text-white">
                {loadingStats ? '—' : (value ?? 0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 space-y-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Send size={16} className="text-[#C8A951]" /> Enviar Notificação
          </h2>

          {/* Quick templates */}
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">Templates rápidos</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  onClick={() => applyTemplate(tpl)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-[#1a1a1a] border border-[#3d3d3d] text-gray-300 hover:border-[#C8A951]/50 hover:text-white transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Destinatário</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A951] focus:outline-none"
            >
              <option value="all">
                Todos os assinantes ({users.length} usuários)
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.nick}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Ex: ⚽ Bolão Aberto!"
              className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#C8A951] focus:outline-none"
            />
            <p className="text-right text-[10px] text-gray-600 mt-1">{title.length}/80</p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Mensagem</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Ex: O bolão está aberto! Acesse e faça seu palpite."
              className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#C8A951] focus:outline-none resize-none"
            />
            <p className="text-right text-[10px] text-gray-600 mt-1">{body.length}/200</p>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">URL de destino (ao clicar)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/bolao"
              className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#C8A951] focus:outline-none"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#C8A951] hover:bg-[#d4b85a] text-black font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Enviando...' : 'Enviar Notificação'}
          </button>

          {/* Result */}
          {lastResult && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d]">
              <CheckCircle size={16} className="text-green-400 shrink-0" />
              <div className="text-sm">
                <span className="text-green-400 font-bold">{lastResult.sent} enviados</span>
                {lastResult.failed > 0 && (
                  <span className="text-red-400 ml-2">{lastResult.failed} falhas</span>
                )}
                <span className="text-gray-500 ml-2">de {lastResult.total} dispositivos</span>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 space-y-4">
          <h2 className="text-white font-bold">Preview da Notificação</h2>
          <p className="text-xs text-gray-500">Como aparecerá no dispositivo do usuário:</p>

          <div className="bg-[#1e1e2e] rounded-2xl p-4 border border-[#3d3d3d] shadow-lg max-w-sm">
            <div className="flex items-start gap-3">
              <img src="/icon-192x192.png" alt="icon" className="w-10 h-10 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-xs font-bold uppercase tracking-wide">Fiel Rio Pardo</span>
                  <span className="text-gray-500 text-xs">agora</span>
                </div>
                <p className="text-white text-sm font-semibold leading-tight">
                  {title || <span className="text-gray-600 italic">Título da notificação</span>}
                </p>
                <p className="text-gray-400 text-xs mt-0.5 leading-snug line-clamp-2">
                  {body || <span className="text-gray-600 italic">Texto da mensagem aparece aqui...</span>}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status por usuário</p>
            {loadingStats ? (
              <p className="text-gray-500 text-sm">Carregando...</p>
            ) : overview.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum usuário ativo encontrado.</p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {overview.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d]">
                    <span className="text-sm text-white font-medium truncate flex-1 mr-2">{u.nick}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span title={u.pwa_installed ? 'App instalado' : 'App não instalado'}
                        className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${u.pwa_installed ? 'bg-blue-500/15 text-blue-400' : 'bg-gray-700/40 text-gray-600'}`}>
                        <Smartphone size={10} />
                        {u.pwa_installed ? 'App' : 'Sem app'}
                      </span>
                      <span title={u.has_push ? 'Notificações ativas' : 'Sem notificações'}
                        className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${u.has_push ? 'bg-green-500/15 text-green-400' : 'bg-gray-700/40 text-gray-600'}`}>
                        {u.has_push ? <BellRing size={10} /> : <BellOff size={10} />}
                        {u.has_push ? 'Notif.' : 'Sem notif.'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
