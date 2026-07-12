'use client';

import { Checkbox } from './checkbox';
import { cn } from '../lib/utils';

export type CatalogMultiSelectOption = Readonly<{
  key: string;
  label: string;
}>;

type CatalogMultiSelectOrientation = 'vertical' | 'horizontal';

type CatalogMultiSelectProps = Readonly<{
  id: string;
  options: readonly CatalogMultiSelectOption[];
  selectedKeys: readonly string[];
  onToggle: (key: string, checked: boolean) => void;
  orientation?: CatalogMultiSelectOrientation;
  className?: string;
  listClassName?: string;
}>;

export function CatalogMultiSelect({
  id,
  options,
  selectedKeys,
  onToggle,
  orientation = 'vertical',
  className,
  listClassName,
}: CatalogMultiSelectProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={cn(!isHorizontal && 'max-h-48 overflow-y-auto', className)}>
      <div
        className={cn(isHorizontal ? 'flex flex-wrap gap-2' : 'space-y-2', listClassName)}
      >
        {options.map((option) => {
          const checked = selectedKeys.includes(option.key);

          return (
            <Checkbox
              key={option.key}
              id={`${id}-${option.key}`}
              checked={checked}
              onCheckedChange={(nextChecked) => onToggle(option.key, nextChecked)}
              label={option.label}
              className={cn(
                'rounded-md transition-colors hover:bg-muted/60',
                isHorizontal
                  ? 'w-auto shrink-0 border border-border bg-background px-3 py-2'
                  : 'w-full px-2.5 py-2',
                checked && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
                isHorizontal && checked && 'border-primary/30',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
