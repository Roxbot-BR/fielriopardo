import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KitHistory } from "../database/entities/kit-history.entity";
import { KitsService } from "./kits.service";
import { KitsController } from "./kits.controller";

@Module({
  imports: [TypeOrmModule.forFeature([KitHistory])],
  providers: [KitsService],
  controllers: [KitsController],
  exports: [KitsService],
})
export class KitsModule {}
