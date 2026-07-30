import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { FindRelevantPortfolioResponse } from '@constellation/shared';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';
import { FindRelevantPortfolioDto } from './dto/find-relevant-portfolio.dto';
import { PortfolioRelevanceService } from './portfolio-relevance.service';

@Controller('v1')
@UseGuards(InternalApiKeyGuard)
export class PortfolioRelevanceController {
  constructor(private readonly portfolioRelevanceService: PortfolioRelevanceService) {}

  @Post('find-relevant-portfolio')
  findRelevantPortfolio(@Body() dto: FindRelevantPortfolioDto): Promise<FindRelevantPortfolioResponse> {
    return this.portfolioRelevanceService.find({
      job: dto.job,
      portfolio: dto.portfolio,
    });
  }
}
