import type { Task } from '../../src/types';

let counter = 0;

export function makeTask(overrides: Partial<Task> = {}): Task {
  counter += 1;
  return {
    id: `task-${counter}`,
    userId: 'user-1',
    title: `Tarea ${counter}`,
    description: '',
    completed: false,
    priority: 'medium',
    dueDate: null,
    order: counter,
    createdAt: counter,
    updatedAt: counter,
    ...overrides,
  };
}
