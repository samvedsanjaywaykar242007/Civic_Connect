import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Input: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  required,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          <span>
            {label}
            {required && <span className="form-label-required">*</span>}
          </span>
        </label>
      )}
      <input
        id={inputId}
        className={`form-input ${error ? 'border-danger' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${inputId}-helper`} className="form-helper">
          {helperText}
        </span>
      )}
    </div>
  );
};

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  required,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          <span>
            {label}
            {required && <span className="form-label-required">*</span>}
          </span>
        </label>
      )}
      <textarea
        id={inputId}
        className={`form-textarea ${error ? 'border-danger' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${inputId}-helper`} className="form-helper">
          {helperText}
        </span>
      )}
    </div>
  );
};

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  required,
  options,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          <span>
            {label}
            {required && <span className="form-label-required">*</span>}
          </span>
        </label>
      )}
      <select
        id={inputId}
        className={`form-select ${error ? 'border-danger' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={`${inputId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${inputId}-helper`} className="form-helper">
          {helperText}
        </span>
      )}
    </div>
  );
};
