import { useCallback, useState } from 'react';
import { sendSummaryEmail } from '../services/emailService';
import { useAuth } from './useAuth';

export type SendStatus = 'idle' | 'sending' | 'success' | 'error';

export function useSendSummary() {
  const { getIdToken } = useAuth();
  const [status, setStatus] = useState<SendStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const send = useCallback(async () => {
    setStatus('sending');
    setMessage(null);
    try {
      const token = await getIdToken();
      const result = await sendSummaryEmail(token);
      setStatus('success');
      setMessage(`Te enviamos el resumen a ${result.sentTo}.`);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar el email.');
    }
  }, [getIdToken]);

  const reset = useCallback(() => {
    setStatus('idle');
    setMessage(null);
  }, []);

  return { status, message, send, reset };
}
