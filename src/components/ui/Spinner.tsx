interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Cargando…' }: SpinnerProps) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner__dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
