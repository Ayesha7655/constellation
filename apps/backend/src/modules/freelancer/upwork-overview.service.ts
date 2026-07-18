import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  FREELANCER_PROFILE_ATTRS,
  ORG_EXTENSION_ATTRS,
  PROFILE_IMPORT_DRAFT_ATTRS,
  SCRAPE_RUN_JOB_ATTRS,
  UPWORK_JOB_ATTRS,
} from '../../database/attributes';
import { FreelancerProfile } from '../../database/models/freelancer-profile.model';
import { Organization } from '../../database/models/organization.model';
import { ProfileImportDraft } from '../../database/models/profile-import-draft.model';
import { ScrapeRunJob } from '../../database/models/scrape-run-job.model';
import { UpworkJob } from '../../database/models/upwork-job.model';
import { OrgContextService } from './org-context.service';
import { scoreJobAgainstProfile } from './scoring/score-job-against-profile';
import { resolveJobSkillLabels } from './ingest/map-apify-job';
import { UpworkScoringService } from './upwork-scoring.service';

@Injectable()
export class UpworkOverviewService {
  constructor(
    @InjectModel(Organization) private readonly orgModel: typeof Organization,
    @InjectModel(FreelancerProfile) private readonly profileModel: typeof FreelancerProfile,
    @InjectModel(ProfileImportDraft) private readonly draftModel: typeof ProfileImportDraft,
    @InjectModel(ScrapeRunJob) private readonly scrapeRunJobModel: typeof ScrapeRunJob,
    @InjectModel(UpworkJob) private readonly jobModel: typeof UpworkJob,
    private readonly orgContext: OrgContextService,
    private readonly upworkScoring: UpworkScoringService,
  ) {}

  async getOverview(userId: string | undefined) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);

    const [org, profiles, pendingDraft, recentRunJobs, scoring] = await Promise.all([
      this.orgModel.findByPk(orgId, { attributes: [...ORG_EXTENSION_ATTRS] }),
      this.profileModel.findAll({
        where: { orgId },
        attributes: [...FREELANCER_PROFILE_ATTRS],
        order: [['createdAt', 'DESC']],
        limit: 12,
      }),
      this.draftModel.findOne({
        where: { orgId },
        attributes: [...PROFILE_IMPORT_DRAFT_ATTRS],
      }),
      this.scrapeRunJobModel.findAll({
        where: { orgId },
        attributes: [...SCRAPE_RUN_JOB_ATTRS],
        include: [
          {
            model: this.jobModel,
            as: 'upworkJob',
            required: true,
            attributes: [...UPWORK_JOB_ATTRS],
          },
          {
            model: this.profileModel,
            as: 'freelancerProfile',
            required: true,
            attributes: [...FREELANCER_PROFILE_ATTRS],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 20,
      }),
      this.upworkScoring.getConfigForOrg(orgId),
    ]);

    const extensionConnected =
      Boolean(org?.extensionConnectedAt) ||
      Boolean(pendingDraft) ||
      profiles.some((profile) => profile.source === 'extension');

    const seenJobIds = new Set<string>();
    const recentJobs: Array<{
      id: string;
      title: string;
      jobUrl: string;
      budget: string | null;
      relevancyScore: number;
      scrapedAt: string;
      freelancerProfileId: string;
    }> = [];

    for (const row of recentRunJobs) {
      if (!row.upworkJob || !row.freelancerProfile || seenJobIds.has(row.upworkJobId)) continue;
      seenJobIds.add(row.upworkJobId);

      const { score } = scoreJobAgainstProfile(
        {
          title: row.freelancerProfile.title,
          overview: row.freelancerProfile.overview,
          skills: row.freelancerProfile.skills,
          hourlyRateMin: row.freelancerProfile.hourlyRateMin,
          hourlyRateMax: row.freelancerProfile.hourlyRateMax,
          country: row.freelancerProfile.country,
          exclusions: row.freelancerProfile.exclusions,
        },
        {
          title: row.upworkJob.title,
          description: row.upworkJob.description,
          skills: resolveJobSkillLabels(row.upworkJob),
          budget: row.upworkJob.budget,
          jobType: row.upworkJob.jobType,
          clientLocation: row.upworkJob.clientLocation,
          clientRating: row.upworkJob.clientRating,
          proposals: row.upworkJob.proposals,
        },
        scoring,
      );

      recentJobs.push({
        id: row.upworkJob.id,
        title: row.upworkJob.title,
        jobUrl: row.upworkJob.jobUrl,
        budget: row.upworkJob.budget,
        relevancyScore: score,
        scrapedAt: row.upworkJob.scrapedAt.toISOString(),
        freelancerProfileId: row.freelancerProfileId,
      });

      if (recentJobs.length >= 5) break;
    }

    return {
      extensionConnected,
      scoringThresholds: scoring.thresholds,
      pendingDraft: pendingDraft
        ? {
            id: pendingDraft.id,
            payload: pendingDraft.payload,
            createdAt: pendingDraft.createdAt.toISOString(),
            expiresAt: pendingDraft.expiresAt.toISOString(),
          }
        : null,
      profiles: profiles.map((profile) => ({
        id: profile.id,
        label: profile.label,
        title: profile.title,
        source: profile.source,
        skills: profile.skills,
        updatedAt: profile.updatedAt.toISOString(),
      })),
      recentJobs,
    };
  }

  async markExtensionConnected(userId: string | undefined): Promise<{ ok: true; extensionConnected: true }> {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const org = await this.orgModel.findByPk(orgId, { attributes: [...ORG_EXTENSION_ATTRS] });
    if (org && !org.extensionConnectedAt) {
      await org.update({ extensionConnectedAt: new Date() });
    }
    return { ok: true, extensionConnected: true };
  }

  async markOrgExtensionConnected(orgId: string): Promise<void> {
    const org = await this.orgModel.findByPk(orgId, { attributes: [...ORG_EXTENSION_ATTRS] });
    if (org && !org.extensionConnectedAt) {
      await org.update({ extensionConnectedAt: new Date() });
    }
  }
}
