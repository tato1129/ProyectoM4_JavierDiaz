import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskInput } from '../types';
import { formatDueDate, isOverdue } from '../utils/date';
import { PRIORITY_LABELS } from '../utils/priority';
import { TodoForm } from './TodoForm';

interface TodoItemProps {
  task: Task;
  /** Muestra el handle de arrastre (solo con filtro "Todas" y orden manual). */
  draggable: boolean;
  onToggle: (id: string, completed: boolean) => Promise<boolean>;
  onEdit: (id: string, input: TaskInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function TodoItem({ task, draggable, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const overdue = !task.completed && isOverdue(task.dueDate);

  if (editing) {
    return (
      <li ref={setNodeRef} style={style} className="task task--editing">
        <TodoForm
          initialValues={{
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate,
          }}
          submitLabel="Guardar"
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            const saved = await onEdit(task.id, input);
            if (saved) setEditing(false);
            return saved;
          }}
        />
      </li>
    );
  }

  return (
    <li ref={setNodeRef} style={style} className={`task${task.completed ? ' task--done' : ''}`}>
      {draggable && (
        <button type="button" className="drag-handle" {...attributes} {...listeners} aria-label="Reordenar tarea">
          ⋮⋮
        </button>
      )}

      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => void onToggle(task.id, !task.completed)}
        aria-label={
          task.completed
            ? `Marcar "${task.title}" como pendiente`
            : `Marcar "${task.title}" como completada`
        }
      />

      <div className="task__body">
        <p className="task__title">{task.title}</p>
        {task.description && <p className="task__description">{task.description}</p>}
        <p className="task__meta">
          <span className={`badge badge--${task.priority}`}>
            Prioridad {PRIORITY_LABELS[task.priority].toLowerCase()}
          </span>
          {task.dueDate && (
            <span className={overdue ? 'due due--overdue' : 'due'}>
              Vence: {formatDueDate(task.dueDate)}
              {overdue ? ' (vencida)' : ''}
            </span>
          )}
        </p>
      </div>

      <div className="task__actions">
        {confirmingDelete ? (
          <>
            <span>¿Eliminar esta tarea?</span>
            <button
              type="button"
              className="danger"
              onClick={async () => {
                const deleted = await onDelete(task.id);
                if (!deleted) setConfirmingDelete(false);
              }}
            >
              Sí, eliminar
            </button>
            <button type="button" className="secondary" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button type="button" className="secondary" onClick={() => setEditing(true)}>
              Editar
            </button>
            <button type="button" className="secondary" onClick={() => setConfirmingDelete(true)}>
              Eliminar
            </button>
          </>
        )}
      </div>
    </li>
  );
}
