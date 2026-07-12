/**
 * Cross-app domain-event contract for the notification platform (Epic 4).
 *
 * Modules raise notifications by **emitting an event**, not by importing the notification module's
 * internals. The platform ships one application-level relay event — `notification.requested` — whose
 * payload is a notify-ready request. A platform orchestrator listens for it and dispatches.
 *
 * Intended shape: feature modules emit their own domain events; a module-specific orchestrator applies
 * recipient-targeting and re-emits `notification.requested`. Direct emission of `notification.requested`
 * is a supported convenience seam — the emitter then depends only on these shared types, never on the
 * notification module.
 *
 * Framework-agnostic on purpose (no Prisma / Nest imports) so both apps can share it.
 */

/**
 * Entity-reference keys for deep-linking. A notification stores `entityType` (one of these) + an
 * optional `entityId`; the frontend resolver maps `(dashboard, entityType)` → a route. Shared so the
 * emitter and the resolver agree at compile time. Extend here when a new linkable entity appears.
 */
export const NOTIFICATION_ENTITY = {
  LISTING: 'listing',
  DEAL_ROOM: 'deal_room',
  SESSION: 'session',
  INSPECTION: 'inspection',
  CERTIFIED_STOCK: 'certified_stock',
  LEAD: 'lead',
  PAYMENT: 'payment',
  BADGE_REQUEST: 'badge_request',
  EXPERT_CREDITS: 'expert_credits',
  MATCH_SESSION: 'match_session',
} as const;

export type NotificationEntityType = (typeof NOTIFICATION_ENTITY)[keyof typeof NOTIFICATION_ENTITY];

/**
 * Notification *type* keys for the robot-listing moderation lifecycle (DEV-32197). These are the
 * `type` values registered in the platform catalog (`NOTIFICATION_TYPES`) and carried on
 * {@link NotificationRequestedPayload.type}. Shared so the listing orchestrator (emitter) and the
 * catalog agree at compile time. Reuses the existing {@link NOTIFICATION_ENTITY.LISTING} entity —
 * no new entity key is introduced.
 */
export const LISTING_NOTIFICATION = {
  SUBMITTED: 'listing.submitted',
  RESUBMITTED: 'listing.resubmitted',
  APPROVED: 'listing.approved',
  REJECTED: 'listing.rejected',
  UNPUBLISHED: 'listing.unpublished',
  REPUBLISHED: 'listing.republished',
} as const;

export type ListingNotificationType = (typeof LISTING_NOTIFICATION)[keyof typeof LISTING_NOTIFICATION];

/**
 * Notification *type* keys for the stale-listing reminder module (Epic 3). Registered in the platform
 * catalog (`NOTIFICATION_TYPES`) and carried on {@link NotificationRequestedPayload.type}. Shared so the
 * stale orchestrator (emitter) and the catalog agree at compile time. Reuses the existing
 * {@link NOTIFICATION_ENTITY.LISTING} entity — no new entity key is introduced.
 *
 * Key-matching: `REMINDER_1`/`REMINDER_2` values **must** equal the seeded staleness-policy `template_key`
 * values (`listing.stale_reminder_1` / `_2`) so the engine's `sequence` maps onto a registered type.
 * `ADMIN_REVIEW` is **catalog-only** — the seq3 policy row has `template_key = NULL`; the orchestrator's
 * admin-review-due handler selects this key directly. A 3rd reminder would need both a new policy row and
 * a key here.
 */
export const STALE_LISTING_NOTIFICATION = {
  REMINDER_1: 'listing.stale_reminder_1',
  REMINDER_2: 'listing.stale_reminder_2',
  ADMIN_REVIEW: 'listing.stale_admin_review',
} as const;

export type StaleListingNotificationType =
  (typeof STALE_LISTING_NOTIFICATION)[keyof typeof STALE_LISTING_NOTIFICATION];

/**
 * Notification *type* keys for the generic inspection lifecycle (DEV-32197). Registered in the platform
 * catalog (`NOTIFICATION_TYPES`) and carried on {@link NotificationRequestedPayload.type}. Shared so the
 * inspection orchestrator (emitter) and the catalog agree at compile time. Reuses the existing
 * {@link NOTIFICATION_ENTITY.INSPECTION} entity — no new entity key is introduced.
 */
export const INSPECTION_NOTIFICATION = {
  REQUESTED: 'inspection.requested',
  ASSIGNED: 'inspection.assigned',
  SCHEDULED: 'inspection.scheduled',
  STARTED: 'inspection.started',
  REPORT_SUBMITTED: 'inspection.report_submitted',
  REVIEW_STARTED: 'inspection.review_started',
  PASSED: 'inspection.passed',
  FAILED: 'inspection.failed',
  BADGE_ASSIGNED: 'inspection.badge_assigned',
  BADGE_REVOKED: 'inspection.badge_revoked',
} as const;

export type InspectionNotificationType = (typeof INSPECTION_NOTIFICATION)[keyof typeof INSPECTION_NOTIFICATION];

