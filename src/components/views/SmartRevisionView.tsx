import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Sparkles,
  Zap,
  BookOpen,
  AlertTriangle,
  GraduationCap,
  History,
  Calendar,
  Layers,
  Wand2,
  CheckCircle2,
  TrendingUp,
  FileText,
  HelpCircle,
  Clock,
  ArrowRight,
  Bookmark,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  Award,
  Play,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import {
  NavigationSection,
  StudentProfile,
  SmartRevisionMode,
  SmartRevisionSheet,
  SmartRevisionSessionSummary,
  RevisionQuickMcq,
  RevisionHistoryItem,
} from '../../types';
import { LanguageCode } from '../../i18n/translations';
import { StorageService } from '../../services/storageService';
import { SmartRevisionService } from '../../services/smartRevisionService';
import { voiceService } from '../../services/voiceService';
import { RevisionPlayerModal } from '../revision/RevisionPlayerModal';
import { RevisionSummaryModal } from '../revision/RevisionSummaryModal';
import { CustomRevisionModal } from '../revision/CustomRevisionModal';

interface SmartRevisionViewProps {
  profile: StudentProfile;
  onNavigate: (section: NavigationSection) => void;
  lang: LanguageCode;
  initialMode?: SmartRevisionMode;
  initialSubject?: string;
  initialChapter?: string;
  initialTopic?: string;
}

