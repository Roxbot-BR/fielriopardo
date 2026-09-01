'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { ArrowLeft, Trophy, Target, Users } from 'lucide-react';

interface LiveStats {
  elapsed?: string; period?: number; periodLabel?: string; statusType?: string;
  homePossession?: number; awayPossession?: number;
  homeShots?: number; awayShots?: number;
  homeShotsOnTarget?: number; awayShotsOnTarget?: number;
  homeYellow?: number; awayYellow?: number;
  homeRed?: number; awayRed?: number;
  homeCorners?: number; awayCorners?: number;
  homeFouls?: number; awayFouls?: number;
}

interface MatchInfo {
  id: string; homeTeam: string; awayTeam: string;
  homeTeamLogo?: string; awayTeamLogo?: string;
  homeScore: number | null; awayScore: number | null;
  status: string; competition: string;
  roundLabel?: string; roundNumber?: number; season?: string;
  matchDate?: string; stadium?: string; tvChannel?: string; streamUrl?: string;
  externalId?: string;
  matchStats?: LiveStats | null;
}

interface ResultEntry {
  user: { id: string; nick: string; avatarUrl?: string };
  predicted: string; points: number; isSoleWinner: boolean;
}

interface MatchResultData {
  match: MatchInfo; results: ResultEntry[]; winners: number; totalParticipants?: number;
}

interface Player {
  name: string; shortName: string; jersey: string; position: string;
  formationPlace?: number; subbedOut?: boolean; subbedIn?: boolean;
}

interface TeamLineup {
  homeAway: string; teamName: string; teamLogo: string; formation: string;
  starters: Player[]; substitutes: Player[];
}

interface MatchEvent {
  type: string; clock: string; teamId: string; homeTeamId: string; players: string[];
}

interface LiveDetail {
  match: MatchInfo;
  live: { statusType: string; elapsed: string; period: number; periodLabel: string };
  stats: LiveStats | null;
  lineup: TeamLineup[] | null;
  events: MatchEvent[];
}

const COMPETITION_LABELS: Record<string, string> = {
  BRASILEIRAO: 'Brasileirão Série A', COPA_DO_BRASIL: 'Copa do Brasil',
  COPA_BRASIL: 'Copa do Brasil', LIBERTADORES: 'Copa Libertadores',
  SUL_AMERICANA: 'Copa Sul-Americana', SULAMERICANA: 'Copa Sul-Americana',
  PAULISTAO: 'Campeonato Paulista', FRIENDLY: 'Amistoso', AMISTOSO: 'Amistoso',
  OTHER: 'Outro', OUTRO: 'Outro',
};

const ESPN_LOGOS: Record<string, string> = {
  'Corinthians': 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',
  'Internacional': 'https://a.espncdn.com/i/teamlogos/soccer/500/1936.png',
  'Fluminense': 'https://a.espncdn.com/i/teamlogos/soccer/500/3445.png',
  'Flamengo': 'https://a.espncdn.com/i/teamlogos/soccer/500/819.png',
  'Palmeiras': 'https://a.espncdn.com/i/teamlogos/soccer/500/2029.png',
  'São Paulo': 'https://a.espncdn.com/i/teamlogos/soccer/500/2026.png',
  'Santos': 'https://a.espncdn.com/i/teamlogos/soccer/500/2674.png',
  'Grêmio': 'https://a.espncdn.com/i/teamlogos/soccer/500/6273.png',
  'Atlético-MG': 'https://a.espncdn.com/i/teamlogos/soccer/500/7632.png',
  'Cruzeiro': 'https://a.espncdn.com/i/teamlogos/soccer/500/2022.png',
  'Botafogo': 'https://a.espncdn.com/i/teamlogos/soccer/500/6086.png',
  'Vasco': 'https://a.espncdn.com/i/teamlogos/soccer/500/3454.png',
  'Athletico-PR': 'https://a.espncdn.com/i/teamlogos/soccer/500/3458.png',
  'Bragantino': 'https://a.espncdn.com/i/teamlogos/soccer/500/6079.png',
  'Bahia': 'https://a.espncdn.com/i/teamlogos/soccer/500/9967.png',
  'Fortaleza': 'https://a.espncdn.com/i/teamlogos/soccer/500/6832.png',
  'Ceará': 'https://a.espncdn.com/i/teamlogos/soccer/500/6833.png',
  'Juventude': 'https://a.espncdn.com/i/teamlogos/soccer/500/6844.png',
  'Cuiabá': 'https://a.espncdn.com/i/teamlogos/soccer/500/6834.png',
  'Goiás': 'https://a.espncdn.com/i/teamlogos/soccer/500/6082.png',
  'Coritiba': 'https://a.espncdn.com/i/teamlogos/soccer/500/3461.png',
  'América-MG': 'https://a.espncdn.com/i/teamlogos/soccer/500/6836.png',
  'Mirassol': 'https://a.espncdn.com/i/teamlogos/soccer/500/6847.png',
};


