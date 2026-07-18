'use client';

import Image from 'next/image';
import { TEST_IDS } from '@constellation/shared';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type BrandLinkProps = Readonly<{
  href?: string;
  className?: string;
  /** When false, only the mark is shown (use when nearby text already names the product). */
  showLabel?: boolean;
  size?: 'sm' | 'md';
}>;

const SIZE_PX = {
  sm: 28,
  md: 36,
} as const;

export function BrandLink({
  href = '/',
  className,
  showLabel = true,
  size = 'sm',
}: BrandLinkProps) {
  const px = SIZE_PX[size];

  return (
    <Link
      href={href}
      data-testid={TEST_IDS.nav.brand}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-foreground',
        'rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt={showLabel ? '' : 'Constellation'}
        width={px}
        height={px}
        className="rounded-md"
        priority
      />
      {showLabel ? <span>Constellation</span> : null}
    </Link>
  );
}
