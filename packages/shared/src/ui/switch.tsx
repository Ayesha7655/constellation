'use client';

import { useCallback } from 'react';
import { cn } from '../lib/utils';

type SwitchProps = Readonly<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  title?: string;
  testId?: string;
}>;

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  'aria-label': ariaLabel,
  title,
  testId,
}: SwitchProps) {
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

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onKeyDown={onKeyDown}
      title={title}
      data-testid={testId}
      className={cn(
        'inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full px-0.5 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'block size-5 rounded-full bg-background shadow-sm transition-[margin]',
          checked && 'ms-auto',
        )}
      />
    </button>
  );
}
