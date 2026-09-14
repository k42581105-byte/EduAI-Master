import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 text-slate-800 shadow-2xs transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-100 ${
        hoverable || onClick
          ? 'cursor-pointer hover:border-indigo-400/80 hover:shadow-md active:scale-[0.99] dark:hover:border-indigo-500/80'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
