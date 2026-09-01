import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nick?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  notifyBolaoOpen?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  notifyBolaoClose?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  notifyRanking?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  notifyBirthday?: boolean;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  password?: string;

  @IsOptional() @IsString()
  birthDate?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsString()
  role?: string;
}