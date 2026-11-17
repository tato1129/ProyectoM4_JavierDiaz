import type { TaskInput } from '../types';

export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;
export const PASSWORD_MIN = 6;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type TaskFormErrors = Partial<Record<'title' | 'description', string>>;
export type AuthFormErrors = Partial<Record<'email' | 'password' | 'confirmPassword', string>>;

export const hasErrors = (errors: object): boolean => Object.keys(errors).length > 0;

export function validateTaskInput(input: Pick<TaskInput, 'title' | 'description'>): TaskFormErrors {
  const errors: TaskFormErrors = {};
  const title = input.title.trim();

  if (!title) {
    errors.title = 'El título es obligatorio.';
  } else if (title.length > TITLE_MAX) {
    errors.title = `El título no puede superar los ${TITLE_MAX} caracteres.`;
  }

  if (input.description.trim().length > DESCRIPTION_MAX) {
    errors.description = `La descripción no puede superar los ${DESCRIPTION_MAX} caracteres.`;
  }

  return errors;
}

interface AuthFormValues {
  email: string;
  password: string;
  confirmPassword?: string;
}

export function validateAuthForm(values: AuthFormValues, mode: 'login' | 'register'): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = 'Ingresá tu email.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'El email no tiene un formato válido.';
  }

  if (!values.password) {
    errors.password = 'Ingresá tu contraseña.';
  } else if (mode === 'register' && values.password.length < PASSWORD_MIN) {
    errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  }

  if (mode === 'register' && values.password !== (values.confirmPassword ?? '')) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}
