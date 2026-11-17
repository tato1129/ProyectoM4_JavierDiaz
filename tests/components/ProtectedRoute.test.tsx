import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../src/hooks/useAuth';
import { ProtectedRoute } from '../../src/routes/ProtectedRoute';

// Se mockea el hook de autenticación: no se usa Firebase en estos tests.
vi.mock('../../src/hooks/useAuth', () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

function mockAuth(state: { user: { uid: string } | null; loading: boolean }) {
  mockedUseAuth.mockReturnValue(state as unknown as ReturnType<typeof useAuth>);
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Pantalla de login</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/tasks" element={<div>Contenido privado</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('redirige a /login si no hay sesión y no muestra contenido privado', () => {
    mockAuth({ user: null, loading: false });
    renderAt('/tasks');

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
  });

  it('muestra el contenido privado si el usuario está autenticado', () => {
    mockAuth({ user: { uid: 'u1' }, loading: false });
    renderAt('/tasks');

    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });

  it('muestra un indicador de carga mientras se restaura la sesión', () => {
    mockAuth({ user: null, loading: true });
    renderAt('/tasks');

    expect(screen.getByRole('status')).toHaveTextContent(/verificando sesión/i);
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument();
  });
});
