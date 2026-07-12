export type CatalogBulkPreviewCounts = Readonly<{
  additions: number;
  updates: number;
  invalid: number;
  restores: number;
  unchanged: number;
}>;

export type CatalogBulkPreviewRow = Readonly<{
  line: number;
  key: string;
  nameEn: string;
  nameAr?: string | null;
  description?: string | null;
  isActive: boolean;
}>;

export type CatalogBulkPreviewUpdateRow = CatalogBulkPreviewRow &
  Readonly<{
    changes: Readonly<Record<string, Readonly<{ from: unknown; to: unknown }>>>;
  }>;

export type CatalogBulkPreviewInvalidRow = Readonly<{
  line: number;
  key?: string | null;
  errors: readonly string[];
}>;

export type CatalogBulkPreviewResult = Readonly<{
  counts: CatalogBulkPreviewCounts;
  additions: readonly CatalogBulkPreviewRow[];
  updates: readonly CatalogBulkPreviewUpdateRow[];
  invalid: readonly CatalogBulkPreviewInvalidRow[];
  restores: readonly CatalogBulkPreviewRow[];
  unchanged: readonly CatalogBulkPreviewRow[];
}>;

export type CatalogBulkImportPreviewResponse = Readonly<{
  previewId: string;
  preview: CatalogBulkPreviewResult;
}>;

export type CatalogBulkImportSummary = Readonly<{
  created: number;
  updated: number;
  restored: number;
  failed: number;
  unchanged: number;
}>;

export type LogisticsProviderBulkResource = 'logistics-providers';
