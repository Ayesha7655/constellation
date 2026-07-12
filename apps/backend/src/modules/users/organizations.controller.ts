import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { OrganizationsService } from './organizations.service';

@ApiLocaleBearerController('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Patch('me')
  @RequirePermissions(ORG.PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Update current user organization profile',
    ok: {
      schema: {
        example: {
          orgId: '00000000-0000-4000-8000-000000000001',
          orgName: 'Acme Robotics',
          orgAddress: '123 Innovation Way',
        },
      },
    },
    notFoundUser: true,
  })
  updateOrgProfile(@Req() request: LocaleAwareRequest, @Body() dto: UpdateOrganizationProfileDto) {
    return this.organizationsService.updateOrgProfile(request.user?.sub, dto);
  }
}
