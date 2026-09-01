import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BolaoService } from './bolao.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, Roles } from '../common/decorators/roles.decorator';

@ApiTags('bolao')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bolao')
export class BolaoController {
  constructor(private bolaoService: BolaoService) {}

  @Get('config')
  @Public()
  getConfig() {
    return this.bolaoService.getConfig();
  }

  @Put('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER', 'ADMIN')
  saveConfig(@Body() body: Record<string, string>, @CurrentUser() user: any) {
    return this.bolaoService.saveConfig(body, user.id);
  }

  @Post('predict')
  submitPrediction(
    @CurrentUser() user: any,
    @Body('matchId') matchId: string,
    @Body('homeScore') homeScore: number,
    @Body('awayScore') awayScore: number,
  ) {
    return this.bolaoService.submitPrediction(user.id, matchId, homeScore, awayScore);
  }

  @Get('predictions/me')
  getMyPredictions(@CurrentUser() user: any) {
    return this.bolaoService.getUserPredictions(user.id);
  }

  @Get('predictions/:matchId')
  getPredictions(@Param('matchId') matchId: string) {
    return this.bolaoService.getPredictions(matchId);
  }

  @Get('my-prediction/:matchId')
  getMyPrediction(@CurrentUser() user: any, @Param('matchId') matchId: string) {
    return this.bolaoService.getUserPrediction(user.id, matchId);
  }

  @Get('ranking')
  @Public()
  getRanking(@Query('season') season: string) {
    const currentSeason = season || new Date().getFullYear().toString();
    return this.bolaoService.getRanking(currentSeason);
  }

  @Get('result/:matchId')
  @Public()
  getMatchResult(@Param('matchId') matchId: string) {
    return this.bolaoService.getMatchResult(matchId);
  }

  @Get('my-scores')
  getMyScores(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.bolaoService.getMyScores(user.id, limit ? +limit : 10);
  }

  @Get('odds/:matchId')
  getMatchOdds(@Param('matchId') matchId: string) {
    return this.bolaoService.getMatchOdds(matchId);
  }

  @Post('odds/:matchId/refresh')
  @UseGuards(RolesGuard)
  @Roles('MASTER', 'ADMIN')
  refreshOdds(@Param('matchId') matchId: string) {
    return this.bolaoService.refreshMatchOdds(matchId);
  }

  @Get('insights/:matchId')
  getMatchInsights(@Param('matchId') matchId: string) {
    return this.bolaoService.getMatchInsights(matchId);
  }

  @Get("historico")
  @Public()
  getHistorico(
    @Query("season") season?: string,
    @Query("competition") competition?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
  ) {
    return this.bolaoService.getHistorico({ season, competition, dateFrom, dateTo });
  }

}