/**
 * Notification *type* keys for the Certified Stock lifecycle (DEV-32197). Registered in the platform
 * catalog (`NOTIFICATION_TYPES`) and carried on {@link NotificationRequestedPayload.type}. Shared so the
 * certified-stock orchestrator (emitter) and the catalog agree at compile time. Reuses the existing
 * {@link NOTIFICATION_ENTITY.CERTIFIED_STOCK} entity — no new entity key is introduced.
 */
export const CERTIFIED_STOCK_NOTIFICATION = {
  REQUEST_SUBMITTED: 'certified_stock.request_submitted',
  REQUEST_APPROVED: 'certified_stock.request_approved',
  REQUEST_REJECTED: 'certified_stock.request_rejected',
  SHIPPED: 'certified_stock.shipped',
  RECEIVED: 'certified_stock.received',
  INSPECTOR_ASSIGNED: 'certified_stock.inspector_assigned',
  INSPECTION_SCHEDULED: 'certified_stock.inspection_scheduled',
  INSPECTION_STARTED: 'certified_stock.inspection_started',
  REPORT_SUBMITTED: 'certified_stock.report_submitted',
  REVIEW_STARTED: 'certified_stock.review_started',
  CERTIFIED: 'certified_stock.certified',
  FAILED: 'certified_stock.failed',
  BADGES_ASSIGNED: 'certified_stock.badges_assigned',
  PUBLISHED: 'certified_stock.published',
} as const;

export type CertifiedStockNotificationType =
  (typeof CERTIFIED_STOCK_NOTIFICATION)[keyof typeof CERTIFIED_STOCK_NOTIFICATION];

/**
 * Notification *type* keys for secure payment / transaction lifecycle (DEV-32701 Phase 4).
 * Entity: {@link NOTIFICATION_ENTITY.PAYMENT} with `entityId` = payment transaction id.
 */
export const PAYMENT_NOTIFICATION = {
  FUNDED: 'payment.funded',
  DISPUTE_OPENED: 'payment.dispute_opened',
  DISPUTE_CLOSED: 'payment.dispute_closed',
  REFUNDED: 'payment.refunded',
} as const;

export type PaymentNotificationType = (typeof PAYMENT_NOTIFICATION)[keyof typeof PAYMENT_NOTIFICATION];

/**
 * Notification *type* keys for the seller trust badge lifecycle. Registered in the platform
 * catalog and carried on {@link NotificationRequestedPayload.type}.
 */
export const SELLER_TRUST_BADGE_NOTIFICATION = {
  SUBMITTED: 'seller_trust_badge.submitted',
  APPROVED: 'seller_trust_badge.approved',
  REJECTED: 'seller_trust_badge.rejected',
  REVOKED: 'seller_trust_badge.revoked',
} as const;

export type SellerTrustBadgeNotificationType =
  (typeof SELLER_TRUST_BADGE_NOTIFICATION)[keyof typeof SELLER_TRUST_BADGE_NOTIFICATION];

export const EXPERT_CREDITS_NOTIFICATION = {
  PURCHASED: 'expert_credits.purchased',
  ADJUSTED: 'expert_credits.adjusted',
  LOW_BALANCE: 'expert_credits.low_balance',
} as const;

export type ExpertCreditsNotificationType =
  (typeof EXPERT_CREDITS_NOTIFICATION)[keyof typeof EXPERT_CREDITS_NOTIFICATION];

/**
 * Notification *type* keys for the guided matching engine (Phase A / FRD §18.1).
 * Entity: {@link NOTIFICATION_ENTITY.MATCH_SESSION}.
 */
export const MATCHING_NOTIFICATION = {
  SEARCH_COMPLETED: 'matching.search_completed',
  REQUIREMENTS_UPDATED: 'matching.requirements_updated',
} as const;

export type MatchingNotificationType = (typeof MATCHING_NOTIFICATION)[keyof typeof MATCHING_NOTIFICATION];

/**
 * English email template identifiers — one per notification event (DEV-32197). The orchestrators carry
 * the chosen id on the in-app payload as `emailTemplate`; the backend email renderer
 * (`notifications/transports/email-templates.ts`) maps id → an English subject/body pair. Identifiers
 * live in shared so emitters and the renderer agree at compile time; the rendering logic itself stays in
 * backend code (no template engine in shared). In-app copy stays localized and separate from these.
 */
