/**
 * Top-level URL segments reserved for app routes — taxonomy catch-all must not handle these.
 * Static routes take precedence in Next.js; this guard covers future route additions and collisions.
 * Public CMS pages (e.g. terms, privacy-policy) are intentionally excluded — they are not app-shell routes.
 */
export const RESERVED_TOP_LEVEL_SEGMENTS = new Set([
  'admin',
  'api',
  'buyer',
  'compare',
  'forgot-password',
  'join',
  'brands',
  'partner',
  'payments',
  'profile',
  'reset-password',
  'robots',
  'seller',
  'sign-in',
  'sign-up',
  'usecase',
  'verify-email',
]);

export function isReservedTopLevelBrowseSegment(segment: string): boolean {
  return RESERVED_TOP_LEVEL_SEGMENTS.has(segment);
}

export function hasReservedTopLevelBrowseSegment(segments: readonly string[]): boolean {
  const first = segments[0];
  return first !== undefined && isReservedTopLevelBrowseSegment(first);
}
