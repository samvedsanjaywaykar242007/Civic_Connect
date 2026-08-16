import React from 'react';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading civic data...',
  size = 'md',
}) => {
  const spinnerSizeClass = size === 'sm' ? 'spinner-sm' : '';

  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className={`spinner ${spinnerSizeClass}`} aria-hidden="true" />
      <p className="text-muted" style={{ marginTop: '1rem' }}>
        {message}
      </p>
    </div>
  );
};

export const SkeletonBox: React.FC<{
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}> = ({ width = '100%', height = '1.25rem', borderRadius = 'var(--radius-sm)', className = '' }) => {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
};
