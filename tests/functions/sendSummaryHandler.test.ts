import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSendSummaryHandler } from '../../functions/sendSummaryHandler';
import type { ApiRequest, ApiResponse, SendSummaryDeps } from '../../functions/types';

class FakeResponse implements ApiResponse {
  statusCode = 200;
  body: unknown;
  headers: Record<string, string> = {};

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(body: unknown) {
    this.body = body;
    return this;
  }

  setHeader(name: string, value: string) {
    this.headers[name] = value;
    return this;
  }
}

function makeRequest(overrides: Partial<ApiRequest> = {}): ApiRequest {
  return { method: 'POST', headers: { authorization: 'Bearer good-token' }, ...overrides };
}

function makeDeps(overrides: Partial<SendSummaryDeps> = {}): SendSummaryDeps {
  return {
    verifyToken: vi.fn().mockResolvedValue({ uid: 'u1', email: 'ana@example.com' }),
    acquireCooldown: vi.fn().mockResolvedValue(true),
    fetchTasks: vi.fn().mockResolvedValue([
      { title: 'Tarea 1', description: '', completed: false, priority: 'high', dueDate: null, order: 1 },
      { title: 'Tarea 2', description: '', completed: true, priority: 'low', dueDate: null, order: 2 },
    ]),
    sendEmail: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('send-summary handler', () => {
  it('rechaza métodos distintos de POST', async () => {
    const deps = makeDeps();
    const res = new FakeResponse();

    await createSendSummaryHandler(deps)(makeRequest({ method: 'GET' }), res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('POST');
    expect(deps.verifyToken).not.toHaveBeenCalled();
  });

  it('responde 401 si falta el token', async () => {
    const deps = makeDeps();
    const res = new FakeResponse();

    await createSendSummaryHandler(deps)(makeRequest({ headers: {} }), res);

    expect(res.statusCode).toBe(401);
    expect(deps.sendEmail).not.toHaveBeenCalled();
  });

  it('responde 401 si el token es inválido', async () => {
    const deps = makeDeps({ verifyToken: vi.fn().mockRejectedValue(new Error('invalid')) });
    const res = new FakeResponse();

    await createSendSummaryHandler(deps)(makeRequest(), res);

    expect(res.statusCode).toBe(401);
    expect(deps.fetchTasks).not.toHaveBeenCalled();
    expect(deps.sendEmail).not.toHaveBeenCalled();
  });

  it('responde 400 si la cuenta no tiene email', async () => {
    const deps = makeDeps({ verifyToken: vi.fn().mockResolvedValue({ uid: 'u1', email: null }) });
    const res = new FakeResponse();

    await createSendSummaryHandler(deps)(makeRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(deps.sendEmail).not.toHaveBeenCalled();
  });

  it('responde 429 si el usuario está en cooldown', async () => {
    const deps = makeDeps({ acquireCooldown: vi.fn().mockResolvedValue(false) });
    const res = new FakeResponse();

    await createSendSummaryHandler(deps)(makeRequest(), res);

    expect(res.statusCode).toBe(429);
    expect(deps.fetchTasks).not.toHaveBeenCalled();
    expect(deps.sendEmail).not.toHaveBeenCalled();
  });

  it('envía el resumen solo al email verificado del token', async () => {
    const deps = makeDeps();
    const res = new FakeResponse();

    await createSendSummaryHandler(deps)(makeRequest(), res);

    expect(deps.verifyToken).toHaveBeenCalledWith('good-token');
    expect(deps.fetchTasks).toHaveBeenCalledWith('u1');
    expect(deps.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ana@example.com', subject: expect.stringContaining('Resumen') }),
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, sentTo: 'ana@example.com', counts: { total: 2 } });
  });

  it('responde 502 sin filtrar detalles internos si falla SES', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const deps = makeDeps({ sendEmail: vi.fn().mockRejectedValue(new Error('SES: secret-detail')) });
    const res = new FakeResponse();

    await createSendSummaryHandler(deps)(makeRequest(), res);

    expect(res.statusCode).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('secret-detail');
  });
});
