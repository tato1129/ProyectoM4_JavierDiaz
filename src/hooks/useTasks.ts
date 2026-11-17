import { useCallback, useEffect, useState } from 'react';
import {
  createTask,
  deleteTask,
  reorderTasks,
  subscribeToTasks,
  toggleTaskCompleted,
  updateTask,
} from '../services/taskService';
import type { OrderUpdate, Task, TaskInput, TaskPatch } from '../types';

const LOAD_ERROR = 'No se pudieron cargar tus tareas. Revisá tu conexión e intentá de nuevo.';

/**
 * Suscribe la UI a las tareas del usuario en Firestore (tiempo real) y expone las
 * operaciones CRUD. Cada operación devuelve `true` si salió bien; si falla, deja el
 * mensaje en `actionError`. La UI se actualiza sola porque onSnapshot emite tras cada escritura.
 */
export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    return subscribeToTasks(
      userId,
      (nextTasks) => {
        setTasks(nextTasks);
        setLoading(false);
      },
      () => {
        setError(LOAD_ERROR);
        setLoading(false);
      },
    );
  }, [userId, reloadKey]);

  const run = useCallback(async (action: () => Promise<unknown>, failureMessage: string): Promise<boolean> => {
    setActionError(null);
    try {
      await action();
      return true;
    } catch {
      setActionError(failureMessage);
      return false;
    }
  }, []);

  const addTask = useCallback(
    async (input: TaskInput): Promise<boolean> => {
      if (!userId) return false;
      return run(() => createTask(userId, input), 'No se pudo crear la tarea. Intentá de nuevo.');
    },
    [userId, run],
  );

  const editTask = useCallback(
    (taskId: string, patch: TaskPatch) => run(() => updateTask(taskId, patch), 'No se pudo guardar la tarea.'),
    [run],
  );

  const toggleTask = useCallback(
    (taskId: string, completed: boolean) =>
      run(() => toggleTaskCompleted(taskId, completed), 'No se pudo actualizar el estado de la tarea.'),
    [run],
  );

  const removeTask = useCallback(
    (taskId: string) => run(() => deleteTask(taskId), 'No se pudo eliminar la tarea.'),
    [run],
  );

  const reorder = useCallback(
    (updates: OrderUpdate[]) => run(() => reorderTasks(updates), 'No se pudo guardar el nuevo orden.'),
    [run],
  );

  const clearActionError = useCallback(() => setActionError(null), []);
  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    tasks,
    loading,
    error,
    actionError,
    clearActionError,
    retry,
    addTask,
    editTask,
    toggleTask,
    removeTask,
    reorder,
  };
}
