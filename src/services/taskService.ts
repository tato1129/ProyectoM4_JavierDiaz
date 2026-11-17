import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import type { OrderUpdate, Task, TaskInput, TaskPatch } from '../types';
import { db } from './firebase';

const TASKS_COLLECTION = 'tasks';

function toTask(snapshot: QueryDocumentSnapshot<DocumentData>): Task {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId,
    title: data.title ?? '',
    description: data.description ?? '',
    completed: Boolean(data.completed),
    priority: data.priority ?? 'medium',
    dueDate: data.dueDate ?? null,
    order: typeof data.order === 'number' ? data.order : 0,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
  };
}

/**
 * Escucha en tiempo real SOLO las tareas del usuario (filtro por userId).
 * El orden se resuelve en el cliente para no requerir índices compuestos.
 */
export function subscribeToTasks(
  userId: string,
  onData: (tasks: Task[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const tasksQuery = query(collection(db, TASKS_COLLECTION), where('userId', '==', userId));
  return onSnapshot(tasksQuery, (snapshot) => onData(snapshot.docs.map(toTask)), onError);
}

export async function createTask(userId: string, input: TaskInput, order: number = Date.now()): Promise<string> {
  const now = Date.now();
  const reference = await addDoc(collection(db, TASKS_COLLECTION), {
    userId,
    title: input.title.trim(),
    description: input.description.trim(),
    completed: false,
    priority: input.priority,
    dueDate: input.dueDate,
    order,
    createdAt: now,
    updatedAt: now,
  });
  return reference.id;
}

export async function updateTask(taskId: string, patch: TaskPatch): Promise<void> {
  // Firestore rechaza valores `undefined`: se descartan antes de escribir.
  const data: Record<string, unknown> = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  );
  if (typeof data.title === 'string') data.title = data.title.trim();
  if (typeof data.description === 'string') data.description = data.description.trim();

  await updateDoc(doc(db, TASKS_COLLECTION, taskId), { ...data, updatedAt: Date.now() });
}

export function toggleTaskCompleted(taskId: string, completed: boolean): Promise<void> {
  return updateTask(taskId, { completed });
}

export function deleteTask(taskId: string): Promise<void> {
  return deleteDoc(doc(db, TASKS_COLLECTION, taskId));
}

/** Persiste el nuevo orden manual en un único batch atómico (límite de Firestore: 500 operaciones). */
export async function reorderTasks(updates: OrderUpdate[]): Promise<void> {
  const batch = writeBatch(db);
  const now = Date.now();
  updates.forEach(({ id, order }) => {
    batch.update(doc(db, TASKS_COLLECTION, id), { order, updatedAt: now });
  });
  await batch.commit();
}
