export const PLATFORM_PAYMENT_PROVIDER = {
  DISABLED: 'DISABLED',
  STRIPE_CONNECT: 'STRIPE_CONNECT',
  ESCROW_COM: 'ESCROW_COM',
} as const;

export type PlatformPaymentProvider =
  (typeof PLATFORM_PAYMENT_PROVIDER)[keyof typeof PLATFORM_PAYMENT_PROVIDER];

export const PAYMENT_PROVIDER = {
  STRIPE_CONNECT: 'STRIPE_CONNECT',
  ESCROW_COM: 'ESCROW_COM',
} as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDER)[keyof typeof PAYMENT_PROVIDER];

export const PAYMENT_INTEGRATION_STATUS = {
  OK: 'ok',
  SKIPPED: 'skipped',
  ERROR: 'error',
} as const;

export type PaymentIntegrationStatus =
  (typeof PAYMENT_INTEGRATION_STATUS)[keyof typeof PAYMENT_INTEGRATION_STATUS];

export const USER_PAYMENT_ACCOUNT_ONBOARDING_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  PENDING: 'PENDING',
  READY: 'READY',
  RESTRICTED: 'RESTRICTED',
  DISABLED: 'DISABLED',
} as const;

export type UserPaymentAccountOnboardingStatus =
  (typeof USER_PAYMENT_ACCOUNT_ONBOARDING_STATUS)[keyof typeof USER_PAYMENT_ACCOUNT_ONBOARDING_STATUS];

export const PAYMENT_TRANSACTION_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  FUNDED: 'FUNDED',
  IN_INSPECTION: 'IN_INSPECTION',
  RELEASED: 'RELEASED',
  DISPUTED: 'DISPUTED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;

export type PaymentTransactionStatus =
  (typeof PAYMENT_TRANSACTION_STATUS)[keyof typeof PAYMENT_TRANSACTION_STATUS];

export const PAYMENT_DISPUTE_STATUS = {
  NONE: 'NONE',
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  WON: 'WON',
  LOST: 'LOST',
  CLOSED: 'CLOSED',
} as const;

export type PaymentDisputeStatus = (typeof PAYMENT_DISPUTE_STATUS)[keyof typeof PAYMENT_DISPUTE_STATUS];

export const PAYMENT_TRANSACTION_EVENT_TYPE = {
  CREATED: 'CREATED',
  CHECKOUT_STARTED: 'CHECKOUT_STARTED',
  FUNDED: 'FUNDED',
  DISPUTE_OPENED: 'DISPUTE_OPENED',
  DISPUTE_UPDATED: 'DISPUTE_UPDATED',
  DISPUTE_CLOSED: 'DISPUTE_CLOSED',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
  STATUS_SYNC: 'STATUS_SYNC',
} as const;

export type PaymentTransactionEventType =
  (typeof PAYMENT_TRANSACTION_EVENT_TYPE)[keyof typeof PAYMENT_TRANSACTION_EVENT_TYPE];

export const PLATFORM_PAYMENT_SETTINGS_KEY = 'default' as const;

export const PAYMENTS_USD_CURRENCY_KEY = 'usd' as const;

/** Default Stripe Connect platform fee when admin has not set a value (10%). */
export const DEFAULT_PAYMENTS_STRIPE_PLATFORM_FEE_BPS = 1000 as const;

/** Upper bound for admin-configured Stripe platform fee (50%). */
export const MAX_PAYMENTS_STRIPE_PLATFORM_FEE_BPS = 5000 as const;

/** @deprecated Use {@link DEFAULT_PAYMENTS_STRIPE_PLATFORM_FEE_BPS} or live settings from the API. */
export const PAYMENTS_STRIPE_PLATFORM_FEE_BPS = DEFAULT_PAYMENTS_STRIPE_PLATFORM_FEE_BPS;

export function stripePlatformFeePercentFromBps(platformFeeBps: number): number {
  return platformFeeBps / 100;
}

export function stripePlatformFeeBpsFromPercent(platformFeePercent: number): number {
  return Math.round(platformFeePercent * 100);
}

/** Split a charge amount into platform fee and seller payout (integer cents, no rounding drift). */
export function computeStripePayoutSplit(
  amountCents: bigint,
  platformFeeBps: number = DEFAULT_PAYMENTS_STRIPE_PLATFORM_FEE_BPS,
): Readonly<{
  platformFeeCents: bigint;
  sellerPayoutCents: bigint;
}> {
  const normalizedBps = Math.min(Math.max(0, Math.trunc(platformFeeBps)), MAX_PAYMENTS_STRIPE_PLATFORM_FEE_BPS);
  const platformFeeCents = (amountCents * BigInt(normalizedBps)) / 10000n;
  const sellerPayoutCents = amountCents - platformFeeCents;
  return { platformFeeCents, sellerPayoutCents };
}

/** Roles that may connect a seller payout account (Phase 2). */
export const PAYOUT_ELIGIBLE_ROLE_KEYS = ['private_seller', 'dealer_mfr'] as const;

export type PayoutEligibleRoleKey = (typeof PAYOUT_ELIGIBLE_ROLE_KEYS)[number];

export function isPayoutEligibleRoleKey(roleKey: string): roleKey is PayoutEligibleRoleKey {
  return (PAYOUT_ELIGIBLE_ROLE_KEYS as readonly string[]).includes(roleKey);
}
