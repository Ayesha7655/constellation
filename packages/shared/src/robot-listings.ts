export const ROBOT_LISTING_USED_TYPE_KEY = 'used';

export const ROBOT_LISTING_CERTIFIED_STOCK_TYPE_KEY = 'certified-stock';

export const LISTINGS_UPLOAD_MODULE = 'listings';

export const MODEL_SPECS_UPLOAD_MODULE = 'model-specs';

export const DEFAULT_LISTING_CURRENCY_KEY = 'usd';

export const ROBOT_LISTING_APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  UNPUBLISHED: 'UNPUBLISHED',
} as const;

export type RobotListingApprovalStatus =
  (typeof ROBOT_LISTING_APPROVAL_STATUS)[keyof typeof ROBOT_LISTING_APPROVAL_STATUS];

export const PUBLIC_ROBOT_LISTING_SORT = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
} as const;

export type PublicRobotListingSort = (typeof PUBLIC_ROBOT_LISTING_SORT)[keyof typeof PUBLIC_ROBOT_LISTING_SORT];

export const PUBLIC_ROBOT_LISTING_SORT_VALUES = Object.values(PUBLIC_ROBOT_LISTING_SORT);

export const DEFAULT_PUBLIC_ROBOT_LISTING_SORT = PUBLIC_ROBOT_LISTING_SORT.NEWEST;

/** Browse filter: new vs used listing type (not used-condition catalog). */
export const PUBLIC_MARKETPLACE_LISTING_CONDITION = {
  NEW: 'new',
  USED: 'used',
} as const;

export type PublicMarketplaceListingCondition =
  (typeof PUBLIC_MARKETPLACE_LISTING_CONDITION)[keyof typeof PUBLIC_MARKETPLACE_LISTING_CONDITION];

export const PUBLIC_MARKETPLACE_LISTING_CONDITION_VALUES = Object.values(PUBLIC_MARKETPLACE_LISTING_CONDITION);

export const ROBOT_LISTING_MAX_PHOTOS = 10;

export const ROBOT_LISTING_TITLE_MAX_LENGTH = 120;

export const ROBOT_LISTING_DESCRIPTION_MAX_LENGTH = 5000;

export type RobotListingLogisticsProviderRef = Readonly<{
  key: string;
  name: string;
}>;

export type RobotListingUseCaseRef = Readonly<{
  key: string;
  name: string;
  parentUseCaseKey: string | null;
  sortOrder: number;
  createdAt: string;
}>;

import type { PublicSellerTrustBadge } from './seller-trust-badge';

/** Seller card on listing detail (Figma-aligned; views/inquiries reserved for future analytics). */
export type RobotListingSellerInfo = Readonly<{
  displayName: string;
  roleKey: string;
  roleLabel: string;
  countryKey: string | null;
  countryName: string | null;
  photoUrl: string | null;
  listedAt: string;
  viewCount: number | null;
  inquiryCount: number | null;
  /** Active admin-assigned seller trust badges (never application state or documents). */
  trustBadges: readonly PublicSellerTrustBadge[];
}>;

/** User-facing listing label: custom title, then model name, then manufacturer name, then fallback copy. */
export function resolveRobotListingDisplayName(params: {
  title: string | null | undefined;
  modelName: string | null | undefined;
  manufacturerName?: string | null | undefined;
  untitledLabel: string;
}): string {
  const title = params.title?.trim();
  if (title) {
    return title;
  }
  const modelName = params.modelName?.trim();
  if (modelName) {
    return modelName;
  }
  const manufacturerName = params.manufacturerName?.trim();
  if (manufacturerName) {
    return manufacturerName;
  }
  return params.untitledLabel;
}

/**
 * Whether a listing may show the `Request Inspection` CTA.
 * Eligible listings are publicly approved used listings.
 */
export function isListingInspectionEligible(input: {
  listingTypeKey: string;
  approvalStatus: string;
}): boolean {
  return (
    input.listingTypeKey === ROBOT_LISTING_USED_TYPE_KEY &&
    input.approvalStatus === ROBOT_LISTING_APPROVAL_STATUS.APPROVED
  );
}
