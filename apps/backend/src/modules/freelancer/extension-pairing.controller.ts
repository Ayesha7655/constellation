import { BadRequestException, Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ORG } from '@constellation/shared';
import { Public } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { AuthenticatedRequest, LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiDeviceBoundPublicRoute, ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { PublicAuthTokensDto } from '../auth/dto/auth-response.dto';
import { ExtensionPairingService } from './extension-pairing.service';
import { ExchangeExtensionPairingDto } from './dto/exchange-extension-pairing.dto';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me/extension')
@UseGuards(JwtAuthGuard)
export class ExtensionPairingController {
  constructor(private readonly extensionPairingService: ExtensionPairingService) {}

  @Post('pairing-code')
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Create a 6-digit Chrome extension pairing code (10 min TTL)',
    ok: { schema: { example: { code: '482910', expiresInSeconds: 600 } } },
  })
  createPairingCode(@Req() request: LocaleAwareRequest) {
    return this.extensionPairingService.createPairingCode(request.user?.sub);
  }
}

@ApiTags('extension')
@Controller('extension')
export class ExtensionPublicController {
  constructor(private readonly extensionPairingService: ExtensionPairingService) {}

  @Post('pair')
  @Public()
  @ApiDeviceBoundPublicRoute({
    summary: 'Exchange pairing code for JWT session (Chrome extension)',
    ok: { type: PublicAuthTokensDto },
    badRequest: 'Invalid or expired pairing code',
  })
  exchangePairingCode(
    @Req() request: AuthenticatedRequest,
    @Headers('x-device-id') deviceId: string | undefined,
    @Body() dto: ExchangeExtensionPairingDto,
  ) {
    const resolvedDeviceId = deviceId?.trim();
    if (!resolvedDeviceId) {
      throw new BadRequestException('Missing x-device-id header');
    }
    return this.extensionPairingService.exchangePairingCode({
      code: dto.code,
      deviceId: resolvedDeviceId,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }
}
