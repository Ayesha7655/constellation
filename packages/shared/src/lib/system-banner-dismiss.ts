import { SYSTEM_BANNER_DISMISS_STORAGE_KEY } from '../system-banners';

function readStorage(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SYSTEM_BANNER_DISMISS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  } catch {
    return [];
  }
}

function writeStorage(ids: readonly string[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SYSTEM_BANNER_DISMISS_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export function getDismissedBannerIds(): string[] {
  return readStorage();
}

export function isBannerDismissed(id: string): boolean {
  return readStorage().includes(id);
}

export function dismissBanner(id: string): void {
  const next = [...readStorage(), id];
  writeStorage(next);
}
