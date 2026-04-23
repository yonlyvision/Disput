import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId();
    
    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn('form-input', className)}
          {...props}
        />
        {error && (
          <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: 'var(--spacing-1)', display: 'block' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
