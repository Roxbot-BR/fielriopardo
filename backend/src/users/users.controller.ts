import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles, CurrentUser } from "../common/decorators/roles.decorator";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("count")
  @Public()
  async countActive() {
    return this.usersService.countActive();
  }

  @Get()
  @Roles("MASTER", "ADMIN")
  findAll() {
    return this.usersService.findAll();
  }

  @Get("me")
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @Patch("me")
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @Patch("me/nick")
  updateNick(@CurrentUser() user: any, @Body("nick") nick: string) {
    return this.usersService.updateNick(user.id, nick);
  }

  @Get(":id")
  @Roles("MASTER", "ADMIN")
  findOne(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Patch(":id")
  @Roles("MASTER", "ADMIN")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(":id/deactivate")
  @Roles("MASTER", "ADMIN")
  toggleActive(@Param("id") id: string) {
    return this.usersService.toggleActive(id);
  }

  @Post("me/change-password")
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }
}
