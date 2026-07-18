import { Injectable, Logger } from '@nestjs/common';
import type { GenerateUpworkFiltersResponse, UpworkFilterGenerationProfile } from '@constellation/shared';
import { buildFallbackFilters } from './fallbacks/build-fallback-filters';
import { OpenAiFilterProvider } from './providers/openai-filter.provider';

@Injectable()
export class FilterGenerationService {
  private readonly logger = new Logger(FilterGenerationService.name);

  constructor(private readonly openAiFilterProvider: OpenAiFilterProvider) {}

  async generate(profile: UpworkFilterGenerationProfile): Promise<GenerateUpworkFiltersResponse> {
    if (!this.openAiFilterProvider.isConfigured()) {
      this.logger.warn('OPENAI_API_KEY is not configured; using deterministic fallback filters');
      return { filters: buildFallbackFilters(profile) };
    }

    const generated = await this.openAiFilterProvider.generate(profile);
    return { filters: generated ?? buildFallbackFilters(profile) };
  }
}
