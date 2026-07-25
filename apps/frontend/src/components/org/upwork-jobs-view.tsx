'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { ExternalLink, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DASHBOARD_BASE_PATH, DEFAULT_UPWORK_SCORING_THRESHOLDS, ORG, TEST_IDS } from '@constellation/shared';
import {
  Button,
  DataTable,
  dataTableColumnWidth,
  FormActions,
  PaginatedTableLayout,
  Pagination,
  SidePanel,
  StatusBadge,
  type DataTableColumn,
} from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import { DetailRefreshButton } from '@/components/ui/detail-refresh-button';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { getDefaultPageSize } from '@/lib/pagination';
import { upworkRelevancyBadgeVariant } from '@/lib/upwork-relevancy-badge';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  createScrapeRun,
  getScrapeRun,
  listFreelancerProfiles,
  listScrapeRuns,
  listUpworkJobs,
  type FreelancerProfileDto,
  type ScrapeRunDto,
  type UpworkJobDto,
  type UpworkScoringConfigDto,
} from '@/services/freelancer-api';
import type { PaginationMeta } from '@/types/pagination';

const LIST_PAGE_SIZE = getDefaultPageSize();

function profileDisplayName(profile: FreelancerProfileDto, fallback: string): string {
  return profile.label?.trim() || profile.title?.trim() || fallback;
}

function jobDetailHref(job: UpworkJobDto): string {
  return `${DASHBOARD_BASE_PATH.org}/upwork/jobs/${job.id}?profileId=${job.freelancerProfileId}`;
}

function runStatusVariant(
  status: ScrapeRunDto['status'],
): 'approved' | 'pending' | 'rejected' | 'inactive' | 'secondary' {
  switch (status) {
    case 'succeeded':
      return 'approved';
    case 'failed':
      return 'rejected';
    case 'running':
    case 'queued':
      return 'pending';
    default:
      return 'secondary';
  }
}

type JobsLoadState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'ready'; jobs: readonly UpworkJobDto[]; meta: PaginationMeta }>;

type JobFilters = Readonly<{
  minScore: number;
  sort: 'score' | 'date';
  scrapedFrom: string;
  scrapedTo: string;
  scrapeRunId: string | null;
  newOnly: boolean;
}>;

const EMPTY_FILTERS: JobFilters = {
  minScore: 0,
  sort: 'score',
  scrapedFrom: '',
  scrapedTo: '',
  scrapeRunId: null,
  newOnly: false,
};

