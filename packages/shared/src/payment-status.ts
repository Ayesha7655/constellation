import { PAYMENT_DISPUTE_STATUS, PAYMENT_TRANSACTION_STATUS, type PaymentDisputeStatus, type PaymentTransactionStatus } from './payments';

/**
 * Buyer-facing payment lifecycle steps shown in deal-room progress tracker (SECURE_PAYMENT rooms).
 * Terminal/exception statuses (DISPUTED, REFUNDED, CANCELLED, FAILED) map onto these steps via
 * {@link PAYMENT_TRACKER_STATUS_ORDER} — they do not add extra tracker steps.
 */
export const PAYMENT_TRACKER_STATUS_SEQUENCE = [
  PAYMENT_TRANSACTION_STATUS.PENDING_PAYMENT,
  PAYMENT_TRANSACTION_STATUS.FUNDED,
  PAYMENT_TRANSACTION_STATUS.IN_INSPECTION,
  PAYMENT_TRANSACTION_STATUS.RELEASED,
] as const;

export type PaymentTrackerStatusKey = (typeof PAYMENT_TRACKER_STATUS_SEQUENCE)[number];

/** Stepper index for tracker rendering; DRAFT/CANCELLED/FAILED hide the tracker (`-1`). */
export const PAYMENT_TRACKER_STATUS_ORDER: Record<PaymentTransactionStatus, number> = {
  [PAYMENT_TRANSACTION_STATUS.DRAFT]: -1,
  [PAYMENT_TRANSACTION_STATUS.PENDING_PAYMENT]: 0,
  [PAYMENT_TRANSACTION_STATUS.FUNDED]: 1,
  [PAYMENT_TRANSACTION_STATUS.IN_INSPECTION]: 2,
  [PAYMENT_TRANSACTION_STATUS.RELEASED]: 3,
  [PAYMENT_TRANSACTION_STATUS.DISPUTED]: 1,
  [PAYMENT_TRANSACTION_STATUS.REFUNDED]: 3,
  [PAYMENT_TRANSACTION_STATUS.CANCELLED]: -1,
  [PAYMENT_TRANSACTION_STATUS.FAILED]: -1,
};

/** i18n keys under `paymentStatus.*` (frontend resolves via `useTranslations('paymentStatus')`). */
export const PAYMENT_STATUS_LABEL_KEYS: Record<PaymentTransactionStatus, string> = {
  [PAYMENT_TRANSACTION_STATUS.DRAFT]: 'paymentStatus.draft',
  [PAYMENT_TRANSACTION_STATUS.PENDING_PAYMENT]: 'paymentStatus.pendingPayment',
  [PAYMENT_TRANSACTION_STATUS.FUNDED]: 'paymentStatus.funded',
  [PAYMENT_TRANSACTION_STATUS.IN_INSPECTION]: 'paymentStatus.inInspection',
  [PAYMENT_TRANSACTION_STATUS.RELEASED]: 'paymentStatus.released',
  [PAYMENT_TRANSACTION_STATUS.DISPUTED]: 'paymentStatus.disputed',
  [PAYMENT_TRANSACTION_STATUS.REFUNDED]: 'paymentStatus.refunded',
  [PAYMENT_TRANSACTION_STATUS.CANCELLED]: 'paymentStatus.cancelled',
  [PAYMENT_TRANSACTION_STATUS.FAILED]: 'paymentStatus.failed',
};

export const PAYMENT_DISPUTE_STATUS_LABEL_KEYS: Record<PaymentDisputeStatus, string> = {
  [PAYMENT_DISPUTE_STATUS.NONE]: 'paymentDisputeStatus.NONE',
  [PAYMENT_DISPUTE_STATUS.OPEN]: 'paymentDisputeStatus.OPEN',
  [PAYMENT_DISPUTE_STATUS.UNDER_REVIEW]: 'paymentDisputeStatus.UNDER_REVIEW',
  [PAYMENT_DISPUTE_STATUS.WON]: 'paymentDisputeStatus.WON',
  [PAYMENT_DISPUTE_STATUS.LOST]: 'paymentDisputeStatus.LOST',
  [PAYMENT_DISPUTE_STATUS.CLOSED]: 'paymentDisputeStatus.CLOSED',
};

const PAYMENT_TRANSACTION_STATUS_SET: ReadonlySet<string> = new Set(Object.values(PAYMENT_TRANSACTION_STATUS));

export function isPaymentTransactionStatus(value: string): value is PaymentTransactionStatus {
  return PAYMENT_TRANSACTION_STATUS_SET.has(value);
}

const PAYMENT_DISPUTE_STATUS_SET: ReadonlySet<string> = new Set(Object.values(PAYMENT_DISPUTE_STATUS));

export function isPaymentDisputeStatus(value: string): value is PaymentDisputeStatus {
  return PAYMENT_DISPUTE_STATUS_SET.has(value);
}

export function getPaymentTrackerIndex(status: PaymentTransactionStatus): number {
  return PAYMENT_TRACKER_STATUS_ORDER[status];
}
