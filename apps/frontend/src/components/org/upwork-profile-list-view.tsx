'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, FileInput, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DASHBOARD_BASE_PATH, ORG, TEST_IDS } from '@constellation/shared';
import { Button, StatusBadge } from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  createFreelancerProfile,
  listFreelancerProfiles,
  type FreelancerProfileDto,
  type ProfileImportDraftDto,
} from '@/services/freelancer-api';
import { profileDisplayName } from '@/components/org/upwork-profile-form-utils';

const PROFILE_BASE = `${DASHBOARD_BASE_PATH.org}/upwork/profile`;

export function UpworkProfileListView() {
  const t = useTranslations('org.upwork.profile');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const canUpdate = permissions.some((p) => p.key === ORG.FREELANCER_PROFILE_UPDATE);
  const [profiles, setProfiles] = useState<FreelancerProfileDto[]>([]);
  const [pendingDraft, setPendingDraft] = useState<ProfileImportDraftDto | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const result = await listFreelancerProfiles();
    setPendingDraft(result.pendingDraft);
    setProfiles(result.profiles);
    return result;
  }, []);

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
  }, [reload, tErrors]);

  const onCreateProfile = useCallback(async () => {
    setBusy(true);
    try {
      const result = await createFreelancerProfile({ label: t('newProfileLabel') });
      showUserSuccessToast(t('created'));
      window.location.assign(`${PROFILE_BASE}/${result.profile.id}`);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
      setBusy(false);
    }
  }, [t, tErrors]);

  if (!ready) {
    return null;
  }

  return (
    <AdminPageLayout
      title={t('title')}
      description={t('description')}
      actions={
        canUpdate ? (
          <Button
            type="button"
            onClick={onCreateProfile}
            disabled={busy}
            testId={TEST_IDS.upworkProfile.createProfile}
            fullWidth={false}
            className="inline-flex items-center gap-2"
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            {t('createProfile')}
          </Button>
        ) : null
      }
    >
      {profiles.length === 0 && !pendingDraft ? (
        <p className="text-sm text-muted-foreground">{t('emptyState')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pendingDraft ? (
            <Link
              href={`${PROFILE_BASE}/draft`}
              data-testid={TEST_IDS.upworkProfile.draftCard}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-start transition-colors hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                className="mb-3 flex size-10 items-center justify-center rounded-md border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                aria-hidden
              >
                <FileInput className="size-5" />
              </div>
              <p className="font-medium text-foreground">{t('pendingDraft')}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {typeof pendingDraft.payload.targetProfileId === 'string'
                  ? t('pendingDraftHintUpdate')
                  : t('pendingDraftHintCreate')}
              </p>
              <div className="mt-3">
                <StatusBadge variant="amber" label={t('draftBadge')} />
              </div>
            </Link>
          ) : null}

          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`${PROFILE_BASE}/${profile.id}`}
              data-testid={TEST_IDS.upworkProfile.profileCard(profile.id)}
              className="rounded-xl bg-card p-4 text-start shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                className="mb-3 flex size-10 items-center justify-center rounded-md border border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                aria-hidden
              >
                <Briefcase className="size-5" />
              </div>
              <p className="truncate font-medium text-foreground">
                {profileDisplayName(profile, t('unnamedProfile'))}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {profile.title?.trim() || t('noTitle')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge
                  variant={profile.source === 'extension' ? 'sky' : 'secondary'}
                  label={t(`source.${profile.source}`)}
                />
                {profile.skills[0] ? <StatusBadge variant="muted" label={profile.skills[0]} /> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminPageLayout>
  );
}
