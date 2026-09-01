import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { AuthModule }      from "./auth/auth.module";
import { UsersModule }     from "./users/users.module";
import { MatchesModule }   from "./matches/matches.module";
import { BolaoModule }     from "./bolao/bolao.module";
import { SettingsModule }  from "./settings/settings.module";
import { AuditModule }     from "./audit/audit.module";
import { MasterModule }    from "./master/master.module";
import { WebsocketModule } from "./websocket/websocket.module";
import { AgentsModule }    from "./agents/agents.module";
import { EmailModule }     from "./email/email.module";
import { CaravansModule }  from "./caravans/caravans.module";
import { PlayersModule }   from "./players/players.module";
import { KitsModule }      from "./kits/kits.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { TeamLogosModule } from "./team-logos/team-logos.module";
import { AppController }   from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host:     process.env.DB_HOST     ?? "localhost",
      port:     +(process.env.DB_PORT   ?? 5432),
      username: process.env.DB_USER     ?? "fielriopardo",
      password: process.env.DB_PASS     ?? "changeme",
      database: process.env.DB_NAME     ?? "fielriopardo",
      synchronize: false,
      autoLoadEntities: true,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    }),
    ScheduleModule.forRoot(),
    EmailModule,
    SettingsModule,
    AuditModule,
    WebsocketModule,
    AuthModule,
    UsersModule,
    MatchesModule,
    BolaoModule,
    CaravansModule,
    PlayersModule,
    KitsModule,
    NotificationsModule,
    TeamLogosModule,
    AgentsModule,
    MasterModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
