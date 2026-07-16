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
  updateFreelancerProfile,
  type FreelancerProfileDto,
} from '@/services/freelancer-api';
import {
  profileDisplayName,
  profileToValues,
  splitCsv,
  type ProfileFormValues,
} from '@/components/org/upwork-profile-form-utils';

const PROFILE_BASE = `${DASHBOARD_BASE_PATH.org}/upwork/profile`;

type LoadState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'ready'; profile: FreelancerProfileDto }>;

type UpworkProfileDetailViewProps = Readonly<{
  profileId: string;
}>;

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
      setInitialValues(profileToValues(result.profile));
      setLoadState({ status: 'ready', profile: result.profile });
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
      setInitialValues(profileToValues(result.profile));
      setLoadState({ status: 'ready', profile: result.profile });
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
      setLoadState({ status: 'ready', profile: result.profile });
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
    </AdminPageLayout>
  );
}
