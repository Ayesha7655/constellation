/**
 * Seller Trust Badge & Verification — cross-app contracts.
 *
 * Single source of truth shared by frontend + backend for badge types, domains,
 * and the request-status lifecycle. Mirrors the Prisma enums `BadgeType`,
 * `BadgeDomain`, `BadgeRequestStatus` (see apps/backend/prisma/schema.prisma).
 */

/** The four seller trust badges (only `VERIFIED` is FRD-defined; the other three are poster-only). */
export const BADGE_TYPE = {
  VERIFIED: 'VERIFIED',
  TRUSTED_DEALER: 'TRUSTED_DEALER',
  OFFICIAL_MANUFACTURER_PARTNER: 'OFFICIAL_MANUFACTURER_PARTNER',
  OFFICIAL_DISTRIBUTOR: 'OFFICIAL_DISTRIBUTOR',
} as const;
export type BadgeType = (typeof BADGE_TYPE)[keyof typeof BADGE_TYPE];

/** Commercial domain a badge is scoped to — disambiguates the same badge type across markets. */
export const BADGE_DOMAIN = {
  ROBOTS: 'ROBOTS',
  SPARE_PARTS: 'SPARE_PARTS',
} as const;
export type BadgeDomain = (typeof BADGE_DOMAIN)[keyof typeof BADGE_DOMAIN];

/** Persisted application status. `NOT_APPLIED` is the absence of a request row (see below). */
export const BADGE_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type BadgeRequestStatus = (typeof BADGE_REQUEST_STATUS)[keyof typeof BADGE_REQUEST_STATUS];

/** Seller-facing derived state for a single badge (NOT_APPLIED = no request row exists). */
export const BADGE_APPLICATION_STATE = {
  NOT_APPLIED: 'NOT_APPLIED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type BadgeApplicationState = (typeof BADGE_APPLICATION_STATE)[keyof typeof BADGE_APPLICATION_STATE];

/** next-intl label keys for badge type display copy. */
export const BADGE_TYPE_LABEL_KEYS: Record<BadgeType, string> = {
  VERIFIED: 'sellerTrustBadge.type.verified',
  TRUSTED_DEALER: 'sellerTrustBadge.type.trustedDealer',
  OFFICIAL_MANUFACTURER_PARTNER: 'sellerTrustBadge.type.officialManufacturerPartner',
  OFFICIAL_DISTRIBUTOR: 'sellerTrustBadge.type.officialDistributor',
};

/** next-intl label keys for badge domain display copy. */
export const BADGE_DOMAIN_LABEL_KEYS: Record<BadgeDomain, string> = {
  ROBOTS: 'sellerTrustBadge.domain.robots',
  SPARE_PARTS: 'sellerTrustBadge.domain.spareParts',
};

/**
 * Derived verification level shown in the seller/partner Verification module.
 * MVP scale only: `verified` iff the account holds an active `VERIFIED` badge (any domain),
 * else `unverified`. There is NO stored verification-level field — it is computed from
 * active badges. A richer tiered scheme is an open product question.
 * TODO(product): verification level scale undefined.
 */
export const BADGE_VERIFICATION_LEVEL = {
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
} as const;
export type BadgeVerificationLevel = (typeof BADGE_VERIFICATION_LEVEL)[keyof typeof BADGE_VERIFICATION_LEVEL];

/** next-intl label keys for verification-level display copy. */
export const BADGE_VERIFICATION_LEVEL_LABEL_KEYS: Record<BadgeVerificationLevel, string> = {
  verified: 'verification.level.verified',
  unverified: 'verification.level.unverified',
};

/** Max length of the free-text applicant note on a badge request. */
export const BADGE_APPLICANT_NOTE_MAX_LENGTH = 2000;

/** Max length of an admin decision or revocation message. */
export const BADGE_DECISION_MESSAGE_MAX_LENGTH = 2000;

/**
 * Active seller trust badge exposed on public surfaces (listing seller card, future public profile).
 * Structured fields come from the source request when present (e.g. brand for distributors).
 */
export type PublicSellerTrustBadge = Readonly<{
  badgeType: BadgeType;
  domain: BadgeDomain;
  structuredFields: Readonly<Record<string, string>>;
}>;

/**
 * Allowed MIME types for badge evidence documents. Passed per-call to
 * `UploadService.uploadFile(dto, { allowedMimeTypes })`. File-size is governed by
 * the global `UPLOAD_MAX_FILE_SIZE_MB` cap (no badge-specific byte limit).
 */
export const BADGE_EVIDENCE_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** File-picker `accept` value — extensions plus MIME types for reliable OS dialogs. */
export const BADGE_EVIDENCE_ACCEPT_ATTR =
  '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';

const BADGE_EVIDENCE_EXTENSION_MIME: Readonly<Record<string, (typeof BADGE_EVIDENCE_ALLOWED_MIME_TYPES)[number]>> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/** Resolve a badge evidence MIME type from `File.type`, falling back to the file extension. */
export function resolveBadgeEvidenceMimeType(file: Pick<File, 'name' | 'type'>): string {
  if (file.type && (BADGE_EVIDENCE_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return file.type;
  }
  const dotIndex = file.name.lastIndexOf('.');
  if (dotIndex >= 0) {
    const extension = file.name.slice(dotIndex).toLowerCase();
    const fromExtension = BADGE_EVIDENCE_EXTENSION_MIME[extension];
    if (fromExtension) {
      return fromExtension;
    }
  }
  return file.type;
}

export function isBadgeEvidenceFileAllowed(file: Pick<File, 'name' | 'size' | 'type'>, maxBytes: number): boolean {
  if (file.size <= 0 || file.size > maxBytes) {
    return false;
  }
  const mimeType = resolveBadgeEvidenceMimeType(file);
  return (BADGE_EVIDENCE_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Maximum number of evidence documents attachable to a single badge request. */
export const BADGE_EVIDENCE_MAX_DOCUMENTS = 10;

/** Audit-trail action recorded for each badge decision (mirrors Prisma `BadgeDecisionAction`). */
export const BADGE_DECISION_ACTION = {
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVOKED: 'REVOKED',
} as const;
export type BadgeDecisionAction = (typeof BADGE_DECISION_ACTION)[keyof typeof BADGE_DECISION_ACTION];
