import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';
import { FilterGenerationController } from './filter-generation.controller';
import { FilterGenerationService } from './filter-generation.service';
import { OpenAiFilterProvider } from './providers/openai-filter.provider';

@Module({
  controllers: [FilterGenerationController],
  providers: [InternalApiKeyGuard, FilterGenerationService, OpenAiFilterProvider],
})
export class FilterGenerationModule {}
