import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_UPWORK_APIFY_FILTERS,
  type UpworkApifySearchFilters,
  type UpworkFilterGenerationProfile,
} from '@constellation/shared';
import OpenAI from 'openai';
import { buildUpworkFilterUserPrompt, UPWORK_FILTER_SYSTEM_PROMPT } from '../prompts/upwork-filter.prompt';
import { upworkFilterSchema } from '../schemas/upwork-filter.schema';

@Injectable()
export class OpenAiFilterProvider {
  private readonly logger = new Logger(OpenAiFilterProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();
    return Boolean(apiKey && !apiKey.includes('example'));
  }

  async generate(profile: UpworkFilterGenerationProfile): Promise<UpworkApifySearchFilters | null> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey || apiKey.includes('example')) return null;

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: this.configService.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: UPWORK_FILTER_SYSTEM_PROMPT },
        { role: 'user', content: buildUpworkFilterUserPrompt(profile) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    try {
      const parsed: unknown = JSON.parse(content);
      const result = upworkFilterSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(`OpenAI response failed filter validation: ${result.error.message}`);
        return null;
      }

      return {
        item_limit: DEFAULT_UPWORK_APIFY_FILTERS.item_limit,
        job_posted: DEFAULT_UPWORK_APIFY_FILTERS.job_posted,
        proxyConfiguration: DEFAULT_UPWORK_APIFY_FILTERS.proxyConfiguration,
        ...result.data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown model output error';
      this.logger.warn(`OpenAI output could not be parsed; using fallback: ${message}`);
      return null;
    }
  }
}
