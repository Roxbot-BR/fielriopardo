import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, Query, Request } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Prediction } from "../database/entities/prediction.entity";
import { MatchScore } from "../database/entities/match-score.entity";
import { SeasonRanking } from "../database/entities/season-ranking.entity";
import { MasterService }         from "./master.service";
import { JwtAuthGuard }          from "../common/guards/jwt-auth.guard";
import { MasterOnlyGuard }       from "../common/guards/master-only.guard";
import { RolesGuard }            from "../common/guards/roles.guard";
import { Roles }                 from "../common/decorators/roles.decorator";
import { NewsAgentService } from "../agents/news/news-agent.service";
import { MatchSchedulerService } from "../agents/match-scheduler.service";
import { MatchLiveService }      from "../agents/match-live/match-live.service";
import { MatchFetchService }     from "../agents/match-fetch/match-fetch.service";
import { SettingsService }       from "../settings/settings.service";
import { MatchesService }        from "../matches/matches.service";
import { UsersService }          from "../users/users.service";
import { AuditService }          from "../audit/audit.service";
import { EmailService }          from "../email/email.service";
import { NotificationsService }  from "../notifications/notifications.service";

@Controller("master")
@UseGuards(JwtAuthGuard)
export class MasterController {
  constructor(
    private svc: MasterService,
    private newsAgent: NewsAgentService,
    private scheduler: MatchSchedulerService,
    private matchLive: MatchLiveService,
    private matchFetch: MatchFetchService,
    private matchesService: MatchesService,
    private usersService: UsersService,
    private audit: AuditService,
    private settings: SettingsService,
    private email: EmailService,
    private notifications: NotificationsService,
    @InjectRepository(Prediction) private predictionsRepo: Repository<Prediction>,
    @InjectRepository(MatchScore) private matchScoreRepo: Repository<MatchScore>,
    @InjectRepository(SeasonRanking) private rankingRepo: Repository<SeasonRanking>,
  ) {}

  // ── MASTER-ONLY endpoints ─────────────────────────────────────
  @Get("stats")
  @UseGuards(MasterOnlyGuard)
  getStats() { return this.svc.getStats(); }

  @Get("audit")
  @UseGuards(MasterOnlyGuard)
  getAudit(@Query("limit") l?: string, @Query("page") p?: string, @Query("module") m?: string, @Query("user") u?: string) {
    const limit = l ? +l : 100;
    const offset = p ? (+p - 1) * limit : 0;
    return this.svc.getAuditLogs(limit, offset, m, u);
  }

  @Post("admin")
  @UseGuards(MasterOnlyGuard)
  createAdmin(@Body() b: { fullName: string; nick: string; email: string; password: string }) {
    return this.svc.createAdmin(b.fullName, b.nick, b.email, b.password);
  }

  // ── ADMIN endpoints ───────────────────────────────────────────
  @Get("users")
  @UseGuards(RolesGuard) @Roles("ADMIN")
  getAllUsers() { return this.usersService.findAll(); }

  @Patch("users/:id/role")
  @UseGuards(MasterOnlyGuard)
  assignRole(@Param("id") id: string, @Body("role") role: string) {
    return this.usersService.assignRole(id, role);
  }

  @Patch("users/:id/toggle")
  @UseGuards(RolesGuard) @Roles("ADMIN")
  toggleUser(@Param("id") id: string) { return this.usersService.toggleActive(id); }

  // ── MATCH lifecycle (admin) ───────────────────────────────────
  @Post("matches/:id/monitor")
  @UseGuards(RolesGuard) @Roles("ADMIN")
  startMonitor(@Param("id") id: string, @Body("externalId") externalId?: string) {
    this.matchLive.startMonitoring(id, externalId);
    return { message: "Monitoring started", matchId: id };
  }

  @Post("matches/:id/stop-monitor")
  @UseGuards(RolesGuard) @Roles("ADMIN")
  stopMonitor(@Param("id") id: string) {
    this.matchLive.stopMonitoring(id);
    return { message: "Monitoring stopped", matchId: id };
  }

  @Post("matches/:id/finish")
  @UseGuards(RolesGuard) @Roles("ADMIN")
  async finishMatch(
    @Param("id") id: string,
    @Body("homeScore") homeScore: number,
    @Body("awayScore") awayScore: number,
  ) {
    const match = await this.matchesService.setScore(id, homeScore, awayScore);
    await this.scheduler.finishMatch(match);
    return { message: "Match finished and bolão results calculated", match };
  }

  @Get("live-monitoring")
  @UseGuards(RolesGuard) @Roles("ADMIN")
  getLiveMonitoring() {
    return { active: this.matchLive.getActiveMonitoring() };
  }

