'use client';

import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

type FormGridProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

/** Default two-column form layout for dialogs and pages. */
export function FormGrid({ children, className }: FormGridProps) {
  return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>{children}</div>;
}

/** Span both columns — rich text editors, textareas, and other full-width blocks. */
export function FormGridFullWidth({ children, className }: FormGridProps) {
  return <div className={cn('sm:col-span-2', className)}>{children}</div>;
}
