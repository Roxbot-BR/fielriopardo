'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Save, Settings, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface BolaoConfig {
  bolao_prize_first: string;
  bolao_prize_second: string;
  bolao_prize_third: string;
  bolao_points_sole_winner: string;
  bolao_points_shared_winner: string;
  bolao_tiebreak_criteria: string;
  bolao_tiebreak_1st: string;
  bolao_tiebreak_2nd: string;
  bolao_tiebreak_3rd: string;
  bolao_season: string;
  bolao_close_minutes_before: string;
}

const defaultConfig: BolaoConfig = {
  bolao_prize_first: '',
  bolao_prize_second: '',
  bolao_prize_third: '',
  bolao_points_sole_winner: '2',
  bolao_points_shared_winner: '1',
  bolao_tiebreak_criteria: '',
  bolao_tiebreak_1st: '',
  bolao_tiebreak_2nd: '',
  bolao_tiebreak_3rd: '',
  bolao_season: '2026',
  bolao_close_minutes_before: '1',
};

export default function AdminBolaoPage() {
  const [config, setConfig] = useState<BolaoConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<BolaoConfig>('/bolao/config')
      .then(r => setConfig(r.data))
      .catch(() => toast.error('Erro ao carregar configurações'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof BolaoConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setConfig(prev => ({ ...prev, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/bolao/config', config);
      toast.success('Configurações salvas!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy size={24} className="text-[#C8A951]" />
          <div>
            <h1 className="text-2xl font-black text-white">Configurações do Bolão</h1>
            <p className="text-gray-400 text-sm">Temporada {config.bolao_season}</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} variant="default" className="flex items-center gap-2">
          {saving ? <Spinner size="sm" /> : <Save size={16} />}
          Salvar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prêmios */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              🥇 Premiação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">🥇 1º Prêmio</label>
              <Input value={config.bolao_prize_first} onChange={set('bolao_prize_first')} placeholder="Ex: R$ 150,00" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">🥈 2º Prêmio</label>
              <Input value={config.bolao_prize_second} onChange={set('bolao_prize_second')} placeholder="Ex: Camisa do Timão" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">🥉 3º Prêmio</label>
              <Input value={config.bolao_prize_third} onChange={set('bolao_prize_third')} placeholder="Ex: Kit Presente do Timão" />
            </div>
          </CardContent>
        </Card>

        {/* Pontuação */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              ⚽ Pontuação & Regras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Pontos (Único Acertador)</label>
                <Input type="number" min={1} value={config.bolao_points_sole_winner} onChange={set('bolao_points_sole_winner')} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Pontos (Dividido)</label>
                <Input type="number" min={1} value={config.bolao_points_shared_winner} onChange={set('bolao_points_shared_winner')} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Temporada</label>
              <Input value={config.bolao_season} onChange={set('bolao_season')} placeholder="2026" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Fechar Bolão (min antes do jogo)</label>
              <Input type="number" min={0} value={config.bolao_close_minutes_before} onChange={set('bolao_close_minutes_before')} />
              <p className="text-[11px] text-gray-600 mt-1">0 = fecha exatamente na hora do jogo. 1 = 1 minuto antes.</p>
            </div>
          </CardContent>
        </Card>

        {/* Critérios de desempate */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              ⚖️ Critérios de Desempate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-[#C8A951]/5 border border-[#C8A951]/20 rounded-lg">
              <p className="text-xs text-gray-400 leading-relaxed">
                Após aplicar o critério de desempate (sozinho → palpites), se ainda houver empate, os responsáveis abaixo decidem o vencedor do respectivo prêmio.
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Texto do Critério de Desempate (exibido no Ranking)</label>
              <textarea
                value={config.bolao_tiebreak_criteria}
                onChange={(e) => setConfig(prev => ({ ...prev, bolao_tiebreak_criteria: e.target.value }))}
                rows={4}
                placeholder="Descreva os critérios de desempate que serão exibidos na página de ranking..."
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] text-white text-sm focus:border-[#C8A951] focus:outline-none resize-y"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Responsável pelo 1º Prêmio</label>
              <Input value={config.bolao_tiebreak_1st} onChange={set('bolao_tiebreak_1st')} placeholder="Ex: Thiago Rocha" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Responsável pelo 2º Prêmio</label>
              <Input value={config.bolao_tiebreak_2nd} onChange={set('bolao_tiebreak_2nd')} placeholder="Ex: Gu Almeida" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Responsável pelo 3º Prêmio</label>
              <Input value={config.bolao_tiebreak_3rd} onChange={set('bolao_tiebreak_3rd')} placeholder="Ex: BrunoDeCarvalho" />
            </div>
          </CardContent>
        </Card>

        {/* Info / Preview das Regras */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              📋 Preview das Regras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/50 rounded-lg p-4 text-sm text-gray-300 space-y-2 font-mono text-xs leading-relaxed">
              <p>⚠ REGRAS DO BOLÃO TEMPORADA {config.bolao_season} ⚠</p>
              <p>▪ O bolão fecha {config.bolao_close_minutes_before}min antes de cada partida</p>
              <p>▪ 🥇 1º: {config.bolao_prize_first || '—'}</p>
              <p>▪ 🥈 2º: {config.bolao_prize_second || '—'}</p>
              <p>▪ 🥉 3º: {config.bolao_prize_third || '—'}</p>
              <p>▪ Único acertador: {config.bolao_points_sole_winner} pontos</p>
              <p>▪ Múltiplos acertadores: {config.bolao_points_shared_winner} ponto(s) cada</p>
              <p>▪ Empate 1º: dividido em partes iguais</p>
              <p>▪ Resp. 1º: {config.bolao_tiebreak_1st || '—'} decide</p>
              <p>▪ Resp. 2º: {config.bolao_tiebreak_2nd || '—'} decide</p>
              <p>▪ Resp. 3º: {config.bolao_tiebreak_3rd || '—'} decide</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
