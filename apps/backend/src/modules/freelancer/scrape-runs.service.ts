import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op, UniqueConstraintError, ValidationError } from 'sequelize';
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
import { mapApifyJobItem, shouldExcludeJob, type NormalizedApifyJob } from './ingest/map-apify-job';
import { OrgContextService } from './org-context.service';

function isProductionEnv(nodeEnv: string | undefined): boolean {
  return nodeEnv === 'production';
}

function safeJson(value: unknown, maxLen = 1500): string {
  try {
    const text = JSON.stringify(value, (_key, current) => {
      if (typeof current === 'bigint') return current.toString();
      if (current instanceof Date) return current.toISOString();
      if (typeof current === 'undefined') return null;
      return current;
    });
    if (!text) return 'null';
    return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
  } catch {
    return '[unserializable]';
  }
}

function asPlainJsonRecord(value: Record<string, unknown>): Record<string, unknown> {
  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function formatSequelizeError(error: unknown): string {
  if (error instanceof UniqueConstraintError) {
    const fields = Object.keys(error.fields ?? {});
    const parentDetail =
      error.parent && typeof error.parent === 'object' && 'detail' in error.parent
        ? String((error.parent as { detail?: unknown }).detail ?? '')
        : '';
    return `UniqueConstraintError fields=[${fields.join(',')}] ${parentDetail || error.message}`;
  }
  if (error instanceof ValidationError) {
    const parts = error.errors.map((item) => `${item.path ?? '?'}: ${item.message}`);
    return `ValidationError ${parts.join('; ') || error.message}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

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
    private readonly configService: ConfigService,
  ) {}

  private scrapeDebugEnabled(): boolean {
    return !isProductionEnv(this.configService.get<string>('NODE_ENV'));
  }

  private logScrapeDebug(runId: string, stage: string, detail?: unknown): void {
    if (!this.scrapeDebugEnabled()) return;
    if (detail === undefined) {
      this.logger.debug(`[scrape:${runId}] ${stage}`);
      return;
    }
    this.logger.debug(`[scrape:${runId}] ${stage} ${safeJson(detail)}`);
  }

  private logScrapeError(runId: string, stage: string, error: unknown): void {
    const message = formatSequelizeError(error);
    this.logger.warn(`[scrape:${runId}] failed at ${stage}: ${message}`);
    if (this.scrapeDebugEnabled() && error instanceof Error && error.stack) {
      this.logger.warn(error.stack);
    }
  }

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
      this.logScrapeError(run.id, 'unhandled', error);
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
    let stage = 'load-run';
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

    const profileExclusions = Array.isArray(profile.exclusions) ? profile.exclusions : [];

    try {
      stage = 'mark-running';
      await run.update({
        status: ScrapeRunStatus.RUNNING,
        startedAt: new Date(),
        error: null,
      });

      stage = 'normalize-filters';
      const snapshot =
        run.filtersSnapshot && typeof run.filtersSnapshot === 'object' && !Array.isArray(run.filtersSnapshot)
          ? run.filtersSnapshot
          : {};
      const filters = normalizeUpworkApifyFilters(snapshot);
      const actorInput = {
        queries: filters.queries,
        item_limit: filters.item_limit,
        job_posted: filters.job_posted,
        proxyConfiguration: filters.proxyConfiguration,
      };
      this.logScrapeDebug(run.id, 'actor-input', {
        actorId: run.actorId,
        queryCount: actorInput.queries.length,
        item_limit: actorInput.item_limit,
        job_posted: actorInput.job_posted,
        proxyConfiguration: actorInput.proxyConfiguration,
      });

      stage = 'apify-start';
      const { runId: apifyRunId } = await this.apifyClient.startActorRun(run.actorId, actorInput);
      await run.update({ apifyRunId });
      this.logScrapeDebug(run.id, 'apify-started', { apifyRunId });

      stage = 'apify-wait';
      const { datasetId } = await this.apifyClient.waitForRunDataset(apifyRunId);
      this.logScrapeDebug(run.id, 'apify-succeeded', { datasetId });

      stage = 'apify-fetch-items';
      const items = await this.apifyClient.listDatasetItems(datasetId);
      this.logScrapeDebug(run.id, 'dataset-loaded', {
        totalFetched: items.length,
        sampleKeys:
          items[0] && typeof items[0] === 'object' && !Array.isArray(items[0])
            ? Object.keys(items[0] as Record<string, unknown>).slice(0, 20)
            : [],
      });

      let totalFiltered = 0;
      let totalSaved = 0;
      let totalNew = 0;
      const now = new Date();

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        stage = `ingest-item-${index}`;
        let mapped: NormalizedApifyJob | null = null;
        try {
          mapped = mapApifyJobItem(item);
          if (!mapped) {
            totalFiltered += 1;
            this.logScrapeDebug(run.id, 'item-skipped-unmapped', {
              index,
              sample: safeJson(item, 400),
            });
            continue;
          }
          if (shouldExcludeJob(mapped, profileExclusions)) {
            totalFiltered += 1;
            this.logScrapeDebug(run.id, 'item-excluded', {
              index,
              externalJobId: mapped.externalJobId,
              clientLocation: mapped.clientLocation,
            });
            continue;
          }

          const persisted = await this.upsertJob(run.orgId, run.id, mapped, now);
          const isNew = persisted.created;

          await this.scrapeRunJobModel.findOrCreate({
            where: { scrapeRunId: run.id, upworkJobId: persisted.job.id },
            defaults: {
              orgId: run.orgId,
              scrapeRunId: run.id,
              upworkJobId: persisted.job.id,
              freelancerProfileId: profile.id,
              isNew,
            },
            attributes: [...SCRAPE_RUN_JOB_ATTRS],
          });

          if (isNew) totalNew += 1;
          totalSaved += 1;
        } catch (itemError) {
          totalFiltered += 1;
          this.logScrapeError(run.id, stage, itemError);
          this.logScrapeDebug(run.id, 'item-persist-failed', {
            index,
            externalJobId: mapped?.externalJobId ?? null,
            sample: safeJson(item, 400),
          });
        }
      }

      stage = 'mark-succeeded';
      await run.update({
        status: ScrapeRunStatus.SUCCEEDED,
        totalFetched: items.length,
        totalFiltered,
        totalSaved,
        totalNew,
        finishedAt: new Date(),
        error: null,
      });
      this.logScrapeDebug(run.id, 'completed', {
        totalFetched: items.length,
        totalFiltered,
        totalSaved,
        totalNew,
      });
    } catch (error) {
      this.logScrapeError(run.id, stage, error);
      const message = error instanceof Error ? error.message : 'Scrape run failed';
      await run.update({
        status: ScrapeRunStatus.FAILED,
        error: `[${stage}] ${message}`.slice(0, 2000),
        finishedAt: new Date(),
      });
    }
  }

  /** Upsert by org + external job id, falling back to job URL (both are unique per org). */
  private async upsertJob(
    orgId: string,
    scrapeRunId: string,
    mapped: NormalizedApifyJob,
    scrapedAt: Date,
  ): Promise<{ job: UpworkJob; created: boolean }> {
    const rawPayload = asPlainJsonRecord(mapped.rawPayload);
    const values = {
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
      rawPayload,
      scrapedAt,
    };

    const existing = await this.findExistingJob(orgId, mapped.externalJobId, mapped.jobUrl);
    if (existing) {
      await this.applyJobUpdate(existing, mapped, values);
      return { job: existing, created: false };
    }

    try {
      const created = await this.jobModel.create({
        orgId,
        externalJobId: mapped.externalJobId,
        scrapeRunId,
        ...values,
        postedAt: mapped.postedAt,
      });
      await created.reload({ attributes: [...UPWORK_JOB_ATTRS] });
      return { job: created, created: true };
    } catch (error) {
      // Concurrent insert or legacy row with different external id / URL shape.
      if (!(error instanceof UniqueConstraintError) && !(error instanceof ValidationError)) {
        throw error;
      }
      const raced = await this.findExistingJob(orgId, mapped.externalJobId, mapped.jobUrl);
      if (!raced) {
        throw error;
      }
      await this.applyJobUpdate(raced, mapped, values);
      return { job: raced, created: false };
    }
  }

  private async findExistingJob(
    orgId: string,
    externalJobId: string,
    jobUrl: string,
  ): Promise<UpworkJob | null> {
    const rows = await this.jobModel.findAll({
      where: {
        orgId,
        [Op.or]: [
          { externalJobId },
          { jobUrl },
          // Legacy rows may still carry ?referrer… on the URL or an older external id.
          { jobUrl: { [Op.like]: `%~0${externalJobId}/%` } },
          { jobUrl: { [Op.like]: `%~0${externalJobId}?%` } },
        ],
      },
      attributes: [...UPWORK_JOB_ATTRS],
      order: [['createdAt', 'ASC']],
      limit: 5,
    });

    if (rows.length === 0) return null;

    const byExternal = rows.find((row) => row.externalJobId === externalJobId);
    if (byExternal) return byExternal;
    const byExactUrl = rows.find((row) => row.jobUrl === jobUrl);
    if (byExactUrl) return byExactUrl;
    return rows[0] ?? null;
  }

  private async applyJobUpdate(
    job: UpworkJob,
    mapped: NormalizedApifyJob,
    values: {
      jobUrl: string;
      title: string;
      description: string;
      budget: string | null;
      jobType: string | null;
      experienceLevel: string | null;
      clientLocation: string | null;
      clientRating: number | null;
      clientSpent: string | null;
      skills: string[];
      proposals: number | null;
      postedTime: string | null;
      postedAt: Date | null;
      rawPayload: Record<string, unknown>;
      scrapedAt: Date;
    },
  ): Promise<void> {
    // If another row already owns the canonical external id, merge into that row.
    if (job.externalJobId !== mapped.externalJobId) {
      const owner = await this.jobModel.findOne({
        where: { orgId: job.orgId, externalJobId: mapped.externalJobId },
        attributes: [...UPWORK_JOB_ATTRS],
      });
      if (owner && owner.id !== job.id) {
        await owner.update({
          ...values,
          postedAt: mapped.postedAt ?? owner.postedAt,
        });
        await job.destroy();
        return;
      }
    }

    // Keep first-seen scrapeRunId; refresh listing fields and correct legacy external ids / URLs.
    await job.update({
      ...values,
      externalJobId: mapped.externalJobId,
      postedAt: mapped.postedAt ?? job.postedAt,
    });
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
