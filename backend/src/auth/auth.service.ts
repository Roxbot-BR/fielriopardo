import { AuditService } from "../audit/audit.service";
import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { EmailService }  from "../email/email.service";
import { RegisterDto }   from "./dto/register.dto";
import { LoginDto }      from "./dto/login.dto";
import { User }          from "../database/entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private auditService: AuditService,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async getAvailableNicks(): Promise<{ id: string; nick: string }[]> {
    const rows = await this.usersRepo.query(`
      SELECT u.id, u.nick
      FROM users u
      LEFT JOIN season_ranking sr ON sr.user_id = u.id
      WHERE u.is_claimed = false
      ORDER BY COALESCE(sr.total_points, 0) DESC, u.nick ASC
    `);
    return rows;
  }

  async checkNickAvailable(nick: string): Promise<{ available: boolean; reserved?: boolean; claimId?: string }> {
    const rows = await this.usersRepo.query(
      `SELECT id, is_claimed FROM users WHERE LOWER(nick) = LOWER($1) LIMIT 1`,
      [nick]
    );
    if (rows.length === 0) return { available: true };
    const user = rows[0];
    if (!user.is_claimed) return { available: false, reserved: true, claimId: user.id };
    return { available: false };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  async register(dto: RegisterDto) {
    // 18+ age validation
    if (dto.birthDate) {
      const birth = new Date(dto.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear() -
        (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
      if (age < 18) throw new BadRequestException('Você precisa ter 18 anos ou mais para participar');
    }
    if (dto.claimUserId) {
      // Claim flow
      const user = await this.usersService.findById(dto.claimUserId);
      if (!user || user.isClaimed) {
        throw new ConflictException("Nick already claimed or not found");
      }

      // Check email not taken by ANOTHER user
      const emailConflict = await this.usersService.findByEmail(dto.email);
      if (emailConflict && emailConflict.id !== user.id) {
        throw new ConflictException("E-mail já cadastrado no sistema");
      }

      // Check WhatsApp not taken by ANOTHER user
      if (dto.whatsapp) {
        const waConflict = await this.usersService.findByWhatsapp(dto.whatsapp, user.id);
        if (waConflict) throw new ConflictException("WhatsApp já cadastrado no sistema");
      }

      const passwordHash = await bcrypt.hash(dto.password, 12);
      user.email = dto.email;
      user.passwordHash = passwordHash;
      user.fullName = dto.fullName;
      user.whatsapp = dto.whatsapp ?? user.whatsapp;
      if (dto.birthDate) user.birthDate = dto.birthDate;
      user.city = dto.city ?? user.city;
      user.state = dto.state ?? user.state;
      user.isClaimed = true;
      user.isActive = true;

      const saved = await this.usersRepo.save(user);
      this.emailService.sendWelcome(saved).catch(() => null);
      return this.generateTokens(saved);
    }

    // New user flow
    if (!dto.nick) throw new ConflictException("Nick is required");

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException("E-mail já cadastrado no sistema");

    const nickCheck = await this.checkNickAvailable(dto.nick);
    if (!nickCheck.available) throw new ConflictException("Nick already taken");

    // Check WhatsApp uniqueness
    if (dto.whatsapp) {
      const waConflict = await this.usersService.findByWhatsapp(dto.whatsapp);
      if (waConflict) throw new ConflictException("WhatsApp já cadastrado no sistema");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      fullName: dto.fullName,
      nick: dto.nick,
      email: dto.email,
      passwordHash,
      whatsapp: dto.whatsapp,
      city: dto.city,
      state: dto.state,
        birthDate: dto.birthDate,
      isClaimed: true,
    });

    this.emailService.sendWelcome(user).catch(() => null);

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException("Invalid credentials");
    if (!user.isActive) throw new UnauthorizedException("Account is inactive");
    return this.generateTokens(user);
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET ?? "default-secret",
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email };
    const accessToken  = this.jwtService.sign(payload, { expiresIn: "30d" });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });
    return {
      accessToken,
      refreshToken,
      user: {
        id:        user.id,
        fullName:  user.fullName,
        nick:      user.nick,
        email:     user.email,
        roles:     (user.roles ?? []).map((r: any) => r.name),
        city:      user.city,
        state:     user.state,
        whatsapp:  user.whatsapp,
        isActive:  user.isActive,
        birthDate: user.birthDate ?? null,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) return { message: "Se o e-mail estiver cadastrado, você receberá um link em breve." };
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await this.usersRepo.save(user);
    await this.emailService.sendPasswordReset(user, token);
    return { message: "Se o e-mail estiver cadastrado, você receberá um link em breve." };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersRepo.findOne({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new BadRequestException("Link inválido ou expirado.");
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await this.usersRepo.save(user);
    return { message: "Senha atualizada com sucesso!" };
  }
}