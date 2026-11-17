import { AuthForm } from '../components/AuthForm';

export function RegisterPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Crear cuenta</h1>
        <p className="auth-card__subtitle">Registrate para guardar tus tareas en la nube.</p>
        <AuthForm mode="register" />
      </div>
    </main>
  );
}
