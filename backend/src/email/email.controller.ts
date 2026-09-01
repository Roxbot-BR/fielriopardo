import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /** Tracking pixel — marks email as opened */
  @Get('track/:id')
  async trackOpen(@Param('id') id: string, @Res() res: any) {
    await this.emailService.markOpened(id);
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.set({ 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, no-cache', Pragma: 'no-cache' });
    res.end(pixel);
  }

  /** Email stats for master dashboard */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER', 'ADMIN')
  @Get('stats')
  async getStats() {
    return this.emailService.getEmailStats();
  }
}
