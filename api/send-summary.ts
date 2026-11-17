import { acquireCooldown, fetchUserTasks, verifyIdToken } from '../functions/lib/firebaseAdmin';
import { createSesSender } from '../functions/lib/ses';
import { createSendSummaryHandler } from '../functions/sendSummaryHandler';

// Punto de entrada de la Vercel Function (Vercel solo expone lo que está en /api).
// La lógica vive en /functions para poder testearla sin depender de Vercel.
export default createSendSummaryHandler({
  verifyToken: verifyIdToken,
  acquireCooldown,
  fetchTasks: fetchUserTasks,
  sendEmail: createSesSender(),
});
