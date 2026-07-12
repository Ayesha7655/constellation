import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AUTH_ERROR_CODES, AUTH_RESULT_CODES, API_ERROR_CODES } from '@constellation/shared';
import { codedBadRequest, codedForbidden } from '../../common/exceptions/coded-http.exception';
import { requireAuthUserId } from '../../common/utils/require-auth-user-id';
import { resolveDashboardHomePath } from '../../common/utils/dashboard-path';
import { AuthActionRateLimitService } from '../../common/services/auth-action-rate-limit.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { AuthProvider, SessionPlatform, UserStatus } from '../../database/enums';
import { ORG_ADMIN_ROLE_KEY } from '../../common/permissions/role-permissions.catalog';
import {
  ROLE_KEY_ATTRS,
  USER_FIREBASE_UID_ATTRS,
  USER_ID_ATTRS,
  USER_LOGIN_LOOKUP_ATTRS,
  USER_CHANGE_PASSWORD_ATTRS,
  USER_SESSION_CREATE_ATTRS,
  USER_SESSION_REFRESH_ATTRS,
  USER_STATUS_ATTRS,
} from '../../database/attributes';
import { Role } from '../../database/models/role.model';
import { User } from '../../database/models/user.model';
import { EmailService } from '../email/email.service';
import { FirebaseService } from '../firebase/firebase.service';
import { mapFirebaseAuthProvider } from '../firebase/map-firebase-auth-provider';
import { SessionService } from '../session/session.service';
import { UsersService } from '../users/users.service';
import type { AuthenticatedRequest, JwtPayload } from '../../common/types/request.types';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { LogoutResult, PublicAuthTokens, RefreshAccessTokenResult } from './types/auth-api.types';
import { emailFromFirebaseToken } from './utils/firebase-token-email';
import { getPlatformFromUserAgent } from './utils/platform.util';
import { parseExpiresInSeconds } from './utils/jwt.util';

const DEFAULT_ROLE = ORG_ADMIN_ROLE_KEY;

