'use client';

import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { Copy, Eye, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ORG, TEST_IDS, type ProposalAttachmentMeta } from '@constellation/shared';
import { Button, Checkbox, Dialog, FormActions } from '@constellation/shared/ui';
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
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const onPreviewOpenChange = useCallback((next: boolean) => {
    setPreviewOpen(next);
  }, []);

  const onOpenPreview = useCallback(() => {
    setPreviewOpen(true);
  }, []);

  const onGenerate = useCallback(async () => {
    setBusy(true);
    try {
      const result = await generateProposalDraft(profileId, jobId);
      setBody(result.draft.body);
      setAttachments(result.draft.attachments ?? []);
      setPreviewOpen(true);
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

  const hasBody = Boolean(body.trim());

  return (
    <>
      <section className="rounded-xl bg-card p-5 shadow-sm" data-testid={TEST_IDS.upworkProposals.jobPanel}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">{t('jobPanelTitle')}</h2>
          {canUpdate ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onOpenPreview}
                disabled={!hasBody || busy}
                testId={TEST_IDS.upworkProposals.preview}
                fullWidth={false}
              >
                <Eye className="size-4 shrink-0" aria-hidden />
                {t('preview')}
              </Button>
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
            </div>
          ) : hasBody ? (
            <Button
              type="button"
              variant="outline"
              onClick={onOpenPreview}
              disabled={busy}
              testId={TEST_IDS.upworkProposals.preview}
              fullWidth={false}
            >
              <Eye className="size-4 shrink-0" aria-hidden />
              {t('preview')}
            </Button>
          ) : null}
        </div>
        <p className="mb-3 text-sm text-muted-foreground">{t('jobPanelHint')}</p>
        <textarea
          className="min-h-96 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm text-foreground"
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
                disabled={!hasBody || busy}
                testId={TEST_IDS.upworkProposals.copy}
                fullWidth={false}
              >
                <Copy className="size-4 shrink-0" aria-hidden />
                {t('copy')}
              </Button>
              <Button
                type="button"
                onClick={onSave}
                disabled={!hasBody || busy}
                testId={TEST_IDS.upworkProposals.saveDraft}
                fullWidth={false}
              >
                {t('saveDraft')}
              </Button>
            </FormActions>
          </div>
        ) : null}
      </section>

      <Dialog
        open={previewOpen}
        onOpenChange={onPreviewOpenChange}
        title={t('previewTitle')}
        description={t('previewDescription')}
        size="xl"
        testId={TEST_IDS.upworkProposals.previewDialog}
        footer={
          <FormActions className="justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCopy}
              disabled={!hasBody}
              testId={TEST_IDS.upworkProposals.previewCopy}
              fullWidth={false}
            >
              <Copy className="size-4 shrink-0" aria-hidden />
              {t('copy')}
            </Button>
            {canUpdate ? (
              <Button
                type="button"
                onClick={onSave}
                disabled={!hasBody || busy}
                testId={TEST_IDS.upworkProposals.previewSave}
                fullWidth={false}
              >
                {t('saveDraft')}
              </Button>
            ) : null}
          </FormActions>
        }
      >
        <div
          className="whitespace-pre-wrap text-sm leading-relaxed text-foreground"
          data-testid={TEST_IDS.upworkProposals.previewBody}
        >
          {hasBody ? body : t('previewEmpty')}
        </div>
      </Dialog>
    </>
  );
}
