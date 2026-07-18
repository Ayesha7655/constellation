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
import { FreelancerProfileService } from './freelancer-profile.service';
import { ConfirmImportDto } from './dto/confirm-import.dto';
import { CreateFreelancerProfileDto } from './dto/create-freelancer-profile.dto';
import { ImportFreelancerProfileDto } from './dto/import-freelancer-profile.dto';
import { UpdateFreelancerProfileDto } from './dto/update-freelancer-profile.dto';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/freelancer-profiles')
@UseGuards(JwtAuthGuard)
export class FreelancerProfileController {
  constructor(private readonly freelancerProfileService: FreelancerProfileService) {}

  @Get()
  @RequirePermissions(ORG.FREELANCER_PROFILE_READ)
  @ApiJwtProtectedRoute({
    summary: 'List org Upwork freelancer profiles (+ pending import draft)',
    ok: { schema: { example: { profiles: [], pendingDraft: null } } },
  })
  listProfiles(@Req() request: LocaleAwareRequest) {
    return this.freelancerProfileService.listProfiles(request.user?.sub);
  }

  @Post()
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Create a new Upwork freelancer profile for the org',
    ok: { schema: { example: { profile: { id: '…', label: 'Main' } } } },
    validation: true,
  })
  createProfile(@Req() request: LocaleAwareRequest, @Body() dto: CreateFreelancerProfileDto) {
    return this.freelancerProfileService.createProfile(request.user?.sub, dto);
  }

  @Post('import')
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Import profile draft from Chrome extension (create or update match)',
    ok: {
      schema: {
        example: {
          draft: { id: '…', expiresAt: '…', payload: { targetProfileId: null, matchReason: null } },
          targetProfileId: null,
          matchReason: null,
        },
      },
    },
    validation: true,
    badRequest: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_IMPORT_INVALID] },
  })
  importDraft(@Req() request: LocaleAwareRequest, @Body() dto: ImportFreelancerProfileDto) {
    return this.freelancerProfileService.importDraft(request.user?.sub, dto);
  }

  @Post('import/confirm')
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Confirm pending draft — update matched profile or create new',
    ok: { schema: { example: { profile: { id: '…' } } } },
    validation: true,
    notFound: {
      codes: [
        API_ERROR_CODES.FREELANCER_PROFILE_DRAFT_NOT_FOUND,
        API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND,
      ],
    },
  })
  confirmImport(@Req() request: LocaleAwareRequest, @Body() dto: ConfirmImportDto) {
    return this.freelancerProfileService.confirmImport(request.user?.sub, dto);
  }

  @Delete('import')
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Discard pending profile import draft',
    ok: { schema: { example: { ok: true } } },
  })
  discardImport(@Req() request: LocaleAwareRequest) {
    return this.freelancerProfileService.discardImport(request.user?.sub);
  }

  @Get(':profileId')
  @RequirePermissions(ORG.FREELANCER_PROFILE_READ)
  @ApiJwtProtectedRoute({
    summary: 'Get one org Upwork freelancer profile',
    ok: { schema: { example: { profile: { id: '…' } } } },
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
  })
  getProfile(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    return this.freelancerProfileService.getProfile(request.user?.sub, profileId);
  }

  @Patch(':profileId')
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Update an org Upwork freelancer profile',
    ok: { schema: { example: { profile: { id: '…' } } } },
    validation: true,
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
  })
  updateProfile(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: UpdateFreelancerProfileDto,
  ) {
    return this.freelancerProfileService.updateProfile(request.user?.sub, profileId, dto);
  }

  @Delete(':profileId')
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Delete an org Upwork freelancer profile',
    ok: { schema: { example: { ok: true } } },
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
  })
  deleteProfile(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    return this.freelancerProfileService.deleteProfile(request.user?.sub, profileId);
  }
}
