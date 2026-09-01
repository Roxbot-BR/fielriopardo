import {
  Controller, Get, Post, Header, Patch, Delete, Param, Body, Query, UseGuards, Req,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { MatchesService }  from "./matches.service";
import { CreateMatchDto }  from "./dto/create-match.dto";
import { UpdateMatchDto }  from "./dto/update-match.dto";
import { JwtAuthGuard }   from "../common/guards/jwt-auth.guard";
import { RolesGuard }     from "../common/guards/roles.guard";
import { Roles }          from "../common/decorators/roles.decorator";
import { EmailService }   from "../email/email.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../database/entities/user.entity";

@ApiTags("matches")
@Controller("matches")
export class MatchesController {
  constructor(
    private matchesService: MatchesService,
    private emailService: EmailService,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findAll(@Query("status") status?: string, @Query("limit") limit?: string) {
    return this.matchesService.findAll(status, limit ? +limit : undefined);
  }

  @Get("upcoming")
  findUpcoming() { return this.matchesService.findUpcoming(); }

  @Get("live")
  findLive() { return this.matchesService.findLive(); }

  @Get("next")
  getNext() { return this.matchesService.getNext(); }

  @Get("standings")
  getStandings() { return this.matchesService.getStandings(); }

  @Get("open")
  findOpen() { return this.matchesService.findOpen(); }

  @Get("seasons")
  getSeasons() { return this.matchesService.getSeasons(); }

  @Get("competitions")
  getCompetitions() { return this.matchesService.getCompetitions(); }

  @Get("auto-bolao")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles("MASTER", "ADMIN")
  getAutoBolao() {
    return this.matchesService.getAutoBolaoStatus();
  }

  @Patch("auto-bolao")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles("MASTER", "ADMIN")
  setAutoBolao(@Body("enabled") enabled: boolean, @Req() req: any) {
    const userId = req.user?.id ?? 'admin';
    return this.matchesService.setAutoBolao(enabled, userId);
  }

  @Get(":id/live-detail")
  getLiveDetail(@Param("id") id: string) { return this.matchesService.getLiveDetail(id); }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.matchesService.findById(id); }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles("MASTER", "ADMIN")
  create(@Body() dto: CreateMatchDto) { return this.matchesService.create(dto); }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles("MASTER", "ADMIN")
  update(@Param("id") id: string, @Body() dto: UpdateMatchDto) {
    return this.matchesService.update(id, dto);
  }

  @Patch(":id/bolao")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles("MASTER", "ADMIN")
  async toggleBolao(@Param("id") id: string, @Body("open") open: boolean) {
    // update() already handles push notifications + emails internally
    return this.matchesService.update(id, { bolaoOpen: open } as any);
  }

  @Patch(":id/score")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles("MASTER", "ADMIN")
  setScore(
    @Param("id") id: string,
    @Body("homeScore") homeScore: number,
    @Body("awayScore") awayScore: number,
  ) { return this.matchesService.setScore(id, homeScore, awayScore); }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles("MASTER", "ADMIN")
  remove(@Param("id") id: string) {
    return this.matchesService.remove(id);
  }

}
