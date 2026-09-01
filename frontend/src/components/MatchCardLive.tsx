'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/Button';
import { CountdownTimer } from '@/components/CountdownTimer';

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

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
  'GeTV':                'https://ge.globo.com',
  'Record':              'https://www.r7.com/recordtv',
  'Globo':               'https://globoplay.globo.com',
};

function BroadcastLinks({ tvChannel, broadcastUrls }: { tvChannel: string; broadcastUrls?: Record<string, string> }) {
  const channels = tvChannel.split(/\s*\/\s*/).map((c: string) => c.trim()).filter(Boolean);
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span>📺</span>
      {channels.map((ch: string, i: number) => {
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
              <span>{ch}</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface LiveStats {
  elapsed?: string;
  period?: number;
  periodLabel?: string;
  statusType?: string;
  broadcastUrls?: Record<string, string>;
}

interface MatchData {
  id: string;
  competition: string;
  season: string;
  roundLabel: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  matchDate: string;
  stadium: string;
  city: string;
  tvChannel?: string | null;
  status: 'scheduled' | 'live' | 'finished';
  homeScore?: number | null;
  awayScore?: number | null;
  bolaoOpen: boolean;
  matchStats?: LiveStats | null;
}

interface MatchCardLiveProps {
  initialMatch: MatchData | null;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

function useCountdown(targetDate: string) {
  const calc = useCallback(() => {
    const diff = Math.max(0, Math.floor((new Date(targetDate).getTime() - Date.now()) / 1000));
    return {
      days: Math.floor(diff / 86400),
      hours: Math.floor((diff % 86400) / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
      expired: diff === 0,
    };
  }, [targetDate]);

  const [time, setTime] = useState<ReturnType<typeof calc> | null>(null);
  useEffect(() => {
    setTime(calc());
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [calc]);
  return time;
}

function TeamLogo({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="w-16 h-16 rounded-full bg-[#2d2d2d] flex items-center justify-center text-2xl">
        ⚽
      </div>
    );
  }
  return (
    <div className="relative w-16 h-16">
      <Image src={src} alt={alt} fill className="object-contain" unoptimized />
    </div>
  );
}

function LiveClock({ stats }: { stats?: LiveStats | null }) {
  if (!stats?.statusType) {
    return <span className="text-[#C8A951] font-bold text-sm">🔴 AO VIVO</span>;
  }

  const { statusType, elapsed, periodLabel } = stats;

  if (statusType === 'STATUS_HALF_TIME') {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
          ⏸ Intervalo
        </span>
      </div>
    );
  }

  if (['STATUS_FULL_TIME', 'STATUS_FINAL', 'STATUS_FINAL_AET', 'STATUS_FINAL_PEN'].includes(statusType)) {
    return <span className="text-gray-400 font-bold text-sm">Encerrado</span>;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="bg-red-500/20 text-red-400 border border-red-500/40 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider animate-pulse">
        🔴 AO VIVO
      </span>
      {(periodLabel || elapsed) && (
        <span className="text-[#C8A951] font-bold text-sm">
          {periodLabel}{elapsed ? ` · ${elapsed}` : ''}
        </span>
      )}
    </div>
  );
}

export function MatchCardLive({ initialMatch }: MatchCardLiveProps) {
  const [match, setMatch] = useState<MatchData | null>(initialMatch);

  // Sync state when initialMatch prop changes (e.g. loaded asynchronously)
  useEffect(() => {
    if (initialMatch) setMatch(initialMatch);
  }, [initialMatch]);

  // Refresh live/upcoming match data every 30s
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch('/api/matches/next', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setMatch(data);
        }
      } catch { /* keep current data */ }
    };

    if (!match) refresh();

    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!match) return null;

  const matchDateObj = new Date(match.matchDate);
  const isToday = new Date().toDateString() === matchDateObj.toDateString();
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isScheduled = match.status === 'scheduled';

  const competitionLabel =
    match.competition === 'BRASILEIRAO' ? 'Brasileirão Série A' :
    match.competition === 'COPA_BRASIL' ? 'Copa do Brasil' :
    match.competition === 'LIBERTADORES' ? 'Copa Libertadores' :
    match.competition === 'PAULISTAO' ? 'Campeonato Paulista' :
    match.competition;

  const handleShareWhatsApp = () => {
    if (!match) return;
    const dateStr = matchDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });
    const timeStr = matchDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    const palpiteUrl = `https://fielriopardo.com.br/bolao/jogo/${match.id}`;
    
    const text =
      `🖤🤍 *FIEL RIO PARDO — PRÓXIMO JOGO*

` +
      `⚽ *${match.homeTeam} x ${match.awayTeam}*
` +
      `🏆 ${competitionLabel}
` +
      `📅 ${dateStr} às ${timeStr}h
` +
      `🏟 ${match.stadium}

` +
      `🎯 *Dê seu palpite no Bolão:* 
` +
      `👉 ${palpiteUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${match.homeTeam} x ${match.awayTeam} — Bolão Fiel Rio Pardo`,
        text: text,
        url: palpiteUrl,
      }).catch(() => {
        window.open(whatsappUrl, '_blank');
      });
    } else {
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <>
      <section className="py-12 border-y border-[#2d2d2d]/50 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-2xl">⚽</span>
            <h2 className="text-2xl font-black text-white">
              {isLive ? 'Jogo ao Vivo' : isToday ? 'Jogo de Hoje' : 'Próximo Jogo'}
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className={`rounded-xl border bg-black/40 backdrop-blur-sm p-6 ${isLive ? 'border-red-500/40' : 'border-[#2d2d2d]'}`}>
              {/* Header: competition + status badge */}
              <div className="flex items-center justify-between mb-5 text-sm text-gray-400">
                <span>{competitionLabel} — Rodada {match.roundLabel}</span>
                {isLive && (
                  <span className="text-red-400 font-semibold text-xs animate-pulse">🔴 AO VIVO</span>
                )}
                {isScheduled && match.bolaoOpen && (
                  <span className="text-[#C8A951] font-semibold text-xs">🎯 Bolão aberto!</span>
                )}
              </div>

              {/* Teams + Score/VS */}
              <div className="flex items-center justify-center gap-6 md:gap-10">
                <div className="text-center flex flex-col items-center gap-2">
                  <TeamLogo src={match.homeTeamLogo} alt={match.homeTeam} />
                  <p className="font-bold text-white text-base">{match.homeTeam}</p>
                </div>

                <div className="text-center flex-shrink-0">
                  {isLive ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl font-black text-white tabular-nums">
                        <span className="text-[#C8A951]">{match.homeScore ?? 0}</span>
                        <span className="text-gray-500 mx-2">x</span>
                        <span className="text-[#C8A951]">{match.awayScore ?? 0}</span>
                      </div>
                      <LiveClock stats={match.matchStats as LiveStats} />
                    </div>
                  ) : isFinished ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-4xl font-black text-white tabular-nums">
                        {match.homeScore ?? 0}
                        <span className="text-gray-500 mx-2">x</span>
                        {match.awayScore ?? 0}
                      </div>
                      <span className="text-gray-500 text-xs font-bold uppercase">Encerrado</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-4xl font-black text-gray-500">x</p>
                      <CountdownSection matchDate={match.matchDate} isToday={isToday} />
                    </div>
                  )}
                </div>

                <div className="text-center flex flex-col items-center gap-2">
                  <TeamLogo src={match.awayTeamLogo} alt={match.awayTeam} />
                  <p className="font-bold text-white text-base">{match.awayTeam}</p>
                </div>
              </div>

              {/* Match info */}
              <div className="mt-5 pt-4 border-t border-[#2d2d2d] grid grid-cols-2 gap-2 text-xs text-gray-400">
                <span>📅 {matchDateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })}</span>
                <span>🕒 {matchDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h</span>
                <span>🏟 {match.stadium}</span>
                {match.tvChannel && <BroadcastLinks tvChannel={match.tvChannel} broadcastUrls={(match.matchStats as any)?.broadcastUrls} />}
              </div>

              {isScheduled && match.bolaoOpen && matchDateObj.getTime() > Date.now() && (
                <div className="mt-5">
                  <CountdownTimer targetDate={match.matchDate} label="Bolão fecha em:" />
                </div>
              )}

              {/* CTA Buttons */}
              {isScheduled && match.bolaoOpen && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Link href={`/bolao/jogo/${match.id}`} className={buttonVariants({ size: 'md', className: 'bg-[#C8A951] hover:bg-[#b8993f] text-black font-black' })}>
                    🎯 Dê seu Palpite
                  </Link>
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-sm transition-all shadow-md shadow-[#25D366]/20 cursor-pointer"
                  >
                    <WhatsAppIcon size={18} />
                    <span>Compartilhar</span>
                  </button>
                </div>
              )}
              {isLive && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Link href={`/bolao/resultado/${match.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Ver Resultado ao Vivo</Link>
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold text-xs transition-all shadow-md shadow-[#25D366]/20 cursor-pointer"
                  >
                    <WhatsAppIcon size={16} />
                    <span>Compartilhar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 18+ Disclaimer */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-white/10 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="font-bold text-gray-400">⚠️ BOLÃO FIEL RIO PARDO</span>
          <span>Participação exclusiva para <strong className="text-gray-300">maiores de 18 anos</strong>.</span>
          <span>Não se trata de aposta — <strong className="text-gray-300">participação gratuita</strong>.</span>
          <span>Os prêmios são patrocinados pelos administradores, exclusivamente para membros da <strong className="text-gray-300">Fiel Rio Pardo</strong>.</span>
        </div>
      </div>
    </>
  );
}

function CountdownSection({ matchDate, isToday }: { matchDate: string; isToday: boolean }) {
  const time = useCountdown(matchDate);

  if (!time) return null;

  if (time.expired) {
    return <span className="text-yellow-400 text-xs font-bold">Em breve...</span>;
  }

  if (isToday) {
    return (
      <div className="text-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Começa em</p>
        <div className="flex gap-1 justify-center">
          {time.hours > 0 && (
            <div className="bg-[#2d2d2d] rounded px-2 py-1 min-w-[36px] text-center">
              <span className="text-[#C8A951] font-black text-lg tabular-nums">{pad(time.hours)}</span>
              <p className="text-[9px] text-gray-500">h</p>
            </div>
          )}
          <div className="bg-[#2d2d2d] rounded px-2 py-1 min-w-[36px] text-center">
            <span className="text-[#C8A951] font-black text-lg tabular-nums">{pad(time.minutes)}</span>
            <p className="text-[9px] text-gray-500">min</p>
          </div>
          <div className="bg-[#2d2d2d] rounded px-2 py-1 min-w-[36px] text-center">
            <span className="text-[#C8A951] font-black text-lg tabular-nums">{pad(time.seconds)}</span>
            <p className="text-[9px] text-gray-500">seg</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-xs text-gray-500">
        {new Date(matchDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })}
        {' às '}
        {new Date(matchDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
      </p>
      {time.days > 0 && (
        <p className="text-[#C8A951] text-xs font-bold mt-1">em {time.days} dia{time.days > 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
