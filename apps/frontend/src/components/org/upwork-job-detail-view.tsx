'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Briefcase,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DASHBOARD_BASE_PATH,
  DEFAULT_UPWORK_SCORING_THRESHOLDS,
  resolveUpworkRelevancyBand,
  TEST_IDS,
} from '@constellation/shared';
import { Button, PageBackLink, StatusBadge } from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import { DetailRefreshButton } from '@/components/ui/detail-refresh-button';
import type { BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { useDashboardBreadcrumbs } from '@/hooks/use-dashboard-breadcrumbs';
import { Link } from '@/i18n/navigation';
import { showUserErrorToast } from '@/i18n/translate-user-message';
import { cn } from '@/lib/utils';
import {
  formatUpworkBreakdownPart,
  formatUpworkScoreOutOfTen,
} from '@/lib/upwork-score-display';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  getUpworkJob,
  type UpworkJobDto,
  type UpworkScoreBreakdownPartDto,
  type UpworkScoringConfigDto,
  type UpworkSkillMatchDto,
} from '@/services/freelancer-api';
import { JobProposalPanel } from '@/components/org/job-proposal-panel';

const JOBS_BASE = `${DASHBOARD_BASE_PATH.org}/upwork/jobs`;

type LoadState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{
      status: 'ready';
      job: UpworkJobDto;
      thresholds: UpworkScoringConfigDto['thresholds'];
      scoreBreakdown: readonly UpworkScoreBreakdownPartDto[];
      skillMatches: readonly UpworkSkillMatchDto[];
    }>;

type UpworkJobDetailViewProps = Readonly<{
  profileId: string;
  jobId: string;
}>;

function matchCardClass(band: 'green' | 'orange' | 'yellow' | 'red'): string {
  switch (band) {
    case 'green':
      return 'bg-emerald-500/10';
    case 'orange':
      return 'bg-amber-500/10';
    case 'yellow':
      return 'bg-yellow-500/10';
    case 'red':
      return 'bg-destructive/10';
  }
}

