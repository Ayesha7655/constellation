import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { GenerateUpworkFiltersResponse } from '@constellation/shared';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';
import { GenerateFiltersDto } from './dto/generate-filters.dto';
import { FilterGenerationService } from './filter-generation.service';

@Controller('v1')
@UseGuards(InternalApiKeyGuard)
export class FilterGenerationController {
  constructor(private readonly filterGenerationService: FilterGenerationService) {}

  @Post('generate-filters')
  generateFilters(@Body() dto: GenerateFiltersDto): Promise<GenerateUpworkFiltersResponse> {
    return this.filterGenerationService.generate(dto.profile);
  }
}
