import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { API_ERROR_CODES, ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { CreateProposalExampleDto, UpdateProposalExampleDto } from './dto/proposal-example.dto';
import { ProposalsService } from './proposals.service';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/freelancer-profiles/:profileId/proposal-examples')
@UseGuards(JwtAuthGuard)
export class ProposalExamplesController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @RequirePermissions(ORG.PROPOSALS_READ)
  @ApiJwtProtectedRoute({
    summary: 'List proposal examples for a freelancer profile',
    ok: { schema: { example: { examples: [] } } },
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
  })
  listExamples(@Req() request: LocaleAwareRequest, @Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.proposalsService.listExamples(request.user?.sub, profileId);
  }

  @Post()
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Add a proposal example',
    ok: { schema: { example: { example: { id: '…' } } } },
    validation: true,
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
  })
  createExample(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: CreateProposalExampleDto,
  ) {
    return this.proposalsService.createExample(request.user?.sub, profileId, dto);
  }

  @Patch(':exampleId')
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Update a proposal example',
    ok: { schema: { example: { example: { id: '…' } } } },
    validation: true,
    notFound: {
      codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND, API_ERROR_CODES.PROPOSAL_EXAMPLE_NOT_FOUND],
    },
  })
  updateExample(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('exampleId', ParseUUIDPipe) exampleId: string,
    @Body() dto: UpdateProposalExampleDto,
  ) {
    return this.proposalsService.updateExample(request.user?.sub, profileId, exampleId, dto);
  }

  @Delete(':exampleId')
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Delete a proposal example',
    ok: { schema: { example: { ok: true } } },
    notFound: {
      codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND, API_ERROR_CODES.PROPOSAL_EXAMPLE_NOT_FOUND],
    },
  })
  deleteExample(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('exampleId', ParseUUIDPipe) exampleId: string,
  ) {
    return this.proposalsService.deleteExample(request.user?.sub, profileId, exampleId);
  }
}
