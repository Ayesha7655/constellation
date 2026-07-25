'use client';

import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { FileText, Paperclip, Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  PROPOSAL_ATTACHMENT_ALLOWED_MIME_TYPES,
  PROPOSAL_ATTACHMENT_MAX_BYTES,
  PROPOSAL_ATTACHMENT_MAX_COUNT,
  type ProposalAttachmentMeta,
} from '@constellation/shared';
import { Button } from '@constellation/shared/ui';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { fileToBase64 } from '@/lib/file-base64';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  attachProposalDraftAttachment,
  attachProposalExampleAttachment,
  deleteProposalAttachment,
  revertProposalAttachmentUploads,
  uploadProposalAttachment,
} from '@/services/freelancer-api';

const ACCEPT = [
  '.pdf',
  '.doc',
  '.docx',
  '.rtf',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  ...PROPOSAL_ATTACHMENT_ALLOWED_MIME_TYPES,
].join(',');

type ProposalAttachmentsFieldProps = Readonly<{
  profileId: string;
  canUpdate: boolean;
  attachments: ProposalAttachmentMeta[];
  onChange: (next: ProposalAttachmentMeta[]) => void;
  exampleId?: string;
  jobId?: string;
  testIdPrefix: string;
}>;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProposalAttachmentsField({
  profileId,
  canUpdate,
  attachments,
  onChange,
  exampleId,
  jobId,
  testIdPrefix,
}: ProposalAttachmentsFieldProps) {
  const t = useTranslations('org.upwork.proposals');
  const tErrors = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onUploadClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onPickFile = useCallback(
    async (file: File) => {
      if (!canUpdate) return;
      if (attachments.length >= PROPOSAL_ATTACHMENT_MAX_COUNT) {
        showUserErrorToast(t('attachmentsLimit'));
        return;
      }
      if (file.size > PROPOSAL_ATTACHMENT_MAX_BYTES) {
        showUserErrorToast(t('attachmentsTooLarge'));
        return;
      }

      setUploading(true);
      let uploadedKey: string | null = null;
      try {
        const base64 = await fileToBase64(file);
        const uploaded = await uploadProposalAttachment(profileId, {
          base64,
          fileName: file.name,
          mimeType: file.type || undefined,
        });
        uploadedKey = uploaded.storageKey;

        if (exampleId) {
          const result = await attachProposalExampleAttachment(profileId, exampleId, uploaded.storageKey);
          onChange([...attachments, result.attachment]);
        } else if (jobId) {
          const result = await attachProposalDraftAttachment(profileId, jobId, uploaded.storageKey);
          onChange([...attachments, result.attachment]);
        } else {
          onChange([
            ...attachments,
            {
              id: `pending:${uploaded.storageKey}`,
              storageKey: uploaded.storageKey,
              fileName: uploaded.fileName,
              mimeType: uploaded.mimeType,
              sizeBytes: uploaded.sizeBytes,
              sortOrder: attachments.length + 1,
            },
          ]);
        }
        showUserSuccessToast(t('attachmentAdded'));
      } catch (error) {
        if (uploadedKey) {
          try {
            await revertProposalAttachmentUploads(profileId, [uploadedKey]);
          } catch {
            // best effort
          }
        }
        showUserErrorToast(translateAuthRequestError(error, tErrors));
      } finally {
        setUploading(false);
      }
    },
    [attachments, canUpdate, exampleId, jobId, onChange, profileId, t, tErrors],
  );

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file) void onPickFile(file);
    },
    [onPickFile],
  );

  const onRemove = useCallback(
    async (attachment: ProposalAttachmentMeta) => {
      if (!canUpdate) return;
      const isPending = attachment.id.startsWith('pending:');
      try {
        if (isPending) {
          await revertProposalAttachmentUploads(profileId, [attachment.storageKey]);
          onChange(attachments.filter((item) => item.storageKey !== attachment.storageKey));
        } else {
          await deleteProposalAttachment(profileId, attachment.id);
          onChange(attachments.filter((item) => item.id !== attachment.id));
        }
        showUserSuccessToast(t('attachmentRemoved'));
      } catch (error) {
        showUserErrorToast(translateAuthRequestError(error, tErrors));
      }
    },
    [attachments, canUpdate, onChange, profileId, t, tErrors],
  );

  return (
    <div className="space-y-2" data-testid={`${testIdPrefix}-attachments`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{t('attachmentsTitle')}</p>
        {canUpdate ? (
          <>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept={ACCEPT}
              disabled={uploading || attachments.length >= PROPOSAL_ATTACHMENT_MAX_COUNT}
              onChange={onInputChange}
              data-testid={`${testIdPrefix}-attachment-input`}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading || attachments.length >= PROPOSAL_ATTACHMENT_MAX_COUNT}
              testId={`${testIdPrefix}-attachment-upload`}
              fullWidth={false}
              onClick={onUploadClick}
            >
              <Upload className="size-4 shrink-0" aria-hidden />
              {uploading ? t('attachmentsUploading') : t('attachmentsAdd')}
            </Button>
          </>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{t('attachmentsHint')}</p>
      {attachments.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Paperclip className="size-4 shrink-0" aria-hidden />
          {t('attachmentsEmpty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-2 rounded-md border-0 bg-muted px-3 py-2"
              data-testid={`${testIdPrefix}-attachment-${attachment.id}`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(attachment.sizeBytes)}</p>
                </div>
              </div>
              {canUpdate ? (
                <button
                  type="button"
                  className="rounded-md p-1.5 text-destructive hover:bg-muted"
                  aria-label={t('attachmentsRemove')}
                  data-testid={`${testIdPrefix}-attachment-remove-${attachment.id}`}
                  onClick={() => void onRemove(attachment)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function pendingAttachmentStorageKeys(attachments: ProposalAttachmentMeta[]): string[] {
  return attachments.filter((item) => item.id.startsWith('pending:')).map((item) => item.storageKey);
}
