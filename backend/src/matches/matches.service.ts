import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Match, MatchStatus } from '../database/entities/match.entity';
import { AiContent } from '../database/entities/ai-content.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

import { User } from '../database/entities/user.entity';
import { getTeamLogo } from '../agents/match-fetch/espn-logos';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(AiContent)
    private aiContentRepo: Repository<AiContent>,
    private settings: SettingsService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async findAll(status?: string, limit?: number): Promise<Match[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.matchesRepository.find({
      where,
      order: { matchDate: "ASC" },
      take: limit ?? 200,
    });
  }

  async remove(id: string): Promise<void> {
    const match = await this.findById(id);
    await this.matchesRepository.remove(match);
  }

  async findById(id: string): Promise<Match> {
    const match = await this.matchesRepository.findOne({ where: { id } });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  async findUpcoming(): Promise<Match[]> {
    return this.matchesRepository.find({
      where: { status: MatchStatus.SCHEDULED },
      order: { matchDate: 'ASC' },
      take: 10,
    });
  }

  async findLive(): Promise<Match[]> {
    return this.matchesRepository.find({
      where: { status: MatchStatus.LIVE },
    });
  }

  async getNext(): Promise<Match | null> {
    // Return live match first (today's game), then next scheduled
    const live = await this.matchesRepository.findOne({
      where: { status: MatchStatus.LIVE },
      order: { matchDate: 'ASC' },
    });
    if (live) return live;
    return this.matchesRepository.findOne({
      where: { status: MatchStatus.SCHEDULED },
      order: { matchDate: 'ASC' },
    });
  }

  async getLiveDetail(id: string): Promise<any> {
    const match = await this.findById(id);
    const espnId = match.externalId?.replace('espn_', '');
    if (!espnId) return { match, lineup: null, events: [], stats: null };

    return new Promise((resolve) => {
      const https = require('https');
      // Slug ESPN correto por tipo de competicao
      const compSlugMap: Record<string, string> = {
        'LIBERTADORES': 'conmebol.libertadores',
        'SUL_AMERICANA': 'conmebol.sudamericana',
        'SULAMERICANA': 'conmebol.sudamericana',
        'COPA_BRASIL': 'bra.copa_do_brazil',
        'COPA_DO_BRASIL': 'bra.copa_do_brazil',
        'PAULISTAO': 'bra.campeonato_paulista',
      };
      const espnSlug = compSlugMap[(match.competition as string)?.toUpperCase?.()] ?? 'bra.1';
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${espnSlug}/summary?event=${espnId}`;
      const options = {
        hostname: 'site.api.espn.com',
        path: '/apis/v2/sports/soccer/bra.1/standings',
        headers: { 'User-Agent': 'curl/7.88.1', 'Accept': '*/*' }
      };
      https.get(options, (res: any) => {
        let data = '';
        res.on('data', (c: any) => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const comp = json?.header?.competitions?.[0];

            // Status/score
            const teams = comp?.competitors ?? [];
            const homeComp = teams.find((t: any) => t.homeAway === 'home');
            const awayComp = teams.find((t: any) => t.homeAway === 'away');
            const statusType = comp?.status?.type?.name ?? '';
            const elapsed = comp?.status?.displayClock ?? comp?.status?.type?.shortDetail ?? '';
            const period = comp?.status?.period ?? 0;
            const periodLabelMap: Record<string, string> = {
              STATUS_FIRST_HALF: '1º Tempo', STATUS_HALF_TIME: 'Intervalo',
              STATUS_SECOND_HALF: '2º Tempo', STATUS_EXTRA_TIME: 'Prorrogação',
              STATUS_FULL_TIME: 'Encerrado', STATUS_FINAL: 'Encerrado',
            };

            // Boxscore stats
            const bsTeams: any[] = json?.boxscore?.teams ?? [];
            const bsHome = bsTeams.find((t: any) => t.homeAway === 'home');
            const bsAway = bsTeams.find((t: any) => t.homeAway === 'away');
            const getStat = (team: any, name: string) => {
              const s = (team?.statistics ?? []).find((x: any) => x.name === name);
              return s ? parseFloat(s.displayValue) : null;
            };
            const stats = bsHome ? {
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
            } : null;

            // Lineups
            const rosters: any[] = json?.rosters ?? [];
            const lineupData = rosters.map((r: any) => ({
              homeAway: r.homeAway,
              teamName: r.team?.displayName ?? '',
              teamLogo: r.team?.logo ?? '',
              formation: r.formation ?? '',
              starters: (r.roster ?? []).filter((a: any) => a.starter).map((a: any) => ({
                name: a.athlete?.fullName ?? a.athlete?.displayName ?? '',
                shortName: a.athlete?.shortName ?? a.athlete?.fullName ?? a.athlete?.displayName ?? '',
                jersey: a.jersey ?? '',
                position: (typeof a.position === 'object' ? a.position?.abbreviation : a.position) ?? '',
                formationPlace: a.formationPlace ?? 0,
                subbedOut: !!a.subbedOut,
                subbedIn: !!a.subbedIn,
              })),
              substitutes: (r.roster ?? []).filter((a: any) => !a.starter).map((a: any) => ({
                name: a.athlete?.fullName ?? a.athlete?.displayName ?? '',
                shortName: a.athlete?.shortName ?? a.athlete?.fullName ?? a.athlete?.displayName ?? '',
                jersey: a.jersey ?? '',
                position: (typeof a.position === 'object' ? a.position?.abbreviation : a.position) ?? '',
                subbedIn: !!a.subbedIn,
              })),
            }));

            // Key events
            const keyEvents: any[] = (json?.keyEvents ?? []).filter((ke: any) =>
              ['Yellow Card', 'Red Card', 'Yellow Red Card', 'Goal', 'Penalty Goal', 'Own Goal', 'Substitution'].includes(ke?.type?.text ?? '')
            ).map((ke: any) => {
              const getName = (person: any) =>
                person?.shortName ??
                person?.fullName ??
                person?.displayName ??
                '';

              // ESPN structures player name in different places depending on event type
              const participants: any[] = ke.participants ?? ke.plays ?? [];
              const players: string[] = participants
                .map((p: any) =>
                  getName(p.athlete) ||
                  getName(p.player) ||
                  p.displayName ||
                  p.name ||
                  ''
                )
                .filter(Boolean);

              for (const directName of [getName(ke.athlete), getName(ke.player)]) {
                if (directName && !players.includes(directName)) players.push(directName);
              }

              // Substitution: ESPN often has athleteIn/athleteOut
              if (ke.type?.text === 'Substitution' && players.length === 0) {
                const inn = getName(ke.athleteIn) || getName(ke.playerIn);
                const out = getName(ke.athleteOut) || getName(ke.playerOut);
                if (inn || out) { if (out) players.push(out); if (inn) players.push(inn); }
              }

              if (players.length === 0 && ['Yellow Card', 'Red Card', 'Yellow Red Card'].includes(ke.type?.text ?? '')) {
                const shortText = `${ke.shortText ?? ''}`.trim();
                const text = `${ke.text ?? ''}`.trim();
                const fromShort = shortText.replace(/\s+(Yellow Card|Red Card|Yellow Red Card)$/i, '').trim();
                const fromTextMatch = text.match(/^(.+?)\s+\(.+?\)\s+is shown/i);
                const fallbackName = fromShort || fromTextMatch?.[1]?.trim() || '';
                if (fallbackName) players.push(fallbackName);
              }

              return {
                type: ke.type?.text ?? '',
                clock: ke.clock?.displayValue ?? ke.period?.displayValue ?? '',
                teamId: ke.team?.id ?? ke.homeAway ?? '',
                homeTeamId: homeComp?.id ?? '',
                players,
              };
            });

            resolve({
              match: {
                ...match,
                homeScore: Number(homeComp?.score ?? match.homeScore ?? 0),
                awayScore: Number(awayComp?.score ?? match.awayScore ?? 0),
              },
              live: { statusType, elapsed, period, periodLabel: periodLabelMap[statusType] || '' },
              stats,
              lineup: lineupData,
              events: keyEvents,
            });
          } catch (e) {
            resolve({ match, lineup: null, events: [], stats: null });
          }
        });
        res.on('error', () => resolve({ match, lineup: null, events: [], stats: null }));
      }).on('error', () => resolve({ match, lineup: null, events: [], stats: null }));
    });
  }

  async create(dto: CreateMatchDto): Promise<Match> {
    const homeTeamLogo = (!dto.homeTeamLogo && dto.homeTeam) ? getTeamLogo(dto.homeTeam) : dto.homeTeamLogo;
    const awayTeamLogo = (!dto.awayTeamLogo && dto.awayTeam) ? getTeamLogo(dto.awayTeam) : dto.awayTeamLogo;
    const match = this.matchesRepository.create({
      ...dto,
      matchDate: new Date(dto.matchDate),
      homeTeamLogo,
      awayTeamLogo,
    });
    return this.matchesRepository.save(match);
  }

  async update(id: string, dto: UpdateMatchDto): Promise<Match> {
    const requestedOpen = (dto as any).bolaoOpen;

    const existing = await this.matchesRepository.findOne({ where: { id } });

    // Finished matches cannot have bolao reopened
    if (requestedOpen === true) {
      if (existing?.status === MatchStatus.FINISHED) {
        (dto as any).bolaoOpen = false;
      }
    }
    const match = await this.findById(id);
    const wasPreviouslyOpen = match.bolaoOpen;
    const { matchDate, ...rest } = dto;
    Object.assign(match, rest);
    if (matchDate) match.matchDate = new Date(matchDate);
    const saved = await this.matchesRepository.save(match);

    // Dispara notificação de bolão aberto (async)
    if (requestedOpen === true && !wasPreviouslyOpen && saved.bolaoOpen) {
      this.notificationsService
        .notifyBolaoOpen(saved.id, saved.homeTeam, saved.awayTeam, saved.matchDate)
        .catch((err) => console.error('Falha ao notificar bolão aberto (push)', err));
      // Send bolão open email
      this.usersRepo.find({ where: { notifyBolaoOpen: true, isActive: true } })
        .then((users) => this.emailService.sendBolaoOpen(saved, users))
        .catch((err) => console.error('Falha ao enviar email bolão aberto', err));
    }

    if (requestedOpen === false && wasPreviouslyOpen && !saved.bolaoOpen) {
      this.notificationsService
        .notifyBolaoClose(saved.id, saved.homeTeam, saved.awayTeam, saved.matchDate)
        .catch((err) => console.error('Falha ao notificar bolão encerrado (push)', err));
    }

    return saved;
  }

  async closeBolao(id: string): Promise<Match> {
    const match = await this.findById(id);
    if (!match.bolaoOpen) return match;
    match.bolaoOpen = false;
    const saved = await this.matchesRepository.save(match);
    this.notificationsService
      .notifyBolaoClose(saved.id, saved.homeTeam, saved.awayTeam, saved.matchDate)
      .catch((err) => console.error('Falha ao notificar bolão encerrado (push)', err));
    return saved;
  }

  async setScore(id: string, homeScore: number, awayScore: number): Promise<Match> {
    const match = await this.findById(id);
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.status = MatchStatus.FINISHED;
    return this.matchesRepository.save(match);
  }

  async findOpen(): Promise<Match | null> {
    const match = await this.matchesRepository.findOne({
      where: [
        { status: MatchStatus.LIVE },
        { status: MatchStatus.SCHEDULED, bolaoOpen: true },
      ],
      order: { matchDate: 'ASC' },
    });
    return match ?? null;
  }

  async getStandings(): Promise<any> {
    const now = new Date();
    const cached = await this.aiContentRepo.findOne({
      where: { type: 'standings', expiresAt: MoreThan(now) },
      order: { generatedAt: 'DESC' },
    });
    if (cached) return cached.contentJson;

    // ── Try ESPN live standings first ──────────────────────────────
    try {
      const espnData = await this.fetchESPNStandings();
      if (espnData) {
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h cache
        await this.aiContentRepo.save(
          this.aiContentRepo.create({ type: 'standings', contentJson: espnData, expiresAt }),
        );
        return espnData;
      }
    } catch (espnErr: any) {
      // fall through to AI fallback
    }

    // ── Fallback: ask configured AI provider ───────────────────────
    try {
      const prompt =
        'Retorne a tabela de classificacao do Brasileirao Serie A 2026 com os 20 times. ' +
        'Formato EXATO: {"updatedAt":"<ISO date>","competition":"Brasileirao Serie A 2026","standings":[{"position":1,"team":"Nome","points":0,"games":0,"wins":0,"draws":0,"losses":0,"goalsFor":0,"goalsAgainst":0,"goalDiff":0}]}. ' +
        'Inclua o Corinthians. Retorne SOMENTE o JSON, sem texto adicional.';

      const text = await this.settings.completeAiText({
        prompt,
        maxTokens: 3000,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const contentJson = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await this.aiContentRepo.save(
        this.aiContentRepo.create({ type: 'standings', contentJson, expiresAt }),
      );

      return contentJson;
    } catch (err: any) {
      return { error: 'Nao foi possivel buscar a tabela de classificacao', details: err?.message };
    }
  }

  private async fetchESPNStandings(): Promise<any | null> {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const url = 'https://site.api.espn.com/apis/v2/sports/soccer/bra.1/standings';
      const options = {
        hostname: 'site.api.espn.com',
        path: '/apis/v2/sports/soccer/bra.1/standings',
        headers: { 'User-Agent': 'curl/7.88.1', 'Accept': '*/*' }
      };
      https.get(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: string) => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const group = json?.children?.[0];
            if (!group) return resolve(null);
            const entries = group?.standings?.entries ?? [];
            if (!entries.length) return resolve(null);

            const getStat = (entry: any, typeName: string): number => {
              const s = entry.stats?.find((x: any) =>
                x.type === typeName || x.name === typeName || x.abbreviation === typeName
              );
              return s ? Math.round(Number(s.value ?? s.displayValue ?? 0)) : 0;
            };

            const standings = entries.map((entry: any, i: number) => {
              const gp  = getStat(entry, 'gamesplayed');
              const w   = getStat(entry, 'wins');
              const d   = getStat(entry, 'ties');
              const l   = getStat(entry, 'losses');
              const gf  = getStat(entry, 'pointsfor');
              const ga  = getStat(entry, 'pointsagainst');
              const gd  = getStat(entry, 'pointdifferential');
              const pts = getStat(entry, 'points');
              return {
                position: i + 1,
                team: entry.team?.displayName ?? entry.team?.name ?? 'Desconhecido',
                logo: entry.team?.logos?.[0]?.href ?? '',
                points: pts,
                games: gp,
                wins: w,
                draws: d,
                losses: l,
                goalsFor: gf,
                goalsAgainst: ga,
                goalDiff: gd || (gf - ga),
              };
            });

            // sort by points desc
            standings.sort((a: any, b: any) => b.points - a.points || b.goalDiff - a.goalDiff);
            standings.forEach((s: any, i: number) => s.position = i + 1);

            resolve({
              updatedAt: new Date().toISOString(),
              competition: 'Brasileirao Serie A 2026',
              season: group.abbreviation ?? '2026',
              standings,
            });
          } catch (e) {
            reject(e);
          }
        });
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  async getSeasons(): Promise<string[]> {
    const rows = await this.matchesRepository
      .createQueryBuilder("m")
      .select("DISTINCT m.season", "season")
      .orderBy("m.season", "DESC")
      .getRawMany();
    return rows.map((r) => r.season).filter(Boolean);
  }

  async getCompetitions(): Promise<string[]> {
    const rows = await this.matchesRepository
      .createQueryBuilder("m")
      .select("DISTINCT m.competition", "competition")
      .getRawMany();
    return rows.map((r) => r.competition).filter(Boolean);
  }


  private readonly logger = new Logger(MatchesService.name);

  /** Runs every 5 minutes: auto-opens bolao for the next scheduled match if enabled */
  @Cron('*/5 * * * *')
  async autoBolaoCheck(): Promise<void> {
    try {
      const enabled = await this.settings.get('bolao_auto_open');
      if (enabled !== 'true') return;

      // If any match already has bolao open, do nothing
      const alreadyOpen = await this.matchesRepository.findOne({
        where: { bolaoOpen: true, status: MatchStatus.SCHEDULED },
      });
      if (alreadyOpen) return;

      // Find the next scheduled match by date
      const next = await this.matchesRepository.findOne({
        where: { status: MatchStatus.SCHEDULED, bolaoOpen: false },
        order: { matchDate: 'ASC' },
      });
      if (!next) return;

      this.logger.log(`Auto-opening bolao: ${next.homeTeam} x ${next.awayTeam} (${next.id})`);
      await this.update(next.id, { bolaoOpen: true } as any);
    } catch (err) {
      this.logger.error('autoBolaoCheck error', err);
    }
  }

  async getAutoBolaoStatus(): Promise<{ enabled: boolean; nextMatch: Match | null }> {
    const val = await this.settings.get('bolao_auto_open');
    const enabled = val === 'true';

    // Next scheduled match not yet open
    const nextMatch = await this.matchesRepository.findOne({
      where: { status: MatchStatus.SCHEDULED, bolaoOpen: false },
      order: { matchDate: 'ASC' },
    });

    return { enabled, nextMatch: nextMatch ?? null };
  }

  async setAutoBolao(enabled: boolean, userId: string): Promise<{ enabled: boolean }> {
    await this.settings.set('bolao_auto_open', enabled ? 'true' : 'false', userId);
    return { enabled };
  }

}
