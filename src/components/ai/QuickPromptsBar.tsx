import React from 'react';
import { Sparkles, HelpCircle, Lightbulb, FileText, Languages, HelpCircle as QuizIcon } from 'lucide-react';

interface QuickPromptsBarProps {
  onSelectPrompt: (promptPrefix: string) => void;
}

const QUICK_CHIPS = [
  { label: 'Explain this', prefix: 'Can you explain ' },
  { label: 'Solve step-by-step', prefix: 'Please solve this step-by-step: ' },
  { label: 'Give an example', prefix: 'Can you give 2 real-world examples for ' },
  { label: 'Make short notes', prefix: 'Create concise revision notes for ' },
  { label: 'Quiz me', prefix: 'Create 3 quick practice quiz questions on ' },
  { label: 'Explain in Hindi', prefix: 'हिंदी में विस्तार से समझाएं: ' },
  { label: 'Explain in English', prefix: 'Explain in simple English: ' },
  { label: 'Make it easier', prefix: 'Explain in very simple words like I am 10 years old: ' },
];

export const QuickPromptsBar: React.FC<QuickPromptsBarProps> = ({ onSelectPrompt }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
        <span>Quick Action Chips:</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {QUICK_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(chip.prefix)}
            className="flex shrink-0 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-all active:scale-95 shadow-2xs"
          >
            <span>+</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
