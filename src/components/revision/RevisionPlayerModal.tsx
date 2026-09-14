import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Award,
  Check,
  Bookmark,
} from 'lucide-react';
import { RevisionFlashcard, SmartRevisionSheet } from '../../types';
import { voiceService } from '../../services/voiceService';

interface RevisionPlayerModalProps {
  sheet: SmartRevisionSheet;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (cardsLearned: number, cardsReviewed: number) => void;
}

export const RevisionPlayerModal: React.FC<RevisionPlayerModalProps> = ({
  sheet,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [cards, setCards] = useState<RevisionFlashcard[]>(sheet.flashcards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unlearned' | 'learned'>('all');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setCards(sheet.flashcards || []);
    setCurrentIndex(0);
    setIsRevealed(false);
  }, [sheet]);

  if (!isOpen || cards.length === 0) return null;

  const filteredCards = cards.filter((c) => {
    if (filterMode === 'unlearned') return !c.isLearned;
    if (filterMode === 'learned') return !!c.isLearned;
    return true;
  });

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredCards.length - 1));
  const currentCard = filteredCards[safeIndex] || cards[0];
  const learnedCount = cards.filter((c) => c.isLearned).length;

  const toggleLearned = (cardId: string, confidence: 'low' | 'medium' | 'high' = 'high') => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const newLearned = !c.isLearned;
          return {
            ...c,
            isLearned: newLearned,
            userConfidence: newLearned ? confidence : undefined,
          };
        }
        return c;
      })
    );
  };

  const handleNext = () => {
    setIsRevealed(false);
    voiceService.stop();
    setIsSpeaking(false);
    if (safeIndex < filteredCards.length - 1) {
      setCurrentIndex(safeIndex + 1);
    }
  };

  const handlePrev = () => {
    setIsRevealed(false);
    voiceService.stop();
    setIsSpeaking(false);
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    }
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      voiceService.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      voiceService.speak(text, 'en', () => {
        setIsSpeaking(false);
      });
    }
  };

  const handleFinish = () => {
    voiceService.stop();
    onComplete(learnedCount, cards.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Revision Mode: Active Recall
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                  {sheet.subject}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                {sheet.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter pills */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({cards.length})
              </button>
              <button
                onClick={() => setFilterMode('unlearned')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterMode === 'unlearned'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                To Learn ({cards.length - learnedCount})
              </button>
              <button
                onClick={() => setFilterMode('learned')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterMode === 'learned'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Learned ({learnedCount})
              </button>
            </div>

            <button
              onClick={() => {
                voiceService.stop();
                onClose();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Counter */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>
              Card {safeIndex + 1} of {filteredCards.length}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {learnedCount}/{cards.length} Learned (
              {Math.round((learnedCount / Math.max(1, cards.length)) * 100)}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{
                width: `${((safeIndex + 1) / Math.max(1, filteredCards.length)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Interactive Active Recall Card */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentCard ? (
            <div className="flex flex-col gap-4">
              {/* Question Box */}
              <div
                className={`p-5 rounded-2xl border transition-all duration-300 ${
                  currentCard.isLearned
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                    Question • {currentCard.difficulty || 'Concept'}
                  </span>

                  <button
                    onClick={() =>
                      handleSpeak(
                        `${currentCard.question}. ${
                          isRevealed
                            ? `Answer: ${currentCard.answer}. Explanation: ${currentCard.explanation}`
                            : ''
                        }`
                      )
                    }
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Audio Readout"
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-4 h-4 text-rose-500 animate-pulse" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {currentCard.question}
                </h4>
              </div>

              {/* Reveal / Hidden Answer Action */}
              {!isRevealed ? (
                <button
                  onClick={() => setIsRevealed(true)}
                  className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center gap-2 transition-all shadow-xs group"
                >
                  <Eye className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span>Reveal Answer & Explanation</span>
                </button>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* Answer Box */}
                  <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-lg border border-slate-700">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Model Answer
                      </span>
                      <button
                        onClick={() => setIsRevealed(false)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <EyeOff className="w-3.5 h-3.5" /> Hide
                      </button>
                    </div>
                    <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-100">
                      {currentCard.answer}
                    </p>
                  </div>

                  {/* Step-by-Step Explanation */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Conceptual Explanation & Key Reason
                    </h5>
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {currentCard.explanation}
                    </p>
                  </div>

                  {/* Mark as Learned Bar */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Did you understand and memorize this card?
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => toggleLearned(currentCard.id, 'high')}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          currentCard.isLearned
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        {currentCard.isLearned ? 'Marked as Learned' : 'Mark as Learned'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-slate-800 dark:text-white">All cards reviewed in this filter!</p>
              <button
                onClick={() => setFilterMode('all')}
                className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
              >
                Show All Cards
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={safeIndex === 0}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {safeIndex < filteredCards.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                Next Card
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Award className="w-4 h-4" />
                Finish Revision Mode
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
