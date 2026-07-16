import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { UpworkOverviewService } from './upwork-overview.service';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/upwork')
@UseGuards(JwtAuthGuard)
export class UpworkOverviewController {
  constructor(private readonly upworkOverviewService: UpworkOverviewService) {}

  @Get('overview')
  @RequirePermissions(ORG.FREELANCER_PROFILE_READ)
  @ApiJwtProtectedRoute({
    summary: 'Org Upwork dashboard overview (extension state, profiles, recent jobs)',
    ok: {
      schema: {
        example: {
          extensionConnected: false,
          profiles: [],
          recentJobs: [],
          pendingDraft: null,
        },
      },
    },
  })
  getOverview(@Req() request: LocaleAwareRequest) {
    return this.upworkOverviewService.getOverview(request.user?.sub);
  }

  @Post('extension/mark-connected')
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Mark the Chrome extension as connected for this organization',
    ok: { schema: { example: { ok: true, extensionConnected: true } } },
  })
  markConnected(@Req() request: LocaleAwareRequest) {
    return this.upworkOverviewService.markExtensionConnected(request.user?.sub);
  }
}
