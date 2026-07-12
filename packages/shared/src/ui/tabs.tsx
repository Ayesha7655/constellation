'use client';

import { useCallback } from 'react';
import { cn } from '../lib/utils';

export type TabsVariant = 'pill' | 'underline';

export type TabItem<T extends string = string> = Readonly<{
  value: T;
  label: string;
}>;

type TabsProps<T extends string> = Readonly<{
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: TabsVariant;
  className?: string;
  ariaLabel?: string;
  /** Base test id; each tab gets `${testId}-<value>`. */
  testId?: string;
}>;

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'pill',
  className,
  ariaLabel = 'Tabs',
  testId,
}: TabsProps<T>) {
  const onTabClick = useCallback(
    (nextValue: T) => {
      onChange(nextValue);
    },
    [onChange],
  );

  if (variant === 'underline') {
    return (
      <div className={cn('border-b border-border', className)}>
        <div className="-mb-px flex gap-1 overflow-x-auto" role="tablist" aria-label={ariaLabel}>
          {items.map((item) => {
            const selected = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={selected}
                data-testid={testId ? `${testId}-${item.value}` : undefined}
                onClick={() => onTabClick(item.value)}
                className={cn(
                  'relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  selected
                    ? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            data-testid={testId ? `${testId}-${item.value}` : undefined}
            onClick={() => onTabClick(item.value)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
