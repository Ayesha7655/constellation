'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useCallback } from 'react';
import { cn } from '../lib/utils';
import { type DataTableColumn } from './data-table';

type SortableCatalogTableProps<T> = Readonly<{
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  onReorder: (rows: readonly T[]) => void;
  dragHandleLabel: string;
  emptyMessage?: string;
  reordering?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
  isRowClickable?: (row: T) => boolean;
  getRowTestId?: (row: T) => string;
}>;

function SortableTableRow<T>({
  row,
  rowKey,
  columns,
  dragHandleLabel,
  reordering,
  onRowClick,
  isRowClickable,
  getRowTestId,
}: Readonly<{
  row: T;
  rowKey: string;
  columns: readonly DataTableColumn<T>[];
  dragHandleLabel: string;
  reordering?: boolean;
  onRowClick?: (row: T) => void;
  isRowClickable?: (row: T) => boolean;
  getRowTestId?: (row: T) => string;
}>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowKey,
    disabled: reordering,
  });

  const clickable = onRowClick != null && (isRowClickable?.(row) ?? true);
  const onNavigate = clickable ? () => onRowClick(row) : undefined;

  return (
    <tr
      ref={setNodeRef}
      data-testid={getRowTestId?.(row)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'border-b border-border last:border-b-0',
        isDragging && 'relative z-10 bg-card opacity-90 shadow-md',
        clickable && 'cursor-pointer transition-colors hover:bg-muted/50',
      )}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onRowClick(row);
              }
            }
          : undefined
      }
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
    >
      <td className="w-12 px-2 py-3 align-top">
        <button
          type="button"
          disabled={reordering}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            'flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors',
            reordering
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-grab hover:bg-muted hover:text-foreground active:cursor-grabbing',
          )}
          aria-label={dragHandleLabel}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      </td>
      {columns.map((column) => (
        <td
          key={column.id}
          onClick={clickable && column.id !== 'actions' ? onNavigate : undefined}
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
}

export function SortableCatalogTable<T>({
  columns,
  rows,
  getRowKey,
  onReorder,
  dragHandleLabel,
  emptyMessage,
  reordering = false,
  className,
  onRowClick,
  isRowClickable,
  getRowTestId,
}: SortableCatalogTableProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const rowKeys = rows.map(getRowKey);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (reordering) {
        return;
      }
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const oldIndex = rowKeys.indexOf(String(active.id));
      const newIndex = rowKeys.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      onReorder(arrayMove([...rows], oldIndex, newIndex));
    },
    [onReorder, reordering, rowKeys, rows],
  );

  return (
    <div className={cn('overflow-x-auto border border-border', className)}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th
                scope="col"
                className="w-12 px-2 py-3 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground"
                aria-hidden
              />
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
          <SortableContext items={rowKeys} strategy={verticalListSortingStrategy}>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                    {emptyMessage ?? '—'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const rowKey = getRowKey(row);
                  return (
                    <SortableTableRow
                      key={rowKey}
                      row={row}
                      rowKey={rowKey}
                      columns={columns}
                      dragHandleLabel={dragHandleLabel}
                      reordering={reordering}
                      onRowClick={onRowClick}
                      isRowClickable={isRowClickable}
                      getRowTestId={getRowTestId}
                    />
                  );
                })
              )}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </div>
  );
}
