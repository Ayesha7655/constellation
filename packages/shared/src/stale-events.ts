// Stale Listing Reminder module (Epic 2, Ticket 2.4).
// Domain events the evaluation engine emits when a policy step falls due. The engine emits FACTS
// only — it carries no recipients and builds no notification payloads; the Epic 3 orchestrator
// (`StaleListingNotificationsOrchestrator`) subscribes via `@OnEvent` and translates these into
// platform `notification.requested` emissions. These strings are EventEmitter2 event names, distinct
// from notification catalog keys.

export const STALE_DOMAIN_EVENT = {
  /** A NOTIFY_SELLER step came due — send the seller reminder for `sequence`. */
  REMINDER_DUE: 'stale.reminder_due',
  /** The FLAG_FOR_ADMIN_REVIEW step came due — the listing was flagged for admin review. */
  ADMIN_REVIEW_DUE: 'stale.admin_review_due',
} as const;

export type StaleDomainEvent = (typeof STALE_DOMAIN_EVENT)[keyof typeof STALE_DOMAIN_EVENT];

/** Payload for {@link STALE_DOMAIN_EVENT.REMINDER_DUE}. */
export interface StaleReminderDuePayload {
  listingId: string;
  /** The policy `sequence` that came due (e.g. 1 = first reminder, 2 = second). */
  sequence: number;
}

/** Payload for {@link STALE_DOMAIN_EVENT.ADMIN_REVIEW_DUE}. */
export interface StaleAdminReviewDuePayload {
  listingId: string;
  /** The policy `sequence` of the flag step. */
  sequence: number;
}
