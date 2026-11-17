import { onSnapshot, where } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTask, reorderTasks, subscribeToTasks, updateTask } from '../../src/services/taskService';

const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  batchUpdate: vi.fn(),
  batchCommit: vi.fn(),
}));

// Se mockea Firestore y la inicialización de Firebase: los tests no tocan la nube.
vi.mock('../../src/services/firebase', () => ({ db: { name: 'fake-db' } }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ kind: 'collection', name })),
  doc: vi.fn((_db: unknown, name: string, id: string) => ({ kind: 'doc', name, id })),
  query: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
  onSnapshot: vi.fn(),
  addDoc: mocks.addDoc,
  updateDoc: mocks.updateDoc,
  deleteDoc: mocks.deleteDoc,
  writeBatch: vi.fn(() => ({ update: mocks.batchUpdate, commit: mocks.batchCommit })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createTask', () => {
  it('asocia la tarea al usuario, la inicializa como pendiente y limpia los textos', async () => {
    mocks.addDoc.mockResolvedValue({ id: 'new-id' });

    const id = await createTask('user-1', {
      title: '  Comprar pan ',
      description: ' integral ',
      priority: 'high',
      dueDate: null,
    });

    expect(id).toBe('new-id');
    expect(mocks.addDoc).toHaveBeenCalledWith(
      { kind: 'collection', name: 'tasks' },
      expect.objectContaining({
        userId: 'user-1',
        title: 'Comprar pan',
        description: 'integral',
        completed: false,
        priority: 'high',
        dueDate: null,
      }),
    );
  });
});

describe('subscribeToTasks', () => {
  it('consulta únicamente las tareas del usuario (filtro por userId)', () => {
    vi.mocked(onSnapshot).mockReturnValue(vi.fn());

    subscribeToTasks('user-1', vi.fn(), vi.fn());

    expect(where).toHaveBeenCalledWith('userId', '==', 'user-1');
  });

  it('transforma los documentos de Firestore en tareas', () => {
    const onData = vi.fn();
    vi.mocked(onSnapshot).mockImplementation(((_query: unknown, next: (snapshot: unknown) => void) => {
      next({
        docs: [
          {
            id: 't1',
            data: () => ({
              userId: 'user-1',
              title: 'A',
              completed: true,
              priority: 'low',
              dueDate: '2026-12-01',
              order: 2,
              createdAt: 1,
              updatedAt: 2,
            }),
          },
        ],
      });
      return vi.fn();
    }) as never);

    subscribeToTasks('user-1', onData, vi.fn());

    expect(onData).toHaveBeenCalledWith([
      expect.objectContaining({ id: 't1', title: 'A', completed: true, priority: 'low', dueDate: '2026-12-01' }),
    ]);
  });
});

describe('updateTask', () => {
  it('descarta campos undefined y actualiza updatedAt', async () => {
    mocks.updateDoc.mockResolvedValue(undefined);

    await updateTask('t1', { title: '  Nuevo ', description: undefined, completed: true });

    expect(mocks.updateDoc).toHaveBeenCalledTimes(1);
    const [reference, payload] = mocks.updateDoc.mock.calls[0];
    expect(reference).toEqual({ kind: 'doc', name: 'tasks', id: 't1' });
    expect(payload).toMatchObject({ title: 'Nuevo', completed: true, updatedAt: expect.any(Number) });
    expect(payload).not.toHaveProperty('description');
  });
});

describe('reorderTasks', () => {
  it('persiste el nuevo orden en un único batch', async () => {
    mocks.batchCommit.mockResolvedValue(undefined);

    await reorderTasks([
      { id: 'a', order: 0 },
      { id: 'b', order: 1 },
    ]);

    expect(mocks.batchUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.batchUpdate).toHaveBeenCalledWith(
      { kind: 'doc', name: 'tasks', id: 'a' },
      expect.objectContaining({ order: 0 }),
    );
    expect(mocks.batchCommit).toHaveBeenCalledTimes(1);
  });
});
