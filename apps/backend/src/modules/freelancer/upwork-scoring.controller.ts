import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { API_ERROR_CODES, DEFAULT_UPWORK_SCORING_CONFIG, ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequireAnyPermissions } from '../../common/permissions/require-any-permissions.decorator';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { UpdateUpworkScoringConfigDto } from './dto/update-upwork-scoring-config.dto';
import { UpworkScoringService } from './upwork-scoring.service';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/upwork/scoring')
@UseGuards(JwtAuthGuard)
export class UpworkScoringController {
  constructor(private readonly upworkScoringService: UpworkScoringService) {}

  @Get()
  @RequireAnyPermissions(ORG.UPWORK_SCORING_READ, ORG.UPWORK_JOBS_READ)
  @ApiJwtProtectedRoute({
    summary: 'Get org Upwork relevancy scoring weights and color thresholds',
    ok: { schema: { example: DEFAULT_UPWORK_SCORING_CONFIG } },
  })
  getConfig(@Req() request: LocaleAwareRequest) {
    return this.upworkScoringService.getConfig(request.user?.sub);
  }

  @Put()
  @RequirePermissions(ORG.UPWORK_SCORING_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Update org Upwork relevancy scoring weights and color thresholds',
    ok: { schema: { example: DEFAULT_UPWORK_SCORING_CONFIG } },
    validation: true,
    badRequest: {
      codes: [
        API_ERROR_CODES.UPWORK_SCORING_WEIGHTS_INVALID,
        API_ERROR_CODES.UPWORK_SCORING_THRESHOLDS_INVALID,
      ],
    },
  })
  updateConfig(@Req() request: LocaleAwareRequest, @Body() dto: UpdateUpworkScoringConfigDto) {
    return this.upworkScoringService.updateConfig(request.user?.sub, dto);
  }

  @Put('reset')
  @RequirePermissions(ORG.UPWORK_SCORING_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Reset org Upwork scoring config to defaults',
    ok: { schema: { example: DEFAULT_UPWORK_SCORING_CONFIG } },
  })
  resetConfig(@Req() request: LocaleAwareRequest) {
    return this.upworkScoringService.resetConfig(request.user?.sub);
  }
}
