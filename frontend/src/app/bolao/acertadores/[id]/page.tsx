'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import api from '@/lib/api';

interface ResultEntry {
  user: { id: string; nick: string; avatarUrl?: string };
  predicted: string;
  points: number;
  isSoleWinner: boolean;
}

interface MatchInfo {
  id: string; homeTeam: string; awayTeam: string;
  homeTeamLogo?: string; awayTeamLogo?: string;
  homeScore: number | null; awayScore: number | null;
  status: string; competition: string; matchDate?: string;
}

interface MatchResultData {
  match: MatchInfo; results: ResultEntry[]; winners: number; totalParticipants?: number;
}

const ESPN_LOGOS: Record<string, string> = {
  Corinthians: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',
  Fluminense:  'https://a.espncdn.com/i/teamlogos/soccer/500/3445.png',
  Flamengo:    'https://a.espncdn.com/i/teamlogos/soccer/500/819.png',
  Palmeiras:   'https://a.espncdn.com/i/teamlogos/soccer/500/2029.png',
  Internacional: 'https://a.espncdn.com/i/teamlogos/soccer/500/1936.png',
  Platense:    'https://a.espncdn.com/i/teamlogos/soccer/500/5944.png',
  Santos:      'https://a.espncdn.com/i/teamlogos/soccer/500/2674.png',
  'Atletico-MG': 'https://a.espncdn.com/i/teamlogos/soccer/500/7632.png',
};

const COMP_LABELS: Record<string, string> = {
  BRASILEIRAO: 'Brasileirao Serie A', COPA_DO_BRASIL: 'Copa do Brasil',
  LIBERTADORES: 'Copa Libertadores', SUL_AMERICANA: 'Copa Sul-Americana',
  PAULISTAO: 'Campeonato Paulista', OTHER: 'Outro',
};

function TeamLogo({ name, logo }: { name: string; logo?: string }) {
  const [err, setErr] = React.useState(false);
  const src = !err ? (logo || ESPN_LOGOS[name] || '') : '';
  if (src) {
    return <img src={src} alt={name} className="w-12 h-12 object-contain" onError={() => setErr(true)} />;
  }
  return (
    <div className="w-12 h-12 rounded-full bg-[#C8A951]/20 flex items-center justify-center text-[#C8A951] font-black text-xl">
      {name.charAt(0)}
    </div>
  );
}