export function UpworkJobsView() {
  const t = useTranslations('org.upwork.jobs');
  const tProfile = useTranslations('org.upwork.profile');
  const tList = useTranslations('dashboard.admin.listControls');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const canCreateRun = permissions.some((p) => p.key === ORG.SCRAPE_RUNS_CREATE);
  const canReadJobs = permissions.some((p) => p.key === ORG.UPWORK_JOBS_READ);
  const canReadRuns = permissions.some((p) => p.key === ORG.SCRAPE_RUNS_READ);

  const [profiles, setProfiles] = useState<FreelancerProfileDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<JobFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<JobFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [jobsState, setJobsState] = useState<JobsLoadState>({ status: 'loading' });
  const [scoringThresholds, setScoringThresholds] = useState<UpworkScoringConfigDto['thresholds']>(
    DEFAULT_UPWORK_SCORING_THRESHOLDS,
  );
  const [latestRun, setLatestRun] = useState<ScrapeRunDto | null>(null);
  const [recentRuns, setRecentRuns] = useState<ScrapeRunDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async (
    profileId: string,
    nextPage: number,
    search: string,
    nextFilters: JobFilters,
    options?: { silent?: boolean },
  ) => {
    if (!options?.silent) {
      setJobsState({ status: 'loading' });
    }
    try {
      const response = await listUpworkJobs(profileId, {
        page: nextPage,
        limit: LIST_PAGE_SIZE,
        q: search.trim() || undefined,
        minScore: nextFilters.minScore > 0 ? nextFilters.minScore : undefined,
        sort: nextFilters.sort,
        scrapedFrom: nextFilters.scrapedFrom || undefined,
        scrapedTo: nextFilters.scrapedTo || undefined,
        scrapeRunId: nextFilters.scrapeRunId ?? undefined,
        newOnly: nextFilters.newOnly || undefined,
        trackGlobalLoading: options?.silent === true ? false : undefined,
      });
      setJobsState({ status: 'ready', jobs: response.items, meta: response.meta });
      setScoringThresholds(response.scoringThresholds);
    } catch (error) {
      if (!options?.silent) {
        setJobsState({ status: 'error' });
      }
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    }
  }, [tErrors]);

  const loadRuns = useCallback(async (profileId: string, options?: { silent?: boolean }) => {
    if (!canReadRuns) {
      setLatestRun(null);
      setRecentRuns([]);
      return;
    }
    try {
      const response = await listScrapeRuns(profileId, {
        page: 1,
        limit: 8,
        trackGlobalLoading: options?.silent === true ? false : undefined,
      });
      setRecentRuns(response.items);
      setLatestRun(response.items[0] ?? null);
    } catch {
      setLatestRun(null);
      setRecentRuns([]);
    }
  }, [canReadRuns]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await listFreelancerProfiles();
        if (cancelled) return;
        setProfiles(list.profiles);
        const firstId = list.profiles[0]?.id ?? null;
        setSelectedId(firstId);
        if (firstId && canReadJobs) {
          await Promise.all([loadJobs(firstId, 1, '', EMPTY_FILTERS), loadRuns(firstId)]);
        } else {
          setJobsState({
            status: 'ready',
            jobs: [],
            meta: { page: 1, limit: LIST_PAGE_SIZE, total: 0, totalPages: 0 },
          });
        }
      } catch (error) {
        if (!cancelled) {
          setJobsState({ status: 'error' });
          showUserErrorToast(translateAuthRequestError(error, tErrors));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canReadJobs, loadJobs, loadRuns, tErrors]);

  const activeRunId =
    latestRun && (latestRun.status === 'queued' || latestRun.status === 'running')
      ? latestRun.id
      : null;

  useEffect(() => {
    if (!selectedId || !activeRunId) return;

    let cancelled = false;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const run = await getScrapeRun(selectedId, activeRunId, { trackGlobalLoading: false });
          if (cancelled) return;
          setLatestRun(run);
          setRecentRuns((prev) => prev.map((item) => (item.id === run.id ? run : item)));
          if (run.status === 'succeeded' || run.status === 'failed') {
            await loadJobs(selectedId, page, q, filters, { silent: true });
            await loadRuns(selectedId, { silent: true });
          }
        } catch {
          /* keep polling */
        }
      })();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeRunId, filters, loadJobs, loadRuns, page, q, selectedId]);

  const onSelectProfile = useCallback(async (event: ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value || null;
    setSelectedId(nextId);
    setPage(1);
    setFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
    if (!nextId || !canReadJobs) {
      setJobsState({
        status: 'ready',
        jobs: [],
        meta: { page: 1, limit: LIST_PAGE_SIZE, total: 0, totalPages: 0 },
      });
      setLatestRun(null);
      setRecentRuns([]);
      return;
    }
    await Promise.all([loadJobs(nextId, 1, q, EMPTY_FILTERS), loadRuns(nextId)]);
  }, [canReadJobs, loadJobs, loadRuns, q]);

  const onRefresh = useCallback(async () => {
    if (!selectedId || !canReadJobs) return;
    setRefreshing(true);
    try {
      await Promise.all([loadJobs(selectedId, page, q, filters), loadRuns(selectedId)]);
    } finally {
      setRefreshing(false);
    }
  }, [canReadJobs, filters, loadJobs, loadRuns, page, q, selectedId]);

  const onRunNow = useCallback(async () => {
    if (!selectedId) {
      showUserErrorToast(t('needProfile'));
      return;
    }
    setBusy(true);
    try {
      const run = await createScrapeRun(selectedId);
      setLatestRun(run);
      setRecentRuns((prev) => [run, ...prev.filter((item) => item.id !== run.id)]);
      showUserSuccessToast(t('runStarted'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [selectedId, t, tErrors]);

  const onSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQ(event.target.value);
  }, []);

  const onSearchSubmit = useCallback(async () => {
    if (!selectedId || !canReadJobs) return;
    setPage(1);
    await loadJobs(selectedId, 1, q, filters);
  }, [canReadJobs, filters, loadJobs, q, selectedId]);

  const onSearchKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void onSearchSubmit();
    }
  }, [onSearchSubmit]);

  const onDraftMinScoreChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const parsed = Number.parseInt(event.target.value, 10);
    setDraftFilters((prev) => ({
      ...prev,
      minScore: Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0,
    }));
  }, []);

  const onDraftSortChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setDraftFilters((prev) => ({
      ...prev,
      sort: event.target.value === 'date' ? 'date' : 'score',
    }));
  }, []);

  const onDraftFromChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDraftFilters((prev) => ({ ...prev, scrapedFrom: event.target.value }));
  }, []);

  const onDraftToChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDraftFilters((prev) => ({ ...prev, scrapedTo: event.target.value }));
  }, []);

  const onOpenFilters = useCallback(() => {
    setDraftFilters(filters);
    setFiltersOpen(true);
  }, [filters]);

  const onFiltersOpenChange = useCallback((open: boolean) => {
    setFiltersOpen(open);
  }, []);

  const onApplyFilters = useCallback(async () => {
    if (!selectedId || !canReadJobs) return;
    setFilters(draftFilters);
    setPage(1);
    setFiltersOpen(false);
    await loadJobs(selectedId, 1, q, draftFilters);
  }, [canReadJobs, draftFilters, loadJobs, q, selectedId]);

  const onClearFilters = useCallback(async () => {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setFiltersOpen(false);
    if (selectedId && canReadJobs) {
      await loadJobs(selectedId, 1, q, EMPTY_FILTERS);
    }
  }, [canReadJobs, loadJobs, q, selectedId]);

  const onShowNewFromRun = useCallback(async (runId: string) => {
    const next: JobFilters = {
      ...EMPTY_FILTERS,
      scrapeRunId: runId,
      newOnly: true,
      sort: 'score',
    };
    setDraftFilters(next);
    setFilters(next);
    setPage(1);
    setFiltersOpen(false);
    if (selectedId && canReadJobs) {
      await loadJobs(selectedId, 1, q, next);
    }
  }, [canReadJobs, loadJobs, q, selectedId]);

  const onPageChange = useCallback(async (nextPage: number) => {
    if (!selectedId || !canReadJobs) return;
    setPage(nextPage);
    await loadJobs(selectedId, nextPage, q, filters);
  }, [canReadJobs, filters, loadJobs, q, selectedId]);

  const onOpenJobDetail = useCallback((job: UpworkJobDto) => {
    window.open(jobDetailHref(job), '_blank', 'noopener,noreferrer');
  }, []);

  const onStopRowNavigate = useCallback((event: MouseEvent) => {
    event.stopPropagation();
  }, []);

  const columns = useMemo((): DataTableColumn<UpworkJobDto>[] => {
    return [
      {
        id: 'title',
        header: t('table.title'),
        widthClassName: dataTableColumnWidth.prose,
        cellClassName: 'max-w-0',
        cell: (job) => {
          const subtitle = [job.jobType, job.experienceLevel].filter(Boolean).join(' · ');
          return (
            <div className="min-w-0">
              <a
                href={jobDetailHref(job)}
                target="_blank"
                rel="noreferrer"
                onClick={onStopRowNavigate}
                title={job.title}
                data-testid={TEST_IDS.upworkJobs.openDetail(job.id)}
                className="line-clamp-3 font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {job.title}
              </a>
              {subtitle ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground" title={subtitle}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: 'score',
        header: t('table.details'),
        widthClassName: dataTableColumnWidth.details,
        cell: (job) => (
            <div className="flex flex-col items-start gap-1.5">
              <StatusBadge
                variant={upworkRelevancyBadgeVariant(job.relevancyScore, scoringThresholds)}
                label={t('table.score', { score: job.relevancyScore })}
              />
              {job.isNewInRun ? <StatusBadge variant="emerald" label={t('table.new')} /> : null}
            </div>
        ),
      },
      {
        id: 'budget',
        header: t('table.budget'),
        widthClassName: dataTableColumnWidth.medium,
        cellClassName: 'max-w-0',
        cell: (job) => {
          const budget = job.budget ?? t('table.budgetUnknown');
          return (
            <p className="truncate text-sm text-foreground" title={budget}>
              {budget}
            </p>
          );
        },
      },
      {
        id: 'posted',
        header: t('table.posted'),
        widthClassName: dataTableColumnWidth.medium,
        cellClassName: 'max-w-0',
        cell: (job) => {
          const posted =
            job.postedTime ?? (job.postedAt ? new Date(job.postedAt).toLocaleDateString() : '—');
          return (
            <p className="truncate text-sm text-muted-foreground" title={posted}>
              {posted}
            </p>
          );
        },
      },
      {
        id: 'actions',
        header: t('table.actions'),
        widthClassName: 'w-14',
        cellClassName: 'text-end',
        cell: (job) => (
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onStopRowNavigate}
            data-testid={TEST_IDS.upworkJobs.openJob(job.id)}
            className="inline-flex rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t('table.openJob')}
          >
            <ExternalLink className="size-4" aria-hidden />
          </a>
        ),
      },
    ];
  }, [onStopRowNavigate, scoringThresholds, t]);

  const runActive = latestRun?.status === 'queued' || latestRun?.status === 'running';
  const filtersActive =
    filters.minScore > 0 ||
    Boolean(filters.scrapedFrom) ||
    Boolean(filters.scrapedTo) ||
    Boolean(filters.scrapeRunId) ||
    filters.sort !== 'score';

  return (
    <AdminPageLayout
      title={t('title')}
      description={t('description')}
      fillViewport
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DetailRefreshButton
            ariaLabel={tList('refreshLabel')}
            isRefreshing={refreshing}
            onRefresh={onRefresh}
            testId={TEST_IDS.upworkJobs.refresh}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onOpenFilters}
            testId={TEST_IDS.upworkJobs.openFilters}
            fullWidth={false}
            className="inline-flex items-center gap-2"
          >
            <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
            {filtersActive ? t('filtersActive') : t('filters')}
          </Button>
          {canCreateRun ? (
            <Button
              type="button"
              onClick={onRunNow}
              disabled={busy || !selectedId || runActive}
              testId={TEST_IDS.upworkJobs.runNow}
              fullWidth={false}
            >
              {runActive ? t('running') : t('runNow')}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="mb-4 flex shrink-0 flex-wrap items-end justify-end gap-4 pb-4">
        <div className="me-auto min-w-[12rem] flex-1 space-y-1">
          <label className="block text-sm font-medium text-foreground" htmlFor="upwork-jobs-profile">
            {t('selectProfile')}
          </label>
          <select
            id="upwork-jobs-profile"
            data-testid={TEST_IDS.upworkJobs.profileSelect}
            className="w-full rounded-lg border-0 bg-muted px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedId ?? ''}
            onChange={onSelectProfile}
            disabled={busy}
          >
            {profiles.length === 0 ? <option value="">{tProfile('noProfiles')}</option> : null}
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profileDisplayName(profile, tProfile('unnamedProfile'))}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[14rem] flex-1 space-y-1 sm:max-w-sm">
          <label className="block text-sm font-medium text-foreground" htmlFor="upwork-jobs-search">
            {t('search')}
          </label>
          <input
            id="upwork-jobs-search"
            data-testid={TEST_IDS.upworkJobs.search}
            className="w-full rounded-lg border-0 bg-muted px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={q}
            onChange={onSearchChange}
            onKeyDown={onSearchKeyDown}
            placeholder={t('searchPlaceholder')}
          />
        </div>
      </div>

      {latestRun ? (
        <div className="mb-4 shrink-0 rounded-xl bg-card p-3 text-sm shadow-sm" data-testid={TEST_IDS.upworkJobs.runStatus}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">{t('latestRun')}</span>
            <StatusBadge variant={runStatusVariant(latestRun.status)} label={t(`status.${latestRun.status}`)} />
            <span className="text-muted-foreground">
              {t('runCounts', {
                fetched: latestRun.totalFetched,
                filtered: latestRun.totalFiltered,
                saved: latestRun.totalSaved,
                newCount: latestRun.totalNew ?? 0,
              })}
            </span>
          </div>
          {latestRun.error ? <p className="mt-2 text-destructive">{latestRun.error}</p> : null}
        </div>
      ) : null}

      {!selectedId ? (
        <p className="text-sm text-muted-foreground">{t('needProfile')}</p>
      ) : jobsState.status === 'error' ? (
        <div className="flex flex-col items-end gap-3">
          <p className="w-full text-sm text-destructive">{t('loadError')}</p>
          <Button type="button" variant="outline" onClick={onRefresh} testId={TEST_IDS.upworkJobs.retry} fullWidth={false}>
            {t('retry')}
          </Button>
        </div>
      ) : jobsState.status === 'ready' ? (
        <PaginatedTableLayout
          table={
            <DataTable
              columns={columns}
              rows={jobsState.jobs}
              getRowKey={(job) => job.id}
              getRowTestId={(job) => TEST_IDS.upworkJobs.row(job.id)}
              onRowClick={onOpenJobDetail}
              emptyMessage={t('table.empty')}
              scrollBody
              testId={TEST_IDS.upworkJobs.table}
            />
          }
          pagination={
            <Pagination
              meta={jobsState.meta}
              onPageChange={onPageChange}
              previousLabel={t('pagination.previous')}
              nextLabel={t('pagination.next')}
              pageLabel={t('pagination.pageOf', {
                page: jobsState.meta.page,
                totalPages: Math.max(1, jobsState.meta.totalPages),
              })}
              testId={TEST_IDS.upworkJobs.pagination}
            />
          }
        />
      ) : null}

      <SidePanel
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        title={t('filtersTitle')}
        description={t('filtersDescription')}
        testId={TEST_IDS.upworkJobs.filtersPanel}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground" htmlFor="upwork-jobs-min-score">
              {t('minScore')}
            </label>
            <input
              id="upwork-jobs-min-score"
              data-testid={TEST_IDS.upworkJobs.minScore}
              type="number"
              min={0}
              max={100}
              className="w-full rounded-lg border-0 bg-muted px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={draftFilters.minScore}
              onChange={onDraftMinScoreChange}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground" htmlFor="upwork-jobs-sort">
              {t('sort')}
            </label>
            <select
              id="upwork-jobs-sort"
              data-testid={TEST_IDS.upworkJobs.sort}
              className="w-full rounded-lg border-0 bg-muted px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={draftFilters.sort}
              onChange={onDraftSortChange}
            >
              <option value="score">{t('sortScore')}</option>
              <option value="date">{t('sortDate')}</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground" htmlFor="upwork-jobs-from">
                {t('scrapedFrom')}
              </label>
              <input
                id="upwork-jobs-from"
                type="date"
                data-testid={TEST_IDS.upworkJobs.scrapedFrom}
                className="w-full rounded-lg border-0 bg-muted px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={draftFilters.scrapedFrom}
                onChange={onDraftFromChange}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground" htmlFor="upwork-jobs-to">
                {t('scrapedTo')}
              </label>
              <input
                id="upwork-jobs-to"
                type="date"
                data-testid={TEST_IDS.upworkJobs.scrapedTo}
                className="w-full rounded-lg border-0 bg-muted px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={draftFilters.scrapedTo}
                onChange={onDraftToChange}
              />
            </div>
          </div>

          {recentRuns.length > 0 ? (
            <div className="space-y-2" data-testid={TEST_IDS.upworkJobs.runList}>
              <p className="text-sm font-medium text-foreground">{t('runHistory')}</p>
              <ul className="space-y-2">
                {recentRuns.map((run) => (
                  <li key={run.id} className="rounded-xl bg-card p-3 text-sm shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge variant={runStatusVariant(run.status)} label={t(`status.${run.status}`)} />
                      <span className="text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('runCounts', {
                        fetched: run.totalFetched,
                        filtered: run.totalFiltered,
                        saved: run.totalSaved,
                        newCount: run.totalNew ?? 0,
                      })}
                    </p>
                    {run.status === 'succeeded' && (run.totalNew ?? 0) > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2"
                        onClick={() => void onShowNewFromRun(run.id)}
                        testId={TEST_IDS.upworkJobs.runShowNew(run.id)}
                        fullWidth={false}
                      >
                        {t('showNewFromRun', { count: run.totalNew })}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <FormActions className="justify-end">
            <Button type="button" variant="outline" onClick={onClearFilters} testId={TEST_IDS.upworkJobs.clearFilters} fullWidth={false}>
              {t('clearFilters')}
            </Button>
            <Button type="button" onClick={onApplyFilters} testId={TEST_IDS.upworkJobs.applyFilters} fullWidth={false}>
              {t('applyFilters')}
            </Button>
          </FormActions>
        </div>
      </SidePanel>
    </AdminPageLayout>
  );
}
