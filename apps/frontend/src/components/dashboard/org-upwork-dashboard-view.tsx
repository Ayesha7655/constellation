'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, ExternalLink, Radar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DASHBOARD_BASE_PATH, DEFAULT_UPWORK_SCORING_THRESHOLDS, ORG, TEST_IDS } from '@constellation/shared';
import { Button, StatusBadge } from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { showUserErrorToast } from '@/i18n/translate-user-message';
import { cn } from '@/lib/utils';
import { upworkRelevancyBadgeVariant } from '@/lib/upwork-relevancy-badge';
import { translateAuthRequestError } from '@/lib/user-messages';
import { getUpworkOverview, type UpworkOverviewDto } from '@/services/freelancer-api';

type LoadState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'ready'; data: UpworkOverviewDto }>;

const linkButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors';

function profileLabel(profile: UpworkOverviewDto['profiles'][number], fallback: string): string {
  return profile.label?.trim() || profile.title?.trim() || fallback;
}

export function OrgUpworkDashboardView() {
  const t = useTranslations('org.pages.overview');
  const tProfile = useTranslations('org.upwork.profile');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const canRead = permissions.some((p) => p.key === ORG.FREELANCER_PROFILE_READ);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async () => {
    if (!canRead) {
      setState({
        status: 'ready',
        data: {
          extensionConnected: false,
          scoringThresholds: DEFAULT_UPWORK_SCORING_THRESHOLDS,
          pendingDraft: null,
          profiles: [],
          recentJobs: [],
        },
      });
      return;
    }
    setState({ status: 'loading' });
    try {
      const data = await getUpworkOverview();
      setState({ status: 'ready', data });
    } catch (error) {
      setState({ status: 'error' });
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    }
  }, [canRead, tErrors]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading') {
    return null;
  }

  if (state.status === 'error') {
    return (
      <AdminPageLayout title={t('title')} description={t('description')}>
        <div className="flex flex-col items-end gap-3">
          <p className="w-full text-sm text-destructive">{t('loadError')}</p>
          <Button type="button" variant="outline" onClick={load} fullWidth={false}>
            {t('retry')}
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  const { data } = state;
  const fresh = !data.extensionConnected && data.profiles.length === 0 && !data.pendingDraft;

  return (
    <AdminPageLayout title={t('title')} description={t('description')}>
      {fresh ? (
        <section className="rounded-lg border border-border bg-card p-6">
          <div
            className="mb-4 flex size-12 items-center justify-center rounded-md border border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300"
            aria-hidden
          >
            <Radar className="size-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t('freshTitle')}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t('freshDescription')}</p>
          <div className="mt-4 flex justify-end">
            <Link
              href={`${DASHBOARD_BASE_PATH.org}/upwork/extension`}
              data-testid={TEST_IDS.upworkDashboard.connectExtension}
              className={cn(linkButtonClass, 'bg-primary text-primary-foreground hover:opacity-90')}
            >
              <Radar className="size-4 shrink-0" aria-hidden />
              {t('connectExtension')}
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-8">
          {data.profiles.length === 0 ? (
            <section
              className="rounded-lg border border-border bg-card p-6"
              data-testid={TEST_IDS.upworkDashboard.syncHint}
            >
              <h2 className="text-lg font-semibold text-foreground">{t('syncTitle')}</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t('syncDescription')}</p>
              {data.pendingDraft ? (
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">{t('draftWaiting')}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Link
                  href={`${DASHBOARD_BASE_PATH.org}/upwork/profile`}
                  data-testid={TEST_IDS.upworkDashboard.goProfiles}
                  className={cn(linkButtonClass, 'border border-border bg-background hover:bg-muted')}
                >
                  {t('goProfiles')}
                </Link>
                <Link
                  href={`${DASHBOARD_BASE_PATH.org}/upwork/extension`}
                  data-testid={TEST_IDS.upworkDashboard.connectExtension}
                  className={cn(linkButtonClass, 'bg-primary text-primary-foreground hover:opacity-90')}
                >
                  {t('openExtension')}
                </Link>
              </div>
            </section>
          ) : (
            <section data-testid={TEST_IDS.upworkDashboard.profilesSection}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{t('profilesTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{t('profilesDescription')}</p>
                </div>
                <Link
                  href={`${DASHBOARD_BASE_PATH.org}/upwork/profile`}
                  data-testid={TEST_IDS.upworkDashboard.goProfiles}
                  className={cn(linkButtonClass, 'border border-border bg-background hover:bg-muted')}
                >
                  {t('goProfiles')}
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.profiles.slice(0, 6).map((profile) => (
                  <Link
                    key={profile.id}
                    href={`${DASHBOARD_BASE_PATH.org}/upwork/profile/${profile.id}`}
                    data-testid={TEST_IDS.upworkDashboard.profileCard(profile.id)}
                    className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
                  >
                    <div
                      className="mb-3 flex size-9 items-center justify-center rounded-md border border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                      aria-hidden
                    >
                      <Briefcase className="size-4" />
                    </div>
                    <p className="truncate font-medium text-foreground">
                      {profileLabel(profile, tProfile('unnamedProfile'))}
                    </p>
                    <div className="mt-2">
                      <StatusBadge
                        variant={profile.source === 'extension' ? 'sky' : 'secondary'}
                        label={tProfile(`source.${profile.source}`)}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.recentJobs.length > 0 ? (
            <section data-testid={TEST_IDS.upworkDashboard.jobsSection}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{t('jobsTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{t('jobsDescription')}</p>
                </div>
                <Link
                  href={`${DASHBOARD_BASE_PATH.org}/upwork/jobs`}
                  data-testid={TEST_IDS.upworkDashboard.goJobs}
                  className={cn(linkButtonClass, 'border border-border bg-background hover:bg-muted')}
                >
                  {t('goJobs')}
                </Link>
              </div>
              <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                {data.recentJobs.map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <a
                      href={`${DASHBOARD_BASE_PATH.org}/upwork/jobs/${job.id}?profileId=${job.freelancerProfileId}`}
                      target="_blank"
                      rel="noreferrer"
                      data-testid={TEST_IDS.upworkDashboard.jobCard(job.id)}
                      className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <p className="truncate font-medium text-foreground hover:underline">{job.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          variant={upworkRelevancyBadgeVariant(
                            job.relevancyScore,
                            data.scoringThresholds,
                          )}
                          label={String(job.relevancyScore)}
                        />
                        <p className="text-xs text-muted-foreground">
                          {job.budget ?? t('budgetUnknown')}
                        </p>
                      </div>
                    </a>
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t('openJob')}
                    >
                      <ExternalLink className="size-4" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </AdminPageLayout>
  );
}
