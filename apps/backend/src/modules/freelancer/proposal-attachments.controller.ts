import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
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
import {
  AttachProposalStorageKeyDto,
  RevertProposalAttachmentsDto,
  UploadProposalAttachmentDto,
} from './dto/proposal-attachment.dto';
import { ProposalsService } from './proposals.service';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/freelancer-profiles/:profileId')
@UseGuards(JwtAuthGuard)
export class ProposalAttachmentsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post('proposal-attachments/upload')
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Upload a proposal document (returns a storage key to attach later)',
    ok: {
      schema: {
        example: {
          storageKey: 'constellation/proposal-attachments/2026/07/18/…pdf',
          fileName: 'portfolio.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12345,
        },
      },
    },
    validation: true,
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
    badRequest: {
      codes: [
        API_ERROR_CODES.PROPOSAL_ATTACHMENT_INVALID,
        API_ERROR_CODES.PROPOSAL_ATTACHMENT_TOO_LARGE,
        API_ERROR_CODES.PROPOSAL_ATTACHMENT_TYPE,
        API_ERROR_CODES.PROPOSAL_ATTACHMENT_UPLOAD_FAILED,
      ],
    },
  })
  uploadAttachment(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: UploadProposalAttachmentDto,
  ) {
    return this.proposalsService.uploadAttachment(request.user?.sub, profileId, dto);
  }

  @Post('proposal-attachments/revert')
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Revert orphan proposal attachment uploads',
    ok: { schema: { example: { ok: true } } },
    validation: true,
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
  })
  revertAttachments(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: RevertProposalAttachmentsDto,
  ) {
    return this.proposalsService.revertAttachmentUploads(request.user?.sub, profileId, dto.keys);
  }

  @Delete('proposal-attachments/:attachmentId')
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Delete a proposal attachment',
    ok: { schema: { example: { ok: true } } },
    notFound: {
      codes: [
        API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND,
        API_ERROR_CODES.PROPOSAL_ATTACHMENT_NOT_FOUND,
      ],
    },
  })
  deleteAttachment(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    return this.proposalsService.deleteAttachment(request.user?.sub, profileId, attachmentId);
  }

  @Post('proposal-examples/:exampleId/attachments')
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Attach a previously uploaded document to a proposal example',
    ok: { schema: { example: { attachment: { id: '…' } } } },
    validation: true,
    notFound: {
      codes: [
        API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND,
        API_ERROR_CODES.PROPOSAL_EXAMPLE_NOT_FOUND,
      ],
    },
    badRequest: {
      codes: [
        API_ERROR_CODES.PROPOSAL_ATTACHMENT_INVALID,
        API_ERROR_CODES.PROPOSAL_ATTACHMENT_LIMIT,
      ],
    },
  })
  attachToExample(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('exampleId', ParseUUIDPipe) exampleId: string,
    @Body() dto: AttachProposalStorageKeyDto,
  ) {
    return this.proposalsService.attachToExample(request.user?.sub, profileId, exampleId, dto.storageKey);
  }

  @Post('upwork-jobs/:jobId/proposal-draft/attachments')
  @RequirePermissions(ORG.PROPOSALS_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Attach a previously uploaded document to a proposal draft',
    ok: { schema: { example: { attachment: { id: '…' }, draftId: '…' } } },
    validation: true,
    notFound: {
      codes: [
        API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND,
        API_ERROR_CODES.UPWORK_JOB_NOT_FOUND,
      ],
    },
    badRequest: {
      codes: [
        API_ERROR_CODES.PROPOSAL_ATTACHMENT_INVALID,
        API_ERROR_CODES.PROPOSAL_ATTACHMENT_LIMIT,
      ],
    },
  })
  attachToDraft(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: AttachProposalStorageKeyDto,
  ) {
    return this.proposalsService.attachToDraft(request.user?.sub, profileId, jobId, dto.storageKey);
  }
}
