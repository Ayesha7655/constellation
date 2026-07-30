import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FindRelevantPortfolioRequest, FindRelevantPortfolioResponse } from '@constellation/shared';
import OpenAI from 'openai';
import {
  buildUpworkPortfolioRelevanceUserPrompt,
  getUpworkPortfolioRelevanceSystemPrompt,
} from '../../../common/prompts/builders/upwork-portfolio-relevance.prompt';
import { portfolioRelevanceSchema } from '../schemas/portfolio-relevance.schema';

@Injectable()
export class OpenAiPortfolioRelevanceProvider {
  private readonly logger = new Logger(OpenAiPortfolioRelevanceProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();
    return Boolean(apiKey && !apiKey.includes('example'));
  }

  async find(input: FindRelevantPortfolioRequest): Promise<FindRelevantPortfolioResponse | null> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey || apiKey.includes('example')) return null;

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: this.configService.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: getUpworkPortfolioRelevanceSystemPrompt() },
        {
          role: 'user',
          content: buildUpworkPortfolioRelevanceUserPrompt({
            job: input.job as unknown as Record<string, unknown>,
            portfolio: input.portfolio as unknown as Array<Record<string, unknown>>,
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    try {
      const parsed: unknown = JSON.parse(content);
      const result = portfolioRelevanceSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(`OpenAI portfolio relevance output failed validation: ${result.error.message}`);
        return null;
      }

      const candidateIds = new Set(input.portfolio.map((project) => project.id));
      const seen = new Set<string>();
      for (const match of result.data.matches) {
        if (!candidateIds.has(match.portfolioProjectId) || seen.has(match.portfolioProjectId)) {
          this.logger.warn('OpenAI portfolio relevance output referenced an unknown or duplicate project id');
          return null;
        }
        seen.add(match.portfolioProjectId);
      }

      return result.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown model output error';
      this.logger.warn(`OpenAI portfolio relevance output could not be parsed; using fallback: ${message}`);
      return null;
    }
  }
}
