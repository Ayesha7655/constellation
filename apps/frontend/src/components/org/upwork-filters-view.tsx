'use client';

import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ORG, TEST_IDS } from '@constellation/shared';
import { Button, FormActions } from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import { generateSearchFilters, getSearchFilters, saveSearchFilters } from '@/services/freelancer-api';

export function UpworkFiltersView() {
  const t = useTranslations('org.upwork.filters');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const canUpdate = permissions.some((p) => p.key === ORG.SEARCH_FILTERS_UPDATE);
  const [actorId, setActorId] = useState('blackfalcondata/upwork-scraper');
  const [provenance, setProvenance] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState('{\n  "query": "",\n  "maxResults": 50,\n  "sort": "recency"\n}');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await getSearchFilters();
        if (cancelled) return;
        setActorId(result.actorId);
        setProvenance(result.provenance ?? null);
        if (result.filters) {
          setJsonText(JSON.stringify(result.filters, null, 2));
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
  }, [tErrors]);

  const onGenerate = useCallback(async () => {
    setBusy(true);
    try {
      const result = await generateSearchFilters();
      setActorId(result.actorId);
      setProvenance(result.provenance ?? 'ai');
      setJsonText(JSON.stringify(result.filters ?? {}, null, 2));
      showUserSuccessToast(t('generated'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [t, tErrors]);

  const onSave = useCallback(async () => {
    setBusy(true);
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        showUserErrorToast(t('invalidJson'));
        return;
      }
      const result = await saveSearchFilters(parsed as Record<string, unknown>);
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
  }, [jsonText, t, tErrors]);

  const onJsonChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(event.target.value);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <AdminPageLayout title={t('title')} description={t('description')}>
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
    </AdminPageLayout>
  );
}
