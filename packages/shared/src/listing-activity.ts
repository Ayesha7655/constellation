// Stale Listing Reminder module (Epic 1, Ticket 1.4).
// Canonical event-type keys for the listing activity log. These are the contract used by the
// activity recorder's callers and by the DB seed of `listing_activity_event_type`; the catalog
// row carries the behavioural flags (`event_class`, `reset_staleness`). Mirrors the permission-key
// pattern: code references the constant, the DB row is the source of truth for behaviour.

export const LISTING_ACTIVITY_EVENT_TYPE = {
  // reset_staleness = true (seller-deliberate actions + admin approval)
  LISTING_CREATED: 'listing_created',
  LISTING_APPROVED: 'listing_approved',
  LISTING_UPDATED: 'listing_updated',
  STOCK_UPDATED: 'stock_updated',
  LISTING_REACTIVATED: 'listing_reactivated',
  LISTING_CONFIRMED_ACTIVE: 'listing_confirmed_active',
  // reset_staleness = false (buyer-side and other non-qualifying events, audit-only)
  LEAD_RECEIVED: 'lead_received',
  OFFER_RECEIVED: 'offer_received',
  LISTING_VIEWED: 'listing_viewed',
  SECURE_PAYMENT_STATE_CHANGED: 'secure_payment_state_changed',
} as const;

// `ListingActivityEventType` is the SUBJECT-event (producer-facing) contract — the only keys the
// in-transaction recorder accepts. Engine-only audit keys are kept in a separate union below so a
// producer can never accidentally record a system-only event through the subject-event write path.
export type ListingActivityEventType =
  (typeof LISTING_ACTIVITY_EVENT_TYPE)[keyof typeof LISTING_ACTIVITY_EVENT_TYPE];

// Stale Listing Reminder module (Epic 2, Ticket 2.4). engine_event class, reset_staleness = false:
// audit rows the evaluation engine writes when it emits a stale domain event (never reset, per the
// DB CHECK constraint). Written only via the engine's own `appendEngineEvent` path, never the recorder.
export const LISTING_ENGINE_EVENT_TYPE = {
  STALENESS_REMINDER_EMITTED: 'staleness_reminder_emitted',
  STALENESS_ADMIN_REVIEW_EMITTED: 'staleness_admin_review_emitted',
} as const;

export type ListingEngineEventType = (typeof LISTING_ENGINE_EVENT_TYPE)[keyof typeof LISTING_ENGINE_EVENT_TYPE];
