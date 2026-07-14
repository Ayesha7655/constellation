'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Form, Formik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { ORG, TEST_IDS } from '@constellation/shared';
import { Button, FormActions, FormGrid, FormGridFullWidth } from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import { FormikTextField } from '@/components/form/formik-text-field';
import { FormikTextareaField } from '@/components/form/formik-textarea-field';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  confirmFreelancerProfileImport,
  discardFreelancerProfileImport,
  getFreelancerProfile,
  updateFreelancerProfile,
  type FreelancerProfileDto,
  type ProfileImportDraftDto,
} from '@/services/freelancer-api';

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinCsv(values: string[] | undefined): string {
  return (values ?? []).join(', ');
}

type ProfileFormValues = {
  title: string;
  overview: string;
  skills: string;
  hourlyRateMin: string;
  hourlyRateMax: string;
  country: string;
  timezone: string;
  languages: string;
  exclusions: string;
  profileUrl: string;
};

function profileToValues(profile: FreelancerProfileDto | null): ProfileFormValues {
  return {
    title: profile?.title ?? '',
    overview: profile?.overview ?? '',
    skills: joinCsv(profile?.skills),
    hourlyRateMin: profile?.hourlyRateMin != null ? String(profile.hourlyRateMin) : '',
    hourlyRateMax: profile?.hourlyRateMax != null ? String(profile.hourlyRateMax) : '',
    country: profile?.country ?? '',
    timezone: profile?.timezone ?? '',
    languages: joinCsv(profile?.languages),
    exclusions: joinCsv(profile?.exclusions),
    profileUrl: profile?.profileUrl ?? '',
  };
}

export function UpworkProfileView() {
  const t = useTranslations('org.upwork.profile');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const canUpdate = permissions.some((p) => p.key === ORG.FREELANCER_PROFILE_UPDATE);
  const formId = useId();
  const [initialValues, setInitialValues] = useState<ProfileFormValues>(profileToValues(null));
  const [pendingDraft, setPendingDraft] = useState<ProfileImportDraftDto | null>(null);
  const [ready, setReady] = useState(false);

  const schema = useMemo(
    () =>
      toFormikValidationSchema(
        z.object({
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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await getFreelancerProfile();
        if (cancelled) return;
        setInitialValues(profileToValues(result.profile));
        setPendingDraft(result.pendingDraft);
      } catch (error) {
        if (!cancelled) {
          showUserErrorToast(translateAuthRequestError(error, tErrors));
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tErrors]);

  const handleSubmit = useCallback(async (values: ProfileFormValues, helpers: { setSubmitting: (v: boolean) => void }) => {
    helpers.setSubmitting(true);
    try {
      const result = await updateFreelancerProfile({
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
      showUserSuccessToast(t('saved'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      helpers.setSubmitting(false);
    }
  }, [t, tErrors]);

  const onConfirmImport = useCallback(async () => {
    try {
      const result = await confirmFreelancerProfileImport();
      setInitialValues(profileToValues(result.profile));
      setPendingDraft(null);
      showUserSuccessToast(t('imported'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    }
  }, [t, tErrors]);

  const onDiscardImport = useCallback(async () => {
    try {
      await discardFreelancerProfileImport();
      setPendingDraft(null);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    }
  }, [tErrors]);

  const renderForm = useCallback(({ isSubmitting }: { isSubmitting: boolean }) => (
    <Form id={formId} className="space-y-6">
      <FormGrid>
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
          <Button type="submit" form={formId} disabled={isSubmitting} testId={TEST_IDS.upworkProfile.save} fullWidth={false}>
            {t('save')}
          </Button>
        </FormActions>
      ) : null}
    </Form>
  ), [canUpdate, formId, t]);

  if (!ready) {
    return null;
  }

  return (
    <AdminPageLayout title={t('title')} description={t('description')}>
      {pendingDraft ? (
        <div className="mb-6 rounded-lg border border-border bg-card p-4" data-testid={TEST_IDS.upworkProfile.pendingDraft}>
          <p className="mb-3 text-sm font-medium text-foreground">{t('pendingDraft')}</p>
          <FormActions className="justify-end">
            <Button type="button" variant="outline" onClick={onDiscardImport} testId={TEST_IDS.upworkProfile.discardImport} fullWidth={false}>
              {t('discardImport')}
            </Button>
            <Button type="button" onClick={onConfirmImport} testId={TEST_IDS.upworkProfile.confirmImport} fullWidth={false}>
              {t('confirmImport')}
            </Button>
          </FormActions>
        </div>
      ) : null}
      <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit}>
        {renderForm}
      </Formik>
    </AdminPageLayout>
  );
}
