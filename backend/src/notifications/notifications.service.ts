import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import * as webpush from 'web-push';
import { PushSubscription } from '../database/entities/push-subscription.entity';
import { PushNotificationLog, NotificationType } from '../database/entities/push-notification-log.entity';
import { NotificationHistory } from '../database/entities/notification-history.entity';
import { SettingsService } from '../settings/settings.service';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

// (matchDate - now) windows with ±5 min tolerance each side
const REMINDER_WINDOWS: Array<{ type: NotificationType; minutesBefore: number; label: string }> = [
  { type: 'reminder_2h',  minutesBefore: 120, label: '2 horas' },
  { type: 'reminder_1h',  minutesBefore:  60, label: '1 hora'  },
  { type: 'reminder_30m', minutesBefore:  30, label: '30 minutos' },
  { type: 'reminder_5m',  minutesBefore:   5, label: '5 minutos'  },
];
const WINDOW_TOLERANCE_MIN = 5; // ±5 min

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(PushSubscription)
    private subRepo: Repository<PushSubscription>,
    @InjectRepository(PushNotificationLog)
    private logRepo: Repository<PushNotificationLog>,
    private settings: SettingsService,
    private dataSource: DataSource,
    @InjectRepository(NotificationHistory)
    private historyRepo: Repository<NotificationHistory>,
  ) {}

  async onModuleInit() {
    await this.initVapidKeys();
  }

  // ── VAPID setup ─────────────────────────────────────────────────────────────

  private async initVapidKeys() {
    let publicKey  = await this.settings.get('vapid_public_key');
    let privateKey = await this.settings.get('vapid_private_key');

    if (!publicKey || !privateKey) {
      const keys = webpush.generateVAPIDKeys();
      publicKey  = keys.publicKey;
      privateKey = keys.privateKey;
      // Use raw SQL to avoid FK constraint on updated_by (system key, no user)
      for (const [key, value] of [['vapid_public_key', publicKey], ['vapid_private_key', privateKey]]) {
        await this.dataSource.query(
          `INSERT INTO system_settings (key, value, category)
           VALUES ($1, $2, 'system')
           ON CONFLICT (key) DO UPDATE SET value = $2`,
          [key, value],
        );
      }
      this.logger.log('VAPID keys geradas e salvas');
    }

    webpush.setVapidDetails('mailto:contato@fielriopardo.com.br', publicKey, privateKey);
    this.logger.log('Web Push configurado');
  }

  async getVapidPublicKey(): Promise<string> {
    return (await this.settings.get('vapid_public_key')) ?? '';
  }

  // ── Subscription management ──────────────────────────────────────────────────

  async saveSubscription(
    userId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    const existing = await this.subRepo.findOne({ where: { endpoint: sub.endpoint } });
    if (existing) {
      existing.userId    = userId;
      existing.p256dhKey = sub.keys.p256dh;
      existing.authKey   = sub.keys.auth;
      return this.subRepo.save(existing);
    }
    const saved = await this.subRepo.save(
      this.subRepo.create({
        userId,
        endpoint:  sub.endpoint,
        p256dhKey: sub.keys.p256dh,
        authKey:   sub.keys.auth,
      }),
    );
    const welcomeKey = `welcome:${userId}`;
    const alreadyWelcomed = await this.alreadySent(welcomeKey, userId, 'welcome');
    if (!alreadyWelcomed) {
      setTimeout(async () => {
        try {
          const rows = await this.dataSource.query<Array<{ nick: string }>>('SELECT nick FROM users WHERE id = $1', [userId]);
          const nick = rows[0]?.nick ?? 'Fiel';
          await this.markSent(welcomeKey, userId, 'welcome');
          await this.sendToUser(userId, {
            title: '🖤🤍 Bem-vindo à Fiel Rio Pardo!',
            body:  `Olá, ${nick}! Obrigado por ativar as notificações. Agora você fica por dentro de tudo!`,
            url:   '/',
            tag:   'welcome',
          });
        } catch (err) {
          this.logger.error('Erro ao enviar notificação de boas-vindas', err);
        }
      }, 60_000);
    }
    return saved;
  }

  async removeSubscription(endpoint: string) {
    await this.subRepo.delete({ endpoint });
  }

  // ── Core send helpers ────────────────────────────────────────────────────────

  private async sendToSubs(subs: PushSubscription[], payload: PushPayload) {
    const fullPayload = JSON.stringify({
      ...payload,
      icon:  payload.icon  ?? 'https://fielriopardo.com.br/icon-192x192.png',
      badge: payload.badge ?? 'https://fielriopardo.com.br/badge-96x96.png',
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dhKey, auth: sub.authKey } },
            fullPayload,
          )
          .catch(async (err: { statusCode?: number }) => {
            if (err?.statusCode === 410) await this.subRepo.delete({ endpoint: sub.endpoint });
            throw err;
          }),
      ),
    );

    const sent   = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (subs.length > 0) this.logger.log(`Push enviado: ${sent} ok, ${failed} falhas`);
  }

  /** Send to a single user's subscriptions */
  async sendToUser(userId: string, payload: PushPayload) {
    const subs = await this.subRepo.find({ where: { userId } });
    await this.sendToSubs(subs, payload);
  }

  /** Send personalized messages to a list of users (different body per user) */
  private async sendPersonalized(
    targets: Array<{ userId: string; payload: PushPayload }>,
  ) {
    for (const { userId, payload } of targets) {
      await this.sendToUser(userId, payload);
    }
  }

  // ── Notification log helpers ─────────────────────────────────────────────────

  /** Returns true if this notification was already sent (prevents duplicates) */
  private async alreadySent(matchId: string, userId: string, type: NotificationType): Promise<boolean> {
    const count = await this.logRepo.count({ where: { matchId, userId, type } });
    return count > 0;
  }

  private async markSent(matchId: string, userId: string, type: NotificationType) {
    await this.logRepo
      .createQueryBuilder()
      .insert()
      .values({ matchId, userId, type })
      .orIgnore()
      .execute();
  }

  // ── Notification triggers ────────────────────────────────────────────────────

  /**
   * Bolão aberto — notify ALL subscribers with an open account
   * (respects user.notify_bolao_open preference)
   */
  async notifyBolaoOpen(matchId: string, homeTeam: string, awayTeam: string, matchDate: Date) {
    const dateStr = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
    }).format(matchDate);

    // Get all subscribers who want this notification
    const rows = await this.dataSource.query<Array<{ user_id: string; nick: string }>>(
      `SELECT s.user_id, u.nick
       FROM push_subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE u.notify_bolao_open = true AND u.is_active = true`,
    );

    const targets = await Promise.all(
      rows.map(async ({ user_id, nick }) => {
        if (await this.alreadySent(matchId, user_id, 'bolao_open')) return null;
        await this.markSent(matchId, user_id, 'bolao_open');
        await this.saveHistory(user_id, '⚽ Bolão Aberto!', `Olá, ${nick}! ${homeTeam} x ${awayTeam} — ${dateStr}. Dê seu palpite agora!`, '/bolao', 'bolao_open');
        return {
          userId: user_id,
          payload: {
            title: '⚽ Bolão Aberto!',
            body:  `Olá, ${nick}! ${homeTeam} x ${awayTeam} — ${dateStr}. Dê seu palpite agora!`,
            url:   '/bolao',
            tag:   `bolao-open-${matchId}`,
          } as PushPayload,
        };
      }),
    );

    await this.sendPersonalized(targets.filter(Boolean) as Array<{ userId: string; payload: PushPayload }>);
    this.logger.log(`Bolão aberto notificado para ${rows.length} assinantes (${homeTeam} x ${awayTeam})`);
  }

  /**
   * Bolão encerrado — notify only subscribers who wanted close alerts and did not submit a prediction
   */
  async notifyBolaoClose(matchId: string, homeTeam: string, awayTeam: string, matchDate: Date) {
    const dateStr = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
    }).format(matchDate);

    const missing = await this.dataSource.query<Array<{ user_id: string; nick: string }>>(
      `SELECT s.user_id, u.nick
       FROM push_subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE u.notify_bolao_close = true
         AND u.is_active = true
         AND NOT EXISTS (
           SELECT 1 FROM predictions p
           WHERE p.user_id = s.user_id AND p.match_id = $1
         )`,
      [matchId],
    );

    const targets = await Promise.all(
      missing.map(async ({ user_id, nick }) => {
        if (await this.alreadySent(matchId, user_id, 'bolao_close')) return null;
        await this.markSent(matchId, user_id, 'bolao_close');
        await this.saveHistory(
          user_id,
          '🔒 Bolão Encerrado!',
          `${nick}, o prazo para ${homeTeam} x ${awayTeam} (${dateStr}) acabou.`,
          '/bolao',
          'bolao_close',
        );
        return {
          userId: user_id,
          payload: {
            title: '🔒 Bolão Encerrado!',
            body: `${nick}, o prazo para ${homeTeam} x ${awayTeam} acabou. Agora é torcer pelo Timão!`,
            url: '/bolao',
            tag: `bolao-close-${matchId}`,
          } as PushPayload,
        };
      }),
    );

    const validTargets = targets.filter(Boolean) as Array<{ userId: string; payload: PushPayload }>;
    if (validTargets.length > 0) {
      await this.sendPersonalized(validTargets);
    }
    this.logger.log(`Bolão encerrado notificado para ${validTargets.length} assinantes (${homeTeam} x ${awayTeam})`);
  }

  /**
   * Resultado pós-jogo — personalized per participant with their points + ranking
   * (respects user.notify_ranking preference)
   */
  async notifyMatchResult(
    matchId: string,
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number,
  ) {
    const year = new Date().getFullYear().toString();

    const participants = await this.dataSource.query<
      Array<{ user_id: string; nick: string; points: number; total_points: number; position: number }>
    >(
      `SELECT
         p.user_id,
         u.nick,
         COALESCE(ms.points, 0)              AS points,
         COALESCE(sr.total_points, 0)        AS total_points,
         RANK() OVER (ORDER BY COALESCE(sr.total_points, 0) DESC)::int AS position
       FROM predictions p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN match_scores ms ON ms.user_id = p.user_id AND ms.match_id = $1
       LEFT JOIN season_ranking sr ON sr.user_id = p.user_id AND sr.season = $2
       WHERE p.match_id = $1 AND u.notify_ranking = true AND u.is_active = true`,
      [matchId, year],
    );

    const targets = await Promise.all(
      participants.map(async ({ user_id, nick, points, total_points, position }) => {
        if (await this.alreadySent(matchId, user_id, 'match_result')) return null;
        await this.markSent(matchId, user_id, 'match_result');

        const pointsMsg =
          points === 2 ? '🏆 Acertou em cheio! +2 pts' :
          points === 1 ? '🎯 Acertou o resultado! +1 pt' :
                         '😔 Não pontuou desta vez';

        const t = `Resultado: ${homeTeam} ${homeScore}×${awayScore} ${awayTeam}`;
        const b = `${nick}, ${pointsMsg} · ${total_points} pts no ranking (${position}º)`;
        await this.saveHistory(user_id, t, b, `/bolao/acertadores/${matchId}`, 'match_result');
        return {
          userId: user_id,
          payload: {
            title: `Resultado: ${homeTeam} ${homeScore}×${awayScore} ${awayTeam}`,
            body:  `${nick}, ${pointsMsg} · ${total_points} pts no ranking (${position}º)`,
            url:   `/bolao/acertadores/${matchId}`,
            tag:   `result-${matchId}`,
          } as PushPayload,
        };
      }),
    );

    await this.sendPersonalized(targets.filter(Boolean) as Array<{ userId: string; payload: PushPayload }>);
    this.logger.log(`Resultado notificado para ${participants.length} participantes`);
  }

  /**
   * Cron every minute — checks 4 reminder windows (2h, 1h, 30min, 5min before match)
   * Only notifies users who haven't placed a prediction yet
   * (respects user.notify_bolao_close preference)
   */
  @Cron('* * * * *')
  async checkReminderWindows() {
    const now = new Date();

    for (const window of REMINDER_WINDOWS) {
      const windowCenter = new Date(now.getTime() + window.minutesBefore * 60_000);
      const rangeStart   = new Date(windowCenter.getTime() - WINDOW_TOLERANCE_MIN * 60_000);
      const rangeEnd     = new Date(windowCenter.getTime() + WINDOW_TOLERANCE_MIN * 60_000);

      const matches = await this.dataSource.query<
        Array<{ id: string; home_team: string; away_team: string; match_date: string }>
      >(
        `SELECT id, home_team, away_team, match_date
         FROM matches
         WHERE bolao_open = true
           AND status = 'scheduled'
           AND match_date > $1
           AND match_date <= $2`,
        [rangeStart, rangeEnd],
      );

      for (const match of matches) {
        const matchDate  = new Date(match.match_date);
        const diffMs     = matchDate.getTime() - now.getTime();
        const diffMin    = Math.round(diffMs / 60_000);
        const timeLabel  = this.formatTimeLeft(diffMin);

        // Users with subscriptions, no prediction, want close notifications
        const missing = await this.dataSource.query<Array<{ user_id: string; nick: string }>>(
          `SELECT s.user_id, u.nick
           FROM push_subscriptions s
           JOIN users u ON u.id = s.user_id
           WHERE u.notify_bolao_close = true
             AND u.is_active = true
             AND NOT EXISTS (
               SELECT 1 FROM predictions p
               WHERE p.user_id = s.user_id AND p.match_id = $1
             )`,
          [match.id],
        );

        const targets = await Promise.all(
          missing.map(async ({ user_id, nick }) => {
            if (await this.alreadySent(match.id, user_id, window.type)) return null;
            await this.markSent(match.id, user_id, window.type);

            return {
              userId: user_id,
              payload: {
                title: `⏰ ${match.home_team} x ${match.away_team} em ${window.label}!`,
                body:  `${nick}, o bolão fecha em ${timeLabel}. Ainda dá tempo de palpitar!`,
                url:   '/bolao',
                tag:   `reminder-${match.id}-${window.type}`,
              } as PushPayload,
            };
          }),
        );

        const validTargets = targets.filter(Boolean) as Array<{ userId: string; payload: PushPayload }>;
        if (validTargets.length > 0) {
          await this.sendPersonalized(validTargets);
          this.logger.log(
            `[${window.label}] Lembrete ${match.home_team} x ${match.away_team}: ${validTargets.length} usuários notificados`,
          );
        }
      }
    }
  }

  /**
   * Cron 7am on match day — "Tem jogo hoje!"
   * Sent to all active subscribers
   */
  @Cron('0 7 * * *')
  async notifyGameDay() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const matches = await this.dataSource.query<
      Array<{ id: string; home_team: string; away_team: string; match_date: string }>
    >(
      `SELECT id, home_team, away_team, match_date
       FROM matches
       WHERE status = 'scheduled' AND match_date >= $1 AND match_date <= $2
       LIMIT 1`,
      [todayStart, todayEnd],
    );

    if (!matches.length) return;
    const match   = matches[0];
    const timeStr = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
    }).format(new Date(match.match_date));

    const rows = await this.dataSource.query<Array<{ user_id: string; nick: string }>>(
      `SELECT s.user_id, u.nick
       FROM push_subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE u.is_active = true`,
    );

    const targets = await Promise.all(
      rows.map(async ({ user_id, nick }) => {
        if (await this.alreadySent(match.id, user_id, 'game_day')) return null;
        await this.markSent(match.id, user_id, 'game_day');
        return {
          userId: user_id,
          payload: {
            title: '🖤🤍 Tem jogo hoje!',
            body:  `${nick}, ${match.home_team} x ${match.away_team} às ${timeStr}. Abra o bolão e aposte!`,
            url:   '/bolao',
            tag:   `gameday-${match.id}`,
          } as PushPayload,
        };
      }),
    );

    const validTargets = targets.filter(Boolean) as Array<{ userId: string; payload: PushPayload }>;
    await this.sendPersonalized(validTargets);
    this.logger.log(`Jogo hoje: ${validTargets.length} notificados (${match.home_team} x ${match.away_team})`);
  }

  // ── Admin / Manual ───────────────────────────────────────────────────────────

  async getStats() {
    const [{ count: subs }] = await this.dataSource.query<[{ count: string }]>(
      'SELECT COUNT(*)::int as count FROM push_subscriptions',
    );
    const [{ count: logs }] = await this.dataSource.query<[{ count: string }]>(
      'SELECT COUNT(*)::int as count FROM push_notification_logs',
    );
    const [{ count: today }] = await this.dataSource.query<[{ count: string }]>(
      "SELECT COUNT(*)::int as count FROM push_notification_logs WHERE sent_at::date = CURRENT_DATE",
    );
    return {
      totalSubscribers: Number(subs),
      totalSent: Number(logs),
      todaySent: Number(today),
    };
  }

  async getSubscribedUsers() {
    return this.dataSource.query<Array<{ id: string; nick: string }>>(
      `SELECT DISTINCT u.id, u.nick
       FROM push_subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE u.is_active = true
       ORDER BY u.nick`,
    );
  }

  /** All active users with notification + PWA status (for admin overview) */
  async getUsersOverview() {
    return this.dataSource.query<
      Array<{ id: string; nick: string; has_push: boolean; pwa_installed: boolean }>
    >(
      `SELECT
         u.id,
         u.nick,
         u.pwa_installed,
         EXISTS (
           SELECT 1 FROM push_subscriptions s WHERE s.user_id = u.id
         ) AS has_push
       FROM users u
       WHERE u.is_active = true
       ORDER BY u.nick`,
    );
  }

  /** Mark that a user has the PWA installed (called from frontend in standalone mode) */
  async markPwaInstalled(userId: string) {
    await this.dataSource.query(
      `UPDATE users SET pwa_installed = true WHERE id = $1 AND pwa_installed = false`,
      [userId],
    );
  }

  async sendManualNotification(
    target: 'all' | string,
    payload: PushPayload,
  ): Promise<{ sent: number; failed: number; total: number }> {
    const subs =
      target === 'all'
        ? await this.subRepo.find()
        : await this.subRepo.find({ where: { userId: target } });

    const fullPayload = JSON.stringify({
      ...payload,
      icon:  payload.icon  ?? 'https://fielriopardo.com.br/icon-192x192.png',
      badge: payload.badge ?? 'https://fielriopardo.com.br/badge-96x96.png',
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dhKey, auth: sub.authKey } },
            fullPayload,
          )
          .catch(async (err: { statusCode?: number }) => {
            if (err?.statusCode === 410) await this.subRepo.delete({ endpoint: sub.endpoint });
            throw err;
          }),
      ),
    );

    const sent   = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    this.logger.log(`Manual push: ${sent} ok, ${failed} falhas / ${subs.length} assinantes`);

    // Save to notification history for each user that received the push
    const successfulUserIds = subs
      .filter((_, i) => results[i].status === 'fulfilled')
      .map(s => s.userId)
      .filter((id, idx, arr) => arr.indexOf(id) === idx); // deduplicate
    await Promise.all(
      successfulUserIds.map(uid =>
        this.saveHistory(uid, payload.title, payload.body ?? '', payload.url ?? '/', 'general').catch(() => null)
      )
    );

    return { sent, failed, total: subs.length };
  }

  /**
   * Cron 8am daily — wish happy birthday to users whose birth_date matches today
   */
  @Cron('0 8 * * *')
  async notifyBirthdays() {
    const rows = await this.dataSource.query<Array<{ user_id: string; nick: string }>>(
      `SELECT s.user_id, u.nick
       FROM push_subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE u.notify_birthday = true
         AND u.is_active = true
         AND u.birth_date IS NOT NULL
         AND EXTRACT(MONTH FROM u.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo')
         AND EXTRACT(DAY   FROM u.birth_date) = EXTRACT(DAY   FROM CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo')`,
    );
    if (!rows.length) return;

    const year = new Date().getFullYear().toString();
    const birthdayKey = `birthday:${year}`;

    const targets = await Promise.all(
      rows.map(async ({ user_id, nick }) => {
        if (await this.alreadySent(birthdayKey, user_id, 'birthday')) return null;
        await this.markSent(birthdayKey, user_id, 'birthday');
        await this.saveHistory(user_id, '🎂 Feliz Aniversário!', `Parabéns, ${nick}! A Fiel Rio Pardo deseja a você um ótimo dia.`, '/', 'birthday');
        return {
          userId: user_id,
          payload: {
            title: '🎂 Feliz Aniversário!',
            body:  `Parabéns, ${nick}! A Fiel Rio Pardo deseja a você um ótimo dia. Vai Corinthians! 🖤🤍`,
            url:   '/',
            tag:   `birthday-${year}`,
          } as PushPayload,
        };
      }),
    );

    const validTargets = targets.filter(Boolean) as Array<{ userId: string; payload: PushPayload }>;
    if (validTargets.length > 0) {
      await this.sendPersonalized(validTargets);
      this.logger.log(`Aniversário: ${validTargets.length} usuário(s) parabenizado(s)`);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private formatTimeLeft(minutes: number): string {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h${m}min` : `${h} hora${h > 1 ? 's' : ''}`;
    }
    return `${minutes} minutos`;
  }
  // ── Notification history (sininho) ───────────────────────────────────────────

  private async saveHistory(userId: string, title: string, body: string, url: string, type: string) {
    try {
      const h = this.historyRepo.create({ userId, title, body, url, type });
      await this.historyRepo.save(h);
    } catch (_) { /* non-blocking */ }
  }

  async getHistory(userId: string): Promise<NotificationHistory[]> {
    return this.historyRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.historyRepo.update({ userId, isRead: false }, { isRead: true });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.historyRepo.count({ where: { userId, isRead: false } });
  }


}
