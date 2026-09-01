import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as https from 'https';
import { Match, MatchStatus, Competition } from '../../database/entities/match.entity';
import { EventsGateway } from '../../websocket/events.gateway';
import { MatchesService } from '../../matches/matches.service';
import { BolaoAgentService } from '../bolao-agent/bolao-agent.service';

function normalizeTeamName(name: string): string {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(fc|sc|ec|ac|clube|club|futebol|sport|sociedade)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sameTeam(a: string, b: string): boolean {
  const left = normalizeTeamName(a);
  const right = normalizeTeamName(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

// ESPN sits behind Akamai bot-protection that returns HTTP 403 to requests
// with Node's default (empty) User-Agent. A curl-like User-Agent is accepted.
// Accept-Encoding: identity avoids gzip so responses can be JSON.parsed as-is.
const ESPN_HEADERS = {
  'User-Agent': 'curl/7.88.1',
  Accept: 'application/json, */*',
  'Accept-Encoding': 'identity',
} as const;

@Injectable()
export class MatchLiveService {
  private readonly logger = new Logger(MatchLiveService.name);
  private activePolling: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    @InjectRepository(Match)
    private matchesRepo: Repository<Match>,
    private eventsGateway: EventsGateway,
    private matchesService: MatchesService,
    private bolaoAgent: BolaoAgentService,
  ) {}

  /** Resolve ESPN league slug from match competition */
  private getLeagueSlug(competition?: Competition | string): string {
    switch (competition) {
      case Competition.LIBERTADORES:  return 'conmebol.libertadores';
      case Competition.SULAMERICANA:  return 'conmebol.sudamericana';
      case Competition.COPA_DO_BRASIL: return 'bra.copa_do_brazil';
      case Competition.PAULISTAO:     return 'bra.camp.paulista';
      default:                        return 'bra.1';
    }
  }

  private formatDateKey(date: Date): string {
    return String(date.getUTCFullYear()) +
      String(date.getUTCMonth() + 1).padStart(2, '0') +
      String(date.getUTCDate()).padStart(2, '0');
  }

  private async resolveESPNExternalId(match: Match): Promise<string | null> {
    const leagueSlug = this.getLeagueSlug(match.competition);
    const date = new Date(match.matchDate);
    const dateKeys = new Set<string>();
    for (const offset of [-1, 0, 1]) {
      const d = new Date(date);
      d.setDate(d.getDate() + offset);
      dateKeys.add(this.formatDateKey(d));
    }

    for (const dateKey of dateKeys) {
      const externalId = await new Promise<string | null>((resolve) => {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/scoreboard?dates=${dateKey}`;
        https.get(url, { headers: ESPN_HEADERS }, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              for (const ev of json?.events ?? []) {
                const comp = ev.competitions?.[0];
                const teams = comp?.competitors ?? [];
                const home = teams.find((t: any) => t.homeAway === 'home');
                const away = teams.find((t: any) => t.homeAway === 'away');
                const homeName = home?.team?.displayName ?? '';
                const awayName = away?.team?.displayName ?? '';
                if (sameTeam(match.homeTeam, homeName) && sameTeam(match.awayTeam, awayName)) {
                  return resolve('espn_' + String(ev.id));
                }
              }
              resolve(null);
            } catch {
              resolve(null);
            }
          });
        }).on('error', () => resolve(null));
      });
      if (externalId) return externalId;
    }

    return null;
  }

  // ── Fetch live score from ESPN scoreboard ──────────────────────────────
  private async fetchESPNLive(espnId: string, leagueSlug: string): Promise<{
    homeScore: number;
    awayScore: number;
    elapsed: string;
    period: number;
    statusType: string;
  } | null> {
    return new Promise((resolve) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/scoreboard`;
      https.get(url, { headers: ESPN_HEADERS }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            for (const ev of json?.events ?? []) {
              if (ev.id !== espnId) continue;
              const comp = ev.competitions?.[0];
              if (!comp) break;
              const teams = comp.competitors ?? [];
              const home = teams.find((t: any) => t.homeAway === 'home');
              const away = teams.find((t: any) => t.homeAway === 'away');
              resolve({
                homeScore: Number(home?.score ?? 0),
                awayScore: Number(away?.score ?? 0),
                elapsed: comp.status?.displayClock ?? comp.status?.type?.shortDetail ?? '',
                period: comp.status?.period ?? 0,
                statusType: comp.status?.type?.name ?? '',
              });
              return;
            }
            resolve(null);
          } catch {
            resolve(null);
          }
        });
        res.on('error', () => resolve(null));
      }).on('error', () => resolve(null));
    });
  }

  // ── Also try fetching from the match-specific ESPN endpoint ───────────
  private async fetchESPNMatchDirect(espnId: string, leagueSlug: string): Promise<{
    homeScore: number;
    awayScore: number;
    elapsed: string;
    period: number;
    statusType: string;
    boxscore?: {
      homePossession?: number; awayPossession?: number;
      homeShots?: number; awayShots?: number;
      homeShotsOnTarget?: number; awayShotsOnTarget?: number;
      homeYellow?: number; awayYellow?: number;
      homeRed?: number; awayRed?: number;
      homeCorners?: number; awayCorners?: number;
      homeFouls?: number; awayFouls?: number;
    };
  } | null> {
    return new Promise((resolve) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/summary?event=${espnId}`;
      https.get(url, { headers: ESPN_HEADERS }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const comp = json?.header?.competitions?.[0];
            if (!comp) return resolve(null);
            const teams = comp.competitors ?? [];
            const home = teams.find((t: any) => t.homeAway === 'home');
            const away = teams.find((t: any) => t.homeAway === 'away');

            // Parse boxscore stats
            const bsTeams: any[] = json?.boxscore?.teams ?? [];
            const bsHome = bsTeams.find((t: any) => t.homeAway === 'home');
            const bsAway = bsTeams.find((t: any) => t.homeAway === 'away');
            const getStat = (team: any, name: string) => {
              const stat = (team?.statistics ?? []).find((s: any) => s.name === name);
              return stat ? parseFloat(stat.displayValue) : undefined;
            };
            const boxscore = bsHome ? {
              homePossession: getStat(bsHome, 'possessionPct'),
              awayPossession: getStat(bsAway, 'possessionPct'),
              homeShots: getStat(bsHome, 'totalShots'),
              awayShots: getStat(bsAway, 'totalShots'),
              homeShotsOnTarget: getStat(bsHome, 'shotsOnTarget'),
              awayShotsOnTarget: getStat(bsAway, 'shotsOnTarget'),
              homeYellow: getStat(bsHome, 'yellowCards'),
              awayYellow: getStat(bsAway, 'yellowCards'),
              homeRed: getStat(bsHome, 'redCards'),
              awayRed: getStat(bsAway, 'redCards'),
              homeCorners: getStat(bsHome, 'wonCorners'),
              awayCorners: getStat(bsAway, 'wonCorners'),
              homeFouls: getStat(bsHome, 'foulsCommitted'),
              awayFouls: getStat(bsAway, 'foulsCommitted'),
            } : undefined;

            resolve({
              homeScore: Number(home?.score ?? 0),
              awayScore: Number(away?.score ?? 0),
              elapsed: comp.status?.displayClock ?? comp.status?.type?.shortDetail ?? '',
              period: comp.status?.period ?? 0,
              statusType: comp.status?.type?.name ?? '',
              boxscore,
            });
          } catch {
            resolve(null);
          }
        });
        res.on('error', () => resolve(null));
      }).on('error', () => resolve(null));
    });
  }

  async pollMatchScore(matchId: string, externalId: string): Promise<void> {
    try {
      const match = await this.matchesService.findById(matchId);
      let resolvedExternalId = externalId;
      if (!resolvedExternalId.startsWith('espn_')) {
        const resolved = await this.resolveESPNExternalId(match);
        if (!resolved) {
          this.logger.warn(`No ESPN externalId resolved for match ${matchId}`);
          return;
        }
        resolvedExternalId = resolved;
        await this.matchesService.update(matchId, { externalId: resolvedExternalId } as any);
        this.logger.log(`Resolved ESPN externalId for match ${matchId}: ${resolvedExternalId}`);
      }

      const espnId = resolvedExternalId.replace('espn_', '');
      const leagueSlug = this.getLeagueSlug(match.competition);
      this.logger.log(`Polling ESPN (${leagueSlug}) for match ${matchId} (espnId=${espnId})`);

      let live = await this.fetchESPNMatchDirect(espnId, leagueSlug);
      if (!live) {
        live = await this.fetchESPNLive(espnId, leagueSlug);
      }

      if (!live) {
        this.logger.warn(`No live data from ESPN for match ${matchId}`);
        return;
      }

      const { homeScore, awayScore, elapsed, period, statusType } = live;

      this.logger.log(`ESPN score: ${homeScore}x${awayScore} (${elapsed}) status=${statusType}`);

      const periodLabelMap: Record<string, string> = {
        STATUS_FIRST_HALF: '1\u00ba Tempo',
        STATUS_HALF_TIME: 'Intervalo',
        STATUS_SECOND_HALF: '2\u00ba Tempo',
        STATUS_EXTRA_TIME: 'Prorroga\u00e7\u00e3o',
      };
      const periodLabel = periodLabelMap[statusType] || '';
      const liveStats = {
        elapsed, period, periodLabel, statusType,
        ...(live.boxscore ?? {}),
      };

      const scoreChanged = match.homeScore !== homeScore || match.awayScore !== awayScore;
      await this.matchesService.update(matchId, {
        matchStats: liveStats,
        ...(scoreChanged ? { homeScore, awayScore } : {}),
      });
      if (scoreChanged) {
        this.eventsGateway.emitMatchUpdate(matchId, { homeScore, awayScore, time: elapsed, periodLabel });
      }

      const finishedStatuses = ['STATUS_FULL_TIME', 'STATUS_FINAL', 'STATUS_FINAL_AET', 'STATUS_FINAL_PEN', 'FT', 'AET', 'PEN'];
      const liveStatuses = ['STATUS_FIRST_HALF', 'STATUS_SECOND_HALF', 'STATUS_HALF_TIME', 'STATUS_EXTRA_TIME', '1H', '2H', 'HT', 'ET'];

      if (finishedStatuses.includes(statusType)) {
        await this.matchesService.update(matchId, {
          homeScore,
          awayScore,
          status: MatchStatus.FINISHED,
          matchStats: { ...liveStats, statusType: 'STATUS_FULL_TIME' },
        });
        this.eventsGateway.emitMatchFinished(matchId, { homeScore, awayScore });
        this.stopMonitoring(matchId);
        this.logger.log(`Match ${matchId} finished: ${homeScore}x${awayScore}`);

        // Process bolao results immediately after match finishes
        this.bolaoAgent.processResults(matchId).catch((err) =>
          this.logger.error('Error processing bolao results after finish: ' + (err as Error).message),
        );
      } else if (liveStatuses.includes(statusType)) {
        if (match.status !== MatchStatus.LIVE) {
          await this.matchesService.update(matchId, { status: MatchStatus.LIVE });
          this.eventsGateway.emitMatchStarted(matchId, {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
          });
        }
      }
    } catch (err) {
      this.logger.error('Error polling match ' + matchId + ': ' + (err as Error).message);
    }
  }

  startMonitoring(matchId: string, externalId?: string): void {
    if (this.activePolling.has(matchId)) return;
    this.logger.log('Starting monitoring for match ' + matchId);

    // Poll immediately first
    this.pollMatchScore(matchId, externalId || matchId);

    const interval = setInterval(async () => {
      await this.pollMatchScore(matchId, externalId || matchId);
    }, 30000); // every 30s

    this.activePolling.set(matchId, interval);
  }

  stopMonitoring(matchId: string): void {
    const interval = this.activePolling.get(matchId);
    if (interval) {
      clearInterval(interval);
      this.activePolling.delete(matchId);
      this.logger.log('Stopped monitoring for match ' + matchId);
    }
  }

  getActiveMonitoring(): string[] {
    return Array.from(this.activePolling.keys());
  }

  // Called on startup to resume monitoring any live matches
  async resumeLiveMatches(): Promise<void> {
    try {
      const liveMatches = await this.matchesRepo.find({
        where: { status: MatchStatus.LIVE },
      });
      for (const m of liveMatches) {
        if (m.externalId) {
          this.logger.log(`Resuming monitoring for live match ${m.id}`);
          this.startMonitoring(m.id, m.externalId);
        }
      }
    } catch (err) {
      this.logger.error('Error resuming live matches: ' + (err as Error).message);
    }
  }
}
