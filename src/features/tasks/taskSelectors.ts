import type { OrderUpdate, Priority, Task, TaskFilter, TaskSort } from '../../types';
import { isOverdue } from '../../utils/date';

const PRIORITY_WEIGHT: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case 'completed':
      return tasks.filter((task) => task.completed);
    case 'pending':
      return tasks.filter((task) => !task.completed);
    default:
      return tasks;
  }
}

const compareOrder = (a: Task, b: Task): number => a.order - b.order || a.createdAt - b.createdAt;

const comparePriority = (a: Task, b: Task): number => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];

/** Las tareas sin fecha de vencimiento van al final. */
function compareDueDate(a: Task, b: Task): number {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const copy = [...tasks];
  switch (sort) {
    case 'priority':
      return copy.sort((a, b) => comparePriority(a, b) || compareDueDate(a, b) || compareOrder(a, b));
    case 'dueDate':
      return copy.sort((a, b) => compareDueDate(a, b) || comparePriority(a, b) || compareOrder(a, b));
    default:
      return copy.sort(compareOrder);
  }
}

export function selectVisibleTasks(tasks: Task[], filter: TaskFilter, sort: TaskSort): Task[] {
  return sortTasks(filterTasks(tasks, filter), sort);
}

export function getTaskStats(tasks: Task[], today: Date = new Date()) {
  const completed = tasks.filter((task) => task.completed).length;
  const overdue = tasks.filter((task) => !task.completed && isOverdue(task.dueDate, today)).length;
  return { total: tasks.length, completed, pending: tasks.length - completed, overdue };
}

/** Mueve la tarea `activeId` a la posición de `overId` (misma semántica que arrayMove de dnd-kit). */
export function reorderList(tasks: Task[], activeId: string, overId: string): Task[] {
  const from = tasks.findIndex((task) => task.id === activeId);
  const to = tasks.findIndex((task) => task.id === overId);
  if (from === -1 || to === -1 || from === to) return tasks;

  const next = [...tasks];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Asigna posiciones 0..n-1 según el orden actual de la lista. */
export function computeOrderUpdates(tasks: Task[]): OrderUpdate[] {
  return tasks.map((task, index) => ({ id: task.id, order: index }));
}