export const SmartRevisionView: React.FC<SmartRevisionViewProps> = ({
  profile,
  onNavigate,
  lang,
  initialMode,
  initialSubject,
  initialChapter,
  initialTopic,
}) => {
  // State
  const [selectedMode, setSelectedMode] = useState<SmartRevisionMode>(initialMode || 'chapter');
  const [activeSheet, setActiveSheet] = useState<SmartRevisionSheet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'key_points' | 'definitions_formulas' | 'flashcards' | 'mcqs' | 'practice_questions' | 'history'>('key_points');

  // Interactive MCQs state
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [cardsLearnedCount, setCardsLearnedCount] = useState(0);

  // Modals
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SmartRevisionSessionSummary | null>(null);

  // Saved / History data
  const [savedSheets, setSavedSheets] = useState<SmartRevisionSheet[]>(() => SmartRevisionService.getSavedSheets());
  const [historyItems, setHistoryItems] = useState<RevisionHistoryItem[]>(() => SmartRevisionService.getHistory());
  const [dueSheets, setDueSheets] = useState(() => SmartRevisionService.getDueRevisionSheets());

  // Copy / Voice state
  const [copiedKeyPointIdx, setCopiedKeyPointIdx] = useState<number | null>(null);
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const weakTopics = StorageService.getWeakTopics();
  const weakestTopic = weakTopics[0] || null;

  // Mode configurations
  const REVISION_MODES: {
    id: SmartRevisionMode;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge: string;
    duration: string;
    color: string;
  }[] = [
    {
      id: 'quick',
      label: 'Quick Revision',
      description: 'Rapid 5-minute active recall drill covering key formulas, rules, and core takeaways.',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      badge: '5 Mins',
      duration: '5 min',
      color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500',
    },
    {
      id: 'chapter',
      label: 'Chapter Revision',
      description: 'Complete high-yield chapter blueprint with definitions, formulas, MCQs, and exam questions.',
      icon: <BookOpen className="w-5 h-5 text-indigo-500" />,
      badge: 'Comprehensive',
      duration: '10 min',
      color: 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500',
    },
    {
      id: 'weak_topic',
      label: 'Weak Topic Revision',
      description: 'Targeted remedial drill designed to eliminate misconceptions in your lowest-scoring topics.',
      icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
      badge: `${weakTopics.length} Detected`,
      duration: '8 min',
      color: 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500',
    },
    {
      id: 'exam',
      label: 'Exam Revision',
      description: 'Board exam crash course focusing on high-weightage 3-mark & 5-mark subjective scoring blueprints.',
      icon: <GraduationCap className="w-5 h-5 text-purple-500" />,
      badge: 'Board Blueprint',
      duration: '15 min',
      color: 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500',
    },
    {
      id: 'mistake',
      label: 'Mistake Revision',
      description: 'Review previous incorrect quiz and test answers to ensure zero recurrence in actual exams.',
      icon: <History className="w-5 h-5 text-amber-600" />,
      badge: 'Error Notebook',
      duration: '7 min',
      color: 'border-amber-600/30 bg-amber-600/5 hover:border-amber-600',
    },
    {
      id: 'daily',
      label: 'Daily Spaced Revision',
      description: 'Ebbinghaus memory curve active recall queue for topics due for spaced retention today.',
      icon: <Calendar className="w-5 h-5 text-emerald-500" />,
      badge: `${dueSheets.length} Due Today`,
      duration: '6 min',
      color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500',
    },
    {
      id: 'custom',
      label: 'Custom Revision',
      description: 'Select any custom subject, specific chapter, or sub-topic to generate a personalized sheet.',
      icon: <Wand2 className="w-5 h-5 text-cyan-500" />,
      badge: 'On Demand',
      duration: 'Flexible',
      color: 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500',
    },
  ];

  // Initialize first sheet on mount
  useEffect(() => {
    const existing = savedSheets[0];
    if (existing && !activeSheet) {
      setActiveSheet(existing);
    } else if (!activeSheet) {
      generateRevision(selectedMode);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => {
      setNotificationToast(null);
    }, 4000);
  };

  // Generate revision sheet based on mode
  const generateRevision = async (
    mode: SmartRevisionMode,
    customParams?: { subject: string; chapter: string; topic: string; customPrompt?: string }
  ) => {
    setIsLoading(true);
    setSessionStartTime(Date.now());
    setMcqAnswers({});
    setCardsLearnedCount(0);
    voiceService.stop();
    setIsSpeakingSummary(false);

    let subject = customParams?.subject || initialSubject || profile.selectedSubjects?.[0] || 'Science';
    let chapter = customParams?.chapter || initialChapter || 'Light: Reflection & Refraction';
    let topic = customParams?.topic || initialTopic || '';
    let mistakesContext = '';

    if (mode === 'weak_topic' && weakestTopic) {
      subject = weakestTopic.subjectName;
      chapter = weakestTopic.chapterName;
      topic = weakestTopic.topicName;
      mistakesContext = `Student accuracy is ${weakestTopic.accuracyRate}%. Misconception in ${weakestTopic.topicName}.`;
    } else if (mode === 'mistake') {
      subject = 'Science';
      chapter = 'Optics & Chemical Reactions';
      topic = 'Common Calculation & Sign Convention Errors';
      mistakesContext = 'Previous mistakes: Incorrect sign convention for concave mirror focal length, balancing redox equations.';
    } else if (mode === 'daily') {
      if (dueSheets.length > 0) {
        const topDue = dueSheets[0].sheet;
        subject = topDue.subject;
        chapter = topDue.chapter;
        topic = topDue.topic || '';
      }
    }

    try {
      const sheet = await SmartRevisionService.generateSheet({
        mode,
        subject,
        chapter,
        topic,
        classLevel: profile.classLevel,
        board: profile.board,
        mistakesContext: customParams?.customPrompt || mistakesContext,
      });

      setActiveSheet(sheet);
      setSavedSheets(SmartRevisionService.getSavedSheets());
      setDueSheets(SmartRevisionService.getDueRevisionSheets());
      triggerToast(`Loaded ${sheet.title} (${mode.toUpperCase()} Mode)`);
    } catch (e) {
      console.error('Failed to generate revision:', e);
      triggerToast('Error generating revision. Fallback loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (mode: SmartRevisionMode) => {
    setSelectedMode(mode);
    if (mode === 'custom') {
      setIsCustomModalOpen(true);
    } else {
      generateRevision(mode);
    }
  };

  // Handle MCQ Selection
  const handleSelectMcqOption = (mcqId: string, optionIndex: number) => {
    setMcqAnswers((prev) => ({
      ...prev,
      [mcqId]: optionIndex,
    }));
  };

  // Finish Revision & Sync Progress
  const handleFinishRevision = () => {
    if (!activeSheet) return;

    const timeSpentSeconds = Math.max(20, Math.floor((Date.now() - sessionStartTime) / 1000));
    const totalMcqs = activeSheet.quickMcqs.length;
    let mcqsCorrectCount = 0;
    let mcqsAnsweredCount = Object.keys(mcqAnswers).length;

    activeSheet.quickMcqs.forEach((mcq) => {
      if (mcqAnswers[mcq.id] === mcq.correctIndex) {
        mcqsCorrectCount += 1;
      }
    });

    const summary = SmartRevisionService.completeRevisionSession({
      sheet: activeSheet,
      cardsReviewedCount: activeSheet.flashcards.length,
      cardsLearnedCount: cardsLearnedCount || Math.ceil(activeSheet.flashcards.length * 0.75),
      mcqsAnsweredCount,
      mcqsCorrectCount,
      timeSpentSeconds,
      profile,
    });

    setSessionSummary(summary);
    setIsSummaryOpen(true);
    setSavedSheets(SmartRevisionService.getSavedSheets());
    setHistoryItems(SmartRevisionService.getHistory());
    setDueSheets(SmartRevisionService.getDueRevisionSheets());
  };

  // Interconnection Handlers
  const handleSaveToNotes = () => {
    if (!activeSheet) return;
    const note = SmartRevisionService.exportRevisionToNote(activeSheet);
    triggerToast(`Saved "${note.title}" to My Notes!`);
  };

  const handleLaunchQuiz = () => {
    if (!activeSheet) return;
    const quiz = SmartRevisionService.createQuizFromRevision(activeSheet);
    triggerToast(`Created practice quiz from revision!`);
    onNavigate('quiz');
  };

  const handleSpeakSummary = (text: string) => {
    if (isSpeakingSummary) {
      voiceService.stop();
      setIsSpeakingSummary(false);
    } else {
      setIsSpeakingSummary(true);
      voiceService.speak(text, 'en', () => {
        setIsSpeakingSummary(false);
      });
    }
  };

  const handleCopyPoint = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyPointIdx(index);
    setTimeout(() => setCopiedKeyPointIdx(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed bottom-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <p className="text-xs sm:text-sm font-medium">{notificationToast}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-700/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs border border-white/10">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Smart Revision Hub • Spaced Active Recall</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Smart Revision Engine
            </h1>
            <p className="text-sm text-indigo-200 max-w-2xl leading-relaxed">
              Master formulas, key definitions, active recall flashcards, and diagnostic MCQs
              engineered for Class {profile.classLevel} {profile.board} board exam readiness.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 self-start md:self-auto">
            <div className="p-2.5 rounded-xl bg-indigo-500/30 text-indigo-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-indigo-200 font-medium">Spaced Retention</div>
              <div className="text-base font-bold text-white flex items-center gap-1.5">
                {activeSheet ? `${activeSheet.masteryScore}% Mastery` : 'Ready to Revise'}
                {activeSheet && (
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    Stage {activeSheet.spacedRepetitionStage}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Due Today Spaced Repetition Alert (If Any) */}
      {dueSheets.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                Daily Spaced Revision Due: {dueSheets[0].sheet.title}
                <span className="text-2xs px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold">
                  Memory Retention Stage {dueSheets[0].stage}
                </span>
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Scheduled by Ebbinghaus forgetting curve algorithm to reinforce neural pathways.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveSheet(dueSheets[0].sheet);
              setSelectedMode('daily');
              triggerToast(`Loaded Spaced Revision for ${dueSheets[0].sheet.title}`);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-xs"
          >
            <Play className="w-3.5 h-3.5" />
            Start Daily Due Revision
          </button>
        </div>
      )}

      {/* 7 Revision Mode Selector Rail */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            Choose Smart Revision Mode
          </h3>
          <span className="text-xs text-slate-400">7 Adaptive High-Yield Modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {REVISION_MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                      {mode.icon}
                    </div>
                    <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {mode.duration}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                    {mode.label}
                  </h4>
                  <p className="text-3xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                    {mode.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-3xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>{mode.badge}</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Revision Sheet Workspace */}
      {isLoading ? (
        <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 animate-pulse">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Generating Smart Revision Sheet...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Extracting high-yield definitions, formula cheat sheets, active recall flashcards, and
            exam question blueprints.
          </p>
        </div>
      ) : activeSheet ? (
        <div className="space-y-4">
          {/* Sheet Title Bar & Action Ribbon */}
          <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {activeSheet.subject}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activeSheet.chapter}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 uppercase">
                  {activeSheet.mode}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {activeSheet.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {activeSheet.subtitle}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
              {/* Revision Mode Trigger (Flashcards Player) */}
              <button
                onClick={() => setIsPlayerOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Revision Mode ({activeSheet.flashcards.length} Cards)</span>
              </button>

              {/* Complete & Sync Progress */}
              <button
                onClick={handleFinishRevision}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finish & Sync Progress</span>
              </button>
            </div>
          </div>

          {/* Interconnection Hub Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Connect with your study ecosystem:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveToNotes}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                Save to Notes
              </button>

              <button
                onClick={handleLaunchQuiz}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                Test with Practice Quiz
              </button>

              <button
                onClick={() => onNavigate('exam-mode')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                Revise in Exam Mode
              </button>

              <button
                onClick={() => onNavigate('study-planner')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Study Planner
              </button>

              <button
                onClick={() => onNavigate('progress')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                View Mastery Progress
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('key_points')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'key_points'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              Key Points & Summary ({activeSheet.keyPoints.length})
            </button>

            <button
              onClick={() => setActiveTab('definitions_formulas')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'definitions_formulas'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Definitions ({activeSheet.definitions.length}) & Formulas (
              {activeSheet.formulas.length})
            </button>

            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'flashcards'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Revision Mode Cards ({activeSheet.flashcards.length})
            </button>

            <button
              onClick={() => setActiveTab('mcqs')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'mcqs'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Diagnostic MCQs ({activeSheet.quickMcqs.length})
            </button>

            <button
              onClick={() => setActiveTab('practice_questions')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'practice_questions'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Exam Practice ({activeSheet.practiceQuestions.length})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              Revision History ({historyItems.length})
            </button>
          </div>

          {/* TAB 1: Key Points & Summary */}
          {activeTab === 'key_points' && (
            <div className="space-y-5 animate-fade-in">
              {/* Executive Summary Card */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Executive Conceptual Summary
                  </span>
                  <button
                    onClick={() => handleSpeakSummary(activeSheet.summary)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-medium"
                  >
                    {isSpeakingSummary ? (
                      <VolumeX className="w-4 h-4 text-rose-500 animate-pulse" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    <span>{isSpeakingSummary ? 'Stop Reading' : 'Listen'}</span>
                  </button>
                </div>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeSheet.summary}
                </p>
              </div>

              {/* High-Yield Key Points Bullets */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  High-Yield Core Takeaways
                </h3>

                <div className="space-y-3">
                  {activeSheet.keyPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-start justify-between gap-3 group hover:border-indigo-400 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                          {point}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCopyPoint(point, idx)}
                        className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all shrink-0"
                        title="Copy Key Point"
                      >
                        {copiedKeyPointIdx === idx ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Short Explanations & Exam Tips */}
              {activeSheet.shortExplanations && activeSheet.shortExplanations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSheet.shortExplanations.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                          {item.concept}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                          {item.explanation}
                        </p>
                      </div>

                      {item.examTip && (
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 font-medium">
                          💡 <strong>Exam Tip:</strong> {item.examTip}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Definitions & Formulas */}
          {activeTab === 'definitions_formulas' && (
            <div className="space-y-6 animate-fade-in">
              {/* Formulas Cheat Sheet */}
              {activeSheet.formulas && activeSheet.formulas.length > 0 && (
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Essential Formulas & Equations Cheat Sheet
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSheet.formulas.map((form) => (
                      <div
                        key={form.id}
                        className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                            {form.name}
                          </span>
                          <div className="my-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/40 text-center font-mono font-bold text-base sm:text-lg text-indigo-950 dark:text-indigo-200 select-all">
                            {form.formula}
                          </div>

                          {form.variablesExplanation && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                              <strong>Variables:</strong> {form.variablesExplanation}
                            </p>
                          )}
                        </div>

                        {form.commonMistakeAlert && (
                          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-2xs text-rose-900 dark:text-rose-300 font-medium mt-2">
                            ⚠️ <strong>Common Trap:</strong> {form.commonMistakeAlert}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Definitions Glossary */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Crucial Definitions & Terminology
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSheet.definitions.map((def) => (
                    <div
                      key={def.id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1.5 flex items-center justify-between">
                        {def.term}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2.5">
                        {def.definition}
                      </p>

                      {def.keyKeywords && def.keyKeywords.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className="text-3xs font-semibold text-slate-400 uppercase">
                            Keywords:
                          </span>
                          {def.keyKeywords.map((kw, i) => (
                            <span
                              key={i}
                              className="text-2xs px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}

                      {def.example && (
                        <p className="text-2xs text-slate-500 dark:text-slate-400 italic">
                          <strong>Example:</strong> {def.example}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Flashcards (Revision Mode Cards Grid) */}
          {activeTab === 'flashcards' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-indigo-500" />
                    Active Recall Flashcard Deck
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click "Launch Revision Mode" for the full card-by-card player with flip reveal
                    and voice readout.
                  </p>
                </div>

                <button
                  onClick={() => setIsPlayerOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all shrink-0"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Launch Interactive Player
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSheet.flashcards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Card #{idx + 1} • {card.difficulty || 'Concept'}
                        </span>
                        {card.isLearned && (
                          <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Learned
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed mb-3">
                        {card.question}
                      </h4>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed mb-2">
                        <strong>Answer:</strong> {card.answer}
                      </div>

                      <p className="text-2xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {card.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Diagnostic Quick MCQs */}
          {activeTab === 'mcqs' && (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-500" />
                    Quick Diagnostic MCQs
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Test conceptual understanding instantly. Receive immediate feedback with
                    detailed explanations.
                  </p>
                </div>

                <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Answered: {Object.keys(mcqAnswers).length} / {activeSheet.quickMcqs.length}
                </div>
              </div>

              <div className="space-y-6">
                {activeSheet.quickMcqs.map((mcq, qIdx) => {
                  const selected = mcqAnswers[mcq.id];
                  const hasAnswered = selected !== undefined;
                  const isCorrect = selected === mcq.correctIndex;

                  return (
                    <div
                      key={mcq.id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850 space-y-3"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed">
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold mr-2">
                          Q{qIdx + 1}.
                        </span>
                        {mcq.question}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {mcq.options.map((option, optIdx) => {
                          const isThisSelected = selected === optIdx;
                          const isThisCorrect = optIdx === mcq.correctIndex;

                          let btnStyle =
                            'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400';
                          if (hasAnswered) {
                            if (isThisCorrect) {
                              btnStyle =
                                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold';
                            } else if (isThisSelected && !isCorrect) {
                              btnStyle =
                                'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
                            } else {
                              btnStyle = 'opacity-50 border-slate-200 dark:border-slate-800';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={hasAnswered}
                              onClick={() => handleSelectMcqOption(mcq.id, optIdx)}
                              className={`p-3 rounded-xl border text-xs sm:text-sm text-left flex items-center justify-between gap-2 transition-all ${btnStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-3xs font-bold shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{option}</span>
                              </div>
                              {hasAnswered && isThisCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Immediate Explanation */}
                      {hasAnswered && (
                        <div
                          className={`p-3.5 rounded-xl border text-xs leading-relaxed animate-fade-in ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-300'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-300'
                          }`}
                        >
                          <strong>{isCorrect ? '✅ Correct!' : '❌ Incorrect.'}</strong>{' '}
                          {mcq.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: Exam Practice Questions */}
          {activeTab === 'practice_questions' && (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                  Subjective Board Exam Questions & Model Marking Schemes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Practice high-frequency 2-mark, 3-mark, and 5-mark subjective questions with exact
                  key points required by examiners.
                </p>
              </div>

              <div className="space-y-6">
                {activeSheet.practiceQuestions.map((pq, idx) => (
                  <div
                    key={pq.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        Question #{idx + 1}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        {pq.marks} Marks • {pq.difficulty || 'Medium'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed">
                      {pq.question}
                    </h4>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      <div className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                        Model Answer:
                      </div>
                      {pq.sampleAnswer}
                    </div>

                    {pq.keyPointsToInclude && pq.keyPointsToInclude.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <div className="text-2xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Essential Key Points for Full
                          Marks:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-2xs sm:text-xs text-slate-700 dark:text-slate-300">
                          {pq.keyPointsToInclude.map((kp, kIdx) => (
                            <li key={kIdx}>{kp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: History & Past Revision Sessions */}
          {activeTab === 'history' && (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 animate-fade-in">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Smart Revision History & Spaced Schedules
              </h3>

              {historyItems.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  No revision sessions completed yet. Finish a session above to record history!
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.title}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{item.completedAt}</span>
                          <span>•</span>
                          <span className="uppercase font-semibold text-indigo-600 dark:text-indigo-400">
                            {item.mode}
                          </span>
                          <span>•</span>
                          <span>{item.subject}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                          {item.masteryScore}% Mastery
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                          +{item.xpEarned} XP
                        </span>
                        <span className="text-slate-400 text-3xs">
                          Next due: {item.nextDueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Revision Mode Card-by-Card Player Modal */}
      {activeSheet && (
        <RevisionPlayerModal
          sheet={activeSheet}
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          onComplete={(learned, total) => {
            setCardsLearnedCount(learned);
            setIsPlayerOpen(false);
            triggerToast(`Completed Revision Mode! ${learned}/${total} cards mastered.`);
          }}
        />
      )}

      {/* Post-Revision Summary Celebration Modal */}
      <RevisionSummaryModal
        summary={sessionSummary}
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onSaveAsNote={handleSaveToNotes}
        onTakeQuiz={handleLaunchQuiz}
        onGoToPlanner={() => onNavigate('study-planner')}
      />

      {/* Custom Revision Creator Modal */}
      <CustomRevisionModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onGenerate={(data) => {
          generateRevision('custom', data);
        }}
        classLevel={profile.classLevel}
        board={profile.board}
        selectedSubjects={profile.selectedSubjects || ['Science', 'Mathematics', 'Social Science']}
      />
    </div>
  );
};
