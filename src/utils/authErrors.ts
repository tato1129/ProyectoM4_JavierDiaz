const INVALID_CREDENTIALS = 'Email o contraseña incorrectos.';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'El email no tiene un formato válido.',
  'auth/missing-password': 'Ingresá tu contraseña.',
  'auth/user-not-found': INVALID_CREDENTIALS,
  'auth/wrong-password': INVALID_CREDENTIALS,
  'auth/invalid-credential': INVALID_CREDENTIALS,
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/weak-password': 'La contraseña es demasiado débil (mínimo 6 caracteres).',
  'auth/user-disabled': 'Esta cuenta fue deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Esperá unos minutos e intentá de nuevo.',
  'auth/network-request-failed': 'No hay conexión con el servidor. Revisá tu internet.',
  'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de completar el ingreso.',
  'auth/cancelled-popup-request': 'Cerraste la ventana de Google antes de completar el ingreso.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Habilitá los pop-ups e intentá de nuevo.',
  'auth/account-exists-with-different-credential':
    'Ya existe una cuenta con ese email usando otro método de ingreso.',
  'auth/operation-not-allowed': 'Este método de ingreso no está habilitado.',
};

const FALLBACK_MESSAGE = 'Ocurrió un error inesperado. Intentá de nuevo.';

function extractCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/** Traduce un error de Firebase Auth a un mensaje claro para el usuario. */
export function getAuthErrorMessage(error: unknown): string {
  const code = extractCode(error);
  return (code && AUTH_ERROR_MESSAGES[code]) || FALLBACK_MESSAGE;
}
