import { IsEmail, IsString, MinLength, IsOptional, IsUUID } from "class-validator";

export class RegisterDto {
  @IsString()
  fullName!: string;

  @IsOptional() @IsString()
  nick?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional() @IsString()
  whatsapp?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsString()
  state?: string;

  @IsOptional() @IsUUID()
  claimUserId?: string;

  @IsOptional() @IsString()
  birthDate?: string;
}
