'use client';

import React from 'react';
import type { SeasonRanking } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface RankingTableProps {
  ranking: SeasonRanking[];
  limit?: number;
  prizes?: Record<number, string>;
}

export function RankingTable({ ranking, limit, prizes = {} }: RankingTableProps) {
  const { user } = useAuth();
  const data = limit ? ranking.slice(0, limit) : ranking;

  // Contar quantos jogadores estão em cada posição (para detectar empate)
  const countByPos: Record<number, number> = {};
  for (const entry of ranking) {
    const p = entry.position ?? 999;
    countByPos[p] = (countByPos[p] ?? 0) + 1;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#2d2d2d]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#2d2d2d] bg-[#0d0d0d]">
            <th className="px-4 py-3 text-left text-xs font-bold text-[#C8A951] uppercase tracking-wider w-12">
              Pos
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-[#C8A951] uppercase tracking-wider">
              Jogador
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-[#C8A951] uppercase tracking-wider">
              Pts
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-[#C8A951] uppercase tracking-wider hidden sm:table-cell">
              Acertos ✅
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-[#C8A951] uppercase tracking-wider hidden sm:table-cell">
              Sozinho 🎯
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-[#C8A951] uppercase tracking-wider hidden sm:table-cell">
              Palpites 🎲
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, i) => {
            const pos = entry.position ?? i + 1;
            const isTopThree = pos <= 3;
            const isCurrentUser = entry.userId === user?.id;
            const tied = (countByPos[pos] ?? 1) > 1;
            const isPrizeTied = tied && isTopThree;
            const medal = medals[pos];

            return (
              <tr
                key={entry.id}
                className={cn(
                  'border-b border-[#1a1a1a] transition-colors',
                  isTopThree && 'bg-[#C8A951]/5',
                  isCurrentUser && 'bg-[#C8A951]/10 border-l-2 border-l-[#C8A951]',
                  !isTopThree && !isCurrentUser && 'hover:bg-[#1a1a1a]'
                )}
              >
                {/* Posição + medalha */}
                <td className="px-3 py-3 text-center align-middle">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={cn('font-bold', isTopThree ? 'text-xl' : 'text-sm text-gray-400')}>
                      {medal ?? pos}
                    </span>

                  </div>
                </td>

                {/* Jogador */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={entry.user?.avatarUrl}
                      name={entry.user?.nick}
                      size="sm"
                    />
                    <div className="flex flex-col min-w-0">
                      <span
                        className={cn(
                          'font-semibold text-sm truncate',
                          isTopThree ? 'text-[#C8A951]' : 'text-white',
                          isCurrentUser && 'text-[#C8A951]'
                        )}
                      >
                        {entry.user?.nick ?? 'Desconhecido'}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-gray-400">(você)</span>
                        )}
                      </span>
                      {/* Prêmio: mostra sempre para top 3 */}
                      {isTopThree && prizes[pos] && (
                        <span className={cn(
                          "text-[10px] leading-tight font-semibold",
                          tied ? "text-orange-400/80" : "text-[#C8A951]/90"
                        )}>
                          {tied
                            ? `÷ Divide: ${prizes[pos]}`
                            : `🏆 Levando o prêmio ${prizes[pos]} Sozinho`}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Pontos */}
                <td className="px-4 py-3 text-center">
                  <span className={cn('font-black text-base', isTopThree ? 'text-[#C8A951]' : 'text-white')}>
                    {entry.totalPoints}
                  </span>
                </td>

                <td className="px-4 py-3 text-center text-sm text-gray-400 hidden sm:table-cell">
                  {entry.gamesWon ?? 0}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-400 hidden sm:table-cell">
                  {entry.soleWins ?? 0}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-400 hidden sm:table-cell">
                  {entry.totalPredictions ?? 0}
                </td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                Nenhum resultado ainda. 🦅
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
