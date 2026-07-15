'use client';

import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ORG, TEST_IDS } from '@constellation/shared';
import { Button, FormActions } from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  generateSearchFilters,
  getSearchFilters,
  listFreelancerProfiles,
  saveSearchFilters,
  type FreelancerProfileDto,
} from '@/services/freelancer-api';

function profileDisplayName(profile: FreelancerProfileDto, fallback: string): string {
  return profile.label?.trim() || profile.title?.trim() || fallback;
}

export function UpworkFiltersView() {
  const t = useTranslations('org.upwork.filters');
  const tProfile = useTranslations('org.upwork.profile');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const canUpdate = permissions.some((p) => p.key === ORG.SEARCH_FILTERS_UPDATE);
  const [profiles, setProfiles] = useState<FreelancerProfileDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actorId, setActorId] = useState('blackfalcondata/upwork-scraper');
  const [provenance, setProvenance] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState('{\n  "query": "",\n  "maxResults": 50,\n  "sort": "recency"\n}');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadFiltersForProfile = useCallback(async (profileId: string) => {
    const result = await getSearchFilters(profileId);
    setActorId(result.actorId);
    setProvenance(result.provenance ?? null);
    setJsonText(
      result.filters
        ? JSON.stringify(result.filters, null, 2)
        : '{\n  "query": "",\n  "maxResults": 50,\n  "sort": "recency"\n}',
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await listFreelancerProfiles();
        if (cancelled) return;
        setProfiles(list.profiles);
        const firstId = list.profiles[0]?.id ?? null;
        setSelectedId(firstId);
        if (firstId) {
          await loadFiltersForProfile(firstId);
        }
      } catch (error) {
        if (!cancelled) showUserErrorToast(translateAuthRequestError(error, tErrors));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFiltersForProfile, tErrors]);

  const onSelectProfile = useCallback(async (event: ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value || null;
    setSelectedId(nextId);
    if (!nextId) return;
    setBusy(true);
    try {
      await loadFiltersForProfile(nextId);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [loadFiltersForProfile, tErrors]);

  const onGenerate = useCallback(async () => {
    if (!selectedId) {
      showUserErrorToast(t('needProfile'));
      return;
    }
    setBusy(true);
    try {
      const result = await generateSearchFilters(selectedId);
      setActorId(result.actorId);
      setProvenance(result.provenance ?? 'ai');
      setJsonText(JSON.stringify(result.filters ?? {}, null, 2));
      showUserSuccessToast(t('generated'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [selectedId, t, tErrors]);

  const onSave = useCallback(async () => {
    if (!selectedId) {
      showUserErrorToast(t('needProfile'));
      return;
    }
    setBusy(true);
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        showUserErrorToast(t('invalidJson'));
        return;
      }
      const result = await saveSearchFilters(selectedId, parsed as Record<string, unknown>);
      setProvenance(result.provenance ?? 'manual');
      setJsonText(JSON.stringify(result.filters ?? {}, null, 2));
      showUserSuccessToast(t('saved'));
    } catch (error) {
      if (error instanceof SyntaxError) {
        showUserErrorToast(t('invalidJson'));
      } else {
        showUserErrorToast(translateAuthRequestError(error, tErrors));
      }
    } finally {
      setBusy(false);
    }
  }, [jsonText, selectedId, t, tErrors]);

  const onJsonChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(event.target.value);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <AdminPageLayout title={t('title')} description={t('description')}>
      <div className="mb-4 flex flex-wrap items-end justify-end gap-4">
        <div className="me-auto min-w-[12rem] flex-1 space-y-1">
          <label className="block text-sm font-medium text-foreground" htmlFor="upwork-filters-profile">
            {t('selectProfile')}
          </label>
          <select
            id="upwork-filters-profile"
            data-testid={TEST_IDS.upworkFilters.profileSelect}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedId ?? ''}
            onChange={onSelectProfile}
            disabled={busy}
          >
            {profiles.length === 0 ? <option value="">{tProfile('noProfiles')}</option> : null}
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profileDisplayName(profile, tProfile('unnamedProfile'))}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedId ? (
        <p className="text-sm text-muted-foreground">{t('needProfile')}</p>
      ) : (
        <>
          <div className="mb-4 space-y-1 text-sm text-muted-foreground">
            <p>
              {t('actorLabel')}: <span className="text-foreground">{actorId}</span>
            </p>
            {provenance ? <p>{t('provenance', { value: provenance })}</p> : null}
          </div>
          <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="upwork-filters-json">
            {t('jsonLabel')}
          </label>
          <textarea
            id="upwork-filters-json"
            data-testid={TEST_IDS.upworkFilters.json}
            className="min-h-72 w-full rounded-lg border border-border bg-background p-3 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={jsonText}
            onChange={onJsonChange}
            disabled={!canUpdate || busy}
            spellCheck={false}
          />
          {canUpdate ? (
            <FormActions className="mt-4 justify-end">
              <Button type="button" variant="outline" onClick={onGenerate} disabled={busy} testId={TEST_IDS.upworkFilters.generate} fullWidth={false}>
                {busy ? t('generating') : t('generate')}
              </Button>
              <Button type="button" onClick={onSave} disabled={busy} testId={TEST_IDS.upworkFilters.save} fullWidth={false}>
                {t('save')}
              </Button>
            </FormActions>
          ) : null}
        </>
      )}
    </AdminPageLayout>
  );
}
