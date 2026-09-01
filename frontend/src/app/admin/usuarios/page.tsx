'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import type { User } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

interface DuplicatePair {
  user1: Partial<User> & { id: string; nick: string; fullName: string; email: string; whatsapp?: string; city?: string; isActive?: boolean; createdAt?: string };
  user2: Partial<User> & { id: string; nick: string; fullName: string; email: string; whatsapp?: string; city?: string; isActive?: boolean; createdAt?: string };
  reason: string;
}

export default function AdminUsuariosPage() {
  const [tab, setTab] = useState<'lista' | 'duplicatas'>('lista');
  const [users, setUsers] = useState<User[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDups, setLoadingDups] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get<User[]>('/admin/users');
      setUsers(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const loadDuplicates = async () => {
    setLoadingDups(true);
    try {
      const { data } = await api.get<DuplicatePair[]>('/admin/users/duplicates');
      setDuplicates(data);
    } catch {
      toast.error('Erro ao carregar duplicatas.');
    } finally {
      setLoadingDups(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (tab === 'duplicatas' && duplicates.length === 0) loadDuplicates();
  }, [tab]);

  const toggleActive = async (u: User) => {
    try {
      await api.patch(`/admin/users/${u.id}`, { isActive: !u.isActive });
      toast.success(`Usuário ${!u.isActive ? 'ativado' : 'desativado'}!`);
      load();
    } catch {
      toast.error('Erro ao alterar usuário.');
    }
  };

  const deactivateDuplicate = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}?active=false`);
      toast.success('Usuário desativado!');
      loadDuplicates();
    } catch {
      toast.error('Erro ao desativar usuário.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Gerenciar Usuários</h1>
        {duplicates.length > 0 && tab === 'lista' && (
          <button onClick={() => setTab('duplicatas')} className="text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-900/50 px-3 py-1.5 rounded-lg font-medium">
            ⚠️ {duplicates.length} possíveis duplicatas
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'lista', label: `Lista (${users.length})` },
          { key: 'duplicatas', label: `Duplicatas${duplicates.length > 0 ? ` (${duplicates.length})` : ''}` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'lista' | 'duplicatas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-[#C8A951] text-black'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista tab */}
      {tab === 'lista' && (
        loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#2d2d2d]">
            <table className="w-full text-sm">
              <thead className="bg-[#0d0d0d]">
                <tr>
                  {['Usuário', 'E-mail', 'Role', 'Cadastro', 'Status', 'Ação'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-[#C8A951] font-bold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-[#1a1a1a] hover:bg-[#0d0d0d]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={u.avatarUrl} name={u.nick} size="sm" />
                        <span className="text-white font-medium">{u.nick}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const r = u.roles?.[0];
                        const roleName = typeof r === 'string' ? r : (r as any)?.name ?? '—';
                        return (
                          <Badge variant={roleName === 'SUPER_ADMIN' || roleName === 'MASTER' ? 'gold' : roleName === 'ADMIN' ? 'blue' : 'gray'}>
                            {roleName}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive !== false ? 'gold' : 'red'}>
                        {u.isActive !== false ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                          u.isActive !== false
                            ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                            : 'bg-[#C8A951]/10 text-[#C8A951] hover:bg-[#C8A951]/20'
                        }`}
                      >
                        {u.isActive !== false ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Duplicatas tab */}
      {tab === 'duplicatas' && (
        loadingDups ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : duplicates.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-medium text-white">Nenhuma duplicata encontrada!</p>
            <p className="text-sm mt-1">Todos os cadastros parecem únicos.</p>
            <button onClick={loadDuplicates} className="mt-4 text-xs text-[#C8A951] hover:underline">Verificar novamente</button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">{duplicates.length} par(es) de cadastros potencialmente duplicados. Verifique e desative os duplicados.</p>
            {duplicates.map((dup, i) => (
              <div key={i} className="rounded-xl border border-yellow-900/40 bg-yellow-900/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded font-medium">⚠️ {dup.reason}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[dup.user1, dup.user2].map((u, j) => (
                    <div key={j} className="bg-[#111] rounded-lg p-3 border border-[#2a2a2a]">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-white font-semibold">{u.nick}</span>
                          <Badge variant={u.isActive !== false ? 'gold' : 'red'} className="ml-2 text-xs">{u.isActive !== false ? 'Ativo' : 'Inativo'}</Badge>
                        </div>
                        {u.isActive !== false && (
                          <button
                            onClick={() => deactivateDuplicate(u.id)}
                            className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 font-medium"
                          >
                            Desativar
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{u.fullName}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      {u.whatsapp && <p className="text-xs text-gray-500">📱 {u.whatsapp}</p>}
                      {u.city && <p className="text-xs text-gray-500">📍 {u.city}</p>}
                      <p className="text-xs text-gray-600 mt-1">Cadastrado: {u.createdAt ? formatDate(u.createdAt) : '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
