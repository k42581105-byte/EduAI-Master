import React from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Zap,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  HelpCircle,
  X,
} from 'lucide-react';
import { SmartRevisionSessionSummary } from '../../types';

interface RevisionSummaryModalProps {
  summary: SmartRevisionSessionSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onTakeQuiz: () => void;
  onSaveAsNote: () => void;
  onGoToPlanner: () => void;
}

export const RevisionSummaryModal: React.FC<RevisionSummaryModalProps> = ({
  summary,
  isOpen,
  onClose,
  onTakeQuiz,
  onSaveAsNote,
  onGoToPlanner,
}) => {
  if (!isOpen || !summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 text-indigo-600 dark:text-indigo-400 mb-3 border border-indigo-500/30 shadow-xs animate-bounce">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Smart Revision Complete!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {summary.title} • {summary.mode.toUpperCase()} MODE
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* XP Earned */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                +{summary.xpEarned} XP
              </div>
              <div className="text-2xs text-amber-800/80 dark:text-amber-300 font-medium">
                {summary.dailyXpCapped ? 'Daily cap reached' : 'Verified Effort Awarded'}
              </div>
            </div>
          </div>

          {/* Mastery Score */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                {summary.newMastery}%
                <span className="text-2xs font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  +{summary.newMastery - summary.previousMastery}%
                </span>
              </div>
              <div className="text-2xs text-emerald-800/80 dark:text-emerald-300 font-medium">
                Topic Mastery Reached
              </div>
            </div>
          </div>

          {/* Flashcards Learned */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500 text-white shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {summary.cardsLearnedCount} Cards
              </div>
              <div className="text-2xs text-indigo-800/80 dark:text-indigo-300 font-medium">
                Marked as Learned
              </div>
            </div>
          </div>

          {/* Diagnostic MCQs */}
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500 text-white shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {summary.mcqsCorrectCount}/{summary.mcqsAnsweredCount}
              </div>
              <div className="text-2xs text-purple-800/80 dark:text-purple-300 font-medium">
                MCQs Answered Correctly
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Impact Notifications */}
        <div className="space-y-3 mb-6">
          {/* Weak topic update */}
          {summary.weakTopicDelta && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  {summary.weakTopicResolved
                    ? '🎉 Weak Topic Mastered & Cleared!'
                    : '📈 Weak Topic Accuracy Boosted'}
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  <strong>{summary.weakTopicDelta.topicName}</strong> improved from{' '}
                  {summary.weakTopicDelta.previousAccuracy}% to{' '}
                  <span className="font-bold underline">
                    {summary.weakTopicDelta.newAccuracy}%
                  </span>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Study task completed */}
          {summary.studyTaskCompleted && (
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  Study Planner Task Auto-Completed
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  "{summary.studyTaskCompleted.title}" has been marked complete on your study
                  schedule.
                </p>
              </div>
            </div>
          )}

          {/* Spaced Repetition Recommendation */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Next Spaced Revision Scheduled:
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                in {summary.nextRevisionRecommendation.daysFromNow} Days (
                {summary.nextRevisionRecommendation.recommendedDate})
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {summary.nextRevisionRecommendation.reason}
            </p>
          </div>
        </div>

        {/* Action Connectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          <button
            onClick={onSaveAsNote}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            Save as AI Revision Note
          </button>

          <button
            onClick={onTakeQuiz}
            className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            Take 5-Min Practice Quiz
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <span>Continue Learning</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
