import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Layers, Target, Compass, Wand2 } from 'lucide-react';
import { ClassLevel, BoardType } from '../../types';

interface CustomRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: {
    subject: string;
    chapter: string;
    topic: string;
    customPrompt?: string;
  }) => void;
  classLevel: ClassLevel;
  board: BoardType;
  selectedSubjects: string[];
}

export const CustomRevisionModal: React.FC<CustomRevisionModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  classLevel,
  board,
  selectedSubjects,
}) => {
  const [subject, setSubject] = useState(selectedSubjects[0] || 'Science');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapter.trim()) return;
    onGenerate({
      subject,
      chapter: chapter.trim(),
      topic: topic.trim() || 'All Core Concepts',
      customPrompt: customPrompt.trim(),
    });
    onClose();
  };

  const quickPresets = [
    { subject: 'Science', chapter: 'Light: Reflection & Refraction', topic: 'Mirror Formula & Ray Diagrams' },
    { subject: 'Science', chapter: 'Chemical Reactions & Equations', topic: 'Types of Reactions & Redox' },
    { subject: 'Mathematics', chapter: 'Quadratic Equations', topic: 'Discriminant & Word Problems' },
    { subject: 'Mathematics', chapter: 'Arithmetic Progressions', topic: 'Sum of n Terms & nth Term' },
    { subject: 'Social Science', chapter: 'Nationalism in India', topic: 'Non-Cooperation Movement' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Create Custom Revision
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Class {classLevel} • {board} Curriculum
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-5">
          <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            ⚡ Quick High-Yield Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSubject(preset.subject);
                  setChapter(preset.chapter);
                  setTopic(preset.topic);
                }}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left"
              >
                {preset.chapter}: <span className="font-semibold">{preset.topic}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              {selectedSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Chapter Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g., Light: Reflection and Refraction"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Specific Topic / Subtopic */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Specific Topic / Subtopic (Optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Mirror Formula, Cartesian Sign Convention"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Custom Focus Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Specific Focus / Mistakes to address (Optional)
            </label>
            <textarea
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., Focus on numericals where focal length sign is confusing."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!chapter.trim()}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              Generate Smart Revision Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
