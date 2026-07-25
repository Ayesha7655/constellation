import { Body, Controller, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { API_ERROR_CODES, ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { GenerateProposalFromJobUrlDto } from './dto/generate-proposal-from-job-url.dto';
import { ProposalsService } from './proposals.service';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/freelancer-profiles/:profileId/proposal-draft')
@UseGuards(JwtAuthGuard)
export class ProposalDraftFromJobUrlController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post('generate-from-job-url')
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Generate a proposal from an Upwork job URL (extension job page)',
    ok: { schema: { example: { draft: { body: '…', source: 'extension_job_page' } } } },
    validation: true,
    notFound: {
      codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND, API_ERROR_CODES.UPWORK_JOB_NOT_IN_LIBRARY],
    },
    badRequest: {
      codes: [API_ERROR_CODES.PROPOSAL_INVALID_JOB_URL, API_ERROR_CODES.PROPOSAL_GENERATE_FAILED],
    },
  })
  generateFromJobUrl(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: GenerateProposalFromJobUrlDto,
  ) {
    return this.proposalsService.generateDraftFromJobUrl(request.user?.sub, profileId, dto);
  }
}
