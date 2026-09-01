import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prediction } from '../database/entities/prediction.entity';
import { MatchScore } from '../database/entities/match-score.entity';
import { SeasonRanking } from '../database/entities/season-ranking.entity';
import { AiContent } from '../database/entities/ai-content.entity';
import { MatchesService } from '../matches/matches.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';

const BOLAO_CONFIG_KEYS = [
  'bolao_prize_first',
  'bolao_prize_second',
  'bolao_prize_third',
  'bolao_points_sole_winner',
  'bolao_points_shared_winner',
  'bolao_tiebreak_criteria',
  'bolao_tiebreak_1st',
  'bolao_tiebreak_2nd',
  'bolao_tiebreak_3rd',
  'bolao_season',
  'bolao_close_minutes_before',
] as const;

@Injectable()
export class BolaoService {
  private readonly logger = new Logger(BolaoService.name);
  constructor(
    @InjectRepository(Prediction)
    private predictionsRepo: Repository<Prediction>,
    @InjectRepository(AiContent)
    private aiContentRepo: Repository<AiContent>,
    @InjectRepository(MatchScore)
    private matchScoresRepo: Repository<MatchScore>,
    @InjectRepository(SeasonRanking)
    private rankingRepo: Repository<SeasonRanking>,
    private matchesService: MatchesService,
    private settings: SettingsService,
    private notificationsService: NotificationsService,
  ) {}

