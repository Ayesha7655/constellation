import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { SearchFiltersService } from './search-filters.service';
import { UpdateSearchFiltersDto } from './dto/update-search-filters.dto';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/search-filters')
@UseGuards(JwtAuthGuard)
export class SearchFiltersController {
  constructor(private readonly searchFiltersService: SearchFiltersService) {}

  @Get()
  @RequirePermissions(ORG.SEARCH_FILTERS_READ)
  @ApiJwtProtectedRoute({
    summary: 'Get saved Apify search filters for the organization',
    ok: { schema: { example: { actorId: 'blackfalcondata/upwork-scraper', filters: null } } },
  })
  getFilters(@Req() request: LocaleAwareRequest) {
    return this.searchFiltersService.getFilters(request.user?.sub);
  }

  @Put()
  @RequirePermissions(ORG.SEARCH_FILTERS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Save Apify search filters (manual edit)',
    ok: { schema: { example: { filters: { query: 'nestjs', maxResults: 50 } } } },
    validation: true,
  })
  saveFilters(@Req() request: LocaleAwareRequest, @Body() dto: UpdateSearchFiltersDto) {
    return this.searchFiltersService.saveFilters(request.user?.sub, dto);
  }

  @Post('generate')
  @RequirePermissions(ORG.SEARCH_FILTERS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Generate Apify filters from org freelancer profile via filter-ai',
    ok: { schema: { example: { provenance: 'ai', filters: { query: 'react developer' } } } },
  })
  generateFilters(@Req() request: LocaleAwareRequest) {
    return this.searchFiltersService.generateFilters(request.user?.sub);
  }
}