  // ── MATCH FETCH trigger ───────────────────────────────────────
  @Post("agents/matches/trigger")
  @UseGuards(RolesGuard) @Roles("ADMIN")
  async triggerMatchFetch() {
    setImmediate(async () => {
      try { await this.matchFetch.triggerFetch(); } catch(e) { }
    });
    return { success: true, message: 'Match fetch agent disparado com sucesso' };
  }

  @Patch("users/:id")
  @UseGuards(MasterOnlyGuard)
  updateUser(
    @Param("id") id: string,
    @Body() b: { fullName?: string; nick?: string; email?: string; whatsapp?: string; city?: string; state?: string; password?: string; birthDate?: string; isActive?: boolean; role?: string }
  ) {
    return this.svc.updateUser(id, b);
  }

  @Delete("users/:id")
  @UseGuards(MasterOnlyGuard)
  deleteUser(@Param("id") id: string) {
    return this.svc.deleteUser(id);
  }

  @Get("merge-accounts/preview")
  @UseGuards(MasterOnlyGuard)
  previewMerge(
    @Query("sourceId") sourceId: string,
    @Query("targetId") targetId: string,
  ) {
    return this.svc.previewMerge(sourceId, targetId);
  }

  @Post("merge-accounts")
  @UseGuards(MasterOnlyGuard)
  mergeAccounts(
    @Request() req: any,
    @Body() b: { sourceUserId: string; targetUserId: string },
  ) {
    return this.svc.mergeAccounts(req.user.sub, b.sourceUserId, b.targetUserId);
  }

  @Post("users")
  @UseGuards(MasterOnlyGuard)
  createUser(@Body() b: {
    fullName: string; nick: string; email: string; password: string;
    whatsapp?: string; city?: string; state?: string; role?: string;
  }) {
    return this.svc.createUser(b);
  }

  // ── AGENTS ────────────────────────────────────────────────────
  @Get("agents")
  @UseGuards(RolesGuard) @Roles("ADMIN")
  async getAgents() {
    const logs = await this.audit.findAll({ module: 'AGENT', limit: 500 });
    const defs = [
      { id: 'news',       name: 'Agente de Notícias',        description: 'Busca notícias do Corinthians na web usando Claude AI' },
      { id: 'match_live', name: 'Agente de Partida ao Vivo', description: 'Monitora placares e estatísticas em tempo real' },
      { id: 'bolao',      name: 'Agente do Bolão',            description: 'Calcula resultados e ranking do bolão após cada partida' },
      { id: 'curiosity',  name: 'Agente de Curiosidades',    description: 'Gera curiosidades sobre o Corinthians com Claude AI' },
      { id: 'matches',    name: 'Agente de Jogos',            description: 'Busca próximos jogos do Corinthians via ESPN e meutimao' },
    ];
    return defs.map((d) => {
      const agentLogs = logs.filter((l) =>
        l.description?.toLowerCase().includes(d.id) ||
        l.action?.toLowerCase().includes(d.id) ||
        l.action?.includes(`TRIGGER_${d.id.toUpperCase()}`)
      );
      const runLogs = agentLogs.filter((l) => l.action === 'AGENT_RUN');
      const last = agentLogs[0];
      const hasError = last?.action === 'AGENT_ERROR';
      const hasRun = runLogs.length > 0;
      return {
        id: d.id,
        name: d.name,
        description: d.description,
        status: agentLogs.length === 0 ? 'INACTIVE' : hasError && !hasRun ? 'ERROR' : 'ACTIVE',
        lastRun: (runLogs[0] ?? last)?.createdAt ?? null,
        tokensConsumed: runLogs.length * 500,
        errorMessage: hasError ? last?.description ?? null : null,
      };
    });
  }

