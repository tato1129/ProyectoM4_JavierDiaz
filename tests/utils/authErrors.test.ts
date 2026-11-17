import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from '../../src/utils/authErrors';

describe('getAuthErrorMessage', () => {
  it('traduce credenciales inválidas sin revelar si el email existe', () => {
    const expected = getAuthErrorMessage({ code: 'auth/invalid-credential' });
    expect(expected).toMatch(/incorrectos/i);
    expect(getAuthErrorMessage({ code: 'auth/wrong-password' })).toBe(expected);
    expect(getAuthErrorMessage({ code: 'auth/user-not-found' })).toBe(expected);
  });

  it('traduce el email ya registrado', () => {
    expect(getAuthErrorMessage({ code: 'auth/email-already-in-use' })).toMatch(/ya existe/i);
  });

  it('traduce el cierre del popup de Google', () => {
    expect(getAuthErrorMessage({ code: 'auth/popup-closed-by-user' })).toMatch(/google/i);
  });

  it('usa un mensaje genérico para códigos desconocidos', () => {
    expect(getAuthErrorMessage({ code: 'auth/algo-raro' })).toMatch(/inesperado/i);
  });

  it('usa un mensaje genérico si el error no tiene código', () => {
    expect(getAuthErrorMessage(new Error('boom'))).toMatch(/inesperado/i);
    expect(getAuthErrorMessage(null)).toMatch(/inesperado/i);
    expect(getAuthErrorMessage('texto')).toMatch(/inesperado/i);
  });
});
