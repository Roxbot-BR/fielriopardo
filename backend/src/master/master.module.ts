import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User }       from "../database/entities/user.entity";
import { Role }       from "../database/entities/role.entity";
import { AuditLog }   from "../database/entities/audit-log.entity";
import { Match }      from "../database/entities/match.entity";
import { Prediction } from "../database/entities/prediction.entity";
import { NewsCache }  from "../database/entities/news-cache.entity";
import { MatchScore } from "../database/entities/match-score.entity";
import { SeasonRanking } from "../database/entities/season-ranking.entity";
import { MasterService }    from "./master.service";
import { MasterController } from "./master.controller";
import { AdminController }  from "./admin.controller";
import { AuditModule }    from "../audit/audit.module";
import { AgentsModule }   from "../agents/agents.module";
import { MatchesModule }  from "../matches/matches.module";
import { UsersModule }    from "../users/users.module";
import { EmailModule }    from "../email/email.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, AuditLog, Match, Prediction, NewsCache, MatchScore, SeasonRanking]),
    AuditModule,
    AgentsModule,
    MatchesModule,
    UsersModule,
    EmailModule,
    NotificationsModule,
  ],
  controllers: [MasterController, AdminController],
  providers: [MasterService],
  exports: [MasterService],
})
export class MasterModule {}
