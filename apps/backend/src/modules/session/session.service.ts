import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import {
  SESSION_ACCESS_VALID_ATTRS,
  SESSION_ACTIVE_ROLE_ATTRS,
  SESSION_DEVICE_LOOKUP_ATTRS,
  SESSION_LIST_ATTRS,
  SESSION_REFRESH_VALID_ATTRS,
} from '../../database/attributes';
import { SessionPlatform } from '../../database/enums';
import { UserSession } from '../../database/models/user-session.model';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(@InjectModel(UserSession) private readonly userSessionModel: typeof UserSession) {}

  async listActiveSessionsForUser(userId: string) {
    try {
      return await this.userSessionModel.findAll({
        where: { userId, isRevoked: false },
        order: [['lastActiveAt', 'DESC']],
        attributes: [...SESSION_LIST_ATTRS],
      });
    } catch (error) {
      this.logger.error(`[SessionService.listActiveSessionsForUser] userId=${userId}`, (error as Error).stack);
      throw error;
    }
  }

  async revokeSelectedSessions(params: {
    userId: string;
    currentSessionId?: string;
    sessionIds: string[];
  }): Promise<{ revokedCount: number; remainingOtherCount: number }> {
    try {
      const idsToRevoke = params.sessionIds.filter((id) => id !== params.currentSessionId);
      let revokedCount = 0;
      if (idsToRevoke.length > 0) {
        const [count] = await this.userSessionModel.update(
          { isRevoked: true, revokedAt: new Date() },
          {
            where: {
              id: { [Op.in]: idsToRevoke },
              userId: params.userId,
              isRevoked: false,
              ...(params.currentSessionId ? { id: { [Op.ne]: params.currentSessionId } } : {}),
            },
          },
        );
        revokedCount = count;
      }

      const remainingOtherCount = await this.userSessionModel.count({
        where: {
          userId: params.userId,
          isRevoked: false,
          ...(params.currentSessionId ? { id: { [Op.ne]: params.currentSessionId } } : {}),
        },
      });

      return { revokedCount, remainingOtherCount };
    } catch (error) {
      this.logger.error(`[SessionService.revokeSelectedSessions] userId=${params.userId}`, (error as Error).stack);
      throw error;
    }
  }

  getActiveSessionForDevice(params: { userId: string; deviceId: string; platform: SessionPlatform }) {
    return this.userSessionModel.findOne({
      where: {
        userId: params.userId,
        deviceId: params.deviceId,
        platform: params.platform,
        isRevoked: false,
      },
      order: [['createdAt', 'DESC']],
      attributes: [...SESSION_DEVICE_LOOKUP_ATTRS],
    });
  }

  async createSession(params: {
    sessionId: string;
    userId: string;
    deviceId: string;
    platform: SessionPlatform;
    refreshTokenHash: string;
    accessTokenJti: string;
    activeRoleKey: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const now = new Date();
    await this.userSessionModel.create({
      id: params.sessionId,
      userId: params.userId,
      deviceId: params.deviceId,
      platform: params.platform,
      refreshTokenHash: params.refreshTokenHash,
      accessTokenJti: params.accessTokenJti,
      activeRoleKey: params.activeRoleKey,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      lastActiveAt: now,
    });
  }

  async updateSessionOnLogin(params: {
    sessionId: string;
    refreshTokenHash: string;
    accessTokenJti: string;
    activeRoleKey: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.userSessionModel.update(
      {
        refreshTokenHash: params.refreshTokenHash,
        accessTokenJti: params.accessTokenJti,
        activeRoleKey: params.activeRoleKey,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        lastActiveAt: new Date(),
      },
      { where: { id: params.sessionId, isRevoked: false } },
    );
  }

  async getActiveRoleKeyForSession(sessionId: string): Promise<string | null> {
    const session = await this.userSessionModel.findOne({
      where: { id: sessionId, isRevoked: false },
      attributes: [...SESSION_ACTIVE_ROLE_ATTRS],
    });
    return session?.activeRoleKey ?? null;
  }

  async revokeSession(params: { sessionId: string }): Promise<void> {
    await this.userSessionModel.update(
      { isRevoked: true, revokedAt: new Date() },
      { where: { id: params.sessionId, isRevoked: false } },
    );
  }

  async revokeAllUserSessions(params: { userId: string }): Promise<void> {
    await this.userSessionModel.update(
      { isRevoked: true, revokedAt: new Date() },
      { where: { userId: params.userId, isRevoked: false } },
    );
  }

  async getIsRefreshTokenValid(params: {
    sessionId: string;
    userId: string;
    refreshTokenHash: string;
  }): Promise<boolean> {
    const session = await this.userSessionModel.findOne({
      where: {
        id: params.sessionId,
        userId: params.userId,
        isRevoked: false,
        refreshTokenHash: params.refreshTokenHash,
      },
      attributes: [...SESSION_REFRESH_VALID_ATTRS],
    });
    return Boolean(session);
  }

  async updateSessionAccessTokenJti(params: { sessionId: string; accessTokenJti: string }): Promise<void> {
    await this.userSessionModel.update(
      { accessTokenJti: params.accessTokenJti },
      { where: { id: params.sessionId, isRevoked: false } },
    );
  }

  async validateAccessTokenSession(params: {
    sessionId: string;
    accessTokenJti?: string;
  }): Promise<{ valid: boolean; userId?: string }> {
    const session = await this.userSessionModel.findOne({
      where: {
        id: params.sessionId,
        isRevoked: false,
        ...(params.accessTokenJti ? { accessTokenJti: params.accessTokenJti } : {}),
      },
      attributes: [...SESSION_ACCESS_VALID_ATTRS],
    });
    if (!session) {
      return { valid: false };
    }
    return { valid: true, userId: session.userId };
  }
}
