import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TodoList } from '../../src/components/TodoList';
import { makeTask } from '../mocks/factories';

function setup(overrides: Partial<React.ComponentProps<typeof TodoList>> = {}) {
  const props = {
    tasks: [makeTask({ id: '1', title: 'Comprar pan', description: 'Integral' })],
    dragEnabled: false,
    onToggle: vi.fn().mockResolvedValue(true),
    onEdit: vi.fn().mockResolvedValue(true),
    onDelete: vi.fn().mockResolvedValue(true),
    onReorder: vi.fn(),
    ...overrides,
  };
  render(<TodoList {...props} />);
  return props;
}

describe('TodoList', () => {
  it('muestra el mensaje vacío cuando no hay tareas', () => {
    setup({ tasks: [], emptyMessage: 'Todavía no tenés tareas.' });
    expect(screen.getByText('Todavía no tenés tareas.')).toBeInTheDocument();
  });

  it('renderiza título, descripción y prioridad de cada tarea', () => {
    setup({
      tasks: [
        makeTask({ id: '1', title: 'Comprar pan', description: 'Integral', priority: 'high' }),
        makeTask({ id: '2', title: 'Llamar al médico' }),
      ],
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Comprar pan')).toBeInTheDocument();
    expect(screen.getByText('Integral')).toBeInTheDocument();
    expect(screen.getByText('Prioridad alta')).toBeInTheDocument();
    expect(screen.getByText('Llamar al médico')).toBeInTheDocument();
  });

  it('marca una tarea como completada', async () => {
    const { onToggle } = setup();

    await userEvent.click(screen.getByRole('checkbox', { name: /comprar pan/i }));

    expect(onToggle).toHaveBeenCalledWith('1', true);
  });

  it('muestra el checkbox tildado en tareas completadas', () => {
    setup({ tasks: [makeTask({ id: '1', title: 'Hecha', completed: true })] });
    expect(screen.getByRole('checkbox', { name: /hecha/i })).toBeChecked();
  });

  it('pide confirmación antes de eliminar', async () => {
    const { onDelete } = setup();

    await userEvent.click(screen.getByRole('button', { name: /^eliminar$/i }));
    expect(onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /sí, eliminar/i }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('permite cancelar la eliminación', async () => {
    const { onDelete } = setup();

    await userEvent.click(screen.getByRole('button', { name: /^eliminar$/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^eliminar$/i })).toBeInTheDocument();
  });

  it('edita una tarea desde el formulario inline', async () => {
    const { onEdit } = setup();

    await userEvent.click(screen.getByRole('button', { name: /^editar$/i }));
    const titleInput = screen.getByLabelText('Título');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Comprar leche');
    await userEvent.click(screen.getByRole('button', { name: /^guardar$/i }));

    expect(onEdit).toHaveBeenCalledWith('1', expect.objectContaining({ title: 'Comprar leche' }));
  });

  it('muestra el handle de arrastre solo cuando el reordenamiento está habilitado', () => {
    const { unmount } = render(
      <TodoList
        tasks={[makeTask({ id: '1' })]}
        dragEnabled={false}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /reordenar/i })).not.toBeInTheDocument();
    unmount();

    setup({ dragEnabled: true });
    expect(screen.getByRole('button', { name: /reordenar/i })).toBeInTheDocument();
  });
});
