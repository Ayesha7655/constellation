'use client';

import { X } from 'lucide-react';
import { useCallback } from 'react';
import { cn } from '../lib/utils';

type SelectableCardProps = Readonly<{
  label: string;
  selected: boolean;
  onSelect: () => void;
  onClear?: () => void;
  /** When true and selected, shows a clear (×) control. Defaults to false. */
  showClearButton?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Base test id; the card gets `testId`, the clear control `${testId}-clear`. */
  testId?: string;
}>;

export function SelectableCard({
  label,
  selected,
  onSelect,
  onClear,
  showClearButton = false,
  clearLabel = 'Remove',
  disabled,
  className,
  testId,
}: SelectableCardProps) {
  const onClearClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onClear?.();
    },
    [onClear],
  );

  const onCardClick = useCallback(() => {
    if (disabled) {
      return;
    }
    onSelect();
  }, [disabled, onSelect]);

  return (
    <div
      className={cn(
        'flex items-stretch overflow-hidden rounded-lg border transition-colors',
        selected
          ? cn(
              'border-primary bg-primary text-primary-foreground',
              'dark:border-accent dark:bg-accent dark:text-accent-foreground',
            )
          : 'border-border bg-muted/40 text-foreground',
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onCardClick}
        data-testid={testId}
        aria-pressed={selected}
        className={cn(
          'min-w-0 flex-1 px-4 py-3 text-start text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          !selected && 'hover:bg-muted/70',
        )}
      >
        {label}
      </button>
      {selected && showClearButton && onClear ? (
        <button
          type="button"
          disabled={disabled}
          aria-label={clearLabel}
          data-testid={testId ? `${testId}-clear` : undefined}
          onClick={onClearClick}
          className={cn(
            'inline-flex shrink-0 items-center justify-center px-3 transition-colors',
            'text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground',
            'dark:text-accent-foreground/80 dark:hover:bg-accent-foreground/15 dark:hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          )}
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
};

type SelectableCardGridProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function SelectableCardGrid({ children, className }: SelectableCardGridProps) {
  return <div className={cn('grid gap-2 sm:grid-cols-2', className)}>{children}</div>;
}
