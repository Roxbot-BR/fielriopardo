'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit, CheckSquare, Lock, Unlock, Eye, Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import type { Match } from '@/types';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AdminJogosPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'finished'>('upcoming');
  const [form, setForm] = useState({
    homeTeam: '',
    awayTeam: '',
    matchDate: '',
    competition: '',
    roundLabel: '',
    stadium: '',
    city: '',
    tvChannel: '',
  });

  const load = async () => {
    try {
      const { data } = await api.get<Match[]>('/matches?limit=200');
      setMatches(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'live');
  const finishedMatches = matches.filter(m => m.status === 'finished' || m.status === 'cancelled' || m.status === 'postponed');
  const displayMatches = activeTab === 'upcoming' ? upcomingMatches : finishedMatches;

  const openCreate = () => {
    setEditing(null);
    setForm({ homeTeam: '', awayTeam: '', matchDate: '', competition: '', roundLabel: '', stadium: '', city: '', tvChannel: '' });
    setModalOpen(true);
  };

  const openEdit = (m: Match) => {
    setEditing(m);
    setForm({
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: m.matchDate.slice(0, 16),
      competition: m.competition,
      roundLabel: m.roundLabel ?? '',
      stadium: m.stadium ?? '',
      city: m.city ?? '',
      tvChannel: m.tvChannel ?? '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    try {
      if (editing) {
        await api.patch(`/matches/${editing.id}`, form);
        toast.success('Jogo atualizado!');
      } else {
        await api.post('/matches', form);
        toast.success('Jogo criado!');
      }
      setModalOpen(false);
      load();
    } catch {
      toast.error('Erro ao salvar jogo.');
    }
  };

  const toggleBolao = async (m: Match) => {
    try {
      await api.patch(`/matches/${m.id}/bolao`, { open: !m.bolaoOpen });
      toast.success(`Bolão ${!m.bolaoOpen ? 'aberto' : 'fechado'}!`);
      load();
    } catch {
      toast.error('Erro ao alterar bolão.');
    }
  };

  const insertScore = async (m: Match) => {
    const home = window.prompt(`Placar ${m.homeTeam}:`, '0');
    const away = window.prompt(`Placar ${m.awayTeam}:`, '0');
    if (home === null || away === null) return;
    try {
      await api.patch(`/matches/${m.id}/score`, {
        homeScore: Number(home),
        awayScore: Number(away),
        status: 'finished',
      });
      toast.success('Placar inserido!');
      load();
    } catch {
      toast.error('Erro ao inserir placar.');
    }
  };

  const viewBets = (m: Match) => {
    window.open(`/admin/jogos/${m.id}/palpites`, '_blank');
  };

  const notifyUsers = async (m: Match) => {
    if (!window.confirm(`Notificar todos os usuários sobre o jogo ${m.homeTeam} x ${m.awayTeam}?`)) return;
    try {
      await api.post(`/matches/${m.id}/notify`);
      toast.success('Notificações enviadas!');
    } catch {
      toast.error('Erro ao enviar notificações.');
    }
  };

  const deleteMatch = async (m: Match) => {
    if (!window.confirm(`Tem certeza que deseja excluir o jogo ${m.homeTeam} x ${m.awayTeam}?`)) return;
    try {
      await api.delete(`/matches/${m.id}`);
      toast.success('Jogo excluído!');
      load();
    } catch {
      toast.error('Erro ao excluir jogo.');
    }
  };

  const statusVariant: Record<string, 'gold' | 'red' | 'blue' | 'gray' | 'live'> = {
    scheduled: 'gray', live: 'live', finished: 'gold', cancelled: 'red', postponed: 'red',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Gerenciar Jogos</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} /> Novo Jogo
        </Button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-[#2d2d2d]">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'upcoming'
              ? 'text-[#C8A951] border-b-2 border-[#C8A951]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Próximos ({upcomingMatches.length})
        </button>
        <button
          onClick={() => setActiveTab('finished')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'finished'
              ? 'text-[#C8A951] border-b-2 border-[#C8A951]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Encerrados ({finishedMatches.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#2d2d2d]">
          <table className="w-full text-sm" style={{ minWidth: '900px' }}>
            <thead className="bg-[#0d0d0d]">
              <tr>
                {['Jogo', 'Data', 'Placar', 'Status', 'Bolão', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#C8A951] font-bold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayMatches.map((m) => (
                <tr key={m.id} className="border-t border-[#1a1a1a] hover:bg-[#0d0d0d]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {m.homeTeamLogo && (
                          <Image 
                            src={m.homeTeamLogo} 
                            alt={m.homeTeam} 
                            width={24} 
                            height={24} 
                            className="object-contain"
                            unoptimized
                          />
                        )}
                        <span className="text-white font-medium">{m.homeTeam}</span>
                      </div>
                      <span className="text-gray-500">x</span>
                      <div className="flex items-center gap-2">
                        {m.awayTeamLogo && (
                          <Image 
                            src={m.awayTeamLogo} 
                            alt={m.awayTeam} 
                            width={24} 
                            height={24} 
                            className="object-contain"
                            unoptimized
                          />
                        )}
                        <span className="text-white font-medium">{m.awayTeam}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDateTime(m.matchDate)}</td>
                  <td className="px-4 py-3 text-white font-mono">
                    {m.homeScore !== null && m.awayScore !== null ? `${m.homeScore} - ${m.awayScore}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[m.status] ?? 'gray'}>{m.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.bolaoOpen ? 'gold' : 'gray'}>{m.bolaoOpen ? 'Aberto' : 'Fechado'}</Badge>
                  </td>
                  <td className="px-4 py-3" style={{ minWidth: '200px' }}>
                    <div className="flex flex-wrap gap-1">
                      <button 
                        onClick={() => openEdit(m)} 
                        className="p-1.5 rounded hover:bg-[#1a1a1a] text-gray-400 hover:text-[#C8A951] transition-colors" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => insertScore(m)} 
                        className="p-1.5 rounded hover:bg-[#1a1a1a] text-gray-400 hover:text-green-400 transition-colors" 
                        title="Inserir placar"
                      >
                        <CheckSquare size={16} />
                      </button>
                      <button 
                        onClick={() => toggleBolao(m)} 
                        className="p-1.5 rounded hover:bg-[#1a1a1a] text-gray-400 hover:text-blue-400 transition-colors" 
                        title={m.bolaoOpen ? 'Fechar bolão' : 'Abrir bolão'}
                      >
                        {m.bolaoOpen ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      <button 
                        onClick={() => viewBets(m)} 
                        className="p-1.5 rounded hover:bg-[#1a1a1a] text-gray-400 hover:text-purple-400 transition-colors" 
                        title="Ver palpites"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => notifyUsers(m)} 
                        className="p-1.5 rounded hover:bg-[#1a1a1a] text-gray-400 hover:text-yellow-400 transition-colors" 
                        title="Notificar participantes"
                      >
                        <Bell size={16} />
                      </button>
                      <button 
                        onClick={() => deleteMatch(m)} 
                        className="p-1.5 rounded hover:bg-[#1a1a1a] text-gray-400 hover:text-red-400 transition-colors" 
                        title="Excluir jogo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Editar Jogo' : 'Novo Jogo'}
      >
        <div className="flex flex-col gap-3">
          <Input label="Time da Casa" value={form.homeTeam} onChange={(e) => setForm((f) => ({ ...f, homeTeam: e.target.value }))} />
          <Input label="Time Visitante" value={form.awayTeam} onChange={(e) => setForm((f) => ({ ...f, awayTeam: e.target.value }))} />
          <Input label="Data e Hora" type="datetime-local" value={form.matchDate} onChange={(e) => setForm((f) => ({ ...f, matchDate: e.target.value }))} />
          <Input label="Competição" value={form.competition} onChange={(e) => setForm((f) => ({ ...f, competition: e.target.value }))} />
          <Input label="Rodada" value={form.roundLabel} onChange={(e) => setForm((f) => ({ ...f, roundLabel: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Estádio" value={form.stadium} onChange={(e) => setForm((f) => ({ ...f, stadium: e.target.value }))} />
            <Input label="Cidade" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <Input label="Canal de TV" value={form.tvChannel} onChange={(e) => setForm((f) => ({ ...f, tvChannel: e.target.value }))} />
          <div className="flex gap-2 mt-2">
            <Button onClick={save} className="flex-1">Salvar</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
