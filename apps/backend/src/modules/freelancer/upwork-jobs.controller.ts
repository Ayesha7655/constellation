import { Controller, Get, Param, ParseUUIDPipe, Query, Req, UseGuards } from '@nestjs/common';
import { API_ERROR_CODES, ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { ListUpworkJobsQueryDto } from './dto/list-upwork-jobs-query.dto';
import { UpworkJobsService } from './upwork-jobs.service';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/freelancer-profiles/:profileId/upwork-jobs')
@UseGuards(JwtAuthGuard)
export class UpworkJobsController {
  constructor(private readonly upworkJobsService: UpworkJobsService) {}

  @Get()
  @RequirePermissions(ORG.UPWORK_JOBS_READ)
  @ApiJwtProtectedRoute({
    summary: 'List scored Upwork jobs for a freelancer profile',
    ok: {
      schema: {
        example: {
          items: [{ title: 'NestJS API', relevancyScore: 82, jobUrl: 'https://www.upwork.com/jobs/…' }],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    },
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
    validation: true,
  })
  listJobs(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() query: ListUpworkJobsQueryDto,
  ) {
    return this.upworkJobsService.listJobs(request.user?.sub, profileId, query);
  }

  @Get(':jobId')
  @RequirePermissions(ORG.UPWORK_JOBS_READ)
  @ApiJwtProtectedRoute({
    summary: 'Get a scored Upwork job for a freelancer profile',
    ok: {
      schema: {
        example: {
          id: '00000000-0000-0000-0000-000000000001',
          title: 'NestJS API',
          relevancyScore: 82,
          jobUrl: 'https://www.upwork.com/jobs/…',
        },
      },
    },
    notFound: {
      codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND, API_ERROR_CODES.UPWORK_JOB_NOT_FOUND],
    },
  })
  getJob(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.upworkJobsService.getJob(request.user?.sub, profileId, jobId);
  }
}
