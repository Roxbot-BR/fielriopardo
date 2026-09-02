import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Chamado sempre server-side (dentro da rede Docker), por isso usa o hostname
// interno do backend, igual ao padrao ja usado em src/lib/api.ts para SSR.
const BACKEND_URL = 'http://backend:3001/api';

interface MatchData {
  id: string;
  competition: string;
  roundLabel: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  matchDate: string;
  stadium: string;
  tvChannel: string | null;
  bolaoOpen: boolean;
}

function competitionLabel(c: string) {
  return c === 'BRASILEIRAO' ? 'Brasileirão Série A' :
    c === 'COPA_BRASIL' ? 'Copa do Brasil' :
    c === 'LIBERTADORES' ? 'Copa Libertadores' :
    c === 'PAULISTAO' ? 'Campeonato Paulista' : c;
}

function TeamBlock({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 260 }}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} width={130} height={130} style={{ objectFit: 'contain' }} alt={name} />
      ) : (
        <div style={{ display: 'flex', width: 130, height: 130, borderRadius: 65, background: '#1a1a1a', border: '2px solid #C8A951' }} />
      )}
      <div style={{ display: 'flex', marginTop: 16, fontSize: 30, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
        {name}
      </div>
    </div>
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let match: MatchData | null = null;
  try {
    const res = await fetch(`${BACKEND_URL}/matches/${id}`, { cache: 'no-store' });
    if (res.ok) match = await res.json();
  } catch {
    match = null;
  }

  if (!match) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#C8A951', fontSize: 56, fontWeight: 700 }}>
          🖤🤍 Fiel Rio Pardo
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  const matchDateObj = new Date(match.matchDate);
  const dateFull = matchDateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });
  const dateShort = matchDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });
  const timeStr = matchDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

  const diffMs = Math.max(0, matchDateObj.getTime() - Date.now());
  const diffDaysFloor = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor((diffMs % 86400000) / 3600000);
  const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
  const countdownLabel =
    diffMs <= 0 ? 'hoje' :
    diffDaysFloor > 0 ? `em ${diffDaysFloor}d ${diffHours}h ${diffMinutes}min` :
    diffHours > 0 ? `em ${diffHours}h ${diffMinutes}min` :
    `em ${diffMinutes}min`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          padding: '48px 64px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 26, color: '#C8A951', fontWeight: 600 }}>
            {competitionLabel(match.competition)}{match.roundLabel ? ` — ${match.roundLabel}` : ''}
          </div>
          {match.bolaoOpen && (
            <div style={{ display: 'flex', background: '#C8A951', color: '#000', fontWeight: 700, fontSize: 24, padding: '8px 20px', borderRadius: 999 }}>
              🎯 Bolão aberto!
            </div>
          )}
        </div>

        {/* Matchup */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
          <TeamBlock name={match.homeTeam} logo={match.homeTeamLogo} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 240 }}>
            <div style={{ display: 'flex', fontSize: 56, fontWeight: 800, color: '#C8A951' }}>X</div>
            <div style={{ display: 'flex', fontSize: 24, color: '#fff', marginTop: 12 }}>{dateShort} às {timeStr}</div>
            <div style={{ display: 'flex', fontSize: 22, color: '#C8A951', marginTop: 6, fontWeight: 600 }}>⏳ {countdownLabel}</div>
          </div>

          <TeamBlock name={match.awayTeam} logo={match.awayTeamLogo} />
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: '2px solid #2d2d2d', paddingTop: 24, gap: 10 }}>
          <div style={{ display: 'flex', fontSize: 24, color: '#fff' }}>📅 {dateFull}</div>
          <div style={{ display: 'flex', fontSize: 24, color: '#fff' }}>🕒 {timeStr}h</div>
          <div style={{ display: 'flex', fontSize: 24, color: '#fff' }}>🏟️ {match.stadium}</div>
          {match.tvChannel && (
            <div style={{ display: 'flex', fontSize: 24, color: '#fff' }}>📺 {match.tvChannel}</div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
