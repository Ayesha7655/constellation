import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { API_ERROR_CODES, ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { SearchFiltersService } from './search-filters.service';
import { UpdateSearchFiltersDto } from './dto/update-search-filters.dto';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/freelancer-profiles/:profileId/search-filters')
@UseGuards(JwtAuthGuard)
export class SearchFiltersController {
  constructor(private readonly searchFiltersService: SearchFiltersService) {}

  @Get()
  @RequirePermissions(ORG.SEARCH_FILTERS_READ)
  @ApiJwtProtectedRoute({
    summary: 'Get saved Apify search filters for a freelancer profile',
    ok: { schema: { example: { actorId: 'XYTgO05GT5qAoSlxy', filters: null } } },
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
  })
  getFilters(@Req() request: LocaleAwareRequest, @Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.searchFiltersService.getFilters(request.user?.sub, profileId);
  }

  @Put()
  @RequirePermissions(ORG.SEARCH_FILTERS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Save Apify search filters for a freelancer profile',
    ok: { schema: { example: { filters: { queries: ['nestjs developer'], item_limit: 50, job_posted: 48 } } } },
    validation: true,
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
  })
  saveFilters(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: UpdateSearchFiltersDto,
  ) {
    return this.searchFiltersService.saveFilters(request.user?.sub, profileId, dto);
  }

  @Post('generate')
  @RequirePermissions(ORG.SEARCH_FILTERS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Generate Apify filters from a freelancer profile via filter-ai',
    ok: {
      schema: {
        example: { provenance: 'ai', filters: { queries: ['react developer'], item_limit: 50, job_posted: 48 } },
      },
    },
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
    badRequest: { codes: [API_ERROR_CODES.SEARCH_FILTERS_GENERATE_FAILED] },
  })
  generateFilters(@Req() request: LocaleAwareRequest, @Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.searchFiltersService.generateFilters(request.user?.sub, profileId);
  }
}
