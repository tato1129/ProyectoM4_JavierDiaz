import { buildSummary } from './lib/summary';
import type { ApiRequest, ApiResponse, SendSummaryDeps } from './types';

function extractBearerToken(header: string | string[] | undefined): string | null {
  if (typeof header !== 'string') return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

/**
 * POST /api/send-summary
 *
 * 1. Verifica el ID token de Firebase (Authorization: Bearer <token>).
 * 2. Aplica un cooldown por usuario.
 * 3. Lee las tareas del usuario desde Firestore (servidor, no desde el body).
 * 4. Envía el resumen por AWS SES al email del token: el destinatario nunca lo elige el cliente.
 */
export function createSendSummaryHandler(deps: SendSummaryDeps) {
  return async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.status(405).json({ error: 'Método no permitido.' });
      return;
    }

    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ error: 'Falta el token de autenticación.' });
      return;
    }

    let user;
    try {
      user = await deps.verifyToken(token);
    } catch {
      res.status(401).json({ error: 'Sesión inválida o expirada. Iniciá sesión de nuevo.' });
      return;
    }

    if (!user.email) {
      res.status(400).json({ error: 'Tu cuenta no tiene un email asociado.' });
      return;
    }

    try {
      const allowed = await deps.acquireCooldown(user.uid);
      if (!allowed) {
        res.status(429).json({ error: 'Ya enviaste un resumen hace instantes. Esperá un minuto e intentá de nuevo.' });
        return;
      }

      const tasks = await deps.fetchTasks(user.uid);
      const summary = buildSummary(tasks);

      await deps.sendEmail({
        to: user.email,
        subject: summary.subject,
        text: summary.text,
        html: summary.html,
      });

      res.status(200).json({ ok: true, sentTo: user.email, counts: summary.counts });
    } catch (error) {
      // Se loguea solo el tipo y el mensaje del error: nunca credenciales ni contenido de tareas.
      console.error('send-summary failed:', error instanceof Error ? `${error.name}: ${error.message}` : 'unknown');
      res.status(502).json({ error: 'No se pudo enviar el email. Intentá de nuevo más tarde.' });
    }
  };
}
