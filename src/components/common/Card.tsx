import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glass?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  glass = false,
  className = '',
  ...props
}) => {
  const interactiveClass = interactive ? 'card-interactive' : '';
  const glassClass = glass ? 'card-glass' : '';

  return (
    <div
      className={`card ${interactiveClass} ${glassClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`card-header ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`card-body ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`card-footer ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};
