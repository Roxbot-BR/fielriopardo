import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MoreThanOrEqual } from "typeorm";
import * as nodemailer from "nodemailer";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SettingsService } from "../settings/settings.service";
import { EmailLog } from "../database/entities/email-log.entity";
import { User } from "../database/entities/user.entity";
import { Match } from "../database/entities/match.entity";
import { MatchScore } from "../database/entities/match-score.entity";
import { SeasonRanking } from "../database/entities/season-ranking.entity";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private static readonly BLOCKED_DOMAINS = ['fielriopardo.com.br', 'bolao.fielriopardo.com.br'];
  private static readonly HOURLY_LIMIT = 50;

  constructor(
    private settings: SettingsService,
    @InjectRepository(EmailLog) private emailLogRepo: Repository<EmailLog>,
  ) {}

  private async createTransport() {
    const host = await this.settings.get("smtp_host");
    const port = await this.settings.get("smtp_port");
    const user = await this.settings.get("smtp_user");
    const pass = await this.settings.get("smtp_pass");
    if (!host || !user || !pass) { this.logger.warn("SMTP não configurado"); return null; }
    return nodemailer.createTransport({ host, port: +(port ?? 587), secure: +(port ?? 587) === 465, auth: { user, pass } });
  }

  private async getFrom() {
    const name = await this.settings.get("smtp_from_name") ?? "Fiel Rio Pardo";
    const addr = await this.settings.get("smtp_from_email") ?? "noreply@fielriopardo.com.br";
    return `"${name}" <${addr}>`;
  }

  private async send(to: string, subject: string, html: string, type = 'general', toName?: string) {
    // Skip internal domain emails
    const domain = to.split('@')[1]?.toLowerCase();
    if (domain && EmailService.BLOCKED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))) {
      this.logger.log('Email ignorado (dominio interno): ' + to);
      return;
    }

    // Check hourly rate limit
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const sentLastHour = await this.emailLogRepo.count({
      where: { status: 'sent', createdAt: MoreThanOrEqual(oneHourAgo) },
    });

    if (sentLastHour >= EmailService.HOURLY_LIMIT) {
      this.logger.warn('Rate limit atingido (' + sentLastHour + '/' + EmailService.HOURLY_LIMIT + '/h) - enfileirando: ' + to);
      await this.emailLogRepo.save(
        this.emailLogRepo.create({ toEmail: to, toName, subject, type, status: 'queued', body: html, errorMessage: 'RATE_LIMIT' })
      ).catch(() => null);
      return;
    }

    const transport = await this.createTransport();
    if (!transport) {
      await this.emailLogRepo.save(this.emailLogRepo.create({ toEmail: to, toName, subject, type, status: 'failed', errorMessage: 'SMTP nao configurado' })).catch(() => null);
      return;
    }
    const from = await this.getFrom();

    const log = await this.emailLogRepo.save(this.emailLogRepo.create({ toEmail: to, toName, subject, type, status: 'sent' })).catch(() => null);

    const trackId = log?.id ?? 'noop';
    const trackUrl = 'https://fielriopardo.com.br/api/email/track/' + trackId;
    const trackPixel = '<img src="' + trackUrl + '" width="1" height="1" style="display:none" alt="" />';
    const trackedHtml = log ? html.replace('</body>', trackPixel + '</body>') : html;

    try {
      await transport.sendMail({ from, to, subject, html: trackedHtml });
      this.logger.log('Email enviado para ' + to + ': ' + subject);
    } catch (err: any) {
      this.logger.error('Erro ao enviar email para ' + to, err);
      if (log) await this.emailLogRepo.update(log.id, { status: 'failed', errorMessage: String(err?.message ?? err) }).catch(() => null);
    }
  }

  @Cron('*/10 * * * *')
  async processEmailQueue() {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const sentLastHour = await this.emailLogRepo.count({
      where: { status: 'sent', createdAt: MoreThanOrEqual(oneHourAgo) },
    });
    const available = EmailService.HOURLY_LIMIT - sentLastHour;
    if (available <= 0) return;

    const queued = await this.emailLogRepo.find({
      where: { status: 'queued' },
      order: { createdAt: 'ASC' },
      take: available,
    });
    if (queued.length === 0) return;
    this.logger.log('Processando fila: ' + queued.length + ' emails (' + available + ' slots disponiveis)');

    const transport = await this.createTransport();
    if (!transport) return;
    const from = await this.getFrom();

    for (const qlog of queued) {
      // Skip blocked domains in queue too
      const qDomain = qlog.toEmail.split('@')[1]?.toLowerCase();
      if (qDomain && EmailService.BLOCKED_DOMAINS.some(d => qDomain === d || qDomain.endsWith('.' + d))) {
        await this.emailLogRepo.update(qlog.id, { status: 'failed', errorMessage: 'BLOCKED_DOMAIN' }).catch(() => null);
        this.logger.log('Email da fila ignorado (dominio interno): ' + qlog.toEmail);
        continue;
      }
      if (!qlog.body) {
        await this.emailLogRepo.update(qlog.id, { status: 'failed', errorMessage: 'QUEUED_NO_BODY' }).catch(() => null);
        continue;
      }
      const qTrackUrl = 'https://fielriopardo.com.br/api/email/track/' + qlog.id;
      const qPixel = '<img src="' + qTrackUrl + '" width="1" height="1" style="display:none" alt="" />';
      const qHtml = qlog.body.replace('</body>', qPixel + '</body>');
      try {
        await transport.sendMail({ from, to: qlog.toEmail, subject: qlog.subject, html: qHtml });
        await this.emailLogRepo.update(qlog.id, { status: 'sent', body: undefined, errorMessage: undefined }).catch(() => null);
        this.logger.log('Email da fila enviado para ' + qlog.toEmail);
      } catch (err: any) {
        await this.emailLogRepo.update(qlog.id, { errorMessage: String(err?.message ?? err) }).catch(() => null);
        this.logger.error('Erro ao reenviar da fila para ' + qlog.toEmail, err);
        break;
      }
    }
  }

    private baseTemplate(content: string): string {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{margin:0;padding:0;background:#000;font-family:Arial,sans-serif;color:#fff}
.wrap{max-width:600px;margin:0 auto;background:#1a1a1a;border:2px solid #C8A951;border-radius:12px;overflow:hidden}
.header{background:#000;padding:20px 16px 16px;text-align:center;border-bottom:2px solid #C8A951}
.logo-img{width:80px;height:80px;border-radius:50%;border:3px solid #C8A951;object-fit:cover;display:block;margin:0 auto 12px}
.brand{font-size:20px;font-weight:bold;color:#C8A951;letter-spacing:1px}
.body{padding:28px}
h2{color:#C8A951;border-bottom:1px solid #333;padding-bottom:8px}
.box{background:#2d2d2d;border:1px solid #3d3d3d;border-radius:8px;padding:16px;margin:12px 0}
.gold{color:#C8A951;font-weight:bold}
.btn{display:inline-block;background:#C8A951;color:#000;padding:12px 28px;border-radius:8px;font-weight:bold;text-decoration:none;margin:16px 0}
.footer{background:#000;padding:16px;text-align:center;color:#555;font-size:12px;border-top:1px solid #333}
table{width:100%;border-collapse:collapse} td,th{padding:8px 12px;border-bottom:1px solid #333;text-align:left}
th{background:#2d2d2d;color:#C8A951}
.medal{font-size:20px}
</style></head><body>
<div class="wrap">
  <div class="header">
    <img src="https://fielriopardo.com.br/logo.jpeg" alt="Fiel Rio Pardo" class="logo-img" width="80" height="80">
    <div class="brand">Fiel Rio Pardo</div>
    <div style="color:#888;font-size:12px">Torcida Organizada do Corinthians — São José do Rio Pardo/SP</div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">© 2026 Fiel Rio Pardo · <a href="https://fielriopardo.com.br" style="color:#C8A951">fielriopardo.com.br</a><br>Vai Corinthians! 🖤🤍</div>
</div></body></html>`;
  }


  private async getCustomTemplate(key: string): Promise<{ subject: string | null; html: string | null }> {
    const subject = await this.settings.get(`email_tpl_${key}_subject`) ?? null;
    const html = await this.settings.get(`email_tpl_${key}_html`) ?? null;
    return { subject, html };
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
  }

  async sendRaw(to: string, subject: string, html: string): Promise<void> {
    await this.send(to, subject, html, 'manual');
  }

  async sendRaw_({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
    await this.send(to, subject, html);
  }

  async sendWelcome(user: User): Promise<void> {
    const rules = await this.settings.get("bolao_rules_text") ?? "";
    const prize1 = await this.settings.get("prize_1st") ?? "R$ 150,00";
    const prize2 = await this.settings.get("prize_2nd") ?? "Camisa do Timão";
    const prize3 = await this.settings.get("prize_3rd") ?? "Kit Presente do Timão";
    const content = `
      <h2>🎉 Bem-vindo ao Bolão, ${user.nick}!</h2>
      <p>Olá <strong>${user.fullName}</strong>, seu cadastro foi realizado com sucesso!</p>
      <div class="box">
        <div class="gold">Seus dados de acesso:</div>
        <p>📧 E-mail: <strong>${user.email}</strong></p>
        <p>🎯 Nick: <strong>${user.nick}</strong></p>
        <p>📱 WhatsApp: ${user.whatsapp ?? "Não informado"}</p>
        <p>📍 Cidade: ${user.city ?? "Não informado"}/${user.state ?? ""}</p>
      </div>
      <h2>🏆 Regras do Bolão — Temporada 2026</h2>
      <div class="box">
        <p>✅ Palpites aceitos até <strong>1 minuto antes</strong> do início da partida</p>
        <p>✅ Você pode alterar seu palpite enquanto o bolão estiver aberto</p>
        <p>✅ Acertou sozinho: <strong class="gold">2 pontos</strong></p>
        <p>✅ Acertou junto com outros: <strong class="gold">1 ponto</strong></p>
        <p>✅ Errou: 0 pontos</p>
      </div>
      <h2>🥇 Prêmios</h2>
      <div class="box">
        <p>🥇 1º Lugar: <strong class="gold">${prize1}</strong></p>
        <p>🥈 2º Lugar: <strong>${prize2}</strong></p>
        <p>🥉 3º Lugar: <strong>${prize3}</strong></p>
        <p style="color:#888;font-size:12px">Prêmios entregues após a última rodada do Brasileirão</p>
      </div>
      <h2>📱 Instale o APP Fiel Rio Pardo</h2>
      <div class="box">
        <p style="margin-bottom:10px">Tenha o bolão sempre na palma da mão e receba notificações em tempo real!</p>
        <div style="margin-bottom:14px">
          <div class="gold" style="margin-bottom:6px">🤖 Android (Chrome)</div>
          <p>1. Acesse <strong>fielriopardo.com.br</strong> no Chrome</p>
          <p>2. Toque no menu <strong>⋮</strong> (3 pontos) no canto superior direito</p>
          <p>3. Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong></p>
          <p>4. Confirme a instalação — pronto! 🎉</p>
        </div>
        <div>
          <div class="gold" style="margin-bottom:6px">🍎 iPhone / iPad (Safari)</div>
          <p>1. Acesse <strong>fielriopardo.com.br</strong> no Safari</p>
          <p>2. Toque no botão <strong>compartilhar</strong> (quadrado com seta para cima)</p>
          <p>3. Role e selecione <strong>"Adicionar à Tela de Início"</strong></p>
          <p>4. Confirme — o ícone aparecerá na sua home! 🎉</p>
        </div>
      </div>
      <h2>🔔 Ative as Notificações</h2>
      <div class="box">
        <p>Após instalar o app, abra-o e toque em <strong>"Ativar Notificações"</strong> no banner que aparece na tela inicial.</p>
        <p style="margin-top:8px">Você receberá alertas quando:</p>
        <p>⚽ O bolão abrir para palpites</p>
        <p>⏰ Lembretes antes do jogo (2h, 1h, 30min e 5min)</p>
        <p>🏆 Placar final e atualização do ranking</p>
      </div>
      <div style="text-align:center"><a href="https://fielriopardo.com.br/bolao" class="btn">⚽ Acessar o Bolão</a></div>`;
    const tpl = await this.getCustomTemplate('welcome');
    const vars: Record<string, string> = { nick: user.nick, fullName: user.fullName, email: user.email, whatsapp: user.whatsapp ?? '', city: user.city ?? '', state: user.state ?? '' };
    const subject = tpl.subject ? this.interpolate(tpl.subject, vars) : "🦅 Bem-vindo ao Bolão Fiel Rio Pardo!";
    const html = tpl.html ? this.baseTemplate(this.interpolate(tpl.html, vars)) : this.baseTemplate(content);
    await this.send(user.email, subject, html, 'welcome', user.fullName);
  }

  async sendBolaoOpen(match: Match, users: User[]): Promise<void> {
    const d = new Date(match.matchDate);
    const dateStr = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const content = `
      <h2>⚽ Bolão Aberto — Dê seu Palpite!</h2>
      <div class="box" style="border-color:#C8A951">
        <div style="text-align:center;font-size:20px;font-weight:bold;margin-bottom:12px">
          ${match.homeTeam} <span class="gold">X</span> ${match.awayTeam}
        </div>
        <p>📆 ${dateStr}</p>
        <p>🕒 ${timeStr} hrs</p>
        ${match.stadium ? `<p>🏟️ ${match.stadium}</p>` : ""}
        ${match.tvChannel ? `<p>📺 ${match.tvChannel}</p>` : ""}
        ${match.competition ? `<p>🏆 ${match.competition}</p>` : ""}
      </div>
      <p style="color:#888">⚠️ O bolão encerra <strong style="color:#fff">1 minuto antes</strong> do início da partida.</p>
      <div style="text-align:center"><a href="https://fielriopardo.com.br/bolao/jogo/${match.id}" class="btn">🎯 Dar Meu Palpite</a></div>`;
    // Fetch template once outside the loop
    const tpl = await this.getCustomTemplate('bolao-open');
    for (const user of users) {
      const vars: Record<string, string> = {
        nick: user.nick, fullName: user.fullName ?? user.nick,
        // Long form (backward compat)
        homeTeam: match.homeTeam, awayTeam: match.awayTeam,
        matchDate: d.toLocaleDateString('pt-BR'), matchTime: timeStr,
        stadium: match.stadium ?? '', tvChannel: match.tvChannel ?? '',
        competition: match.competition ?? '',
        // Short aliases matching stored template variables
        home: match.homeTeam, away: match.awayTeam,
        date: d.toLocaleDateString('pt-BR'), time: timeStr,
        matchId: match.id,
      };
      const subject = tpl.subject ? this.interpolate(tpl.subject, vars) : `⚽ Bolão aberto: ${match.homeTeam} x ${match.awayTeam}`;
      const html = tpl.html ? this.baseTemplate(this.interpolate(tpl.html, vars)) : this.baseTemplate(content);
      await this.send(user.email, subject, html, 'bolao_open', user.fullName);
    }
  }

  async sendMatchResult(match: Match, scores: MatchScore[], ranking: SeasonRanking[]): Promise<void> {
    const winners   = scores.filter((s) => s.points > 0).sort((a, b) => b.points - a.points);
    const allScores = scores;

    // Build shared HTML blocks (also used as {{winners}} and {{ranking}} in custom templates)
    const c = 'padding:10px 14px;border-bottom:1px solid #222;font-size:14px;';
    const scoreRows = winners.map((s, i) =>
      `<tr style="background:${i % 2 === 0 ? '#0d0d0d' : '#151515'}">` +
      `<td style="${c}text-align:center;width:32px">${s.isSoleWinner ? "⭐" : "✅"}</td>` +
      `<td style="${c}color:#ffffff;font-weight:bold">${s.user?.nick ?? "—"}</td>` +
      `<td style="${c}text-align:center;color:#aaaaaa;font-family:Courier,monospace">${s.predictedHome}x${s.predictedAway}</td>` +
      `<td style="${c}text-align:right;color:#C8A951;font-weight:bold">${s.points}&nbsp;pt${s.points > 1 ? "s" : ""}</td>` +
      `</tr>`
    ).join("");
    const rankRows = ranking.slice(0, 10).map((r, i) =>
      `<tr style="background:${i % 2 === 0 ? '#0d0d0d' : '#151515'}">` +
      `<td style="${c}text-align:center;width:36px;font-size:18px">${["&#x1F947;","&#x1F948;","&#x1F949;"][i] ?? `<span style='color:#888'>${i+1}&ordm;</span>`}</td>` +
      `<td style="${c}color:${i < 3 ? '#ffffff' : '#aaaaaa'};font-weight:${i < 3 ? 'bold' : 'normal'}">${r.user?.nick ?? "—"}</td>` +
      `<td style="${c}text-align:right;color:#C8A951;font-weight:bold">${r.totalPoints}&nbsp;pts</td>` +
      `</tr>`
    ).join("");

    const th = 'padding:10px 14px;color:#C8A951;font-size:12px;background:#1a1a1a;border-bottom:2px solid #C8A951;';
    const winnersHtml = winners.length
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:10px;overflow:hidden">
           <tr>
             <th style="${th}text-align:center;width:32px"></th>
             <th style="${th}text-align:left">Participante</th>
             <th style="${th}text-align:center">Palpite</th>
             <th style="${th}text-align:right">Pts</th>
           </tr>
           ${scoreRows}
         </table>`
      : `<p style="background:#0d0d0d;border:1px solid #2a2a2a;border-radius:10px;padding:16px;color:#666;font-size:14px;text-align:center;margin:0">
           Ningu&eacute;m acertou o placar exato desta vez. Tente na pr&oacute;xima! &#x1F4AA;
         </p>`;

    const rankingHtml = ranking.length
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:10px;overflow:hidden">
           <tr>
             <th style="${th}text-align:center;width:36px">Pos</th>
             <th style="${th}text-align:left">Participante</th>
             <th style="${th}text-align:right">Total</th>
           </tr>
           ${rankRows}
         </table>`
      : `<p style="color:#666;font-size:14px;text-align:center;margin:0">Classifica&ccedil;&atilde;o n&atilde;o dispon&iacute;vel.</p>`;

    const defaultContent = `
      <!-- PLACAR HERO -->
      <div style="background:linear-gradient(135deg,#0d0d0d 0%,#1f1f1f 100%);border:2px solid #C8A951;border-radius:12px;padding:28px 16px;text-align:center;margin-bottom:24px">
        <div style="color:#C8A951;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px">🏁 Apito Final</div>
        <div style="color:#888;font-size:12px;margin-bottom:20px">${match.competition ?? ''}</div>
        <div style="display:flex;justify-content:center;align-items:center;gap:0">
          <div style="flex:1;text-align:right;padding-right:16px">
            <div style="font-size:16px;font-weight:bold;color:#fff;line-height:1.3">${match.homeTeam}</div>
          </div>
          <div style="background:#C8A951;border-radius:10px;padding:12px 20px;min-width:110px;text-align:center">
            <div style="font-size:32px;font-weight:900;color:#000;letter-spacing:4px;line-height:1">${match.homeScore ?? 0} x ${match.awayScore ?? 0}</div>
          </div>
          <div style="flex:1;text-align:left;padding-left:16px">
            <div style="font-size:16px;font-weight:bold;color:#fff;line-height:1.3">${match.awayTeam}</div>
          </div>
        </div>
      </div>

      <!-- ACERTADORES -->
      <div style="margin-bottom:24px">
        <h2 style="color:#C8A951;font-size:15px;letter-spacing:1px;text-transform:uppercase;border:none;margin-bottom:12px;padding:0;display:flex;align-items:center;gap:8px">
          <span style="background:#C8A951;color:#000;border-radius:50%;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;font-size:14px">🎯</span>
          Acertadores do Placar
        </h2>
        ${winnersHtml}
      </div>

      <!-- RANKING -->
      <div style="margin-bottom:24px">
        <h2 style="color:#C8A951;font-size:15px;letter-spacing:1px;text-transform:uppercase;border:none;margin-bottom:12px;padding:0;display:flex;align-items:center;gap:8px">
          <span style="background:#C8A951;color:#000;border-radius:50%;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;font-size:14px">🏆</span>
          Top 10 — Classificação
        </h2>
        ${rankingHtml}
      </div>

      <div style="text-align:center;margin-top:8px">
        <a href="https://fielriopardo.com.br/bolao/ranking" class="btn" style="font-size:15px;padding:14px 36px;letter-spacing:1px">
          📊 Ver Classificação Completa
        </a>
      </div>`;

    // Fetch template once (not per user)
    const resultTpl = await this.getCustomTemplate('match-result');

    // Fix: use string id as map key (UUID — Number() would return NaN)
    // Email only goes to acertadores (points > 0); push is handled separately for all
    const uniqueWinners = new Map<string, User>();
    winners.forEach((s) => { if (s.user) uniqueWinners.set(s.user.id, s.user); });

    for (const user of Array.from(uniqueWinners.values())) {
      const myScore  = winners.find((s) => s.userId === user.id);
      const didWin   = true; // only winners receive this email
      const defaultSubject = `🎉 Você acertou! ${match.homeTeam} ${match.homeScore}x${match.awayScore} ${match.awayTeam}`;

      const resultVars: Record<string, string> = {
        nick:        user.nick,
        fullName:    user.fullName ?? user.nick,
        // Full names
        homeTeam:    match.homeTeam,
        awayTeam:    match.awayTeam,
        homeScore:   String(match.homeScore ?? 0),
        awayScore:   String(match.awayScore ?? 0),
        competition: match.competition ?? '',
        // Short aliases (for templates that use {{home}}, {{hscore}}, etc.)
        home:        match.homeTeam,
        away:        match.awayTeam,
        hscore:      String(match.homeScore ?? 0),
        ascore:      String(match.awayScore ?? 0),
        // Block placeholders for custom templates
        winners:     winnersHtml,
        ranking:     rankingHtml,
        myPrediction: myScore ? `${myScore.predictedHome}x${myScore.predictedAway}` : '—',
        myPoints:    String(myScore?.points ?? 0),
        didWin:      didWin ? '✅ Sim!' : '❌ Não desta vez',
      };

      const finalSubject = resultTpl.subject ? this.interpolate(resultTpl.subject, resultVars) : defaultSubject;
      const finalHtml    = resultTpl.html    ? this.baseTemplate(this.interpolate(resultTpl.html, resultVars)) : this.baseTemplate(defaultContent);
      await this.send(user.email, finalSubject, finalHtml, 'match_result', user.fullName);
    }
  }

  async sendBirthday(user: User): Promise<void> {
    const tpl = await this.getCustomTemplate('birthday');
    const vars: Record<string, string> = { nick: user.nick, fullName: user.fullName, email: user.email };
    const subject = tpl.subject ? this.interpolate(tpl.subject, vars)
      : `🎂 Feliz Aniversário, ${user.nick}! 🖤🤍`;
    const defaultHtml = `
      <h2 style="text-align:center;font-size:28px;border:none">🎂🖤🤍🎂</h2>
      <h2 style="text-align:center">Feliz Aniversário, ${user.nick}!</h2>
      <p style="text-align:center;font-size:16px">A <strong class="gold">Fiel Rio Pardo</strong> deseja a você um dia repleto de alegria, saúde e muito Corinthians!</p>
      <div class="box" style="text-align:center;border-color:#C8A951;padding:24px">
        <div style="font-size:48px">🦅</div>
        <p style="font-size:18px;margin:8px 0"><strong>Que hoje seja tão especial</strong></p>
        <p style="color:#888">quanto a sensação de ver o Timão campeão!</p>
      </div>
      <div style="text-align:center;padding:16px 0">
        <p style="color:#C8A951;font-size:20px;font-weight:bold">🖤 Vai Corinthians! 🤍</p>
        <p style="color:#888;font-size:13px">Com carinho, toda a torcida Fiel Rio Pardo</p>
      </div>
      <h2>📱 Instale o APP Fiel Rio Pardo</h2>
      <div class="box">
        <p style="margin-bottom:10px">Tenha o bolão sempre na palma da mão e receba notificações em tempo real!</p>
        <div style="margin-bottom:14px">
          <div class="gold" style="margin-bottom:6px">🤖 Android (Chrome)</div>
          <p>1. Acesse <strong>fielriopardo.com.br</strong> no Chrome</p>
          <p>2. Toque no menu <strong>⋮</strong> (3 pontos) no canto superior direito</p>
          <p>3. Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong></p>
          <p>4. Confirme a instalação — pronto! 🎉</p>
        </div>
        <div>
          <div class="gold" style="margin-bottom:6px">🍎 iPhone / iPad (Safari)</div>
          <p>1. Acesse <strong>fielriopardo.com.br</strong> no Safari</p>
          <p>2. Toque no botão <strong>compartilhar</strong> (quadrado com seta para cima)</p>
          <p>3. Role e selecione <strong>"Adicionar à Tela de Início"</strong></p>
          <p>4. Confirme — o ícone aparecerá na sua home! 🎉</p>
        </div>
      </div>
      <h2>🔔 Ative as Notificações</h2>
      <div class="box">
        <p>Após instalar o app, abra-o e toque em <strong>"Ativar Notificações"</strong> no banner que aparece na tela inicial.</p>
        <p style="margin-top:8px">Você receberá alertas quando:</p>
        <p>⚽ O bolão abrir para palpites</p>
        <p>⏰ Lembretes antes do jogo (2h, 1h, 30min e 5min)</p>
        <p>🏆 Placar final e atualização do ranking</p>
      </div>
      <div style="text-align:center"><a href="https://fielriopardo.com.br/bolao" class="btn">⚽ Acessar o Bolão</a></div>`;
    const html = tpl.html ? this.baseTemplate(this.interpolate(tpl.html, vars)) : this.baseTemplate(defaultHtml);
    await this.send(user.email, subject, html, 'birthday', user.fullName);
  }

  async sendPasswordReset(user: User, token: string): Promise<void> {
    const link = `https://fielriopardo.com.br/bolao/redefinir-senha?token=${token}`;
    const emailContent = `
      <h2 style="color:#C8A951;text-align:center;margin:0 0 16px">Redefinição de Senha</h2>
      <p style="color:#ccc;line-height:1.6">Olá, <strong style="color:#fff">${user.nick}</strong>!</p>
      <p style="color:#ccc;line-height:1.6">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p style="color:#ccc;line-height:1.6">Clique no botão abaixo para criar uma nova senha. O link expira em <strong style="color:#fff">2 horas</strong>.</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${link}" style="display:inline-block;background:#C8A951;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:16px">Redefinir Minha Senha</a>
      </div>
      <p style="color:#666;font-size:12px;text-align:center">Se você não solicitou a redefinição, ignore este e-mail.</p>
    `;
    const html = this.baseTemplate(emailContent);
    await this.send(user.email, "🔐 Redefinição de Senha — Fiel Rio Pardo", html, 'password_reset', user.fullName);
  }
  async markOpened(logId: string): Promise<void> {
    await this.emailLogRepo.update(logId, { opened: true, openedAt: new Date() }).catch(() => null);
  }

  async getEmailStats() {
    const total = await this.emailLogRepo.count();
    const failed = await this.emailLogRepo.count({ where: { status: 'failed' } });
    const opened = await this.emailLogRepo.count({ where: { opened: true } });
    const sent = total - failed;

    const todayRow = await this.emailLogRepo
      .createQueryBuilder('e')
      .select('COUNT(*)', 'count')
      .where('e.created_at >= CURRENT_DATE')
      .getRawOne();
    const todayCount = parseInt(todayRow?.count ?? '0', 10);

    const byType = await this.emailLogRepo
      .createQueryBuilder('e')
      .select('e.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect("SUM(CASE WHEN e.status = 'failed' THEN 1 ELSE 0 END)", 'failed')
      .addSelect("SUM(CASE WHEN e.opened = true THEN 1 ELSE 0 END)", 'opened')
      .groupBy('e.type')
      .orderBy('count', 'DESC')
      .getRawMany();

    const recent = await this.emailLogRepo.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return { total, todayCount, sent, failed, opened, byType, recent };
  }
}
