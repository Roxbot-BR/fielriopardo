import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Competition } from '../../database/entities/match.entity';

export class CreateMatchDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ enum: Competition })
  @IsEnum(Competition)
  competition: Competition;

  @ApiProperty()
  @IsString()
  season: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  roundNumber?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roundLabel?: string;

  @ApiProperty()
  @IsString()
  homeTeam: string;

  @ApiProperty()
  @IsString()
  awayTeam: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  homeTeamLogo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  awayTeamLogo?: string;

  @ApiProperty()
  @IsDateString()
  matchDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stadium?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tvChannel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  radioUrl?: string;
}
