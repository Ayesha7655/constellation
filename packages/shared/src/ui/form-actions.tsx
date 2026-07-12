'use client';

import { cn } from '../lib/utils';

type FormActionsProps = Readonly<{
  children: React.ReactNode;
  className?: string;
  /** Stable hook for tests, rendered as `data-testid` on the container. */
  testId?: string;
}>;

/** Primary form/dialog actions — align to the end (right in LTR) by default. */
export function FormActions({ children, className, testId }: FormActionsProps) {
  return (
    <div data-testid={testId} className={cn('flex flex-wrap items-center justify-end gap-2', className)}>
      {children}
    </div>
  );
}
