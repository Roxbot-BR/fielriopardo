'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { RankingTable } from '@/components/RankingTable';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useBolao } from '@/hooks/useBolao';
import api from '@/lib/api';

interface BolaoConfig {
  bolao_prize_first?: string;
  bolao_prize_second?: string;
  bolao_prize_third?: string;
  bolao_tiebreak_criteria?: string;
  bolao_season?: string;
}

export default function RankingPage() {
  const { ranking, isLoading, fetchRanking } = useBolao();
  const [cfg, setCfg] = useState<BolaoConfig>({});

  useEffect(() => {
    fetchRanking();
    api.get<BolaoConfig>('/bolao/config').then(r => setCfg(r.data)).catch(() => {});
  }, [fetchRanking]);

  const season = cfg.bolao_season ?? '2026';
  const prizes = [
    { pos: '🥇', prize: cfg.bolao_prize_first ?? 'R$ 150,00',    label: '1º Lugar', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { pos: '🥈', prize: cfg.bolao_prize_second ?? 'Camisa do Timão', label: '2º Lugar', bg: 'bg-gray-500/10 border-gray-500/30' },
    { pos: '🥉', prize: cfg.bolao_prize_third  ?? 'Kit Corinthians', label: '3º Lugar', bg: 'bg-orange-500/10 border-orange-500/30' },
  ];

  const tiebreakText = cfg.bolao_tiebreak_criteria?.trim() ||
    'Em caso de empate de pontos no 1° prêmio, a premiação será dividida em partes iguais. Para o 2° e 3° prêmio, a decisão fica a cargo dos responsáveis definidos na administração do bolão.';

  return (
    <>
      <Header />
      <PageWrapper glass>
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">🏆 CLASSIFICAÇÃO {season}</h1>
          <p className="text-gray-400">Temporada {season} — Bolão Fiel Rio Pardo</p>
        </div>

        {/* Prêmios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {prizes.map(({ pos, prize, label, bg }) => (
            <Card key={label}>
              <CardContent className={`p-4 text-center rounded-xl border ${bg}`}>
                <div className="text-3xl mb-2">{pos}</div>
                <p className="text-[#C8A951] font-black text-lg">{prize}</p>
                <p className="text-gray-400 text-sm mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Critério de desempate */}
        <Card variant="default" className="mb-6">
          <CardContent className="p-4 text-sm text-gray-400">
            <strong className="text-white">⚖️ Critério de desempate:</strong>{' '}
            <span className="leading-relaxed">{tiebreakText}</span>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <RankingTable
            ranking={ranking}
            prizes={{
              1: cfg.bolao_prize_first  ?? 'R$ 150,00',
              2: cfg.bolao_prize_second ?? 'Camisa do Timão',
              3: cfg.bolao_prize_third  ?? 'Kit Corinthians',
            }}
          />
        )}
      </PageWrapper>
      <Footer />
    </>
  );
}
