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
  type FreelancerProfileDto,
  type ProfileImportDraftDto,
} from '@/services/freelancer-api';
import { asRate, asString, asStringList, profileDisplayName } from '@/components/org/upwork-profile-form-utils';

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

function draftTargetProfileId(payload: Record<string, unknown>): string | null {
  return typeof payload.targetProfileId === 'string' ? payload.targetProfileId : null;
}

type LoadState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'empty' }>
  | Readonly<{
      status: 'ready';
      draft: ProfileImportDraftDto;
      profiles: FreelancerProfileDto[];
    }>;

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
      setLoadState({
        status: 'ready',
        draft: result.pendingDraft,
        profiles: result.profiles,
      });
    } catch (error) {
      setLoadState({ status: 'error' });
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    }
  }, [tErrors]);

  useEffect(() => {
    void load();
  }, [load]);

  const onConfirmImport = useCallback(async () => {
    if (loadState.status !== 'ready') return;
    const targetId = draftTargetProfileId(loadState.draft.payload);
    setBusy(true);
    try {
      const result = await confirmFreelancerProfileImport();
      showUserSuccessToast(targetId ? t('updatedFromDraft') : t('imported'));
      router.push(`${PROFILE_BASE}/${result.profile.id}`);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
      setBusy(false);
    }
  }, [loadState, router, t, tErrors]);

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
  const targetId = draftTargetProfileId(draftPayload);
  const matchedProfile = targetId
    ? loadState.profiles.find((profile) => profile.id === targetId)
    : undefined;
  const matchedName = matchedProfile
    ? profileDisplayName(matchedProfile, t('unnamedProfile'))
    : t('unnamedProfile');
  const isUpdate = Boolean(targetId);

  return (
    <AdminPageLayout
      title={t('pendingDraft')}
      description={isUpdate ? t('pendingDraftHintUpdate') : t('pendingDraftHintCreate')}
      backLink={backLink}
    >
      <div className="space-y-4 rounded-xl bg-card p-4 shadow-sm" data-testid={TEST_IDS.upworkProfile.pendingDraft}>
        <p className="text-sm text-foreground">
          {isUpdate ? t('confirmWillUpdate', { name: matchedName }) : t('confirmWillCreate')}
        </p>
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
              {isUpdate ? t('confirmUpdate') : t('confirmImport')}
            </Button>
          </FormActions>
        ) : null}
      </div>
    </AdminPageLayout>
  );
}
