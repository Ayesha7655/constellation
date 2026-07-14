import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { FreelancerProfileService } from './freelancer-profile.service';
import { ImportFreelancerProfileDto } from './dto/import-freelancer-profile.dto';
import { UpdateFreelancerProfileDto } from './dto/update-freelancer-profile.dto';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/freelancer-profile')
@UseGuards(JwtAuthGuard)
export class FreelancerProfileController {
  constructor(private readonly freelancerProfileService: FreelancerProfileService) {}

  @Get()
  @RequirePermissions(ORG.FREELANCER_PROFILE_READ)
  @ApiJwtProtectedRoute({
    summary: 'Get org Upwork freelancer profile (+ pending import draft)',
    ok: { schema: { example: { profile: null, pendingDraft: null } } },
  })
  getProfile(@Req() request: LocaleAwareRequest) {
    return this.freelancerProfileService.getProfile(request.user?.sub);
  }

  @Patch()
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Create or update org Upwork freelancer profile',
    ok: { schema: { example: { profile: { id: '…', title: 'Full-stack engineer' } } } },
    validation: true,
  })
  updateProfile(@Req() request: LocaleAwareRequest, @Body() dto: UpdateFreelancerProfileDto) {
    return this.freelancerProfileService.updateProfile(request.user?.sub, dto);
  }

  @Post('import')
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Import profile draft from Chrome extension',
    ok: { schema: { example: { draft: { id: '…', expiresAt: '…' } } } },
    validation: true,
  })
  importDraft(@Req() request: LocaleAwareRequest, @Body() dto: ImportFreelancerProfileDto) {
    return this.freelancerProfileService.importDraft(request.user?.sub, dto);
  }

  @Post('import/confirm')
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Confirm pending profile import draft into saved profile',
    ok: { schema: { example: { profile: { id: '…' } } } },
  })
  confirmImport(@Req() request: LocaleAwareRequest) {
    return this.freelancerProfileService.confirmImport(request.user?.sub);
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
}
