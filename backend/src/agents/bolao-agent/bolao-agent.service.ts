import { Injectable, Logger } from '@nestjs/common';
import { BolaoService } from '../../bolao/bolao.service';
import { MatchesService } from '../../matches/matches.service';
import { EventsGateway } from '../../websocket/events.gateway';
import { EmailService } from '../../email/email.service';
import { AuditService } from '../../audit/audit.service';
import { SettingsService } from '../../settings/settings.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiContent } from '../../database/entities/ai-content.entity';

@Injectable()
export class BolaoAgentService {
  private readonly logger = new Logger(BolaoAgentService.name);

  constructor(
    private bolaoService: BolaoService,
    private matchesService: MatchesService,
    private eventsGateway: EventsGateway,
    private emailService: EmailService,
    private settings: SettingsService,
    @InjectRepository(AiContent)
    private aiContentRepo: Repository<AiContent>,
    private audit: AuditService,
  ) {}

  async processResults(matchId: string): Promise<void> {
    this.logger.log('Processing bolao results for match ' + matchId);
    try {
      const match = await this.matchesService.findById(matchId);

      if (match.homeScore === null || match.awayScore === null) {
        this.logger.warn('Match ' + matchId + ' has no final score');
        return;
      }

      const scores = await this.bolaoService.calculateResults(
        matchId,
        match.homeScore,
        match.awayScore,
      );

      const result = await this.bolaoService.getMatchResult(matchId);

      this.eventsGateway.emitBolaoResults({
        matchId,
        result,
        summary: await this.generateResultSummary(matchId),
      });

      const season = new Date().getFullYear().toString();
      const ranking = await this.bolaoService.getRanking(season);
      this.eventsGateway.emitRankingUpdate({ season, ranking });

      this.logger.log('Bolao results processed for match ' + matchId + ': ' + scores.length + ' scores calculated');

      // Send result email only to acertadores (scores with user relation loaded)
      try {
        const scoresWithUsers = await this.bolaoService.getScoresWithUsers(matchId);
        await this.emailService.sendMatchResult(match, scoresWithUsers, ranking);
        this.logger.log('Match result emails sent for match ' + matchId);
      await this.audit.log(null, 'AGENT_RUN', 'AGENT', 'bolao: ranking atualizado - ' + scores.length + ' scores calculados').catch(() => {});
      } catch (emailErr) {
        this.logger.error('Error sending match result emails: ' + (emailErr as Error).message);
      }
    } catch (err) {
      this.logger.error('Error processing bolao results: ' + (err as Error).message);
    }
  }

  async generateResultSummary(matchId: string): Promise<string> {
    try {
      const result = await this.bolaoService.getMatchResult(matchId);
      const { match, results, winners } = result;

      const topPlayers = (results as any[]).slice(0, 3).map((r: any) => r.user.nick).join(', ');
      const prompt = 'Crie uma mensagem animada sobre o resultado do bolao do Corinthians. ' +
        'Partida: ' + match.homeTeam + ' ' + match.homeScore + ' x ' + match.awayScore + ' ' + match.awayTeam + '. ' +
        'Acertadores: ' + winners + '. Top: ' + topPlayers;

      const summary = await this.settings.completeAiText({
        prompt,
        maxTokens: 400,
      });

      const aiContent = this.aiContentRepo.create({
        type: 'bolao_result',
        matchId,
        contentJson: { summary, result },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await this.aiContentRepo.save(aiContent);

      return summary;
    } catch (err) {
      this.logger.error('Error generating result summary: ' + (err as Error).message);
      return 'Resultado do bolao calculado!';
    }
  }
}
