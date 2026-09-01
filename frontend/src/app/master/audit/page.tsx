'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { AuditLog } from '@/types';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 20;

export default function MasterAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterModule, setFilterModule] = useState('');
  const [filterUser, setFilterUser] = useState('');

  const load = useCallback(async (pg: number, reset = false) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: PAGE_SIZE, page: pg, offset: (pg - 1) * PAGE_SIZE };
      if (filterModule) params.module = filterModule;
      if (filterUser) params.user = filterUser;
      const { data } = await api.get<AuditLog[]>('/master/audit', { params });
      if (reset) {
        setLogs(data);
      } else {
        setLogs((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [filterModule, filterUser]);

  useEffect(() => {
    setPage(1);
    load(1, true);
  }, [load]);

  const moduleColors: Record<string, 'gold' | 'red' | 'blue' | 'gray'> = {
    AUTH: 'blue', BOLAO: 'gold', ADMIN: 'red', MASTER: 'gold', MATCH: 'gold', NEWS: 'gray',
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">📋 Logs de Auditoria</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-3 py-2">
          <Filter size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Filtrar por módulo..."
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="bg-transparent text-sm text-white placeholder:text-gray-500 outline-none w-40"
          />
        </div>
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Filtrar por usuário..."
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="bg-transparent text-sm text-white placeholder:text-gray-500 outline-none w-40"
          />
        </div>
      </div>

      {loading && page === 1 ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[#2d2d2d]">
            <table className="w-full text-sm">
              <thead className="bg-[#0d0d0d]">
                <tr>
                  {['Usuário', 'Ação', 'Módulo', 'Descrição', 'Data'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-[#C8A951] font-bold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-[#1a1a1a] hover:bg-[#0d0d0d]">
                    <td className="px-4 py-3 text-gray-300">
                      {log.user?.nick ?? log.userId?.slice(0, 8) ?? "Sistema"}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{log.action}</td>
                    <td className="px-4 py-3">
                      <Badge variant={moduleColors[log.module] ?? 'gray'}>{log.module}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{log.description}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Nenhum log encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => { setPage((p) => p + 1); load(page + 1); }} disabled={loading}>
                {loading ? 'Carregando...' : 'Carregar mais'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
