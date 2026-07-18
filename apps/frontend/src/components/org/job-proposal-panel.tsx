'use client';

import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ORG, TEST_IDS, type ProposalAttachmentMeta } from '@constellation/shared';
import { Button, Checkbox, FormActions } from '@constellation/shared/ui';
import { ProposalAttachmentsField } from '@/components/org/proposal-attachments-field';
import { useDashboardSession } from '@/contexts/dashboard-session-context';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  generateProposalDraft,
  getProposalDraft,
  saveProposalDraft,
} from '@/services/freelancer-api';

type JobProposalPanelProps = Readonly<{
  profileId: string;
  jobId: string;
}>;

export function JobProposalPanel({ profileId, jobId }: JobProposalPanelProps) {
  const t = useTranslations('org.upwork.proposals');
  const tErrors = useTranslations();
  const { permissions } = useDashboardSession();
  const canUpdate = permissions.some((p) => p.key === ORG.PROPOSALS_UPDATE);
  const canRead = permissions.some((p) => p.key === ORG.PROPOSALS_READ);
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<ProposalAttachmentMeta[]>([]);
  const [addToLibrary, setAddToLibrary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const result = await getProposalDraft(profileId, jobId);
    setBody(result.draft?.body ?? '');
    setAttachments(result.draft?.attachments ?? []);
    setLoaded(true);
  }, [jobId, profileId]);

  useEffect(() => {
    if (!canRead) return;
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } catch (error) {
        if (!cancelled) showUserErrorToast(translateAuthRequestError(error, tErrors));
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canRead, load, tErrors]);

  const onBodyChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setBody(event.target.value);
  }, []);

  const onAttachmentsChange = useCallback((next: ProposalAttachmentMeta[]) => {
    setAttachments(next);
  }, []);

  const onGenerate = useCallback(async () => {
    setBusy(true);
    try {
      const result = await generateProposalDraft(profileId, jobId);
      setBody(result.draft.body);
      setAttachments(result.draft.attachments ?? []);
      showUserSuccessToast(t('generated'));
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [jobId, profileId, t, tErrors]);

  const onSave = useCallback(async () => {
    setBusy(true);
    try {
      const result = await saveProposalDraft(profileId, jobId, { body, addToLibrary });
      setAttachments(result.draft.attachments ?? []);
      showUserSuccessToast(t('draftSaved'));
      setAddToLibrary(false);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [addToLibrary, body, jobId, profileId, t, tErrors]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(body);
      showUserSuccessToast(t('copied'));
    } catch {
      showUserErrorToast(t('copyFailed'));
    }
  }, [body, t]);

  if (!canRead) return null;
  if (!loaded) return null;

  return (
    <section className="rounded-lg bg-muted/40 p-5" data-testid={TEST_IDS.upworkProposals.jobPanel}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{t('jobPanelTitle')}</h2>
        {canUpdate ? (
          <Button
            type="button"
            variant="outline"
            onClick={onGenerate}
            disabled={busy}
            testId={TEST_IDS.upworkProposals.generate}
            fullWidth={false}
          >
            <RefreshCw className={`size-4 shrink-0 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {busy ? t('generating') : t('generate')}
          </Button>
        ) : null}
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{t('jobPanelHint')}</p>
      <textarea
        className="min-h-48 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        value={body}
        onChange={onBodyChange}
        disabled={!canUpdate || busy}
        data-testid={TEST_IDS.upworkProposals.draftBody}
        aria-label={t('fields.draftBody')}
      />
      <div className="mt-3">
        <ProposalAttachmentsField
          profileId={profileId}
          canUpdate={canUpdate && !busy}
          attachments={attachments}
          onChange={onAttachmentsChange}
          jobId={jobId}
          testIdPrefix={TEST_IDS.upworkProposals.draftAttachments}
        />
      </div>
      {canUpdate ? (
        <div className="mt-3 space-y-3">
          <Checkbox
            checked={addToLibrary}
            onCheckedChange={setAddToLibrary}
            label={t('addToLibrary')}
            testId={TEST_IDS.upworkProposals.addToLibrary}
          />
          <FormActions className="justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCopy}
              disabled={!body.trim() || busy}
              testId={TEST_IDS.upworkProposals.copy}
              fullWidth={false}
            >
              <Copy className="size-4 shrink-0" aria-hidden />
              {t('copy')}
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={!body.trim() || busy}
              testId={TEST_IDS.upworkProposals.saveDraft}
              fullWidth={false}
            >
              {t('saveDraft')}
            </Button>
          </FormActions>
        </div>
      ) : null}
    </section>
  );
}
