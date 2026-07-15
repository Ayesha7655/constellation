'use client';

import { useCallback, useEffect, useId, useMemo, useState, type ChangeEvent } from 'react';
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
  createFreelancerProfile,
  deleteFreelancerProfile,
  discardFreelancerProfileImport,
  listFreelancerProfiles,
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

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asStringList(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.filter((item): item is string => typeof item === 'string').join(', ');
}

function asRate(value: unknown): string {
  return typeof value === 'number' ? String(value) : '';
}

type ProfileFormValues = {
  label: string;
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
    label: profile?.label ?? '',
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

function profileDisplayName(profile: FreelancerProfileDto, fallback: string): string {
  return profile.label?.trim() || profile.title?.trim() || fallback;
}

function DraftPreviewField({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-foreground">{value}</p>
    </div>
  );
}

export function UpworkProfileView() {
  const t = useTranslations('org.upwork.profile');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const canUpdate = permissions.some((p) => p.key === ORG.FREELANCER_PROFILE_UPDATE);
  const formId = useId();
  const [profiles, setProfiles] = useState<FreelancerProfileDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<ProfileFormValues>(profileToValues(null));
  const [pendingDraft, setPendingDraft] = useState<ProfileImportDraftDto | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedId) ?? null,
    [profiles, selectedId],
  );

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

  const applyList = useCallback((nextProfiles: FreelancerProfileDto[], preferId?: string | null) => {
    setProfiles(nextProfiles);
    const preferred =
      (preferId && nextProfiles.find((p) => p.id === preferId)?.id) ||
      nextProfiles[0]?.id ||
      null;
    setSelectedId(preferred);
    const chosen = preferred ? (nextProfiles.find((p) => p.id === preferred) ?? null) : null;
    setInitialValues(profileToValues(chosen));
  }, []);

  const reload = useCallback(async (preferId?: string | null) => {
    const result = await listFreelancerProfiles();
    setPendingDraft(result.pendingDraft);
    applyList(result.profiles, preferId);
  }, [applyList]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await listFreelancerProfiles();
        if (cancelled) return;
        setPendingDraft(result.pendingDraft);
        applyList(result.profiles);
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
  }, [applyList, tErrors]);

  const onSelectProfile = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value || null;
    setSelectedId(nextId);
    const chosen = nextId ? (profiles.find((p) => p.id === nextId) ?? null) : null;
    setInitialValues(profileToValues(chosen));
  }, [profiles]);

  const onCreateProfile = useCallback(async () => {
    setBusy(true);
    try {
      const result = await createFreelancerProfile({ label: t('newProfileLabel') });
      await reload(result.profile.id);
      showUserSuccessToast(t('created'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [reload, t, tErrors]);

  const onDeleteProfile = useCallback(async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await deleteFreelancerProfile(selectedId);
      await reload(null);
      showUserSuccessToast(t('deleted'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [reload, selectedId, t, tErrors]);

  const handleSubmit = useCallback(async (values: ProfileFormValues, helpers: { setSubmitting: (v: boolean) => void }) => {
    if (!selectedId) return;
    helpers.setSubmitting(true);
    try {
      const result = await updateFreelancerProfile(selectedId, {
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
      setProfiles((prev) => prev.map((p) => (p.id === result.profile.id ? result.profile : p)));
      setInitialValues(profileToValues(result.profile));
      showUserSuccessToast(t('saved'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      helpers.setSubmitting(false);
    }
  }, [selectedId, t, tErrors]);

  const onConfirmImport = useCallback(async () => {
    setBusy(true);
    try {
      const result = await confirmFreelancerProfileImport();
      await reload(result.profile.id);
      showUserSuccessToast(t('imported'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [reload, t, tErrors]);

  const onDiscardImport = useCallback(async () => {
    setBusy(true);
    try {
      await discardFreelancerProfileImport();
      setPendingDraft(null);
      showUserSuccessToast(t('discarded'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [t, tErrors]);

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
          <Button type="submit" form={formId} disabled={isSubmitting || busy} testId={TEST_IDS.upworkProfile.save} fullWidth={false}>
            {t('save')}
          </Button>
        </FormActions>
      ) : null}
    </Form>
  ), [busy, canUpdate, formId, t]);

  if (!ready) {
    return null;
  }

  const draftPayload = pendingDraft?.payload ?? {};

  return (
    <AdminPageLayout title={t('title')} description={t('description')}>
      {pendingDraft ? (
        <div className="mb-6 space-y-4 rounded-lg border border-border bg-card p-4" data-testid={TEST_IDS.upworkProfile.pendingDraft}>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{t('pendingDraft')}</p>
            <p className="text-xs text-muted-foreground">{t('pendingDraftHint')}</p>
            <p className="text-xs text-muted-foreground">
              {t('expiresAt', { value: new Date(pendingDraft.expiresAt).toLocaleString() })}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DraftPreviewField label={t('fields.title')} value={asString(draftPayload.title)} />
            <DraftPreviewField label={t('fields.profileUrl')} value={asString(draftPayload.profileUrl)} />
            <DraftPreviewField label={t('fields.hourlyRateMin')} value={asRate(draftPayload.hourlyRateMin)} />
            <DraftPreviewField label={t('fields.hourlyRateMax')} value={asRate(draftPayload.hourlyRateMax)} />
            <DraftPreviewField label={t('fields.country')} value={asString(draftPayload.country)} />
            <DraftPreviewField label={t('fields.timezone')} value={asString(draftPayload.timezone)} />
            <div className="sm:col-span-2">
              <DraftPreviewField label={t('fields.skills')} value={asStringList(draftPayload.skills)} />
            </div>
            <div className="sm:col-span-2">
              <DraftPreviewField label={t('fields.languages')} value={asStringList(draftPayload.languages)} />
            </div>
            <div className="sm:col-span-2">
              <DraftPreviewField label={t('fields.overview')} value={asString(draftPayload.overview)} />
            </div>
          </div>
          {canUpdate ? (
            <FormActions className="justify-end">
              <Button type="button" variant="outline" onClick={onDiscardImport} disabled={busy} testId={TEST_IDS.upworkProfile.discardImport} fullWidth={false}>
                {t('discardImport')}
              </Button>
              <Button type="button" onClick={onConfirmImport} disabled={busy} testId={TEST_IDS.upworkProfile.confirmImport} fullWidth={false}>
                {t('confirmImport')}
              </Button>
            </FormActions>
          ) : null}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-end justify-end gap-4">
        <div className="me-auto min-w-[12rem] flex-1 space-y-1">
          <label className="block text-sm font-medium text-foreground" htmlFor="upwork-profile-select">
            {t('selectProfile')}
          </label>
          <select
            id="upwork-profile-select"
            data-testid={TEST_IDS.upworkProfile.profileSelect}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedId ?? ''}
            onChange={onSelectProfile}
          >
            {profiles.length === 0 ? <option value="">{t('noProfiles')}</option> : null}
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profileDisplayName(profile, t('unnamedProfile'))}
              </option>
            ))}
          </select>
        </div>
        {canUpdate ? (
          <FormActions className="justify-end">
            <Button type="button" variant="outline" onClick={onCreateProfile} disabled={busy} testId={TEST_IDS.upworkProfile.createProfile} fullWidth={false}>
              {t('createProfile')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onDeleteProfile}
              disabled={busy || !selectedId}
              testId={TEST_IDS.upworkProfile.deleteProfile}
              fullWidth={false}
            >
              {t('deleteProfile')}
            </Button>
          </FormActions>
        ) : null}
      </div>

      {selectedProfile ? (
        <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit}>
          {renderForm}
        </Formik>
      ) : (
        <p className="text-sm text-muted-foreground">{t('emptyState')}</p>
      )}
    </AdminPageLayout>
  );
}
