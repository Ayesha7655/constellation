'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../pagination';
import { cn } from '../lib/utils';
import { Button } from './button';

type PaginationProps = Readonly<{
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
  disabled?: boolean;
  className?: string;
  /** Base test id; prev/next buttons get `${testId}-prev` / `${testId}-next`. */
  testId?: string;
}>;

export function Pagination({
  meta,
  onPageChange,
  previousLabel,
  nextLabel,
  pageLabel,
  disabled = false,
  className,
  testId,
}: PaginationProps) {
  const canGoPrevious = meta.page > 1;
  const canGoNext = meta.totalPages > 0 && meta.page < meta.totalPages;

  const onPreviousClick = () => {
    if (canGoPrevious && !disabled) {
      onPageChange(meta.page - 1);
    }
  };

  const onNextClick = () => {
    if (canGoNext && !disabled) {
      onPageChange(meta.page + 1);
    }
  };

  if (meta.total === 0) {
    return null;
  }

  return (
    <nav
      aria-label={pageLabel}
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
    >
      <p className="text-sm text-muted-foreground">{pageLabel}</p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          fullWidth={false}
          disabled={disabled || !canGoPrevious}
          onClick={onPreviousClick}
          testId={testId ? `${testId}-prev` : undefined}
          className="inline-flex items-center gap-1 px-3"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {previousLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          fullWidth={false}
          disabled={disabled || !canGoNext}
          onClick={onNextClick}
          testId={testId ? `${testId}-next` : undefined}
          className="inline-flex items-center gap-1 px-3"
        >
          {nextLabel}
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
