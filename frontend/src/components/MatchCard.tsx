'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { Match } from '@/types';

// Channel → URL mapping for clickable streaming links
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

function BroadcastLinks({ tvChannel, broadcastUrls }: { tvChannel: string; broadcastUrls?: Record<string, string> }) {
  const channels = tvChannel.split(/\s*\/\s*/).map(c => c.trim()).filter(Boolean);
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-xs">
      <span className="text-gray-500">📺</span>
      {channels.map((ch, i) => {
        const url = broadcastUrls?.[ch] || CHANNEL_URLS[ch];
        return (
          <React.Fragment key={ch}>
            {i > 0 && <span className="text-gray-600">·</span>}
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer"
                 className="text-yellow-400 hover:text-yellow-300 transition-colors underline underline-offset-2">
                {ch}
              </a>
            ) : (
              <span className="text-gray-400">{ch}</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  showPredictionButton?: boolean;
  size?: 'default' | 'compact';
}

const statusLabel: Record<string, { label: string; variant: 'live' | 'gold' | 'gray' | 'blue' | 'red' }> = {
  scheduled: { label: 'Agendado',   variant: 'blue'  },
  live:       { label: '● AO VIVO', variant: 'live'  },
  finished:   { label: 'Encerrado', variant: 'gray'  },
  cancelled:  { label: 'Cancelado', variant: 'red'   },
  postponed:  { label: 'Adiado',    variant: 'gold'  },
};

const TEAM_LOGOS: Record<string, string> = {
  'corinthians':         'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',
  'flamengo':            'https://a.espncdn.com/i/teamlogos/soccer/500/819.png',
  'palmeiras':           'https://a.espncdn.com/i/teamlogos/soccer/500/2029.png',
  'sao paulo':           'https://a.espncdn.com/i/teamlogos/soccer/500/2026.png',
  'santos':              'https://a.espncdn.com/i/teamlogos/soccer/500/2674.png',
  'gremio':              'https://a.espncdn.com/i/teamlogos/soccer/500/6273.png',
  'fluminense':          'https://a.espncdn.com/i/teamlogos/soccer/500/3445.png',
  'botafogo':            'https://a.espncdn.com/i/teamlogos/soccer/500/6086.png',
  'vasco':               'https://a.espncdn.com/i/teamlogos/soccer/500/3454.png',
  'vasco da gama':       'https://a.espncdn.com/i/teamlogos/soccer/500/3454.png',
  'atletico mineiro':    'https://a.espncdn.com/i/teamlogos/soccer/500/7632.png',
  'atletico-mg':         'https://a.espncdn.com/i/teamlogos/soccer/500/7632.png',
  'atletico mg':         'https://a.espncdn.com/i/teamlogos/soccer/500/7632.png',
  'cruzeiro':            'https://a.espncdn.com/i/teamlogos/soccer/500/2022.png',
  'internacional':       'https://a.espncdn.com/i/teamlogos/soccer/500/1936.png',
  'bahia':               'https://a.espncdn.com/i/teamlogos/soccer/500/9967.png',
  'athletico':           'https://a.espncdn.com/i/teamlogos/soccer/500/3458.png',
  'athletico paranaense':'https://a.espncdn.com/i/teamlogos/soccer/500/3458.png',
  'athletico-pr':        'https://a.espncdn.com/i/teamlogos/soccer/500/3458.png',
  'bragantino':          'https://a.espncdn.com/i/teamlogos/soccer/500/6079.png',
  'red bull bragantino': 'https://a.espncdn.com/i/teamlogos/soccer/500/6079.png',
  'coritiba':            'https://a.espncdn.com/i/teamlogos/soccer/500/3456.png',
  'vitoria':             'https://a.espncdn.com/i/teamlogos/soccer/500/3457.png',
  'mirassol':            'https://a.espncdn.com/i/teamlogos/soccer/500/9169.png',
  'chapecoense':         'https://a.espncdn.com/i/teamlogos/soccer/500/9318.png',
  'fortaleza':           'https://a.espncdn.com/i/teamlogos/soccer/500/6351.png',
  'ceara':               'https://a.espncdn.com/i/teamlogos/soccer/500/3462.png',
  'sport':               'https://a.espncdn.com/i/teamlogos/soccer/500/3461.png',
  'america mineiro':     'https://a.espncdn.com/i/teamlogos/soccer/500/3464.png',
  'juventude':           'https://a.espncdn.com/i/teamlogos/soccer/500/9575.png',
  'cuiaba':              'https://a.espncdn.com/i/teamlogos/soccer/500/7659.png',
  'goias':               'https://a.espncdn.com/i/teamlogos/soccer/500/3463.png',
  'goianiense':          'https://a.espncdn.com/i/teamlogos/soccer/500/3463.png',
};

function getTeamLogo(name: string, dbLogo: string | null | undefined): string | null {
  // DB logo tem prioridade (ESPN CDN), static map como fallback
  if (dbLogo) return dbLogo;
  const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (TEAM_LOGOS[normalized]) return TEAM_LOGOS[normalized];
  for (const [k, v] of Object.entries(TEAM_LOGOS)) {
    if (normalized.includes(k) || k.includes(normalized)) return v;
  }
  return null;
}

function TeamLogo({ src, name }: { src: string | null | undefined; name: string }) {
  const [imgError, setImgError] = React.useState(false);
  const logoSrc = getTeamLogo(name, src);
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase();

  if (!logoSrc || imgError) {
    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1a1a1a] border-2 border-[#C8A951]/30 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-[#C8A951]">{initials}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt={name}
      width={64}
      height={64}
      className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-lg"
      onError={() => setImgError(true)}
    />
  );
}

export function MatchCard({ match, showPredictionButton = true, size = 'default' }: MatchCardProps) {
  const statusInfo = statusLabel[match.status] ?? { label: match.status, variant: 'gray' as const };
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <Card variant={isLive ? 'highlight' : 'default'} className="overflow-hidden">
      <CardContent className={size === 'compact' ? 'p-3' : 'p-4 sm:p-5'}>

        {/* Header: competition + status */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-400 truncate">{match.competition}</span>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center justify-between gap-2">
          {/* Home */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <TeamLogo src={match.homeTeamLogo} name={match.homeTeam} />
            <span className="text-xs text-white font-semibold text-center line-clamp-2 leading-tight">
              {match.homeTeam}
            </span>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center flex-shrink-0 px-2">
            {(isLive || isFinished) ? (
              <span className={`text-2xl font-black ${isLive ? 'text-[#C8A951]' : 'text-white'}`}>
                {match.homeScore ?? 0} × {match.awayScore ?? 0}
              </span>
            ) : (
              <>
                <span className="text-lg font-black text-gray-500">×</span>
                <span className="text-xs text-gray-500 mt-1">{formatDate(match.matchDate)}</span>
              </>
            )}
            {isLive && (
              <span className="text-xs text-[#C8A951] animate-pulse mt-1">Ao Vivo</span>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <TeamLogo src={match.awayTeamLogo} name={match.awayTeam} />
            <span className="text-xs text-white font-semibold text-center line-clamp-2 leading-tight">
              {match.awayTeam}
            </span>
          </div>
        </div>

        {/* Match info */}
        {size !== 'compact' && (
          <div className="mt-4 pt-3 border-t border-[#2d2d2d] grid grid-cols-2 gap-1 text-xs text-gray-500">
            {match.stadium && <span>🏟 {match.stadium}</span>}
            {match.tvChannel && <BroadcastLinks tvChannel={match.tvChannel} broadcastUrls={match.matchStats?.broadcastUrls} />}
            {match.roundLabel && <span>⚽ {match.roundLabel}</span>}
            {match.matchDate && !isLive && !isFinished && (
              <span>🕒 {new Date(match.matchDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h</span>
            )}
          </div>
        )}

        {/* Prediction button */}
        {showPredictionButton && !isFinished && match.bolaoOpen && (
          <div className="mt-4">
            <Link href={`/bolao/jogo/${match.id}`}>
              <Button variant="default" className="w-full text-sm">
                🎯 Dar Palpite
              </Button>
            </Link>
          </div>
        )}

        {isFinished && (
          <div className="mt-3 flex items-center justify-center gap-4">
            <Link href={`/bolao/resultado/${match.id}`} className="text-xs text-gray-400 hover:text-[#C8A951] transition-colors">
              Ver resultado →
            </Link>
            <Link href={`/bolao/acertadores/${match.id}`} className="text-xs text-[#C8A951] hover:underline font-semibold">
              🏆 Acertadores
            </Link>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
