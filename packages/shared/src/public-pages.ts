export const PUBLIC_PAGE_KEY_TERMS = 'terms' as const;

export const PUBLIC_PAGE_KEY_PRIVACY_POLICY = 'privacy-policy' as const;

export const PUBLIC_PAGE_SEED_KEYS = [PUBLIC_PAGE_KEY_TERMS, PUBLIC_PAGE_KEY_PRIVACY_POLICY] as const;

/** @deprecated Use PUBLIC_PAGE_SEED_KEYS — keys are admin-created beyond seeds. */
export const PUBLIC_PAGE_KEYS = PUBLIC_PAGE_SEED_KEYS;

export type PublicPageKey = string;

export const PUBLIC_PAGE_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PUBLIC_PAGE_KEY_MIN_LENGTH = 2;

export const PUBLIC_PAGE_KEY_MAX_LENGTH = 64;

/** Top-level app route segments that cannot be used as public page keys. */
export const PUBLIC_PAGE_ROUTE_RESERVED_KEYS = [
  'admin',
  'api',
  'buyer',
  'compare',
  'forgot-password',
  'join',
  'partner',
  'reset-password',
  'robots',
  'seller',
  'sign-in',
  'sign-up',
  'usecase',
  'verify-email',
] as const;

export function isPublicPageRouteKeyReserved(key: string): boolean {
  return (PUBLIC_PAGE_ROUTE_RESERVED_KEYS as readonly string[]).includes(key);
}

/** Legal page body HTML from Tiptap — mirrors backend `@MaxLength`. */
export const PUBLIC_PAGE_BODY_MAX_LENGTH = 50_000;

export const PUBLIC_PAGE_META_MAX_LENGTH = 200;

export const PUBLIC_PAGE_TITLE_MAX_LENGTH = 200;

export type PublicPageLocalizedString = Readonly<Partial<Record<'en' | 'ar', string>>>;

export type PublicPagePublicResponse = Readonly<{
  key: PublicPageKey;
  title: string;
  metaTitle: string;
  metaDescription: string;
  bodyHtml: string;
  updatedAt: string;
}>;

export type PublicPageAdminListItem = Readonly<{
  key: PublicPageKey;
  title: string;
  isPublished: boolean;
  updatedAt: string;
}>;

export type PublicPageAdminListResponse = Readonly<{
  pages: readonly PublicPageAdminListItem[];
}>;

export type PublicPageAdminSummary = Readonly<{
  key: PublicPageKey;
  title: string;
  metaTitle: string;
  metaDescription: string;
  bodyHtml: string;
  titleLocalized: PublicPageLocalizedString;
  metaTitleLocalized: PublicPageLocalizedString;
  metaDescriptionLocalized: PublicPageLocalizedString;
  bodyHtmlLocalized: PublicPageLocalizedString;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type UpdatePublicPagePayload = Readonly<{
  title?: PublicPageLocalizedString;
  metaTitle?: PublicPageLocalizedString;
  metaDescription?: PublicPageLocalizedString;
  bodyHtml?: PublicPageLocalizedString;
  isPublished?: boolean;
}>;

export type CreatePublicPagePayload = Readonly<{
  key: string;
  title: PublicPageLocalizedString;
  metaTitle: PublicPageLocalizedString;
  metaDescription: PublicPageLocalizedString;
  bodyHtml: PublicPageLocalizedString;
  isPublished?: boolean;
}>;
