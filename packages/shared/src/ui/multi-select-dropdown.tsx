'use client';

import { ChevronDown, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from './checkbox';
import { cn } from '../lib/utils';

export type MultiSelectDropdownOption = Readonly<{
  value: string;
  label: string;
}>;

export type MultiSelectMenuPlacement = 'auto' | 'bottom' | 'top';

type MultiSelectDropdownProps = Readonly<{
  options: readonly MultiSelectDropdownOption[];
  selectedValues: readonly string[];
  onChange: (nextValues: readonly string[]) => void;
  ariaLabel: string;
  placeholder: string;
  emptyMessage?: string;
  selectedSummary?: (count: number, labels: readonly string[]) => string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  triggerClassName?: string;
  testId?: string;
  /** Menu position. `auto` flips above when there is not enough space below. Defaults to auto. */
  menuPlacement?: MultiSelectMenuPlacement;
}>;

const MENU_MAX_HEIGHT_PX = 240;
const MENU_GAP_PX = 4;

const DEFAULT_SELECTED_SUMMARY = (count: number, labels: readonly string[]): string => {
  if (count === 0) {
    return '';
  }
  if (count === 1) {
    return labels[0] ?? '1 selected';
  }
  const preview = labels.slice(0, 2).join(', ');
  if (count <= 2) {
    return preview;
  }
  return `${preview} +${count - 2}`;
};

function resolveMenuPlacement(
  triggerRect: DOMRect,
  preference: MultiSelectMenuPlacement,
): 'bottom' | 'top' {
  if (preference === 'bottom') {
    return 'bottom';
  }
  if (preference === 'top') {
    return 'top';
  }

  const spaceBelow = window.innerHeight - triggerRect.bottom - MENU_GAP_PX;
  const spaceAbove = triggerRect.top - MENU_GAP_PX;

  if (spaceBelow >= MENU_MAX_HEIGHT_PX) {
    return 'bottom';
  }
  if (spaceAbove >= MENU_MAX_HEIGHT_PX) {
    return 'top';
  }

  return spaceAbove > spaceBelow ? 'top' : 'bottom';
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  ariaLabel,
  placeholder,
  emptyMessage = 'No options available',
  selectedSummary = DEFAULT_SELECTED_SUMMARY,
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  triggerClassName,
  testId,
  menuPlacement = 'auto',
}: MultiSelectDropdownProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [resolvedPlacement, setResolvedPlacement] = useState<'bottom' | 'top'>('bottom');
  const isFullWidth = fullWidth || className?.includes('w-full') === true || triggerClassName?.includes('w-full') === true;

  const selectedLabels = useMemo(
    () =>
      selectedValues
        .map((value) => options.find((option) => option.value === value)?.label)
        .filter((label): label is string => Boolean(label)),
    [options, selectedValues],
  );

  const triggerLabel = useMemo(() => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    return selectedSummary(selectedValues.length, selectedLabels) || placeholder;
  }, [placeholder, selectedLabels, selectedSummary, selectedValues.length]);

  const updateResolvedPlacement = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    setResolvedPlacement(resolveMenuPlacement(container.getBoundingClientRect(), menuPlacement));
  }, [menuPlacement]);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    if (disabled || loading || options.length === 0) {
      return;
    }
    setOpen((current) => !current);
  }, [disabled, loading, options.length]);

  const onOptionToggle = useCallback(
    (value: string, checked: boolean) => {
      const nextValues = checked
        ? [...selectedValues, value]
        : selectedValues.filter((entry) => entry !== value);
      onChange(nextValues);
    },
    [onChange, selectedValues],
  );

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updateResolvedPlacement();
  }, [open, updateResolvedPlacement]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    const handleReposition = () => {
      updateResolvedPlacement();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [closeMenu, open, updateResolvedPlacement]);

  return (
    <div
      ref={containerRef}
      className={cn('relative', isFullWidth ? 'flex w-full min-w-0' : 'inline-flex', className)}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={handleToggle}
        data-testid={testId}
        disabled={disabled || loading || options.length === 0}
        className={cn(
          'flex items-center justify-between gap-2 rounded-md border border-border',
          'bg-background px-2.5 py-1.5 text-sm text-foreground transition-colors',
          'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          (disabled || loading || options.length === 0) && 'cursor-not-allowed opacity-70',
          selectedValues.length === 0 && 'text-muted-foreground',
          isFullWidth ? 'w-full min-w-0' : 'inline-flex min-w-[7.5rem]',
          triggerClassName,
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          <ChevronDown
            className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        )}
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          aria-multiselectable="true"
          className={cn(
            'absolute z-[100] max-h-60 min-w-full overflow-y-auto rounded-md border border-border',
            'bg-popover p-1 shadow-md',
            'start-0',
            resolvedPlacement === 'top' ? 'bottom-[calc(100%+0.25rem)]' : 'top-[calc(100%+0.25rem)]',
          )}
        >
          {options.length === 0 ? (
            <li className="px-2.5 py-2 text-sm text-muted-foreground">{emptyMessage}</li>
          ) : (
            options.map((option) => {
              const checked = selectedValues.includes(option.value);
              return (
                <li key={option.value} role="presentation" className="rounded-sm px-1 py-0.5">
                  <Checkbox
                    id={`${listboxId}-${option.value}`}
                    checked={checked}
                    onCheckedChange={(nextChecked) => onOptionToggle(option.value, nextChecked)}
                    label={option.label}
                    testId={testId ? `${testId}-option-${option.value}` : undefined}
                    className="w-full px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                  />
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
