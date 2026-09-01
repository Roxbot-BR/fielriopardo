import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SystemSetting } from "../database/entities/system-setting.entity";
import { SettingsService } from "./settings.service";
import { SettingsController } from "./settings.controller";
import { AuditModule } from "../audit/audit.module";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting]), AuditModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