  @Post("agents/:id/trigger")
  @UseGuards(RolesGuard) @Roles("ADMIN")
  async triggerAgent(@Param("id") id: string) {
    await this.audit.log(null, `AGENT_TRIGGER_${id.toUpperCase()}`, 'AGENT', `Agente ${id} disparado manualmente`);
    if (id === 'news') {
      setImmediate(async () => {
        try {
          await this.newsAgent.fetchAndSummarize();
          await this.audit.log(null, 'AGENT_RUN', 'AGENT', `news: busca concluida com sucesso`);
        } catch(e) {
          await this.audit.log(null, 'AGENT_ERROR', 'AGENT', `news: ${String((e as any)?.message || e).slice(0,100)}`);
        }
        try { await (this.newsAgent as any).fetchCuriosidades?.(); } catch(e) { }
      });
    }
    if (id === 'matches') {
      setImmediate(async () => {
        try {
          await this.matchFetch.triggerFetch();
          await this.audit.log(null, 'AGENT_RUN', 'AGENT', `matches: busca de jogos concluida`);
        } catch(e) {
          await this.audit.log(null, 'AGENT_ERROR', 'AGENT', `matches: ${String((e as any)?.message || e).slice(0,100)}`);
        }
      });
    }
    if (id === 'match_live') {
      setImmediate(async () => {
        try {
          await (this.matchLive as any).resumeLiveMatches?.();
          await this.audit.log(null, 'AGENT_RUN', 'AGENT', `match_live: monitoramento reiniciado`);
        } catch(e) {
          await this.audit.log(null, 'AGENT_ERROR', 'AGENT', `match_live: ${String((e as any)?.message || e).slice(0,100)}`);
        }
      });
    }
    if (id === 'bolao') {
      setImmediate(async () => {
        try {
          await this.audit.log(null, 'AGENT_RUN', 'AGENT', `bolao: agente verificado`);
        } catch(e) { }
      });
    }
    if (id === 'curiosity') {
      setImmediate(async () => {
        try {
          await (this.newsAgent as any).fetchCuriosidades?.();
          await this.audit.log(null, 'AGENT_RUN', 'AGENT', `curiosity: curiosidades geradas`);
        } catch(e) {
          await this.audit.log(null, 'AGENT_ERROR', 'AGENT', `curiosity: ${String((e as any)?.message || e).slice(0,100)}`);
        }
      });
    }
    return { success: true, message: `Agente ${id} disparado com sucesso` };
  }


  // ===== EMAIL TEMPLATES =====
  @Get("email-templates")
  async getEmailTemplates() {
    const keys = ["welcome", "bolao-open", "match-result", "birthday"];
    const templates: { key: string; subject: string | null; html: string | null; hasCustom: boolean }[] = [];
    for (const key of keys) {
      const subject = await this.settings.get(`email_tpl_${key}_subject`) ?? null;
      const html = await this.settings.get(`email_tpl_${key}_html`) ?? null;
      templates.push({ key, subject, html, hasCustom: !!html });
    }
    return templates;
  }

  @Get("email-templates/:key")
  async getEmailTemplate(@Param("key") key: string) {
    const subject = await this.settings.get(`email_tpl_${key}_subject`) ?? null;
    const html = await this.settings.get(`email_tpl_${key}_html`) ?? null;
    return { key, subject, html };
  }

  @Put("email-templates/:key")
  async saveEmailTemplate(
    @Param("key") key: string,
    @Body() body: { subject?: string; html?: string },
    @Request() req: any
  ) {
    const userId = req.user?.sub ?? req.user?.id ?? "master";
    if (body.subject !== undefined) await this.settings.set(`email_tpl_${key}_subject`, body.subject, userId);
    if (body.html !== undefined) await this.settings.set(`email_tpl_${key}_html`, body.html, userId);
    return { ok: true, key };
  }

  @Delete("email-templates/:key")
  async resetEmailTemplate(@Param("key") key: string, @Request() req: any) {
    const userId = req.user?.sub ?? req.user?.id ?? "master";
    await this.settings.set(`email_tpl_${key}_subject`, "", userId);
    await this.settings.set(`email_tpl_${key}_html`, "", userId);
    return { ok: true, reset: true };
  }


  @Post("email-templates/:key/test")
  async testEmailTemplate(
    @Param("key") key: string,
    @Body() body: { to?: string },
    @Request() req: any
  ) {
    const to = body?.to ?? "thiago@rochanet.net.br";
    const subject = (await this.settings.get("email_tpl_" + key + "_subject")) ?? "[Teste] Template " + key;
    const html = (await this.settings.get("email_tpl_" + key + "_html")) ?? "<p>Template sem conteúdo definido.</p>";
    const smtpHost = await this.settings.get("smtp_host");
    const smtpPort = await this.settings.get("smtp_port");
    const smtpUser = await this.settings.get("smtp_user");
    const smtpPass = await this.settings.get("smtp_pass");
    if (!smtpHost || !smtpUser || !smtpPass) return { ok: false, error: "SMTP nao configurado" };
    const fromName = (await this.settings.get("smtp_from_name")) ?? "Fiel Rio Pardo";
    const fromAddr = (await this.settings.get("smtp_from_email")) ?? "noreply@fielriopardo.com.br";
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require("nodemailer");
    const transport = nodemailer.createTransport({ host: smtpHost, port: +(smtpPort ?? 587), secure: +(smtpPort ?? 587) === 465, auth: { user: smtpUser, pass: smtpPass } });
    await transport.sendMail({ from: `"${fromName}" <${fromAddr}>`, to, subject, html });
    return { ok: true, sentTo: to };
  }


