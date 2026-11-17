import { useId } from 'react';
import type { TaskFilter, TaskSort } from '../types';

interface TaskFiltersProps {
  filter: TaskFilter;
  sort: TaskSort;
  onFilterChange: (filter: TaskFilter) => void;
  onSortChange: (sort: TaskSort) => void;
}

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
];

const SORTS: { value: TaskSort; label: string }[] = [
  { value: 'manual', label: 'Manual (arrastrar)' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'dueDate', label: 'Vencimiento' },
];

export function TaskFilters({ filter, sort, onFilterChange, onSortChange }: TaskFiltersProps) {
  const sortId = useId();

  return (
    <div className="filters">
      <div className="filters__group" role="group" aria-label="Filtrar tareas">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={filter === value ? 'chip chip--active' : 'chip'}
            aria-pressed={filter === value}
            onClick={() => onFilterChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="field field--inline">
        <label htmlFor={sortId}>Ordenar por</label>
        <select id={sortId} value={sort} onChange={(event) => onSortChange(event.target.value as TaskSort)}>
          {SORTS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
