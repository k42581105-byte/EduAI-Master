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
  Camera,
  MessageSquare,
  GraduationCap,
  Calendar,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  SmartPracticeMode,
  SmartPracticeQuestionItem,
  SmartPracticeSessionSummary,
  StudentProfile,
  NavigationSection,
  AdaptiveDifficultyLevel,
} from '../../types';
import { SmartPracticeService } from '../../services/smartPracticeService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { LanguageCode } from '../../i18n/translations';

interface SmartPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: SmartPracticeMode;
  subject?: string;
  topic?: string;
  chapter?: string;
  profile: StudentProfile;
  lang?: LanguageCode;
  onNavigate: (section: NavigationSection) => void;
  onNavigateToAi?: (prompt: string) => void;
  onSessionComplete?: (summary: SmartPracticeSessionSummary) => void;
}

export const SmartPracticeModal: React.FC<SmartPracticeModalProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  subject: initialSubject = 'Science',
  topic: initialTopic = '',
  chapter: initialChapter = '',
  profile,
  lang = 'en',
  onNavigate,
  onNavigateToAi,
  onSessionComplete,
}) => {
  const [activeMode, setActiveMode] = useState<SmartPracticeMode>(initialMode);
  const [activeSubject, setActiveSubject] = useState<string>(initialSubject);
  const [activeTopic, setActiveTopic] = useState<string>(initialTopic);
  const [activeChapter, setActiveChapter] = useState<string>(initialChapter);

  // Session state
  const [loading, setLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<SmartPracticeQuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [answersRecord, setAnswersRecord] = useState<
    Array<{ questionIndex: number; selectedIndex: number; isCorrect: boolean; timeTaken: number }>
  >([]);

  // Adaptive difficulty tracking during session
  const [currentTier, setCurrentTier] = useState<AdaptiveDifficultyLevel>('Level 2 - Standard');
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState<number>(0);
  const [difficultyNotification, setDifficultyNotification] = useState<string | null>(null);

  // Remediation & Tools state
  const [activeHintLevel, setActiveHintLevel] = useState<number>(0);
  const [showConceptBreakdown, setShowConceptBreakdown] = useState<boolean>(false);
  const [showEasyExample, setShowEasyExample] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [sessionSummary, setSessionSummary] = useState<SmartPracticeSessionSummary | null>(null);
  const [showFullHistory, setShowFullHistory] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode);
      setActiveSubject(initialSubject || profile.selectedSubjects?.[0] || 'Science');
      setActiveTopic(initialTopic);
      setActiveChapter(initialChapter);
      initiateSession(initialMode, initialSubject || profile.selectedSubjects?.[0] || 'Science', initialTopic, initialChapter);
    }
  }, [isOpen, initialMode, initialSubject, initialTopic, initialChapter]);

  const initiateSession = async (
    targetMode: SmartPracticeMode,
    targetSub: string,
    targetTop?: string,
    targetChap?: string
  ) => {
    setLoading(true);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setAnswersRecord([]);
    setSessionSummary(null);
    setActiveHintLevel(0);
    setShowConceptBreakdown(false);
    setShowEasyExample(false);
    setShowExplanation(false);
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
    setDifficultyNotification(null);
    setCurrentTier('Level 2 - Standard');

    try {
      const res = await SmartPracticeService.generateSmartPracticeSession({
        profile,
        mode: targetMode,
        subject: targetSub,
        topic: targetTop,
        chapter: targetChap,
        count: targetMode === 'quick_5' ? 5 : 5,
        language: lang,
      });

      setQuestions(res.questions);
      if (res.questions[0]?.difficultyTier) {
        setCurrentTier(res.questions[0].difficultyTier);
      }
      setQuestionStartTime(Date.now());
    } catch (err) {
      console.error('Failed to start Smart Practice session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted || !questions[currentIndex]) return;

    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctIndex;
    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));

    setIsAnswerSubmitted(true);
    setShowExplanation(true);

    const newRecord = [
      ...answersRecord,
      {
        questionIndex: currentIndex,
        selectedIndex: selectedOption,
        isCorrect,
        timeTaken: timeSpent,
      },
    ];
    setAnswersRecord(newRecord);

    // Dynamic Adaptive Tier Progression
    if (isCorrect) {
      const nextConsecutiveCorrect = consecutiveCorrect + 1;
      setConsecutiveCorrect(nextConsecutiveCorrect);
      setConsecutiveWrong(0);

      if (nextConsecutiveCorrect >= 2) {
        if (currentTier === 'Level 1 - Foundation') {
          setCurrentTier('Level 2 - Standard');
          setDifficultyNotification('Great accuracy! Stepping up to Level 2 (Standard) 📈');
        } else if (currentTier === 'Level 2 - Standard') {
          setCurrentTier('Level 3 - Advanced');
          setDifficultyNotification('2 in a row! Advancing to Level 3 (Advanced) 🚀');
        } else if (currentTier === 'Level 3 - Advanced') {
          setCurrentTier('Level 4 - HOTS / Application');
          setDifficultyNotification('Mastery streak! Unlocked Level 4 (HOTS Application) 🏆');
        }
      }
    } else {
      const nextConsecutiveWrong = consecutiveWrong + 1;
      setConsecutiveWrong(nextConsecutiveWrong);
      setConsecutiveCorrect(0);
      setShowConceptBreakdown(true);

      if (nextConsecutiveWrong >= 1) {
        if (currentTier === 'Level 4 - HOTS / Application') {
          setCurrentTier('Level 3 - Advanced');
          setDifficultyNotification('Calibrating difficulty down to Level 3 for foundational clarity.');
        } else if (currentTier === 'Level 3 - Advanced') {
          setCurrentTier('Level 2 - Standard');
          setDifficultyNotification('Calibrating difficulty to Standard tier.');
        } else if (currentTier === 'Level 2 - Standard') {
          setCurrentTier('Level 1 - Foundation');
          setDifficultyNotification('Lowering cognitive load to Level 1 Foundation with guided examples.');
        }
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setShowExplanation(false);
      setActiveHintLevel(0);
      setShowConceptBreakdown(false);
      setShowEasyExample(false);
      setDifficultyNotification(null);
      setQuestionStartTime(Date.now());
    } else {
      // Complete Session
      finishSession();
    }
  };

  const finishSession = () => {
    const summary = SmartPracticeService.finalizeSessionSummary(
      questions,
      answersRecord,
      activeMode,
      activeSubject,
      profile
    );
    setSessionSummary(summary);
    if (onSessionComplete) {
      onSessionComplete(summary);
    }
  };

  const currentQ = questions[currentIndex];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Smart Practice
                </h3>
                <Badge variant="indigo" size="sm">
                  {activeMode.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeSubject} {activeChapter ? `• ${activeChapter}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!sessionSummary && !loading && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  Q {currentIndex + 1} of {questions.length}
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center animate-spin">
                  <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Generating Smart Practice Set...
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                  Analyzing past mistakes, mastery status, and CBSE learning milestones to build a custom {activeMode.replace('_', ' ')} question set.
                </p>
              </div>
            </div>
          ) : sessionSummary ? (
            /* ============================================================
               SESSION COMPLETION BREAKDOWN SCREEN
            ============================================================ */
            <div className="space-y-6 animate-fadeIn">
              {/* Hero Score Gauge & Summary Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/80 dark:border-indigo-900/60">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5 text-center sm:text-left">
                    <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10">
                      <div className="text-center">
                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                          {sessionSummary.accuracyPercentage}%
                        </span>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Accuracy</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                          {sessionSummary.accuracyPercentage >= 80
                            ? 'Excellent Performance! 🌟'
                            : sessionSummary.accuracyPercentage >= 60
                            ? 'Good Progress! 👏'
                            : 'Practice Session Completed! 📚'}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Solved {sessionSummary.correctCount} out of {sessionSummary.totalQuestions} questions correctly in {Math.round(sessionSummary.timeTakenSeconds)}s.
                      </p>
                    </div>
                  </div>

                  {/* XP & Anti-Farming Tag */}
                  <div className="flex flex-col items-center sm:items-end gap-1.5 p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                        +{sessionSummary.xpEarned} XP
                      </span>
                    </div>
                    {sessionSummary.dailyXpCapReached ? (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Daily Smart Practice XP Cap reached (Anti-Farming)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Saved to your profile progress
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Topics Improved & Topics Needing Revision Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Topics Improved */}
                <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h5 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Topics Improved ({sessionSummary.topicsImproved.length})
                    </h5>
                  </div>

                  {sessionSummary.topicsImproved.length > 0 ? (
                    <div className="space-y-2">
                      {sessionSummary.topicsImproved.map((top, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {top.topicName}
                            </p>
                            <p className="text-[11px] text-slate-400">{top.chapterName}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              +{top.delta}%
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium">{top.newMastery}% Mastery</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Retake this practice session to boost mastery scores on core topics.
                    </p>
                  )}
                </div>

                {/* 2. Topics Needing Revision */}
                <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h5 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Topics Needing Revision ({sessionSummary.topicsNeedingRevision.length})
                    </h5>
                  </div>

                  {sessionSummary.topicsNeedingRevision.length > 0 ? (
                    <div className="space-y-2">
                      {sessionSummary.topicsNeedingRevision.map((top, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/30 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {top.topicName}
                            </p>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {top.currentAccuracy}% Acc
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {top.mistakeHighlight}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                if (onNavigateToAi) {
                                  onNavigateToAi(
                                    `Please explain the core concept, formulas, and common pitfalls for ${top.topicName} in ${top.chapterName} with clear examples.`
                                  );
                                  onClose();
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-medium text-[10px] flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" /> Ask AI Teacher
                            </button>
                            <button
                              onClick={() => {
                                onNavigate('notes');
                                onClose();
                              }}
                              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-medium text-[10px] flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> View Notes
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 py-4">
                      <CheckCircle2 className="w-4 h-4" /> All tested topics answered with high accuracy!
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended Next Practice Action Card */}
              {sessionSummary.recommendedNextPractice && (
                <div className="p-4 sm:p-5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="indigo" size="sm">
                        RECOMMENDED NEXT STEP
                      </Badge>
                      <span className="text-xs text-slate-500 font-medium">
                        ⏱️ ~{sessionSummary.recommendedNextPractice.estimatedMinutes} mins • +{sessionSummary.recommendedNextPractice.xpReward} XP
                      </span>
                    </div>
                    <h5 className="text-base font-bold text-slate-900 dark:text-white">
                      {sessionSummary.recommendedNextPractice.title}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {sessionSummary.recommendedNextPractice.subtitle}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="whitespace-nowrap w-full sm:w-auto"
                    onClick={() => {
                      if (sessionSummary.recommendedNextPractice.actionType === 'start_practice') {
                        initiateSession(
                          sessionSummary.recommendedNextPractice.mode,
                          sessionSummary.recommendedNextPractice.subject,
                          sessionSummary.recommendedNextPractice.topic
                        );
                      } else if (sessionSummary.recommendedNextPractice.actionType === 'navigate_ask_ai') {
                        if (onNavigateToAi) {
                          onNavigateToAi(
                            `Can you explain ${sessionSummary.recommendedNextPractice.topic} simply with 2 examples?`
                          );
                          onClose();
                        }
                      } else if (sessionSummary.recommendedNextPractice.actionType === 'navigate_notes') {
                        onNavigate('notes');
                        onClose();
                      } else if (sessionSummary.recommendedNextPractice.actionType === 'navigate_quiz') {
                        onNavigate('quiz');
                        onClose();
                      } else if (sessionSummary.recommendedNextPractice.actionType === 'navigate_exam') {
                        onNavigate('exam-mode');
                        onClose();
                      }
                    }}
                  >
                    <span>{sessionSummary.recommendedNextPractice.actionLabel}</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              )}

              {/* Expandable Full Question-by-Question History */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowFullHistory(!showFullHistory)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    Review All {questions.length} Questions & Detailed Solutions
                  </span>
                  {showFullHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showFullHistory && (
                  <div className="p-4 space-y-4 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {questions.map((q, idx) => {
                      const record = answersRecord[idx];
                      const isCorrect = record?.isCorrect || false;
                      return (
                        <div key={idx} className="pt-4 first:pt-0 space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                            )}
                            <span className="font-bold text-slate-900 dark:text-white">
                              Q{idx + 1}. {q.question}
                            </span>
                          </div>

                          <div className="pl-6 space-y-1 text-slate-600 dark:text-slate-300">
                            <p>
                              <span className="font-semibold text-slate-500">Your Answer:</span>{' '}
                              <span className={isCorrect ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                                {q.options[record?.selectedIndex ?? 0] || 'Skipped'}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p>
                                <span className="font-semibold text-slate-500">Correct Answer:</span>{' '}
                                <span className="text-emerald-600 font-semibold">{q.options[q.correctIndex]}</span>
                              </p>
                            )}
                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 mt-1">
                              <p className="font-semibold text-slate-700 dark:text-slate-200">Explanation:</p>
                              <p className="text-slate-600 dark:text-slate-400 mt-0.5">{q.explanation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => initiateSession(activeMode, activeSubject, activeTopic, activeChapter)}
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" /> Practice Set Again
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onNavigate('study-planner');
                      onClose();
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-1.5" /> Add to Study Planner
                  </Button>
                </div>

                <Button variant="primary" size="sm" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : currentQ ? (
            /* ============================================================
               ACTIVE PRACTICE QUESTION SCREEN
            ============================================================ */
            <div className="space-y-4">
              {/* Progress & Adaptive Tier Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant={currentTier.includes('HOTS') ? 'purple' : currentTier.includes('Advanced') ? 'indigo' : 'blue'} size="sm">
                      {currentTier}
                    </Badge>
                    {currentQ.isApplicationBased && (
                      <Badge variant="amber" size="sm">
                        HOTS / Application
                      </Badge>
                    )}
                    {currentQ.topic && (
                      <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                        {currentQ.topic}
                      </span>
                    )}
                  </div>

                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {currentIndex + 1} / {questions.length}
                  </span>
                </div>

                {/* Progress Line */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + (isAnswerSubmitted ? 1 : 0)) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Dynamic Difficulty Change Notification */}
              {difficultyNotification && (
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200 animate-fadeIn">
                  <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 animate-spin" />
                  <span>{difficultyNotification}</span>
                </div>
              )}

              {/* Question Statement Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                {currentQ.realWorldScenario && (
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 italic">
                    Context: {currentQ.realWorldScenario}
                  </p>
                )}
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.question}
                </h4>
              </div>

              {/* Options List */}
              <div className="space-y-2.5">
                {currentQ.options.map((optionText, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let optionStyle =
                    'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-800 dark:text-slate-200';

                  if (isSelected && !isAnswerSubmitted) {
                    optionStyle =
                      'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20';
                  } else if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optionStyle =
                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20';
                    } else if (isSelected && !isCorrect) {
                      optionStyle =
                        'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20';
                    } else {
                      optionStyle = 'opacity-50 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition flex items-center justify-between text-sm sm:text-base font-medium ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{optionText}</span>
                      </div>

                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Remediation & Hint Drawer */}
              {!isAnswerSubmitted && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    {currentQ.hints && currentQ.hints.length > 0 && (
                      <button
                        onClick={() =>
                          setActiveHintLevel((prev) => Math.min(currentQ.hints.length, prev + 1))
                        }
                        className="px-3 py-1.5 rounded-lg border border-amber-300/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 font-semibold flex items-center gap-1.5 transition"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {activeHintLevel === 0
                            ? 'Need a Hint?'
                            : `Hint ${activeHintLevel} of ${currentQ.hints.length}`}
                        </span>
                      </button>
                    )}

                    {currentQ.simpleConceptBreakdown && (
                      <button
                        onClick={() => setShowConceptBreakdown(!showConceptBreakdown)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-medium flex items-center gap-1.5 transition"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Concept Breakdown</span>
                      </button>
                    )}
                  </div>

                  {/* Ask AI Teacher Quick Action */}
                  <button
                    onClick={() => {
                      if (onNavigateToAi) {
                        onNavigateToAi(
                          `I am solving this Class ${profile.classLevel} question in ${activeSubject}: "${currentQ.question}". Can you explain the theoretical principle behind it?`
                        );
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-semibold flex items-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Ask AI Teacher
                  </button>
                </div>
              )}

              {/* Active Hints Content Box */}
              {activeHintLevel > 0 && currentQ.hints && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1.5 text-xs animate-fadeIn">
                  <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-600" /> Progressive Hint #{activeHintLevel}:
                  </p>
                  <p className="text-amber-800 dark:text-amber-300">{currentQ.hints[activeHintLevel - 1]}</p>
                </div>
              )}

              {/* Concept Breakdown Box */}
              {showConceptBreakdown && currentQ.simpleConceptBreakdown && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs animate-fadeIn">
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" /> Simplified Concept Breakdown:
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">
                    {currentQ.simpleConceptBreakdown}
                  </p>
                </div>
              )}

              {/* Answer Explanation & Remediation after submission */}
              {isAnswerSubmitted && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 animate-fadeIn text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold flex items-center gap-1.5 ${
                        selectedOption === currentQ.correctIndex ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {selectedOption === currentQ.correctIndex ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Correct Answer! (+15 XP)
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" /> Incorrect ({currentQ.options[currentQ.correctIndex]} is correct)
                        </>
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (onNavigateToAi) {
                            onNavigateToAi(
                              `I need detailed doubt clearing on this question: "${currentQ.question}". Why is "${currentQ.options[currentQ.correctIndex]}" correct?`
                            );
                            onClose();
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Clear Doubt with AI
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('photo-solver');
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" /> Photo Solver
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentQ.explanation}
                  </p>

                  {/* Easy Example if available */}
                  {currentQ.easyExample && (
                    <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1 text-xs">
                      <p className="font-bold text-indigo-900 dark:text-indigo-200">
                        Solved Example: {currentQ.easyExample.question}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">
                        {currentQ.easyExample.stepByStepSolution}
                      </p>
                      <p className="text-indigo-700 dark:text-indigo-300 font-medium pt-0.5">
                        Key Takeaway: {currentQ.easyExample.keyTakeaway}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Nav Action */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Exit Session
                </Button>

                {!isAnswerSubmitted ? (
                  <Button
                    variant="primary"
                    size="md"
                    disabled={selectedOption === null}
                    onClick={handleSubmitAnswer}
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button variant="primary" size="md" onClick={handleNextQuestion}>
                    <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'View Results'}</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">No questions available.</div>
          )}
        </div>
      </div>
    </div>
  );
};
