import { useMemo, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { SendSummaryButton } from '../components/SendSummaryButton';
import { TaskFilters } from '../components/TaskFilters';
import { TodoForm } from '../components/TodoForm';
import { TodoList } from '../components/TodoList';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import {
  computeOrderUpdates,
  getTaskStats,
  reorderList,
  selectVisibleTasks,
} from '../features/tasks/taskSelectors';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import type { TaskFilter, TaskSort } from '../types';

export function TasksPage() {
  const { user } = useAuth();
  const {
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
  } = useTasks(user?.uid);

  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sort, setSort] = useState<TaskSort>('manual');

  const visibleTasks = useMemo(() => selectVisibleTasks(tasks, filter, sort), [tasks, filter, sort]);
  const stats = useMemo(() => getTaskStats(tasks), [tasks]);

  // El arrastre solo tiene sentido sobre la lista completa en orden manual.
  const dragEnabled = filter === 'all' && sort === 'manual';

  function handleReorder(activeId: string, overId: string) {
    const reordered = reorderList(visibleTasks, activeId, overId);
    void reorder(computeOrderUpdates(reordered));
  }

  const emptyMessage =
    tasks.length === 0 ? 'Todavía no tenés tareas. ¡Creá la primera!' : 'No hay tareas que coincidan con el filtro.';

  return (
    <>
      <Navbar />
      <main className="tasks-page">
        <section className="card" aria-labelledby="new-task-title">
          <h2 id="new-task-title">Nueva tarea</h2>
          <TodoForm onSubmit={addTask} />
        </section>

        <section className="card" aria-labelledby="task-list-title">
          <div className="card__header">
            <h2 id="task-list-title">Tus tareas</h2>
            <p className="stats">
              {stats.pending} pendientes · {stats.completed} completadas · {stats.total} en total
            </p>
          </div>

          <SendSummaryButton />

          {actionError && (
            <Alert variant="error" onDismiss={clearActionError}>
              {actionError}
            </Alert>
          )}

          <TaskFilters filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />

          {loading && <Spinner label="Cargando tus tareas…" />}

          {!loading && error && (
            <div className="load-error">
              <Alert variant="error">{error}</Alert>
              <button type="button" className="secondary" onClick={retry}>
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {!dragEnabled && visibleTasks.length > 1 && (
                <p className="hint">Para reordenar arrastrando, elegí el filtro «Todas» y el orden «Manual».</p>
              )}
              <TodoList
                tasks={visibleTasks}
                dragEnabled={dragEnabled}
                emptyMessage={emptyMessage}
                onToggle={toggleTask}
                onEdit={editTask}
                onDelete={removeTask}
                onReorder={handleReorder}
              />
            </>
          )}
        </section>
      </main>
    </>
  );
}