  // ─── Match Predictions (admin view) ───────────────────────────────
  @Get("matches/:id/predictions")
  async getMatchPredictions(@Param("id") matchId: string) {
    const preds = await this.predictionsRepo.find({
      where: { matchId },
      relations: ['user'],
      order: { submittedAt: 'ASC' } as any,
    });
    return preds.map(p => ({
      id: p.id,
      userId: p.userId,
      nick: p.user?.nick ?? '—',
      fullName: p.user?.fullName ?? '—',
      email: p.user?.email ?? '—',
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      changeCount: p.changeCount,
      submittedAt: p.submittedAt,
      updatedAt: p.updatedAt,
    }));
  }

  // ─── Notify match participants ─────────────────────────────────────
  @Post("matches/:id/notify")
  async notifyMatchParticipants(
    @Param("id") matchId: string,
    @Body() body: { userIds?: string[]; subject: string; html: string },
  ) {
    // Load match data for placeholder replacement
    const match = await this.matchesService.findById(matchId).catch(() => null);

    // Build winners HTML
    let winnersHtml = '<p style="color:#888">Nenhum acertador neste jogo.</p>';
    let rankingHtml = '<p style="color:#888">Classificação não disponível.</p>';

    if (match) {
      const scores = await this.matchScoreRepo.find({
        where: { matchId },
        relations: ['user'],
        order: { points: 'DESC' },
      });
      const winners = scores.filter(s => s.points > 0);
      if (winners.length) {
        const rows = winners.map(s =>
          `<tr><td>${s.isSoleWinner ? '⭐' : '✅'}</td><td>${s.user?.nick ?? '—'}</td>` +
          `<td>${s.predictedHome}x${s.predictedAway}</td><td>${s.points} pt${s.points > 1 ? 's' : ''}</td></tr>`
        ).join('');
        winnersHtml = `<table style="width:100%;border-collapse:collapse;font-size:14px">` +
          `<tr><th></th><th>Participante</th><th>Palpite</th><th>Pontos</th></tr>${rows}</table>`;
      }

      const year = new Date().getFullYear().toString();
      const ranking = await this.rankingRepo.find({
        where: { season: year },
        relations: ['user'],
        order: { totalPoints: 'DESC' },
      });
      if (ranking.length) {
        const medals = ['🥇','🥈','🥉'];
        const rrows = ranking.slice(0, 10).map((r, i) =>
          `<tr><td>${medals[i] ?? (i+1)+'º'}</td><td>${r.user?.nick ?? '—'}</td><td>${r.totalPoints} pts</td></tr>`
        ).join('');
        rankingHtml = `<table style="width:100%;border-collapse:collapse;font-size:14px">` +
          `<tr><th>Pos</th><th>Participante</th><th>Pts</th></tr>${rrows}</table>`;
      }
    }

    // Build variable map for placeholder replacement
    const vars: Record<string, string> = {
      home:        match?.homeTeam  ?? '',
      away:        match?.awayTeam  ?? '',
      hscore:      String(match?.homeScore ?? 0),
      ascore:      String(match?.awayScore ?? 0),
      competition: match?.competition ?? '',
      winners:     winnersHtml,
      ranking:     rankingHtml,
    };

    const interpolate = (tpl: string) =>
      tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

    const finalSubject = interpolate(body.subject);
    const finalHtml    = interpolate(body.html);

    let preds = await this.predictionsRepo.find({
      where: { matchId },
      relations: ['user'],
    });
    if (body.userIds && body.userIds.length > 0) {
      preds = preds.filter(p => body.userIds!.includes(p.userId));
    }
    const sent: string[] = [];
    for (const p of preds) {
      if (p.user?.email) {
        // Per-user nick replacement
        const userHtml = finalHtml.replace(/\{\{nick\}\}/g, p.user.nick ?? '');
        const userSubject = finalSubject.replace(/\{\{nick\}\}/g, p.user.nick ?? '');
        await this.email.sendRaw(p.user.email, userSubject, userHtml).catch(() => null);
        sent.push(p.user.email);
      }
    }
    return { ok: true, sent: sent.length, emails: sent };
  }

  // ─── Retroactive push notification for match result ─────────────
  @Post('matches/:id/push-result')
  @UseGuards(RolesGuard) @Roles('ADMIN')
  async pushMatchResult(@Param('id') matchId: string) {
    const match = await this.matchesService.findById(matchId);
    if (!match || match.homeScore === null || match.awayScore === null) {
      return { success: false, message: 'Match not found or no score' };
    }
    await this.notifications.notifyMatchResult(
      matchId, match.homeTeam, match.awayTeam, match.homeScore, match.awayScore
    );
    return { success: true, message: 'Push notifications sent for ' + matchId };
  }

}
