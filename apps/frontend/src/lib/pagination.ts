import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@constellation/shared';

/** Default list page size from `NEXT_PUBLIC_DEFAULT_PAGE_SIZE` (sent as API `limit`). */
export function getDefaultPageSize(): number {
  const raw = process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE?.trim();
  if (!raw) {
    return DEFAULT_PAGE_SIZE;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(parsed, MAX_PAGE_SIZE);
}
