/**
 * Canonical Certified Stock request lifecycle (Epic 8), shared by backend (status guard,
 * timeline labels) and frontend (status badges). Single source of truth for the request
 * sequence — distinct from the inspection lifecycle.
 *
 * String-union mirror of the Prisma `CertifiedStockRequestStatus` enum (this package cannot
 * import Prisma). A backend unit test asserts this sequence equals the enum values so the two
 * never drift.
 *
 * Lifecycle:
 *   Submitted -> Approved -> Shipped -> Received -> Certified
 *                 (Rejected | Failed are terminal off-ramps)
 */
export const CERTIFIED_STOCK_STATUS_SEQUENCE = [
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'SHIPPED',
  'RECEIVED',
  'CERTIFIED',
  'FAILED',
] as const;

export type CertifiedStockRequestStatusKey = (typeof CERTIFIED_STOCK_STATUS_SEQUENCE)[number];

/** i18n message keys for each status label (resolved under the `certifiedStockStatus` namespace). */
export const CERTIFIED_STOCK_STATUS_LABEL_KEYS: Record<CertifiedStockRequestStatusKey, string> = {
  SUBMITTED: 'certifiedStockStatus.submitted',
  APPROVED: 'certifiedStockStatus.approved',
  REJECTED: 'certifiedStockStatus.rejected',
  SHIPPED: 'certifiedStockStatus.shipped',
  RECEIVED: 'certifiedStockStatus.received',
  CERTIFIED: 'certifiedStockStatus.certified',
  FAILED: 'certifiedStockStatus.failed',
};

const CERTIFIED_STOCK_STATUS_SET: ReadonlySet<string> = new Set(CERTIFIED_STOCK_STATUS_SEQUENCE);

/** Type guard: whether an arbitrary string is a canonical Certified Stock request status. */
export function isCertifiedStockRequestStatusKey(value: string): value is CertifiedStockRequestStatusKey {
  return CERTIFIED_STOCK_STATUS_SET.has(value);
}
