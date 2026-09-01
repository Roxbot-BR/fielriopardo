import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match }       from '../database/entities/match.entity';
import { AiContent }   from '../database/entities/ai-content.entity';
import { User }        from '../database/entities/user.entity';
import { MatchesService }    from './matches.service';
import { MatchesController } from './matches.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match, AiContent, User]), NotificationsModule, EmailModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService, TypeOrmModule],
})
export class MatchesModule {}
