import { Body, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import type { AuthenticatedRequest } from '../../common/types/request.types';
import { ApiBadRequest } from '../../swagger/api-responses';
import {
  ApiFirebaseLoginRoute,
  ApiJwtProtectedRoute,
  ApiPublicRoute,
  ApiPublicWriteRoute,
} from '../../swagger/api-routes';
import { AuthService } from './auth.service';
import { AuthCodeResponseDto } from './dto/auth-code-response.dto';
import { LogoutResponseDto, PublicAuthTokensDto, RefreshAccessTokenResponseDto } from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentSessionListDto } from './dto/current-session-list.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RevokeSessionsDto } from './dto/revoke-sessions.dto';
import { RevokeSessionsResponseDto } from './dto/revoke-sessions-response.dto';
import { SendVerificationDto } from './dto/send-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('firebase')
  @Public()
  @ApiFirebaseLoginRoute({ summary: 'Exchange Firebase ID token for JWTs', ok: { type: PublicAuthTokensDto } })
  firebaseAuth(
    @Req() request: AuthenticatedRequest,
    @Headers('x-device-id') deviceId: string | undefined,
    @Body() dto: FirebaseLoginDto,
  ) {
    return this.authService.authenticateWithFirebase(dto, request, deviceId);
  }

  @Post('refresh')
  @Public()
  @ApiPublicRoute({
    summary: 'Refresh access token',
    ok: { type: RefreshAccessTokenResponseDto },
    unauthorized: 'Invalid or expired refresh token',
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Post('logout')
  @Public()
  @ApiPublicRoute({
    summary: 'Logout and revoke session (uses refresh token; optional Bearer if still valid)',
    ok: { type: LogoutResponseDto },
  })
  logout(@Headers('authorization') authorization: string | undefined, @Body() dto: LogoutDto) {
    return this.authService.logout(dto, authorization);
  }

  @Post('forgot-password')
  @Public()
  @ApiPublicWriteRoute({ summary: 'Request a password reset email', ok: { type: AuthCodeResponseDto } })
  forgotPassword(@Req() request: AuthenticatedRequest, @Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email, request.ip);
  }

  @Post('reset-password')
  @Public()
  @ApiPublicWriteRoute({
    summary: 'Complete password reset with email link code',
    ok: { type: AuthCodeResponseDto },
  })
  resetPassword(@Req() request: AuthenticatedRequest, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.oobCode, dto.password, request.ip);
  }

  @Post('send-verification')
  @Public()
  @ApiPublicWriteRoute({ summary: 'Send email verification link via Resend', ok: { type: AuthCodeResponseDto } })
  sendVerification(@Req() request: AuthenticatedRequest, @Body() dto: SendVerificationDto) {
    return this.authService.sendVerificationEmail(dto.email, request.ip);
  }

  @Post('verify-email')
  @Public()
  @ApiPublicWriteRoute({
    summary: 'Verify email using link code from Resend email',
    ok: { type: AuthCodeResponseDto },
  })
  verifyEmail(@Req() request: AuthenticatedRequest, @Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.oobCode, request.ip, dto.email);
  }

  @Post('change-password')
  @ApiBearerAuth('access-token')
  @ApiJwtProtectedRoute({
    summary: 'Change the authenticated user password',
    ok: { type: AuthCodeResponseDto },
    notFoundUser: true,
  })
  @ApiBadRequest('Current password is incorrect, or password change is unavailable for this account')
  changePassword(@Req() request: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword({
      userId: request.user?.sub,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }

  @Get('sessions')
  @ApiBearerAuth('access-token')
  @ApiJwtProtectedRoute({
    summary: 'List active sessions for the authenticated user',
    ok: { type: CurrentSessionListDto },
  })
  listSessions(@Req() request: AuthenticatedRequest) {
    return this.authService.listSessions({ userId: request.user?.sub, currentSessionId: request.user?.sid });
  }

  @Post('sessions/revoke')
  @ApiBearerAuth('access-token')
  @ApiJwtProtectedRoute({
    summary: 'Revoke selected sessions (the current session is preserved)',
    ok: { type: RevokeSessionsResponseDto },
  })
  @ApiBadRequest('Invalid or empty session selection')
  revokeSessions(@Req() request: AuthenticatedRequest, @Body() dto: RevokeSessionsDto) {
    return this.authService.revokeSessions({
      userId: request.user?.sub,
      currentSessionId: request.user?.sid,
      sessionIds: dto.sessionIds,
    });
  }
}
