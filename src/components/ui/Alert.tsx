import type { ReactNode } from 'react';

interface AlertProps {
  variant?: 'error' | 'success' | 'info';
  children: ReactNode;
  onDismiss?: () => void;
}

export function Alert({ variant = 'info', children, onDismiss }: AlertProps) {
  return (
    <div className={`alert alert--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onDismiss && (
        <button type="button" className="alert__close" onClick={onDismiss} aria-label="Cerrar aviso">
          ×
        </button>
      )}
    </div>
  );
}
