import { useId, useState, type FormEvent } from 'react';
import type { Priority, TaskInput } from '../types';
import { PRIORITY_LABELS, PRIORITY_OPTIONS } from '../utils/priority';
import { hasErrors, validateTaskInput, type TaskFormErrors } from '../utils/validators';

interface TodoFormProps {
  /** Debe resolver `true` si se guardó bien; el formulario se limpia solo al crear. */
  onSubmit: (input: TaskInput) => Promise<boolean>;
  /** Si se pasa, el formulario funciona en modo edición. */
  initialValues?: TaskInput;
  submitLabel?: string;
  onCancel?: () => void;
}

const EMPTY_VALUES: TaskInput = { title: '', description: '', priority: 'medium', dueDate: null };

export function TodoForm({ onSubmit, initialValues, submitLabel = 'Agregar tarea', onCancel }: TodoFormProps) {
  const baseId = useId();
  const isEditing = initialValues !== undefined;

  const [values, setValues] = useState<TaskInput>(initialValues ?? EMPTY_VALUES);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanValues: TaskInput = {
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
    };

    const validation = validateTaskInput(cleanValues);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setSubmitting(true);
    const saved = await onSubmit(cleanValues);
    setSubmitting(false);

    if (saved && !isEditing) setValues(EMPTY_VALUES);
  }

  return (
    <form
      className="todo-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label={isEditing ? 'Editar tarea' : 'Nueva tarea'}
    >
      <div className="field">
        <label htmlFor={`${baseId}-title`}>Título</label>
        <input
          id={`${baseId}-title`}
          type="text"
          value={values.title}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${baseId}-title-error` : undefined}
        />
        {errors.title && (
          <p id={`${baseId}-title-error`} className="field-error" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`${baseId}-description`}>Descripción</label>
        <textarea
          id={`${baseId}-description`}
          rows={3}
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? `${baseId}-description-error` : undefined}
        />
        {errors.description && (
          <p id={`${baseId}-description-error`} className="field-error" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      <div className="todo-form__row">
        <div className="field">
          <label htmlFor={`${baseId}-priority`}>Prioridad</label>
          <select
            id={`${baseId}-priority`}
            value={values.priority}
            onChange={(event) => setValues({ ...values, priority: event.target.value as Priority })}
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${baseId}-due`}>Fecha de vencimiento</label>
          <input
            id={`${baseId}-due`}
            type="date"
            value={values.dueDate ?? ''}
            onChange={(event) => setValues({ ...values, dueDate: event.target.value || null })}
          />
        </div>
      </div>

      <div className="todo-form__actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Guardando…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
