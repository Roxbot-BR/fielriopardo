import { AuditService } from '../audit/audit.service';
import {
  Controller,
  Get,
  Patch,
  Put,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators/roles.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(
    private settingsService: SettingsService,
    private auditService: AuditService,
  ) {}

  @Get('public')
  getPublic() {
    return this.settingsService.getPublic();
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER', 'ADMIN')
  getAll(@Query('category') category?: string) {
    return this.settingsService.getAll(category);
  }

  @Patch(':key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER', 'ADMIN')
  update(
    @Param('key') key: string,
    @Body('value') value: string,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.set(key, value, user.id);
  }

  @Put()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER', 'ADMIN')
  async updateBulk(
    @Body() body: Record<string, string>,
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setBulk(body, user.id);
    await this.auditService.log(user.id, 'SETTINGS_UPDATE', 'SETTINGS', `Configurações atualizadas em lote`);
    return { success: true, message: 'Configurações salvas com sucesso' };
  }

}
