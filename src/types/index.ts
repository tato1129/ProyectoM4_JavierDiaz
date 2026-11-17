export type Priority = 'low' | 'medium' | 'high';
export type TaskFilter = 'all' | 'pending' | 'completed';
export type TaskSort = 'manual' | 'priority' | 'dueDate';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  /** Fecha límite en formato YYYY-MM-DD (hora local) o null si no tiene. */
  dueDate: string | null;
  /** Posición para el orden manual (drag & drop). */
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface TaskInput {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
}

export type TaskPatch = Partial<TaskInput & { completed: boolean }>;

export interface OrderUpdate {
  id: string;
  order: number;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface SendSummaryResponse {
  ok: true;
  sentTo: string;
  counts: { total: number; completed: number; pending: number; overdue: number };
}
