import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no active items or complaints to display at this moment.',
  icon,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="state-icon-wrapper state-icon-empty">
        {icon || <Inbox size={28} />}
      </div>
      <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ maxWidth: '420px', marginBottom: actionText ? '1.5rem' : '0' }}>
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
