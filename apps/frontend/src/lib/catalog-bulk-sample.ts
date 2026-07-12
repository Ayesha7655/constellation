import type { CatalogBulkFormatHintKey } from '@/lib/catalog-bulk-format-hint';

const CATALOG_BULK_SAMPLE_HEADERS: Record<CatalogBulkFormatHintKey, readonly string[]> = {
  formatHint: ['key', 'name_en', 'name_ar', 'description', 'is_active'],
  formatHintUseCase: ['key', 'name_en', 'name_ar', 'description', 'parent_use_case_key', 'is_active'],
  formatHintUseCaseScoped: ['key', 'name_en', 'name_ar', 'description', 'is_active'],
  formatHintCountry: ['key', 'name_en', 'name_ar', 'description'],
  formatHintManufacturer: ['key', 'name_en', 'name_ar', 'description', 'is_active'],
  formatHintCity: ['key', 'name_en', 'name_ar', 'description'],
  formatHintModel: [
    'key',
    'name_en',
    'name_ar',
    'description',
    'manufacturer_key',
    'is_active',
    'sensor_keys',
    'specs_json',
  ],
  formatHintModelSpecField: [
    'key',
    'label_en',
    'label_ar',
    'unit_en',
    'unit_ar',
    'placeholder_en',
    'placeholder_ar',
    'hint_en',
    'hint_ar',
    'value_type',
    'is_active',
    'is_editable_on_listing',
    'is_required_on_listing',
  ],
};

export function buildCatalogBulkSampleCsv(formatHintKey: CatalogBulkFormatHintKey): string {
  return `${CATALOG_BULK_SAMPLE_HEADERS[formatHintKey].join(',')}\n`;
}

export function buildCatalogBulkSampleFilename(catalogApiPath: string): string {
  const slug = catalogApiPath.replace(/^\/admin\//, '').replaceAll('/', '-');
  return `${slug}-import-sample.csv`;
}

export function downloadCatalogBulkSampleCsv(
  catalogApiPath: string,
  formatHintKey: CatalogBulkFormatHintKey,
): Readonly<{ filename: string }> {
  const csv = buildCatalogBulkSampleCsv(formatHintKey);
  const filename = buildCatalogBulkSampleFilename(catalogApiPath);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  return { filename };
}
