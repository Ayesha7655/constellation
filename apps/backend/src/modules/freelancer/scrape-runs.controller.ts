import { Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { API_ERROR_CODES, ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { ScrapeRunsService } from './scrape-runs.service';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/freelancer-profiles/:profileId/scrape-runs')
@UseGuards(JwtAuthGuard)
export class ScrapeRunsController {
  constructor(private readonly scrapeRunsService: ScrapeRunsService) {}

  @Post()
  @RequirePermissions(ORG.SCRAPE_RUNS_CREATE)
  @ApiJwtProtectedRoute({
    summary: 'Start an Apify Upwork job scrape for a freelancer profile (Run now)',
    ok: {
      schema: {
        example: {
          id: '00000000-0000-0000-0000-000000000001',
          status: 'queued',
          trigger: 'manual',
        },
      },
    },
    notFound: {
      codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND, API_ERROR_CODES.SEARCH_FILTERS_NOT_FOUND],
    },
    badRequest: {
      codes: [
        API_ERROR_CODES.SEARCH_FILTERS_QUERIES_REQUIRED,
        API_ERROR_CODES.SCRAPE_RUN_APIFY_NOT_CONFIGURED,
        API_ERROR_CODES.SCRAPE_RUN_APIFY_FAILED,
      ],
    },
    conflict: { codes: [API_ERROR_CODES.SCRAPE_RUN_ALREADY_ACTIVE] },
  })
  createRun(@Req() request: LocaleAwareRequest, @Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.scrapeRunsService.createRun(request.user?.sub, profileId);
  }

  @Get()
  @RequirePermissions(ORG.SCRAPE_RUNS_READ)
  @ApiJwtProtectedRoute({
    summary: 'List recent scrape runs for a freelancer profile',
    ok: { schema: { example: { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } } } },
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
    validation: true,
  })
  listRuns(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.scrapeRunsService.listRuns(request.user?.sub, profileId, query);
  }

  @Get(':runId')
  @RequirePermissions(ORG.SCRAPE_RUNS_READ)
  @ApiJwtProtectedRoute({
    summary: 'Get scrape run status for a freelancer profile',
    ok: { schema: { example: { id: '…', status: 'running' } } },
    notFound: {
      codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND, API_ERROR_CODES.SCRAPE_RUN_NOT_FOUND],
    },
  })
  getRun(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('runId', ParseUUIDPipe) runId: string,
  ) {
    return this.scrapeRunsService.getRun(request.user?.sub, profileId, runId);
  }
}
