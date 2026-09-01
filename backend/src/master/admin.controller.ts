import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from "@nestjs/common";
import { InjectRepository }  from "@nestjs/typeorm";
import { Repository }        from "typeorm";
import { JwtAuthGuard }      from "../common/guards/jwt-auth.guard";
import { RolesGuard }        from "../common/guards/roles.guard";
import { Roles }             from "../common/decorators/roles.decorator";
import { User }              from "../database/entities/user.entity";
import { UsersService }      from "../users/users.service";
import { Match }             from "../database/entities/match.entity";
import { Prediction }        from "../database/entities/prediction.entity";
import { NewsCache }         from "../database/entities/news-cache.entity";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
  constructor(
    private usersService: UsersService,
    @InjectRepository(User)       private userRepo: Repository<User>,
    @InjectRepository(Match)      private matchRepo: Repository<Match>,
    @InjectRepository(Prediction) private predRepo: Repository<Prediction>,
    @InjectRepository(NewsCache) private newsRepo: Repository<NewsCache>,
  ) {}

  @Get("stats")
  async getStats() {
    const [totalMatches, totalPredictions, activeUsers] = await Promise.all([
      this.matchRepo.count(),
      this.predRepo.count(),
      this.userRepo.count({ where: { isActive: true } }),
    ]);
    const last = await this.matchRepo.findOne({
      where: {},
      order: { matchDate: "DESC" },
    });
    return {
      totalMatches,
      totalPredictions,
      activeUsers,
      lastMatchLabel: last ? `${last.homeTeam} x ${last.awayTeam}` : "—",
    };
  }

  @Get("news")
  async getNews(@Query("pending") pending?: string) {
    const where = pending === "true" ? { isApproved: false, isDeleted: false } : { isDeleted: false };
    return this.newsRepo.find({ where, order: { publishedAt: "DESC", fetchedAt: "DESC" }, take: 50 });
  }

  @Patch("news/:id/approve")
  async approveNews(@Param("id") id: string) {
    await this.newsRepo.update(id, { isApproved: true });
    return { success: true };
  }

  @Delete("news/:id")
  async deleteNews(@Param("id") id: string) {
    await this.newsRepo.update(id, { isDeleted: true, isApproved: false } as any);
    return { success: true };
  }

  @Get("users")
  async getUsers() {
    return this.userRepo.find({
      select: ["id", "nick", "fullName", "email", "whatsapp", "city", "state", "isActive", "createdAt"],
      order: { createdAt: "DESC" },
      take: 200,
    });
  }

  @Patch("users/:id")
  async updateUser(@Param("id") id: string, @Query("active") active?: string) {
    const update: Record<string, unknown> = {};
    if (active !== undefined) update.isActive = active === "true";
    await this.userRepo.update(id, update);
    return { success: true };
  }

  @Get("users/duplicates")
  async getUserDuplicates() {
    return this.usersService.findPotentialDuplicates();
  }
}