  async getConfig(): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};
    for (const key of BOLAO_CONFIG_KEYS) {
      result[key] = await this.settings.get(key);
    }
    return result;
  }

  async saveConfig(data: Record<string, string>, userId: string): Promise<Record<string, string | null>> {
    const filtered: Record<string, string> = {};
    for (const key of BOLAO_CONFIG_KEYS) {
      if (data[key] !== undefined && data[key] !== null) {
        filtered[key] = String(data[key]);
      }
    }
    await this.settings.setBulk(filtered, userId);
    return this.getConfig();
  }

  async submitPrediction(
    userId: string,
    matchId: string,
    homeScore: number,
    awayScore: number,
  ): Promise<Prediction> {
    const match = await this.matchesService.findById(matchId);

    if (!match.bolaoOpen) {
      throw new BadRequestException('Bolao is closed for this match');
    }

    // Verifica tempo apenas para jogos agendados; se status=live e bolaoOpen=true, permite
    if (match.status === 'scheduled') {
      const now = new Date();
      const matchTime = new Date(match.matchDate);
      const diffMs = matchTime.getTime() - now.getTime();
      if (diffMs < 60000) {
        throw new BadRequestException('Bolao closes 1 minute before the match');
      }
    }

    const existing = await this.predictionsRepo.findOne({
      where: { userId, matchId },
    });

    if (existing) {
      existing.homeScore = homeScore;
      existing.awayScore = awayScore;
      existing.changeCount += 1;
      return this.predictionsRepo.save(existing);
    }

    const prediction = this.predictionsRepo.create({
      userId,
      matchId,
      homeScore,
      awayScore,
    });
    return this.predictionsRepo.save(prediction);
  }

  async getPredictions(matchId: string): Promise<any[]> {
    const preds = await this.predictionsRepo.find({
      where: { matchId },
      relations: ['user'],
      order: { submittedAt: 'ASC' } as any,
    });
    return preds.map(p => ({
      id: p.id,
      nick: p.user?.nick ?? '—',
      fullName: p.user?.fullName ?? '—',
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      submittedAt: p.submittedAt,
      updatedAt: p.updatedAt,
    }));
  }


  async getUserPredictions(userId: string): Promise<any[]> {
    return this.predictionsRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.match", "m")
      .where("p.userId = :userId", { userId })
      .orderBy("m.match_date", "DESC")
      .take(50)
      .getMany();
  }

  async getUserPrediction(userId: string, matchId: string): Promise<Prediction | null> {
    return this.predictionsRepo.findOne({ where: { userId, matchId } });
  }

  async calculateResults(
    matchId: string,
    actualHome: number,
    actualAway: number,
  ): Promise<MatchScore[]> {
    const predictions = await this.predictionsRepo.find({ where: { matchId } });

    const winners = predictions.filter(
      (p) => p.homeScore === actualHome && p.awayScore === actualAway,
    );

    const isSoleWinner = winners.length === 1;
    const points = winners.length > 0 ? (isSoleWinner ? 2 : 1) : 0;

    const scores: MatchScore[] = [];

    for (const prediction of predictions) {
      const isWinner =
        prediction.homeScore === actualHome &&
        prediction.awayScore === actualAway;

      const score = this.matchScoresRepo.create({
        userId: prediction.userId,
        matchId,
        points: isWinner ? points : 0,
        isSoleWinner: isWinner && isSoleWinner,
        predictedHome: prediction.homeScore,
        predictedAway: prediction.awayScore,
        actualHome,
        actualAway,
      });
      scores.push(await this.matchScoresRepo.save(score));

      await this.updateSeasonRanking(
        prediction.userId,
        new Date(Date.now()).getFullYear().toString(),
        isWinner ? points : 0,
        isWinner,
        isWinner && isSoleWinner,
      );
    }

    // Dispara notificações de resultado (async — não bloqueia a resposta)
    this.matchesService.findById(matchId).then((match) => {
      this.notificationsService
        .notifyMatchResult(matchId, match.homeTeam, match.awayTeam, actualHome, actualAway)
        .catch((err) => this.logger.error('Falha ao enviar notificação de resultado', err));
    });

    return scores;
  }

  private async updateSeasonRanking(
    userId: string,
    season: string,
    pointsEarned: number,
    won: boolean,
    soleWin: boolean,
  ): Promise<void> {
    let ranking = await this.rankingRepo.findOne({ where: { userId, season } });

    if (!ranking) {
      ranking = this.rankingRepo.create({ userId, season, totalPoints: 0, gamesPlayed: 0, gamesWon: 0, soleWins: 0 });
    }

    ranking.totalPoints = (ranking.totalPoints ?? 0) + pointsEarned;
    ranking.gamesPlayed = (ranking.gamesPlayed ?? 0) + 1;
    if (won) ranking.gamesWon = (ranking.gamesWon ?? 0) + 1;
    if (soleWin) ranking.soleWins = (ranking.soleWins ?? 0) + 1;

    await this.rankingRepo.save(ranking);
    await this.recalculatePositions(season);
  }

  private async recalculatePositions(season: string): Promise<void> {
    // Conta palpites reais por usuário no ano (fonte da verdade para desempate)
    const preds: Array<{ user_id: string; total: string }> = await this.rankingRepo.query(
      `SELECT p.user_id, COUNT(*)::text AS total
       FROM predictions p
       JOIN matches m ON m.id = p.match_id
       WHERE m.season = $1
       GROUP BY p.user_id`,
      [season],
    );
    const predsMap = new Map<string, number>();
    for (const r of preds) predsMap.set(r.user_id, Number(r.total));

    const rankings = await this.rankingRepo.find({ where: { season } });

    // Ordenação: pontos → sozinho → palpites (critério de desempate oficial)
    rankings.sort((a, b) => {
      const dp = (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
      if (dp !== 0) return dp;
      const ds = (b.soleWins ?? 0) - (a.soleWins ?? 0);
      if (ds !== 0) return ds;
      const dpr = (predsMap.get(b.userId) ?? 0) - (predsMap.get(a.userId) ?? 0);
      return dpr;
    });

    // DENSE_RANK: empates totais (mesmos pontos+sozinho+palpites) recebem mesma posição
    let densePos = 0;
    let prevKey = '';
    for (let i = 0; i < rankings.length; i++) {
      const r = rankings[i];
      const key = `${r.totalPoints ?? 0}|${r.soleWins ?? 0}|${predsMap.get(r.userId) ?? 0}`;
      if (key !== prevKey) {
        densePos++;
        prevKey = key;
      }
      rankings[i].position = densePos;
      await this.rankingRepo.save(rankings[i]);
    }
  }

  async getRanking(season: string): Promise<any[]> {
    // Conta palpites reais por user na temporada (fonte da verdade p/ desempate)
    const preds: Array<{ user_id: string; total: string }> = await this.rankingRepo.query(
      `SELECT p.user_id, COUNT(*)::text AS total
       FROM predictions p
       JOIN matches m ON m.id = p.match_id
       WHERE m.season = $1
       GROUP BY p.user_id`,
      [season],
    );
    const predsMap = new Map<string, number>();
    for (const r of preds) predsMap.set(r.user_id, Number(r.total));

    const rows = await this.rankingRepo.find({
      where: { season },
      relations: ['user'],
      order: { position: 'ASC' },
    });
    return rows.map((r) => ({ ...r, totalPredictions: predsMap.get(r.userId) ?? 0 }));
  }

  async getScoresWithUsers(matchId: string): Promise<MatchScore[]> {
    return this.matchScoresRepo.find({
      where: { matchId },
      relations: ['user'],
      order: { points: 'DESC' },
    });
  }

  async getMatchResult(matchId: string): Promise<any> {
    const match = await this.matchesService.findById(matchId);
    if (!match) return null;

    // For finished matches, use match_scores (has calculated points)
    // For ongoing/upcoming, use predictions table
    let results: any[] = [];
    if (match.status === 'finished') {
      let scores = await this.matchScoresRepo.find({
        where: { matchId },
        relations: ['user'],
        order: { points: 'DESC' },
      });
      // If no scores computed yet but match has final scores, compute them now
      if (scores.length === 0 && match.homeScore !== null && match.awayScore !== null) {
        const preds = await this.predictionsRepo.find({ where: { matchId } });
        if (preds.length > 0) {
          await this.calculateResults(matchId, match.homeScore, match.awayScore);
          scores = await this.matchScoresRepo.find({
            where: { matchId },
            relations: ['user'],
            order: { points: 'DESC' },
          });
        }
      }
      results = scores.map((s) => ({
        user: { id: s.user?.id, nick: s.user?.nick ?? 'Participante', avatarUrl: s.user?.avatarUrl },
        predicted: `${s.predictedHome}x${s.predictedAway}`,
        points: s.points,
        isSoleWinner: s.isSoleWinner,
      }));
    } else {
      // Show predictions without revealing points yet
      const preds = await this.predictionsRepo.find({
        where: { matchId },
        relations: ['user'],
        order: { submittedAt: 'ASC' },
      });
      results = preds.map((p) => ({
        user: { id: p.user?.id, nick: p.user?.nick ?? 'Participante', avatarUrl: p.user?.avatarUrl },
        predicted: p.homeScore + 'x' + p.awayScore,
        points: 0,
        isSoleWinner: false,
      }));
    }

    return {
      match: {
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: match.status,
        competition: match.competition,
        roundLabel: match.roundLabel,
        roundNumber: match.roundNumber,
        season: match.season,
        matchDate: match.matchDate,
        stadium: match.stadium,
        tvChannel: match.tvChannel,
        streamUrl: match.streamUrl,
        matchStats: match.matchStats ?? null,
      },
      results,
      winners: results.filter((r) => r.points > 0).length,
      totalParticipants: results.length,
    };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndCloseExpired(): Promise<void> {
    const now = new Date();
    const closeTime = new Date(now.getTime() + 60000);

    const matches = await this.matchesService.findUpcoming();
    for (const match of matches) {
      if (match.bolaoOpen && new Date(match.matchDate) <= closeTime) {
        await this.matchesService.closeBolao(match.id);
      }
    }
  }

  async getMyScores(userId: string, limit = 10): Promise<any[]> {
    const predictions = await this.predictionsRepo.find({
      where: { userId },
      relations: ['match'],
      order: { submittedAt: 'DESC' },
      take: limit,
    });

    // Fetch actual scored points from match_scores table
    const matchIds = predictions.map(p => p.matchId);
    const scoredMap = new Map<string, number>();
    if (matchIds.length > 0) {
      const scores = await this.matchScoresRepo.find({
        where: matchIds.map(mid => ({ userId, matchId: mid })),
      });
      for (const s of scores) {
        scoredMap.set(s.matchId, s.points);
      }
    }

    return predictions.map((p) => {
      const m = p.match;
      const points = scoredMap.get(p.matchId) ?? 0;
      return {
        id: p.id,
        matchId: p.matchId,
        predictedHome: p.homeScore,
        predictedAway: p.awayScore,
        actualHome: m?.homeScore ?? null,
        actualAway: m?.awayScore ?? null,
        points,
        submittedAt: p.submittedAt,
        match: m ? {
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          matchDate: m.matchDate,
          status: m.status,
          competition: m.competition,
        } : null,
      };
    });
  }

  async getHistorico(filters: {
    season?: string; competition?: string; dateFrom?: string; dateTo?: string;
  }): Promise<any[]> {
    const matches = await this.matchesService.findAll("finished", 100);
    let filtered = matches;
    if (filters.season)      filtered = filtered.filter(m => m.season === filters.season);
    if (filters.competition) filtered = filtered.filter(m => m.competition === filters.competition);
    if (filters.dateFrom)    filtered = filtered.filter(m => new Date(m.matchDate) >= new Date(filters.dateFrom!));
    if (filters.dateTo)      filtered = filtered.filter(m => new Date(m.matchDate) <= new Date(filters.dateTo!));

    return Promise.all(filtered.map(async (m) => {
      const predictions = await this.predictionsRepo.find({
        where: { matchId: m.id },
        relations: ["user"],
      });
      const winners = predictions.filter(p => p.homeScore === m.homeScore && p.awayScore === m.awayScore);
      return {
        ...m,
        totalPredictions: predictions.length,
        winners: winners.map(p => ({ nick: p.user?.nick, homeScore: p.homeScore, awayScore: p.awayScore })),
      };
    }));
  }

  private insightsInProgress = new Set<string>();

  async getMatchInsights(matchId: string): Promise<any> {
    // Stats from DB — always fast
    const preds = await this.predictionsRepo.find({ where: { matchId } });
    const match = await this.matchesService.findById(matchId);

    const baseResult = {
      totalPredictions: 0,
      topPrediction: null as string | null,
      topPredictionCount: 0,
      topPredictionPct: 0,
      distribution: [],
      winPct: 0,
      drawPct: 0,
      lossPct: 0,
      aiContext: null as string | null,
    } as any;

    if (preds.length > 0) {
      const dist: Record<string, number> = {};
      let wins = 0, draws = 0, losses = 0;
      const homeIsSccp = /corinthians/i.test(match.homeTeam);
      for (const p of preds) {
        const key = `${p.homeScore}-${p.awayScore}`;
        dist[key] = (dist[key] || 0) + 1;
        if (homeIsSccp) {
          if (p.homeScore > p.awayScore) wins++;
          else if (p.homeScore === p.awayScore) draws++;
          else losses++;
        } else {
          if (p.awayScore > p.homeScore) wins++;
          else if (p.homeScore === p.awayScore) draws++;
          else losses++;
        }
      }
      const total = preds.length;
      const sortedDist = Object.entries(dist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([score, count]) => ({
          score: score.replace('-', ' × '),
          count,
          pct: Math.round((count / total) * 100),
        }));
      baseResult.totalPredictions = total;
      baseResult.topPrediction = sortedDist[0]?.score ?? null;
      baseResult.topPredictionCount = sortedDist[0]?.count ?? 0;
      baseResult.topPredictionPct = sortedDist[0]?.pct ?? 0;
      (baseResult as any).distribution = sortedDist;
      // Largest-remainder method: garante que winPct+drawPct+lossPct === 100
      const rawWin  = (wins  / total) * 100;
      const rawDraw = (draws / total) * 100;
      const rawLoss = (losses / total) * 100;
      const fWin  = Math.floor(rawWin);
      const fDraw = Math.floor(rawDraw);
      const fLoss = Math.floor(rawLoss);
      const rem = 100 - fWin - fDraw - fLoss;
      const cands = [
        { key: 'win',  frac: rawWin  - fWin  },
        { key: 'draw', frac: rawDraw - fDraw },
        { key: 'loss', frac: rawLoss - fLoss },
      ].sort((a, b) => b.frac - a.frac);
      const bonus: Record<string, number> = { win: 0, draw: 0, loss: 0 };
      for (let i = 0; i < rem; i++) bonus[cands[i].key]++;
      baseResult.winPct  = fWin  + bonus.win;
      baseResult.drawPct = fDraw + bonus.draw;
      baseResult.lossPct = fLoss + bonus.loss;
    }

    // AI context — from cache only (24h TTL), refresh in background if stale
    const INSIGHTS_TTL = 24 * 60 * 60 * 1000;
    const cached = await this.aiContentRepo.findOne({
      where: { type: 'match_insights', matchId },
      order: { generatedAt: 'DESC' },
    });
    const cacheAge = cached ? Date.now() - new Date(cached.generatedAt).getTime() : Infinity;

    if (cached) {
      baseResult.aiContext = (cached.contentJson as any)?.aiContext ?? null;
    }

    // Trigger background refresh if cache is missing or stale
    if (cacheAge >= INSIGHTS_TTL && !this.insightsInProgress.has(matchId)) {
      this.refreshMatchInsights(matchId, match).catch((e: Error) =>
        this.logger.warn('Background insights refresh failed: ' + e.message),
      );
    }

    return baseResult;
  }

  async refreshMatchInsights(matchId: string, match?: any): Promise<void> {
    if (this.insightsInProgress.has(matchId)) return;
    this.insightsInProgress.add(matchId);
    try {
      if (!match) match = await this.matchesService.findById(matchId);
      if (!(await this.settings.hasAiProvider())) return;
      const matchDate = new Date(match.matchDate).toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      });
      const prompt = `Você é um analista de futebol especialista em Corinthians. Forneça um breve contexto histórico e relevante sobre o confronto:

Time da Casa: ${match.homeTeam}
Visitante: ${match.awayTeam}
Competição: ${match.competition}
${match.roundLabel ? 'Rodada/Fase: ' + match.roundLabel : ''}
Data: ${matchDate}
${match.stadium ? 'Estádio: ' + match.stadium + (match.city ? ' — ' + match.city : '') : ''}

Foque em: histórico de confrontos entre os times, contexto da competição, importância do jogo.

REGRAS ABSOLUTAS:
1. NUNCA invente odds, probabilidades ou percentuais de vitória
2. APENAS fatos históricos verificados do seu treinamento
3. Se não tiver dados históricos sobre esses dois times, diga que o confronto é pouco frequente
4. Máximo 4 parágrafos curtos
5. Escreva em português brasileiro`;

      const aiContext = await this.settings.completeAiText({
        prompt,
        maxTokens: 600,
        system: 'Você é analista esportivo especializado em Corinthians. Responda APENAS com fatos verificados. NUNCA invente odds ou percentuais.',
      });

      const existing = await this.aiContentRepo.findOne({ where: { type: 'match_insights', matchId } });
      if (existing) {
        existing.contentJson = { aiContext };
        existing.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.aiContentRepo.save(existing);
      } else {
        await this.aiContentRepo.save(
          this.aiContentRepo.create({
            type: 'match_insights',
            matchId,
            contentJson: { aiContext },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }),
        );
      }
      this.logger.log('Insights aiContext refreshed for match ' + matchId);
    } catch (err) {
      this.logger.warn('refreshMatchInsights failed: ' + (err as Error).message);
    } finally {
      this.insightsInProgress.delete(matchId);
    }
  }


  // ─── ODDS SCHEDULER ──────────────────────────────────────────────────────
  private oddsInProgress = new Set<string>();

  private getOddsRefreshIntervalMs(matchDate: Date): number | null {
    const minsToKickoff = (matchDate.getTime() - Date.now()) / 60000;
    if (minsToKickoff > 1440) return 24 * 60 * 60 * 1000; // >1 day away: refresh once/day
    if (minsToKickoff > 240)  return 4 * 60 * 60 * 1000;  // >4h: refresh every 4h
    if (minsToKickoff > 120)  return 2 * 60 * 60 * 1000;  // >2h: refresh every 2h
    if (minsToKickoff > 30)   return 60 * 60 * 1000;      // >30min: refresh every 1h
    if (minsToKickoff > 0)    return 30 * 60 * 1000;      // live: refresh every 30min
    if (minsToKickoff > -110) return 30 * 60 * 1000;      // just finished: refresh every 30min
    return null;
  }

  @Cron('*/5 * * * *')
  async oddsSchedulerTick(): Promise<void> {
    try {
      const allMatches = await this.matchesService.findAll(undefined, undefined);
      const relevant = allMatches.filter(
        (m: any) => m.bolaoOpen === true || m.status === 'live',
      );
      for (const match of relevant) {
        const interval = this.getOddsRefreshIntervalMs(new Date(match.matchDate));
        if (interval === null || this.oddsInProgress.has(match.id)) continue;
        const cached = await this.aiContentRepo.findOne({
          where: { type: 'match_odds', matchId: match.id },
          order: { generatedAt: 'DESC' },
        });
        const isExpired = !cached || !cached.expiresAt || new Date(cached.expiresAt) <= new Date();
        if (isExpired) {
          this.logger.log(`Odds scheduler: refreshing ${match.homeTeam} x ${match.awayTeam}`);
          this.refreshMatchOdds(match.id, interval).catch((e: Error) =>
            this.logger.warn('Scheduled odds refresh failed: ' + e.message),
          );
        }
      }
    } catch (err) {
      this.logger.warn('oddsSchedulerTick error: ' + (err as Error).message);
    }
  }

  async getMatchOdds(matchId: string): Promise<any> {
    const cached = await this.aiContentRepo.findOne({
      where: { type: 'match_odds', matchId },
      order: { generatedAt: 'DESC' },
    });
    if (cached) {
      const refreshedAtRaw = cached.contentJson?.updatedAt ?? cached.generatedAt;
      const refreshedAt = new Date(refreshedAtRaw);
      const ageBase = Number.isNaN(refreshedAt.getTime()) ? new Date(cached.generatedAt) : refreshedAt;
      const ageMs = Date.now() - ageBase.getTime();
      const ageLabel =
        ageMs < 60000
          ? 'agora mesmo'
          : ageMs < 3600000
          ? `${Math.round(ageMs / 60000)} min atrás`
          : `${Math.round(ageMs / 3600000)}h atrás`;
      return { ...cached.contentJson, found: true, cached: true, cacheLabel: ageLabel };
    }
    if (!this.oddsInProgress.has(matchId)) {
      this.logger.log('No cache — immediate background odds fetch for ' + matchId);
      this.refreshMatchOdds(matchId).catch((e: Error) =>
        this.logger.warn('Immediate odds fetch failed: ' + e.message),
      );
    }
    return { found: false, loading: true, reason: 'Buscando odds pela primeira vez...' };
  }


  async refreshMatchOdds(matchId: string, ttlOverride?: number): Promise<any> {
    if (this.oddsInProgress.has(matchId)) return null;
    this.oddsInProgress.add(matchId);
    const match = await this.matchesService.findById(matchId);
    try {
      if (!(await this.settings.hasAiProvider())) return null;
      const matchDate = new Date(match.matchDate).toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      });
      const hora = new Date(match.matchDate).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit',
      });
      const resultText = await this.settings.completeAiText({
        maxTokens: 512,
        system: `Você é um analista esportivo especializado em odds de futebol brasileiro.
Forneça odds estimadas baseadas no histórico e força das equipes.
Retorne SOMENTE o JSON, sem texto adicional.
Formato: {"homeWin":{"odd":2.10,"label":"Vitória TIME_CASA"},"draw":{"odd":3.20,"label":"Empate"},"awayWin":{"odd":3.50,"label":"Vitória TIME_FORA"},"source":"Estimativa","updatedAt":"${new Date().toISOString()}","summary":"análise em 1 frase","found":true}`,
        prompt: `Forneça odds estimadas para: ${match.homeTeam} x ${match.awayTeam} — ${match.competition}${match.roundLabel ? ' ' + match.roundLabel : ''} — ${matchDate} às ${hora}`,
      });
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      // Cache even "not found" results to prevent repeated calls (2h TTL)
      const NOT_FOUND_TTL = ttlOverride ? Math.min(ttlOverride, 2 * 60 * 60 * 1000) : 2 * 60 * 60 * 1000;
      const FOUND_TTL = ttlOverride ?? 6 * 60 * 60 * 1000;
      if (!jsonMatch) {
        await this.saveOddsCache(matchId, { found: false, reason: 'Resposta inválida' }, NOT_FOUND_TTL);
        return { found: false, reason: 'Resposta inválida da busca' };
      }
      const data = JSON.parse(jsonMatch[0]);
      if (!data.found) {
        await this.saveOddsCache(matchId, { found: false, reason: data.reason || 'Odds não disponíveis' }, NOT_FOUND_TTL);
        return { found: false, reason: data.reason || 'Odds não encontradas' };
      }
      // Compute implied probabilities
      if (data.homeWin?.odd && data.draw?.odd && data.awayWin?.odd) {
        const h = 1 / data.homeWin.odd, d = 1 / data.draw.odd, a = 1 / data.awayWin.odd;
        const t = h + d + a;
        data.homeWin.pct = Math.round((h / t) * 100);
        data.draw.pct    = Math.round((d / t) * 100);
        data.awayWin.pct = Math.round((a / t) * 100);
      }
      await this.saveOddsCache(matchId, data, FOUND_TTL);
      this.logger.log('Odds refreshed and cached for match ' + matchId);
      return data;
    } catch (err) {
      this.logger.warn('Odds refresh failed: ' + (err as Error).message);
      return null;
    } finally {
      this.oddsInProgress.delete(matchId);
    }
  }

  private async saveOddsCache(matchId: string, data: any, ttlMs: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMs);
    const existing = await this.aiContentRepo.findOne({ where: { type: 'match_odds', matchId } });
    if (existing) {
      existing.contentJson = data;
      existing.expiresAt = expiresAt;
      await this.aiContentRepo.save(existing);
    } else {
      await this.aiContentRepo.save(
        this.aiContentRepo.create({ type: 'match_odds', matchId, contentJson: data, expiresAt }),
      );
    }
  }

}
