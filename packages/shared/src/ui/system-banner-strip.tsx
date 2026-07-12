'use client';

import { X } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { isExternalSystemBannerLinkUrl } from '../lib/resolve-system-banner-link-url';
import { systemBannerVariantToFormBannerVariant, type SystemBannerStripDto } from '../system-banners';
import { cn } from '../lib/utils';

type SystemBannerStripProps = Readonly<{
  banner: SystemBannerStripDto;
  dismissLabel: string;
  defaultLinkLabel: string;
  onDismiss: (id: string) => void;
  testId?: string;
  dismissTestId?: string;
  linkTestId?: string;
}>;

export function SystemBannerStrip({
  banner,
  dismissLabel,
  defaultLinkLabel,
  onDismiss,
  testId,
  dismissTestId,
  linkTestId,
}: SystemBannerStripProps) {
  const variant = systemBannerVariantToFormBannerVariant(banner.variant);
  const linkLabel = banner.linkLabel?.trim() || defaultLinkLabel;
  const linkUrl = banner.linkUrl?.trim() ?? '';
  const showLink = linkUrl.length > 0;

  const isExternalLink = useMemo(() => {
    if (!showLink || typeof window === 'undefined') {
      return true;
    }
    return isExternalSystemBannerLinkUrl(linkUrl, window.location.origin);
  }, [linkUrl, showLink]);

  const onDismissClick = useCallback(() => {
    onDismiss(banner.id);
  }, [banner.id, onDismiss]);

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      data-testid={testId}
      className={cn(
        'flex shrink-0 items-center gap-3 border-b px-4 py-2.5 text-sm shadow-sm',
        variant === 'error' && 'border-destructive/30 bg-destructive/10 text-destructive',
        variant === 'info' && 'border-border bg-muted text-muted-foreground',
        variant === 'warning' && 'border-accent bg-accent/15 text-foreground',
      )}
    >
      <p className="line-clamp-2 min-w-0 flex-1 text-start">{banner.message}</p>
      {showLink ? (
        <a
          href={linkUrl}
          className="shrink-0 font-medium underline underline-offset-2 hover:opacity-80"
          target={isExternalLink ? '_blank' : undefined}
          rel={isExternalLink ? 'noopener noreferrer' : undefined}
          data-testid={linkTestId}
        >
          {linkLabel}
        </a>
      ) : null}
      <button
        type="button"
        className="shrink-0 rounded-md p-1 text-current transition-opacity hover:opacity-70"
        aria-label={dismissLabel}
        data-testid={dismissTestId}
        onClick={onDismissClick}
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
