'use client';

import { useCallback, useEffect, useId, useMemo, useState, type ChangeEvent } from 'react';
import { Form, Formik, type FormikHelpers } from 'formik';
import { Star, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { ORG, PROPOSAL_STYLE_EXTRACT_MIN_EXAMPLES, TEST_IDS } from '@constellation/shared';
import { Button, FormActions, FormGrid, FormGridFullWidth } from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import { FormikTextField } from '@/components/form/formik-text-field';
import { FormikTextareaField } from '@/components/form/formik-textarea-field';
import {
  pendingAttachmentStorageKeys,
  ProposalAttachmentsField,
} from '@/components/org/proposal-attachments-field';
import { DetailRefreshButton } from '@/components/ui/detail-refresh-button';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  createProposalExampleSchema,
  createProposalStylePackSchema,
  splitCommaList,
  type ProposalExampleFormValues,
  type ProposalStylePackFormValues,
} from '@/lib/validation/proposal-schemas';
import {
  createProposalExample,
  deleteProposalExample,
  extractProposalStylePack,
  getProposalStylePack,
  listFreelancerProfiles,
  listProposalExamples,
  revertProposalAttachmentUploads,
  updateProposalExample,
  upsertProposalStylePack,
  type FreelancerProfileDto,
  type ProposalExampleDto,
} from '@/services/freelancer-api';
import type { ProposalAttachmentMeta } from '@constellation/shared';

const emptyStyleValues: ProposalStylePackFormValues = {
  tone: '',
  lengthTarget: '',
  structureNotes: '',
  alwaysUse: '',
  neverUse: '',
  rateMentionPolicy: '',
  ctaStyle: '',
  extraNotes: '',
};

const emptyExampleValues: ProposalExampleFormValues = {
  title: '',
  body: '',
  jobContext: '',
};

function profileDisplayName(profile: FreelancerProfileDto, fallback: string): string {
  return profile.label?.trim() || profile.title?.trim() || fallback;
}

