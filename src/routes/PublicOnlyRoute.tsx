import { Navigate, Outlet, useLocation, type Location } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';

/** Login y registro: si ya hay sesión, redirige a las tareas. */
export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner label="Verificando sesión…" />;
  }

  if (user) {
    const from = (location.state as { from?: Location } | null)?.from?.pathname;
    return <Navigate to={from ?? '/tasks'} replace />;
  }

  return <Outlet />;
}
