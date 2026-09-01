import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prediction } from '../database/entities/prediction.entity';
import { MatchScore } from '../database/entities/match-score.entity';
import { SeasonRanking } from '../database/entities/season-ranking.entity';
import { AiContent } from '../database/entities/ai-content.entity';
import { BolaoService } from './bolao.service';
import { BolaoController } from './bolao.controller';
import { MatchesModule } from '../matches/matches.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prediction, MatchScore, SeasonRanking, AiContent]),
    MatchesModule,
    SettingsModule,
    NotificationsModule,
  ],
  controllers: [BolaoController],
  providers: [BolaoService],
  exports: [BolaoService],
})
export class BolaoModule {}
