/** Default cap for algorithmic related-search links (env may override on backend). */
export const DEFAULT_MARKETING_RELATED_LINKS_MAX = 16;

/** Minimum approved listings before FAQ block renders (env may override on backend). */
export const DEFAULT_SEARCH_PAGE_FAQ_MIN_LISTINGS = 10;

/** Admin / API field limits (keep frontend Zod and backend DTOs aligned). */
export const MARKETING_OVERRIDE_INTERNAL_NAME_MAX_LENGTH = 200;
export const MARKETING_BROWSE_FINGERPRINT_MAX_LENGTH = 1024;
export const MARKETING_BROWSE_PATH_MAX_LENGTH = 512;
export const MARKETING_BROWSE_SEARCH_MAX_LENGTH = 2048;
export const MARKETING_RELATED_LINK_HREF_MAX_LENGTH = 512;
export const MARKETING_RELATED_LINK_LABEL_MAX_LENGTH = 200;
export const MARKETING_RELATED_LINK_HEADING_MAX_LENGTH = 200;
export const MARKETING_PAGE_CONTENT_BODY_MAX_LENGTH = 50_000;
export const MARKETING_FAQ_FIELD_MAX_LENGTH = 5000;

export const MARKETING_OVERRIDE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type MarketingOverrideStatus = (typeof MARKETING_OVERRIDE_STATUS)[keyof typeof MARKETING_OVERRIDE_STATUS];

export type LocalizedMarketingString = Readonly<{
  en: string;
  ar?: string;
}>;

export type RelatedLinkItem = Readonly<{
  href: string;
  label: string;
}>;

export type RelatedLinksPayload = Readonly<{
  heading?: string | null;
  links: readonly RelatedLinkItem[];
}>;

export type SearchPageFaqItem = Readonly<{
  question: string;
  answer: string;
}>;

export type SearchPageFaqPayload = Readonly<{
  items: readonly SearchPageFaqItem[];
}>;

export type SearchPageContextResponse = Readonly<{
  relatedLinks: RelatedLinksPayload | null;
  relatedSearchOverrideId?: string | null;
  pageContent: { html: string } | null;
  pageContentOverrideId?: string | null;
  searchPageFaq: SearchPageFaqPayload | null;
  searchPageFaqOverrideId?: string | null;
}>;

export type MarketingFallbackResponse = Readonly<{
  relatedLinks: RelatedLinksPayload | null;
  searchPageFaq: SearchPageFaqPayload | null;
  faqTemplateValues: Readonly<Record<string, string>> | null;
}>;

export type BrowseMarketingFingerprintInput = Readonly<{
  staticPath?: string;
  pathUseCaseKeys?: readonly string[];
  pathManufacturerKey?: string;
  q?: string;
  countryKeys?: readonly string[];
  useCaseKeys?: readonly string[];
  usedConditionKeys?: readonly string[];
  conditions?: readonly string[];
  priceMin?: number;
  priceMax?: number;
  manufacturerKey?: string;
  modelKey?: string;
}>;
