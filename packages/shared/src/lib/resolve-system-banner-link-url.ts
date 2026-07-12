import { resolveDashboardProfilePathFromHome } from '../account-types';

type ResolveSystemBannerLinkUrlOptions = Readonly<{
  origin: string;
  dashboardHomePath: string | null;
}>;

/**
 * Rewrites same-origin `/profile` strip links to the signed-in user's dashboard profile path.
 * Admins land on `/admin/settings`; buyer/partner/seller on `/{shell}/profile`.
 */
export function resolveSystemBannerLinkUrl(
  linkUrl: string,
  { origin, dashboardHomePath }: ResolveSystemBannerLinkUrlOptions,
): string {
  try {
    const url = new URL(linkUrl, origin);
    if (url.origin !== origin) {
      return linkUrl;
    }
    if (url.pathname === '/profile' && dashboardHomePath) {
      const profilePath = resolveDashboardProfilePathFromHome(dashboardHomePath);
      return `${origin}${profilePath}`;
    }
    return linkUrl;
  } catch {
    return linkUrl;
  }
}

export function isExternalSystemBannerLinkUrl(linkUrl: string, origin: string): boolean {
  try {
    const url = new URL(linkUrl, origin);
    return url.origin !== origin;
  } catch {
    return true;
  }
}
