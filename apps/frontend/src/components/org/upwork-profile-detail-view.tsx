'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Form, Formik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DASHBOARD_BASE_PATH, ORG, TEST_IDS } from '@constellation/shared';
import { Button, FormActions, FormGrid, FormGridFullWidth, PageBackLink, StatusBadge } from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import { FormikTextField } from '@/components/form/formik-text-field';
import { FormikTextareaField } from '@/components/form/formik-textarea-field';
import { DetailRefreshButton } from '@/components/ui/detail-refresh-button';
import type { BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { useDashboardBreadcrumbs } from '@/hooks/use-dashboard-breadcrumbs';
import { Link } from '@/i18n/navigation';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  deleteFreelancerProfile,
  getFreelancerProfile,
  listPortfolioProjects,
  updateFreelancerProfile,
  type FreelancerProfileDto,
  type PortfolioProjectDto,
} from '@/services/freelancer-api';
import {
  profileDisplayName,
  profileToValues,
  splitCsv,
  type ProfileFormValues,
} from '@/components/org/upwork-profile-form-utils';
import { PortfolioProjectPanel } from '@/components/org/portfolio-project-panel';

const PROFILE_BASE = `${DASHBOARD_BASE_PATH.org}/upwork/profile`;

type LoadState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{
      status: 'ready';
      profile: FreelancerProfileDto;
      projects: readonly PortfolioProjectDto[];
      portfolioError: boolean;
    }>;

type UpworkProfileDetailViewProps = Readonly<{
  profileId: string;
}>;

