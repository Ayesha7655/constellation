/** Max units per manual IN/OUT and max on-hand quantity after IN. */
export const LISTING_INVENTORY_MAX_UNITS = 999;

export const LISTING_INVENTORY_TRANSACTION_TYPE = {
  IN: 'IN',
  OUT: 'OUT',
  SOLD: 'SOLD',
} as const;

export type ListingInventoryTransactionType =
  (typeof LISTING_INVENTORY_TRANSACTION_TYPE)[keyof typeof LISTING_INVENTORY_TRANSACTION_TYPE];

export const LISTING_INVENTORY_TRANSACTION_TYPE_VALUES = Object.values(LISTING_INVENTORY_TRANSACTION_TYPE);

export const LISTING_INVENTORY_REMARKS_MAX_LENGTH = 500;

/** Polymorphic reference for SOLD rows (e.g. deal room closure). */
export const LISTING_INVENTORY_REFERENCE_TYPE = {
  DEAL_ROOM: 'deal_room',
} as const;

export type ListingInventoryReferenceType =
  (typeof LISTING_INVENTORY_REFERENCE_TYPE)[keyof typeof LISTING_INVENTORY_REFERENCE_TYPE];
