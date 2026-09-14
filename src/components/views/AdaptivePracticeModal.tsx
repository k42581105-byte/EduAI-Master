import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  X,
  Compass,
  FileText,
  Clock,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import {
  AdaptiveTopic,
  AdaptiveLearningPath,
  AdaptiveQuestionPayload,
  AdaptiveDifficultyLevel,
  StudentProfile,
} from '../../types';
import { AdaptiveLearningService } from '../../services/adaptiveLearningService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { LanguageCode } from '../../i18n/translations';

interface AdaptivePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: AdaptiveTopic;
  path: AdaptiveLearningPath;
  profile: StudentProfile;
  lang?: LanguageCode;
  onUpdatePath: (updatedPath: AdaptiveLearningPath) => void;
  onNavigateToAi?: (prompt: string) => void;
  onNavigateToNotes?: () => void;
}

export const AdaptivePracticeModal: React.FC<AdaptivePracticeModalProps> = ({
  isOpen,
  onClose,
  topic,
  path,
  profile,
  lang = 'en',
  onUpdatePath,
  onNavigateToAi,
  onNavigateToNotes,
}) => {
  const [currentTopic, setCurrentTopic] = useState<AdaptiveTopic>(topic);
  const [questionItem, setQuestionItem] = useState<AdaptiveQuestionPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [activeHintIndex, setActiveHintIndex] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [showRemedialBreakdown, setShowRemedialBreakdown] = useState<boolean>(false);
  const [showEasyExample, setShowEasyExample] = useState<boolean>(false);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [sessionTotal, setSessionTotal] = useState<number>(0);
  const [sessionXp, setSessionXp] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'improve' | 'struggle' | 'neutral' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentTopic(topic);
      loadNextQuestion(topic, false, false);
      setSessionScore(0);
      setSessionTotal(0);
      setSessionXp(0);
      setFeedbackMessage(null);
    }
  }, [isOpen, topic.id]);

  const loadNextQuestion = async (
    targetTopic: AdaptiveTopic,
    isStrugglingFlag: boolean,
    isImprovingFlag: boolean
  ) => {
    setLoading(true);
    setSelectedOption(null);
    setIsSubmitted(false);
    setActiveHintIndex(0);
    setShowExplanation(false);

    try {
      const res = await AdaptiveLearningService.getAdaptivePracticeQuestion({
        topic: targetTopic.topicName,
        subject: targetTopic.subjectName,
        chapter: targetTopic.chapterName,
        classLevel: profile.classLevel,
        board: profile.board,
        currentDifficulty: targetTopic.currentDifficulty,
        isStruggling: isStrugglingFlag || targetTopic.consecutiveWrong >= 1,
        isImproving: isImprovingFlag || targetTopic.consecutiveCorrect >= 2,
        consecutiveWrong: targetTopic.consecutiveWrong,
        consecutiveCorrect: targetTopic.consecutiveCorrect,
        recentMistakes: targetTopic.recentMistakes,
        language: lang,
      });

      setQuestionItem(res.questionItem);

      // Automatically unfold remedial breakdown if student is struggling
      if (isStrugglingFlag || targetTopic.consecutiveWrong >= 1 || targetTopic.masteryPercentage < 50) {
        setShowRemedialBreakdown(true);
      } else {
        setShowRemedialBreakdown(false);
      }
    } catch (err) {
      console.error('Failed to load adaptive practice question:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !questionItem || isSubmitted) return;

    const isCorrect = selectedOption === questionItem.correctIndex;
    setIsSubmitted(true);
    setShowExplanation(true);
    setSessionTotal((prev) => prev + 1);

    if (isCorrect) {
      setSessionScore((prev) => prev + 1);
    }

    // Record performance & adjust difficulty dynamically
    const updateResult = AdaptiveLearningService.recordPerformanceUpdate(
      path,
      currentTopic.id,
      isCorrect,
      isCorrect ? '' : `Selected "${questionItem.options[selectedOption]}" for "${questionItem.question.slice(0, 40)}..."`
    );

    setCurrentTopic(updateResult.updatedTopic);
    onUpdatePath(updateResult.updatedPath);
    setSessionXp((prev) => prev + updateResult.xpEarned);

    // Provide immediate adaptive feedback
    if (updateResult.isImproving) {
      setFeedbackMessage({
        text:
          lang === 'hi'
            ? `शानदार! लगातार सही उत्तर देने पर कठिनाई स्तर बढ़ाकर ${updateResult.newDifficulty} कर दिया गया है 🚀`
            : `Outstanding! Consecutive correct answers stepped up difficulty to ${updateResult.newDifficulty} 🚀`,
        type: 'improve',
      });
      setShowRemedialBreakdown(false);
    } else if (updateResult.isStruggling) {
      setFeedbackMessage({
        text:
          lang === 'hi'
            ? `कोई बात नहीं! अवधारणा को सरल शब्दों में समझाने के लिए स्तर को ${updateResult.newDifficulty} पर रीसेट किया गया है 💡`
            : `No worries! Cognitive load stepped down to ${updateResult.newDifficulty} to reinforce foundation first 💡`,
        type: 'struggle',
      });
      setShowRemedialBreakdown(true);
      setShowEasyExample(true);
    } else {
      setFeedbackMessage(null);
    }
  };

  const handleNextQuestion = () => {
    loadNextQuestion(currentTopic, currentTopic.consecutiveWrong >= 1, currentTopic.consecutiveCorrect >= 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Compass className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  AI Adaptive Practice
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    currentTopic.currentDifficulty.includes('HOTS')
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                      : currentTopic.currentDifficulty.includes('Advanced')
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                      : currentTopic.currentDifficulty.includes('Standard')
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                  }`}
                >
                  {currentTopic.currentDifficulty}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentTopic.subjectName} • {currentTopic.chapterName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Session Stats */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-300">
                Score: {sessionScore}/{sessionTotal}
              </span>
              <span className="text-amber-500 flex items-center gap-0.5">
                <Zap className="h-3.5 w-3.5 fill-current" />
                +{sessionXp} XP
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Real-time Dynamic Feedback Banner */}
          {feedbackMessage && (
            <div
              className={`flex items-start gap-3 p-4 rounded-2xl border text-xs font-medium animate-in slide-in-from-top-2 ${
                feedbackMessage.type === 'improve'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
              }`}
            >
              {feedbackMessage.type === 'improve' ? (
                <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{feedbackMessage.text}</div>
            </div>
          )}

          {/* Topic Mastery Meter */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-indigo-500" />
                <span>Current Topic: {currentTopic.topicName}</span>
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                Mastery: {currentTopic.masteryPercentage}% ({currentTopic.status})
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(5, currentTopic.masteryPercentage)}%` }}
              />
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-4 py-8">
              <div className="h-6 w-3/4 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {/* Question Display */}
          {!loading && questionItem && (
            <div className="space-y-6">
              {/* Question Header & Application Context */}
              <div className="space-y-3">
                {questionItem.isApplicationBased && questionItem.realWorldScenario && (
                  <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-xs text-purple-900 dark:text-purple-200">
                    <span className="font-bold flex items-center gap-1 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      Real-World Scenario / HOTS Context:
                    </span>
                    <p className="leading-relaxed">{questionItem.realWorldScenario}</p>
                  </div>
                )}

                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {questionItem.question}
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {questionItem.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = isSubmitted && idx === questionItem.correctIndex;
                  const isWrongSelected = isSubmitted && isSelected && idx !== questionItem.correctIndex;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-4 rounded-2xl border transition-all text-sm font-medium flex items-start gap-3 ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700 shadow-xs'
                          : isWrongSelected
                          ? 'border-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-700 shadow-xs'
                          : isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : isWrongSelected
                            ? 'bg-rose-600 text-white'
                            : isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 leading-relaxed">{opt}</span>

                      {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />}
                      {isWrongSelected && <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>

              {/* Progressive Hints Drawer (Available before & during answer) */}
              {questionItem.hints && questionItem.hints.length > 0 && !isSubmitted && (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                      Guided Hints ({activeHintIndex + 1}/{questionItem.hints.length})
                    </span>
                    {activeHintIndex < questionItem.hints.length - 1 && (
                      <button
                        onClick={() => setActiveHintIndex((prev) => Math.min(questionItem.hints.length - 1, prev + 1))}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-[11px]"
                      >
                        Reveal Next Hint →
                      </button>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    {questionItem.hints[activeHintIndex]}
                  </p>
                </div>
              )}

              {/* Simple Concept Breakdown & Easy Example (If struggling or clicked) */}
              {(showRemedialBreakdown || currentTopic.consecutiveWrong >= 1) && (
                <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4 text-indigo-600" />
                      Simple Concept Breakdown
                    </span>
                    <button
                      onClick={() => setShowEasyExample((prev) => !prev)}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {showEasyExample ? 'Hide Walkthrough Example' : 'View Easy Step-by-Step Example →'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {questionItem.simpleConceptBreakdown || currentTopic.simpleExplanation}
                  </p>

                  {/* Easy Example Accordion */}
                  {showEasyExample && (questionItem.easyExample || currentTopic.easyExample) && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-2 animate-in fade-in">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        📝 Example Problem: {(questionItem.easyExample || currentTopic.easyExample)?.question}
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {(questionItem.easyExample || currentTopic.easyExample)?.stepByStepSolution}
                      </p>
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
                        💡 Key Rule: {(questionItem.easyExample || currentTopic.easyExample)?.keyTakeaway}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Solution Explanation (After Submit) */}
              {showExplanation && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Step-by-Step Solution & Concept Key</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed text-sm">
                    {questionItem.explanation}
                  </p>

                  {/* Action links to ask AI or save notes */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => {
                        if (onNavigateToAi) {
                          onNavigateToAi(`Explain why ${questionItem.question} has this answer and give another practice example.`);
                          onClose();
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Ask AI Tutor More About This</span>
                    </button>

                    {onNavigateToNotes && (
                      <button
                        onClick={() => {
                          onNavigateToNotes();
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5 text-emerald-500" />
                        <span>View Notes Library</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="font-semibold">Current Streak:</span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
              <Flame className="h-3.5 w-3.5 fill-current" />
              {currentTopic.consecutiveCorrect} correct
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isSubmitted ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 shadow-xs"
              >
                <span>Check Answer</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 shadow-xs gap-1.5"
              >
                <span>Next Adaptive Question</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
