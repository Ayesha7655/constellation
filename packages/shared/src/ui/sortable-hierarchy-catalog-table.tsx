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

type SortableHierarchyCatalogTableProps<T> = Readonly<{
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  getRowParentKey: (row: T) => string | null;
  getRowDepth?: (row: T) => number;
  getRowTestId?: (row: T) => string;
  rowIndentRem?: number;
  onReorderSiblings: (parentKey: string | null, reorderedSiblings: readonly T[]) => void;
  dragHandleLabel: string;
  emptyMessage?: string;
  reordering?: boolean;
  className?: string;
}>;

function SortableHierarchyTableRow<T>({
  row,
  rowKey,
  rowDepth,
  rowIndentRem,
  rowTestId,
  columns,
  dragHandleLabel,
  reordering,
}: Readonly<{
  row: T;
  rowKey: string;
  rowDepth: number;
  rowIndentRem: number;
  rowTestId?: string;
  columns: readonly DataTableColumn<T>[];
  dragHandleLabel: string;
  reordering?: boolean;
}>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowKey,
    disabled: reordering,
  });

  return (
    <tr
      ref={setNodeRef}
      data-testid={rowTestId}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'border-b border-border last:border-b-0',
        rowDepth > 0 && 'bg-muted/15',
        isDragging && 'relative z-10 bg-card opacity-90 shadow-md',
      )}
    >
      <td className="w-12 px-2 py-3 align-top" style={{ paddingInlineStart: `${rowDepth * rowIndentRem}rem` }}>
        <button
          type="button"
          disabled={reordering}
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

export function SortableHierarchyCatalogTable<T>({
  columns,
  rows,
  getRowKey,
  getRowParentKey,
  getRowDepth,
  getRowTestId,
  rowIndentRem = 1.5,
  onReorderSiblings,
  dragHandleLabel,
  emptyMessage,
  reordering = false,
  className,
}: SortableHierarchyCatalogTableProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
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
      const activeKey = String(active.id);
      const overKey = String(over.id);
      const activeRow = rows.find((row) => getRowKey(row) === activeKey);
      const overRow = rows.find((row) => getRowKey(row) === overKey);
      if (!activeRow || !overRow) {
        return;
      }
      const parentKey = getRowParentKey(activeRow);
      if (getRowParentKey(overRow) !== parentKey) {
        return;
      }

      const siblingRows = rows.filter((row) => getRowParentKey(row) === parentKey);
      const siblingKeys = siblingRows.map(getRowKey);
      const oldIndex = siblingKeys.indexOf(activeKey);
      const newIndex = siblingKeys.indexOf(overKey);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      onReorderSiblings(parentKey, arrayMove(siblingRows, oldIndex, newIndex));
    },
    [getRowKey, getRowParentKey, onReorderSiblings, reordering, rows],
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
                    <SortableHierarchyTableRow
                      key={rowKey}
                      row={row}
                      rowKey={rowKey}
                      rowDepth={getRowDepth?.(row) ?? 0}
                      rowIndentRem={rowIndentRem}
                      rowTestId={getRowTestId?.(row)}
                      columns={columns}
                      dragHandleLabel={dragHandleLabel}
                      reordering={reordering}
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
