import React from 'react';
import { ShieldCheck, Lock, ShieldAlert } from 'lucide-react';
import { UserRole } from '../../types';

interface SecurityBadgeProps {
  role?: UserRole;
  isEncrypted?: boolean;
  className?: string;
  onClick?: () => void;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  role = 'student',
  isEncrypted = true,
  className = '',
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
        role === 'admin'
          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100'
          : role === 'teacher'
          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
          : role === 'parent'
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
      } ${className}`}
      title="Zero-Trust Protected & Isolated Storage"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span className="capitalize">{role}</span>
      <span className="opacity-50">•</span>
      <span className="text-[10px] opacity-80 flex items-center gap-0.5">
        <Lock className="w-2.5 h-2.5 inline" /> Zero-Trust
      </span>
    </button>
  );
};
