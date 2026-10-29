import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    className={twMerge(
      clsx(
        'bg-white rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-shadow duration-200',
        className
      )
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={twMerge(clsx('p-5 pb-3', className))} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={twMerge(clsx('font-semibold text-slate-900 text-lg tracking-tight', className))} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={twMerge(clsx('text-sm text-slate-500 mt-1', className))} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={twMerge(clsx('p-5 pt-0', className))} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={twMerge(clsx('p-5 pt-3 border-t border-slate-100 flex items-center justify-between', className))} {...props}>
    {children}
  </div>
);