const TEAM_ABBREVIATIONS: Record<string, string> = {
  'Corinthians': 'COR',
  'Palmeiras': 'PAL',
  'São Paulo': 'SAO',
  'Santos': 'SAN',
  'Flamengo': 'FLA',
  'Fluminense': 'FLU',
  'Botafogo': 'BOT',
  'Vasco': 'VAS',
  'Cruzeiro': 'CRU',
  'Atlético-MG': 'CAM',
  'Athletico-PR': 'CAP',
  'Internacional': 'INT',
  'Grêmio': 'GRE',
  'Bahia': 'BAH',
  'Fortaleza': 'FOR',
  'Bragantino': 'RBB',
  'Ceará': 'CEA',
  'Juventude': 'JUV',
  'Cuiabá': 'CUI',
  'Goiás': 'GOI',
  'Coritiba': 'CFC',
  'América-MG': 'AME',
  'Mirassol': 'MIR',
};

function abbreviateTeamName(name: string): string {
  const mapped = TEAM_ABBREVIATIONS[name];
  if (mapped) return mapped;
  const letters = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z ]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (letters.length >= 2) return (letters[0][0] + letters[1][0] + (letters[2]?.[0] || letters[1]?.[1] || '')).toUpperCase()
  return (letters[0]?.slice(0, 3) || name.slice(0, 3)).toUpperCase();
}

function TeamLogo({ name, logo, size = 16 }: { name: string; logo?: string; size?: number }) {
  const [err, setErr] = React.useState(false);
  const src = !err ? (logo || ESPN_LOGOS[name] || '') : '';
  const cls = `w-${size} h-${size} object-contain`;
  if (src) return <img src={src} alt={name} className={cls} onError={() => setErr(true)} />;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-[#C8A951]/20 flex items-center justify-center text-[#C8A951] font-black`}>
      {name.charAt(0)}
    </div>
  );
}

interface GroupedResult { predicted: string; players: ResultEntry[]; points: number; }

