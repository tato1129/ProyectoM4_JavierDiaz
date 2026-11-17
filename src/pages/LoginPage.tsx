import { AuthForm } from '../components/AuthForm';

export function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Ingresar</h1>
        <p className="auth-card__subtitle">Accedé a tus tareas.</p>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
