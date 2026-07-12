'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

type LoadingIndicatorProps = Readonly<{
  label?: string;
  className?: string;
}>;

/** Inline spinner for panels, pages, and other local loading states — not the global overlay. */
export function LoadingIndicator({ label, className }: LoadingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-3 text-center', className)}
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
}
