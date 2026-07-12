/** Admin API paths for sortable listing catalog bulk import/export. */
export const SORTABLE_CATALOG_BULK_PATHS = {
  LOGISTICS_PROVIDERS: '/admin/logistics-providers',
  LISTING_TYPES: '/admin/listing-types',
  USED_CONDITIONS: '/admin/used-conditions',
  SHIPPING_METHODS: '/admin/shipping-methods',
  TRACKING_OPTIONS: '/admin/tracking-options',
  CARGO_INSURANCE_OPTIONS: '/admin/cargo-insurance-options',
  CUSTOMS_DOCUMENT_OPTIONS: '/admin/customs-document-options',
  SECURE_PAYMENT_STATES: '/admin/secure-payment-states',
  CURRENCIES: '/admin/currencies',
} as const;

export type SortableCatalogBulkPath = (typeof SORTABLE_CATALOG_BULK_PATHS)[keyof typeof SORTABLE_CATALOG_BULK_PATHS];
