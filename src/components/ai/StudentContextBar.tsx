import React, { useState } from 'react';
import { BookOpen, Layers, Globe, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { StudentProfile } from '../../types';

interface StudentContextBarProps {
  profile: StudentProfile;
  activeSubject: string;
  activeChapter: string;
  activeTopic: string;
  onUpdateContext: (updates: { subject?: string; chapter?: string; topic?: string }) => void;
}

export const StudentContextBar: React.FC<StudentContextBarProps> = ({
  profile,
  activeSubject,
  activeChapter,
  activeTopic,
  onUpdateContext,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customChapter, setCustomChapter] = useState(activeChapter);
  const [customTopic, setCustomTopic] = useState(activeTopic);

  const handleApply = () => {
    onUpdateContext({ chapter: customChapter, topic: customTopic });
    setIsOpen(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/80 shadow-2xs backdrop-blur-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Context Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
            <BookOpen className="h-3.5 w-3.5" />
            Class {profile.classLevel}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{profile.board}</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>

          <select
            value={activeSubject}
            onChange={(e) => onUpdateContext({ subject: e.target.value })}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 focus:outline-none"
          >
            {profile.selectedSubjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>

          {activeChapter && (
            <>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="truncate max-w-[120px] text-slate-600 dark:text-slate-400" title={activeChapter}>
                Ch: {activeChapter}
              </span>
            </>
          )}

          {activeTopic && (
            <>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="truncate max-w-[120px] text-indigo-600 dark:text-indigo-400 font-medium" title={activeTopic}>
                Topic: {activeTopic}
              </span>
            </>
          )}

          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Globe className="h-3 w-3" />
            {profile.preferredLanguage === 'hi' ? 'Hindi' : 'English'}
          </span>
        </div>

        {/* Target Context Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-500" />
          <span>Set Chapter / Topic</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expandable Chapter/Topic Customizer */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-150">
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">
              Current Chapter:
            </label>
            <input
              type="text"
              value={customChapter}
              onChange={(e) => setCustomChapter(e.target.value)}
              placeholder="e.g. Life Processes / Quadratic Equations"
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">
              Specific Topic:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Photosynthesis / Completing the Square"
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleApply}
                className="rounded-lg border border-indigo-600 bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors flex items-center gap-1 shrink-0 active:scale-95"
              >
                <Check className="h-3.5 w-3.5" />
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
