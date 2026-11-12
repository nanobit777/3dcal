import type { ReactNode } from 'react';

type AlertVariant = 'success' | 'danger' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  onClose?: () => void;
}

export function Alert({ variant = 'info', children, onClose }: AlertProps) {
  return (
    <div className={`alert alert-${variant}${onClose ? ' alert-dismissible' : ''}`} role="alert">
      {children}
      {onClose ? (
        <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
      ) : null}
    </div>
  );
}
