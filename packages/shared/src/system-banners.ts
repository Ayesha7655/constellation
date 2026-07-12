import { ROBOT_LISTING_DESCRIPTION_MAX_LENGTH } from './robot-listings';

export const SYSTEM_BANNER_TYPE = {
  STRIP: 'STRIP',
  MODAL: 'MODAL',
} as const;

export const SYSTEM_BANNER_VARIANT = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const;

export const SYSTEM_BANNER_DISMISS_STORAGE_KEY = 'constellation:dismissed-banner-ids';

export const SYSTEM_BANNER_STRIP_MESSAGE_MAX_LENGTH = 200;

export const SYSTEM_BANNER_MODAL_BODY_MAX_LENGTH = ROBOT_LISTING_DESCRIPTION_MAX_LENGTH;

export type SystemBannerType = (typeof SYSTEM_BANNER_TYPE)[keyof typeof SYSTEM_BANNER_TYPE];

export type SystemBannerVariant = (typeof SYSTEM_BANNER_VARIANT)[keyof typeof SYSTEM_BANNER_VARIANT];

export type SystemBannerLocalizedString = Readonly<Partial<Record<'en' | 'ar', string>>>;

export type SystemBannerStripDto = Readonly<{
  id: string;
  message: string;
  variant: SystemBannerVariant;
  linkUrl?: string | null;
  linkLabel?: string | null;
}>;

export type SystemBannerModalDto = Readonly<{
  id: string;
  title: string;
  bodyHtml: string;
}>;

export type ActiveSystemBannersResponse = Readonly<{
  strip: SystemBannerStripDto | null;
  modal: SystemBannerModalDto | null;
}>;

export type SystemBannerAdminSummary = Readonly<{
  id: string;
  type: SystemBannerType;
  title: string | null;
  message: string | null;
  bodyHtml: string | null;
  titleLocalized: SystemBannerLocalizedString | null;
  messageLocalized: SystemBannerLocalizedString | null;
  bodyHtmlLocalized: SystemBannerLocalizedString | null;
  variant: SystemBannerVariant;
  linkUrl: string | null;
  linkLabel: string | null;
  startsAt: string;
  endsAt: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type SystemBannerAdminListResponse = Readonly<{
  banners: readonly SystemBannerAdminSummary[];
  meta: import('./pagination').PaginationMeta;
}>;

export function systemBannerVariantToFormBannerVariant(variant: SystemBannerVariant): 'error' | 'info' | 'warning' {
  switch (variant) {
    case SYSTEM_BANNER_VARIANT.ERROR:
      return 'error';
    case SYSTEM_BANNER_VARIANT.WARNING:
      return 'warning';
    default:
      return 'info';
  }
}

export function systemBannerVariantToStatusBadgeVariant(
  variant: SystemBannerVariant,
): 'sky' | 'amber' | 'rejected' {
  switch (variant) {
    case SYSTEM_BANNER_VARIANT.ERROR:
      return 'rejected';
    case SYSTEM_BANNER_VARIANT.WARNING:
      return 'amber';
    default:
      return 'sky';
  }
}