export const EMAIL_TEMPLATE = {
  // Listing moderation
  LISTING_SUBMITTED: 'listing_submitted',
  LISTING_RESUBMITTED: 'listing_resubmitted',
  LISTING_APPROVED: 'listing_approved',
  LISTING_REJECTED: 'listing_rejected',
  LISTING_UNPUBLISHED: 'listing_unpublished',
  LISTING_REPUBLISHED: 'listing_republished',
  // Stale-listing reminder module (Epic 3)
  STALE_REMINDER_1: 'listing_stale_reminder_1',
  STALE_REMINDER_2: 'listing_stale_reminder_2',
  STALE_ADMIN_REVIEW: 'listing_stale_admin_review',
  // Generic inspection lifecycle
  INSPECTION_REQUESTED: 'inspection_requested',
  INSPECTION_ASSIGNED: 'inspection_assigned',
  INSPECTION_SCHEDULED: 'inspection_scheduled',
  INSPECTION_STARTED: 'inspection_started',
  INSPECTION_REPORT_SUBMITTED: 'inspection_report_submitted',
  INSPECTION_REVIEW_STARTED: 'inspection_review_started',
  INSPECTION_PASSED: 'inspection_passed',
  INSPECTION_FAILED: 'inspection_failed',
  INSPECTION_BADGE_ASSIGNED: 'inspection_badge_assigned',
  INSPECTION_BADGE_REVOKED: 'inspection_badge_revoked',
  // Certified Stock lifecycle
  CERTIFIED_STOCK_REQUEST_SUBMITTED: 'certified_stock_request_submitted',
  CERTIFIED_STOCK_REQUEST_APPROVED: 'certified_stock_request_approved',
  CERTIFIED_STOCK_REQUEST_REJECTED: 'certified_stock_request_rejected',
  CERTIFIED_STOCK_SHIPPED: 'certified_stock_shipped',
  CERTIFIED_STOCK_RECEIVED: 'certified_stock_received',
  CERTIFIED_STOCK_INSPECTOR_ASSIGNED: 'certified_stock_inspector_assigned',
  CERTIFIED_STOCK_INSPECTION_SCHEDULED: 'certified_stock_inspection_scheduled',
  CERTIFIED_STOCK_INSPECTION_STARTED: 'certified_stock_inspection_started',
  CERTIFIED_STOCK_REPORT_SUBMITTED: 'certified_stock_report_submitted',
  CERTIFIED_STOCK_REVIEW_STARTED: 'certified_stock_review_started',
  CERTIFIED_STOCK_CERTIFIED: 'certified_stock_certified',
  CERTIFIED_STOCK_FAILED: 'certified_stock_failed',
  CERTIFIED_STOCK_BADGES_ASSIGNED: 'certified_stock_badges_assigned',
  CERTIFIED_STOCK_PUBLISHED: 'certified_stock_published',
  // Secure payment lifecycle (DEV-32701 Phase 4)
  PAYMENT_FUNDED: 'payment_funded',
  PAYMENT_DISPUTE_OPENED: 'payment_dispute_opened',
  PAYMENT_DISPUTE_CLOSED: 'payment_dispute_closed',
  PAYMENT_REFUNDED: 'payment_refunded',
  // Seller trust badge lifecycle
  SELLER_TRUST_BADGE_SUBMITTED: 'seller_trust_badge_submitted',
  SELLER_TRUST_BADGE_APPROVED: 'seller_trust_badge_approved',
  SELLER_TRUST_BADGE_REJECTED: 'seller_trust_badge_rejected',
  SELLER_TRUST_BADGE_REVOKED: 'seller_trust_badge_revoked',
  // Expert credits lifecycle
  EXPERT_CREDITS_PURCHASED: 'expert_credits_purchased',
  EXPERT_CREDITS_ADJUSTED: 'expert_credits_adjusted',
  EXPERT_CREDITS_LOW_BALANCE: 'expert_credits_low_balance',
  // Matching engine
  MATCHING_SEARCH_COMPLETED: 'matching_search_completed',
  MATCHING_REQUIREMENTS_UPDATED: 'matching_requirements_updated',
} as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATE)[keyof typeof EMAIL_TEMPLATE];

/** Channel keys — mirror the backend Prisma `NotificationChannel` enum string values. */
export type NotificationChannelKey = 'IN_APP' | 'EMAIL' | 'PUSH';

export const NOTIFICATION_CHANNEL_KEYS: ReadonlyArray<NotificationChannelKey> = ['IN_APP', 'EMAIL', 'PUSH'];

/**
 * JSON value types for the type-specific `payload` blob. Shaped to mirror Prisma input-JSON semantics
 * (readonly index, readonly arrays, nested `null` allowed) so a `JsonObject` assigns to
 * `Prisma.InputJsonObject` at the dispatch boundary without casting or widening backend contracts.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | ReadonlyArray<JsonValue>
  | { readonly [key: string]: JsonValue };

export type JsonObject = { readonly [key: string]: JsonValue };

/** Event name for the platform notification relay. */
export const NOTIFICATION_REQUESTED_EVENT = 'notification.requested';

/** Payload for {@link NOTIFICATION_REQUESTED_EVENT}: a notify-ready request. */
export interface NotificationRequestedPayload {
  recipientUserId: string;
  type: string;
  payload?: JsonObject;
  channels?: NotificationChannelKey[];
  entityType?: string;
  entityId?: string;
}

/**
 * Mechanism for compile-time agreement between emitters and listeners: event name → payload. Future
 * domain events are added by extending this map, not by changing the orchestrator wiring.
 */
export interface DomainEventPayloadMap {
  [NOTIFICATION_REQUESTED_EVENT]: NotificationRequestedPayload;
}
