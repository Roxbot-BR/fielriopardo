import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { NewsCache }   from '../database/entities/news-cache.entity';
import { Match }       from '../database/entities/match.entity';
import { AiContent }   from '../database/entities/ai-content.entity';
import { NewsAgentService }      from './news/news-agent.service';
import { NewsController }        from './news/news.controller';
import { MatchLiveService }      from './match-live/match-live.service';
import { BolaoAgentService }     from './bolao-agent/bolao-agent.service';
import { MatchSchedulerService } from './match-scheduler.service';
import { MatchFetchService }     from './match-fetch/match-fetch.service';
import { BirthdayService }       from './birthday.service';
import { EmailModule }           from '../email/email.module';
import { User }                  from '../database/entities/user.entity';
import { MatchesModule }  from '../matches/matches.module';
import { BolaoModule }    from '../bolao/bolao.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeamLogosModule } from "../team-logos/team-logos.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([NewsCache, Match, AiContent, User]),
    HttpModule,
    TeamLogosModule,
    MatchesModule,
    BolaoModule,
    WebsocketModule,
    AuditModule,
    NotificationsModule,
    EmailModule,
  ],
  providers: [
    NewsAgentService,
    MatchLiveService,
    BolaoAgentService,
    MatchSchedulerService,
    MatchFetchService,
    BirthdayService,
  ],
  controllers: [NewsController],
  exports: [NewsAgentService, MatchLiveService, BolaoAgentService, MatchSchedulerService, MatchFetchService, BirthdayService],
})
export class AgentsModule {}
