import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import {
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  FileText,
  Camera,
  Layers,
  Check,
  RotateCcw,
  History,
  Trash2,
  ExternalLink,
  Zap,
  BarChart2,
  Brain,
  MessageSquare,
  Flame,
  Search,
  Filter,
  Flag,
  Eye,
  X,
  AlertTriangle,
  TrendingUp,
  Languages,
} from 'lucide-react';
import { StudentProfile, Quiz, QuizQuestion, NavigationSection, SavedNote, ScanHistoryItem, QuestionType } from '../../types';
import { StorageService } from '../../services/storageService';
import { AiService } from '../../services/aiService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { LanguageCode, getTranslation } from '../../i18n/translations';
import { VoiceAiControl } from '../ai/VoiceAiControl';

interface QuizViewProps {
  profile: StudentProfile;
  onNavigate?: (section: NavigationSection) => void;
  lang?: LanguageCode;
}

interface UserAnswerState {
  selectedIndex?: number;
  typedAnswer?: string;
  isCorrect?: boolean;
  flagged?: boolean;
}

export const QuizView: React.FC<QuizViewProps> = ({ profile, onNavigate, lang = 'en' }) => {
  const navQuizTitle = getTranslation(lang as LanguageCode, 'navQuiz');

  // Profile local state for instant XP updates
  const [currentProfile, setCurrentProfile] = useState<StudentProfile>(profile);

  // Tabs
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Generator Form Options
  const [sourceType, setSourceType] = useState<'topic' | 'note' | 'photo'>('topic');
  const [subject, setSubject] = useState(profile.selectedSubjects[0] || 'Science');
  const [topic, setTopic] = useState('Chemical Reactions & Equations');
  const [chapter, setChapter] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>('');
  const [questionFormat, setQuestionFormat] = useState<'mixed' | 'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer'>('mixed');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(10); // 0 = No Limit
  const [quizLanguage, setQuizLanguage] = useState<'en' | 'hi'>(lang === 'hi' ? 'hi' : 'en');
  const [loading, setLoading] = useState(false);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswerState>>({});
  const [showHint, setShowHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0); // counts up in seconds spent
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null); // countdown if limit set

  // Quiz Results Info
  const [quizResultSummary, setQuizResultSummary] = useState<{
    scorePercentage: number;
    accuracyPercentage: number;
    correctCount: number;
    totalQuestions: number;
    timeTakenSeconds: number;
    earnedXp: number;
    isRetake: boolean;
    leveledUp: boolean;
    newLevel: number;
    newXp: number;
  } | null>(null);

  // Review Filter
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'flagged'>('all');

  // Saved Data & History Filters
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [photoScans, setPhotoScans] = useState<ScanHistoryItem[]>([]);
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const debouncedSearchHistory = useDebounce(searchHistoryQuery, 200);
  const [historySubjectFilter, setHistorySubjectFilter] = useState('All');
  const [historyDifficultyFilter, setHistoryDifficultyFilter] = useState('All');

  // Modal to View Past Results
  const [viewingPastQuiz, setViewingPastQuiz] = useState<Quiz | null>(null);

  // Load initial saved data on mount
  useEffect(() => {
    const prof = StorageService.getProfile();
    setCurrentProfile(prof);

    const notes = StorageService.getNotes();
    setSavedNotes(notes);
    if (notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }

    const scans = StorageService.getScanHistory();
    setPhotoScans(scans);
    if (scans.length > 0) {
      setSelectedPhotoId(scans[0].id);
    }

    const quizzes = StorageService.getSavedQuizzes();
    setSavedQuizzes(quizzes);
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (activeQuiz && !isCompleted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);

        if (remainingSeconds !== null) {
          setRemainingSeconds((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(interval);
              // Auto submit quiz when time expires!
              handleFinalSubmitQuiz(true);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, isCompleted, remainingSeconds]);

  // Handle Quiz Start
  const handleStartQuiz = async () => {
    let promptTopic = topic.trim();
    let promptSubject = subject;
    let promptChapter = chapter.trim() || topic.trim();
    let sourceContent = '';
    let sourceTitle = promptTopic;

    if (sourceType === 'note') {
      const foundNote = savedNotes.find((n) => n.id === selectedNoteId);
      if (foundNote) {
        promptTopic = foundNote.topicName || foundNote.chapterName || foundNote.title;
        promptSubject = foundNote.subjectName || subject;
        promptChapter = foundNote.chapterName || promptTopic;
        sourceTitle = foundNote.title;
        sourceContent = foundNote.contentMarkdown;
      }
    } else if (sourceType === 'photo') {
      const foundPhoto = photoScans.find((p) => p.id === selectedPhotoId);
      if (foundPhoto) {
        promptTopic = foundPhoto.questionText || 'Photo Problem Concept';
        promptSubject = foundPhoto.subject || subject;
        promptChapter = 'Photo Solver';
        sourceTitle = `Photo: ${foundPhoto.questionText.slice(0, 30)}...`;
        sourceContent = `Question: ${foundPhoto.questionText}\nSolution: ${foundPhoto.solutionText}`;
      }
    }

    if (!promptTopic) return;

    setLoading(true);
    try {
      const formatsList = questionFormat === 'mixed'
        ? ['mcq', 'true_false', 'fill_in_blank', 'short_answer']
        : [questionFormat];

      const res = await AiService.generateQuiz(promptTopic, {
        subject: promptSubject,
        chapter: promptChapter,
        classLevel: currentProfile.classLevel,
        difficulty,
        questionCount,
        language: quizLanguage,
        sourceType,
        sourceTitle,
        sourceContent,
        questionTypes: formatsList,
      });

      const generatedQuiz = res.quiz;
      if (!generatedQuiz.questions || generatedQuiz.questions.length === 0) {
        generatedQuiz.questions = [];
      }

      // Setup initial quiz state
      setActiveQuiz(generatedQuiz);
      setCurrentQIndex(0);
      setUserAnswers({});
      setShowHint(false);
      setIsCompleted(false);
      setQuizResultSummary(null);
      setTimerSeconds(0);
      setShowSubmitModal(false);

      if (timeLimitMinutes > 0) {
        setRemainingSeconds(timeLimitMinutes * 60);
      } else {
        setRemainingSeconds(null);
      }
    } catch (err) {
      console.error('Quiz Generation Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentQ: QuizQuestion | undefined = activeQuiz?.questions[currentQIndex];

  // Record Answer selection for current question
  const handleSelectOption = (index: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQIndex]: {
        ...prev[currentQIndex],
        selectedIndex: index,
      },
    }));
  };

  const handleTypeAnswer = (text: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQIndex]: {
        ...prev[currentQIndex],
        typedAnswer: text,
      },
    }));
  };

  const handleToggleFlag = (qIdx: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qIdx]: {
        ...prev[qIdx],
        flagged: !prev[qIdx]?.flagged,
      },
    }));
  };

  // Evaluate if answer is correct
  const evaluateAnswer = (q: QuizQuestion, userAns?: UserAnswerState): boolean => {
    if (!userAns) return false;
    const qType = q.questionType || (q.options && q.options.length > 0 ? 'mcq' : 'short_answer');

    if (qType === 'mcq' || qType === 'true_false' || qType === 'fill_in_blank') {
      if (userAns.selectedIndex !== undefined && q.correctIndex !== undefined) {
        return userAns.selectedIndex === q.correctIndex;
      }
      if (userAns.selectedIndex !== undefined && q.options && q.correctAnswer) {
        return q.options[userAns.selectedIndex]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
      }
    } else if (qType === 'short_answer') {
      if (userAns.typedAnswer && userAns.typedAnswer.trim().length > 0) {
        const lowerTyped = userAns.typedAnswer.toLowerCase().trim();
        const lowerCorrect = (q.correctAnswer || '').toLowerCase().trim();
        const keyWords = lowerCorrect.split(' ').filter((w) => w.length > 3);
        const matchCount = keyWords.filter((kw) => lowerTyped.includes(kw)).length;
        return matchCount > 0 || lowerTyped.includes(lowerCorrect);
      }
    }
    return false;
  };

  // Final Quiz Submission
  const handleFinalSubmitQuiz = (autoSubmitted = false) => {
    if (!activeQuiz) return;

    let correctCount = 0;
    let attemptedCount = 0;
    const updatedAnswersRecord: Record<number, { selectedIndex?: number; typedAnswer?: string; isCorrect: boolean; flagged?: boolean }> = {};

    activeQuiz.questions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      const isAttempted = userAns && (userAns.selectedIndex !== undefined || (userAns.typedAnswer && userAns.typedAnswer.trim().length > 0));
      if (isAttempted) attemptedCount++;

      const isCorrect = evaluateAnswer(q, userAns);
      if (isCorrect) correctCount++;

      updatedAnswersRecord[idx] = {
        selectedIndex: userAns?.selectedIndex,
        typedAnswer: userAns?.typedAnswer,
        isCorrect,
        flagged: userAns?.flagged || false,
      };
    });

    const totalQuestions = activeQuiz.questions.length || 1;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const accuracyPercentage = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    // Record result via StorageService (Includes anti-farming XP logic & Weak topic auto-registration!)
    const res = StorageService.recordQuizResult(
      activeQuiz,
      scorePercentage,
      accuracyPercentage,
      timerSeconds,
      updatedAnswersRecord
    );

    // Update state to completed view
    setIsCompleted(true);
    setShowSubmitModal(false);
    setQuizResultSummary({
      scorePercentage,
      accuracyPercentage,
      correctCount,
      totalQuestions,
      timeTakenSeconds: timerSeconds,
      earnedXp: res.earnedXp,
      isRetake: res.isRetake,
      leveledUp: res.leveledUp,
      newLevel: res.newLevel,
      newXp: res.newXp,
    });

    // Refresh profile & history
    setCurrentProfile(StorageService.getProfile());
    setSavedQuizzes(StorageService.getSavedQuizzes());
  };

  // State for AI Quiz Translation
  const [isTranslatingQuiz, setIsTranslatingQuiz] = useState(false);

  const handleTranslateQuiz = async (targetLang: 'hi' | 'en') => {
    if (!activeQuiz) return;
    setIsTranslatingQuiz(true);
    try {
      const res = await AiService.translateQuiz(activeQuiz, targetLang);
      if (res.translatedQuiz) {
        setActiveQuiz(res.translatedQuiz);
        StorageService.saveQuiz(res.translatedQuiz);
        setSavedQuizzes(StorageService.getSavedQuizzes());
      }
    } catch (err) {
      console.error('Translate quiz error:', err);
    } finally {
      setIsTranslatingQuiz(false);
    }
  };

  // Reset & Retry Quiz
  const handleRetryQuiz = () => {
    setUserAnswers({});
    setCurrentQIndex(0);
    setShowHint(false);
    setIsCompleted(false);
    setQuizResultSummary(null);
    setTimerSeconds(0);
    setShowSubmitModal(false);
    if (timeLimitMinutes > 0) {
      setRemainingSeconds(timeLimitMinutes * 60);
    } else {
      setRemainingSeconds(null);
    }
  };

  // Format Time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  // Filter History Quizzes
  const filteredHistoryQuizzes = useMemo(() => {
    return savedQuizzes.filter((q) => {
      const matchesSearch =
        debouncedSearchHistory === '' ||
        q.title.toLowerCase().includes(debouncedSearchHistory.toLowerCase()) ||
        q.subjectId.toLowerCase().includes(debouncedSearchHistory.toLowerCase()) ||
        q.chapterName.toLowerCase().includes(debouncedSearchHistory.toLowerCase()) ||
        (q.topicName || '').toLowerCase().includes(debouncedSearchHistory.toLowerCase());

      const matchesSubject = historySubjectFilter === 'All' || q.subjectId === historySubjectFilter;
      const matchesDifficulty = historyDifficultyFilter === 'All' || q.difficulty === historyDifficultyFilter;

      return matchesSearch && matchesSubject && matchesDifficulty;
    });
  }, [savedQuizzes, debouncedSearchHistory, historySubjectFilter, historyDifficultyFilter]);

  // Answered count for progress
  const answeredCount = useMemo(() => {
    return (Object.values(userAnswers) as UserAnswerState[]).filter(
      (ans) => ans.selectedIndex !== undefined || (ans.typedAnswer && ans.typedAnswer.trim().length > 0)
    ).length;
  }, [userAnswers]);

  const flaggedCount = useMemo(() => {
    return (Object.values(userAnswers) as UserAnswerState[]).filter((ans) => ans.flagged).length;
  }, [userAnswers]);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400 shadow-sm">
              <HelpCircle className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                AI Quiz & Practice System
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Master Class {currentProfile.classLevel} concepts with timed practice, instant accuracy feedback, and anti-farming XP rewards
              </p>
            </div>
          </div>
        </div>

        {/* Right Info Badges & Tab Switcher */}
        <div className="flex items-center gap-3">
          {/* Level & XP Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-xs font-bold text-amber-900 dark:text-amber-300">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Level {currentProfile.level}</span>
            <span className="text-amber-400">•</span>
            <span>{currentProfile.xp} XP</span>
          </div>

          {!activeQuiz && (
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 shrink-0">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-900 dark:text-amber-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Create Quiz</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-900 dark:text-amber-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>History ({savedQuizzes.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: CREATE QUIZ FORM */}
      {!activeQuiz && activeTab === 'create' && (
        <div className="space-y-6">
          <VoiceAiControl
            onTranscriptReady={(transcriptText) => {
              if (transcriptText) setTopic(transcriptText);
            }}
            onVoiceCreateQuiz={(prompt) => {
              setTopic(prompt);
              setTimeout(() => {
                handleStartQuiz();
              }, 100);
            }}
            onVoiceAskAi={(prompt) => {
              localStorage.setItem('eduai_pending_ask_prompt', prompt);
              if (onNavigate) onNavigate('ask-ai');
            }}
            onVoiceCreateNote={(prompt) => {
              if (onNavigate) onNavigate('notes');
            }}
          />

          <Card className="space-y-6 border-amber-200 dark:border-slate-800 shadow-sm">
            {/* Step 1: Material Source */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                1. Select Quiz Material Source
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSourceType('topic')}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                    sourceType === 'topic'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 ring-2 ring-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <BookOpen className={`h-5 w-5 mb-1 ${sourceType === 'topic' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">Curriculum Topic</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">Board Syllabus</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('note')}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                    sourceType === 'note'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 ring-2 ring-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <FileText className={`h-5 w-5 mb-1 ${sourceType === 'note' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">Saved AI Notes</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">From Library</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('photo')}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                    sourceType === 'photo'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 ring-2 ring-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <Camera className={`h-5 w-5 mb-1 ${sourceType === 'photo' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">Photo Solver</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">Solved Problem</span>
                </button>
              </div>
            </div>

            {/* Dynamic Source Inputs */}
            {sourceType === 'topic' && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {currentProfile.selectedSubjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Chapter Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="e.g. Chemical Reactions, Electricity..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Specific Topic / Concept
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Types of Chemical Reactions, Ohm's Law..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}

            {sourceType === 'note' && (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Select Note from Library ({savedNotes.length})
                </label>
                {savedNotes.length > 0 ? (
                  <select
                    value={selectedNoteId}
                    onChange={(e) => setSelectedNoteId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {savedNotes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title} ({n.subjectName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-xs text-slate-500 text-center">
                    No saved AI notes found. Generate notes in the Notes tab first!
                  </div>
                )}
              </div>
            )}

            {sourceType === 'photo' && (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Select Photo Solver Problem ({photoScans.length})
                </label>
                {photoScans.length > 0 ? (
                  <select
                    value={selectedPhotoId}
                    onChange={(e) => setSelectedPhotoId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {photoScans.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.subject}] {p.questionText.slice(0, 50)}...
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-xs text-slate-500 text-center">
                    No solved photo problems history found. Upload a homework photo in Photo Solver first!
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Formats & Configuration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                2. Question Formats
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'mixed', label: '⚡ All Mixed', desc: 'MCQ, T/F, Blanks & Short Ans' },
                  { id: 'mcq', label: '🔘 MCQ Only', desc: '4 Options Multiple Choice' },
                  { id: 'true_false', label: '☯️ True / False', desc: 'Binary Statements' },
                  { id: 'fill_in_blank', label: '✏️ Fill in Blanks', desc: 'Key Terms' },
                  { id: 'short_answer', label: '📝 Short Answer', desc: 'Descriptive Practice' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setQuestionFormat(fmt.id as any)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      questionFormat === fmt.id
                        ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty, Count, Timer, Language Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Difficulty */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        difficulty === d
                          ? d === 'Easy'
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : d === 'Medium'
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-rose-500 bg-rose-500 text-white'
                          : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Questions
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[5, 10, 15].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        questionCount === num
                          ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      {num} Qs
                    </button>
                  ))}
                </div>
              </div>

              {/* Quiz Timer */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Quiz Timer
                </label>
                <select
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value={0}>♾️ No Time Limit</option>
                  <option value={5}>⏱️ 5 Minutes</option>
                  <option value={10}>⏱️ 10 Minutes</option>
                  <option value={15}>⏱️ 15 Minutes</option>
                  <option value={20}>⏱️ 20 Minutes</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Language
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'hi', label: 'हिंदी' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setQuizLanguage(l.code as any)}
                      className={`py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        quizLanguage === l.code
                          ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                disabled={loading}
                onClick={handleStartQuiz}
                icon={loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              >
                {loading ? 'AI Engine Generating Custom Quiz Questions...' : 'Start Practice Quiz Now'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* VIEW 2: SAVED QUIZ HISTORY WITH SEARCH & FILTERS */}
      {!activeQuiz && activeTab === 'history' && (
        <div className="space-y-4">
          <Card className="space-y-4">
            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  placeholder="Search past quizzes by title, topic, or subject..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={historySubjectFilter}
                  onChange={(e) => setHistorySubjectFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="All">All Subjects</option>
                  {currentProfile.selectedSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={historyDifficultyFilter}
                  onChange={(e) => setHistoryDifficultyFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* List of Filtered Past Quizzes */}
            {filteredHistoryQuizzes.length > 0 ? (
              <div className="space-y-3">
                {filteredHistoryQuizzes.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-amber-300 transition-all shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="amber">{q.subjectId || 'General'}</Badge>
                        <Badge variant="outline">{q.difficulty}</Badge>
                        {q.score !== undefined && (
                          <span
                            className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                              q.score >= 80
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : q.score >= 50
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            Score: {q.score}%
                          </span>
                        )}
                        {q.accuracyPercentage !== undefined && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Accuracy: {q.accuracyPercentage}%
                          </span>
                        )}
                        {q.attemptCount && q.attemptCount > 1 && (
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                            {q.attemptCount} Attempts
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {q.title}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {q.questions.length} Questions • Created {new Date(q.createdDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingPastQuiz(q)}
                        icon={<Eye className="h-3.5 w-3.5 text-amber-500" />}
                      >
                        Results
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setActiveQuiz(q);
                          handleRetryQuiz();
                        }}
                        icon={<RotateCcw className="h-3.5 w-3.5" />}
                      >
                        Re-Take
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          StorageService.deleteSavedQuiz(q.id);
                          setSavedQuizzes(StorageService.getSavedQuizzes());
                        }}
                        icon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Brain className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  No matching past practice quizzes found in history. Create a quiz to get started!
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* VIEW 3: ACTIVE QUIZ PLAYER WITH QUESTION PALETTE & TIMERS */}
      {activeQuiz && !isCompleted && (
        <div className="space-y-6">
          <Card className="space-y-6 border-amber-200 dark:border-slate-800 shadow-md">
            {/* Top Status & Timer Bar */}
            <div className="space-y-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="amber">{activeQuiz.subjectId}</Badge>
                  <Badge variant="outline">{activeQuiz.difficulty}</Badge>
                  {currentQ?.questionType && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-md">
                      {currentQ.questionType.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Timer Display */}
                  <div
                    className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-xl transition-all ${
                      remainingSeconds !== null && remainingSeconds <= 60
                        ? 'bg-rose-500 text-white animate-pulse shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>
                      {remainingSeconds !== null
                        ? `Time Remaining: ${formatTime(remainingSeconds)}`
                        : `Time Spent: ${formatTime(timerSeconds)}`}
                    </span>
                  </div>

                  {/* Flag Question Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleFlag(currentQIndex)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      userAnswers[currentQIndex]?.flagged
                        ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span>{userAnswers[currentQIndex]?.flagged ? 'Flagged' : 'Flag'}</span>
                  </button>

                  {/* Hint Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowHint(!showHint)}
                    icon={<Lightbulb className="h-3.5 w-3.5 text-amber-500" />}
                  >
                    Hint
                  </Button>

                  {/* Translate Quiz Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    loading={isTranslatingQuiz}
                    onClick={() => handleTranslateQuiz(activeQuiz.language === 'Hindi' ? 'en' : 'hi')}
                    icon={<Languages className="h-3.5 w-3.5 text-indigo-500" />}
                  >
                    {activeQuiz.language === 'Hindi' ? 'English' : 'हिंदी'}
                  </Button>
                </div>
              </div>

              {/* QUESTION PALETTE GRID */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Question Palette ({answeredCount}/{activeQuiz.questions.length} Answered)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Click any number to jump directly
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {activeQuiz.questions.map((_, idx) => {
                    const isCurrent = currentQIndex === idx;
                    const ans = userAnswers[idx];
                    const isAnswered = ans && (ans.selectedIndex !== undefined || (ans.typedAnswer && ans.typedAnswer.trim().length > 0));
                    const isFlagged = ans?.flagged;

                    let btnStyle = 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300';

                    if (isCurrent) {
                      btnStyle = 'border-amber-500 bg-amber-500 text-white font-black ring-2 ring-amber-500/40 scale-105';
                    } else if (isFlagged) {
                      btnStyle = 'border-amber-400 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold';
                    } else if (isAnswered) {
                      btnStyle = 'border-emerald-500 bg-emerald-500 text-white font-bold';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCurrentQIndex(idx);
                          setShowHint(false);
                        }}
                        className={`h-8 w-8 rounded-xl border text-xs font-mono transition-all flex items-center justify-center cursor-pointer ${btnStyle}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hint Box */}
            {showHint && currentQ?.hint && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 animate-in fade-in">
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-600" />
                <span><strong>AI Hint:</strong> {currentQ.hint}</span>
              </div>
            )}

            {/* Question Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Question {currentQIndex + 1} of {activeQuiz.questions.length}
                </span>
                {currentQ?.topic && (
                  <span className="text-[11px] font-medium text-slate-400">
                    Topic: {currentQ.topic}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-relaxed">
                {currentQ?.question}
              </h3>
            </div>

            {/* ANSWER CONTROLS */}
            {currentQ && (
              <div className="space-y-3">
                {/* MCQ / True-False / Fill-In-Blank options */}
                {(currentQ.questionType === 'mcq' ||
                  currentQ.questionType === 'true_false' ||
                  (!currentQ.questionType && currentQ.options && currentQ.options.length > 0)) && (
                  <div className="space-y-2.5">
                    {currentQ.options?.map((opt, idx) => {
                      const isSelected = userAnswers[currentQIndex]?.selectedIndex === idx;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100 font-bold ring-2 ring-amber-500/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors ${
                                isSelected
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>
                          {isSelected && <Check className="h-5 w-5 text-amber-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fill in the Blanks without options */}
                {currentQ.questionType === 'fill_in_blank' && (!currentQ.options || currentQ.options.length === 0) && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={userAnswers[currentQIndex]?.typedAnswer || ''}
                      onChange={(e) => handleTypeAnswer(e.target.value)}
                      placeholder="Type the missing keyword or term..."
                      className="w-full rounded-2xl border border-slate-300 bg-white p-3.5 text-xs sm:text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Short Answer Textarea */}
                {currentQ.questionType === 'short_answer' && (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={userAnswers[currentQIndex]?.typedAnswer || ''}
                      onChange={(e) => handleTypeAnswer(e.target.value)}
                      placeholder="Type your explanation or core response here..."
                      className="w-full rounded-2xl border border-slate-300 bg-white p-3.5 text-xs sm:text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Bottom Navigation & Submit Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                disabled={currentQIndex === 0}
                onClick={() => {
                  setCurrentQIndex((prev) => Math.max(0, prev - 1));
                  setShowHint(false);
                }}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => setShowSubmitModal(true)}
                  icon={<Zap className="h-4 w-4" />}
                >
                  Submit Quiz
                </Button>

                {currentQIndex + 1 < activeQuiz.questions.length && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentQIndex((prev) => Math.min(activeQuiz.questions.length - 1, prev + 1));
                      setShowHint(false);
                    }}
                    icon={<ArrowRight className="h-4 w-4" />}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CONFIRMATION MODAL BEFORE SUBMITTING QUIZ */}
      {showSubmitModal && activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Submit Practice Quiz?
              </h3>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                You have answered <strong>{answeredCount}</strong> out of <strong>{activeQuiz.questions.length}</strong> questions.
              </p>
              {activeQuiz.questions.length - answeredCount > 0 && (
                <p className="text-rose-600 font-semibold">
                  ⚠️ Warning: {activeQuiz.questions.length - answeredCount} question(s) remain unanswered!
                </p>
              )}
              {flaggedCount > 0 && (
                <p className="text-amber-600 font-semibold">
                  🚩 Note: {flaggedCount} question(s) are currently flagged for review.
                </p>
              )}
              <p>Are you ready to calculate your final score and review step-by-step explanations?</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowSubmitModal(false)}
              >
                Continue Quiz
              </Button>
              <Button
                variant="primary"
                onClick={() => handleFinalSubmitQuiz(false)}
                icon={<CheckCircle2 className="h-4 w-4" />}
              >
                Yes, Submit Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: QUIZ RESULTS & DETAILED REVIEW SCREEN */}
      {activeQuiz && isCompleted && quizResultSummary && (
        <div className="space-y-6">
          <Card className="text-center py-8 space-y-6 border-amber-200 dark:border-slate-800 shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 shadow-inner">
              <Award className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <Badge variant="amber">Quiz Completed!</Badge>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {activeQuiz.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Completed in {formatTime(quizResultSummary.timeTakenSeconds)}
              </p>
            </div>

            {/* Score & Accuracy Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                <span className="text-2xl font-black text-amber-800 dark:text-amber-300">
                  {quizResultSummary.scorePercentage}%
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                  Overall Score
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
                <span className="text-2xl font-black text-indigo-800 dark:text-indigo-300">
                  {quizResultSummary.accuracyPercentage}%
                </span>
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block mt-0.5">
                  Accuracy
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
                  {quizResultSummary.correctCount}/{quizResultSummary.totalQuestions}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  Correct Qs
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
                <span className="text-2xl font-black text-purple-800 dark:text-purple-300">
                  +{quizResultSummary.earnedXp} XP
                </span>
                <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block mt-0.5">
                  {quizResultSummary.isRetake ? 'Retake Practice' : 'XP Earned'}
                </span>
              </div>
            </div>

            {/* Retake XP Info Banner */}
            {quizResultSummary.isRetake && (
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 max-w-xl mx-auto flex items-center justify-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Anti-Farming Protection Active:</strong> Retaking quizzes rewards bonus XP only for score improvements over your best attempt!
                </span>
              </div>
            )}

            {/* Weak Topic Alert if score/accuracy < 70% */}
            {(quizResultSummary.scorePercentage < 70 || quizResultSummary.accuracyPercentage < 70) && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="h-5 w-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Detected Weak Topic: {activeQuiz.topicName || activeQuiz.chapterName}</span>
                    <span className="text-[11px] opacity-80">This concept has been automatically added to your Weak Topics list for AI targeted revision.</span>
                  </div>
                </div>
                {onNavigate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate('weak-topics')}
                    icon={<BarChart2 className="h-3.5 w-3.5" />}
                  >
                    View Weak Topics
                  </Button>
                )}
              </div>
            )}

            {/* REVIEW ANSWERS FILTER & ACCORDION */}
            <div className="text-left space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  Detailed Question-by-Question Review
                </h4>

                <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs">
                  {(['all', 'correct', 'incorrect', 'flagged'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setReviewFilter(f)}
                      className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                        reviewFilter === f
                          ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-900 dark:text-amber-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Review List */}
              <div className="space-y-3">
                {activeQuiz.questions.map((q, idx) => {
                  const ans = activeQuiz.userAnswersRecord ? activeQuiz.userAnswersRecord[idx] : undefined;
                  const isCorrect = ans?.isCorrect;

                  if (reviewFilter === 'correct' && !isCorrect) return null;
                  if (reviewFilter === 'incorrect' && isCorrect) return null;
                  if (reviewFilter === 'flagged' && !ans?.flagged) return null;

                  return (
                    <div
                      key={q.id || idx}
                      className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30'
                          : 'border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 font-bold">
                        <span className="text-slate-900 dark:text-white leading-snug">
                          Q{idx + 1}: {q.question}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {ans?.flagged && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">🚩 Flagged</span>}
                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <CheckCircle2 className="h-4 w-4" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-600 font-bold">
                              <XCircle className="h-4 w-4" /> Incorrect
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Display user chosen option / text */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[11px] text-slate-500">
                          <strong>Your Answer:</strong>{' '}
                          {ans?.selectedIndex !== undefined && q.options
                            ? q.options[ans.selectedIndex]
                            : ans?.typedAnswer || '(No answer provided)'}
                        </div>
                        {!isCorrect && q.correctAnswer && (
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                            <strong>Correct Model Answer:</strong> {q.correctAnswer}
                          </div>
                        )}
                      </div>

                      {/* AI Tutor Explanation */}
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                        <strong>AI Tutor Explanation:</strong> {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setActiveQuiz(null)}
                icon={<Sparkles className="h-4 w-4" />}
              >
                Create New Quiz
              </Button>
              <Button
                variant="primary"
                onClick={handleRetryQuiz}
                icon={<RotateCcw className="h-4 w-4" />}
              >
                Retry This Quiz
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* VIEW PAST QUIZ RESULTS MODAL */}
      {viewingPastQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <Badge variant="amber">{viewingPastQuiz.subjectId}</Badge>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {viewingPastQuiz.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingPastQuiz(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results Overview Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                <span className="text-xl font-bold text-amber-800 dark:text-amber-300">
                  {viewingPastQuiz.score}%
                </span>
                <span className="text-[10px] text-amber-600 block">Score</span>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
                <span className="text-xl font-bold text-indigo-800 dark:text-indigo-300">
                  {viewingPastQuiz.accuracyPercentage || viewingPastQuiz.score}%
                </span>
                <span className="text-[10px] text-indigo-600 block">Accuracy</span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
                <span className="text-xl font-bold text-purple-800 dark:text-purple-300">
                  {viewingPastQuiz.questions.length}
                </span>
                <span className="text-[10px] text-purple-600 block">Questions</span>
              </div>
            </div>

            {/* Question by Question Review */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Question Review & Explanations:
              </h4>

              {viewingPastQuiz.questions.map((q, idx) => {
                const ansRecord = viewingPastQuiz.userAnswersRecord ? viewingPastQuiz.userAnswersRecord[idx] : undefined;
                const isCorrect = ansRecord?.isCorrect;

                return (
                  <div
                    key={q.id || idx}
                    className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20'
                        : 'border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 font-bold">
                      <span className="text-slate-900 dark:text-white">
                        Q{idx + 1}: {q.question}
                      </span>
                      {isCorrect ? (
                        <span className="text-emerald-600 text-[11px] font-bold">Correct</span>
                      ) : (
                        <span className="text-rose-600 text-[11px] font-bold">Incorrect</span>
                      )}
                    </div>

                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>AI Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setViewingPastQuiz(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