function SideSection({
  title,
  children,
  className,
}: Readonly<{
  title: string;
  children: ReactNode;
  className?: string;
}>) {
  return (
    <section className={cn('rounded-lg bg-muted/40 p-4', className)}>
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: Readonly<{
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
}>) {
  if (!value?.trim()) return null;
  return (
    <div className="flex gap-3">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function UpworkJobDetailView({ profileId, jobId }: UpworkJobDetailViewProps) {
  const t = useTranslations('org.upwork.jobs');
  const tList = useTranslations('dashboard.admin.listControls');
  const tErrors = useTranslations();
  const [loadState, setLoadState] = useState<LoadState>(
    profileId ? { status: 'loading' } : { status: 'error' },
  );
  const [refreshing, setRefreshing] = useState(false);

  const job = loadState.status === 'ready' ? loadState.job : null;
  const thresholds =
    loadState.status === 'ready' ? loadState.thresholds : DEFAULT_UPWORK_SCORING_THRESHOLDS;
  const scoreBreakdown = loadState.status === 'ready' ? loadState.scoreBreakdown : [];
  const skillMatches = loadState.status === 'ready' ? loadState.skillMatches : [];
  const jobsListHref = JOBS_BASE;

  const breadcrumbs = useMemo((): readonly BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: t('title'), href: jobsListHref }];
    if (job) {
      items.push({ label: job.title, href: `${JOBS_BASE}/${job.id}?profileId=${profileId}` });
    } else {
      items.push({ label: t('detailTitle') });
    }
    return items;
  }, [job, jobsListHref, profileId, t]);

  useDashboardBreadcrumbs(breadcrumbs);

  const load = useCallback(async () => {
    if (!profileId) {
      setLoadState({ status: 'error' });
      return;
    }
    setLoadState({ status: 'loading' });
    try {
      const result = await getUpworkJob(profileId, jobId);
      const {
        scoringThresholds,
        scoreBreakdown: breakdown,
        skillMatches: matches,
        ...nextJob
      } = result;
      setLoadState({
        status: 'ready',
        job: nextJob,
        thresholds: scoringThresholds,
        scoreBreakdown: breakdown,
        skillMatches: matches,
      });
    } catch (error) {
      setLoadState({ status: 'error' });
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    }
  }, [jobId, profileId, tErrors]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    if (!profileId) return;
    setRefreshing(true);
    try {
      const result = await getUpworkJob(profileId, jobId);
      const {
        scoringThresholds,
        scoreBreakdown: breakdown,
        skillMatches: matches,
        ...nextJob
      } = result;
      setLoadState({
        status: 'ready',
        job: nextJob,
        thresholds: scoringThresholds,
        scoreBreakdown: breakdown,
        skillMatches: matches,
      });
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setRefreshing(false);
    }
  }, [jobId, profileId, tErrors]);

  const backLink = (
    <PageBackLink href={jobsListHref} label={t('backToList')} testId={TEST_IDS.upworkJobs.backToList} LinkComponent={Link} />
  );

  if (loadState.status === 'loading') {
    return null;
  }

  if (loadState.status === 'error' || !job) {
    return (
      <AdminPageLayout title={t('detailTitle')} backLink={backLink}>
        <div className="flex flex-col items-end gap-3">
          <p className="w-full text-sm text-destructive">
            {profileId ? t('loadError') : t('missingProfile')}
          </p>
          {profileId ? (
            <Button type="button" variant="outline" onClick={load} testId={TEST_IDS.upworkJobs.retry} fullWidth={false}>
              {t('retry')}
            </Button>
          ) : null}
        </div>
      </AdminPageLayout>
    );
  }

  const postedAtLabel = job.postedAt ? new Date(job.postedAt).toLocaleString() : null;
  const postedRelative = job.postedTime?.trim() || null;
  const hasClientInfo = Boolean(job.clientLocation || job.clientRating != null || job.clientSpent);
  const hasActivity = Boolean(job.scrapedAt);
  const band = resolveUpworkRelevancyBand(job.relevancyScore, thresholds);
  const breakdownTitle = scoreBreakdown
    .map((part) => `${t(`breakdown.${part.key}`)}: ${formatUpworkBreakdownPart(part.contribution, part.weight)}`)
    .join('\n');

  return (
    <AdminPageLayout
      title={job.title}
      description={t('detailDescription')}
      backLink={backLink}
      width="full"
      className="mx-auto max-w-6xl"
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DetailRefreshButton
            ariaLabel={tList('refreshDetailLabel')}
            isRefreshing={refreshing}
            onRefresh={onRefresh}
            testId={TEST_IDS.upworkJobs.detailRefresh}
          />
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noreferrer"
            data-testid={TEST_IDS.upworkJobs.openJob(job.id)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            {t('table.openJob')}
          </a>
        </div>
      }
    >
      {(job.jobType || job.experienceLevel || job.isNewInRun) ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {job.jobType ? <StatusBadge variant="secondary" label={job.jobType} /> : null}
          {job.experienceLevel ? <StatusBadge variant="muted" label={job.experienceLevel} /> : null}
          {job.isNewInRun ? <StatusBadge variant="emerald" label={t('table.new')} /> : null}
        </div>
      ) : null}

      <div
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
        data-testid={TEST_IDS.upworkJobs.detail}
      >
        <div className="min-w-0 space-y-6">
          <section className="rounded-lg bg-muted/40 p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">{t('detail.description')}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {job.description.trim() || t('detail.noDescription')}
            </p>
          </section>

          <section className="rounded-lg bg-muted/40 p-5" data-testid={TEST_IDS.upworkJobs.skillMatches}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">{t('detail.skills')}</h2>
              {skillMatches.length > 0 ? (
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
                    {t('detail.skillsLegendMatched')}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" aria-hidden />
                    {t('detail.skillsLegendMissing')}
                  </span>
                </div>
              ) : null}
            </div>
            {skillMatches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillMatches.map((item) => (
                  <span
                    key={item.skill}
                    data-testid={
                      item.matched
                        ? TEST_IDS.upworkJobs.skillMatched(item.skill)
                        : TEST_IDS.upworkJobs.skillMissing(item.skill)
                    }
                  >
                    <StatusBadge
                      variant={item.matched ? 'emerald' : 'amber'}
                      label={item.skill}
                      className={item.matched ? undefined : 'ring-1 ring-amber-500/40'}
                    />
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('detail.skillsEmpty')}</p>
            )}
          </section>

          <JobProposalPanel profileId={profileId} jobId={jobId} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <SideSection title={t('detail.match')} className={matchCardClass(band)}>
            <div title={breakdownTitle || undefined}>
              <p className="text-xs font-medium text-muted-foreground">{t('detail.relevancyScore')}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
                {formatUpworkScoreOutOfTen(job.relevancyScore)}/10
              </p>
              {scoreBreakdown.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {scoreBreakdown.map((part) => (
                    <li key={part.key} className="flex items-center justify-between gap-2">
                      <span>{t(`breakdown.${part.key}`)}</span>
                      <span className="tabular-nums text-foreground">
                        {formatUpworkBreakdownPart(part.contribution, part.weight)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {job.isNewInRun ? <StatusBadge variant="emerald" label={t('table.new')} /> : null}
          </SideSection>

          <SideSection title={t('detail.aboutJob')}>
            <MetaRow icon={<Wallet className="size-4" />} label={t('detail.budget')} value={job.budget} />
            <MetaRow icon={<Briefcase className="size-4" />} label={t('detail.jobType')} value={job.jobType} />
            <MetaRow
              icon={<Sparkles className="size-4" />}
              label={t('detail.experienceLevel')}
              value={job.experienceLevel}
            />
            <MetaRow
              icon={<Users className="size-4" />}
              label={t('detail.proposals')}
              value={job.proposals != null ? String(job.proposals) : null}
            />
            <MetaRow icon={<Clock className="size-4" />} label={t('detail.posted')} value={postedRelative} />
            <MetaRow icon={<Clock className="size-4" />} label={t('detail.postedAt')} value={postedAtLabel} />
          </SideSection>

          {hasClientInfo ? (
            <SideSection title={t('detail.aboutClient')}>
              <MetaRow
                icon={<MapPin className="size-4" />}
                label={t('detail.clientLocation')}
                value={job.clientLocation}
              />
              <MetaRow
                icon={<Star className="size-4" />}
                label={t('detail.clientRating')}
                value={job.clientRating != null ? String(job.clientRating) : null}
              />
              <MetaRow
                icon={<Wallet className="size-4" />}
                label={t('detail.clientSpent')}
                value={job.clientSpent}
              />
            </SideSection>
          ) : null}

          {hasActivity ? (
            <SideSection title={t('detail.activity')}>
              <MetaRow
                icon={<Clock className="size-4" />}
                label={t('detail.scrapedAt')}
                value={new Date(job.scrapedAt).toLocaleString()}
              />
            </SideSection>
          ) : null}
        </aside>
      </div>
    </AdminPageLayout>
  );
}
