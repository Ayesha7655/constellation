/**
 * Canonical inspection lifecycle, shared by backend (tracker derivation, status guard) and
 * frontend (progress-bar rendering). This is the single source of truth for "the full
 * inspection sequence" and for "unsupported statuses cannot be shown" (Ticket 3.2).
 *
 * String-union mirror of the Prisma `InspectionStatus` enum (this package cannot import Prisma).
 * A backend unit test asserts this sequence equals the enum values so the two never drift.
 *
 * Authoritative lifecycle (FRD):
 *   Requested -> Partner Assigned -> Scheduled -> In Progress -> Report Submitted
 *     -> Reviewed -> Passed/Failed -> Completed
 */
export const INSPECTION_STATUS_SEQUENCE = [
  'REQUESTED',
  'PARTNER_ASSIGNED',
  'SCHEDULED',
  'IN_PROGRESS',
  'REPORT_SUBMITTED',
  'REVIEWED',
  'PASSED',
  'FAILED',
  'COMPLETED',
] as const;

export type InspectionStatusKey = (typeof INSPECTION_STATUS_SEQUENCE)[number];

/**
 * Stepper position for the progress tracker. `PASSED` and `FAILED` are the two faces of the same
 * "outcome" milestone (they share index 6 — a case reaches one or the other, never both);
 * `COMPLETED` is the final step. Used to compute how far a case has progressed.
 */
export const INSPECTION_STATUS_ORDER: Record<InspectionStatusKey, number> = {
  REQUESTED: 0,
  PARTNER_ASSIGNED: 1,
  SCHEDULED: 2,
  IN_PROGRESS: 3,
  REPORT_SUBMITTED: 4,
  REVIEWED: 5,
  PASSED: 6,
  FAILED: 6,
  COMPLETED: 7,
};

/** i18n message keys for each status label (resolved under the `inspectionStatus` namespace). */
export const INSPECTION_STATUS_LABEL_KEYS: Record<InspectionStatusKey, string> = {
  REQUESTED: 'inspectionStatus.requested',
  PARTNER_ASSIGNED: 'inspectionStatus.partnerAssigned',
  SCHEDULED: 'inspectionStatus.scheduled',
  IN_PROGRESS: 'inspectionStatus.inProgress',
  REPORT_SUBMITTED: 'inspectionStatus.reportSubmitted',
  REVIEWED: 'inspectionStatus.reviewed',
  PASSED: 'inspectionStatus.passed',
  FAILED: 'inspectionStatus.failed',
  COMPLETED: 'inspectionStatus.completed',
};

const INSPECTION_STATUS_SET: ReadonlySet<string> = new Set(INSPECTION_STATUS_SEQUENCE);

/** Type guard: whether an arbitrary string is a canonical inspection status. */
export function isInspectionStatusKey(value: string): value is InspectionStatusKey {
  return INSPECTION_STATUS_SET.has(value);
}

/** Stepper index for a status, or `-1` when the value is not a canonical status. */
export function getInspectionStatusOrder(value: string): number {
  return isInspectionStatusKey(value) ? INSPECTION_STATUS_ORDER[value] : -1;
}
