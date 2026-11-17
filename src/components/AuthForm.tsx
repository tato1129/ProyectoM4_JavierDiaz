import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasErrors, validateAuthForm, type AuthFormErrors } from '../utils/validators';
import { Alert } from './ui/Alert';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const { login, register, loginWithGoogle, error, clearError } = useAuth();
  const baseId = useId();
  const isRegister = mode === 'register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Al entrar a la pantalla se descartan errores de la pantalla anterior.
  useEffect(() => {
    clearError();
  }, [clearError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    const validation = validateAuthForm({ email, password, confirmPassword }, mode);
    setFieldErrors(validation);
    if (hasErrors(validation)) return;

    setSubmitting(true);
    const credentials = { email: email.trim(), password };
    await (isRegister ? register(credentials) : login(credentials));
    setSubmitting(false);
  }

  async function handleGoogle() {
    clearError();
    setSubmitting(true);
    await loginWithGoogle();
    setSubmitting(false);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <div className="field">
        <label htmlFor={`${baseId}-email`}>Email</label>
        <input
          id={`${baseId}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? `${baseId}-email-error` : undefined}
        />
        {fieldErrors.email && (
          <p id={`${baseId}-email-error`} className="field-error" role="alert">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`${baseId}-password`}>Contraseña</label>
        <input
          id={`${baseId}-password`}
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={fieldErrors.password ? `${baseId}-password-error` : undefined}
        />
        {fieldErrors.password && (
          <p id={`${baseId}-password-error`} className="field-error" role="alert">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {isRegister && (
        <div className="field">
          <label htmlFor={`${baseId}-confirm`}>Repetir contraseña</label>
          <input
            id={`${baseId}-confirm`}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={fieldErrors.confirmPassword ? true : undefined}
            aria-describedby={fieldErrors.confirmPassword ? `${baseId}-confirm-error` : undefined}
          />
          {fieldErrors.confirmPassword && (
            <p id={`${baseId}-confirm-error`} className="field-error" role="alert">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Procesando…' : isRegister ? 'Crear cuenta' : 'Ingresar'}
      </button>

      <div className="auth-form__divider" aria-hidden="true">
        <span>o</span>
      </div>

      <button type="button" className="secondary" onClick={handleGoogle} disabled={submitting}>
        Continuar con Google
      </button>

      <p className="auth-form__switch">
        {isRegister ? (
          <>
            ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
          </>
        ) : (
          <>
            ¿No tenés cuenta? <Link to="/register">Registrate</Link>
          </>
        )}
      </p>
    </form>
  );
}
