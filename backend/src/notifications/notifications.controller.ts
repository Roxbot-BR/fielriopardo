import { Controller, Post, Get, Delete, Body, Req, UseGuards, HttpCode, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Request } from 'express';

interface SubscribeDto {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface SendManualDto {
  target: string; // 'all' or userId
  title: string;
  body: string;
  url?: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  /** Public — frontend needs the key before login to set up SW */
  @Get('vapid-public-key')
  async getVapidKey() {
    return { publicKey: await this.notifService.getVapidPublicKey() };
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  @HttpCode(201)
  async subscribe(@Req() req: Request & { user: { id: string } }, @Body() body: SubscribeDto) {
    await this.notifService.saveSubscription(req.user.id, body);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('subscribe')
  @HttpCode(204)
  async unsubscribe(@Body() body: { endpoint: string }) {
    await this.notifService.removeSubscription(body.endpoint);
  }

  // ── Admin endpoints ──────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER', 'ADMIN')
  @Get('stats')
  async getStats() {
    return this.notifService.getStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER', 'ADMIN')
  @Get('users')
  async getSubscribedUsers() {
    return this.notifService.getSubscribedUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER', 'ADMIN')
  @Get('overview')
  async getUsersOverview() {
    return this.notifService.getUsersOverview();
  }

  @UseGuards(JwtAuthGuard)
  @Post('track-pwa')
  @HttpCode(204)
  async trackPwa(@Req() req: Request & { user: { id: string } }) {
    await this.notifService.markPwaInstalled(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER', 'ADMIN')
  @Post('send-manual')
  @HttpCode(200)
  async sendManual(@Body() body: SendManualDto) {
    return this.notifService.sendManualNotification(body.target, {
      title: body.title,
      body:  body.body,
      url:   body.url ?? '/',
      tag:   `manual-${Date.now()}`,
    });
  }
  // ── User notification history (sininho) ────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(@Req() req: Request & { user: { id: string } }) {
    const items = await this.notifService.getHistory(req.user.id);
    const unread = items.filter((i: any) => !i.isRead).length;
    return { items, unread };
  }

  @UseGuards(JwtAuthGuard)
  @Post('read-all')
  @HttpCode(204)
  async markAllRead(@Req() req: Request & { user: { id: string } }) {
    await this.notifService.markAllRead(req.user.id);
  }


}
