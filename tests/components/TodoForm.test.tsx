import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TodoForm } from '../../src/components/TodoForm';

describe('TodoForm', () => {
  it('muestra un error y no envía si el título está vacío', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<TodoForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /agregar tarea/i }));

    expect(await screen.findByText(/el título es obligatorio/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía los valores normalizados y limpia el formulario al guardar', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<TodoForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Título'), '  Comprar pan  ');
    await userEvent.type(screen.getByLabelText('Descripción'), 'Integral');
    await userEvent.selectOptions(screen.getByLabelText('Prioridad'), 'high');
    fireEvent.change(screen.getByLabelText('Fecha de vencimiento'), { target: { value: '2026-12-01' } });
    await userEvent.click(screen.getByRole('button', { name: /agregar tarea/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Comprar pan',
      description: 'Integral',
      priority: 'high',
      dueDate: '2026-12-01',
    });
    await waitFor(() => expect(screen.getByLabelText('Título')).toHaveValue(''));
  });

  it('usa prioridad media y sin fecha por defecto', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<TodoForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Título'), 'Algo');
    await userEvent.click(screen.getByRole('button', { name: /agregar tarea/i }));

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Algo', description: '', priority: 'medium', dueDate: null });
  });

  it('conserva lo escrito si el guardado falla', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<TodoForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Título'), 'Mi tarea');
    await userEvent.click(screen.getByRole('button', { name: /agregar tarea/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.getByLabelText('Título')).toHaveValue('Mi tarea');
  });

  it('en modo edición precarga los valores y permite cancelar', async () => {
    const onCancel = vi.fn();
    render(
      <TodoForm
        initialValues={{ title: 'Original', description: 'Detalle', priority: 'low', dueDate: null }}
        submitLabel="Guardar"
        onSubmit={vi.fn().mockResolvedValue(true)}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByLabelText('Título')).toHaveValue('Original');
    expect(screen.getByLabelText('Descripción')).toHaveValue('Detalle');
    expect(screen.getByLabelText('Prioridad')).toHaveValue('low');

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
