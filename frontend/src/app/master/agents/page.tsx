'use client';

import React, { useEffect, useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils';

interface AgentStatus {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastRun: string | null;
  tokensConsumed: number | null;
  errorMessage: string | null;
}

const statusBadge: Record<AgentStatus['status'], { variant: 'gold' | 'gray' | 'red'; label: string }> = {
  ACTIVE: { variant: 'gold', label: 'Ativo' },
  INACTIVE: { variant: 'gray', label: 'Inativo' },
  ERROR: { variant: 'red', label: 'Erro' },
};

const agentIcons: Record<string, string> = {
  news: '📰',
  match_live: '⚽',
  bolao: '🎯',
  curiosity: '🤔',
};

export default function MasterAgentsPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [firing, setFiring] = useState<string | null>(null);

  const load = async () => {
    try {
      const { data } = await api.get<AgentStatus[]>('/master/agents');
      setAgents(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fire = async (id: string) => {
    setFiring(id);
    try {
      await api.post(`/master/agents/${id}/trigger`);
      toast.success('Agente disparado!');
      setTimeout(load, 2000);
    } catch {
      toast.error('Erro ao disparar agente.');
    } finally {
      setFiring(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">🤖 Agentes AI</h1>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw size={14} /> Atualizar
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {agents.map((agent) => {
          const status = statusBadge[agent.status];
          return (
            <Card key={agent.id} variant={agent.status === 'ERROR' ? 'highlight' : 'default'} className={agent.status === 'ERROR' ? 'border-red-500/50' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{agentIcons[agent.id] ?? '🤖'}</span>
                    <div>
                      <p className="font-bold text-white">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.description}</p>
                    </div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                {agent.errorMessage && (
                  <p className="text-xs text-red-400 bg-red-900/20 rounded px-2 py-1 mb-3">
                    {agent.errorMessage}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-500">
                    {agent.lastRun ? (
                      <>Último run: {formatDateTime(agent.lastRun)}</>
                    ) : (
                      'Nunca executado'
                    )}
                    {agent.tokensConsumed !== null && (
                      <span className="ml-2 text-gray-600">• {agent.tokensConsumed.toLocaleString()} tokens</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fire(agent.id)}
                    disabled={firing === agent.id}
                  >
                    {firing === agent.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <><Play size={12} /> Disparar</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {agents.length === 0 && (
          <p className="col-span-2 text-center text-gray-500 py-16">
            Nenhum agente cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}
