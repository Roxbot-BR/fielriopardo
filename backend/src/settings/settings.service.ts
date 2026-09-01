import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { SystemSetting } from '../database/entities/system-setting.entity';

interface AiTextOptions {
  prompt: string;
  system?: string;
  maxTokens?: number;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private settingsRepo: Repository<SystemSetting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.settingsRepo.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  async set(key: string, value: string, userId: string): Promise<SystemSetting> {
    let setting = await this.settingsRepo.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingsRepo.create({ key, category: this.inferCategory(key) });
    } else if (!setting.category) {
      setting.category = this.inferCategory(key);
    }
    setting.value = value;
    setting.updatedBy = userId;
    return this.settingsRepo.save(setting);
  }

  async getAll(category?: string): Promise<SystemSetting[]> {
    if (category) {
      return this.settingsRepo.find({ where: { category } });
    }
    return this.settingsRepo.find();
  }

  async getPublic(): Promise<SystemSetting[]> {
    return this.settingsRepo.find({ where: { isPublic: true } });
  }

  async hasAiProvider(): Promise<boolean> {
    const provider = await this.getAiProvider();
    const dbKey = await this.get(provider === 'openai' ? 'openai_api_key' : 'anthropic_api_key');
    const envKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
    const key = dbKey || (envKey && !envKey.includes('CONFIGURE_VIA') ? envKey : null);
    return Boolean(key);
  }

  async completeAiText(options: AiTextOptions): Promise<string> {
    const provider = await this.getAiProvider();
    if (provider === 'openai') {
      return this.completeOpenAiText(options);
    }
    return this.completeAnthropicText(options);
  }

  async setBulk(data: Record<string, string>, userId: string): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        await this.set(key, String(value), userId);
      }
    }
  }

  private inferCategory(key: string): string {
    if (
      key === 'ai_provider' ||
      key.startsWith('anthropic_') ||
      key.startsWith('openai_')
    ) {
      return 'ai';
    }
    if (key.startsWith('smtp_') || key.startsWith('email_')) {
      return 'email';
    }
    if (key.startsWith('bolao_') || key.startsWith('prize_')) {
      return 'bolao';
    }
    if (key.endsWith('_url')) {
      return 'social';
    }
    return 'general';
  }

  private async getAiProvider(): Promise<'claude' | 'openai'> {
    const dbProvider = await this.get('ai_provider');
    if (dbProvider === 'openai' || dbProvider === 'claude') return dbProvider;
    // Fallback: infer from env variables
    const envProvider = process.env.AI_PROVIDER;
    if (envProvider === 'openai') return 'openai';
    const anthropicEnv = process.env.ANTHROPIC_API_KEY;
    if (anthropicEnv && !anthropicEnv.includes('CONFIGURE_VIA')) return 'claude';
    return 'claude';
  }

  private async completeAnthropicText(options: AiTextOptions): Promise<string> {
    const dbKey = await this.get('anthropic_api_key');
    const envKey = process.env.ANTHROPIC_API_KEY;
    const apiKey = dbKey || (envKey && !envKey.includes('CONFIGURE_VIA') ? envKey : null);
    if (!apiKey) throw new Error('Anthropic API key nao configurada');

    const dbModel = await this.get('anthropic_model');
    const model = dbModel || process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model,
      max_tokens: options.maxTokens ?? 1000,
      ...(options.system ? { system: options.system } : {}),
      messages: [{ role: 'user', content: options.prompt }],
    });
    const textBlock = msg.content.find((block: any) => block.type === 'text') as any;
    return textBlock?.text ?? '';
  }

  private async completeOpenAiText(options: AiTextOptions): Promise<string> {
    const dbKey = await this.get('openai_api_key');
    const apiKey = dbKey || process.env.OPENAI_API_KEY || null;
    if (!apiKey) throw new Error('OpenAI API key nao configurada');

    const dbModel = await this.get('openai_model');
    const model = dbModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const messages = [
      ...(options.system ? [{ role: 'system', content: options.system }] : []),
      { role: 'user', content: options.prompt },
    ];
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_completion_tokens: options.maxTokens ?? 1000,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message ?? `OpenAI API error ${response.status}`);
    }
    return data?.choices?.[0]?.message?.content ?? '';
  }

}
