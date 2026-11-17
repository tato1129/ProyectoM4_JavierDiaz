import type { SendSummaryResponse } from '../types';

export class EmailServiceError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'EmailServiceError';
    this.status = status;
  }
}

/**
 * Pide al backend (Vercel Function) que envíe el resumen de tareas por email.
 * Solo viaja el ID token de Firebase: el backend decide destinatario y contenido.
 */
export async function sendSummaryEmail(idToken: string): Promise<SendSummaryResponse> {
  let response: Response;
  try {
    response = await fetch('/api/send-summary', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });
  } catch {
    throw new EmailServiceError('No se pudo conectar con el servidor. Revisá tu conexión.', 0);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = typeof body?.error === 'string' ? body.error : 'No se pudo enviar el email.';
    throw new EmailServiceError(message, response.status);
  }

  return body as SendSummaryResponse;
}
