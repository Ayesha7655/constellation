'use client';

import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type BreadcrumbItem = Readonly<{
  label: string;
  href?: string;
}>;

type BreadcrumbsProps = Readonly<{
  items: readonly BreadcrumbItem[];
  className?: string;
}>;

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex min-w-0 items-center gap-1.5 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Fragment key={`${item.href ?? 'current'}-${item.label}`}>
            {index > 0 ? (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  'truncate transition-colors hover:text-foreground',
                  isLast ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span className="truncate font-medium text-foreground" aria-current="page">
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
