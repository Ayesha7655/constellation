/**
 * Matching engine contracts — shared by backend scoring, public/buyer APIs, and UI strips.
 * Locked decisions: docs/consultant-matching-platform.md §5.6.
 */

import type { ListingPurchaseBundle, MakeItGreenStep } from './listing-purchase-bundles';

export type { ListingPurchaseBundle, MakeItGreenStep } from './listing-purchase-bundles';

export const MATCH_SCORE_INPUT_KEYS = [
  'usecase',
  'environment',
  'availability',
  'budget',
  'setup',
  'partner',
  'trust',
  'confidence',
] as const;

export type MatchScoreInputKey = (typeof MATCH_SCORE_INPUT_KEYS)[number];

export const DEFAULT_MATCH_SCORE_WEIGHTS: Readonly<Record<MatchScoreInputKey, number>> = {
  usecase: 25,
  environment: 15,
  availability: 10,
  budget: 15,
  setup: 10,
  partner: 10,
  trust: 10,
  confidence: 5,
};

export const READY_TO_USE_STATUS = {
  GREEN: 'green',
  YELLOW: 'yellow',
  ORANGE: 'orange',
  RED: 'red',
} as const;

export type ReadyToUseStatus = (typeof READY_TO_USE_STATUS)[keyof typeof READY_TO_USE_STATUS];

export const READY_TO_USE_LABEL = {
  green: 'Ready to Use',
  yellow: 'Setup Needed',
  orange: 'Expert Planning Needed',
  red: 'Not Recommended',
} as const satisfies Record<ReadyToUseStatus, string>;

export const MAKE_IT_GREEN_PATH = {
  NONE: 'none',
  SERVICE_PARTNER: 'service_partner',
  CONSULTANT_PLUS_PARTNER: 'consultant_plus_partner',
  NOT_RECOMMENDED: 'not_recommended',
} as const;

export type MakeItGreenPath = (typeof MAKE_IT_GREEN_PATH)[keyof typeof MAKE_IT_GREEN_PATH];

export const MATCH_TYPE = {
  DIRECT_FIT: 'direct_fit',
  FIT_WITH_SETUP: 'fit_with_setup',
  CUSTOM_IMPLEMENTATION_REQUIRED: 'custom_implementation_required',
  NOT_RECOMMENDED: 'not_recommended',
  MORE_INFORMATION_NEEDED: 'more_information_needed',
} as const;

export type MatchType = (typeof MATCH_TYPE)[keyof typeof MATCH_TYPE];

export const MATCH_CTA = {
  START_PURCHASE: 'start_purchase',
  BUY_VIA_ROBOT24: 'buy_via_constellation',
  REQUEST_QUOTE: 'request_quote',
  START_PURCHASE_PLUS_INSTALLATION: 'start_purchase_plus_installation',
  VIEW_INSTALLATION_PACKAGE: 'view_installation_package',
  ASK_ROBOTICS_CONSULTANT: 'ask_robotics_consultant',
  PREPARE_IMPLEMENTATION_BRIEF: 'prepare_implementation_brief',
  REQUEST_IMPLEMENTATION_QUOTE: 'request_implementation_quote',
  VIEW_BETTER_ALTERNATIVES: 'view_better_alternatives',
  ASK_CONSULTANT_WHY: 'ask_consultant_why',
  CHANGE_REQUIREMENTS: 'change_requirements',
} as const;

export type MatchCta = (typeof MATCH_CTA)[keyof typeof MATCH_CTA];

export const MATCH_REQUIRED_ACTION = {
  INSTALLATION: 'installation',
  SETUP: 'setup',
  MAPPING: 'mapping',
  TRAINING: 'training',
  PROGRAMMING: 'programming',
  INTEGRATION: 'integration',
  CONSULTANT_REVIEW: 'consultant_review',
  IMPLEMENTATION_BRIEF: 'implementation_brief',
  CUSTOM_QUOTE: 'custom_quote',
} as const;

export type MatchRequiredAction = (typeof MATCH_REQUIRED_ACTION)[keyof typeof MATCH_REQUIRED_ACTION];

export const MATCH_BUYING_OPTION = {
  BUY_NEW: 'buy_new',
  USED: 'used',
  DEMO_UNIT: 'demo_unit',
  PRE_ORDER: 'pre_order',
  LEASE: 'lease',
  RAAS: 'raas',
  NOT_SURE: 'not_sure',
} as const;

export type MatchBuyingOption = (typeof MATCH_BUYING_OPTION)[keyof typeof MATCH_BUYING_OPTION];

export const MATCH_BUDGET_BAND = {
  UNDER_10K: 'under_10k',
  FROM_10K_TO_25K: '10k_25k',
  FROM_25K_TO_50K: '25k_50k',
  FROM_50K_TO_100K: '50k_100k',
  OVER_100K: '100k_plus',
  NOT_SURE: 'not_sure',
} as const;

