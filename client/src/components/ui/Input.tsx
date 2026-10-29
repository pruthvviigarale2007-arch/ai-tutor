import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
              error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
