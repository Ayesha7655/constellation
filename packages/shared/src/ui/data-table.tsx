import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/** Tailwind width classes for `table-fixed` DataTable columns. Prefer percentages that sum to 100%. */
export const dataTableColumnWidth = {
  /** Status badges, short enums */
  compact: 'w-[11%]',
  /** Dates, slugs, mono identifiers */
  narrow: 'w-[13%]',
  /** Account type, category labels */
  medium: 'w-[14%]',
  /** Row actions (View details, etc.) */
  actions: 'w-[14%]',
  /** Icon-only actions (edit / delete) */
  actionsIcons: 'w-24',
  /** Name, title — primary label column */
  primary: 'w-[20%]',
  /** Status badge(s) + date grouped in one column */
  details: 'w-[22%]',
  /** Email, long text — grows within fixed layout via wrap */
  flexible: 'w-[26%]',
  /** Long prose (descriptions) when paired with compact columns */
  prose: 'w-[40%]',
} as const;

export type DataTableColumn<T> = Readonly<{
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  /** Width utility on `<th>` and `<td>` — use with `table-fixed` (see `dataTableColumnWidth`). */
  widthClassName?: string;
}>;

type DataTableProps<T> = Readonly<{
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
  /** Fill flex height; keep header visible and scroll body rows only. */
  scrollBody?: boolean;
  /** Test id on the table container. */
  testId?: string;
  /** Per-row test id (use a stable entity key — never an array index). */
  getRowTestId?: (row: T) => string;
}>;

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyMessage,
  className,
  scrollBody = false,
  testId,
  getRowTestId,
}: DataTableProps<T>) {
  const table = (
    <table className="w-full table-fixed border-collapse text-sm">
      <thead className={cn(scrollBody && 'sticky top-0 z-10')}>
        <tr className={cn('border-b border-border bg-muted/40', scrollBody && 'bg-muted')}>
          {columns.map((column) => (
            <th
              key={column.id}
              scope="col"
              className={cn(
                'break-words px-4 py-3 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground',
                column.widthClassName,
                column.headerClassName,
              )}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
              {emptyMessage ?? '—'}
            </td>
          </tr>
        ) : (
          rows.map((row) => {
            const rowKey = getRowKey(row);
            const clickable = Boolean(onRowClick);
            return (
              <tr
                key={rowKey}
                data-testid={getRowTestId?.(row)}
                className={cn(
                  'border-b border-border last:border-b-0',
                  clickable && 'cursor-pointer transition-colors hover:bg-muted/50',
                )}
                onClick={clickable ? () => onRowClick?.(row) : undefined}
                onKeyDown={
                  clickable
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick?.(row);
                        }
                      }
                    : undefined
                }
                tabIndex={clickable ? 0 : undefined}
                role={clickable ? 'button' : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      'break-words px-4 py-3 align-top text-foreground',
                      column.widthClassName,
                      column.cellClassName,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );

  if (!scrollBody) {
    return (
      <div data-testid={testId} className={cn('overflow-x-auto border border-border', className)}>
        {table}
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-border',
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-auto">{table}</div>
    </div>
  );
}
