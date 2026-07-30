import { Injectable, Logger } from '@nestjs/common';
import type { FindRelevantPortfolioRequest, FindRelevantPortfolioResponse } from '@constellation/shared';
import { buildFallbackPortfolioRelevance } from './fallbacks/build-fallback-portfolio-relevance';
import { OpenAiPortfolioRelevanceProvider } from './providers/openai-portfolio-relevance.provider';

@Injectable()
export class PortfolioRelevanceService {
  private readonly logger = new Logger(PortfolioRelevanceService.name);

  constructor(private readonly provider: OpenAiPortfolioRelevanceProvider) {}

  async find(input: FindRelevantPortfolioRequest): Promise<FindRelevantPortfolioResponse> {
    if (input.portfolio.length === 0) return { matches: [] };

    if (!this.provider.isConfigured()) {
      this.logger.warn('OPENAI_API_KEY is not configured; using deterministic portfolio relevance fallback');
      return buildFallbackPortfolioRelevance(input);
    }

    const generated = await this.provider.find(input);
    return generated ?? buildFallbackPortfolioRelevance(input);
  }
}
