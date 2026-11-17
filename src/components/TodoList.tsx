import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskInput } from '../types';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  tasks: Task[];
  dragEnabled: boolean;
  emptyMessage?: string;
  onToggle: (id: string, completed: boolean) => Promise<boolean>;
  onEdit: (id: string, input: TaskInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onReorder: (activeId: string, overId: string) => void;
}

export function TodoList({
  tasks,
  dragEnabled,
  emptyMessage = 'No hay tareas para mostrar.',
  onToggle,
  onEdit,
  onDelete,
  onReorder,
}: TodoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (tasks.length === 0) {
    return <p className="empty">{emptyMessage}</p>;
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <ul className="task-list">
          {tasks.map((task) => (
            <TodoItem
              key={task.id}
              task={task}
              draggable={dragEnabled}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
