import { describe, expect, it } from 'vitest';
import {
  computeOrderUpdates,
  filterTasks,
  getTaskStats,
  reorderList,
  selectVisibleTasks,
  sortTasks,
} from '../../src/features/tasks/taskSelectors';
import { formatDueDate, isOverdue, toISODate } from '../../src/utils/date';
import { makeTask } from '../mocks/factories';

describe('filterTasks', () => {
  const pending = makeTask({ id: 'p', completed: false });
  const done = makeTask({ id: 'd', completed: true });

  it('devuelve todas las tareas con el filtro "all"', () => {
    expect(filterTasks([pending, done], 'all')).toHaveLength(2);
  });

  it('devuelve solo las pendientes', () => {
    expect(filterTasks([pending, done], 'pending').map((t) => t.id)).toEqual(['p']);
  });

  it('devuelve solo las completadas', () => {
    expect(filterTasks([pending, done], 'completed').map((t) => t.id)).toEqual(['d']);
  });
});

describe('sortTasks', () => {
  it('ordena manualmente por el campo order', () => {
    const a = makeTask({ id: 'a', order: 3 });
    const b = makeTask({ id: 'b', order: 1 });
    const c = makeTask({ id: 'c', order: 2 });
    expect(sortTasks([a, b, c], 'manual').map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('ordena por prioridad (alta primero) y desempata por vencimiento', () => {
    const low = makeTask({ id: 'low', priority: 'low' });
    const highLate = makeTask({ id: 'highLate', priority: 'high', dueDate: '2026-12-20' });
    const highSoon = makeTask({ id: 'highSoon', priority: 'high', dueDate: '2026-12-01' });
    const medium = makeTask({ id: 'medium', priority: 'medium' });
    expect(sortTasks([low, highLate, medium, highSoon], 'priority').map((t) => t.id)).toEqual([
      'highSoon',
      'highLate',
      'medium',
      'low',
    ]);
  });

  it('ordena por vencimiento y deja las tareas sin fecha al final', () => {
    const none = makeTask({ id: 'none', dueDate: null });
    const late = makeTask({ id: 'late', dueDate: '2026-12-31' });
    const soon = makeTask({ id: 'soon', dueDate: '2026-11-20' });
    expect(sortTasks([none, late, soon], 'dueDate').map((t) => t.id)).toEqual(['soon', 'late', 'none']);
  });

  it('no modifica el arreglo original', () => {
    const tasks = [makeTask({ order: 2 }), makeTask({ order: 1 })];
    const snapshot = [...tasks];
    sortTasks(tasks, 'manual');
    expect(tasks).toEqual(snapshot);
  });
});

describe('selectVisibleTasks', () => {
  it('combina filtro y orden', () => {
    const a = makeTask({ id: 'a', completed: false, priority: 'low' });
    const b = makeTask({ id: 'b', completed: false, priority: 'high' });
    const c = makeTask({ id: 'c', completed: true, priority: 'high' });
    expect(selectVisibleTasks([a, b, c], 'pending', 'priority').map((t) => t.id)).toEqual(['b', 'a']);
  });
});

describe('getTaskStats', () => {
  it('cuenta totales, completadas, pendientes y vencidas', () => {
    const today = new Date(2026, 10, 17); // 17/11/2026 (hora local)
    const tasks = [
      makeTask({ completed: false, dueDate: '2026-11-10' }), // vencida
      makeTask({ completed: false, dueDate: '2026-11-17' }), // vence hoy: no está vencida
      makeTask({ completed: true, dueDate: '2026-11-01' }), // completada: no cuenta como vencida
    ];
    expect(getTaskStats(tasks, today)).toEqual({ total: 3, completed: 1, pending: 2, overdue: 1 });
  });
});

describe('reorderList / computeOrderUpdates', () => {
  const tasks = [makeTask({ id: 'a' }), makeTask({ id: 'b' }), makeTask({ id: 'c' })];

  it('mueve una tarea hacia abajo', () => {
    expect(reorderList(tasks, 'a', 'c').map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('mueve una tarea hacia arriba', () => {
    expect(reorderList(tasks, 'c', 'a').map((t) => t.id)).toEqual(['c', 'a', 'b']);
  });

  it('devuelve la misma lista si los ids no existen o son iguales', () => {
    expect(reorderList(tasks, 'a', 'a')).toBe(tasks);
    expect(reorderList(tasks, 'a', 'zzz')).toBe(tasks);
  });

  it('asigna posiciones consecutivas según el orden de la lista', () => {
    expect(computeOrderUpdates(reorderList(tasks, 'a', 'c'))).toEqual([
      { id: 'b', order: 0 },
      { id: 'c', order: 1 },
      { id: 'a', order: 2 },
    ]);
  });
});

describe('utils/date', () => {
  it('formatea la fecha local como YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('detecta fechas vencidas respecto de hoy', () => {
    const today = new Date(2026, 10, 17);
    expect(isOverdue('2026-11-16', today)).toBe(true);
    expect(isOverdue('2026-11-17', today)).toBe(false);
    expect(isOverdue(null, today)).toBe(false);
  });

  it('formatea la fecha de vencimiento como DD/MM/YYYY', () => {
    expect(formatDueDate('2026-11-05')).toBe('05/11/2026');
  });
});
