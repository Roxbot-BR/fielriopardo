import { Controller, Get, Post, Delete, Param, Body, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { TeamLogosService } from './team-logos.service';

@ApiTags('team-logos')
@Controller('team-logos')
export class TeamLogosController {
  constructor(private teamLogosService: TeamLogosService) {}

  @Get()
  async getAllLogos() {
    return this.teamLogosService.getAllLogos();
  }

  @Get(':slug')
  async getLogoBySlug(@Param('slug') slug: string, @Res() res: Response) {
    const teamName = slug.replace(/-/g, ' ');
    const logoData = await this.teamLogosService.getLogoByTeamName(teamName);
    
    if (!logoData) {
      return res.status(404).json({ message: 'Logo not found' });
    }

    if (logoData.startsWith('data:')) {
      const matches = logoData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        return res.send(buffer);
      }
    }

    return res.redirect(302, logoData);
  }

  @Post()
  async saveTeamLogo(@Body() body: { teamName: string; logoUrl: string; source: string; downloadAndCache?: boolean }) {
    return this.teamLogosService.saveTeamLogo(
      body.teamName,
      body.logoUrl,
      body.source,
      body.downloadAndCache ?? true,
    );
  }

  @Delete(':slug')
  async deleteLogoBySlug(@Param('slug') slug: string) {
    await this.teamLogosService.deleteLogoBySlug(slug);
    return { message: 'Logo deleted' };
  }
}
