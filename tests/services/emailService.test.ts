import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailServiceError, sendSummaryEmail } from '../../src/services/emailService';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendSummaryEmail', () => {
  it('envía el ID token en Authorization y devuelve la respuesta del servidor', async () => {
    const payload = { ok: true, sentTo: 'ana@example.com', counts: { total: 2, completed: 1, pending: 1, overdue: 0 } };
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => payload });

    const result = await sendSummaryEmail('token-123');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/send-summary',
      expect.objectContaining({ method: 'POST', headers: { Authorization: 'Bearer token-123' } }),
    );
    expect(result).toEqual(payload);
  });

  it('lanza EmailServiceError con el mensaje y el status del servidor', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: 'Esperá un minuto' }) });

    await expect(sendSummaryEmail('t')).rejects.toMatchObject({ message: 'Esperá un minuto', status: 429 });
  });

  it('usa un mensaje genérico si el servidor no devuelve JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('no json');
      },
    });

    await expect(sendSummaryEmail('t')).rejects.toMatchObject({ message: 'No se pudo enviar el email.', status: 500 });
  });

  it('lanza EmailServiceError si falla la red', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(sendSummaryEmail('t')).rejects.toBeInstanceOf(EmailServiceError);
  });
});
