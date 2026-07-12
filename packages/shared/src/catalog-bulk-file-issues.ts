export const CATALOG_BULK_FILE_ISSUE_TYPES = {
  MISSING_COLUMN: 'missing_column',
  EXTRA_COLUMN: 'extra_column',
  INVALID_FORMAT: 'invalid_format',
  COUNTRY_KEY_MISMATCH: 'country_key_mismatch',
} as const;

export type CatalogBulkFileIssueType =
  (typeof CATALOG_BULK_FILE_ISSUE_TYPES)[keyof typeof CATALOG_BULK_FILE_ISSUE_TYPES];

export type CatalogBulkFileIssue = Readonly<
  | { type: typeof CATALOG_BULK_FILE_ISSUE_TYPES.MISSING_COLUMN; column: string }
  | { type: typeof CATALOG_BULK_FILE_ISSUE_TYPES.EXTRA_COLUMN; column: string }
  | { type: typeof CATALOG_BULK_FILE_ISSUE_TYPES.INVALID_FORMAT }
  | {
      type: typeof CATALOG_BULK_FILE_ISSUE_TYPES.COUNTRY_KEY_MISMATCH;
      line: number;
      expectedCountryKey: string;
      actualCountryKey: string;
    }
>;

const FILE_ISSUE_TYPE_SET = new Set<string>(Object.values(CATALOG_BULK_FILE_ISSUE_TYPES));

function isFileIssueType(value: unknown): value is CatalogBulkFileIssueType {
  return typeof value === 'string' && FILE_ISSUE_TYPE_SET.has(value);
}

function isCatalogBulkFileIssue(value: unknown): value is CatalogBulkFileIssue {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (!isFileIssueType(record.type)) {
    return false;
  }
  if (record.type === CATALOG_BULK_FILE_ISSUE_TYPES.INVALID_FORMAT) {
    return true;
  }
  if (record.type === CATALOG_BULK_FILE_ISSUE_TYPES.COUNTRY_KEY_MISMATCH) {
    return (
      typeof record.line === 'number' &&
      record.line > 0 &&
      typeof record.expectedCountryKey === 'string' &&
      record.expectedCountryKey.length > 0 &&
      typeof record.actualCountryKey === 'string'
    );
  }
  return typeof record.column === 'string' && record.column.length > 0;
}

/** Read structured CSV file issues from a coded error `details` payload. */
export function parseCatalogBulkFileIssues(details: unknown): readonly CatalogBulkFileIssue[] {
  if (typeof details !== 'object' || details === null) {
    return [];
  }
  const fileIssues = (details as Record<string, unknown>).fileIssues;
  if (!Array.isArray(fileIssues)) {
    return [];
  }
  return fileIssues.filter(isCatalogBulkFileIssue);
}

export function buildCatalogBulkInvalidCsvDetails(issues: readonly CatalogBulkFileIssue[]): Readonly<{
  fileIssues: readonly CatalogBulkFileIssue[];
}> {
  return { fileIssues: issues };
}
