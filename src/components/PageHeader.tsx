import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div>
        <h1 className="h3 mb-1">{title}</h1>
        {subtitle ? <p className="page-subtitle mb-0">{subtitle}</p> : null}
      </div>
      {actions ? <div className="d-flex gap-2">{actions}</div> : null}
    </div>
  );
}
