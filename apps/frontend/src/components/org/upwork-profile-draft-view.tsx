'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DASHBOARD_BASE_PATH, ORG, TEST_IDS } from '@constellation/shared';
import { Button, FormActions, PageBackLink } from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import type { BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { useDashboardBreadcrumbs } from '@/hooks/use-dashboard-breadcrumbs';
import { Link } from '@/i18n/navigation';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  confirmFreelancerProfileImport,
  discardFreelancerProfileImport,
  listFreelancerProfiles,
  type ProfileImportDraftDto,
} from '@/services/freelancer-api';
import { asRate, asString, asStringList } from '@/components/org/upwork-profile-form-utils';

const PROFILE_BASE = `${DASHBOARD_BASE_PATH.org}/upwork/profile`;

function DraftPreviewField({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-foreground">{value}</p>
    </div>
  );
}

type LoadState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'empty' }>
  | Readonly<{ status: 'ready'; draft: ProfileImportDraftDto }>;

export function UpworkProfileDraftView() {
  const t = useTranslations('org.upwork.profile');
  const tErrors = useTranslations();
  const router = useRouter();
  const { permissions } = useDashboardSession();
  const canUpdate = permissions.some((p) => p.key === ORG.FREELANCER_PROFILE_UPDATE);
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [busy, setBusy] = useState(false);

  const breadcrumbs = useMemo((): readonly BreadcrumbItem[] => {
    return [
      { label: t('title'), href: PROFILE_BASE },
      { label: t('pendingDraft'), href: `${PROFILE_BASE}/draft` },
    ];
  }, [t]);

  useDashboardBreadcrumbs(breadcrumbs);

  const load = useCallback(async () => {
    setLoadState({ status: 'loading' });
    try {
      const result = await listFreelancerProfiles();
      if (!result.pendingDraft) {
        setLoadState({ status: 'empty' });
        return;
      }
      setLoadState({ status: 'ready', draft: result.pendingDraft });
    } catch (error) {
      setLoadState({ status: 'error' });
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    }
  }, [tErrors]);

  useEffect(() => {
    void load();
  }, [load]);

  const onConfirmImport = useCallback(async () => {
    setBusy(true);
    try {
      const result = await confirmFreelancerProfileImport();
      showUserSuccessToast(t('imported'));
      router.push(`${PROFILE_BASE}/${result.profile.id}`);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
      setBusy(false);
    }
  }, [router, t, tErrors]);

  const onDiscardImport = useCallback(async () => {
    setBusy(true);
    try {
      await discardFreelancerProfileImport();
      showUserSuccessToast(t('discarded'));
      router.push(PROFILE_BASE);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
      setBusy(false);
    }
  }, [router, t, tErrors]);

  const backLink = (
    <PageBackLink href={PROFILE_BASE} label={t('backToList')} testId={TEST_IDS.upworkProfile.backToList} LinkComponent={Link} />
  );

  if (loadState.status === 'loading') {
    return null;
  }

  if (loadState.status === 'error') {
    return (
      <AdminPageLayout title={t('pendingDraft')} backLink={backLink}>
        <div className="flex flex-col items-end gap-3">
          <p className="w-full text-sm text-destructive">{t('loadError')}</p>
          <Button type="button" variant="outline" onClick={load} fullWidth={false}>
            {t('retry')}
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  if (loadState.status === 'empty') {
    return (
      <AdminPageLayout title={t('pendingDraft')} description={t('noDraft')} backLink={backLink}>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => router.push(PROFILE_BASE)} fullWidth={false}>
            {t('backToList')}
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  const draftPayload = loadState.draft.payload;

  return (
    <AdminPageLayout title={t('pendingDraft')} description={t('pendingDraftHint')} backLink={backLink}>
      <div className="space-y-4 rounded-lg border border-border bg-card p-4" data-testid={TEST_IDS.upworkProfile.pendingDraft}>
        <p className="text-xs text-muted-foreground">
          {t('expiresAt', { value: new Date(loadState.draft.expiresAt).toLocaleString() })}
        </p>
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
    </AdminPageLayout>
  );
}
