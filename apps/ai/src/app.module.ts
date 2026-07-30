import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { FilterGenerationModule } from './modules/filter-generation/filter-generation.module';
import { PortfolioRelevanceModule } from './modules/portfolio-relevance/portfolio-relevance.module';
import { ProposalGenerationModule } from './modules/proposal-generation/proposal-generation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    FilterGenerationModule,
    ProposalGenerationModule,
    PortfolioRelevanceModule,
  ],
})
export class AppModule {}
