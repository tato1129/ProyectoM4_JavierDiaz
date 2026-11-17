import { useAuth } from '../hooks/useAuth';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <h1>Mis tareas</h1>
      <div className="navbar__user">
        <span>{user?.email ?? user?.displayName}</span>
        <button type="button" className="secondary" onClick={() => void logout()}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