function Avatar({ nick, avatarUrl }: { nick: string; avatarUrl?: string }) {
  const [err, setErr] = React.useState(false);
  if (avatarUrl && !err) {
    return <img src={avatarUrl} alt={nick} className="w-8 h-8 rounded-full object-cover flex-shrink-0" onError={() => setErr(true)} />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#2d2d2d] flex items-center justify-center text-[#C8A951] font-bold text-sm flex-shrink-0">
      {nick.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AcertadoresPage() {
  const params = useParams();
  const matchId = params.id as string;
  const [data, setData] = useState<MatchResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get<MatchResultData>(`/bolao/result/${matchId}`)
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) return (
    <><Header /><div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div><Footer /></>
  );

  if (error || !data) return (
    <><Header /><PageWrapper glass><p className="text-center text-gray-400 py-16">Resultado nao encontrado.</p></PageWrapper><Footer /></>
  );

  const { match, results, totalParticipants } = data;
  const acertadores = results.filter(r => r.points > 0);
  const soleWinner  = acertadores.find(r => r.isSoleWinner);
  const multiWinners = acertadores.filter(r => !r.isSoleWinner);
  const total = totalParticipants ?? results.length;
  const compLabel = COMP_LABELS[match.competition] || match.competition;

  return (
    <>
      <Header />
      <PageWrapper glass>
        {/* Back row */}
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/bolao/resultado/${matchId}`}
            className="flex items-center gap-2 text-gray-400 hover:text-[#C8A951] text-sm transition-colors">
            <ArrowLeft size={16} /> Ver resultado completo
          </Link>
          <Link href="/bolao/historico" className="text-xs text-gray-500 hover:text-[#C8A951] transition-colors">
            Historico
          </Link>
        </div>

        {/* Match header */}
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-3 border-b border-[#2d2d2d] flex items-center justify-between">
            <p className="text-[#C8A951] font-semibold text-sm">{compLabel}</p>
            {match.matchDate && (
              <p className="text-xs text-gray-500">
                {new Date(match.matchDate).toLocaleDateString('pt-BR', {
                  weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                  timeZone: 'America/Sao_Paulo',
                })}
              </p>
            )}
          </div>
          <div className="px-6 py-6">
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                <TeamLogo name={match.homeTeam} logo={match.homeTeamLogo} />
                <p className="text-white font-bold">{match.homeTeam}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-black text-[#C8A951]">{match.homeScore ?? '?'}</span>
                  <span className="text-2xl text-gray-500">x</span>
                  <span className="text-5xl font-black text-[#C8A951]">{match.awayScore ?? '?'}</span>
                </div>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Encerrado</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                <TeamLogo name={match.awayTeam} logo={match.awayTeamLogo} />
                <p className="text-white font-bold">{match.awayTeam}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card variant="default">
            <CardContent className="p-4 text-center">
              <Users size={20} className="text-blue-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-blue-400">{total}</p>
              <p className="text-xs text-gray-500">Participantes</p>
            </CardContent>
          </Card>
          <Card variant="default">
            <CardContent className="p-4 text-center">
              <Trophy size={20} className="text-[#C8A951] mx-auto mb-1" />
              <p className="text-2xl font-black text-[#C8A951]">{acertadores.length}</p>
              <p className="text-xs text-gray-500">Acertadores</p>
            </CardContent>
          </Card>
        </div>

        {acertadores.length === 0 ? (
          <Card variant="default">
            <CardContent className="p-10 text-center">
              <p className="text-4xl mb-3">🎯</p>
              <p className="text-gray-400">Nenhum participante acertou o placar desta partida.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {soleWinner && (
              <Card variant="highlight" className="border-[#C8A951]/50">
                <CardContent className="p-5">
                  <h3 className="text-[#C8A951] font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                    Acertou Sozinho &mdash; {soleWinner.predicted}
                    <span className="bg-[#C8A951] text-black text-xs font-black px-2 py-0.5 rounded-full ml-1">+2 pts</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <Avatar nick={soleWinner.user.nick} avatarUrl={soleWinner.user.avatarUrl} />
                    <span className="text-white font-bold text-lg">{soleWinner.user.nick}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {multiWinners.length > 0 && (
              <Card variant="highlight" className="border-[#C8A951]/30">
                <CardContent className="p-5">
                  <h3 className="text-[#C8A951] font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 flex-wrap">
                    <span>Acertaram o Placar &mdash; {multiWinners[0].predicted}</span>
                    <span className="bg-[#C8A951]/20 text-[#C8A951] border border-[#C8A951]/30 text-xs font-black px-2 py-0.5 rounded-full">
                      +1 pt cada
                    </span>
                    <span className="ml-auto text-gray-500 font-normal text-xs">
                      {multiWinners.length} participante{multiWinners.length !== 1 ? 's' : ''}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {multiWinners.map((r, i) => (
                      <div key={r.user.id}
                        className="flex items-center gap-3 bg-[#C8A951]/5 border border-[#C8A951]/15 rounded-xl px-4 py-3">
                        <span className="text-gray-600 text-xs font-mono w-5 text-right flex-shrink-0">{i + 1}.</span>
                        <Avatar nick={r.user.nick} avatarUrl={r.user.avatarUrl} />
                        <span className="text-white font-semibold flex-1">{r.user.nick}</span>
                        <span className="text-[#C8A951] text-xs font-bold">+{r.points} pt</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href={`/bolao/resultado/${matchId}`}
            className="text-sm text-gray-500 hover:text-[#C8A951] transition-colors">
            Ver todos os palpites e estatisticas do jogo
          </Link>
        </div>
      </PageWrapper>
      <Footer />
    </>
  );
}
