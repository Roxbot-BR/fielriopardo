import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamLogo } from '../database/entities/team-logo.entity';
import axios from 'axios';

@Injectable()
export class TeamLogosService {
  private readonly logger = new Logger(TeamLogosService.name);

  constructor(
    @InjectRepository(TeamLogo)
    private teamLogosRepo: Repository<TeamLogo>,
  ) {}

  private normalizeTeamName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async getLogoByTeamName(teamName: string): Promise<string | null> {
    const slug = this.normalizeTeamName(teamName);
    const cached = await this.teamLogosRepo.findOne({ where: { teamSlug: slug } });
    
    if (cached) {
      return cached.logoData || cached.logoUrl;
    }
    
    return null;
  }

  async saveTeamLogo(
    teamName: string,
    logoUrl: string,
    source: string,
    downloadAndCache = true,
  ): Promise<TeamLogo> {
    const slug = this.normalizeTeamName(teamName);
    let logoData: string | null = null;

    if (downloadAndCache) {
      try {
        const response = await axios.get(logoUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
          maxRedirects: 5,
        });
        
        const contentType = response.headers['content-type'] || 'image/png';
        const base64 = Buffer.from(response.data).toString('base64');
        logoData = `data:${contentType};base64,${base64}`;
        
        this.logger.log(`Downloaded and cached logo for ${teamName}`);
      } catch (error) {
        this.logger.warn(`Failed to download logo for ${teamName}: ${error.message}`);
      }
    }

    const existing = await this.teamLogosRepo.findOne({ where: { teamSlug: slug } });
    
    if (existing) {
      existing.logoUrl = logoUrl;
      existing.logoData = logoData || existing.logoData;
      existing.source = source;
      existing.updatedAt = new Date();
      return this.teamLogosRepo.save(existing);
    }

    const newLogo = this.teamLogosRepo.create({
      teamName,
      teamSlug: slug,
      logoUrl,
      logoData,
      source,
    });

    return this.teamLogosRepo.save(newLogo);
  }

  async getAllLogos(): Promise<TeamLogo[]> {
    return this.teamLogosRepo.find({ order: { teamName: 'ASC' } });
  }

  async deleteLogoBySlug(slug: string): Promise<void> {
    await this.teamLogosRepo.delete({ teamSlug: slug });
  }
}
