import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import {
  APIFY_UPWORK_JOBS_ACTOR_ID,
  API_ERROR_CODES,
  normalizeUpworkApifyFilters,
} from '@constellation/shared';
import {
  codedBadRequest,
  codedConflict,
  codedNotFound,
} from '../../common/exceptions/coded-http.exception';
import { PaginationService } from '../../common/services/pagination.service';
import {
  FREELANCER_PROFILE_ATTRS,
  SCRAPE_RUN_ATTRS,
  SCRAPE_RUN_JOB_ATTRS,
  SEARCH_FILTER_SET_ATTRS,
  UPWORK_JOB_ATTRS,
} from '../../database/attributes';
import { ScrapeRunStatus, ScrapeRunTrigger } from '../../database/enums';
import { FreelancerProfile } from '../../database/models/freelancer-profile.model';
import { ScrapeRun } from '../../database/models/scrape-run.model';
import { ScrapeRunJob } from '../../database/models/scrape-run-job.model';
import { SearchFilterSet } from '../../database/models/search-filter-set.model';
import { UpworkJob } from '../../database/models/upwork-job.model';
import { ApifyClient } from './apify.client';
import { mapApifyJobItem, shouldExcludeJob } from './ingest/map-apify-job';
import { OrgContextService } from './org-context.service';

@Injectable()
export class ScrapeRunsService {
  private readonly logger = new Logger(ScrapeRunsService.name);

  constructor(
    @InjectModel(ScrapeRun) private readonly scrapeRunModel: typeof ScrapeRun,
    @InjectModel(SearchFilterSet) private readonly filterModel: typeof SearchFilterSet,
    @InjectModel(FreelancerProfile) private readonly profileModel: typeof FreelancerProfile,
    @InjectModel(UpworkJob) private readonly jobModel: typeof UpworkJob,
    @InjectModel(ScrapeRunJob) private readonly scrapeRunJobModel: typeof ScrapeRunJob,
    private readonly orgContext: OrgContextService,
    private readonly apifyClient: ApifyClient,
    private readonly paginationService: PaginationService,
  ) {}

  async createRun(userId: string | undefined, profileId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);

    const active = await this.scrapeRunModel.findOne({
      where: {
        orgId,
        freelancerProfileId: profileId,
        status: { [Op.in]: [ScrapeRunStatus.QUEUED, ScrapeRunStatus.RUNNING] },
      },
      attributes: [...SCRAPE_RUN_ATTRS],
    });
    if (active) {
      throw codedConflict(API_ERROR_CODES.SCRAPE_RUN_ALREADY_ACTIVE);
    }

    const filterRow = await this.filterModel.findOne({
      where: { orgId, freelancerProfileId: profileId },
      attributes: [...SEARCH_FILTER_SET_ATTRS],
    });
    if (!filterRow) {
      throw codedNotFound(API_ERROR_CODES.SEARCH_FILTERS_NOT_FOUND);
    }

    const filters = normalizeUpworkApifyFilters(filterRow.filters);
    if (filters.queries.length === 0) {
      throw codedBadRequest(API_ERROR_CODES.SEARCH_FILTERS_QUERIES_REQUIRED);
    }

    // Ensure token exists before enqueueing
    this.apifyClient.requireToken();

    const run = await this.scrapeRunModel.create({
      orgId,
      freelancerProfileId: profileId,
      status: ScrapeRunStatus.QUEUED,
      trigger: ScrapeRunTrigger.MANUAL,
      actorId: filterRow.actorId || APIFY_UPWORK_JOBS_ACTOR_ID,
      filtersSnapshot: filters,
      totalFetched: 0,
      totalFiltered: 0,
      totalSaved: 0,
      totalNew: 0,
    });
    await run.reload({ attributes: [...SCRAPE_RUN_ATTRS] });

