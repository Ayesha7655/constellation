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
import { cn } from '@/lib/utils';

type SortableListProps<T extends { id: string }> = Readonly<{
  items: readonly T[];
  onReorder: (items: readonly T[]) => void;
  renderItem: (item: T) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  dragHandleLabel: string;
}>;

function SortableRow({
  id,
  dragHandleLabel,
  itemClassName,
  children,
}: Readonly<{
  id: string;
  dragHandleLabel: string;
  itemClassName?: string;
  children: React.ReactNode;
}>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-stretch gap-2 rounded-xl bg-card shadow-sm',
        isDragging && 'z-10 opacity-90 shadow-md',
        itemClassName,
      )}
    >
      <button
        type="button"
        className="flex shrink-0 cursor-grab items-center px-2 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={dragHandleLabel}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <div className="min-w-0 flex-1 py-3 pe-3">{children}</div>
    </li>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  itemClassName,
  dragHandleLabel,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      onReorder(arrayMove([...items], oldIndex, newIndex));
    },
    [items, onReorder],
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className={cn('flex flex-col gap-2', className)}>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id} dragHandleLabel={dragHandleLabel} itemClassName={itemClassName}>
              {renderItem(item)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
