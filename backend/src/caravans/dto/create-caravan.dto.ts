import { IsString, IsOptional, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCaravanDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  matchId?: string;

  @IsString()
  departureCity!: string;

  @IsString()
  departurePoint!: string;

  @IsDateString()
  departureDatetime!: string;

  @IsOptional()
  @IsDateString()
  returnDatetime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  contactWhatsapp?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;
}
