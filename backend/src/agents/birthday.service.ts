import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../database/entities/user.entity";
import { EmailService } from "../email/email.service";

@Injectable()
export class BirthdayService {
  private readonly logger = new Logger(BirthdayService.name);

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private emailService: EmailService,
  ) {}

  /** Every day at 08:00 (Brazil time) — send birthday emails */
  @Cron("0 8 * * *", { timeZone: "America/Sao_Paulo" })
  async sendBirthdayEmails(): Promise<void> {
    const now = new Date();
    const day   = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    this.logger.log(`Birthday cron: checking birthdays for ${day}/${month}`);

    // Find users whose birth_date day/month matches today
    const users = await this.usersRepo
      .createQueryBuilder("u")
      .where("u.is_active = true")
      .andWhere("u.is_claimed = true")
      .andWhere("u.birth_date IS NOT NULL")
      .andWhere("u.notify_birthday = true")
      .andWhere("EXTRACT(DAY FROM u.birth_date) = :day", { day: parseInt(day) })
      .andWhere("EXTRACT(MONTH FROM u.birth_date) = :month", { month: parseInt(month) })
      .getMany();

    this.logger.log(`Birthday cron: ${users.length} aniversariante(s) hoje`);
    for (const user of users) {
      try {
        await this.emailService.sendBirthday(user);
        this.logger.log(`Birthday: email enviado para ${user.nick} (${user.email})`);
      } catch (err) {
        this.logger.error(`Birthday: erro ao enviar para ${user.nick}`, err);
      }
    }
  }
}