type AuthTokenResult = Readonly<{
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  role: string;
  dashboardHomePath: string;
}>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    private readonly firebaseService: FirebaseService,
    private readonly emailService: EmailService,
    private readonly authActionRateLimit: AuthActionRateLimitService,
    private readonly sessionService: SessionService,
    private readonly usersService: UsersService,
  ) {}

  async requestPasswordReset(email: string, clientIp: string | undefined): Promise<{ code: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    this.assertAuthActionRateLimit('forgot-password', clientIp, normalizedEmail);

    try {
      const firebaseUser = await this.firebaseService.getUserByEmail(normalizedEmail);

      if (firebaseUser) {
        const hasPasswordProvider = firebaseUser.providerData.some((provider) => provider.providerId === 'password');
        if (hasPasswordProvider && !firebaseUser.disabled) {
          const resetLink = await this.firebaseService.generateAppActionLink(normalizedEmail, 'reset-password');
          await this.emailService.sendPasswordResetEmail({
            to: normalizedEmail,
            resetLink,
          });
        }
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error('requestPasswordReset failed', { email: normalizedEmail, error });
    }

    return { code: AUTH_RESULT_CODES.PASSWORD_RESET_ACK };
  }

  async resetPassword(oobCode: string, password: string, clientIp: string | undefined): Promise<{ code: string }> {
    this.assertAuthActionRateLimit('reset-password', clientIp, oobCode.slice(0, 32));
    const email = await this.firebaseService.confirmPasswordReset(oobCode, password);
    await this.revokeAllSessionsForEmail(email);
    return { code: AUTH_RESULT_CODES.RESET_PASSWORD_SUCCESS };
  }

  async changePassword(params: {
    userId: string | undefined;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ code: string }> {
    const userId = requireAuthUserId(params.userId);
    try {
      const user = await this.userModel.findOne({
        where: { id: userId, deletedAt: null },
        attributes: [...USER_CHANGE_PASSWORD_ATTRS],
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.authProvider !== AuthProvider.PASSWORD || !user.firebaseUid) {
        codedBadRequest(AUTH_ERROR_CODES.PASSWORD_CHANGE_UNAVAILABLE);
      }

      const verified = await this.firebaseService.verifyPassword(user.email, params.currentPassword);
      if (!verified) {
        codedBadRequest(AUTH_ERROR_CODES.CURRENT_PASSWORD_INCORRECT);
      }

      await this.firebaseService.updateUserPassword(user.firebaseUid, params.newPassword);
      return { code: AUTH_RESULT_CODES.PASSWORD_CHANGED };
    } catch (error) {
      const level = error instanceof HttpException && error.getStatus() < 500 ? 'warn' : 'error';
      this.logger[level](`[AuthService.changePassword] userId=${userId}: ${(error as Error).message}`);
      throw error;
    }
  }

  async listSessions(params: { userId: string | undefined; currentSessionId?: string }) {
    const userId = requireAuthUserId(params.userId);
    try {
      const rows = await this.sessionService.listActiveSessionsForUser(userId);
      return {
        sessions: rows.map((session) => ({
          id: session.id,
          deviceId: session.deviceId,
          platform: session.platform,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          lastActiveAt: session.lastActiveAt,
          isCurrent: session.id === params.currentSessionId,
        })),
      };
    } catch (error) {
      this.logger.error(`[AuthService.listSessions] userId=${userId}: ${(error as Error).message}`);
      throw error;
    }
  }

  async revokeSessions(params: {
    userId: string | undefined;
    currentSessionId?: string;
    sessionIds: string[];
  }): Promise<{ revokedCount: number; revokedAllOtherSessions: boolean; code: string }> {
    const userId = requireAuthUserId(params.userId);
    try {
      const user = await this.userModel.findOne({
        where: { id: userId, deletedAt: null },
        attributes: [...USER_FIREBASE_UID_ATTRS],
      });

      const { revokedCount, remainingOtherCount } = await this.sessionService.revokeSelectedSessions({
        userId,
        currentSessionId: params.currentSessionId,
        sessionIds: params.sessionIds,
      });

      const revokedAllOtherSessions = remainingOtherCount === 0;
      if (revokedAllOtherSessions && revokedCount > 0 && user?.firebaseUid) {
        await this.firebaseService.revokeRefreshTokens(user.firebaseUid);
      }

      return {
        revokedCount,
        revokedAllOtherSessions,
        code: revokedCount > 0 ? AUTH_RESULT_CODES.SESSIONS_REVOKED : AUTH_RESULT_CODES.SESSIONS_NONE_REVOKED,
      };
    } catch (error) {
      const level = error instanceof HttpException && error.getStatus() < 500 ? 'warn' : 'error';
      this.logger[level](`[AuthService.revokeSessions] userId=${userId}: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, clientIp: string | undefined): Promise<{ code: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    this.assertAuthActionRateLimit('send-verification', clientIp, normalizedEmail);

    try {
      const firebaseUser = await this.firebaseService.getUserByEmail(normalizedEmail);

      if (firebaseUser && !firebaseUser.emailVerified && !firebaseUser.disabled) {
        const verifyLink = await this.firebaseService.generateAppActionLink(normalizedEmail, 'verify-email');
        await this.emailService.sendEmailVerificationEmail({
          to: normalizedEmail,
          verifyLink,
        });
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error('sendVerificationEmail failed', { email: normalizedEmail, error });
    }

    return { code: AUTH_RESULT_CODES.VERIFICATION_EMAIL_ACK };
  }

  async verifyEmail(oobCode: string, clientIp: string | undefined, emailHint?: string): Promise<{ code: string }> {
    this.assertAuthActionRateLimit('verify-email', clientIp, oobCode.slice(0, 32));

    const normalizedHint = emailHint?.trim().toLowerCase();

    try {
      const verifiedEmail = await this.firebaseService.applyEmailVerificationOobCode(oobCode);
      await this.syncEmailVerifiedAt(verifiedEmail);
      return { code: AUTH_RESULT_CODES.VERIFY_EMAIL_SUCCESS };
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        normalizedHint &&
        (await this.firebaseService.isEmailVerifiedInFirebase(normalizedHint))
      ) {
        await this.syncEmailVerifiedAt(normalizedHint);
        return { code: AUTH_RESULT_CODES.VERIFY_EMAIL_SUCCESS };
      }
      throw error;
    }
  }

  private assertAuthActionRateLimit(scope: string, clientIp: string | undefined, identifier: string): void {
    const ip = clientIp?.trim() || 'unknown';
    this.authActionRateLimit.assertWithinLimit(`${scope}:ip`, ip);
    this.authActionRateLimit.assertWithinLimit(`${scope}:id`, identifier);
  }

  private async syncEmailVerifiedAt(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    await this.userModel.update(
      { emailVerifiedAt: new Date() },
      {
        where: {
          email: normalizedEmail,
          deletedAt: null,
          emailVerifiedAt: null,
        },
      },
    );
  }

  private async revokeAllSessionsForEmail(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const firebaseUser = await this.firebaseService.getUserByEmail(normalizedEmail);

    const user =
      (await this.userModel.findOne({
        where: { email: normalizedEmail },
        attributes: [...USER_ID_ATTRS],
      })) ??
      (firebaseUser
        ? await this.userModel.findOne({
            where: { firebaseUid: firebaseUser.uid },
            attributes: [...USER_ID_ATTRS],
          })
        : null);

    if (user) {
      await this.sessionService.revokeAllUserSessions({ userId: user.id });
    }

    if (firebaseUser) {
      await this.firebaseService.revokeRefreshTokens(firebaseUser.uid);
    } else if (!user) {
      this.logger.warn('Password reset succeeded but no user found for session revocation', {
        email: normalizedEmail,
      });
    }
  }

  async authenticateWithFirebase(
    dto: FirebaseLoginDto,
    request: AuthenticatedRequest,
    deviceIdHeader: string | undefined,
  ): Promise<PublicAuthTokens> {
    const deviceId = deviceIdHeader?.trim();
    if (!deviceId) {
      throw new BadRequestException('Missing x-device-id header');
    }
    const userAgent = request.header('user-agent') ?? '';
    const result = await this.loginWithFirebase({
      idToken: dto.idToken,
      name: dto.name,
      ipAddress: request.ip,
      userAgent,
      deviceId,
      platform: getPlatformFromUserAgent(userAgent),
    });
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      role: result.role,
      dashboardHomePath: result.dashboardHomePath,
    };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<RefreshAccessTokenResult> {
    return this.refreshAccessToken(dto.refreshToken);
  }

  async logout(dto: LogoutDto, authorizationHeader?: string): Promise<LogoutResult> {
    const sessionIdFromAccess = await this.tryGetSessionIdFromAccessHeader(authorizationHeader);
    await this.logoutUser({
      refreshToken: dto.refreshToken,
      sessionId: sessionIdFromAccess,
    });
    return { message: 'Logged out' };
  }

  async loginWithFirebase(params: {
    idToken: string;
    role?: string;
    name?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceId: string;
    platform: SessionPlatform;
  }): Promise<AuthTokenResult> {
    const decoded = await this.firebaseService.verifyIdToken(params.idToken);
    const firebaseUid = decoded.uid;
    const signInProvider = this.readStringClaim(decoded.firebase?.sign_in_provider) ?? 'password';
    const authProvider = mapFirebaseAuthProvider(signInProvider);

    let email = emailFromFirebaseToken(decoded);
    if (!email) {
      email = await this.firebaseService.resolveUserEmail(firebaseUid);
    }

    const requestedRole = params.role ?? DEFAULT_ROLE;
    const displayName =
      params.name?.trim() || this.readStringClaim(decoded.name) || this.readStringClaim(decoded.display_name) || '';
    const photoUrl = this.readStringClaim(decoded.picture) ?? null;
    const emailVerified = decoded.email_verified === true || authProvider === AuthProvider.GOOGLE;

    if (!email) {
      throw new BadRequestException('Firebase account has no email');
    }

    if (authProvider === AuthProvider.PASSWORD && !emailVerified) {
      throw new ForbiddenException('Please verify your email, then sign in.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailLocalPart = normalizedEmail.split('@')[0] || 'User';

    const activeUserWhere = {
      deletedAt: null,
      status: { [Op.notIn]: [UserStatus.DELETED, UserStatus.DEACTIVATED] },
    };

    let user = await this.userModel.findOne({
      where: { ...activeUserWhere, firebaseUid },
      attributes: [...USER_LOGIN_LOOKUP_ATTRS],
      include: [{ model: Role, as: 'primaryRole', attributes: [...ROLE_KEY_ATTRS] }],
    });

    if (!user) {
      user = await this.userModel.findOne({
        where: { ...activeUserWhere, email: normalizedEmail },
        attributes: [...USER_LOGIN_LOOKUP_ATTRS],
        include: [{ model: Role, as: 'primaryRole', attributes: [...ROLE_KEY_ATTRS] }],
      });
    }

    if (user) {
      if (user.status === UserStatus.SUSPENDED) {
        throw new ForbiddenException('Account suspended');
      }
      const currentRoleKey = user.primaryRole?.key;
      if (!currentRoleKey) {
        throw new BadRequestException('Account role is not configured. Please contact support.');
      }
      await this.userModel.update(
        {
          firebaseUid: user.firebaseUid ?? firebaseUid,
          authProvider,
          lastLoginAt: new Date(),
          ...(photoUrl && !user.photoUrl ? { photoUrl } : {}),
          ...(emailVerified && !user.emailVerifiedAt ? { emailVerifiedAt: new Date() } : {}),
        },
        { where: { id: user.id } },
      );
    } else {
      await this.rejectInactiveUserLogin({ firebaseUid, email: normalizedEmail });

      const role = await this.roleModel.findByPk(requestedRole, {
        attributes: [...ROLE_KEY_ATTRS],
      });
      if (!role) {
        await this.safeDeleteFirebaseUser(firebaseUid, 'missing role on signup');
        throw new BadRequestException(`Role ${requestedRole} not found`);
      }

      try {
        user = await this.usersService.createUserWithOrg({
          name: displayName || emailLocalPart,
          email: normalizedEmail,
          firebaseUid,
          authProvider,
          photoUrl,
          roleKey: role.key,
          ...(emailVerified ? { emailVerifiedAt: new Date() } : {}),
        });
      } catch (err) {
        const sequelizeError = err as { name?: string; parent?: { code?: string } };
        if (sequelizeError.name === 'SequelizeUniqueConstraintError' || sequelizeError.parent?.code === '23505') {
          const existing = await this.userModel.findOne({
            where: {
              ...activeUserWhere,
              [Op.or]: [{ firebaseUid }, { email: normalizedEmail }],
            },
            attributes: [...USER_LOGIN_LOOKUP_ATTRS],
            include: [{ model: Role, as: 'primaryRole', attributes: [...ROLE_KEY_ATTRS] }],
          });
          if (!existing) {
            await this.rejectInactiveUserLogin({ firebaseUid, email: normalizedEmail });
            throw new ConflictException('Email already registered');
          }
          user = existing;
          await this.userModel.update(
            {
              firebaseUid: user.firebaseUid ?? firebaseUid,
              authProvider,
              lastLoginAt: new Date(),
            },
            { where: { id: user.id } },
          );
        } else {
          await this.safeDeleteFirebaseUser(firebaseUid, 'signup rollback');
          throw err;
        }
      }
    }

    return this.createSessionAndTokensForUser({
      userId: user.id,
      email: normalizedEmail,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      deviceId: params.deviceId,
      platform: params.platform,
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    const secret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
    const issuer = this.configService.get<string>('JWT_ISSUER');
    const audience = this.configService.get<string>('JWT_AUDIENCE');

    let payload: Record<string, unknown>;
    try {
      payload = await this.jwtService.verifyAsync<Record<string, unknown>>(refreshToken, { secret, issuer, audience });
    } catch (error) {
      this.logger.debug('Refresh token verification failed', error);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const sessionId = typeof payload.sid === 'string' ? payload.sid : undefined;
    const userId = typeof payload.sub === 'string' ? payload.sub : undefined;
    if (!sessionId || !userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenHash = this.hashToken(refreshToken);
    const isValid = await this.sessionService.getIsRefreshTokenValid({
      sessionId,
      userId,
      refreshTokenHash,
    });
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userModel.findByPk(userId, {
      attributes: [...USER_SESSION_REFRESH_ATTRS],
    });
    if (!user?.primaryRoleKey || user.deletedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.DELETED ||
      user.status === UserStatus.DEACTIVATED
    ) {
      throw new UnauthorizedException('Account not active');
    }

    const activeRoleKey = await this.resolveActiveRoleKeyForSession({
      sessionId,
      primaryRoleKey: user.primaryRoleKey,
    });

    const accessTokenJti = randomUUID();
    const accessToken = this.signAccessToken({
      userId,
      sessionId,
      email: user.email,
      name: user.name,
      roleKey: activeRoleKey,
      tokenId: accessTokenJti,
    });
    await this.sessionService.updateSessionAccessTokenJti({
      sessionId,
      accessTokenJti,
    });
    return { accessToken };
  }

  async logoutUser(params: { refreshToken?: string; sessionId?: string }): Promise<void> {
    if (params.sessionId) {
      await this.sessionService.revokeSession({ sessionId: params.sessionId });
    }
    if (!params.refreshToken) {
      return;
    }
    const secret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
    const issuer = this.configService.get<string>('JWT_ISSUER');
    const audience = this.configService.get<string>('JWT_AUDIENCE');
    try {
      const payload = await this.jwtService.verifyAsync<Record<string, unknown>>(params.refreshToken, {
        secret,
        issuer,
        audience,
      });
      const sid = typeof payload.sid === 'string' ? payload.sid : undefined;
      if (sid) {
        await this.sessionService.revokeSession({ sessionId: sid });
      }
    } catch (error) {
      this.logger.debug('Logout refresh token ignored', error);
    }
  }

  private async tryGetSessionIdFromAccessHeader(authorizationHeader: string | undefined): Promise<string | undefined> {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      return undefined;
    }
    const token = authorizationHeader.slice('Bearer '.length).trim();
    if (!token) {
      return undefined;
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        issuer: this.configService.getOrThrow<string>('JWT_ISSUER'),
        audience: this.configService.getOrThrow<string>('JWT_AUDIENCE'),
      });
      if (payload.tokenType === 'access' && typeof payload.sid === 'string') {
        return payload.sid;
      }
    } catch {
      /* expired or invalid access token — refresh-only logout still works */
    }
    return undefined;
  }

  private async rejectInactiveUserLogin(params: { firebaseUid: string; email: string }): Promise<void> {
    const inactive = await this.userModel.findOne({
      where: {
        deletedAt: null,
        status: { [Op.in]: [UserStatus.SUSPENDED, UserStatus.DEACTIVATED] },
        [Op.or]: [{ firebaseUid: params.firebaseUid }, { email: params.email }],
      },
      attributes: [...USER_STATUS_ATTRS],
    });
    if (!inactive) {
      return;
    }
    if (inactive.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account suspended');
    }
    codedForbidden(API_ERROR_CODES.USER_ACCOUNT_DEACTIVATED);
  }

  private async safeDeleteFirebaseUser(firebaseUid: string, reason: string): Promise<void> {
    try {
      await this.firebaseService.deleteUser(firebaseUid);
    } catch (error) {
      this.logger.error(`Firebase deleteUser failed (${reason}) uid=${firebaseUid}`, error);
    }
  }

  private async createSessionAndTokensForUser(params: {
    userId: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceId: string;
    platform: SessionPlatform;
  }): Promise<AuthTokenResult> {
    const accessTokenJti = randomUUID();
    const refreshTokenJti = randomUUID();
    const activeSession = await this.sessionService.getActiveSessionForDevice({
      userId: params.userId,
      deviceId: params.deviceId,
      platform: params.platform,
    });
    const sessionId = activeSession?.id ?? randomUUID();

    const dbUser = await this.userModel.findByPk(params.userId, {
      attributes: [...USER_SESSION_CREATE_ATTRS],
    });
    const primaryRoleKey = dbUser?.primaryRoleKey;
    if (!primaryRoleKey || !dbUser || dbUser.deletedAt) {
      throw new UnauthorizedException('User account is not authorized');
    }
    if (
      dbUser.status === UserStatus.SUSPENDED ||
      dbUser.status === UserStatus.DELETED ||
      dbUser.status === UserStatus.DEACTIVATED
    ) {
      throw new UnauthorizedException('User account is not authorized');
    }

    const activeRoleKey = primaryRoleKey;

    const accessToken = this.signAccessToken({
      userId: params.userId,
      sessionId,
      email: params.email,
      name: dbUser.name,
      roleKey: activeRoleKey,
      tokenId: accessTokenJti,
    });
    const refreshToken = this.signRefreshToken({
      userId: params.userId,
      sessionId,
      tokenId: refreshTokenJti,
    });
    const refreshTokenHash = this.hashToken(refreshToken);

    if (activeSession) {
      await this.sessionService.updateSessionOnLogin({
        sessionId,
        refreshTokenHash,
        accessTokenJti,
        activeRoleKey,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } else {
      await this.sessionService.createSession({
        sessionId,
        userId: params.userId,
        deviceId: params.deviceId,
        platform: params.platform,
        refreshTokenHash,
        accessTokenJti,
        activeRoleKey,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    }

    return {
      accessToken,
      refreshToken,
      sessionId,
      role: activeRoleKey,
      dashboardHomePath: resolveDashboardHomePath(activeRoleKey),
    };
  }

  private async resolveActiveRoleKeyForSession(params: { sessionId: string; primaryRoleKey: string }): Promise<string> {
    const storedActiveRoleKey = await this.sessionService.getActiveRoleKeyForSession(params.sessionId);
    return storedActiveRoleKey ?? params.primaryRoleKey;
  }

  private signAccessToken(payload: {
    userId: string;
    sessionId: string;
    email?: string;
    name?: string;
    roleKey: string;
    tokenId: string;
  }): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN');
    const issuer = this.configService.get<string>('JWT_ISSUER');
    const audience = this.configService.get<string>('JWT_AUDIENCE');
    return this.jwtService.sign(
      {
        sub: payload.userId,
        sid: payload.sessionId,
        email: payload.email,
        name: payload.name,
        role: payload.roleKey,
        tokenType: 'access',
        jti: payload.tokenId,
      },
      {
        secret,
        expiresIn: parseExpiresInSeconds(expiresIn ?? '3600s'),
        issuer,
        audience,
      },
    );
  }

  private signRefreshToken(payload: { userId: string; sessionId: string; tokenId: string }): string {
    const secret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
    const expiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN');
    const issuer = this.configService.get<string>('JWT_ISSUER');
    const audience = this.configService.get<string>('JWT_AUDIENCE');
    return this.jwtService.sign(
      {
        sub: payload.userId,
        sid: payload.sessionId,
        tokenType: 'refresh',
        jti: payload.tokenId,
      },
      {
        secret,
        expiresIn: parseExpiresInSeconds(expiresIn ?? '2592000s'),
        issuer,
        audience,
      },
    );
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }

  private readStringClaim(value: unknown): string | undefined {
    return typeof value === 'string' ? value.trim() || undefined : undefined;
  }
}
