'use client';

import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

export type DropdownOption<T extends string = string> = Readonly<{
  value: T;
  label: string;
}>;

type DropdownProps<T extends string = string> = Readonly<{
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  triggerClassName?: string;
  /** When true, the trigger spans the full width of its container (typical in forms). */
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** Base test id; the trigger gets `testId`, options `${testId}-option-<value>`. */
  testId?: string;
}>;

type MenuPosition = Readonly<{
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}>;

/** Hard ceiling for the menu height (px); the open direction caps it to the available space. */
const MENU_MAX_HEIGHT = 256;

export function Dropdown<T extends string = string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  triggerClassName,
  fullWidth = false,
  loading = false,
  disabled = false,
  testId,
}: DropdownProps<T>) {
  const isFullWidth =
    fullWidth || className?.includes('w-full') === true || triggerClassName?.includes('w-full') === true;
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const selected = options.find((option) => option.value === value);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  // Anchor the portalled menu to the trigger so it escapes any scroll/overflow container
  // (e.g. a Dialog body) instead of being clipped inside it.
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const margin = 8;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    // Flip the menu above the trigger when there isn't enough room below and there's more above —
    // keeps the list on-screen when the trigger sits low in the viewport (e.g. inside a popover).
    const openUp = spaceBelow < Math.min(MENU_MAX_HEIGHT, 192) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(96, Math.min(MENU_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow));
    setPosition({
      left: rect.left,
      width: rect.width,
      maxHeight,
      ...(openUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    });
  }, []);

  const handleToggle = useCallback(() => {
    if (disabled || loading) {
      return;
    }
    setOpen((current) => !current);
  }, [disabled, loading]);

  const handleSelect = useCallback(
    (nextValue: T) => {
      onChange(nextValue);
      setOpen(false);
    },
    [onChange],
  );

  useEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    // Reposition while open so the menu tracks the trigger as the dialog/page scrolls.
    // Capture phase catches scrolls on nested overflow containers, not just the window.
    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [closeMenu, open, updatePosition]);

  const menu =
    open && position && typeof document !== 'undefined'
      ? createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              minWidth: position.width,
              maxHeight: position.maxHeight,
            }}
            className={cn(
              'fixed z-[60] overflow-y-auto rounded-md border border-border',
              'bg-popover p-1 shadow-md',
            )}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-testid={testId ? `${testId}-option-${option.value}` : undefined}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-start text-sm',
                      'text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent/70 text-accent-foreground',
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <Check className="size-4 shrink-0" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className={cn(isFullWidth ? 'flex w-full min-w-0' : 'inline-flex', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={handleToggle}
        data-testid={testId}
        disabled={disabled || loading}
        className={cn(
          'flex items-center justify-between gap-2 rounded-md border-0',
          'bg-muted px-2.5 py-1.5 text-sm text-foreground transition-colors',
          'hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          (disabled || loading) && 'cursor-not-allowed opacity-70',
          isFullWidth ? 'w-full min-w-0' : 'inline-flex min-w-[7.5rem]',
          triggerClassName,
        )}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          <ChevronDown
            className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        )}
      </button>
      {menu}
    </div>
  );
}
