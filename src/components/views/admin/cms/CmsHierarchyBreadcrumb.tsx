import React from 'react';
import { ChevronRight, Home, RefreshCw } from 'lucide-react';
import { HierarchyLevel } from '../../../../types';

interface BreadcrumbItem {
  level: HierarchyLevel;
  id: string;
  name: string;
}

interface CmsHierarchyBreadcrumbProps {
  items: BreadcrumbItem[];
  currentLevel: HierarchyLevel;
  onSelectLevel: (level: HierarchyLevel, id?: string) => void;
  onReset: () => void;
}

export const CmsHierarchyBreadcrumb: React.FC<CmsHierarchyBreadcrumbProps> = ({
  items,
  currentLevel,
  onSelectLevel,
  onReset,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 font-semibold transition-colors shadow-2xs"
        title="Reset to Top Hierarchy"
      >
        <Home className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Hierarchy Root</span>
      </button>

      {items.map((item, idx) => (
        <React.Fragment key={`${item.level}-${item.id}-${idx}`}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <button
            type="button"
            onClick={() => onSelectLevel(item.level, item.id)}
            className={`px-2.5 py-1 rounded-xl font-medium transition-colors max-w-[160px] truncate ${
              idx === items.length - 1 && item.level === currentLevel
                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
            }`}
            title={`${item.level.toUpperCase()}: ${item.name}`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 mr-1">
              {item.level.slice(0, 3)}:
            </span>
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
