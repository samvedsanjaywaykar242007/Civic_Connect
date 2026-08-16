import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
}) => {
  return (
    <div className="page-header">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" style={{ marginBottom: '0.4rem', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {breadcrumbs.map((b, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {idx > 0 && <span>/</span>}
                  {b.href ? (
                    <a href={b.href} style={{ color: 'var(--color-primary-600)', textDecoration: 'none' }}>
                      {b.label}
                    </a>
                  ) : (
                    <span>{b.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 className="page-header-title">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>

      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
};
