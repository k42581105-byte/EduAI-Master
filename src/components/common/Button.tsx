import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'amber' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  loading = false,
  isLoading = false,
  ...props
}) => {
  const isButtonLoading = Boolean(loading || isLoading);
  const baseStyle =
    'inline-flex items-center justify-center font-semibold rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none cursor-pointer';

  const sizeStyles = {
    sm: 'min-h-[40px] px-3.5 py-1.5 text-xs gap-1.5 shadow-2xs',
    md: 'min-h-[44px] px-4 py-2.5 text-xs sm:text-sm gap-2 shadow-2xs',
    lg: 'min-h-[48px] px-6 py-3 text-sm sm:text-base gap-2.5 shadow-xs',
  };

  const variantStyles = {
    primary:
      'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700 dark:bg-indigo-600 dark:border-indigo-500 dark:hover:bg-indigo-500 shadow-indigo-500/20 shadow-xs active:bg-indigo-800',
    secondary:
      'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600',
    outline:
      'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600 active:bg-slate-100 dark:active:bg-slate-800',
    danger:
      'border-rose-500 bg-rose-500 text-white hover:bg-rose-600 hover:border-rose-600 dark:border-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 shadow-rose-500/20 shadow-xs active:bg-rose-700',
    ghost:
      'border-transparent bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700',
    amber:
      'border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:border-amber-600 dark:border-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-amber-500/20 shadow-xs active:bg-amber-700',
    emerald:
      'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-emerald-500/20 shadow-xs active:bg-emerald-800',
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || isButtonLoading}
      {...props}
    >
      {isButtonLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
};
