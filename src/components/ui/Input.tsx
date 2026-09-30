import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, leftIcon, rightIcon, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>}
        <div className="relative">
          {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{leftIcon}</span>}
          <input
            ref={ref} id={inputId}
            className={cn('input-field', leftIcon && 'pl-10', rightIcon && 'pr-10', error && 'border-red-400 focus:ring-red-300', className)}
            {...rest}
          />
          {rightIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">{rightIcon}</span>}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);