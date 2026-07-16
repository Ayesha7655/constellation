import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  API_ERROR_CODES,
  DEFAULT_UPWORK_SCORING_CONFIG,
  isValidUpworkScoringThresholds,
  resolveUpworkScoringConfig,
  sumUpworkScoringWeights,
  type UpworkScoringConfig,
} from '@constellation/shared';
import { codedBadRequest } from '../../common/exceptions/coded-http.exception';
import { ORG_SCORING_ATTRS } from '../../database/attributes';
import { Organization } from '../../database/models/organization.model';
import { UpdateUpworkScoringConfigDto } from './dto/update-upwork-scoring-config.dto';
import { OrgContextService } from './org-context.service';

@Injectable()
export class UpworkScoringService {
  constructor(
    @InjectModel(Organization) private readonly orgModel: typeof Organization,
    private readonly orgContext: OrgContextService,
  ) {}

  async getConfig(userId: string | undefined): Promise<UpworkScoringConfig> {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    return this.getConfigForOrg(orgId);
  }

  async getConfigForOrg(orgId: string): Promise<UpworkScoringConfig> {
    const org = await this.orgModel.findByPk(orgId, { attributes: [...ORG_SCORING_ATTRS] });
    return resolveUpworkScoringConfig(org?.upworkScoringConfig ?? null);
  }

  async updateConfig(
    userId: string | undefined,
    dto: UpdateUpworkScoringConfigDto,
  ): Promise<UpworkScoringConfig> {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const config = resolveUpworkScoringConfig(dto);

    if (sumUpworkScoringWeights(config.weights) !== 100) {
      throw codedBadRequest(API_ERROR_CODES.UPWORK_SCORING_WEIGHTS_INVALID);
    }
    if (!isValidUpworkScoringThresholds(config.thresholds)) {
      throw codedBadRequest(API_ERROR_CODES.UPWORK_SCORING_THRESHOLDS_INVALID);
    }

    const org = await this.orgModel.findByPk(orgId, { attributes: [...ORG_SCORING_ATTRS] });
    if (!org) {
      return DEFAULT_UPWORK_SCORING_CONFIG;
    }

    await org.update({
      upworkScoringConfig: {
        weights: { ...config.weights },
        thresholds: { ...config.thresholds },
      },
    });

    return config;
  }

  async resetConfig(userId: string | undefined): Promise<UpworkScoringConfig> {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const org = await this.orgModel.findByPk(orgId, { attributes: [...ORG_SCORING_ATTRS] });
    if (org) {
      await org.update({ upworkScoringConfig: null });
    }
    return { ...DEFAULT_UPWORK_SCORING_CONFIG, weights: { ...DEFAULT_UPWORK_SCORING_CONFIG.weights }, thresholds: { ...DEFAULT_UPWORK_SCORING_CONFIG.thresholds } };
  }
}
