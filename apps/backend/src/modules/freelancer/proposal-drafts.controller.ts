import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { API_ERROR_CODES, ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { SaveProposalDraftDto } from './dto/save-proposal-draft.dto';
import { ProposalsService } from './proposals.service';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/freelancer-profiles/:profileId/upwork-jobs/:jobId/proposal-draft')
@UseGuards(JwtAuthGuard)
export class ProposalDraftsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @RequirePermissions(ORG.PROPOSALS_READ)
  @ApiJwtProtectedRoute({
    summary: 'Get proposal draft for a job + profile',
    ok: { schema: { example: { draft: null } } },
    notFound: {
      codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND, API_ERROR_CODES.UPWORK_JOB_NOT_FOUND],
    },
  })
  getDraft(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.proposalsService.getDraft(request.user?.sub, profileId, jobId);
  }

  @Post('generate')
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Generate a proposal draft for a job via the AI service',
    ok: { schema: { example: { draft: { body: '…', provenance: 'ai' } } } },
    notFound: {
      codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND, API_ERROR_CODES.UPWORK_JOB_NOT_FOUND],
    },
    badRequest: { codes: [API_ERROR_CODES.PROPOSAL_GENERATE_FAILED] },
  })
  generateDraft(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.proposalsService.generateDraft(request.user?.sub, profileId, jobId);
  }

  @Put()
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Save an edited proposal draft (optionally add to example library)',
    ok: { schema: { example: { draft: { status: 'saved' } } } },
    validation: true,
    notFound: {
      codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND, API_ERROR_CODES.UPWORK_JOB_NOT_FOUND],
    },
  })
  saveDraft(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: SaveProposalDraftDto,
  ) {
    return this.proposalsService.saveDraft(request.user?.sub, profileId, jobId, dto);
  }
}
