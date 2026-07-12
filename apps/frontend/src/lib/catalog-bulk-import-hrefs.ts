import { CATALOG_BULK_PATHS } from '@/lib/catalog-bulk-paths';
import { SORTABLE_CATALOG_BULK_PATHS } from '@/lib/sortable-catalog-bulk-paths';

/** App route for bulk CSV import (sibling of each catalog list page). */
export function buildCatalogBulkImportHref(listPath: string): string {
  return `${listPath}/import`;
}

export function buildCityCatalogBulkImportHref(countryKey: string): string {
  return `/admin/countries/${encodeURIComponent(countryKey)}/cities/import`;
}

export const CATALOG_BULK_IMPORT_HREFS = {
  LOGISTICS_PROVIDERS: buildCatalogBulkImportHref(SORTABLE_CATALOG_BULK_PATHS.LOGISTICS_PROVIDERS),
  LISTING_TYPES: buildCatalogBulkImportHref(SORTABLE_CATALOG_BULK_PATHS.LISTING_TYPES),
  USED_CONDITIONS: buildCatalogBulkImportHref(SORTABLE_CATALOG_BULK_PATHS.USED_CONDITIONS),
  SHIPPING_METHODS: buildCatalogBulkImportHref(SORTABLE_CATALOG_BULK_PATHS.SHIPPING_METHODS),
  TRACKING_OPTIONS: buildCatalogBulkImportHref(SORTABLE_CATALOG_BULK_PATHS.TRACKING_OPTIONS),
  CARGO_INSURANCE_OPTIONS: buildCatalogBulkImportHref(SORTABLE_CATALOG_BULK_PATHS.CARGO_INSURANCE_OPTIONS),
  CUSTOMS_DOCUMENT_OPTIONS: buildCatalogBulkImportHref(SORTABLE_CATALOG_BULK_PATHS.CUSTOMS_DOCUMENT_OPTIONS),
  SECURE_PAYMENT_STATES: buildCatalogBulkImportHref(SORTABLE_CATALOG_BULK_PATHS.SECURE_PAYMENT_STATES),
  CURRENCIES: buildCatalogBulkImportHref(SORTABLE_CATALOG_BULK_PATHS.CURRENCIES),
  USE_CASES: buildCatalogBulkImportHref(CATALOG_BULK_PATHS.USE_CASES),
  SENSORS: buildCatalogBulkImportHref(CATALOG_BULK_PATHS.SENSORS),
  COUNTRIES: buildCatalogBulkImportHref(CATALOG_BULK_PATHS.COUNTRIES),
  MANUFACTURERS: buildCatalogBulkImportHref(CATALOG_BULK_PATHS.MANUFACTURERS),
  MODELS: buildCatalogBulkImportHref(CATALOG_BULK_PATHS.MODELS),
  MODEL_SPEC_FIELDS: buildCatalogBulkImportHref(CATALOG_BULK_PATHS.MODEL_SPEC_FIELDS),
} as const;
