import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

type PaginatedTableLayoutProps = Readonly<{
  table: ReactNode;
  pagination: ReactNode;
  className?: string;
}>;

/** Flex column: table fills height; pagination pinned; no outer scroll. */
export function PaginatedTableLayout({ table, pagination, className }: PaginatedTableLayoutProps) {
  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden', className)}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{table}</div>
      <div className="shrink-0">{pagination}</div>
    </div>
  );
}
