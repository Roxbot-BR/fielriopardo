'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Tabs from '@radix-ui/react-tabs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StandingsCard } from '@/components/StandingsCard';
import { Spinner } from '@/components/ui/Spinner';
import type { Match } from '@/types';
import api from '@/lib/api';
import { MapPin, Tv, Radio, Trophy, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Channel → URL mapping for clickable broadcast links
const CHANNEL_URLS: Record<string, string> = {
  'ESPN':                'https://www.disneyplus.com',
  'ESPN Brasil':         'https://www.disneyplus.com',
  'Disney+':             'https://www.disneyplus.com',
  'Amazon Prime Video':  'https://www.primevideo.com',
  'Premiere':            'https://premiere.globo.com',
  'SporTV':              'https://ge.globo.com/sportv/',
  'TV Globo':            'https://globoplay.globo.com',
  'Globoplay':           'https://globoplay.globo.com',
  'Paramount+':          'https://www.paramountplus.com',
  'CONMEBOL TV':         'https://conmeboltv.com.br',
  'Cazé TV':             'https://www.youtube.com/@CazeTV/live',
  'Caze TV':             'https://www.youtube.com/@CazeTV/live',
  'CazéTV':              'https://www.youtube.com/@CazeTV/live',
  'SBT':                 'https://www.sbt.com.br/ao-vivo',
  'RecordTV':            'https://www.r7.com/recordtv',
  'TV Band':             'https://www.band.uol.com.br/ao-vivo',
  'YouTube':             'https://www.youtube.com/@Corinthians/live',
  'GOAT':                'https://www.youtube.com/@CanalGOAT/live',
  'GeTV':              'https://ge.globo.com',
  'Record':            'https://www.r7.com/recordtv',
  'Globo':             'https://globoplay.globo.com',
};

// ── Competition static data ────────────────────────────────────────
const COMPETITIONS = [
  {
    key: 'BRASILEIRAO',
    name: 'Brasileirão Série A',
    year: '2026',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282024%29.svg/120px-Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282024%29.svg.png',
    status: 'in_progress' as const,
    statusLabel: 'EM ANDAMENTO',
    round: 10,
    totalRounds: 38,
    corinthiansPosition: null,
    color: '#009933',
    details: {
      format: '20 clubes · todos contra todos ida e volta (38 rodadas)',
      note: 'Rodada 10 de 38 em andamento',
    },
  },
  {
    key: 'COPA_DO_BRASIL',
    name: 'Copa do Brasil',
    year: '2026',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Copa_do_Brasil_logo_%282018%29.svg/120px-Copa_do_Brasil_logo_%282018%29.svg.png',
    status: 'in_progress' as const,
    statusLabel: 'EM ANDAMENTO',
    color: '#009933',
    details: {
      phase: '5ª Fase — Oitavas de Final',
      opponent: 'Barra-SC',
      opponentLogo: 'https://static.wixstatic.com/media/aa1d18_e0f8a3725151416ea1728e0814fedccf~mv2.png',
      corinthiansLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',
      note: 'Série A entra direto na 5ª fase · Confronto definido vs Barra-SC',
      groupMatches: [
        { round: 'Jogo de Ida',   date: '21/04/2026 · 21h30', match: 'Barra-SC × Corinthians', venue: 'Est. Ressacada · Florianópolis-SC', home: false,
          homeLogo: 'https://static.wixstatic.com/media/aa1d18_e0f8a3725151416ea1728e0814fedccf~mv2.png',
          awayLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png' },
        { round: 'Jogo de Volta', date: '14/05/2026 · 19h30', match: 'Corinthians × Barra-SC',  venue: 'Neo Química Arena · SP', home: true,
          homeLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',
          awayLogo: 'https://static.wixstatic.com/media/aa1d18_e0f8a3725151416ea1728e0814fedccf~mv2.png' },
      ],
      format: 'Eliminatória mata-mata · ida e volta · Times Série A entram na 5ª fase',
    },
  },
  {
    key: 'LIBERTADORES',
    name: 'Copa Libertadores',
    year: '2026',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a1/Copa_Libertadores_logo.svg/120px-Copa_Libertadores_logo.svg.png',
    status: 'in_progress' as const,
    statusLabel: 'EM ANDAMENTO',
    color: '#FFD700',
    details: {
      phase: 'Fase de Grupos',
      group: 'Grupo E',
      rivals: 'Peñarol (URU) · Santa Fe (COL) · Platense (ARG)',
      note: 'Fase de grupos iniciada · Sorteio: 19/03/2026 · Final: 28/11/2026 em Montevidéu',
      groupStandings: [
        { pos: 1, team: 'Corinthians', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',   country: '🇧🇷', pts: 11, j: 6, v: 3, e: 2, d: 1, gp: 8, gc: 4, sg: 4, highlight: true },
        { pos: 2, team: 'Platense',    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/7764.png',  country: '🇦🇷', pts: 10, j: 6, v: 3, e: 1, d: 2, gp: 8, gc: 7, sg: 1, highlight: false },
        { pos: 3, team: 'Santa Fe',    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/5488.png',  country: '🇨🇴', pts: 8,  j: 6, v: 2, e: 2, d: 2, gp: 6, gc: 7, sg: -1, highlight: false },
        { pos: 4, team: 'Peñarol',     logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2683.png',  country: '🇺🇾', pts: 3,  j: 6, v: 0, e: 3, d: 3, gp: 4, gc: 8, sg: -4, highlight: false },
      ],
      groupMatches: [
        { round: 'R1', date: '09/04 · 21h',    match: 'Platense × Corinthians', venue: 'Buenos Aires, ARG', home: false,
          homeLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/7764.png', awayLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png' },
        { round: 'R2', date: '15/04 · 21h30',  match: 'Corinthians × Santa Fe', venue: 'Neo Química Arena', home: true,
          homeLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png', awayLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/5488.png' },
        { round: 'R3', date: '30/04 · 21h',    match: 'Corinthians × Peñarol', venue: 'Neo Química Arena', home: true,
          homeLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png', awayLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2683.png' },
        { round: 'R4', date: '06/05 · 21h30',  match: 'Santa Fe × Corinthians', venue: 'Bogotá, COL', home: false,
          homeLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/5488.png', awayLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png' },
        { round: 'R5', date: '21/05 · 21h30',  match: 'Peñarol × Corinthians', venue: 'Montevidéu, URU', home: false,
          homeLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2683.png', awayLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png' },
        { round: 'R6', date: '27/05 · 21h30',  match: 'Corinthians × Platense', venue: 'Neo Química Arena', home: true,
          homeLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png', awayLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/7764.png' },
      ],
      format: '8 grupos · 2 primeiros avançam · Oitavas: Ago · Final: 28/11 Montevidéu',
    },
  },
  {
    key: 'PAULISTAO',
    name: 'Campeonato Paulista',
    year: '2026',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/1/1c/Paulist%C3%A3o_2026.png/120px-Paulist%C3%A3o_2026.png',
    status: 'finished' as const,
    statusLabel: 'ENCERRADO',
    color: '#C8A951',
    details: {
      corinthiansResult: '3º lugar — Eliminado nas Semifinais',
      champion: 'Palmeiras',
      viceChampion: 'Novorizontino',
      final: 'Palmeiras 3×1 Novorizontino (agregado) · 08/03/2026',
      semifinal: 'Novorizontino 1×0 Corinthians · 28/02/2026 (Novo Horizonte)',
      topScorer: 'Memphis Depay (destaque do Corinthians no torneio)',
      finalStandings: [
        { pos: 1, team: 'Palmeiras',     logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2029.png',    label: '🏆 Campeão',  highlight: false },
        { pos: 2, team: 'Novorizontino', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Gr%C3%AAmio_Novorizontino.svg/120px-Gr%C3%AAmio_Novorizontino.svg.png',  label: 'Vice-campeão', highlight: false },
        { pos: 3, team: 'Corinthians',   logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',   label: '3º lugar',    highlight: true },
        { pos: 4, team: 'Portuguesa',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Portuguesa_de_Desportos-1990.svg/120px-Portuguesa_de_Desportos-1990.svg.png',  label: '4º lugar',    highlight: false },
      ],
      corinthiansHighlights: [
        'Memphis Depay foi o principal atacante corintiano no torneio',
        'Corinthians eliminou a Portuguesa nos pênaltis nas quartas de final',
        'Eliminação na semifinal pelo Novorizontino — gol de Mayk no 2º tempo',
      ],
      curiosities: [
        'Novorizontino chegou à sua 1ª final de Campeonato Paulista na história',
        'Palmeiras sagrou-se campeão pelo 27º título estadual (5° desde 2020)',
        'Final: Palmeiras 1×0 na ida (Arena Barueri) e 2×1 na volta (Novo Horizonte)',
        'Gol de Mayk no segundo tempo foi o que eliminou o Corinthians da semi',
      ],
    },
  },
  {
    key: 'OUTRO',
    name: 'Supercopa do Brasil',
    year: '2026',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Supercopa_Rei_logo_%282023%29.svg/120px-Supercopa_Rei_logo_%282023%29.svg.png',
    status: 'finished' as const,
    statusLabel: '🏆 CAMPEÃO',
    color: '#C8A951',
    details: {
      champion: 'Corinthians',
      final: 'Corinthians 2×0 Flamengo · 01/02/2026 · Arena BRB Mané Garrincha',
      corinthiansResult: 'CAMPEÃO — 2º título da história (1991 e 2026)',
      corinthiansHighlights: [
        'Gols de Gabriel Paulista (25\') e Yuri Alberto (51\'+)',
        'Flamengo ficou com 10 jogadores após expulsão de Carrascal no intervalo',
        'Recorde de público na Arena BRB Mané Garrincha: 71.244 torcedores',
        '2º título da Supercopa na história do Corinthians (1991 e 2026)',
      ],
    },
  },
];
function MatchRow({ match }: { match: Match }) {
  const date = new Date(match.matchDate);
  const isCorinthiansHome = match.homeTeam?.toLowerCase().includes('corinthians');
  return (
    <div className="bg-[#0d0d0d] border border-[#2d2d2d] rounded-xl p-4 hover:border-[#C8A951]/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="shrink-0 text-center sm:w-28">
          <p className="text-[10px] text-[#C8A951] font-bold uppercase tracking-wider">
            {match.roundLabel || match.competition?.replace('_', ' ')}
          </p>
          <p className="text-sm font-bold text-white mt-0.5">
            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-xs text-gray-400">
            {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between sm:justify-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1.5">
              {match.homeTeamLogo && <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-5 h-5 object-contain" />}
              <span className={`text-base font-bold ${isCorinthiansHome ? 'text-[#C8A951]' : 'text-white'}`}>
                {match.homeTeam}
              </span>
            </div>
            {match.status === 'finished' ? (
              <span className="text-lg font-black text-white">{match.homeScore} × {match.awayScore}</span>
            ) : (
              <span className="text-lg font-black text-gray-500">×</span>
            )}
            <div className="flex items-center gap-1.5">
              <span className={`text-base font-bold ${!isCorinthiansHome ? 'text-[#C8A951]' : 'text-white'}`}>
                {match.awayTeam}
              </span>
              {match.awayTeamLogo && <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-5 h-5 object-contain" />}
            </div>
          </div>
        </div>
        <div className="sm:w-48 space-y-1">
          {match.stadium && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin size={11} /><span className="truncate">{match.stadium}{match.city ? ` · ${match.city}` : ''}</span>
            </div>
          )}
          {match.tvChannel && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <Tv size={11} className="text-gray-500 flex-shrink-0" />
              {match.tvChannel.split(/\s*\/\s*/).map((ch: string, i: number) => {
                const trimmed = ch.trim();
                const broadcastUrls = (match as any).matchStats?.broadcastUrls;
                const url = broadcastUrls?.[trimmed] || CHANNEL_URLS[trimmed];
                return (
                  <span key={trimmed}>
                    {i > 0 && <span className="text-gray-600 mx-0.5">·</span>}
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer"
                         className="text-yellow-400 hover:text-yellow-300 underline underline-offset-2 transition-colors">
                        {trimmed}
                      </a>
                    ) : (
                      <span className="text-gray-400">{trimmed}</span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
          {match.radioUrl && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Radio size={11} />
              <a href={match.radioUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#C8A951] transition-colors truncate">
                Rádio Coringão
              </a>
            </div>
          )}
        </div>
      </div>
      {match.status === 'finished' && (
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-[#2d2d2d]">
          <Link href={`/bolao/resultado/${match.id}`} className="text-xs text-gray-500 hover:text-[#C8A951] transition-colors">
            Resultado do Bolão
          </Link>
          <Link href={`/bolao/acertadores/${match.id}`} className="text-xs text-[#C8A951] font-semibold hover:underline">
            🏆 Acertadores
          </Link>
        </div>
      )}
    </div>
  );
}

// ── CompetitionCard component ─────────────────────────────────────
function CompetitionCard({ comp, matches, standings, fullStandings }: {
  comp: typeof COMPETITIONS[number];
  matches: Match[];
  standings: { position: number; points: number; games: number; wins: number; draws: number; losses: number } | null;
  fullStandings?: any[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [showFullTable, setShowFullTable] = useState(false);

  const statusConfig = {
    in_progress: { icon: <Clock size={12} />, bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    upcoming:    { icon: <AlertCircle size={12} />, bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    finished:    { icon: <CheckCircle size={12} />, bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  };
  const sc = statusConfig[comp.status];

  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'live').slice(0, 3);
  const recentMatches = matches.filter(m => m.status === 'finished').slice(0, 3);

  return (
    <div className="bg-[#111111] border border-[#2d2d2d] rounded-2xl overflow-hidden hover:border-[#C8A951]/20 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b border-[#2d2d2d]">
        <div className="w-14 h-14 rounded-xl bg-[#1a1a1a] border border-[#2d2d2d] flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={comp.logo}
            alt={comp.name}
            className="w-12 h-12 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-bold text-lg leading-tight">{comp.name}</h3>
            <span className="text-gray-500 text-sm">{comp.year}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${sc.bg} ${sc.text} ${sc.border}`}>
              {sc.icon}{comp.statusLabel}
            </span>
            {comp.status === 'in_progress' && comp.round && (
              <span className="text-xs text-gray-500">Rodada {comp.round}/{comp.totalRounds}</span>
            )}
          </div>
        </div>
        {/* Corinthians position badge */}
        {comp.status === 'in_progress' && standings && (
          <div className="text-center shrink-0">
            <p className="text-3xl font-black text-[#C8A951]">{standings.position}º</p>
            <p className="text-xs text-gray-500">{standings.points} pts</p>
            <p className="text-[10px] text-gray-600">{standings.games} jogos</p>
          </div>
        )}
        {comp.status === 'finished' && comp.key === 'PAULISTAO' && (
          <div className="text-center shrink-0">
            <p className="text-2xl font-black text-gray-400">3º</p>
            <p className="text-xs text-gray-500">Lugar</p>
          </div>
        )}
        {comp.key === 'OUTRO' && (
          <div className="flex items-center gap-2 shrink-0">
            <img src="https://a.espncdn.com/i/teamlogos/soccer/500/874.png" alt="Corinthians" className="w-10 h-10 object-contain" />
            <img src="https://a.espncdn.com/i/teamlogos/soccer/500/819.png" alt="Flamengo" className="w-8 h-8 object-contain opacity-60" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Brasileirao: mini standings table + matches */}
        {comp.key === 'BRASILEIRAO' && (
          <>
            {/* Mini standings table */}
            {fullStandings && fullStandings.length > 0 && standings && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Classificação</p>
                <div className="rounded-xl overflow-hidden border border-[#2d2d2d]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#1a1a1a] text-gray-500 uppercase tracking-wide">
                        <th className="px-3 py-1.5 text-left w-8">Pos</th>
                        <th className="px-3 py-1.5 text-left">Time</th>
                        <th className="px-2 py-1.5 text-center">J</th>
                        <th className="px-2 py-1.5 text-center">Pts</th>
                        <th className="px-2 py-1.5 text-center hidden sm:table-cell">V</th>
                        <th className="px-2 py-1.5 text-center hidden sm:table-cell">E</th>
                        <th className="px-2 py-1.5 text-center hidden sm:table-cell">D</th>
                        <th className="px-2 py-1.5 text-center hidden sm:table-cell">SG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const coriIdx = fullStandings.findIndex((s: any) => s.team?.toLowerCase().includes('corinthians'));
                        const coriPos = coriIdx >= 0 ? coriIdx : 0;
                        // 2 above, corinthians, 2 below (clamped to array bounds)
                        const startIdx = Math.max(0, Math.min(coriPos - 2, fullStandings.length - 5));
                        const endIdx = Math.min(fullStandings.length, startIdx + 5);
                        const slicedRows: any[] = showFullTable ? fullStandings : fullStandings.slice(startIdx, endIdx);
                        return slicedRows.map((s: any, idx: number) => {
                          const isCori = s.team?.toLowerCase().includes('corinthians');
                          // Show separator dots between row above slice and slice start
                          const showTopDots = !showFullTable && idx === 0 && startIdx > 0;
                          const showBottomDots = !showFullTable && idx === slicedRows.length - 1 && endIdx < fullStandings.length;
                          return (
                            <React.Fragment key={s.position}>
                              {showTopDots && (
                                <tr className="border-t border-[#2d2d2d]">
                                  <td colSpan={8} className="px-3 py-1 text-center text-gray-600 text-[10px]">· · ·</td>
                                </tr>
                              )}
                              <tr className={`border-t border-[#2d2d2d] ${isCori ? 'bg-[#C8A951]/10 border-[#C8A951]/30' : 'hover:bg-[#1a1a1a]/50'}`}>
                                <td className={`px-3 py-2 font-bold ${isCori ? 'text-[#C8A951]' : 'text-gray-400'}`}>{s.position}</td>
                                <td className={`px-3 py-2 font-medium ${isCori ? 'text-[#C8A951] font-black' : 'text-white'}`}><div className="flex items-center gap-1.5">{s.logo && <img src={s.logo} alt={s.team} className="w-4 h-4 object-contain shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />}{s.team}</div></td>
                                <td className="px-2 py-2 text-center text-gray-300">{s.games}</td>
                                <td className={`px-2 py-2 text-center font-bold ${isCori ? 'text-[#C8A951]' : 'text-white'}`}>{s.points}</td>
                                <td className="px-2 py-2 text-center text-gray-400 hidden sm:table-cell">{s.wins}</td>
                                <td className="px-2 py-2 text-center text-gray-400 hidden sm:table-cell">{s.draws}</td>
                                <td className="px-2 py-2 text-center text-gray-400 hidden sm:table-cell">{s.losses}</td>
                                <td className="px-2 py-2 text-center text-gray-400 hidden sm:table-cell">{s.goalDiff > 0 ? '+' : ''}{s.goalDiff}</td>
                              </tr>
                              {showBottomDots && (
                                <tr className="border-t border-[#2d2d2d]">
                                  <td colSpan={8} className="px-3 py-1 text-center text-gray-600 text-[10px]">· · ·</td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() => setShowFullTable(v => !v)}
                  className="mt-2 flex items-center gap-1 text-xs text-[#C8A951] hover:text-[#C8A951]/80 transition-colors font-medium"
                >
                  {showFullTable ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showFullTable ? 'Recolher tabela' : 'Exibir classificação completa'}
                </button>
              </div>
            )}
            {upcomingMatches.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Próximos Jogos</p>
                <div className="space-y-2">
                  {upcomingMatches.map(m => <MatchRow key={m.id} match={m} />)}
                </div>
              </div>
            )}
            {recentMatches.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Últimos Resultados</p>
                <div className="space-y-2">
                  {recentMatches.map(m => <MatchRow key={m.id} match={m} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Copa do Brasil / Libertadores: match schedule only (standings are in sidebar) */}
        {(comp.key === 'COPA_DO_BRASIL' || comp.key === 'LIBERTADORES') && (
          <div className="space-y-4">
            {'phase' in comp.details && (
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-[#C8A951] shrink-0" />
                <span className="text-sm text-white font-medium">{(comp.details as any).phase}</span>
                {'group' in comp.details && (comp.details as any).group && (
                  <span className="text-xs font-black text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 rounded px-2 py-0.5 ml-1">{(comp.details as any).group}</span>
                )}
              </div>
            )}
            {'note' in comp.details && (
              <p className="text-xs text-gray-500">{(comp.details as any).note}</p>
            )}

            {/* Match schedule with logos */}
            {'groupMatches' in comp.details && (comp.details as any).groupMatches?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
                  {comp.key === 'LIBERTADORES' ? 'Calendário — Fase de Grupos' : 'Confronto — Ida e Volta'}
                </p>
                <div className="space-y-1.5">
                  {(comp.details as any).groupMatches.map((gm: any, i: number) => (
                    <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border ${gm.home ? 'bg-[#C8A951]/5 border-[#C8A951]/20' : 'bg-[#111] border-[#2d2d2d]'}`}>
                      <span className="text-[10px] font-bold text-gray-500 w-8 shrink-0">{gm.round}</span>
                      <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                        {gm.homeLogo && <img src={gm.homeLogo} alt="" className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />}
                        <p className={`text-xs font-medium truncate ${gm.home ? 'text-[#C8A951]' : 'text-white'}`}>{gm.match}</p>
                        {gm.awayLogo && <img src={gm.awayLogo} alt="" className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-gray-500">{gm.date}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${gm.home ? 'bg-[#C8A951]/20 text-[#C8A951]' : 'bg-gray-700/50 text-gray-400'}`}>
                          {gm.home ? 'CASA' : 'FORA'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matches from DB */}
            {upcomingMatches.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Próximos Jogos</p>
                <div className="space-y-2">
                  {upcomingMatches.map(m => <MatchRow key={m.id} match={m} />)}
                </div>
              </div>
            )}
            {recentMatches.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Últimos Resultados</p>
                <div className="space-y-2">
                  {recentMatches.map(m => <MatchRow key={m.id} match={m} />)}
                </div>
              </div>
            )}

            {'format' in comp.details && (
              <p className="text-xs text-gray-600 border-t border-[#2d2d2d] pt-2">{(comp.details as any).format}</p>
            )}
          </div>
        )}

        {/* Paulistao: finished details (standings are in sidebar) */}
        {comp.key === 'PAULISTAO' && 'champion' in comp.details && (
          <div className="space-y-4">
            {/* Key results */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide mb-1">Final</p>
                <p className="text-sm text-white font-medium">{comp.details.final}</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide mb-1">Semifinal do Timão</p>
                <p className="text-sm text-white font-medium">{comp.details.semifinal}</p>
              </div>
            </div>

            {/* Corinthians performance */}
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">🦅 Destaques Corintianos</p>
              <ul className="space-y-1.5">
                {(comp.details.corinthiansHighlights ?? []).map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-[#C8A951] mt-0.5 shrink-0">•</span>{h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Artilheiro */}
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2">
              <span className="text-lg">⚽</span>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Artilheiro do Torneio</p>
                <p className="text-sm text-white font-medium">{comp.details.topScorer}</p>
              </div>
            </div>

            {/* Curiosidades toggle */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-2 text-xs text-[#C8A951] hover:text-[#C8A951]/80 transition-colors font-medium"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Curiosidades
            </button>
            {expanded && (
              <ul className="space-y-1.5 pt-1">
                {(comp.details.curiosities ?? []).map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="text-gray-600 mt-0.5 shrink-0">💡</span>{c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {/* Supercopa / OUTRO: champion details */}
        {comp.key === 'OUTRO' && 'champion' in comp.details && (
          <div className="space-y-4">
            {/* Champion banner */}
            <div className="flex items-center gap-3 bg-[#C8A951]/10 border border-[#C8A951]/30 rounded-xl p-4">
              <img src="https://a.espncdn.com/i/teamlogos/soccer/500/874.png" alt="Corinthians" className="w-12 h-12 object-contain shrink-0" />
              <div>
                <p className="text-[10px] text-[#C8A951] uppercase font-bold tracking-wide">🏆 CAMPEÃO DA SUPERCOPA DO BRASIL 2026</p>
                <p className="text-white font-black text-2xl">Corinthians</p>
                <p className="text-xs text-gray-400 mt-0.5">{comp.details.corinthiansResult}</p>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">🦅 Destaques</p>
              <ul className="space-y-1.5">
                {(comp.details.corinthiansHighlights ?? []).map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-[#C8A951] mt-0.5 shrink-0">•</span>{h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Match from DB */}
            {recentMatches.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Resultado</p>
                <div className="space-y-2">
                  {recentMatches.map(m => <MatchRow key={m.id} match={m} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CompetitionsSidebar() {
  return (
    <div className="space-y-6">
      {COMPETITIONS.map(comp => {
        let card: React.ReactNode = null;

        if (comp.key === 'BRASILEIRAO') {
          card = <StandingsCard compact />;
        } else if (comp.key === 'LIBERTADORES') {
          const gs = (comp.details as any)?.groupStandings;
          if (gs) card = (
            <div className="bg-[#111111] border border-[#2d2d2d] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2d2d]">
                <img src={comp.logo} alt="Libertadores" className="w-8 h-8 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div>
                  <p className="text-white font-bold text-sm">Libertadores 2026</p>
                  <p className="text-[10px] text-[#FFD700] font-bold uppercase tracking-wide">Grupo E — Classificação</p>
                </div>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#1a1a1a] text-gray-500 uppercase tracking-wide text-[10px]">
                    <th className="px-3 py-2 text-left w-6">#</th>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-2 py-2 text-center">J</th>
                    <th className="px-2 py-2 text-center font-bold text-white">Pts</th>
                    <th className="px-2 py-2 text-center">V</th>
                    <th className="px-2 py-2 text-center">E</th>
                    <th className="px-2 py-2 text-center">D</th>
                    <th className="px-2 py-2 text-center">SG</th>
                  </tr>
                </thead>
                <tbody>
                  {gs.map((s: any) => (
                    <tr key={s.pos} className={`border-t border-[#2d2d2d] ${s.highlight ? 'bg-[#C8A951]/10' : 'hover:bg-[#1a1a1a]/60'}`}>
                      <td className={`px-3 py-2 font-bold text-center text-[10px] ${s.highlight ? 'text-[#C8A951]' : s.pos <= 2 ? 'text-[#FFD700]' : 'text-gray-600'}`}>{s.pos}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <img src={s.logo} alt={s.team} className="w-5 h-5 object-contain shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                          <span className={`font-medium truncate ${s.highlight ? 'text-[#C8A951] font-black' : 'text-white'}`}>{s.team}</span>
                          <span className="text-gray-600 text-[9px] shrink-0">{s.country}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center text-gray-400">{s.j}</td>
                      <td className={`px-2 py-2 text-center font-black ${s.highlight ? 'text-[#C8A951]' : 'text-white'}`}>{s.pts}</td>
                      <td className="px-2 py-2 text-center text-gray-400">{s.v}</td>
                      <td className="px-2 py-2 text-center text-gray-400">{s.e}</td>
                      <td className="px-2 py-2 text-center text-gray-400">{s.d}</td>
                      <td className="px-2 py-2 text-center text-gray-400">{s.sg > 0 ? '+' : ''}{s.sg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-[#1a1a1a] px-3 py-1.5 flex items-center gap-1.5 border-t border-[#2d2d2d]">
                <span className="w-2 h-2 rounded-sm bg-[#FFD700]/70 inline-block"></span>
                <span className="text-[10px] text-gray-500">Top 2 avançam às Oitavas</span>
              </div>
            </div>
          );
        } else if (comp.key === 'COPA_DO_BRASIL') {
          const d = comp.details as any;
          card = (
            <div className="bg-[#111111] border border-[#2d2d2d] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2d2d]">
                <img src={comp.logo} alt="Copa do Brasil" className="w-8 h-8 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div>
                  <p className="text-white font-bold text-sm">Copa do Brasil 2026</p>
                  <p className="text-[10px] text-[#009933] font-bold uppercase tracking-wide">{d.phase}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center mb-3">Oitavas de Final</p>
                <div className="flex items-center justify-around gap-2">
                  <div className="flex flex-col items-center gap-2">
                    <img src={d.corinthiansLogo} alt="Corinthians" className="w-12 h-12 object-contain" />
                    <span className="text-xs font-black text-[#C8A951]">Corinthians</span>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-gray-400">VS</p>
                    <p className="text-[9px] text-gray-600 mt-0.5">ida e volta</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 flex items-center justify-center bg-[#2d2d2d] rounded-full overflow-hidden">
                      <img src={d.opponentLogo} alt={d.opponent} className="w-12 h-12 object-contain" />
                    </div>
                    <span className="text-xs font-bold text-white">{d.opponent}</span>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {d.groupMatches?.map((gm: any, i: number) => (
                    <div key={i} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 border ${gm.home ? 'bg-[#C8A951]/5 border-[#C8A951]/20' : 'bg-[#1a1a1a] border-[#2d2d2d]'}`}>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <img src={gm.homeLogo} alt="" className="w-4 h-4 object-contain shrink-0" />
                        <span className={`text-[10px] font-medium truncate ${gm.home ? 'text-[#C8A951]' : 'text-gray-300'}`}>{gm.match}</span>
                        <img src={gm.awayLogo} alt="" className="w-4 h-4 object-contain shrink-0" />
                      </div>
                      <span className="text-[9px] text-gray-500 shrink-0">{gm.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        } else if (comp.key === 'PAULISTAO') {
          const d = comp.details as any;
          if (d?.finalStandings) card = (
            <div className="bg-[#111111] border border-[#2d2d2d] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2d2d]">
                <img src={comp.logo} alt="Paulistão" className="w-8 h-8 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div>
                  <p className="text-white font-bold text-sm">Campeonato Paulista 2026</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">ENCERRADO — Classificação Final</p>
                </div>
              </div>
              <div className="divide-y divide-[#2d2d2d]">
                {d.finalStandings.map((s: any, i: number) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 ${s.highlight ? 'bg-[#C8A951]/10' : i === 0 ? 'bg-[#1a1a1a]' : ''}`}>
                    <span className={`text-lg w-6 text-center shrink-0 ${i === 0 ? '' : i === 1 ? '' : s.highlight ? '' : 'text-gray-600 font-bold text-sm'}`}>
                      {i === 0 ? '🏆' : i === 1 ? '🥈' : s.highlight ? '🦅' : s.pos + 'º'}
                    </span>
                    <img src={s.logo} alt={s.team} className="w-8 h-8 object-contain shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${s.highlight ? 'text-[#C8A951]' : i === 0 ? 'text-white' : 'text-gray-300'}`}>{s.team}</p>
                      <p className={`text-[10px] ${s.highlight ? 'text-[#C8A951]/70' : 'text-gray-600'}`}>{s.label}</p>
                    </div>
                    {i === 0 && <span className="text-[9px] font-bold text-[#FFD700] bg-[#FFD700]/10 rounded px-1.5 py-0.5 shrink-0">CAMPEÃO</span>}
                    {s.highlight && <span className="text-[9px] font-bold text-[#C8A951] bg-[#C8A951]/10 rounded px-1.5 py-0.5 shrink-0">TIMÃO</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return card ? <div key={comp.key}>{card}</div> : null;
      })}
    </div>
  );
}

export default function JogosPage() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState<{ position: number; points: number; games: number; wins: number; draws: number; losses: number } | null>(null);
  const [fullStandings, setFullStandings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resUp, resFin, resStandings] = await Promise.all([
          api.get<Match[]>('/matches?status=scheduled&limit=50'),
          api.get<Match[]>('/matches?status=finished&limit=50'),
          api.get<any>('/matches/standings').catch(() => ({ data: null })),
        ]);
        const up = Array.isArray(resUp.data) ? resUp.data : [];
        const fin = Array.isArray(resFin.data) ? resFin.data : [];
        setAllMatches([...up, ...fin]);

        if (resStandings.data?.standings) {
          setFullStandings(resStandings.data.standings);
          const entry = resStandings.data.standings.find((s: any) =>
            s.team?.toLowerCase().includes('corinthians')
          );
          if (entry) {
            setStandings({ position: entry.position, points: entry.points, games: entry.games, wins: entry.wins ?? 0, draws: entry.draws ?? 0, losses: entry.losses ?? 0 });
          }
        }
      } catch {
        setAllMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const getMatchesForComp = (key: string) => {
    // DB uses COPA_BRASIL, COMPETITIONS array uses COPA_DO_BRASIL — map them
    const dbKey = key === 'COPA_DO_BRASIL' ? 'COPA_BRASIL' : key;
    return allMatches.filter(m => m.competition?.toUpperCase() === dbKey);
  };

  const upcomingAll = allMatches.filter(m => m.status === 'scheduled' || m.status === 'live');
  const finishedAll = allMatches.filter(m => m.status === 'finished');

  return (
    <>
      <Header />
      <PageWrapper glass>
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">⚽ Jogos</h1>
          <p className="text-gray-400">Temporada 2026 · Todos os campeonatos do Corinthians</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            {/* Tab list */}
            <Tabs.List className="flex gap-1 border-b border-[#2d2d2d] mb-8 overflow-x-auto">
              {[
                { value: 'overview', label: '🏆 Competições' },
                { value: 'proximos', label: `Próximos Jogos${upcomingAll.length > 0 ? ` (${upcomingAll.length})` : ''}` },
                { value: 'resultados', label: `Resultados${finishedAll.length > 0 ? ` (${finishedAll.length})` : ''}` },
              ].map(tab => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className="px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors data-[state=active]:text-[#C8A951] data-[state=active]:border-b-2 data-[state=active]:border-[#C8A951] text-gray-400 hover:text-white"
                >
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* Competitions overview */}
            <Tabs.Content value="overview">
              <div className="space-y-8">
                {COMPETITIONS.map(comp => {
                  /* Build sidebar card for this specific competition */
                  let sidebarCard: React.ReactNode = null;

                  if (comp.key === 'BRASILEIRAO') {
                    sidebarCard = <StandingsCard compact />;
                  } else if (comp.key === 'LIBERTADORES') {
                    const gs = (comp.details as any)?.groupStandings;
                    if (gs) sidebarCard = (
                      <div className="bg-[#111111] border border-[#2d2d2d] rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2d2d]">
                          <img src={comp.logo} alt="Libertadores" className="w-8 h-8 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                          <div>
                            <p className="text-white font-bold text-sm">Libertadores 2026</p>
                            <p className="text-[10px] text-[#FFD700] font-bold uppercase tracking-wide">Grupo E — Classificação</p>
                          </div>
                        </div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-[#1a1a1a] text-gray-500 uppercase tracking-wide text-[10px]">
                              <th className="px-3 py-2 text-left w-6">#</th>
                              <th className="px-3 py-2 text-left">Time</th>
                              <th className="px-2 py-2 text-center">J</th>
                              <th className="px-2 py-2 text-center font-bold text-white">Pts</th>
                              <th className="px-2 py-2 text-center">V</th>
                              <th className="px-2 py-2 text-center">E</th>
                              <th className="px-2 py-2 text-center">D</th>
                              <th className="px-2 py-2 text-center">SG</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gs.map((s: any) => (
                              <tr key={s.pos} className={`border-t border-[#2d2d2d] ${s.highlight ? 'bg-[#C8A951]/10' : 'hover:bg-[#1a1a1a]/60'}`}>
                                <td className={`px-3 py-2 font-bold text-center text-[10px] ${s.highlight ? 'text-[#C8A951]' : s.pos <= 2 ? 'text-[#FFD700]' : 'text-gray-600'}`}>{s.pos}</td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <img src={s.logo} alt={s.team} className="w-5 h-5 object-contain shrink-0"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                                    <span className={`font-medium truncate ${s.highlight ? 'text-[#C8A951] font-black' : 'text-white'}`}>{s.team}</span>
                                    <span className="text-gray-600 text-[9px] shrink-0">{s.country}</span>
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-center text-gray-400">{s.j}</td>
                                <td className={`px-2 py-2 text-center font-black ${s.highlight ? 'text-[#C8A951]' : 'text-white'}`}>{s.pts}</td>
                                <td className="px-2 py-2 text-center text-gray-400">{s.v}</td>
                                <td className="px-2 py-2 text-center text-gray-400">{s.e}</td>
                                <td className="px-2 py-2 text-center text-gray-400">{s.d}</td>
                                <td className="px-2 py-2 text-center text-gray-400">{s.sg > 0 ? '+' : ''}{s.sg}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="bg-[#1a1a1a] px-3 py-1.5 flex items-center gap-1.5 border-t border-[#2d2d2d]">
                          <span className="w-2 h-2 rounded-sm bg-[#FFD700]/70 inline-block"></span>
                          <span className="text-[10px] text-gray-500">Top 2 avançam às Oitavas</span>
                        </div>
                      </div>
                    );
                  } else if (comp.key === 'COPA_DO_BRASIL') {
                    const d = comp.details as any;
                    sidebarCard = (
                      <div className="bg-[#111111] border border-[#2d2d2d] rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2d2d]">
                          <img src={comp.logo} alt="Copa do Brasil" className="w-8 h-8 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                          <div>
                            <p className="text-white font-bold text-sm">Copa do Brasil 2026</p>
                            <p className="text-[10px] text-[#009933] font-bold uppercase tracking-wide">{d.phase}</p>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center mb-3">Oitavas de Final</p>
                          <div className="flex items-center justify-around gap-2">
                            <div className="flex flex-col items-center gap-2">
                              <img src={d.corinthiansLogo} alt="Corinthians" className="w-12 h-12 object-contain" />
                              <span className="text-xs font-black text-[#C8A951]">Corinthians</span>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-black text-gray-400">VS</p>
                              <p className="text-[9px] text-gray-600 mt-0.5">ida e volta</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 flex items-center justify-center bg-[#2d2d2d] rounded-full overflow-hidden">
                                <img src={d.opponentLogo} alt={d.opponent} className="w-12 h-12 object-contain"
                                  onError={(e) => {
                                    const el = e.target as HTMLImageElement;
                                    el.style.display='none';
                                    const p = el.parentElement;
                                    if (p) p.innerHTML = `<span class="text-white font-black text-xs">${(d.opponent as string).slice(0,3).toUpperCase()}</span>`;
                                  }} />
                              </div>
                              <span className="text-xs font-bold text-white">{d.opponent}</span>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1">
                            {d.groupMatches?.map((gm: any, i: number) => (
                              <div key={i} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 border ${gm.home ? 'bg-[#C8A951]/5 border-[#C8A951]/20' : 'bg-[#1a1a1a] border-[#2d2d2d]'}`}>
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <img src={gm.homeLogo} alt="" className="w-4 h-4 object-contain shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                                  <span className={`text-[10px] font-medium truncate ${gm.home ? 'text-[#C8A951]' : 'text-gray-300'}`}>{gm.match}</span>
                                  <img src={gm.awayLogo} alt="" className="w-4 h-4 object-contain shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                                </div>
                                <span className="text-[9px] text-gray-500 shrink-0">{gm.date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  } else if (comp.key === 'PAULISTAO') {
                    const d = comp.details as any;
                    if (d?.finalStandings) sidebarCard = (
                      <div className="bg-[#111111] border border-[#2d2d2d] rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2d2d]">
                          <img src={comp.logo} alt="Paulistão" className="w-8 h-8 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                          <div>
                            <p className="text-white font-bold text-sm">Campeonato Paulista 2026</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">ENCERRADO — Classificação Final</p>
                          </div>
                        </div>
                        <div className="divide-y divide-[#2d2d2d]">
                          {d.finalStandings.map((s: any, i: number) => (
                            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${s.highlight ? 'bg-[#C8A951]/10' : i === 0 ? 'bg-[#1a1a1a]' : ''}`}>
                              <span className={`text-lg w-6 text-center shrink-0 ${i === 0 ? '' : i === 1 ? '' : s.highlight ? '' : 'text-gray-600 font-bold text-sm'}`}>
                                {i === 0 ? '🏆' : i === 1 ? '🥈' : s.highlight ? '🦅' : `${s.pos}º`}
                              </span>
                              <img src={s.logo} alt={s.team} className="w-8 h-8 object-contain shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm truncate ${s.highlight ? 'text-[#C8A951]' : i === 0 ? 'text-white' : 'text-gray-300'}`}>{s.team}</p>
                                <p className={`text-[10px] ${s.highlight ? 'text-[#C8A951]/70' : 'text-gray-600'}`}>{s.label}</p>
                              </div>
                              {i === 0 && <span className="text-[9px] font-bold text-[#FFD700] bg-[#FFD700]/10 rounded px-1.5 py-0.5 shrink-0">CAMPEÃO</span>}
                              {s.highlight && <span className="text-[9px] font-bold text-[#C8A951] bg-[#C8A951]/10 rounded px-1.5 py-0.5 shrink-0">TIMÃO</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else if (comp.key === 'OUTRO') {
                    sidebarCard = (
                      <div className="bg-[#111111] border border-[#C8A951]/20 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#C8A951]/20">
                          <img src={comp.logo} alt="Supercopa" className="w-8 h-8 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                          <div>
                            <p className="text-white font-bold text-sm">Supercopa do Brasil 2026</p>
                            <p className="text-[10px] text-[#C8A951] font-black uppercase tracking-wide">🏆 CAMPEÃO</p>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-around gap-2">
                            <div className="flex flex-col items-center gap-1.5">
                              <img src="https://a.espncdn.com/i/teamlogos/soccer/500/874.png" alt="Corinthians" className="w-12 h-12 object-contain" />
                              <span className="text-[11px] font-black text-[#C8A951]">Corinthians</span>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-black text-white">2 <span className="text-gray-500 text-lg">×</span> 0</p>
                              <p className="text-[9px] text-[#C8A951] font-bold mt-0.5">01/02/2026</p>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 opacity-70">
                              <img src="https://a.espncdn.com/i/teamlogos/soccer/500/819.png" alt="Flamengo" className="w-12 h-12 object-contain" />
                              <span className="text-[11px] font-bold text-gray-400">Flamengo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={comp.key} className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                      <div className="xl:col-span-2">
                        <CompetitionCard
                          comp={comp}
                          matches={getMatchesForComp(comp.key)}
                          standings={comp.key === 'BRASILEIRAO' ? standings : null}
                          fullStandings={comp.key === 'BRASILEIRAO' ? fullStandings : []}
                        />
                      </div>
                      {sidebarCard && (
                        <div className="xl:col-span-1">
                          {sidebarCard}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Tabs.Content>

            {/* Upcoming matches */}
            <Tabs.Content value="proximos">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                  {upcomingAll.length === 0 ? (
                    <p className="text-center text-gray-500 py-16">Nenhum jogo agendado. Os agentes buscarão automaticamente.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAll.map(m => <MatchRow key={m.id} match={m} />)}
                    </div>
                  )}
                </div>
                <CompetitionsSidebar />
              </div>
            </Tabs.Content>

            {/* Results */}
            <Tabs.Content value="resultados">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                  {finishedAll.length === 0 ? (
                    <p className="text-center text-gray-500 py-16">Nenhum resultado registrado.</p>
                  ) : (
                    <div className="space-y-3">
                      {finishedAll.map(m => <MatchRow key={m.id} match={m} />)}
                    </div>
                  )}
                </div>
                <CompetitionsSidebar />
              </div>
            </Tabs.Content>
          </Tabs.Root>
        )}
      </PageWrapper>
      <Footer />
    </>
  );
}
