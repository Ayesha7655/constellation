import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomInt } from 'crypto';
import { Op } from 'sequelize';
import { API_ERROR_CODES } from '@constellation/shared';
import { codedBadRequest } from '../../common/exceptions/coded-http.exception';
import { EXTENSION_PAIRING_CODE_ATTRS } from '../../database/attributes';
import { ExtensionPairingCode } from '../../database/models/extension-pairing-code.model';
import { AuthService } from '../auth/auth.service';
import { OrgContextService } from './org-context.service';
import { UpworkOverviewService } from './upwork-overview.service';

const PAIRING_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class ExtensionPairingService {
  constructor(
    @InjectModel(ExtensionPairingCode) private readonly pairingModel: typeof ExtensionPairingCode,
    private readonly orgContext: OrgContextService,
    private readonly authService: AuthService,
    private readonly upworkOverview: UpworkOverviewService,
  ) {}

  async createPairingCode(userId: string | undefined) {
    const { userId: id, orgId } = await this.orgContext.requireOrgIdForUser(userId);

    await this.pairingModel.destroy({
      where: {
        userId: id,
        consumedAt: null,
      },
    });

    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + PAIRING_TTL_MS);
    await this.pairingModel.create({
      code,
      userId: id,
      orgId,
      expiresAt,
      consumedAt: null,
    });

    return {
      code,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: Math.floor(PAIRING_TTL_MS / 1000),
    };
  }

  async exchangePairingCode(params: {
    code: string;
    deviceId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const row = await this.pairingModel.findOne({
      where: {
        code: params.code,
        consumedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
      attributes: [...EXTENSION_PAIRING_CODE_ATTRS],
    });

    if (!row) {
      const expired = await this.pairingModel.findOne({
        where: { code: params.code },
        attributes: [...EXTENSION_PAIRING_CODE_ATTRS],
      });
      if (expired && expired.expiresAt.getTime() <= Date.now()) {
        codedBadRequest(API_ERROR_CODES.EXTENSION_PAIRING_EXPIRED);
      }
      codedBadRequest(API_ERROR_CODES.EXTENSION_PAIRING_INVALID);
    }

    await row.update({ consumedAt: new Date() });
    await this.upworkOverview.markOrgExtensionConnected(row.orgId);

    return this.authService.issueTokensForExtensionPairing({
      userId: row.userId,
      deviceId: params.deviceId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }
}
