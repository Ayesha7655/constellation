'use client';

import { useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

type DetailRefreshButtonProps = Readonly<{
  onRefresh: () => void;
  isRefreshing?: boolean;
  ariaLabel: string;
  testId: string;
}>;

export function DetailRefreshButton({ onRefresh, isRefreshing = false, ariaLabel, testId }: DetailRefreshButtonProps) {
  const onClick = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isRefreshing}
      data-testid={testId}
      aria-label={ariaLabel}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden />
    </button>
  );
}
