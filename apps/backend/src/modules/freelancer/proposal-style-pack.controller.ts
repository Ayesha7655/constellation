import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { API_ERROR_CODES, ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { UpsertProposalStylePackDto } from './dto/upsert-proposal-style-pack.dto';
import { ProposalsService } from './proposals.service';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/freelancer-profiles/:profileId/proposal-style-pack')
@UseGuards(JwtAuthGuard)
export class ProposalStylePackController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @RequirePermissions(ORG.PROPOSALS_READ)
  @ApiJwtProtectedRoute({
    summary: 'Get proposal style pack for a freelancer profile',
    ok: { schema: { example: { preferences: { tone: 'direct' }, updatedAt: null } } },
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
  })
  getStylePack(@Req() request: LocaleAwareRequest, @Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.proposalsService.getStylePack(request.user?.sub, profileId);
  }

  @Put()
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Upsert proposal style pack for a freelancer profile',
    ok: { schema: { example: { preferences: { tone: 'direct' } } } },
    validation: true,
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
  })
  upsertStylePack(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: UpsertProposalStylePackDto,
  ) {
    return this.proposalsService.upsertStylePack(request.user?.sub, profileId, dto);
  }

  @Post('extract-from-examples')
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Build/update style pack by analyzing uploaded proposal examples',
    ok: { schema: { example: { preferences: { tone: 'Friendly and professional' } } } },
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
    badRequest: {
      codes: [API_ERROR_CODES.PROPOSAL_EXAMPLES_REQUIRED, API_ERROR_CODES.PROPOSAL_STYLE_EXTRACT_FAILED],
    },
  })
  extractFromExamples(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    return this.proposalsService.extractStylePackFromExamples(request.user?.sub, profileId);
  }
}
