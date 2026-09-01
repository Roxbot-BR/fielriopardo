import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService }     from "./auth.service";
import { AuthController }  from "./auth.controller";
import { JwtStrategy }     from "./strategies/jwt.strategy";
import { LocalStrategy }   from "./strategies/local.strategy";
import { UsersModule }     from "../users/users.module";
import { EmailModule }     from "../email/email.module";
import { AuditModule }     from "../audit/audit.module";
import { User }            from "../database/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    EmailModule,
    AuditModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET", "default-secret"),
        signOptions: { expiresIn: "30d" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
