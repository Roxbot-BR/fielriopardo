import { Injectable, ConflictException, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../database/entities/user.entity";
import { Role } from "../database/entities/role.entity";
import { AuditLog } from "../database/entities/audit-log.entity";
import { EmailService } from "../email/email.service";

@Injectable()
export class MasterService {
  constructor(
    @InjectRepository(User)     private userRepo: Repository<User>,
    @InjectRepository(Role)     private roleRepo: Repository<Role>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    private dataSource: DataSource,
    private emailService: EmailService,
  ) {}

  async getStats() {
    const totalUsers  = await this.userRepo.count();
    const adminCount  = await this.userRepo.createQueryBuilder("u")
      .innerJoin("u.roles", "r").where("r.name IN (:...roles)", { roles: ["ADMIN", "MASTER"] }).getCount();
    return { totalUsers, adminCount };
  }

  async createAdmin(fullName: string, nick: string, email: string, password: string) {
    const hash = await bcrypt.hash(password, 12);
    const role = await this.roleRepo.findOne({ where: { name: "ADMIN" } });
    const user = this.userRepo.create({ fullName, nick, email, passwordHash: hash, roles: role ? [role] : [] });
    return this.userRepo.save(user);
  }

  getAuditLogs(limit = 100, offset = 0, module?: string, user?: string) {
    let qb = this.auditRepo.createQueryBuilder("log")
      .leftJoin("log.user", "u")
      .addSelect(["u.id", "u.nick", "u.fullName", "u.email"])
      .orderBy("log.createdAt", "DESC")
      .take(limit)
      .skip(offset);
    if (module) qb = qb.andWhere("UPPER(log.module) LIKE :m", { m: `%${module.toUpperCase()}%` });
    if (user)   qb = qb.andWhere("(UPPER(u.nick) LIKE :u OR UPPER(u.fullName) LIKE :u)", { u: `%${user.toUpperCase()}%` });
    return qb.getMany();
  }

  async createUser(data: {
    fullName: string; nick: string; email: string; password: string;
    whatsapp?: string; city?: string; state?: string; role?: string;
  }) {
    const hash = await bcrypt.hash(data.password, 12);
    const roleName = (data.role ?? 'USER').toUpperCase();
    const role = await this.roleRepo.findOne({ where: { name: roleName } });
    const user = this.userRepo.create({
      fullName: data.fullName,
      nick: data.nick,
      email: data.email,
      passwordHash: hash,
      whatsapp: data.whatsapp,
      city: data.city,
      state: data.state,
      roles: role ? [role] : [],
    });
    let saved: any;
    try {
      saved = await this.userRepo.save(user);
    } catch (err: any) {
      if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
        if (err?.detail?.includes('nick') || err?.message?.includes('nick')) {
          throw new ConflictException('Este apelido (nick) já está em uso por outro usuário.');
        }
        if (err?.detail?.includes('email') || err?.message?.includes('email')) {
          throw new ConflictException('Este e-mail já está em uso por outro usuário.');
        }
        throw new ConflictException('Dados duplicados. Verifique nick e e-mail.');
      }
      throw err;
    }
    // If this nick exists as unclaimed pre-registration, mark it claimed
    await this.markNickClaimed(data.nick, saved.id);
    const { passwordHash: _, ...safe } = saved as any;
    return safe;
  }

  private async markNickClaimed(nick: string, userId: string): Promise<void> {
    // Find any unclaimed user with this nick (pre-registration placeholders have is_claimed=false)
    const placeholder = await this.userRepo.findOne({
      where: { nick, isClaimed: false } as any,
    });
    if (placeholder && placeholder.id !== userId) {
      // Remove the placeholder — the real user now owns this nick
      await this.userRepo.delete(placeholder.id);
    }
    // Mark the new/updated user as claimed
    await this.userRepo.update(userId, { isClaimed: true } as any);
  }



  async updateUser(id: string, data: {
    fullName?: string; nick?: string; email?: string; whatsapp?: string;
    city?: string; state?: string; password?: string; birthDate?: string; isActive?: boolean; role?: string;
  }) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new Error("Usuário não encontrado");
    const existingNick = user.nick;
    if (data.fullName) user.fullName = data.fullName;
    if (data.nick) user.nick = data.nick;
    if (data.email) user.email = data.email;
    if (data.whatsapp !== undefined) user.whatsapp = data.whatsapp;
    if (data.city !== undefined) user.city = data.city;
    if (data.state !== undefined) user.state = data.state;
    if (data.password) user.passwordHash = await bcrypt.hash(data.password, 12);
    if (data.birthDate !== undefined) user.birthDate = data.birthDate;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    try {
      const saved = await this.userRepo.save(user);
      // If nick changed, update claim status
      if (data.nick && data.nick !== existingNick) {
        await this.markNickClaimed(data.nick, id);
      }
      const { passwordHash: _, ...safe } = saved as any;
      return safe;
    } catch (err: any) {
      if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
        if (err?.detail?.includes('nick') || err?.message?.includes('nick')) {
          throw new ConflictException('Este apelido (nick) já está em uso por outro usuário.');
        }
        if (err?.detail?.includes('email') || err?.message?.includes('email')) {
          throw new ConflictException('Este e-mail já está em uso por outro usuário.');
        }
        throw new ConflictException('Dados duplicados. Verifique nick e e-mail.');
      }
      throw err;
    }
  }

  async deleteUser(id: string) {
    await this.userRepo.delete(id);
    return { message: "Usuário removido" };
  }

  /**
   * Preview what a merge would do without committing changes.
   */
  async previewMerge(sourceId: string, targetId: string) {
    const [source, target] = await Promise.all([
      this.userRepo.findOne({ where: { id: sourceId }, relations: ['roles'] }),
      this.userRepo.findOne({ where: { id: targetId }, relations: ['roles'] }),
    ]);
    if (!source) throw new NotFoundException('Conta nova não encontrada');
    if (!target) throw new NotFoundException('Nick existente não encontrado');
    if (source.id === target.id) throw new BadRequestException('As contas devem ser diferentes');

    const sourceRoles = (source as any).roles?.map((r: any) => r.name) ?? [];
    if (sourceRoles.includes('MASTER')) throw new BadRequestException('Não é possível mesclar conta MASTER');

    const [sourcePreds] = await this.dataSource.query<[{ count: string }]>(
      'SELECT COUNT(*)::int as count FROM predictions WHERE user_id = $1', [sourceId],
    );
    const [targetPreds] = await this.dataSource.query<[{ count: string }]>(
      'SELECT COUNT(*)::int as count FROM predictions WHERE user_id = $1', [targetId],
    );
    const [sourceRanking] = await this.dataSource.query<[{ total_points: string; season: string } | undefined]>(
      'SELECT total_points, season FROM season_ranking WHERE user_id = $1 ORDER BY season DESC LIMIT 1', [sourceId],
    );
    const [targetRanking] = await this.dataSource.query<[{ total_points: string; season: string } | undefined]>(
      'SELECT total_points, season FROM season_ranking WHERE user_id = $1 ORDER BY season DESC LIMIT 1', [targetId],
    );

    const safe = (u: User) => {
      const { passwordHash: _, ...rest } = u as any;
      return rest;
    };

    return {
      source: { ...safe(source), predictionsCount: Number(sourcePreds.count), ranking: sourceRanking ?? null },
      target: { ...safe(target), predictionsCount: Number(targetPreds.count), ranking: targetRanking ?? null },
      actions: [
        'Credenciais (e-mail, senha, WhatsApp) transferidas para o nick existente',
        `${sourcePreds.count} palpite(s) da conta nova reassociados ao nick existente (sem sobrescrever existentes)`,
        'Assinaturas push transferidas',
        'Conta nova desativada (email removido)',
      ],
    };
  }

  /**
   * Merge sourceId (new account) into targetId (existing nick with history).
   * Credentials move to target, data follows, source is deactivated.
   */
  async mergeAccounts(masterUserId: string, sourceId: string, targetId: string) {
    const [source, target] = await Promise.all([
      this.userRepo.findOne({ where: { id: sourceId }, relations: ['roles'] }),
      this.userRepo.findOne({ where: { id: targetId }, relations: ['roles'] }),
    ]);
    if (!source) throw new NotFoundException('Conta nova não encontrada');
    if (!target) throw new NotFoundException('Nick existente não encontrado');
    if (source.id === target.id) throw new BadRequestException('As contas devem ser diferentes');

    const sourceRoles = (source as any).roles?.map((r: any) => r.name) ?? [];
    if (sourceRoles.includes('MASTER')) throw new BadRequestException('Não é possível mesclar conta MASTER');

    await this.dataSource.transaction(async (em) => {
      // 0. Deactivate source first to free the unique email constraint
      await em.query(
        `UPDATE users SET
           is_active  = false,
           email      = 'merged_' || id || '@fiel.local',
           updated_at = NOW()
         WHERE id = $1`,
        [sourceId],
      );

      // 1. Transfer credentials from source → target
      await em.query(
        `UPDATE users SET
           email           = $2,
           password_hash   = $3,
           full_name       = COALESCE(NULLIF($4,''), full_name),
           whatsapp        = COALESCE(NULLIF($5,''), whatsapp),
           city            = COALESCE(NULLIF($6,''), city),
           state           = COALESCE(NULLIF($7,''), state),
           birth_date      = COALESCE($8, birth_date),
           avatar_url      = COALESCE(NULLIF($9,''), avatar_url),
           email_verified  = $10,
           notify_bolao_open  = $11,
           notify_bolao_close = $12,
           notify_ranking     = $13,
           is_claimed         = true,
           updated_at         = NOW()
         WHERE id = $1`,
        [
          targetId,
          source.email,
          (source as any).passwordHash,
          (source as any).fullName,
          (source as any).whatsapp,
          (source as any).city,
          (source as any).state,
          (source as any).birthDate ?? null,
          (source as any).avatarUrl,
          (source as any).emailVerified ?? false,
          (source as any).notifyBolaoOpen ?? true,
          (source as any).notifyBolaoClose ?? true,
          (source as any).notifyRanking ?? true,
        ],
      );

      // 2. Reassign predictions (skip if target already has one for the same match)
      await em.query(
        `UPDATE predictions SET user_id = $2
         WHERE user_id = $1
           AND match_id NOT IN (SELECT match_id FROM predictions WHERE user_id = $2)`,
        [sourceId, targetId],
      );

      // 3. Reassign match_scores (skip conflicts)
      await em.query(
        `UPDATE match_scores SET user_id = $2
         WHERE user_id = $1
           AND match_id NOT IN (SELECT match_id FROM match_scores WHERE user_id = $2)`,
        [sourceId, targetId],
      );

      // 4. Merge season_ranking — add source points to target if same season, else reassign
      const sourceRankings = await em.query<Array<{ season: string; total_points: number; games_played: number; games_won: number; sole_wins: number }>>(
        'SELECT * FROM season_ranking WHERE user_id = $1', [sourceId],
      );
      for (const sr of sourceRankings) {
        const [existing] = await em.query<[{ id: string } | undefined]>(
          'SELECT id FROM season_ranking WHERE user_id = $1 AND season = $2', [targetId, sr.season],
        );
        if (existing) {
          // Accumulate points only if source had actual activity
          if (Number(sr.total_points) > 0) {
            await em.query(
              `UPDATE season_ranking SET
                 total_points = total_points + $3,
                 games_played = games_played + $4,
                 games_won    = games_won    + $5,
                 sole_wins    = sole_wins    + $6,
                 updated_at   = NOW()
               WHERE user_id = $1 AND season = $2`,
              [targetId, sr.season, sr.total_points, sr.games_played, sr.games_won, sr.sole_wins],
            );
          }
        } else {
          await em.query(
            'UPDATE season_ranking SET user_id = $2 WHERE user_id = $1 AND season = $3',
            [sourceId, targetId, sr.season],
          );
        }
      }

      // 5. Reassign push subscriptions
      await em.query(
        `UPDATE push_subscriptions SET user_id = $2
         WHERE user_id = $1
           AND endpoint NOT IN (SELECT endpoint FROM push_subscriptions WHERE user_id = $2)`,
        [sourceId, targetId],
      );

    });

    // 7. Audit log
    await this.auditRepo.save(
      this.auditRepo.create({
        userId: masterUserId,
        module: 'MASTER',
        action: 'MERGE_ACCOUNTS',
        details: `Conta "${(source as any).nick ?? source.email}" (${sourceId}) mesclada no nick "${(target as any).nick}" (${targetId})`,
      } as any),
    );

    // 8. Send welcome email to target (now has source credentials)
    const updatedTarget = await this.userRepo.findOne({ where: { id: targetId } });
    if (updatedTarget) {
      this.emailService.sendWelcome(updatedTarget).catch(() => null);
    }

    return { ok: true, message: `Contas mescladas com sucesso. Nick "${(target as any).nick}" agora possui as credenciais da conta nova.` };
  }

}