'use client';

import { Check } from 'lucide-react';
import { useCallback } from 'react';
import { cn } from '../lib/utils';

type CheckboxProps = Readonly<{
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  /** Stable hook for tests, rendered as `data-testid` on the control. */
  testId?: string;
}>;

export function Checkbox({
  id,
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
  'aria-label': ariaLabel,
  testId,
}: CheckboxProps) {
  const onClick = useCallback(() => {
    if (disabled) {
      return;
    }
    onCheckedChange(!checked);
  }, [checked, disabled, onCheckedChange]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }
      if (event.key === ' ') {
        event.preventDefault();
        onCheckedChange(!checked);
      }
    },
    [checked, disabled, onCheckedChange],
  );

  const mark = (
    <span
      aria-hidden
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors',
        checked
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background hover:border-primary/40',
        disabled && 'opacity-50',
        label && 'mt-0.5',
      )}
    >
      {checked ? <Check className="size-3.5 stroke-[2.5]" aria-hidden /> : null}
    </span>
  );

  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label ? undefined : ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onKeyDown={onKeyDown}
      data-testid={testId}
      className={cn(
        'inline-flex cursor-pointer items-center gap-3 rounded-md text-sm text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        disabled && 'cursor-not-allowed opacity-50',
        !label && 'items-start',
        className,
      )}
    >
      {mark}
      {label ? <span className="min-w-0 flex-1 text-start leading-snug">{label}</span> : null}
    </button>
  );
}
