'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

/** Overlay spinner for `GlobalLoadingProvider` only — do not use in feature views. */
export type AppLoadingVariant = 'overlay';

type AppLoadingProps = Readonly<{
  label?: string;
  variant?: AppLoadingVariant;
  className?: string;
}>;

export function AppLoading({ label, className }: AppLoadingProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-[1px]">
      <div
        role="status"
        aria-live="polite"
        className={cn('flex flex-col items-center justify-center gap-3 text-center', className)}
      >
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
      </div>
    </div>
  );
}
