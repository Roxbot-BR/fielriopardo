import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Competition, MatchStatus } from '../../database/entities/match.entity';

export class UpdateMatchDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  homeTeam?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  awayTeam?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  matchDate?: string;

  @ApiProperty({ required: false, enum: Competition })
  @IsOptional()
  @IsEnum(Competition)
  competition?: Competition;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roundLabel?: string;

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

  @ApiProperty({ required: false, enum: MatchStatus })
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  homeScore?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  awayScore?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  bolaoOpen?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  matchStats?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  matchEvents?: any;
}
