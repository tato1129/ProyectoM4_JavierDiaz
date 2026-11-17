import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { TaskRecord, VerifiedUser } from '../types';

const COOLDOWN_COLLECTION = 'mailRateLimit';
const DEFAULT_COOLDOWN_MS = 60_000;

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // En variables de entorno la clave suele guardarse con "\n" escapados.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Faltan variables de entorno de Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).',
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

/** Valida el ID token de Firebase enviado por el cliente. Lanza si es inválido o expiró. */
export async function verifyIdToken(token: string): Promise<VerifiedUser> {
  const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email ?? null };
}

/** Lee las tareas del usuario desde Firestore con el Admin SDK (el cliente no puede falsificarlas). */
export async function fetchUserTasks(uid: string): Promise<TaskRecord[]> {
  const snapshot = await getFirestore(getAdminApp()).collection('tasks').where('userId', '==', uid).get();

  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      title: String(data.title ?? ''),
      description: String(data.description ?? ''),
      completed: Boolean(data.completed),
      priority: data.priority === 'high' || data.priority === 'low' ? data.priority : 'medium',
      dueDate: typeof data.dueDate === 'string' ? data.dueDate : null,
      order: typeof data.order === 'number' ? data.order : 0,
    };
  });
}

/**
 * Limita el envío a un email por usuario cada `windowMs`. Usa una transacción en Firestore
 * porque las funciones serverless no comparten memoria entre invocaciones.
 */
export async function acquireCooldown(uid: string, windowMs: number = DEFAULT_COOLDOWN_MS): Promise<boolean> {
  const db = getFirestore(getAdminApp());
  const reference = db.collection(COOLDOWN_COLLECTION).doc(uid);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    const lastSentAt = snapshot.exists ? snapshot.get('lastSentAt') : 0;
    const now = Date.now();

    if (typeof lastSentAt === 'number' && now - lastSentAt < windowMs) {
      return false;
    }

    transaction.set(reference, { lastSentAt: now });
    return true;
  });
}
