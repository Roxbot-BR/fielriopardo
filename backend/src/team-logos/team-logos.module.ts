import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamLogo } from '../database/entities/team-logo.entity';
import { TeamLogosService } from './team-logos.service';
import { TeamLogosController } from './team-logos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TeamLogo])],
  controllers: [TeamLogosController],
  providers: [TeamLogosService],
  exports: [TeamLogosService],
})
export class TeamLogosModule {}