function PortfolioSection({
  projects,
  portfolioError,
  onRetry,
  retryLabel,
  onOpenProject,
}: Readonly<{
  projects: readonly PortfolioProjectDto[];
  portfolioError: boolean;
  onRetry: () => void;
  retryLabel: string;
  onOpenProject: (project: PortfolioProjectDto) => void;
}>) {
  const t = useTranslations('org.upwork.profile.portfolio');

  return (
    <section className="mt-8 space-y-4" data-testid={TEST_IDS.upworkProfile.portfolioSection}>
      <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
      {portfolioError ? (
        <div className="flex flex-col items-end gap-3">
          <p className="w-full text-sm text-destructive">{t('loadError')}</p>
          <Button type="button" variant="outline" onClick={onRetry} fullWidth={false}>
            {retryLabel}
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid={TEST_IDS.upworkProfile.portfolioEmpty}>
          {t('empty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => {
            const thumbnail = project.imageUrls[0];
            return (
              <li
                key={project.id}
                data-testid={TEST_IDS.upworkProfile.portfolioCard(project.id)}
                className="rounded-lg bg-muted/40 p-4"
              >
                <div className="flex gap-4">
                  {thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Upwork CDN URLs; not in next/image remotePatterns
                    <img
                      src={thumbnail}
                      alt=""
                      className="size-20 shrink-0 rounded-md object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">{project.title}</h3>
                        {project.role ? (
                          <p className="text-xs text-muted-foreground">
                            {t('role')}: {project.role}
                          </p>
                        ) : null}
                        {project.projectUrl ? (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex text-xs font-medium text-primary hover:underline"
                            data-testid={TEST_IDS.upworkProfile.portfolioOpenUpwork(project.id)}
                          >
                            {t('openOnUpwork')}
                          </a>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenProject(project)}
                        testId={TEST_IDS.upworkProfile.portfolioOpen(project.id)}
                        fullWidth={false}
                      >
                        {t('viewDetails')}
                      </Button>
                    </div>
                    {project.description ? (
                      <p className="line-clamp-3 text-sm text-foreground">{project.description}</p>
                    ) : null}
                    {project.technologies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {project.technologies.map((tech) => (
                          <StatusBadge key={tech} variant="secondary" label={tech} />
                        ))}
                      </div>
                    ) : null}
                    {project.publishedOn ? (
                      <p className="text-xs text-muted-foreground">
                        {t('publishedOn', { value: project.publishedOn })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function UpworkProfileDetailView({ profileId }: UpworkProfileDetailViewProps) {
  const t = useTranslations('org.upwork.profile');
  const tList = useTranslations('dashboard.admin.listControls');
  const tErrors = useTranslations();
  const router = useRouter();
  const { permissions } = useDashboardSession();
  const canUpdate = permissions.some((p) => p.key === ORG.FREELANCER_PROFILE_UPDATE);
  const formId = useId();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [initialValues, setInitialValues] = useState<ProfileFormValues>(profileToValues(null));
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PortfolioProjectDto | null>(null);
  const [portfolioPanelOpen, setPortfolioPanelOpen] = useState(false);

  const profile = loadState.status === 'ready' ? loadState.profile : null;

  const breadcrumbs = useMemo((): readonly BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: t('title'), href: PROFILE_BASE },
    ];
    if (profile) {
      items.push({
        label: profileDisplayName(profile, t('unnamedProfile')),
        href: `${PROFILE_BASE}/${profile.id}`,
      });
    } else {
      items.push({ label: t('detailTitle') });
    }
    return items;
  }, [profile, t]);

  useDashboardBreadcrumbs(breadcrumbs);

  const schema = useMemo(
    () =>
      toFormikValidationSchema(
        z.object({
          label: z.string(),
          title: z.string(),
          overview: z.string(),
          skills: z.string(),
          hourlyRateMin: z.string(),
          hourlyRateMax: z.string(),
          country: z.string(),
          timezone: z.string(),
          languages: z.string(),
          exclusions: z.string(),
          profileUrl: z.string(),
        }),
      ),
    [],
  );

  const load = useCallback(async () => {
    setLoadState({ status: 'loading' });
    try {
      const result = await getFreelancerProfile(profileId);
      let projects: PortfolioProjectDto[] = [];
      let portfolioError = false;
      try {
        const portfolio = await listPortfolioProjects(profileId);
        projects = [...portfolio.projects];
      } catch {
        portfolioError = true;
      }
      setInitialValues(profileToValues(result.profile));
      setLoadState({ status: 'ready', profile: result.profile, projects, portfolioError });
    } catch (error) {
      setLoadState({ status: 'error' });
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    }
  }, [profileId, tErrors]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await getFreelancerProfile(profileId);
      let projects: PortfolioProjectDto[] = [];
      let portfolioError = false;
      try {
        const portfolio = await listPortfolioProjects(profileId);
        projects = [...portfolio.projects];
      } catch {
        portfolioError = true;
      }
      setInitialValues(profileToValues(result.profile));
      setLoadState({ status: 'ready', profile: result.profile, projects, portfolioError });
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setRefreshing(false);
    }
  }, [profileId, tErrors]);

  const handleSubmit = useCallback(async (values: ProfileFormValues, helpers: { setSubmitting: (v: boolean) => void }) => {
    helpers.setSubmitting(true);
    try {
      const result = await updateFreelancerProfile(profileId, {
        label: values.label,
        title: values.title,
        overview: values.overview,
        skills: splitCsv(values.skills),
        hourlyRateMin: values.hourlyRateMin ? Number(values.hourlyRateMin) : null,
        hourlyRateMax: values.hourlyRateMax ? Number(values.hourlyRateMax) : null,
        country: values.country,
        timezone: values.timezone,
        languages: splitCsv(values.languages),
        exclusions: splitCsv(values.exclusions),
        profileUrl: values.profileUrl,
      });
      setInitialValues(profileToValues(result.profile));
      setLoadState((prev) =>
        prev.status === 'ready'
          ? { ...prev, profile: result.profile }
          : {
              status: 'ready',
              profile: result.profile,
              projects: [],
              portfolioError: false,
            },
      );
      showUserSuccessToast(t('saved'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      helpers.setSubmitting(false);
    }
  }, [profileId, t, tErrors]);

  const onDeleteProfile = useCallback(async () => {
    setBusy(true);
    try {
      await deleteFreelancerProfile(profileId);
      showUserSuccessToast(t('deleted'));
      router.push(PROFILE_BASE);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
      setBusy(false);
    }
  }, [profileId, router, t, tErrors]);

  const onOpenProject = useCallback((project: PortfolioProjectDto) => {
    setSelectedProject(project);
    setPortfolioPanelOpen(true);
  }, []);

  const onPortfolioPanelOpenChange = useCallback((next: boolean) => {
    setPortfolioPanelOpen(next);
    if (!next) {
      setSelectedProject(null);
    }
  }, []);

  const onPortfolioDeleted = useCallback((projectId: string) => {
    setLoadState((prev) =>
      prev.status === 'ready'
        ? { ...prev, projects: prev.projects.filter((item) => item.id !== projectId) }
        : prev,
    );
    setSelectedProject(null);
  }, []);

  const onPortfolioUpdated = useCallback((project: PortfolioProjectDto) => {
    setSelectedProject(project);
    setLoadState((prev) =>
      prev.status === 'ready'
        ? {
            ...prev,
            projects: prev.projects.map((item) => (item.id === project.id ? project : item)),
          }
        : prev,
    );
  }, []);

  const renderForm = useCallback(({ isSubmitting }: { isSubmitting: boolean }) => (
    <Form id={formId} className="space-y-6">
      <FormGrid>
        <FormikTextField name="label" label={t('fields.label')} testId={TEST_IDS.upworkProfile.label} readOnly={!canUpdate} />
        <FormikTextField name="title" label={t('fields.title')} testId={TEST_IDS.upworkProfile.title} readOnly={!canUpdate} />
        <FormikTextField name="profileUrl" label={t('fields.profileUrl')} testId={TEST_IDS.upworkProfile.profileUrl} readOnly={!canUpdate} />
        <FormikTextField name="hourlyRateMin" label={t('fields.hourlyRateMin')} testId={TEST_IDS.upworkProfile.hourlyRateMin} readOnly={!canUpdate} />
        <FormikTextField name="hourlyRateMax" label={t('fields.hourlyRateMax')} testId={TEST_IDS.upworkProfile.hourlyRateMax} readOnly={!canUpdate} />
        <FormikTextField name="country" label={t('fields.country')} testId={TEST_IDS.upworkProfile.country} readOnly={!canUpdate} />
        <FormikTextField name="timezone" label={t('fields.timezone')} testId={TEST_IDS.upworkProfile.timezone} readOnly={!canUpdate} />
        <FormGridFullWidth>
          <FormikTextField name="skills" label={t('fields.skills')} testId={TEST_IDS.upworkProfile.skills} readOnly={!canUpdate} />
        </FormGridFullWidth>
        <FormGridFullWidth>
          <FormikTextField name="languages" label={t('fields.languages')} testId={TEST_IDS.upworkProfile.languages} readOnly={!canUpdate} />
        </FormGridFullWidth>
        <FormGridFullWidth>
          <FormikTextField name="exclusions" label={t('fields.exclusions')} testId={TEST_IDS.upworkProfile.exclusions} readOnly={!canUpdate} />
        </FormGridFullWidth>
        <FormGridFullWidth>
          <FormikTextareaField name="overview" label={t('fields.overview')} testId={TEST_IDS.upworkProfile.overview} rows={6} />
        </FormGridFullWidth>
      </FormGrid>
      {canUpdate ? (
        <FormActions className="justify-end">
          <Button type="button" variant="outline" onClick={onDeleteProfile} disabled={isSubmitting || busy} testId={TEST_IDS.upworkProfile.deleteProfile} fullWidth={false}>
            {t('deleteProfile')}
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting || busy} testId={TEST_IDS.upworkProfile.save} fullWidth={false}>
            {t('save')}
          </Button>
        </FormActions>
      ) : null}
    </Form>
  ), [busy, canUpdate, formId, onDeleteProfile, t]);

  const backLink = (
    <PageBackLink href={PROFILE_BASE} label={t('backToList')} testId={TEST_IDS.upworkProfile.backToList} LinkComponent={Link} />
  );

  if (loadState.status === 'loading') {
    return null;
  }

  if (loadState.status === 'error' || !profile) {
    return (
      <AdminPageLayout title={t('detailTitle')} description={t('detailDescription')} backLink={backLink}>
        <div className="flex flex-col items-end gap-3">
          <p className="w-full text-sm text-destructive">{t('loadError')}</p>
          <Button type="button" variant="outline" onClick={load} testId={TEST_IDS.upworkProfile.retry} fullWidth={false}>
            {t('retry')}
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={profileDisplayName(profile, t('unnamedProfile'))}
      description={t('detailDescription')}
      backLink={backLink}
      actions={
        <DetailRefreshButton
          ariaLabel={tList('refreshDetailLabel')}
          isRefreshing={refreshing}
          onRefresh={onRefresh}
          testId={TEST_IDS.upworkProfile.detailRefresh}
        />
      }
    >
      <div className="mb-4">
        <StatusBadge
          variant={profile.source === 'extension' ? 'sky' : 'secondary'}
          label={t(`source.${profile.source}`)}
        />
      </div>
      <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit}>
        {renderForm}
      </Formik>
      {loadState.status === 'ready' ? (
        <PortfolioSection
          projects={loadState.projects}
          portfolioError={loadState.portfolioError}
          onRetry={onRefresh}
          retryLabel={t('retry')}
          onOpenProject={onOpenProject}
        />
      ) : null}
      <PortfolioProjectPanel
        profileId={profileId}
        project={selectedProject}
        open={portfolioPanelOpen}
        canDelete={canUpdate}
        onOpenChange={onPortfolioPanelOpenChange}
        onDeleted={onPortfolioDeleted}
        onProjectUpdated={onPortfolioUpdated}
      />
    </AdminPageLayout>
  );
}
