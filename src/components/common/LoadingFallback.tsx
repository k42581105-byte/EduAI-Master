import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingFallbackProps {
  label?: string;
  variant?: 'full' | 'card' | 'inline';
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  label = 'Loading module...',
  variant = 'full',
}) => {
  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center p-4 space-x-2 text-xs text-slate-400">
        <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <span>{label}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-4/5" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center shadow-sm">
          <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
          {label}
        </p>
        <p className="text-[11px] text-slate-400">
          Optimized for low-latency offline-first execution
        </p>
      </div>

      {/* Shimmer skeleton lines */}
      <div className="w-full max-w-md space-y-2.5 pt-2 animate-pulse">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-5/6 mx-auto" />
        <div className="h-2.5 bg-slate-100 dark:bg-slate-850 rounded-full w-2/3 mx-auto" />
      </div>
    </div>
  );
};
