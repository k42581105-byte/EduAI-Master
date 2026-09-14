import React, { useState } from 'react';
import { Trash2, AlertTriangle, Check, X, ShieldAlert, MessageSquare, Camera, BookOpen, HelpCircle, Calendar, Sparkles } from 'lucide-react';
import { PrivacyService } from '../../services/privacyService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface GranularDataErasureModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onContentDeleted: (message: string) => void;
}

interface ErasureCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  warningText: string;
}

export const GranularDataErasureModal: React.FC<GranularDataErasureModalProps> = ({
  isOpen,
  onClose,
  userId,
  onContentDeleted,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const categories: ErasureCategory[] = [
    {
      id: 'conversations',
      title: 'AI Tutor Chat History',
      description: 'Clears all past conversations, questions, and pedagogical step explanations.',
      icon: <MessageSquare className="w-4 h-4 text-indigo-500" />,
      warningText: 'This will erase all chat conversations across all subjects. Active conversations cannot be restored.',
    },
    {
      id: 'scans',
      title: 'Photo Scans & OCR Solutions',
      description: 'Removes all saved photo problem scans, extracted text, and step-by-step solutions.',
      icon: <Camera className="w-4 h-4 text-purple-500" />,
      warningText: 'All scanned problem cards in your Photo Solver history will be permanently deleted.',
    },
    {
      id: 'notes',
      title: 'Personal Study Notes',
      description: 'Deletes user-authored notes, formula cheatsheets, and subject summaries.',
      icon: <BookOpen className="w-4 h-4 text-blue-500" />,
      warningText: 'All custom notes you created will be erased. Download an export first if needed.',
    },
    {
      id: 'quizzes_exams',
      title: 'Quiz & Mock Exam Attempts',
      description: 'Clears practice quiz histories, mock exam answer sheets, and previous score logs.',
      icon: <HelpCircle className="w-4 h-4 text-amber-500" />,
      warningText: 'Historical score charts and past attempt logs will be reset.',
    },
    {
      id: 'study_planner',
      title: 'Study Planner & Weak Topic History',
      description: 'Resets your personalized study schedule and topic difficulty mastery analytics.',
      icon: <Calendar className="w-4 h-4 text-emerald-500" />,
      warningText: 'Clears your active study tasks and recalibrates weak topic tracking from scratch.',
    },
  ];

  const handleExecuteDelete = async () => {
    if (!selectedCategory) return;
    if (confirmText.trim().toLowerCase() !== 'delete') {
      setStatusMessage({ text: 'Please type "delete" to confirm.', isError: true });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = PrivacyService.deleteCategoryContent(selectedCategory, userId);
      if (res.success) {
        onContentDeleted(res.message);
        setSelectedCategory(null);
        setConfirmText('');
        onClose();
      } else {
        setStatusMessage({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Delete Saved Content
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selectively remove specific categories of personal data
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.isError
                  ? 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {!selectedCategory ? (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Choose the category you wish to erase permanently:
              </p>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setConfirmText('');
                    setStatusMessage(null);
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-800/60 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-xs mt-0.5">
                      {cat.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {cat.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <Trash2 className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Confirm Permanent Erasure</span>
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-300/90 leading-relaxed">
                  {categories.find((c) => c.id === selectedCategory)?.warningText}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Type <span className="font-mono text-rose-600 font-bold">delete</span> below to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="delete"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 flex items-center justify-between">
          {selectedCategory ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setSelectedCategory(null);
                  setConfirmText('');
                }}
              >
                Back to Categories
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="text-xs"
                disabled={confirmText.trim().toLowerCase() !== 'delete' || isProcessing}
                onClick={handleExecuteDelete}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                {isProcessing ? 'Erasing...' : 'Confirm Erasure'}
              </Button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
