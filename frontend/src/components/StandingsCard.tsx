'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import api from '@/lib/api';

interface StandingEntry {
  position: number;
  team: string;
  points: number;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
}

interface StandingsData {
  updatedAt: string;
  competition: string;
  standings: StandingEntry[];
}

export function StandingsCard({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get<StandingsData>('/matches/standings');
      setData(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const allRows = data?.standings ?? [];

  // Find Corinthians index and compute the 5-row window
  const coriIdx = allRows.findIndex(e => e.team?.toLowerCase().includes('corinthians'));
  const coriPos = coriIdx >= 0 ? coriIdx : 0;
  const startIdx = Math.max(0, Math.min(coriPos - 2, allRows.length - 5));
  const endIdx = Math.min(allRows.length, startIdx + 5);

  const visibleRows = showFull ? allRows : allRows.slice(startIdx, endIdx);
  const hasAbove = !showFull && startIdx > 0;
  const hasBelow = !showFull && endIdx < allRows.length;

  return (
    <Card variant="default" className="overflow-hidden">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-[#C8A951]" />
          <CardTitle className="text-base font-bold text-white">
            {data?.competition ?? 'Classificação'}
          </CardTitle>
        </div>
        {!loading && (
          <button onClick={load} className="text-gray-500 hover:text-[#C8A951] transition-colors p-1 rounded">
            <RefreshCw size={14} />
          </button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner size="sm" /></div>
        ) : error ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            <p>Não foi possível carregar</p>
            <button onClick={load} className="text-[#C8A951] text-xs mt-1 hover:underline">Tentar novamente</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0d0d0d]">
                    <th className="pl-4 pr-2 py-2 text-left text-[10px] text-[#C8A951] font-bold uppercase tracking-wider w-8">#</th>
                    <th className="px-2 py-2 text-left text-[10px] text-[#C8A951] font-bold uppercase tracking-wider">Time</th>
                    <th className="px-2 py-2 text-center text-[10px] text-[#C8A951] font-bold uppercase tracking-wider">PTS</th>
                    {!compact && <>
                      <th className="px-2 py-2 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">J</th>
                      <th className="px-2 py-2 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">V</th>
                      <th className="px-2 py-2 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">E</th>
                      <th className="px-2 py-2 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">D</th>
                      <th className="px-2 py-2 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">SG</th>
                    </>}
                  </tr>
                </thead>
                <tbody>
                  {hasAbove && (
                    <tr className="border-t border-white/5">
                      <td colSpan={compact ? 3 : 8} className="px-3 py-1 text-center text-gray-600 text-[10px]">· · ·</td>
                    </tr>
                  )}
                  {visibleRows.map((entry) => {
                    const isCorinthians = entry.team?.toLowerCase().includes('corinthians');
                    return (
                      <tr
                        key={entry.position}
                        className={`border-t border-white/5 transition-colors ${
                          isCorinthians
                            ? 'bg-[#C8A951]/10 border-l-2 border-l-[#C8A951]'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className={`pl-4 pr-2 py-2.5 text-center font-bold text-xs ${
                          entry.position <= 4 ? 'text-blue-400' :
                          entry.position >= allRows.length - 2 ? 'text-red-400' : 'text-gray-500'
                        }`}>
                          {entry.position}
                        </td>
                        <td className="px-2 py-2.5">
                          <span className={`text-sm ${isCorinthians ? 'font-black text-[#C8A951]' : 'font-medium text-gray-300'}`}>
                            {entry.team}
                          </span>
                        </td>
                        <td className={`px-2 py-2.5 text-center font-black text-sm ${isCorinthians ? 'text-[#C8A951]' : 'text-white'}`}>
                          {entry.points}
                        </td>
                        {!compact && <>
                          <td className="px-2 py-2.5 text-center text-xs text-gray-500">{entry.games}</td>
                          <td className="px-2 py-2.5 text-center text-xs text-[#C8A951]">{entry.wins}</td>
                          <td className="px-2 py-2.5 text-center text-xs text-yellow-400">{entry.draws}</td>
                          <td className="px-2 py-2.5 text-center text-xs text-red-400">{entry.losses}</td>
                          <td className={`px-2 py-2.5 text-center text-xs ${entry.goalDiff > 0 ? 'text-[#C8A951]' : entry.goalDiff < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                            {entry.goalDiff > 0 ? '+' : ''}{entry.goalDiff}
                          </td>
                        </>}
                      </tr>
                    );
                  })}
                  {hasBelow && (
                    <tr className="border-t border-white/5">
                      <td colSpan={compact ? 3 : 8} className="px-3 py-1 text-center text-gray-600 text-[10px]">· · ·</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {allRows.length > 5 && (
              <div className="px-4 py-2 flex items-center justify-between">
                <button
                  onClick={() => setShowFull(v => !v)}
                  className="flex items-center gap-1 text-xs text-[#C8A951] hover:text-[#C8A951]/80 transition-colors font-medium"
                >
                  {showFull ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showFull ? 'Recolher tabela' : 'Exibir classificação completa'}
                </button>
                {data?.updatedAt && (
                  <p className="text-[10px] text-gray-600">
                    {new Date(data.updatedAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
