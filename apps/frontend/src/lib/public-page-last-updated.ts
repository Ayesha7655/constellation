import type { AppLocale } from '@/i18n/config';

export function formatPublicPageLastUpdatedDate(updatedAt: string, locale: AppLocale): string {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
