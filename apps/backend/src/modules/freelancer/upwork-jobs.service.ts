import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, type WhereOptions } from 'sequelize';
import { API_ERROR_CODES } from '@constellation/shared';
import { codedNotFound } from '../../common/exceptions/coded-http.exception';
import { PaginationService } from '../../common/services/pagination.service';
import {
  FREELANCER_PROFILE_ATTRS,
  SCRAPE_RUN_JOB_ATTRS,
  UPWORK_JOB_ATTRS,
} from '../../database/attributes';
import { FreelancerProfile } from '../../database/models/freelancer-profile.model';
import { ScrapeRunJob } from '../../database/models/scrape-run-job.model';
import { UpworkJob } from '../../database/models/upwork-job.model';
import { OrgContextService } from './org-context.service';
import { resolveJobSkillLabels } from './ingest/map-apify-job';
import {
  classifyJobSkillsAgainstProfile,
  scoreJobAgainstProfile,
  type ScoreableJob,
  type ScoreableProfile,
} from './scoring/score-job-against-profile';
import { UpworkScoringService } from './upwork-scoring.service';

function endOfDay(iso: string): Date {
  const date = new Date(iso);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function startOfDay(iso: string): Date {
  const date = new Date(iso);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

type JobListQuery = {
  page?: number;
  limit?: number;
  q?: string;
  minScore?: number;
  sort?: 'score' | 'date';
  scrapedFrom?: string;
  scrapedTo?: string;
  scrapeRunId?: string;
  newOnly?: boolean;
};

@Injectable()
export class UpworkJobsService {
  constructor(
    @InjectModel(UpworkJob) private readonly jobModel: typeof UpworkJob,
    @InjectModel(ScrapeRunJob) private readonly scrapeRunJobModel: typeof ScrapeRunJob,
    @InjectModel(FreelancerProfile) private readonly profileModel: typeof FreelancerProfile,
    private readonly orgContext: OrgContextService,
    private readonly paginationService: PaginationService,
    private readonly upworkScoring: UpworkScoringService,
  ) {}

  async listJobs(userId: string | undefined, profileId: string, query: JobListQuery) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profile = await this.requireOwnedProfile(orgId, profileId);
    const scoring = await this.upworkScoring.getConfigForOrg(orgId);
    const { page, limit, skip, take } = this.paginationService.resolve(query);

    const minScore = query.minScore != null && Number.isFinite(query.minScore) ? query.minScore : 0;
    const sortByDate = query.sort === 'date';
    const q = query.q?.trim();

    const runJobWhere: WhereOptions<ScrapeRunJob> = {
      orgId,
      freelancerProfileId: profileId,
    };
    if (query.scrapeRunId) {
      runJobWhere.scrapeRunId = query.scrapeRunId;
    }
    if (query.newOnly) {
      runJobWhere.isNew = true;
    }

    const jobWhere: WhereOptions<UpworkJob> = { orgId };
    if (q) {
      Object.assign(jobWhere, {
        [Op.or]: [{ title: { [Op.iLike]: `%${q}%` } }, { description: { [Op.iLike]: `%${q}%` } }],
      });
    }
    this.applyScrapedRange(jobWhere, query.scrapedFrom, query.scrapedTo);

    const rows = await this.scrapeRunJobModel.findAll({
      where: runJobWhere,
      attributes: [...SCRAPE_RUN_JOB_ATTRS],
      include: [
        {
          model: this.jobModel,
          as: 'upworkJob',
          required: true,
          attributes: [...UPWORK_JOB_ATTRS],
          where: jobWhere,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const scoreableProfile = this.toScoreableProfile(profile);
    const seenJobIds = new Set<string>();
    const scored: ReturnType<UpworkJobsService['toJobItem']>[] = [];

    for (const row of rows) {
      if (!row.upworkJob || seenJobIds.has(row.upworkJobId)) continue;
      seenJobIds.add(row.upworkJobId);

      const { score } = scoreJobAgainstProfile(
        scoreableProfile,
        this.toScoreableJob(row.upworkJob),
        scoring,
      );
      if (score < minScore) continue;

      scored.push(
        this.toJobItem(row.upworkJob, score, row.createdAt, profileId, {
          scrapeRunId: row.scrapeRunId,
          isNewInRun: row.isNew,
        }),
      );
    }

    scored.sort((a, b) => {
      if (sortByDate) {
        const byDate = Date.parse(b.scrapedAt) - Date.parse(a.scrapedAt);
        if (byDate !== 0) return byDate;
        return b.relevancyScore - a.relevancyScore;
      }
      const byScore = b.relevancyScore - a.relevancyScore;
      if (byScore !== 0) return byScore;
      return Date.parse(b.scrapedAt) - Date.parse(a.scrapedAt);
    });

    const total = scored.length;
    const items = scored.slice(skip, skip + take);

    return {
      items,
      meta: this.paginationService.buildMeta(page, limit, total),
      scoringThresholds: scoring.thresholds,
    };
  }

  async getJob(userId: string | undefined, profileId: string, jobId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    const profile = await this.requireOwnedProfile(orgId, profileId);
    const scoring = await this.upworkScoring.getConfigForOrg(orgId);

    const row = await this.scrapeRunJobModel.findOne({
      where: { orgId, freelancerProfileId: profileId, upworkJobId: jobId },
      attributes: [...SCRAPE_RUN_JOB_ATTRS],
      include: [
        {
          model: this.jobModel,
          as: 'upworkJob',
          required: true,
          attributes: [...UPWORK_JOB_ATTRS],
          where: { orgId },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (!row?.upworkJob) {
      throw codedNotFound(API_ERROR_CODES.UPWORK_JOB_NOT_FOUND);
    }

    const scoreableProfile = this.toScoreableProfile(profile);
    const scoreableJob = this.toScoreableJob(row.upworkJob);
    const { score, breakdown } = scoreJobAgainstProfile(scoreableProfile, scoreableJob, scoring);
    const skillMatches = classifyJobSkillsAgainstProfile(scoreableProfile, scoreableJob.skills);

    return {
      ...this.toJobItem(row.upworkJob, score, row.createdAt, profileId, {
        scrapeRunId: row.scrapeRunId,
        isNewInRun: row.isNew,
      }),
      scoringThresholds: scoring.thresholds,
      scoreBreakdown: breakdown,
      skillMatches,
    };
  }

  private applyScrapedRange(
    jobWhere: WhereOptions<UpworkJob>,
    scrapedFrom?: string,
    scrapedTo?: string,
  ): void {
    if (!scrapedFrom && !scrapedTo) return;
    const range: { [Op.gte]?: Date; [Op.lte]?: Date } = {};
    if (scrapedFrom) range[Op.gte] = startOfDay(scrapedFrom);
    if (scrapedTo) range[Op.lte] = endOfDay(scrapedTo);
    Object.assign(jobWhere, { scrapedAt: range });
  }

  private toScoreableProfile(profile: FreelancerProfile): ScoreableProfile {
    return {
      title: profile.title,
      overview: profile.overview,
      skills: profile.skills,
      hourlyRateMin: profile.hourlyRateMin,
      hourlyRateMax: profile.hourlyRateMax,
      country: profile.country,
      exclusions: profile.exclusions,
    };
  }

  private toScoreableJob(job: UpworkJob): ScoreableJob {
    return {
      title: job.title,
      description: job.description,
      skills: resolveJobSkillLabels(job),
      budget: job.budget,
      jobType: job.jobType,
      clientLocation: job.clientLocation,
      clientRating: job.clientRating,
      proposals: job.proposals,
    };
  }

  private toJobItem(
    job: UpworkJob,
    relevancyScore: number,
    scoredAt: Date,
    profileId: string,
    extras?: { scrapeRunId?: string; isNewInRun?: boolean },
  ) {
    return {
      id: job.id,
      orgId: job.orgId,
      externalJobId: job.externalJobId,
      jobUrl: job.jobUrl,
      title: job.title,
      description: job.description,
      budget: job.budget,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      clientLocation: job.clientLocation,
      clientRating: job.clientRating,
      clientSpent: job.clientSpent,
      skills: resolveJobSkillLabels(job),
      proposals: job.proposals,
      postedTime: job.postedTime,
      postedAt: job.postedAt?.toISOString() ?? null,
      scrapeRunId: extras?.scrapeRunId ?? job.scrapeRunId,
      scrapedAt: job.scrapedAt.toISOString(),
      relevancyScore,
      scoredAt: scoredAt.toISOString(),
      freelancerProfileId: profileId,
      isNewInRun: extras?.isNewInRun ?? null,
    };
  }

  private async requireOwnedProfile(orgId: string, profileId: string): Promise<FreelancerProfile> {
    const profile = await this.profileModel.findOne({
      where: { id: profileId, orgId },
      attributes: [...FREELANCER_PROFILE_ATTRS],
    });
    if (!profile) {
      throw codedNotFound(API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND);
    }
    return profile;
  }
}
