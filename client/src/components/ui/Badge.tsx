import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  className,
  ...props
}) => {
  const variants = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200/60',
    accent: 'bg-accent-50 text-accent-700 border-accent-200/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/60',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 font-medium rounded-full border',
    md: 'text-xs px-2.5 py-1 font-medium rounded-full border',
  };

  return (
    <span className={twMerge(clsx('inline-flex items-center gap-1 select-none', variants[variant], sizes[size], className))} {...props}>
      {children}
    </span>
  );
};
