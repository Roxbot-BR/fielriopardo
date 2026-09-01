import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/roles.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get("available-nicks")
  getAvailableNicks() {
    return this.authService.getAvailableNicks();
  }

  @Get("check-nick")
  checkNick(@Query("nick") nick: string) {
    return this.authService.checkNickAvailable(nick);
  }

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body("refreshToken") token: string) {
    return this.authService.refreshToken(token);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@CurrentUser() user: any) {
    return {
      id: user.id,
      fullName: user.fullName,
      nick: user.nick,
      email: user.email,
      whatsapp: user.whatsapp,
      city: user.city,
      state: user.state,
      avatarUrl: user.avatarUrl,
      roles:     user.roles?.map((r: any) => r.name) || [],
      birthDate: user.birthDate ?? null,
    };
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body("email") email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body("token") token: string, @Body("password") password: string) {
    return this.authService.resetPassword(token, password);
  }
}