export function UpworkProposalsView() {
  const t = useTranslations('org.upwork.proposals');
  const tProfile = useTranslations('org.upwork.profile');
  const tList = useTranslations('dashboard.admin.listControls');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const canUpdate = permissions.some((p) => p.key === ORG.PROPOSALS_UPDATE);
  const styleFormId = useId();
  const exampleFormId = useId();

  const [profiles, setProfiles] = useState<FreelancerProfileDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [styleValues, setStyleValues] = useState<ProposalStylePackFormValues>(emptyStyleValues);
  const [examples, setExamples] = useState<ProposalExampleDto[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<ProposalAttachmentMeta[]>([]);
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const styleSchema = useMemo(
    () => toFormikValidationSchema(createProposalStylePackSchema({ required: t('validation.required') })),
    [t],
  );
  const exampleSchema = useMemo(
    () => toFormikValidationSchema(createProposalExampleSchema({ bodyRequired: t('validation.bodyRequired') })),
    [t],
  );

  const applyStylePack = useCallback((prefs: {
    tone?: string | null;
    lengthTarget?: string | null;
    structureNotes?: string | null;
    alwaysUse?: string[];
    neverUse?: string[];
    rateMentionPolicy?: string | null;
    ctaStyle?: string | null;
    extraNotes?: string | null;
  }) => {
    setStyleValues({
      tone: prefs.tone ?? '',
      lengthTarget: prefs.lengthTarget ?? '',
      structureNotes: prefs.structureNotes ?? '',
      alwaysUse: (prefs.alwaysUse ?? []).join(', '),
      neverUse: (prefs.neverUse ?? []).join(', '),
      rateMentionPolicy: prefs.rateMentionPolicy ?? '',
      ctaStyle: prefs.ctaStyle ?? '',
      extraNotes: prefs.extraNotes ?? '',
    });
  }, []);

  const loadForProfile = useCallback(async (profileId: string) => {
    const [style, exampleList] = await Promise.all([
      getProposalStylePack(profileId),
      listProposalExamples(profileId),
    ]);
    applyStylePack(style.preferences);
    setExamples(exampleList.examples);
  }, [applyStylePack]);

  const onExtractStyle = useCallback(async () => {
    if (!selectedId || !canUpdate) return;
    setExtracting(true);
    try {
      const result = await extractProposalStylePack(selectedId);
      applyStylePack(result.preferences);
      showUserSuccessToast(t('styleBuilt'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setExtracting(false);
    }
  }, [applyStylePack, canUpdate, selectedId, t, tErrors]);

  const hasStyleContent = Boolean(
    styleValues.tone.trim() ||
      styleValues.lengthTarget.trim() ||
      styleValues.structureNotes.trim() ||
      styleValues.alwaysUse.trim() ||
      styleValues.neverUse.trim() ||
      styleValues.rateMentionPolicy.trim() ||
      styleValues.ctaStyle.trim() ||
      styleValues.extraNotes.trim(),
  );

  const reload = useCallback(async () => {
    const list = await listFreelancerProfiles();
    setProfiles(list.profiles);
    const nextId = selectedId && list.profiles.some((p) => p.id === selectedId) ? selectedId : list.profiles[0]?.id ?? null;
    setSelectedId(nextId);
    if (nextId) {
      await loadForProfile(nextId);
    } else {
      setStyleValues(emptyStyleValues);
      setExamples([]);
    }
  }, [loadForProfile, selectedId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await reload();
      } catch (error) {
        if (!cancelled) showUserErrorToast(translateAuthRequestError(error, tErrors));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setRefreshing(false);
    }
  }, [reload, tErrors]);

  const onSelectProfile = useCallback(async (event: ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value || null;
    setSelectedId(nextId);
    setPendingAttachments([]);
    if (!nextId) return;
    try {
      await loadForProfile(nextId);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    }
  }, [loadForProfile, tErrors]);

  const onSaveStyle = useCallback(async (values: ProposalStylePackFormValues, helpers: FormikHelpers<ProposalStylePackFormValues>) => {
    if (!selectedId) return;
    try {
      await upsertProposalStylePack(selectedId, {
        tone: values.tone.trim() || null,
        lengthTarget: values.lengthTarget.trim() || null,
        structureNotes: values.structureNotes.trim() || null,
        alwaysUse: splitCommaList(values.alwaysUse),
        neverUse: splitCommaList(values.neverUse),
        rateMentionPolicy: values.rateMentionPolicy.trim() || null,
        ctaStyle: values.ctaStyle.trim() || null,
        extraNotes: values.extraNotes.trim() || null,
      });
      showUserSuccessToast(t('styleSaved'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      helpers.setSubmitting(false);
    }
  }, [selectedId, t, tErrors]);

  const onPendingAttachmentsChange = useCallback((next: ProposalAttachmentMeta[]) => {
    setPendingAttachments(next);
  }, []);

  const onExampleAttachmentsChange = useCallback((exampleId: string, next: ProposalAttachmentMeta[]) => {
    setExamples((prev) =>
      prev.map((item) => (item.id === exampleId ? { ...item, attachments: next } : item)),
    );
  }, []);

  const onAddExample = useCallback(async (values: ProposalExampleFormValues, helpers: FormikHelpers<ProposalExampleFormValues>) => {
    if (!selectedId) return;
    const keys = pendingAttachmentStorageKeys(pendingAttachments);
    try {
      const result = await createProposalExample(selectedId, {
        title: values.title.trim() || null,
        body: values.body.trim(),
        jobContext: values.jobContext.trim() || null,
        attachmentStorageKeys: keys,
      });
      setExamples((prev) => [result.example, ...prev]);
      setPendingAttachments([]);
      helpers.resetForm();
      showUserSuccessToast(t('exampleAdded'));
    } catch (error) {
      if (keys.length > 0) {
        try {
          await revertProposalAttachmentUploads(selectedId, keys);
        } catch {
          // best effort
        }
      }
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      helpers.setSubmitting(false);
    }
  }, [pendingAttachments, selectedId, t, tErrors]);

  const onToggleStar = useCallback(async (example: ProposalExampleDto) => {
    if (!selectedId || !canUpdate) return;
    try {
      const result = await updateProposalExample(selectedId, example.id, { isStarred: !example.isStarred });
      setExamples((prev) => prev.map((item) => (item.id === example.id ? result.example : item)));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    }
  }, [canUpdate, selectedId, tErrors]);

  const onDeleteExample = useCallback(async (exampleId: string) => {
    if (!selectedId || !canUpdate) return;
    try {
      await deleteProposalExample(selectedId, exampleId);
      setExamples((prev) => prev.filter((item) => item.id !== exampleId));
      showUserSuccessToast(t('exampleDeleted'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    }
  }, [canUpdate, selectedId, t, tErrors]);

  const renderStyleForm = useCallback(({ isSubmitting }: { isSubmitting: boolean }) => (
    <Form id={styleFormId} className="space-y-4">
      <FormGrid>
        <FormikTextField name="tone" label={t('fields.tone')} testId={TEST_IDS.upworkProposals.tone} />
        <FormikTextField name="lengthTarget" label={t('fields.lengthTarget')} testId={TEST_IDS.upworkProposals.lengthTarget} />
        <FormGridFullWidth>
          <FormikTextareaField name="structureNotes" label={t('fields.structureNotes')} rows={3} testId={TEST_IDS.upworkProposals.structureNotes} />
        </FormGridFullWidth>
        <FormikTextField name="alwaysUse" label={t('fields.alwaysUse')} testId={TEST_IDS.upworkProposals.alwaysUse} />
        <FormikTextField name="neverUse" label={t('fields.neverUse')} testId={TEST_IDS.upworkProposals.neverUse} />
        <FormikTextField name="rateMentionPolicy" label={t('fields.rateMentionPolicy')} testId={TEST_IDS.upworkProposals.rateMentionPolicy} />
        <FormikTextField name="ctaStyle" label={t('fields.ctaStyle')} testId={TEST_IDS.upworkProposals.ctaStyle} />
        <FormGridFullWidth>
          <FormikTextareaField name="extraNotes" label={t('fields.extraNotes')} rows={3} testId={TEST_IDS.upworkProposals.extraNotes} />
        </FormGridFullWidth>
      </FormGrid>
      {canUpdate ? (
        <FormActions className="justify-end">
          <Button type="submit" form={styleFormId} disabled={isSubmitting || !selectedId} testId={TEST_IDS.upworkProposals.saveStyle} fullWidth={false}>
            {t('saveStyle')}
          </Button>
        </FormActions>
      ) : null}
    </Form>
  ), [canUpdate, selectedId, styleFormId, t]);

  const renderExampleForm = useCallback(({ isSubmitting }: { isSubmitting: boolean }) => (
    <Form id={exampleFormId} className="space-y-4">
      <FormGrid>
        <FormikTextField name="title" label={t('fields.exampleTitle')} testId={TEST_IDS.upworkProposals.exampleTitle} />
        <FormGridFullWidth>
          <FormikTextareaField name="body" label={t('fields.exampleBody')} rows={5} testId={TEST_IDS.upworkProposals.exampleBody} />
        </FormGridFullWidth>
        <FormGridFullWidth>
          <FormikTextareaField name="jobContext" label={t('fields.jobContext')} rows={2} testId={TEST_IDS.upworkProposals.exampleJobContext} />
        </FormGridFullWidth>
        <FormGridFullWidth>
          {selectedId ? (
            <ProposalAttachmentsField
              profileId={selectedId}
              canUpdate={canUpdate}
              attachments={pendingAttachments}
              onChange={onPendingAttachmentsChange}
              testIdPrefix={TEST_IDS.upworkProposals.exampleFormAttachments}
            />
          ) : null}
        </FormGridFullWidth>
      </FormGrid>
      {canUpdate ? (
        <FormActions className="justify-end">
          <Button type="submit" form={exampleFormId} disabled={isSubmitting || !selectedId} testId={TEST_IDS.upworkProposals.addExample} fullWidth={false}>
            {t('addExample')}
          </Button>
        </FormActions>
      ) : null}
    </Form>
  ), [canUpdate, exampleFormId, onPendingAttachmentsChange, pendingAttachments, selectedId, t]);

  if (!ready) return null;

  return (
    <AdminPageLayout
      title={t('title')}
      description={t('description')}
      actions={
        <DetailRefreshButton
          ariaLabel={tList('refresh')}
          isRefreshing={refreshing}
          onRefresh={onRefresh}
          testId={TEST_IDS.upworkProposals.refresh}
        />
      }
    >
      {profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('needProfile')}</p>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap items-end justify-end gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">{t('selectProfile')}</span>
              <select
                className="min-w-[16rem] rounded-md border-0 bg-muted px-3 py-2 text-sm"
                value={selectedId ?? ''}
                onChange={onSelectProfile}
                data-testid={TEST_IDS.upworkProposals.profileSelect}
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profileDisplayName(profile, tProfile('unnamedProfile'))}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="space-y-3 rounded-xl bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <h2 className="text-sm font-semibold text-foreground">{t('examplesTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('examplesHint')}</p>
              </div>
              {canUpdate ? (
                <Button
                  type="button"
                  onClick={() => void onExtractStyle()}
                  disabled={extracting || examples.length < PROPOSAL_STYLE_EXTRACT_MIN_EXAMPLES}
                  testId={TEST_IDS.upworkProposals.extractStyle}
                  fullWidth={false}
                >
                  {extracting ? t('buildingStyle') : t('buildStyle')}
                </Button>
              ) : null}
            </div>
            {canUpdate ? (
              <Formik initialValues={emptyExampleValues} validationSchema={exampleSchema} onSubmit={onAddExample}>
                {renderExampleForm}
              </Formik>
            ) : null}
            <ul className="space-y-3" data-testid={TEST_IDS.upworkProposals.exampleList}>
              {examples.length === 0 ? (
                <li className="text-sm text-muted-foreground">{t('examplesEmpty')}</li>
              ) : (
                examples.map((example) => (
                  <li
                    key={example.id}
                    className="rounded-md border-0 bg-muted p-3"
                    data-testid={TEST_IDS.upworkProposals.exampleRow(example.id)}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {example.title?.trim() || t('untitledExample')}
                        </p>
                        <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">{example.body}</p>
                      </div>
                      {canUpdate ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                            aria-label={t('starExample')}
                            data-testid={TEST_IDS.upworkProposals.starExample(example.id)}
                            onClick={() => void onToggleStar(example)}
                          >
                            <Star className={`size-4 ${example.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="rounded-md p-1.5 text-destructive hover:bg-muted"
                            aria-label={t('deleteExample')}
                            data-testid={TEST_IDS.upworkProposals.deleteExample(example.id)}
                            onClick={() => void onDeleteExample(example.id)}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {selectedId ? (
                      <ProposalAttachmentsField
                        profileId={selectedId}
                        canUpdate={canUpdate}
                        attachments={example.attachments ?? []}
                        onChange={(next) => onExampleAttachmentsChange(example.id, next)}
                        exampleId={example.id}
                        testIdPrefix={TEST_IDS.upworkProposals.exampleAttachments(example.id)}
                      />
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="space-y-3 rounded-xl bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">{t('styleTitle')}</h2>
            <p className="text-sm text-muted-foreground">
              {hasStyleContent ? t('styleHint') : t('styleEmptyHint')}
            </p>
            <Formik
              enableReinitialize
              initialValues={styleValues}
              validationSchema={styleSchema}
              onSubmit={onSaveStyle}
            >
              {renderStyleForm}
            </Formik>
          </section>
        </div>
      )}
    </AdminPageLayout>
  );
}
