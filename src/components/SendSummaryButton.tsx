import { useSendSummary } from '../hooks/useSendSummary';
import { Alert } from './ui/Alert';

export function SendSummaryButton() {
  const { status, message, send, reset } = useSendSummary();

  return (
    <div className="send-summary">
      <button type="button" className="secondary" onClick={() => void send()} disabled={status === 'sending'}>
        {status === 'sending' ? 'Enviando…' : 'Enviar resumen por email'}
      </button>
      {message && (
        <Alert variant={status === 'success' ? 'success' : 'error'} onDismiss={reset}>
          {message}
        </Alert>
      )}
    </div>
  );
}
