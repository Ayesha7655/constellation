/** Admin API paths for catalog bulk import/export (`/admin/...`). */
export const CATALOG_BULK_PATHS = {
  USE_CASES: '/admin/use-cases',
  SENSORS: '/admin/sensors',
  COUNTRIES: '/admin/countries',
  MANUFACTURERS: '/admin/manufacturers',
  MODELS: '/admin/models',
  MODEL_SPEC_FIELDS: '/admin/model-spec-fields',
} as const;

export type CatalogBulkPath = (typeof CATALOG_BULK_PATHS)[keyof typeof CATALOG_BULK_PATHS];

export function buildCityCatalogBulkPath(countryKey: string): string {
  return `/admin/countries/${encodeURIComponent(countryKey)}/cities`;
}

export function buildUseCaseChildrenCatalogBulkPath(parentUseCaseKey: string): string {
  return `/admin/use-cases/${encodeURIComponent(parentUseCaseKey)}/children`;
}

export function buildUseCaseChildrenCatalogBulkImportHref(parentUseCaseKey: string): string {
  return `/admin/use-cases/${encodeURIComponent(parentUseCaseKey)}/import`;
}
