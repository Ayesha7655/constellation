/** Stable codes for per-row bulk import validation (preview invalid tab). */
export const CATALOG_BULK_ROW_ERROR_CODES = {
  KEY_REQUIRED: 'key_required',
  INVALID_KEY_FORMAT: 'invalid_key_format',
  NAME_EN_REQUIRED: 'name_en_required',
  NAME_EN_TOO_LONG: 'name_en_too_long',
  NAME_AR_TOO_LONG: 'name_ar_too_long',
  DESCRIPTION_TOO_LONG: 'description_too_long',
  INVALID_IS_ACTIVE: 'invalid_is_active',
  DUPLICATE_KEY_IN_FILE: 'duplicate_key_in_file',
  INVALID_SPECS_JSON: 'invalid_specs_json',
  UNKNOWN_SPEC_FIELD: 'unknown_spec_field',
  INVALID_SPEC_VALUE: 'invalid_spec_value',
  FILE_SPEC_NOT_SUPPORTED_IN_BULK: 'file_spec_not_supported_in_bulk',
  MANUFACTURER_NOT_FOUND: 'manufacturer_not_found',
  MANUFACTURER_INACTIVE: 'manufacturer_inactive',
  INVALID_SENSOR_KEY: 'invalid_sensor_key',
  DUPLICATE_SENSOR_KEY: 'duplicate_sensor_key',
  PARENT_USE_CASE_NOT_FOUND: 'parent_use_case_not_found',
  PARENT_USE_CASE_INVALID: 'parent_use_case_invalid',
  PARENT_USE_CASE_CYCLIC: 'parent_use_case_cyclic',
  PARENT_USE_CASE_MAX_DEPTH_EXCEEDED: 'parent_use_case_max_depth_exceeded',
} as const;

export type CatalogBulkRowErrorCode = (typeof CATALOG_BULK_ROW_ERROR_CODES)[keyof typeof CATALOG_BULK_ROW_ERROR_CODES];

const ROW_ERROR_CODE_SET = new Set<string>(Object.values(CATALOG_BULK_ROW_ERROR_CODES));

export function isCatalogBulkRowErrorCode(value: string): value is CatalogBulkRowErrorCode {
  return ROW_ERROR_CODE_SET.has(value);
}

/** Legacy English messages from earlier PG function versions (preview store / stale DB). */
export const LEGACY_CATALOG_BULK_ROW_ERROR_MESSAGE_TO_CODE: Readonly<Record<string, CatalogBulkRowErrorCode>> = {
  'Key required': CATALOG_BULK_ROW_ERROR_CODES.KEY_REQUIRED,
  'Invalid key format': CATALOG_BULK_ROW_ERROR_CODES.INVALID_KEY_FORMAT,
  'English name required': CATALOG_BULK_ROW_ERROR_CODES.NAME_EN_REQUIRED,
  'English name too long': CATALOG_BULK_ROW_ERROR_CODES.NAME_EN_TOO_LONG,
  'Arabic name too long': CATALOG_BULK_ROW_ERROR_CODES.NAME_AR_TOO_LONG,
  'Description too long': CATALOG_BULK_ROW_ERROR_CODES.DESCRIPTION_TOO_LONG,
  'Invalid is_active value': CATALOG_BULK_ROW_ERROR_CODES.INVALID_IS_ACTIVE,
  'Duplicate key in file': CATALOG_BULK_ROW_ERROR_CODES.DUPLICATE_KEY_IN_FILE,
};

export function resolveCatalogBulkRowErrorCode(value: string): CatalogBulkRowErrorCode | null {
  const baseCode = value.includes(':') ? (value.split(':')[0] ?? value) : value;
  if (isCatalogBulkRowErrorCode(baseCode)) {
    return baseCode;
  }
  return LEGACY_CATALOG_BULK_ROW_ERROR_MESSAGE_TO_CODE[value] ?? null;
}

export function resolveCatalogBulkRowErrorFieldKey(value: string): string | null {
  const separatorIndex = value.indexOf(':');
  if (separatorIndex < 0) {
    return null;
  }
  const fieldKey = value.slice(separatorIndex + 1).trim();
  return fieldKey.length > 0 ? fieldKey : null;
}
