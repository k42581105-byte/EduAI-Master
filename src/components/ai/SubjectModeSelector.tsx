import React from 'react';
import { Sparkles, Calculator, Atom, BookOpen, Compass, Languages, Globe } from 'lucide-react';
import { SubjectTeacherMode } from '../../types';

interface SubjectModeSelectorProps {
  currentMode: SubjectTeacherMode;
  onSelectMode: (mode: SubjectTeacherMode) => void;
}

export const SUBJECT_MODES_CONFIG: Record<
  SubjectTeacherMode,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
    badgeColor: string;
    activeBorder: string;
  }
> = {
  general: {
    label: 'General Tutor',
    description: 'Friendly, patient AI Tutor for all academic queries',
    icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    activeBorder: 'border-indigo-500 ring-2 ring-indigo-500/20',
  },
  maths: {
    label: 'Maths Teacher',
    description: 'Given, Formula, Step-by-Step, and Final Answer',
    icon: <Calculator className="h-4 w-4 text-emerald-500" />,
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
  },
  science: {
    label: 'Science Teacher',
    description: 'Core Concept, Mechanism, Examples, and Exam Tips',
    icon: <Atom className="h-4 w-4 text-purple-500" />,
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    activeBorder: 'border-purple-500 ring-2 ring-purple-500/20',
  },
  english: {
    label: 'English Teacher',
    description: 'Grammar rules, Literature analysis & Writing templates',
    icon: <BookOpen className="h-4 w-4 text-blue-500" />,
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    activeBorder: 'border-blue-500 ring-2 ring-blue-500/20',
  },
  sst: {
    label: 'Social Studies',
    description: 'History timelines, Geography, Civics & Economics',
    icon: <Compass className="h-4 w-4 text-amber-500" />,
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
  },
  hindi: {
    label: 'हिंदी शिक्षक',
    description: 'व्याकरण, साहित्य, शब्दावली एवं निबंध/पत्र लेखन',
    icon: <Languages className="h-4 w-4 text-rose-500" />,
    badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    activeBorder: 'border-rose-500 ring-2 ring-rose-500/20',
  },
  sanskrit: {
    label: 'संस्कृत शिक्षक',
    description: 'कारक, सन्धि, शब्द-धातु रूप, अनुवाद एवं व्याकरण',
    icon: <Globe className="h-4 w-4 text-cyan-500" />,
    badgeColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
    activeBorder: 'border-cyan-500 ring-2 ring-cyan-500/20',
  },
};

export const SubjectModeSelector: React.FC<SubjectModeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const activeConfig = SUBJECT_MODES_CONFIG[currentMode] || SUBJECT_MODES_CONFIG.general;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Teacher Persona & Subject Mode:
        </span>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
          {activeConfig.description}
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {(Object.keys(SUBJECT_MODES_CONFIG) as SubjectTeacherMode[]).map((modeKey) => {
          const cfg = SUBJECT_MODES_CONFIG[modeKey];
          const isSelected = currentMode === modeKey;

          return (
            <button
              key={modeKey}
              onClick={() => onSelectMode(modeKey)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                isSelected
                  ? `${cfg.activeBorder} bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs`
                  : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {cfg.icon}
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
