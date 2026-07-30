import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';
import { PortfolioRelevanceController } from './portfolio-relevance.controller';
import { PortfolioRelevanceService } from './portfolio-relevance.service';
import { OpenAiPortfolioRelevanceProvider } from './providers/openai-portfolio-relevance.provider';

@Module({
  controllers: [PortfolioRelevanceController],
  providers: [InternalApiKeyGuard, PortfolioRelevanceService, OpenAiPortfolioRelevanceProvider],
})
export class PortfolioRelevanceModule {}