    void this.executeRun(run.id).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown scrape run error';
      this.logger.error(`Scrape run ${run.id} crashed: ${message}`);
    });

    return this.toResponse(run);
  }

  async listRuns(
    userId: string | undefined,
    profileId: string,
    query: { page?: number; limit?: number },
  ) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);
    const { page, limit, skip, take } = this.paginationService.resolve(query);

    const { count: total, rows } = await this.scrapeRunModel.findAndCountAll({
      where: { orgId, freelancerProfileId: profileId },
      attributes: [...SCRAPE_RUN_ATTRS],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: take,
    });

    return {
      items: rows.map((row) => this.toResponse(row)),
      meta: this.paginationService.buildMeta(page, limit, total),
    };
  }

  async getRun(userId: string | undefined, profileId: string, runId: string) {
    const { orgId } = await this.orgContext.requireOrgIdForUser(userId);
    await this.requireOwnedProfile(orgId, profileId);

    const run = await this.scrapeRunModel.findOne({
      where: { id: runId, orgId, freelancerProfileId: profileId },
      attributes: [...SCRAPE_RUN_ATTRS],
    });
    if (!run) {
      throw codedNotFound(API_ERROR_CODES.SCRAPE_RUN_NOT_FOUND);
    }
    return this.toResponse(run);
  }

  async executeRun(runId: string): Promise<void> {
    const run = await this.scrapeRunModel.findByPk(runId, {
      attributes: [...SCRAPE_RUN_ATTRS],
    });
    if (!run) return;

    const profile = await this.profileModel.findOne({
      where: { id: run.freelancerProfileId, orgId: run.orgId },
      attributes: [...FREELANCER_PROFILE_ATTRS],
    });
    if (!profile) {
      await run.update({
        status: ScrapeRunStatus.FAILED,
        error: 'Freelancer profile missing',
        finishedAt: new Date(),
      });
      return;
    }

    try {
      await run.update({
        status: ScrapeRunStatus.RUNNING,
        startedAt: new Date(),
        error: null,
      });

      const filters = normalizeUpworkApifyFilters(run.filtersSnapshot);
      const { runId: apifyRunId } = await this.apifyClient.startActorRun(run.actorId, filters);
      await run.update({ apifyRunId });

      const { datasetId } = await this.apifyClient.waitForRunDataset(apifyRunId);
      const items = await this.apifyClient.listDatasetItems(datasetId);

      let totalFiltered = 0;
      let totalSaved = 0;
      let totalNew = 0;
      const now = new Date();

      for (const item of items) {
        const mapped = mapApifyJobItem(item);
        if (!mapped) {
          totalFiltered += 1;
          continue;
        }
        if (shouldExcludeJob(mapped, profile.exclusions)) {
          totalFiltered += 1;
          continue;
        }

        const [job, created] = await this.jobModel.findOrCreate({
          where: { orgId: run.orgId, externalJobId: mapped.externalJobId },
          defaults: {
            orgId: run.orgId,
            externalJobId: mapped.externalJobId,
            jobUrl: mapped.jobUrl,
            title: mapped.title,
            description: mapped.description,
            budget: mapped.budget,
            jobType: mapped.jobType,
            experienceLevel: mapped.experienceLevel,
            clientLocation: mapped.clientLocation,
            clientRating: mapped.clientRating,
            clientSpent: mapped.clientSpent,
            skills: mapped.skills,
            proposals: mapped.proposals,
            postedTime: mapped.postedTime,
            postedAt: mapped.postedAt,
            scrapeRunId: run.id,
            rawPayload: mapped.rawPayload,
            scrapedAt: now,
          },
          attributes: [...UPWORK_JOB_ATTRS],
        });

        const isNew = created || job.isNewRecord;

        if (!isNew) {
          // Refresh listing fields; keep original scrapeRunId (first-seen run) intact for history.
          await job.update({
            jobUrl: mapped.jobUrl,
            title: mapped.title,
            description: mapped.description,
            budget: mapped.budget,
            jobType: mapped.jobType,
            experienceLevel: mapped.experienceLevel,
            clientLocation: mapped.clientLocation,
            clientRating: mapped.clientRating,
            clientSpent: mapped.clientSpent,
            skills: mapped.skills,
            proposals: mapped.proposals,
            postedTime: mapped.postedTime,
            postedAt: mapped.postedAt ?? job.postedAt,
            rawPayload: mapped.rawPayload,
            scrapedAt: now,
          });
        } else {
          totalNew += 1;
        }

        await this.scrapeRunJobModel.findOrCreate({
          where: { scrapeRunId: run.id, upworkJobId: job.id },
          defaults: {
            orgId: run.orgId,
            scrapeRunId: run.id,
            upworkJobId: job.id,
            freelancerProfileId: profile.id,
            isNew,
          },
          attributes: [...SCRAPE_RUN_JOB_ATTRS],
        });

        totalSaved += 1;
      }

      await run.update({
        status: ScrapeRunStatus.SUCCEEDED,
        totalFetched: items.length,
        totalFiltered,
        totalSaved,
        totalNew,
        finishedAt: new Date(),
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scrape run failed';
      this.logger.warn(`Scrape run ${run.id} failed: ${message}`);
      await run.update({
        status: ScrapeRunStatus.FAILED,
        error: message.slice(0, 2000),
        finishedAt: new Date(),
      });
    }
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

  private toResponse(row: ScrapeRun) {
    return {
      id: row.id,
      orgId: row.orgId,
      freelancerProfileId: row.freelancerProfileId,
      status: row.status,
      trigger: row.trigger,
      actorId: row.actorId,
      apifyRunId: row.apifyRunId,
      filtersSnapshot: row.filtersSnapshot,
      error: row.error,
      totalFetched: row.totalFetched,
      totalFiltered: row.totalFiltered,
      totalSaved: row.totalSaved,
      totalNew: row.totalNew,
      startedAt: row.startedAt?.toISOString() ?? null,
      finishedAt: row.finishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
