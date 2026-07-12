import type { BrowseMarketingFingerprintInput } from '../marketing-search-page';

const FINGERPRINT_EXCLUDED_KEYS = new Set(['page', 'limit', 'sort', 'locale']);

const FINGERPRINT_MULTI_VALUE_KEYS = new Set([
  'countryKeys',
  'useCaseKeys',
  'usedConditionKeys',
  'conditions',
  'pathUseCaseKeys',
]);

function sortTokens(values: readonly string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function normalizeMultiValue(key: string, values: readonly string[]): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const value of values) {
    for (const part of value.split(',')) {
      const trimmed = part.trim();
      if (!trimmed) {
        continue;
      }
      const dedupeKey = trimmed.toLowerCase();
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      tokens.push(trimmed);
    }
  }
  if (tokens.length === 0) {
    return [];
  }
  if (FINGERPRINT_MULTI_VALUE_KEYS.has(key)) {
    return [sortTokens(tokens).join(',')];
  }
  return sortTokens(tokens);
}

function appendParam(parts: string[], key: string, value: string): void {
  parts.push(`${key}=${value}`);
}

export function buildPathMarketingFingerprint(canonicalPath: string): string {
  const normalized = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  return `path:${normalized}`;
}

export function buildBrowseMarketingFingerprint(input: BrowseMarketingFingerprintInput): string {
  if (input.staticPath?.trim()) {
    return buildPathMarketingFingerprint(input.staticPath.trim());
  }

  const keyToValues = new Map<string, string[]>();

  const addValues = (key: string, values: readonly string[] | undefined): void => {
    if (!values || values.length === 0) {
      return;
    }
    const existing = keyToValues.get(key) ?? [];
    existing.push(...values);
    keyToValues.set(key, existing);
  };

  const addSingle = (key: string, value: string | number | undefined): void => {
    if (value === undefined || value === '') {
      return;
    }
    addValues(key, [String(value)]);
  };

  addValues('pathUseCaseKeys', input.pathUseCaseKeys);
  addSingle('pathManufacturerKey', input.pathManufacturerKey?.trim());

  addSingle('q', input.q?.trim());
  addValues('countryKeys', input.countryKeys);
  addValues('usedConditionKeys', input.usedConditionKeys);
  addValues('conditions', input.conditions);
  addSingle('priceMin', input.priceMin);
  addSingle('priceMax', input.priceMax);
  addSingle('modelKey', input.modelKey?.trim());

  const pathManufacturer = input.pathManufacturerKey?.trim();
  const queryManufacturer = input.manufacturerKey?.trim();
  if (!pathManufacturer && queryManufacturer) {
    addSingle('manufacturerKey', queryManufacturer);
  }

  const pathUseCaseKeys = input.pathUseCaseKeys ?? [];
  const queryUseCaseKeys = input.useCaseKeys ?? [];
  if (pathUseCaseKeys.length === 0 && queryUseCaseKeys.length > 0) {
    addValues('useCaseKeys', queryUseCaseKeys);
  }

  const keys = Array.from(keyToValues.keys())
    .filter((key) => !FINGERPRINT_EXCLUDED_KEYS.has(key))
    .sort((a, b) => a.localeCompare(b));

  const parts: string[] = [];
  for (const key of keys) {
    const values = normalizeMultiValue(key, keyToValues.get(key) ?? []);
    for (const value of values) {
      appendParam(parts, key, value);
    }
  }

  return parts.join('&');
}

export function canonicalListingsQueryFingerprintFromSearchParams(searchParams: URLSearchParams): string {
  const keyToValues = new Map<string, string[]>();
  searchParams.forEach((value, key) => {
    if (FINGERPRINT_EXCLUDED_KEYS.has(key)) {
      return;
    }
    const arr = keyToValues.get(key) ?? [];
    arr.push(value);
    keyToValues.set(key, arr);
  });

  const keys = Array.from(keyToValues.keys()).sort((a, b) => a.localeCompare(b));
  const parts: string[] = [];
  for (const key of keys) {
    const values = normalizeMultiValue(key, keyToValues.get(key) ?? []);
    for (const value of values) {
      appendParam(parts, key, value);
    }
  }
  return parts.join('&');
}
