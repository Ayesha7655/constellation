/**
 * Canonical inspection enum values and i18n label keys — shared by backend (OpenAPI / sync tests)
 * and frontend (tables, detail views, deal-room timeline). Mirrors Prisma enums; backend unit tests
 * assert these arrays match generated enum values so labels never drift from the API.
 */

export const INSPECTION_SCENARIO_SEQUENCE = [
  'CERTIFIED_HUB',
  'BUYER_REQUESTED',
  'STANDALONE_OWNER_BOOKED',
] as const;

export type InspectionScenarioKey = (typeof INSPECTION_SCENARIO_SEQUENCE)[number];

export const INSPECTION_SCENARIO_LABEL_KEYS: Record<InspectionScenarioKey, string> = {
  CERTIFIED_HUB: 'inspectionScenario.certifiedHub',
  BUYER_REQUESTED: 'inspectionScenario.buyerRequested',
  STANDALONE_OWNER_BOOKED: 'inspectionScenario.standaloneOwnerBooked',
};

export const INSPECTION_ORIGIN_SEQUENCE = [
  'BUYER',
  'SELLER_LISTING_TRUST',
  'OWNER',
  'ADMIN',
] as const;

export type InspectionOriginKey = (typeof INSPECTION_ORIGIN_SEQUENCE)[number];

export const INSPECTION_ORIGIN_LABEL_KEYS: Record<InspectionOriginKey, string> = {
  BUYER: 'inspectionOrigin.buyer',
  SELLER_LISTING_TRUST: 'inspectionOrigin.sellerListingTrust',
  OWNER: 'inspectionOrigin.owner',
  ADMIN: 'inspectionOrigin.admin',
};

export const INSPECTION_ACTION_SEQUENCE = [
  'REQUEST_CREATED',
  'PARTNER_ASSIGNED',
  'STATUS_CHANGED',
  'REPORT_SUBMITTED',
  'REVIEWED',
  'OUTCOME_RECORDED',
  'BADGE_GRANTED',
  'BADGE_REVOKED',
  'BUYER_DECISION_RECORDED',
] as const;

export type InspectionActionKey = (typeof INSPECTION_ACTION_SEQUENCE)[number];

export const INSPECTION_ACTION_LABEL_KEYS: Record<InspectionActionKey, string> = {
  REQUEST_CREATED: 'inspectionAction.requestCreated',
  PARTNER_ASSIGNED: 'inspectionAction.partnerAssigned',
  STATUS_CHANGED: 'inspectionAction.statusChanged',
  REPORT_SUBMITTED: 'inspectionAction.reportSubmitted',
  REVIEWED: 'inspectionAction.reviewed',
  OUTCOME_RECORDED: 'inspectionAction.outcomeRecorded',
  BADGE_GRANTED: 'inspectionAction.badgeGranted',
  BADGE_REVOKED: 'inspectionAction.badgeRevoked',
  BUYER_DECISION_RECORDED: 'inspectionAction.buyerDecisionRecorded',
};

export const INSPECTION_BADGE_SEQUENCE = [
  'ROBOT24_INSPECTED',
  'INSPECTION_REPORT_AVAILABLE',
  'ROBOT24_CERTIFIED_STOCK',
] as const;

export type InspectionBadgeKey = (typeof INSPECTION_BADGE_SEQUENCE)[number];

export const INSPECTION_BADGE_LABEL_KEYS: Record<InspectionBadgeKey, string> = {
  ROBOT24_INSPECTED: 'inspectionBadge.constellationInspected',
  INSPECTION_REPORT_AVAILABLE: 'inspectionBadge.inspectionReportAvailable',
  ROBOT24_CERTIFIED_STOCK: 'inspectionBadge.constellationCertifiedStock',
};

export const INSPECTION_REPORT_STATUS_SEQUENCE = ['SUBMITTED', 'APPROVED', 'REJECTED'] as const;

export type InspectionReportStatusKey = (typeof INSPECTION_REPORT_STATUS_SEQUENCE)[number];

export const INSPECTION_REPORT_STATUS_LABEL_KEYS: Record<InspectionReportStatusKey, string> = {
  SUBMITTED: 'inspectionReportStatus.submitted',
  APPROVED: 'inspectionReportStatus.approved',
  REJECTED: 'inspectionReportStatus.rejected',
};

export const INSPECTION_OUTCOME_SEQUENCE = ['PASS', 'FAIL'] as const;

export type InspectionOutcomeKey = (typeof INSPECTION_OUTCOME_SEQUENCE)[number];

export const INSPECTION_OUTCOME_LABEL_KEYS: Record<InspectionOutcomeKey, string> = {
  PASS: 'inspectionOutcome.pass',
  FAIL: 'inspectionOutcome.fail',
};
