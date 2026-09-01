'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MatchCard } from '@/components/MatchCard';
import { RankingTable } from '@/components/RankingTable';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useBolao } from '@/hooks/useBolao';
import type { Match, MatchScore } from '@/types';
import api from '@/lib/api';
import { History, Trophy, Users, TrendingUp, BarChart2 } from 'lucide-react';

interface PredEntry {
  id: string;
  nick: string;
  fullName: string;
  homeScore: number;
  awayScore: number;
}

interface MatchInsights {
  totalPredictions: number;
  topPrediction: string | null;
  topPredictionCount: number;
  topPredictionPct: number;
  distribution: { score: string; count: number; pct: number }[];
  winPct: number;
  drawPct: number;
  lossPct: number;
  aiContext: string | null;
}

interface OddsData {
  found: boolean;
  reason?: string;
  homeWin?: { odd: number; label: string; pct: number };
  draw?: { odd: number; label: string; pct: number };
  awayWin?: { odd: number; label: string; pct: number };
  source?: string;
  updatedAt?: string;
  cacheLabel?: string;
  summary?: string;
}

export default function BolaoPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { ranking, fetchRanking } = useBolao();
  const [openMatch, setOpenMatch] = useState<Match | null>(null);
  const [myScores, setMyScores] = useState<MatchScore[]>([]);
  const [allPreds, setAllPreds] = useState<PredEntry[]>([]);
  const [insights, setInsights] = useState<MatchInsights | null>(null);
  const [odds, setOdds] = useState<OddsData | null>(null);
  const [oddsLoading, setOddsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState<{ bolao_prize_first?: string; bolao_prize_second?: string; bolao_prize_third?: string }>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/bolao/entrar');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        const [matchRes, scoresRes] = await Promise.all([
          api.get<Match | null>('/matches/open'),
          api.get<MatchScore[]>('/bolao/my-scores?limit=5'),
        ]);
        setOpenMatch(matchRes.data);
        setMyScores(scoresRes.data);
        await fetchRanking();
        api.get('/bolao/config').then((r: { data: unknown }) => setCfg(r.data as typeof cfg)).catch(() => {});

        // Show the page immediately after primary data
        setLoading(false);

        if (matchRes.data?.id) {
          const mid = matchRes.data.id;
          // Load secondary cards in parallel, non-blocking
          api.get<PredEntry[]>(`/bolao/predictions/${mid}`)
            .then(r => setAllPreds(r.data || []))
            .catch(() => {});
          api.get<MatchInsights>(`/bolao/insights/${mid}`)
            .then(r => r.data && setInsights(r.data))
            .catch(() => {});
          api.get<OddsData>(`/bolao/odds/${mid}`)
            .then(r => setOdds(r.data))
            .catch(() => setOdds({ found: false, reason: 'Não foi possível buscar odds' }))
            .finally(() => setOddsLoading(false));
        } else {
          setOddsLoading(false);
        }
      } catch {
        setLoading(false); // ensure loading clears on error too
      }
    };
    load();
  }, [isAuthenticated, fetchRanking]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      api.get('/matches/open')
        .then((r) => setOpenMatch(r.data))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated || !user) return null;

  const matchDate = openMatch?.matchDate ? new Date(openMatch.matchDate) : null;

  return (
    <>
      <Header />
      <PageWrapper glass>
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">
            Olá, <span className="text-[#C8A951]">{user.nick}</span>! 🦅
          </h1>
          <p className="text-gray-400 mt-1">Bem-vindo ao Bolão Fiel Rio Pardo</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Open match */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">⚽ Jogo Aberto para Palpite</h2>
              {openMatch ? (
                <div className="space-y-4">
                  {openMatch.bolaoOpen && matchDate && new Date(matchDate) > new Date() && (
                    <CountdownTimer targetDate={matchDate} label="Bolão fecha em:" variant="hero" />
                  )}
                  {!openMatch.bolaoOpen && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
                      <span className="text-red-400 font-bold text-sm">🔒 Bolão Encerrado — Palpites não são mais aceitos</span>
                    </div>
                  )}
                  <MatchCard match={openMatch} showPredictionButton={openMatch.bolaoOpen} />
                </div>
              ) : (
                <Card variant="default">
                  <CardContent className="p-8 text-center">
                    <p className="text-4xl mb-3">⏳</p>
                    <p className="text-gray-400">Nenhum jogo aberto para palpite no momento.</p>
                    <p className="text-gray-600 text-sm mt-1">Fique atento ao próximo jogo do Timão!</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* ODDS Card */}
            {openMatch && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart2 size={18} className="text-[#C8A951]" />
                  Probabilidades
                </h2>
                <Card variant="default">
                  <CardContent className="p-5">
                    {oddsLoading ? (
                      <div className="flex items-center gap-3 py-4">
                        <Spinner size="sm" />
                        <span className="text-gray-400 text-sm">Carregando odds...</span>
                      </div>
                    ) : odds?.found ? (
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-3 text-center">
                            <div className="text-xs text-green-400 font-bold uppercase tracking-wider mb-1 leading-tight">{odds.homeWin?.label}</div>
                            <div className="text-2xl font-black text-white">{odds.homeWin?.odd?.toFixed(2)}</div>
                            <div className="text-xs text-gray-400 mt-1">{odds.homeWin?.pct}% chance</div>
                          </div>
                          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3 text-center">
                            <div className="text-xs text-yellow-400 font-bold uppercase tracking-wider mb-1">Empate</div>
                            <div className="text-2xl font-black text-white">{odds.draw?.odd?.toFixed(2)}</div>
                            <div className="text-xs text-gray-400 mt-1">{odds.draw?.pct}% chance</div>
                          </div>
                          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-center">
                            <div className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1 leading-tight">{odds.awayWin?.label}</div>
                            <div className="text-2xl font-black text-white">{odds.awayWin?.odd?.toFixed(2)}</div>
                            <div className="text-xs text-gray-400 mt-1">{odds.awayWin?.pct}% chance</div>
                          </div>
                        </div>
                        {/* Probability bar */}
                        {odds.homeWin?.pct && odds.draw?.pct && odds.awayWin?.pct && (
                          <div className="flex rounded-full overflow-hidden h-3">
                            <div className="bg-green-500 transition-all" style={{ width: `${odds.homeWin.pct}%` }} title={`Vitória ${odds.homeWin.pct}%`} />
                            <div className="bg-yellow-500 transition-all" style={{ width: `${odds.draw.pct}%` }} title={`Empate ${odds.draw.pct}%`} />
                            <div className="bg-red-500 transition-all" style={{ width: `${odds.awayWin.pct}%` }} title={`Derrota ${odds.awayWin.pct}%`} />
                          </div>
                        )}
                        {odds.summary && (
                          <p className="text-gray-300 text-sm leading-relaxed">{odds.summary}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Fonte: Google</span>
                          {odds.updatedAt && <span>{odds.updatedAt}</span>}
                          {odds.cacheLabel && <span className="text-gray-500">· atualizado {odds.cacheLabel}</span>}
                        </div>
                        <p className="text-xs text-gray-600 italic">⚠️ Odds obtidas em tempo real via busca na web. Valores podem variar. Não constituem recomendação de apostas.</p>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-gray-500 text-sm">{odds?.reason || 'Odds não disponíveis para este jogo no momento.'}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Match Insights Card */}
            {openMatch && insights && insights.totalPredictions > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#C8A951]" />
                  Curiosidades do Bolão
                </h2>
                <Card variant="default">
                  <CardContent className="p-5 flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 bg-[#C8A951]/10 border border-[#C8A951]/30 rounded-xl p-4 text-center">
                        <div className="text-xs text-[#C8A951] font-bold uppercase tracking-wider mb-1">Palpite Mais Votado</div>
                        <div className="text-3xl font-black text-white">{insights.topPrediction}</div>
                        <div className="text-sm text-gray-400 mt-1">{insights.topPredictionCount} voto{insights.topPredictionCount !== 1 ? 's' : ''} · {insights.topPredictionPct}%</div>
                      </div>
                      <div className="flex-1 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">O Bolão aposta em...</div>
                        <div className="flex justify-between text-sm">
                          <div className="text-center">
                            <div className="text-green-400 font-black text-xl">{insights.winPct}%</div>
                            <div className="text-gray-500 text-xs">Vitória Corinthians</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-400 font-black text-xl">{insights.drawPct}%</div>
                            <div className="text-gray-500 text-xs">Empate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 font-black text-xl">{insights.lossPct}%</div>
                            <div className="text-gray-500 text-xs">Derrota</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Distribuição dos Palpites</div>
                      <div className="flex flex-col gap-2">
                        {insights.distribution.map((d) => (
                          <div key={d.score} className="flex items-center gap-3">
                            <div className="w-14 text-right text-white font-bold text-sm">{d.score}</div>
                            <div className="flex-1 bg-[#1a1a1a] rounded-full h-5 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#C8A951] to-[#8B6914] rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                            </div>
                            <div className="w-16 text-gray-400 text-xs">{d.count}x · {d.pct}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {insights.aiContext && (
                      <div className="border-t border-[#2d2d2d] pt-4">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">📚 Contexto do Confronto</div>
                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{insights.aiContext}</div>
                        <div className="mt-2 text-xs text-gray-600 italic">⚠️ Contexto baseado em dados históricos. Odds em tempo real são exibidas no card acima.</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* All predictions transparency */}
            {openMatch && allPreds.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-[#C8A951]" />
                  Palpites dos Participantes
                  <span className="ml-2 text-xs font-normal bg-[#C8A951]/10 text-[#C8A951] px-2 py-0.5 rounded-full">
                    {allPreds.length} palpite{allPreds.length !== 1 ? 's' : ''}
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allPreds.map((p) => (
                    <div key={p.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{p.nick}</div>
                      </div>
                      <div className="text-[#C8A951] font-black text-base whitespace-nowrap">{p.homeScore} × {p.awayScore}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* My scores */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">📋 Meus Últimos Palpites</h2>
                <Link href="/bolao/historico" className="text-xs text-[#C8A951] hover:underline flex items-center gap-1">
                  <History size={12} /> Ver histórico
                </Link>
              </div>
              {myScores.length === 0 ? (
                <Card variant="default">
                  <CardContent className="p-6 text-center text-gray-500">
                    Você ainda não tem palpites registrados.
                  </CardContent>
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#2d2d2d]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0d0d0d]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs text-[#C8A951] font-bold uppercase">Jogo</th>
                        <th className="px-4 py-3 text-center text-xs text-[#C8A951] font-bold uppercase">Palpite</th>
                        <th className="px-4 py-3 text-center text-xs text-[#C8A951] font-bold uppercase">Resultado</th>
                        <th className="px-4 py-3 text-center text-xs text-[#C8A951] font-bold uppercase">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myScores.map((score) => (
                        <tr key={score.id} className="border-t border-[#1a1a1a]">
                          <td className="px-4 py-3 text-gray-300">
                            <Link href={`/bolao/resultado/${score.matchId}`} className="hover:text-[#C8A951] font-medium block">
                              {score.match
                                ? `${score.match.homeTeam} x ${score.match.awayTeam}`
                                : `Jogo #${score.matchId.slice(0, 8)}`}
                            </Link>
                            {score.match && (
                              <span className="text-xs text-gray-500 block leading-tight mt-0.5">
                                {score.match.competition === 'BRASILEIRAO' ? 'Brasileirão' :
                                 score.match.competition === 'COPA_DO_BRASIL' ? 'Copa do Brasil' :
                                 score.match.competition === 'COPA_BRASIL' ? 'Copa do Brasil' :
                                 score.match.competition === 'LIBERTADORES' ? 'Libertadores' :
                                 score.match.competition === 'PAULISTAO' ? 'Paulistão' :
                                 score.match.competition}
                                {score.match.roundLabel
                                  ? ' — ' + score.match.roundLabel
                                  : score.match.roundNumber
                                  ? ' — Rodada ' + score.match.roundNumber
                                  : ''}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-300">
                            {score.predictedHome} × {score.predictedAway}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-300">
                            {score.actualHome ?? '?'} × {score.actualAway ?? '?'}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-[#C8A951]">
                            +{score.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar: ranking */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy size={20} className="text-[#C8A951]" />
                Ranking
              </h2>
              <Link href="/bolao/ranking" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Ver completo →</Link>
            </div>
            <RankingTable
              ranking={ranking}
              limit={10}
              prizes={{
                1: cfg.bolao_prize_first  ?? 'R$ 150,00',
                2: cfg.bolao_prize_second ?? 'Camisa do Timão',
                3: cfg.bolao_prize_third  ?? 'Kit Corinthians',
              }}
            />
          </div>
        </div>
      </PageWrapper>
      <Footer />
    </>
  );
}
