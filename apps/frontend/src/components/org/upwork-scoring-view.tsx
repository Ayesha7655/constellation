'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Form, Formik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { useTranslations } from 'next-intl';
import { DEFAULT_UPWORK_SCORING_CONFIG, ORG, TEST_IDS } from '@constellation/shared';
import { Button, FormActions, FormGrid, FormGridFullWidth, StatusBadge } from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import { FormikTextField } from '@/components/form/formik-text-field';
import { DetailRefreshButton } from '@/components/ui/detail-refresh-button';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { upworkRelevancyBadgeVariant } from '@/lib/upwork-relevancy-badge';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  createUpworkScoringSchema,
  scoringConfigToFormValues,
  scoringFormToPayload,
  type UpworkScoringFormValues,
} from '@/lib/validation/upwork-scoring-schemas';
import {
  getUpworkScoringConfig,
  resetUpworkScoringConfig,
  updateUpworkScoringConfig,
} from '@/services/freelancer-api';

const emptyValues = scoringConfigToFormValues(DEFAULT_UPWORK_SCORING_CONFIG);

export function UpworkScoringView() {
  const t = useTranslations('org.upwork.scoring');
  const tList = useTranslations('dashboard.admin.listControls');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const canUpdate = permissions.some((p) => p.key === ORG.UPWORK_SCORING_UPDATE);
  const formId = useId();
  const [initialValues, setInitialValues] = useState<UpworkScoringFormValues>(emptyValues);
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const schema = useMemo(
    () =>
      toFormikValidationSchema(
        createUpworkScoringSchema({
          required: t('validation.required'),
          range: t('validation.range'),
          weightsSum: t('validation.weightsSum'),
          thresholdsOrder: t('validation.thresholdsOrder'),
        }),
      ),
    [t],
  );

  const load = useCallback(async () => {
    const config = await getUpworkScoringConfig();
    setInitialValues(scoringConfigToFormValues(config));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } catch (error) {
        if (!cancelled) showUserErrorToast(translateAuthRequestError(error, tErrors));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, tErrors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setRefreshing(false);
    }
  }, [load, tErrors]);

  const handleSubmit = useCallback(async (values: UpworkScoringFormValues, helpers: { setSubmitting: (v: boolean) => void }) => {
    helpers.setSubmitting(true);
    try {
      const saved = await updateUpworkScoringConfig(scoringFormToPayload(values));
      setInitialValues(scoringConfigToFormValues(saved));
      showUserSuccessToast(t('saved'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      helpers.setSubmitting(false);
    }
  }, [t, tErrors]);

  const onResetDefaults = useCallback(async () => {
    setBusy(true);
    try {
      const saved = await resetUpworkScoringConfig();
      setInitialValues(scoringConfigToFormValues(saved));
      showUserSuccessToast(t('reset'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [t, tErrors]);

  const renderForm = useCallback(({ isSubmitting, values }: { isSubmitting: boolean; values: UpworkScoringFormValues }) => {
    const weightSum =
      (Number.parseInt(values.skills, 10) || 0) +
      (Number.parseInt(values.keywords, 10) || 0) +
      (Number.parseInt(values.budget, 10) || 0) +
      (Number.parseInt(values.location, 10) || 0) +
      (Number.parseInt(values.clientRating, 10) || 0) +
      (Number.parseInt(values.proposals, 10) || 0);
    const previewThresholds = {
      green: Number.parseInt(values.green, 10) || 80,
      orange: Number.parseInt(values.orange, 10) || 60,
      yellow: Number.parseInt(values.yellow, 10) || 40,
    };

    return (
      <Form id={formId} className="space-y-8">
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('weightsTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('weightsHint', { sum: weightSum })}</p>
          </div>
          <FormGrid>
            <FormikTextField name="skills" label={t('weights.skills')} testId={TEST_IDS.upworkScoring.weightSkills} readOnly={!canUpdate} />
            <FormikTextField name="keywords" label={t('weights.keywords')} testId={TEST_IDS.upworkScoring.weightKeywords} readOnly={!canUpdate} />
            <FormikTextField name="budget" label={t('weights.budget')} testId={TEST_IDS.upworkScoring.weightBudget} readOnly={!canUpdate} />
            <FormikTextField name="location" label={t('weights.location')} testId={TEST_IDS.upworkScoring.weightLocation} readOnly={!canUpdate} />
            <FormikTextField name="clientRating" label={t('weights.clientRating')} testId={TEST_IDS.upworkScoring.weightClientRating} readOnly={!canUpdate} />
            <FormikTextField name="proposals" label={t('weights.proposals')} testId={TEST_IDS.upworkScoring.weightProposals} readOnly={!canUpdate} />
          </FormGrid>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('thresholdsTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('thresholdsHint')}</p>
          </div>
          <FormGrid>
            <FormikTextField name="green" label={t('thresholds.green')} testId={TEST_IDS.upworkScoring.thresholdGreen} readOnly={!canUpdate} />
            <FormikTextField name="orange" label={t('thresholds.orange')} testId={TEST_IDS.upworkScoring.thresholdOrange} readOnly={!canUpdate} />
            <FormikTextField name="yellow" label={t('thresholds.yellow')} testId={TEST_IDS.upworkScoring.thresholdYellow} readOnly={!canUpdate} />
            <FormGridFullWidth>
              <div className="flex flex-wrap gap-2 pt-1">
                <StatusBadge variant={upworkRelevancyBadgeVariant(previewThresholds.green, previewThresholds)} label={`${previewThresholds.green}+`} />
                <StatusBadge variant={upworkRelevancyBadgeVariant(previewThresholds.orange, previewThresholds)} label={`${previewThresholds.orange}+`} />
                <StatusBadge variant={upworkRelevancyBadgeVariant(previewThresholds.yellow, previewThresholds)} label={`${previewThresholds.yellow}+`} />
                <StatusBadge variant={upworkRelevancyBadgeVariant(Math.max(0, previewThresholds.yellow - 1), previewThresholds)} label={`<${previewThresholds.yellow}`} />
              </div>
            </FormGridFullWidth>
          </FormGrid>
        </section>

        <p className="text-sm text-muted-foreground">{t('rescoreHint')}</p>

        {canUpdate ? (
          <FormActions className="justify-end">
            <Button type="button" variant="outline" onClick={onResetDefaults} disabled={isSubmitting || busy} testId={TEST_IDS.upworkScoring.reset} fullWidth={false}>
              {t('resetDefaults')}
            </Button>
            <Button type="submit" form={formId} disabled={isSubmitting || busy} testId={TEST_IDS.upworkScoring.save} fullWidth={false}>
              {t('save')}
            </Button>
          </FormActions>
        ) : null}
      </Form>
    );
  }, [busy, canUpdate, formId, onResetDefaults, t]);

  if (!ready) {
    return null;
  }

  return (
    <AdminPageLayout
      title={t('title')}
      description={t('description')}
      actions={
        <DetailRefreshButton
          ariaLabel={tList('refreshDetailLabel')}
          isRefreshing={refreshing}
          onRefresh={onRefresh}
          testId={TEST_IDS.upworkScoring.refresh}
        />
      }
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit}>
        {renderForm}
      </Formik>
    </AdminPageLayout>
  );
}
