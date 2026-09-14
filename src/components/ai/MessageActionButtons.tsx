import React, { useState } from 'react';
import { Copy, Check, RotateCcw, HelpCircle, Languages, BookMarked, HelpCircle as QuizIcon, Sparkles } from 'lucide-react';

interface MessageActionButtonsProps {
  messageText: string;
  onRegenerate?: () => void;
  onExplainSimpler?: () => void;
  onTranslate?: (targetLang: 'hi' | 'en') => void;
  onSaveNote?: (text: string) => void;
  onCreateQuiz?: (text: string) => void;
}

export const MessageActionButtons: React.FC<MessageActionButtonsProps> = ({
  messageText,
  onRegenerate,
  onExplainSimpler,
  onTranslate,
  onSaveNote,
  onCreateQuiz,
}) => {
  const [copied, setCopied] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNote = () => {
    if (onSaveNote) {
      onSaveNote(messageText);
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 3000);
    }
  };

  const handleToggleTranslate = () => {
    const nextLang = lang === 'hi' ? 'en' : 'hi';
    setLang(nextLang);
    if (onTranslate) {
      onTranslate(nextLang);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
      {/* Copy */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors active:scale-95"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-slate-500" />}
        <span>{copied ? 'Copied!' : 'Copy'}</span>
      </button>

      {/* Regenerate */}
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors active:scale-95"
        >
          <RotateCcw className="h-3 w-3 text-indigo-500" />
          <span>Regenerate</span>
        </button>
      )}

      {/* Explain Simpler */}
      {onExplainSimpler && (
        <button
          onClick={onExplainSimpler}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors active:scale-95"
        >
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>Explain Simpler</span>
        </button>
      )}

      {/* Translate */}
      {onTranslate && (
        <button
          onClick={handleToggleTranslate}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors active:scale-95"
        >
          <Languages className="h-3 w-3 text-rose-500" />
          <span>{lang === 'hi' ? 'Explain in Hindi' : 'Explain in English'}</span>
        </button>
      )}

      {/* Save Note */}
      {onSaveNote && (
        <button
          onClick={handleSaveNote}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors active:scale-95"
        >
          <BookMarked className="h-3 w-3 text-emerald-500" />
          <span>{savedNote ? 'Saved!' : 'Save Note'}</span>
        </button>
      )}

      {/* Create Quiz */}
      {onCreateQuiz && (
        <button
          onClick={() => onCreateQuiz(messageText)}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors active:scale-95"
        >
          <QuizIcon className="h-3 w-3 text-purple-500" />
          <span>Create Quiz</span>
        </button>
      )}
    </div>
  );
};
