'use client';

import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { UseCasePreviewLines } from './use-case-preview-lines';

type FormStepPreviewSectionProps = Readonly<{
  title: string;
  children: ReactNode;
  className?: string;
}>;

export function FormStepPreviewSection({ title, children, className }: FormStepPreviewSectionProps) {
  return (
    <section className={cn('space-y-3 border-b border-border pb-4 last:border-b-0 last:pb-0', className)}>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <dl className="grid gap-2 text-sm">{children}</dl>
    </section>
  );
}

type FormStepPreviewRowProps = Readonly<{
  label: string;
  value: string | null | undefined;
  emptyValue?: string;
}>;

function formatPreviewDisplayValue(value: string | null | undefined, emptyValue: string): string {
  if (value === null || value === undefined) {
    return emptyValue;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : emptyValue;
  }

  return String(value);
}

export function FormStepPreviewRow({
  label,
  value,
  emptyValue = '—',
  emphasized = false,
}: FormStepPreviewRowProps & Readonly<{ emphasized?: boolean }>) {
  const display = formatPreviewDisplayValue(value, emptyValue);

  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn('text-end font-medium', emphasized ? 'text-foreground' : 'text-foreground')}>
        {display}
      </dd>
    </div>
  );
}

export function FormStepPreviewHighlightRow(props: FormStepPreviewRowProps) {
  return <FormStepPreviewRow {...props} emphasized />;
}

type FormStepPreviewUseCasePathsRowProps = Readonly<{
  label: string;
  paths: readonly string[];
  emptyValue?: string;
  emphasized?: boolean;
}>;

export function FormStepPreviewUseCasePathsRow({
  label,
  paths,
  emptyValue = '—',
  emphasized = false,
}: FormStepPreviewUseCasePathsRowProps) {
  if (paths.length === 0) {
    return <FormStepPreviewRow label={label} value={null} emptyValue={emptyValue} emphasized={emphasized} />;
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">
        <UseCasePreviewLines lines={paths} emphasized={emphasized} align="end" />
      </dd>
    </div>
  );
}
