import { describe, expect, it } from 'vitest';
import { hasErrors, validateAuthForm, validateTaskInput } from '../../src/utils/validators';

describe('validateTaskInput', () => {
  it('acepta un título y una descripción válidos', () => {
    const errors = validateTaskInput({ title: 'Comprar pan', description: 'Integral' });
    expect(hasErrors(errors)).toBe(false);
  });

  it('rechaza un título vacío o solo con espacios', () => {
    expect(validateTaskInput({ title: '', description: '' }).title).toMatch(/obligatorio/i);
    expect(validateTaskInput({ title: '   ', description: '' }).title).toMatch(/obligatorio/i);
  });

  it('rechaza un título demasiado largo', () => {
    const errors = validateTaskInput({ title: 'a'.repeat(101), description: '' });
    expect(errors.title).toMatch(/100/);
  });

  it('rechaza una descripción demasiado larga', () => {
    const errors = validateTaskInput({ title: 'ok', description: 'a'.repeat(501) });
    expect(errors.description).toMatch(/500/);
  });
});

describe('validateAuthForm', () => {
  it('acepta credenciales válidas en login', () => {
    const errors = validateAuthForm({ email: 'ana@example.com', password: 'x' }, 'login');
    expect(hasErrors(errors)).toBe(false);
  });

  it('rechaza emails vacíos o mal formados', () => {
    expect(validateAuthForm({ email: '', password: 'abcdef' }, 'login').email).toBeDefined();
    expect(validateAuthForm({ email: 'no-es-un-email', password: 'abcdef' }, 'login').email).toMatch(/formato/i);
  });

  it('exige contraseña', () => {
    expect(validateAuthForm({ email: 'ana@example.com', password: '' }, 'login').password).toBeDefined();
  });

  it('en registro exige un mínimo de 6 caracteres', () => {
    const errors = validateAuthForm(
      { email: 'ana@example.com', password: '12345', confirmPassword: '12345' },
      'register',
    );
    expect(errors.password).toMatch(/6/);
  });

  it('en registro verifica que las contraseñas coincidan', () => {
    const errors = validateAuthForm(
      { email: 'ana@example.com', password: 'abcdef', confirmPassword: 'abcdeg' },
      'register',
    );
    expect(errors.confirmPassword).toMatch(/no coinciden/i);
  });

  it('en login no aplica el largo mínimo', () => {
    const errors = validateAuthForm({ email: 'ana@example.com', password: '123' }, 'login');
    expect(errors.password).toBeUndefined();
  });
});