function StatBar({ label, homeVal, awayVal, suffix = '' }: {
  label: string; homeVal: number; awayVal: number; suffix?: string;
}) {
  const total = homeVal + awayVal || 1;
  const homePct = Math.round((homeVal / total) * 100);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-bold text-white w-12 text-right">{homeVal}{suffix}</span>
      <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-[#2d2d2d]">
        <div className="bg-[#C8A951] rounded-full transition-all" style={{ width: `${homePct}%` }} />
      </div>
      <span className="text-gray-500 text-xs w-24 text-center">{label}</span>
      <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-[#2d2d2d] flex-row-reverse">
        <div className="bg-gray-400 rounded-full transition-all" style={{ width: `${100 - homePct}%` }} />
      </div>
      <span className="font-bold text-white w-12">{awayVal}{suffix}</span>
    </div>
  );
}

const EVENT_PT: Record<string, string> = {
  'Yellow Card': 'Cartão Amarelo',
  'Red Card': 'Cartão Vermelho',
  'Yellow Red Card': 'Cartão Vermelho (2º Amarelo)',
  'Goal': 'Gol',
  'Penalty Goal': 'Gol de Pênalti',
  'Own Goal': 'Gol Contra',
  'Substitution': 'Substituição',
  'Var': 'VAR',
};

function eventLabel(type: string): string {
  return EVENT_PT[type] ?? type;
}

function EventIcon({ type }: { type: string }) {
  if (type === 'Yellow Card') return <span className="inline-block w-3 h-4 bg-yellow-400 rounded-sm flex-shrink-0" />;
  if (type === 'Red Card') return <span className="inline-block w-3 h-4 bg-red-500 rounded-sm flex-shrink-0" />;
  if (type === 'Yellow Red Card') return <span className="inline-block w-3 h-4 bg-red-500 rounded-sm flex-shrink-0" />;
  if (type.includes('Goal')) return <span className="flex-shrink-0">⚽</span>;
  if (type === 'Own Goal') return <span className="text-red-400 flex-shrink-0">⚽</span>;
  if (type === 'Substitution') return <span className="flex-shrink-0">🔄</span>;
  return <span className="flex-shrink-0">📋</span>;
}

function eventPlayersLabel(ev: MatchEvent): string {
  return ev.players.filter(Boolean).join(' → ');
}

function isCardEvent(type: string): boolean {
  return ['Yellow Card', 'Red Card', 'Yellow Red Card'].includes(type);
}

export default function ResultadoPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const [data, setData] = useState<MatchResultData | null>(null);
  const [detail, setDetail] = useState<LiveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'palpites' | 'stats' | 'escalacao'>('palpites');

  const fetchDetail = async () => {
    try {
      const res = await api.get<LiveDetail>(`/matches/${matchId}/live-detail`);
      setDetail(res.data);
    } catch { /* optional */ }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [bolaoRes] = await Promise.all([
          api.get<MatchResultData>(`/bolao/result/${matchId}`),
        ]);
        setData(bolaoRes.data);
        // Fetch detail in parallel
        fetchDetail();
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Auto-refresh every 30s
    const interval = setInterval(async () => {
      try {
        const [bolaoRes] = await Promise.all([
          api.get<MatchResultData>(`/bolao/result/${matchId}`),
        ]);
        setData(prev => {
          if (!prev) return bolaoRes.data;
          const s = bolaoRes.data?.match?.status;
          if (s === 'live' || s === 'scheduled' || s === 'finished') return bolaoRes.data;
          return prev;
        });
        fetchDetail();
      } catch { /* silent */ }
    }, 30000);

    return () => clearInterval(interval);
  }, [matchId]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <PageWrapper glass>
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">Resultado não encontrado.</p>
            <Button variant="outline" onClick={() => router.push('/bolao')}>← Voltar ao Bolão</Button>
          </div>
        </PageWrapper>
        <Footer />
      </>
    );
  }

  const { match, results, winners, totalParticipants: apiTotalParticipants } = data;
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const competitionLabel = COMPETITION_LABELS[match.competition] || match.competition;

  // Use detail data when available (more up-to-date)
  const liveScore = detail?.match ?? match;
  const liveInfo = detail?.live;
  const stats = detail?.stats ?? (match.matchStats as LiveStats | null);
  const lineup = detail?.lineup ?? null;
  const events = detail?.events ?? [];

  // Group palpites
  const grouped: GroupedResult[] = [];
  results.forEach((r) => {
    const existing = grouped.find((g) => g.predicted === r.predicted);
    if (existing) existing.players.push(r);
    else grouped.push({ predicted: r.predicted, players: [r], points: r.points });
  });
  grouped.sort((a, b) => b.points - a.points || a.predicted.localeCompare(b.predicted));

  const totalParticipants = apiTotalParticipants ?? results.length;
  const soleWinners = results.filter((r) => r.isSoleWinner);

  const homeLineup = lineup?.find(l => l.homeAway === 'home');
  const awayLineup = lineup?.find(l => l.homeAway === 'away');
  const cardEvents = events.filter((ev) => isCardEvent(ev.type));
  const homeCardEvents = cardEvents.filter((ev) => ev.teamId === ev.homeTeamId);
  const awayCardEvents = cardEvents.filter((ev) => ev.teamId !== ev.homeTeamId);

  return (
    <>
      <Header />
      <PageWrapper glass>
        {/* Back button */}
        <div className="mb-6">
          <Link href="/bolao" className="flex items-center gap-2 text-gray-400 hover:text-[#C8A951] text-sm transition-colors w-fit">
            <ArrowLeft size={16} /> Voltar ao Bolão
          </Link>
        </div>

        {/* Match header — score, time, events */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl overflow-hidden mb-6">
          {/* Competition + status */}
          <div className={`px-6 py-3 flex items-center justify-between ${isLive ? 'bg-red-900/20 border-b border-red-500/20' : 'border-b border-[#2d2d2d]'}`}>
            <p className="text-[#C8A951] font-semibold text-sm">
              {competitionLabel}
              {match.roundLabel ? ` — Rodada ${match.roundLabel}` : match.roundNumber ? ` — Rodada ${match.roundNumber}` : ''}
              {match.season ? ` ${match.season}` : ''}
            </p>
            <Badge variant={isFinished ? 'red' : isLive ? 'gold' : 'gray'}>
              {isFinished ? '✅ ENCERRADO' : isLive ? '🔴 AO VIVO' : '⏳ AGUARDANDO'}
            </Badge>
          </div>

          {/* Teams + Score */}
          <div className="px-6 py-8">
            {match.matchDate && (
              <p className="text-center text-gray-500 text-xs mb-5">
                {new Date(match.matchDate).toLocaleDateString('pt-BR', {
                  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
                })}
                {match.stadium ? ` • ${match.stadium}` : ''}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 md:gap-10">
              {/* Home team */}
              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                <TeamLogo name={liveScore.homeTeam} logo={liveScore.homeTeamLogo} size={16} />
                <p className="text-white font-bold text-base md:text-lg">
                  <span className="md:hidden">{abbreviateTeamName(liveScore.homeTeam)}</span>
                  <span className="hidden md:inline">{liveScore.homeTeam}</span>
                </p>
                {homeLineup?.formation && <span className="text-xs text-gray-500">{homeLineup.formation}</span>}
              </div>

              {/* Score */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                {(isFinished || isLive) && liveScore.homeScore !== null && liveScore.awayScore !== null ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className={`text-5xl md:text-6xl font-black tabular-nums ${isFinished ? 'text-[#C8A951]' : 'text-[#C8A951]'}`}>
                        {liveScore.homeScore}
                      </span>
                      <span className="text-2xl text-gray-500">×</span>
                      <span className={`text-5xl md:text-6xl font-black tabular-nums ${isFinished ? 'text-[#C8A951]' : 'text-[#C8A951]'}`}>
                        {liveScore.awayScore}
                      </span>
                    </div>
                    {isLive && (
                      <div className="flex flex-col items-center gap-1">
                        {liveInfo?.statusType === 'STATUS_HALF_TIME' ? (
                          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded-full px-3 py-1 text-xs font-bold">⏸ Intervalo</span>
                        ) : (
                          <>
                            <span className="bg-red-500/20 text-red-400 border border-red-500/40 rounded-full px-3 py-1 text-xs font-bold animate-pulse">🔴 AO VIVO</span>
                            {(liveInfo?.periodLabel || liveInfo?.elapsed) && (
                              <span className="text-[#C8A951] text-sm font-bold">
                                {liveInfo?.periodLabel}{liveInfo?.elapsed ? ` · ${liveInfo.elapsed}` : ''}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {isFinished && <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Encerrado</span>}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-black text-gray-600">?</span>
                      <span className="text-2xl text-gray-600">×</span>
                      <span className="text-4xl font-black text-gray-600">?</span>
                    </div>
                    <span className="text-xs text-gray-600">Partida não iniciada</span>
                  </div>
                )}
                {match.tvChannel && (
                  <p className="text-xs text-gray-500 mt-1">
                    📺 {match.streamUrl
                      ? <a href={match.streamUrl} target="_blank" rel="noopener noreferrer" className="text-[#C8A951] hover:underline">{match.tvChannel}</a>
                      : match.tvChannel}
                  </p>
                )}
              </div>

              {/* Away team */}
              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                <TeamLogo name={liveScore.awayTeam} logo={liveScore.awayTeamLogo} size={16} />
                <p className="text-white font-bold text-base md:text-lg">
                  <span className="md:hidden">{abbreviateTeamName(liveScore.awayTeam)}</span>
                  <span className="hidden md:inline">{liveScore.awayTeam}</span>
                </p>
                {awayLineup?.formation && <span className="text-xs text-gray-500">{awayLineup.formation}</span>}
              </div>
            </div>
          </div>

          {/* Events timeline */}
          {events.length > 0 && (
            <div className="border-t border-[#2d2d2d] px-6 py-4">
              <div className="space-y-1.5">
                {events.map((ev, i) => {
                  const isHome = ev.teamId === ev.homeTeamId;
                  const playerNames = eventPlayersLabel(ev);
                  const label = eventLabel(ev.type);
                  return (
                    <div key={i} className={`flex items-center gap-2 text-sm ${isHome ? 'flex-row' : 'flex-row-reverse'}`}>
                      <span className="text-white/50 text-xs w-8 text-center font-mono flex-shrink-0">{ev.clock}</span>
                      <EventIcon type={ev.type} />
                      <span className={`font-medium ${isHome ? 'text-[#C8A951]' : 'text-white/80'}`}>
                        {playerNames || label}
                      </span>
                      {playerNames && (
                        <span className="text-xs text-white/40">{label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-1">
          {([
            { key: 'palpites', label: '🎯 Palpites' },
            { key: 'stats', label: '📊 Estatísticas' },
            { key: 'escalacao', label: '👥 Escalação' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-[#C8A951] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Palpites */}
        {activeTab === 'palpites' && (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Users, label: 'Participantes', value: totalParticipants, color: 'text-blue-400' },
                { icon: Target, label: 'Acertadores', value: winners, color: 'text-[#C8A951]' },
                { icon: Trophy, label: 'Sozinhos', value: soleWinners.length, color: 'text-[#C8A951]' },
              ].map(({ icon: Icon, label, value, color }) => (
                <Card key={label} variant="default">
                  <CardContent className="p-4 text-center">
                    <Icon size={20} className={`${color} mx-auto mb-1`} />
                    <p className={`text-2xl font-black ${color}`}>{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {soleWinners.length > 0 && (
              <Card variant="highlight" className="mb-6">
                <CardContent className="p-5">
                  <h3 className="text-[#C8A951] font-bold mb-3 flex items-center gap-2">
                    ⭐ Acertou Sozinho! <Badge variant="gold">+2 pts</Badge>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {soleWinners.map((r) => (
                      <div key={r.user.id} className="bg-[#C8A951]/10 border border-[#C8A951]/30 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#C8A951]">
                        ⭐ {r.user.nick}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {grouped.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-3">🎯</p>
                  <p>Nenhum palpite registrado ainda.</p>
                </div>
              ) : (
                grouped.map((group) => (
                  <Card key={group.predicted} variant={group.points > 0 ? 'highlight' : 'default'} className={group.points > 0 ? 'border-[#C8A951]/30' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-white">{group.predicted}</span>
                          {group.points > 0 && (
                            <Badge variant="gold">✅ {group.points} pts</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{group.players.length} palpite{group.players.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.players.map((r, i) => (
                          <span key={i} className={`text-sm px-2 py-1 rounded-lg ${
                            r.isSoleWinner ? 'bg-[#C8A951]/20 text-[#C8A951] border border-[#C8A951]/30 font-bold' :
                            r.points > 0 ? 'bg-[#C8A951]/10 text-[#C8A951] border border-[#C8A951]/20' :
                            'bg-[#2d2d2d] text-gray-300'
                          }`}>
                            {r.isSoleWinner ? '⭐ ' : ''}{r.user.nick}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {/* Tab: Estatísticas */}
        {activeTab === 'stats' && (
          <Card variant="default">
            <CardContent className="p-6">
              {!stats ? (
                <p className="text-center text-gray-500 py-8">
                  {isLive ? 'Carregando estatísticas...' : 'Estatísticas não disponíveis para este jogo.'}
                </p>
              ) : (
                <>
                  {/* Team names header */}
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold text-center sm:order-2">Estatísticas</span>
                    <div className="flex items-center justify-between gap-3 sm:flex-1 sm:order-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <TeamLogo name={match.homeTeam} logo={match.homeTeamLogo} size={8} />
                        <span className="font-bold text-white text-xs sm:text-sm leading-tight break-words">{match.homeTeam}</span>
                      </div>
                      <div className="flex min-w-0 items-center justify-end gap-2 text-right">
                        <span className="font-bold text-white text-xs sm:text-sm leading-tight break-words">{match.awayTeam}</span>
                        <TeamLogo name={match.awayTeam} logo={match.awayTeamLogo} size={8} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {stats.homePossession != null && <StatBar label="Posse de Bola" homeVal={stats.homePossession} awayVal={stats.awayPossession ?? 0} suffix="%" />}
                    {stats.homeShots != null && <StatBar label="Chutes" homeVal={stats.homeShots} awayVal={stats.awayShots ?? 0} />}
                    {stats.homeShotsOnTarget != null && <StatBar label="No Alvo" homeVal={stats.homeShotsOnTarget} awayVal={stats.awayShotsOnTarget ?? 0} />}
                    {stats.homeCorners != null && <StatBar label="Escanteios" homeVal={stats.homeCorners} awayVal={stats.awayCorners ?? 0} />}
                    {stats.homeFouls != null && <StatBar label="Faltas" homeVal={stats.homeFouls} awayVal={stats.awayFouls ?? 0} />}
                    {stats.homeYellow != null && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-white w-12 text-right flex items-center justify-end gap-1">
                            {stats.homeYellow} <span className="inline-block w-3 h-4 bg-yellow-400 rounded-sm" />
                            {(stats.homeRed ?? 0) > 0 && <><span className="inline-block w-3 h-4 bg-red-500 rounded-sm" />{stats.homeRed}</>}
                          </span>
                          <span className="flex-1" />
                          <span className="text-gray-500 text-xs w-24 text-center">Cartões</span>
                          <span className="flex-1" />
                          <span className="font-bold text-white w-12 flex items-center gap-1">
                            <span className="inline-block w-3 h-4 bg-yellow-400 rounded-sm" />{stats.awayYellow}
                            {(stats.awayRed ?? 0) > 0 && <><span className="inline-block w-3 h-4 bg-red-500 rounded-sm" />{stats.awayRed}</>}
                          </span>
                        </div>
                        {(homeCardEvents.length > 0 || awayCardEvents.length > 0) && (
                          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                            <div className="space-y-2 rounded-xl border border-[#2d2d2d] bg-[#111] p-3">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#C8A951]">{match.homeTeam}</p>
                              {homeCardEvents.length > 0 ? homeCardEvents.map((ev, i) => (
                                <div key={`home-card-${i}`} className="flex items-center justify-between gap-3 text-xs">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <EventIcon type={ev.type} />
                                    <span className="truncate text-white">{eventPlayersLabel(ev) || eventLabel(ev.type)}</span>
                                  </div>
                                  <span className="shrink-0 font-mono text-white/50">{ev.clock}</span>
                                </div>
                              )) : (
                                <p className="text-xs text-gray-600">Sem cartões.</p>
                              )}
                            </div>
                            <div className="space-y-2 rounded-xl border border-[#2d2d2d] bg-[#111] p-3">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#C8A951]">{match.awayTeam}</p>
                              {awayCardEvents.length > 0 ? awayCardEvents.map((ev, i) => (
                                <div key={`away-card-${i}`} className="flex items-center justify-between gap-3 text-xs">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <EventIcon type={ev.type} />
                                    <span className="truncate text-white">{eventPlayersLabel(ev) || eventLabel(ev.type)}</span>
                                  </div>
                                  <span className="shrink-0 font-mono text-white/50">{ev.clock}</span>
                                </div>
                              )) : (
                                <p className="text-xs text-gray-600">Sem cartões.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Escalação */}
        {activeTab === 'escalacao' && (
          <div>
            {!lineup ? (
              <Card variant="default">
                <CardContent className="p-8 text-center text-gray-500">
                  {isLive ? 'Carregando escalações...' : 'Escalação não disponível.'}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[homeLineup, awayLineup].filter(Boolean).map((team) => team && (
                  <Card key={team.homeAway} variant="default">
                    <CardContent className="p-4">
                      {/* Team header */}
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#2d2d2d]">
                        {team.teamLogo ? (
                          <img src={team.teamLogo} alt={team.teamName} className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#2d2d2d] flex items-center justify-center text-xs font-bold text-white">
                            {team.teamName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white">{team.teamName}</p>
                          {team.formation && <p className="text-xs text-[#C8A951]">{team.formation}</p>}
                        </div>
                      </div>

                      {/* Starters */}
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Titulares</p>
                      <div className="space-y-1 mb-4">
                        {team.starters.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm py-1">
                            <span className="text-gray-500 w-6 text-center font-mono text-xs">{p.jersey}</span>
                            <span className={`flex-1 ${p.subbedOut ? 'line-through text-gray-500' : 'text-white'}`}>{p.shortName}</span>
                            <span className="text-xs text-gray-600 w-8 text-center">{p.position}</span>
                            {p.subbedOut && <span className="text-red-400 text-xs">↓</span>}
                          </div>
                        ))}
                      </div>

                      {/* Substitutes */}
                      {team.substitutes.length > 0 && (
                        <>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Banco</p>
                          <div className="space-y-1">
                            {team.substitutes.map((p, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm py-0.5">
                                <span className="text-gray-600 w-6 text-center font-mono text-xs">{p.jersey}</span>
                                <span className={`flex-1 text-gray-400 text-xs ${p.subbedIn ? 'text-[#C8A951] font-medium' : ''}`}>{p.shortName}</span>
                                <span className="text-xs text-gray-600 w-8 text-center">{p.position}</span>
                                {p.subbedIn && <span className="text-[#C8A951] text-xs">↑</span>}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </PageWrapper>
      <Footer />
    </>
  );
}
