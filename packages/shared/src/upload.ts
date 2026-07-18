/** S3 module segment for authenticated profile photo uploads (`constellation/profile-photos/…`). */
export const PROFILE_PHOTO_UPLOAD_MODULE = 'profile-photos';

/** S3 module segment for inspection partner report documents (`constellation/inspection-reports/…`). */
export const INSPECTION_REPORT_UPLOAD_MODULE = 'inspection-reports';

/** S3 module segment for seller trust badge evidence documents (`constellation/seller-trust-badge-evidence/…`). */
export const SELLER_TRUST_BADGE_EVIDENCE_UPLOAD_MODULE = 'seller-trust-badge-evidence';

/** S3 module segment for Upwork proposal document attachments (`constellation/proposal-attachments/…`). */
export const PROPOSAL_ATTACHMENT_UPLOAD_MODULE = 'proposal-attachments';

const STORAGE_ROOT_PREFIX = 'constellation';

const PROPOSAL_ATTACHMENT_KEY_RE = new RegExp(
  `^${STORAGE_ROOT_PREFIX}/${PROPOSAL_ATTACHMENT_UPLOAD_MODULE}/\\d{4}/\\d{2}/\\d{2}/[0-9a-f-]{36}\\.[a-z0-9]{1,12}$`,
  'i',
);

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function sanitizeExtension(fileName: string): string {
  const match = /\.([a-z0-9]{1,12})$/i.exec(fileName.trim());
  return (match?.[1] ?? 'bin').toLowerCase();
}

/** Build a storage key: `constellation/proposal-attachments/YYYY/MM/DD/{uuid}.{ext}`. */
export function buildProposalAttachmentStorageKey(fileName: string, id: string, now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = pad2(now.getUTCMonth() + 1);
  const day = pad2(now.getUTCDate());
  const ext = sanitizeExtension(fileName);
  return `${STORAGE_ROOT_PREFIX}/${PROPOSAL_ATTACHMENT_UPLOAD_MODULE}/${year}/${month}/${day}/${id}.${ext}`;
}

export function isProposalAttachmentStorageKey(key: string): boolean {
  return PROPOSAL_ATTACHMENT_KEY_RE.test(key.trim());
}

export function assertProposalAttachmentStorageKey(key: string): void {
  if (!isProposalAttachmentStorageKey(key)) {
    throw new Error('Invalid proposal attachment storage key');
  }
}
