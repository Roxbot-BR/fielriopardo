import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MasterOnlyGuard } from '../common/guards/master-only.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard, MasterOnlyGuard)
export class AuditController {
  constructor(private svc: AuditService) {}

  @Get()
  find(
    @Query('module') module?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAll({
      module,
      userId: userId ?? undefined,
      limit: limit ? +limit : 100,
    });
  }
}