export type MatchBudgetBand = (typeof MATCH_BUDGET_BAND)[keyof typeof MATCH_BUDGET_BAND];

export const MATCH_BUDGET_BAND_RANGE: Readonly<
  Record<Exclude<MatchBudgetBand, 'not_sure'>, Readonly<{ min: number; max: number | null }>>
> = {
  under_10k: { min: 0, max: 9999.99 },
  '10k_25k': { min: 10000, max: 25000 },
  '25k_50k': { min: 25000, max: 50000 },
  '50k_100k': { min: 50000, max: 100000 },
  '100k_plus': { min: 100000, max: null },
};

export const DEFAULT_MATCH_COLOUR_THRESHOLDS = {
  greenMin: 90,
  yellowMin: 70,
  orangeMin: 50,
} as const;

export const DEFAULT_MATCH_FLAG_RULES = {
  boundaryProximityPercent: 5,
  highTransactionValue: 50000,
} as const;

export const MATCH_OVERRIDE_REASON_CATEGORY = {
  INCOMPLETE_DATA: 'incomplete_data',
  MANUAL_INSPECTION: 'manual_inspection',
  CUSTOMER_CONFIRMED: 'customer_confirmed',
  SELLER_CONFIRMED: 'seller_confirmed',
  OTHER: 'other',
} as const;

export type MatchOverrideReasonCategory =
  (typeof MATCH_OVERRIDE_REASON_CATEGORY)[keyof typeof MATCH_OVERRIDE_REASON_CATEGORY];

export const MATCH_ENVIRONMENT = {
  INDOOR: 'indoor',
  OUTDOOR: 'outdoor',
  MIXED: 'mixed',
} as const;

export type MatchEnvironment = (typeof MATCH_ENVIRONMENT)[keyof typeof MATCH_ENVIRONMENT];

export const MATCH_YES_NO_UNSURE = {
  YES: 'yes',
  NO: 'no',
  NOT_SURE: 'not_sure',
} as const;

export type MatchYesNoUnsure = (typeof MATCH_YES_NO_UNSURE)[keyof typeof MATCH_YES_NO_UNSURE];

export type MatchSubScores = Readonly<Record<MatchScoreInputKey, number>>;

export type MatchResultStrip = Readonly<{
  id: string;
  listingId: string;
  rank: number;
  robotMatchScore: number;
  readyToUseStatus: ReadyToUseStatus;
  readyToUseLabel: string;
  makeItGreenPath: MakeItGreenPath;
  matchType: MatchType;
  requiredActions: readonly MatchRequiredAction[];
  availablePurchaseBundles: readonly ListingPurchaseBundle[];
  recommendedPurchaseBundle: ListingPurchaseBundle;
  makeItGreenSteps: readonly MakeItGreenStep[];
  consultantRecommendedFlag: boolean;
  solutionMatchScore: number | null;
  subScores: MatchSubScores;
  ruleHits: readonly string[];
  thresholdBand: ReadyToUseStatus;
  effectiveStatus: ReadyToUseStatus;
  overridden: boolean;
  dealRoomId: string | null;
  listing: Readonly<{
    id: string;
    title: string | null;
    publicSlug: string | null;
    price: number | null;
    currencyKey: string | null;
    countryKey: string | null;
    manufacturerKey: string | null;
    modelKey: string | null;
  }>;
}>;

export function sumMatchWeights(weights: Readonly<Record<MatchScoreInputKey, number>>): number {
  return MATCH_SCORE_INPUT_KEYS.reduce((total, key) => total + weights[key], 0);
}

/** Accept near-100 totals from decimal admin inputs (e.g. 33.33 × 3). */
export function isValidMatchWeightTotal(weights: Readonly<Record<MatchScoreInputKey, number>>): boolean {
  return Math.abs(sumMatchWeights(weights) - 100) < 0.05;
}

export function resolveColourFromScore(
  score: number,
  thresholds: Readonly<{ greenMin: number; yellowMin: number; orangeMin: number }>,
): ReadyToUseStatus {
  if (score >= thresholds.greenMin) {
    return READY_TO_USE_STATUS.GREEN;
  }
  if (score >= thresholds.yellowMin) {
    return READY_TO_USE_STATUS.YELLOW;
  }
  if (score >= thresholds.orangeMin) {
    return READY_TO_USE_STATUS.ORANGE;
  }
  return READY_TO_USE_STATUS.RED;
}

const STATUS_RANK: Readonly<Record<ReadyToUseStatus, number>> = {
  green: 0,
  yellow: 1,
  orange: 2,
  red: 3,
};

/** Readiness rules may only raise the minimum colour band (never lower). */
export function raiseReadyToUseStatus(current: ReadyToUseStatus, minimum: ReadyToUseStatus): ReadyToUseStatus {
  return STATUS_RANK[minimum] > STATUS_RANK[current] ? minimum : current;
}
