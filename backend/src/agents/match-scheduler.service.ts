import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from "typeorm";
import { Match, MatchStatus } from "../database/entities/match.entity";
import { MatchLiveService } from "./match-live/match-live.service";
import { BolaoAgentService } from "./bolao-agent/bolao-agent.service";
import { EventsGateway } from "../websocket/events.gateway";
import { NotificationsService } from "../notifications/notifications.service";
import { SettingsService } from "../settings/settings.service";

@Injectable()
export class MatchSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(MatchSchedulerService.name);
  private processingResults = new Set<string>();

  constructor(
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    private matchLive: MatchLiveService,
    private bolaoAgent: BolaoAgentService,
    private events: EventsGateway,
    private notifications: NotificationsService,
    private settings: SettingsService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Resume monitoring for any matches that are already live (e.g. after restart)
    setTimeout(() => this.matchLive.resumeLiveMatches(), 5000);
  }

  /** Every minute: check scheduled matches that should start monitoring */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkMatchLifecycle(): Promise<void> {
    const now = new Date();

    // 1. Close bolão for matches starting within 1 min
    const closeSoon = await this.matchRepo.find({
      where: { status: MatchStatus.SCHEDULED, bolaoOpen: true },
    });
    for (const m of closeSoon) {
      const minsUntilStart = (m.matchDate.getTime() - now.getTime()) / 60000;
      if (minsUntilStart <= 1 && minsUntilStart > -5) {
        m.bolaoOpen = false;
        await this.matchRepo.save(m);
        this.events.emitBolaoClose(m.id);
        this.notifications
          .notifyBolaoClose(m.id, m.homeTeam, m.awayTeam, m.matchDate)
          .catch((err) => this.logger.error(`Falha ao enviar push de bolão encerrado (${m.id}): ${(err as Error).message}`));
        this.logger.log(`Bolão closed for match ${m.id} (${m.homeTeam} x ${m.awayTeam})`);
      }
    }

    // 2. Start live monitoring for matches that started in last 120 min
    const recentlyStarted = await this.matchRepo.find({
      where: { status: MatchStatus.SCHEDULED },
    });
    for (const m of recentlyStarted) {
      const minsAgo = (now.getTime() - m.matchDate.getTime()) / 60000;
      if (minsAgo >= 0 && minsAgo < 120) {
        m.status = MatchStatus.LIVE;
        m.bolaoOpen = false;
        await this.matchRepo.save(m);
        this.matchLive.startMonitoring(m.id, m.externalId ?? undefined);
        this.events.emitMatchStarted(m.id, { homeTeam: m.homeTeam, awayTeam: m.awayTeam });
        this.logger.log(`Match started: ${m.homeTeam} x ${m.awayTeam}`);
      }
    }

    // 3. Auto-finish LIVE matches older than 130 min (no external API)
    const liveMatches = await this.matchRepo.find({ where: { status: MatchStatus.LIVE } });
    for (const m of liveMatches) {
      const minsAgo = (now.getTime() - m.matchDate.getTime()) / 60000;
      if (minsAgo >= 130 && !this.processingResults.has(m.id)) {
        // If no external monitoring active, mark as needing score input
        const isMonitored = this.matchLive.getActiveMonitoring().includes(m.id);
        if (!isMonitored) {
          this.logger.log(`Match ${m.id} may be over (${minsAgo}min) — flagging for manual check`);
          // Only auto-finish if score has been set
          if (m.homeScore !== null && m.awayScore !== null) {
            await this.finishMatch(m);
          }
        }
      }
    }
  }

  async finishMatch(match: Match): Promise<void> {
    if (this.processingResults.has(match.id)) return;
    this.processingResults.add(match.id);
    try {
      match.status = MatchStatus.FINISHED;
      await this.matchRepo.save(match);
      this.matchLive.stopMonitoring(match.id);
      this.events.emitMatchFinished(match.id, {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      });
      this.logger.log(`Match finished: ${match.homeTeam} ${match.homeScore}x${match.awayScore} ${match.awayTeam}`);
      // Process bolão results
      await this.bolaoAgent.processResults(match.id);
    } finally {
      this.processingResults.delete(match.id);
    }
  }

  /** Every 5 min: re-poll active live matches to fetch latest scores */
  @Cron("*/5 * * * *")
  async pollLiveMatches(): Promise<void> {
    const active = this.matchLive.getActiveMonitoring();
    if (active.length === 0) return;
    this.logger.debug(`Polling ${active.length} live match(es)...`);
    for (const matchId of active) {
      const m = await this.matchRepo.findOne({ where: { id: matchId } });
      if (m) await this.matchLive.pollMatchScore(matchId, m.externalId ?? matchId);
    }
  }
}
