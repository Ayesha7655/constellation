import type { AppLocale } from './types';
import { isLocalizedString } from './types';

export function readLocalizedValue(value: unknown, locale: AppLocale): string {
  if (typeof value === 'string') {
    return value;
  }
  if (!isLocalizedString(value) && (!value || typeof value !== 'object')) {
    return '';
  }
  const record = value as Record<string, unknown>;
  const localized = record[locale];
  if (typeof localized === 'string' && localized.length > 0) {
    return localized;
  }
  if (typeof record.en === 'string' && record.en.length > 0) {
    return record.en;
  }
  for (const entry of Object.values(record)) {
    if (typeof entry === 'string' && entry.length > 0) {
      return entry;
    }
  }
  return '';
}

export function mergeLocalizedValue(existing: unknown, locale: AppLocale, value: string): Record<string, string> {
  const base: Record<string, string> = {};
  if (isLocalizedString(existing)) {
    if (typeof existing.en === 'string') {
      base.en = existing.en;
    }
    if (typeof existing.ar === 'string') {
      base.ar = existing.ar;
    }
  } else if (existing && typeof existing === 'object') {
    for (const [key, entry] of Object.entries(existing as Record<string, unknown>)) {
      if (typeof entry === 'string' && entry.length > 0) {
        base[key] = entry;
      }
    }
  }
  return { ...base, [locale]: value };
}
