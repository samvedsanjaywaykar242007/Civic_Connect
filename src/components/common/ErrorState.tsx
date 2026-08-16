import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this civic service. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`error-state ${className}`.trim()} role="alert">
      <div className="state-icon-wrapper state-icon-error">
        <AlertTriangle size={28} />
      </div>
      <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem', color: 'var(--color-danger-700)' }}>
        {title}
      </h3>
      <p style={{ maxWidth: '420px', marginBottom: onRetry ? '1.5rem' : '0' }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
