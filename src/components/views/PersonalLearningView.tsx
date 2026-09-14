import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  Target,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Camera,
  Calendar,
  Clock,
  Zap,
  TrendingUp,
  BookOpen,
  BookMarked,
  HelpCircle,
  GraduationCap,
  FileText,
  MessageSquareText,
  ChevronRight,
  Filter,
  Check,
  X,
  Flame,
  Award,
  Layers,
  ArrowRight,
  RefreshCw,
  Info,
  Lightbulb,
  Play,
  CheckCircle,
  BarChart3,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import {
  StudentProfile,
  NavigationSection,
  RecommendationItem,
  PersonalLearningSystemData,
  WeakTopic,
  StrongTopic,
  Quiz,
  Exam,
  StudyPlan,
  SavedNote,
  ActivityLog,
  AdaptiveTopic,
  AdaptiveLearningPath,
  TopicMasteryStatus,
  AdaptiveDifficultyLevel,
} from '../../types';
import { StorageService } from '../../services/storageService';
import { AiService } from '../../services/aiService';
import { AdaptiveLearningService } from '../../services/adaptiveLearningService';
import { getTranslation, LanguageCode } from '../../i18n/translations';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { AdaptivePracticeModal } from './AdaptivePracticeModal';
import { SmartPracticeModal } from './SmartPracticeModal';
import { SmartPracticeMode, SmartPracticeSessionSummary } from '../../types';

interface PersonalLearningViewProps {
  profile: StudentProfile;
  onNavigate: (section: NavigationSection) => void;
  onNavigateToAi?: (prompt: string) => void;
  lang?: LanguageCode;
}

export const PersonalLearningView: React.FC<PersonalLearningViewProps> = ({
  profile,
  onNavigate,
  onNavigateToAi,
  lang = 'en',
}) => {
  // Main view mode: 'smart_practice' | 'adaptive_path' | 'recommendations'
  const [viewMode, setViewMode] = useState<'smart_practice' | 'adaptive_path' | 'recommendations'>('smart_practice');

  // Smart Practice Modal State
  const [smartPracticeOpen, setSmartPracticeOpen] = useState<boolean>(false);
  const [smartPracticeMode, setSmartPracticeMode] = useState<SmartPracticeMode>('daily');
  const [smartPracticeSubject, setSmartPracticeSubject] = useState<string>(
    profile.selectedSubjects?.[0] || 'Science'
  );
  const [smartPracticeTopic, setSmartPracticeTopic] = useState<string>('');
  const [smartPracticeChapter, setSmartPracticeChapter] = useState<string>('');

  // Daily Smart Practice XP Anti-Farming Progress
  const [dailyPracticeXp, setDailyPracticeXp] = useState<number>(() => {
    const todayKey = `eduai_smart_practice_daily_xp_${new Date().toISOString().split('T')[0]}`;
    return parseInt(localStorage.getItem(todayKey) || '0', 10);
  });

  // Adaptive Learning Path State
  const [adaptivePath, setAdaptivePath] = useState<AdaptiveLearningPath | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    profile.selectedSubjects?.[0] || 'Science'
  );
  const [pathLoading, setPathLoading] = useState<boolean>(true);
  const [pathRefreshing, setPathRefreshing] = useState<boolean>(false);
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'Beginner' | 'Learning' | 'Practicing' | 'Strong'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Adaptive Practice Modal State
  const [practiceModalOpen, setPracticeModalOpen] = useState<boolean>(false);
  const [practiceTopic, setPracticeTopic] = useState<AdaptiveTopic | null>(null);

  // Simple concept breakdown accordion for current topic
  const [showCurrentConcept, setShowCurrentConcept] = useState<boolean>(false);

  // Recommendations State (Step 17)
  const [learningData, setLearningData] = useState<PersonalLearningSystemData | null>(null);
  const [recsLoading, setRecsLoading] = useState<boolean>(true);
  const [recsRefreshing, setRecsRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'focus' | 'revise' | 'practice' | 'exam' | 'goals'>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Load on mount and on subject change
  useEffect(() => {
    loadAdaptivePath(selectedSubject, false);
    loadRecommendations(false);
    setDismissedIds(StorageService.getDismissedRecommendationIds());
    setAcceptedIds(StorageService.getAcceptedRecommendationIds());
  }, [profile.classLevel, selectedSubject, profile.preferredLanguage, lang]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Adaptive Path from AdaptiveLearningService (using real student data)
  const loadAdaptivePath = async (subject: string, forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setPathRefreshing(true);
    } else {
      setPathLoading(true);
    }

    try {
      const weakTopics = StorageService.getWeakTopics();
      const strongTopics = StorageService.getStrongTopics();
      const quizResults = StorageService.getSavedQuizzes();
      const examResults = StorageService.getSavedExams();
      const studyPlan = StorageService.getStudyPlan();
      const activities = StorageService.getActivities();

      const res = await AdaptiveLearningService.getAdaptiveLearningPath(
        {
          profile,
          selectedSubject: subject,
          weakTopics,
          strongTopics,
          quizResults,
          examResults,
          studyHistory: activities,
          studyGoals: profile.learningGoals,
          language: lang || profile.preferredLanguage || 'en',
        },
        forceRefresh
      );

      setAdaptivePath(res.path);

      if (forceRefresh) {
        showToast(
          lang === 'hi'
            ? `AI अनुकूली शिक्षण पथ को ${subject} के नए टेस्ट डेटा के साथ रीफ्रेश कर दिया गया है!`
            : `AI Adaptive Path for ${subject} recalibrated with your latest quiz and error logs!`
        );
      }
    } catch (err) {
      console.error('Failed to load adaptive path:', err);
    } finally {
      setPathLoading(false);
      setPathRefreshing(false);
    }
  };

  // Load Personalized Recommendations (Step 17)
  const loadRecommendations = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setRecsRefreshing(true);
    } else {
      setRecsLoading(true);
    }

    try {
      if (!forceRefresh) {
        const cached = StorageService.getPersonalLearningData();
        if (cached && cached.todaysFocus && cached.todaysFocus.length > 0) {
          setLearningData(cached);
          setRecsLoading(false);
          return;
        }
      }

      const weakTopics = StorageService.getWeakTopics();
      const strongTopics = StorageService.getStrongTopics();
      const quizResults = StorageService.getSavedQuizzes();
      const examResults = StorageService.getSavedExams();
      const studyPlan = StorageService.getStudyPlan();
      const savedNotes = StorageService.getSavedNotes();
      const activities = StorageService.getActivities();

      const result = await AiService.generatePersonalRecommendations({
        profile,
        weakTopics,
        strongTopics,
        quizResults,
        examResults,
        studyPlan,
        savedNotes,
        activities,
        language: lang || profile.preferredLanguage || 'en',
      });

      setLearningData(result.recommendations);
      StorageService.savePersonalLearningData(result.recommendations);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setRecsLoading(false);
      setRecsRefreshing(false);
    }
  };

  const handleStartPractice = (topic: AdaptiveTopic) => {
    setPracticeTopic(topic);
    setPracticeModalOpen(true);
  };

  const handleUpdatePath = (updatedPath: AdaptiveLearningPath) => {
    setAdaptivePath(updatedPath);
  };

  const handleAccept = (item: RecommendationItem) => {
    StorageService.acceptRecommendation(item.id, item);
    setAcceptedIds((prev) => [...prev, item.id]);
    showToast(
      lang === 'hi'
        ? `"${item.title}" को आपके स्टडी प्लान में जोड़ दिया गया (+10 XP)!`
        : `"${item.title}" added to your Today's Study Plan (+10 XP)!`
    );
  };

  const handleDismiss = (id: string) => {
    StorageService.dismissRecommendation(id);
    setDismissedIds((prev) => [...prev, id]);
    showToast(lang === 'hi' ? 'सिफारिश हटा दी गई है।' : 'Recommendation dismissed.', 'info');
  };

  const handleAction = (item: RecommendationItem) => {
    if (item.actionType === 'navigate_quiz') {
      onNavigate('quiz');
    } else if (item.actionType === 'navigate_notes') {
      onNavigate('notes');
    } else if (item.actionType === 'navigate_exam') {
      onNavigate('exam-mode');
    } else if (item.actionType === 'navigate_paper') {
      onNavigate('paper-generator');
    } else if (item.actionType === 'navigate_books') {
      onNavigate('books');
    } else if (item.actionType === 'navigate_ask_ai') {
      if (onNavigateToAi && item.actionPayload?.prompt) {
        onNavigateToAi(item.actionPayload.prompt);
      } else if (onNavigateToAi && item.chapterTopic) {
        onNavigateToAi(`Explain ${item.chapterTopic} in detail with formula shortcuts for Class ${profile.classLevel}.`);
      } else {
        onNavigate('ask-ai');
      }
    }
  };

  // Status Badge Colors helper
  const getStatusBadge = (status: TopicMasteryStatus) => {
    switch (status) {
      case 'Beginner':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            🔴 Beginner
          </span>
        );
      case 'Learning':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            🟡 Learning
          </span>
        );
      case 'Practicing':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            🔵 Practicing
          </span>
        );
      case 'Strong':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            🟢 Strong
          </span>
        );
    }
  };

  // Difficulty Tier styling
  const getDifficultyBadge = (tier: AdaptiveDifficultyLevel) => {
    if (tier.includes('HOTS')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300';
    }
    if (tier.includes('Advanced')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300';
    }
    if (tier.includes('Standard')) {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300';
    }
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300';
  };

  // Filtered topics for the roadmap/matrix
  const filteredTopics = adaptivePath?.topics.filter((t) => {
    const matchesFilter = masteryFilter === 'all' || t.status === masteryFilter;
    const matchesSearch =
      searchQuery === '' ||
      t.topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.chapterName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  // Helper to render recommendation cards (Step 17)
  const renderRecommendationCard = (item: RecommendationItem, badgeCategory: string, badgeColor: string) => {
    const isDismissed = dismissedIds.includes(item.id);
    const isAccepted = acceptedIds.includes(item.id);

    if (isDismissed) return null;

    return (
      <Card
        key={item.id}
        className={`relative overflow-hidden transition-all duration-200 border ${
          isAccepted
            ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20'
            : item.priority === 'High'
            ? 'border-indigo-200 hover:border-indigo-400 dark:border-indigo-900/60 dark:hover:border-indigo-700 bg-white dark:bg-slate-900'
            : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900'
        } p-5 rounded-2xl shadow-xs hover:shadow-md`}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${badgeColor}`}>
              {badgeCategory}
            </span>
            <Badge variant="outline" className="text-xs font-semibold">
              {item.subject}
            </Badge>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                item.recommendedDifficulty === 'Hard'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  : item.recommendedDifficulty === 'Medium'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {item.recommendedDifficulty}
            </span>
          </div>

          <button
            onClick={() => handleDismiss(item.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={getTranslation(lang, 'dismissRecommendation')}
            aria-label="Dismiss recommendation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1 leading-snug">
          {item.title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {item.subtitle}
        </p>

        <div className="mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 p-3 text-xs space-y-2 border border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
            <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {getTranslation(lang, 'whyRecommended')}{' '}
              </span>
              <span>{item.reason}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {getTranslation(lang, 'dataTriggerLabel')}{' '}
            </span>
            <span className="bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-mono text-[10px]">
              {item.dataTrigger}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{item.estimatedMinutes} min</span>
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>+{item.xpReward} XP</span>
            </span>
          </div>
          {item.priority === 'High' && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded">
              High Priority
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            size="sm"
            onClick={() => handleAction(item)}
            className="flex-1 justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-semibold"
          >
            <span>{item.actionLabel}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {isAccepted ? (
            <div className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Check className="h-3.5 w-3.5" />
              <span>{getTranslation(lang, 'acceptedBadge')}</span>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAccept(item)}
              className="justify-center gap-1 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 text-xs"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{getTranslation(lang, 'acceptRecommendation')}</span>
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
          <button
            onClick={() => setViewMode('smart_practice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'smart_practice'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Smart Practice</span>
          </button>

          <button
            onClick={() => setViewMode('adaptive_path')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'adaptive_path'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>AI Adaptive Path</span>
          </button>

          <button
            onClick={() => setViewMode('recommendations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'recommendations'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Personalized Recommendations</span>
          </button>
        </div>

        {/* Subject Selector */}
        {(viewMode === 'adaptive_path' || viewMode === 'smart_practice') && (
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden md:inline">
              Subject:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {(profile.selectedSubjects || ['Science', 'Mathematics', 'Social Science']).map((sub) => (
                <button
                  key={sub}
                  onClick={() => {
                    setSelectedSubject(sub);
                    setSmartPracticeSubject(sub);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    (viewMode === 'smart_practice' ? smartPracticeSubject : selectedSubject) === sub
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE 0: SMART PRACTICE HUB (NEW)                                          */}
      {/* ========================================================================= */}
      {viewMode === 'smart_practice' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Smart Practice Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
                  <Zap className="h-3.5 w-3.5 text-amber-400 fill-current animate-pulse" />
                  <span>AI Smart Practice Engine • Class {profile.classLevel} ({profile.board})</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Intelligent Smart Practice
                </h1>

                <p className="text-sm text-indigo-100/90 leading-relaxed">
                  Personalized daily questions, dynamic adaptive difficulty, mistake-based remedial practice, and rapid revision drills calibrated directly from your study history and test accuracy.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg backdrop-blur-xs font-medium">
                    Subject: {smartPracticeSubject}
                  </span>
                  <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg backdrop-blur-xs font-medium flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-amber-400 fill-current" />
                    {profile.streakDays} Day Streak
                  </span>
                  <span className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 px-3 py-1 rounded-lg backdrop-blur-xs font-medium">
                    Anti-Repetition Engine Active
                  </span>
                </div>
              </div>

              {/* Daily Practice XP Anti-Farming Progress Card */}
              <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-md shrink-0 space-y-3 w-full lg:w-72">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-200">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Daily Practice XP</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-300">
                    {dailyPracticeXp} / 250 XP
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/10">
                  <div
                    className="bg-linear-to-r from-indigo-400 to-amber-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (dailyPracticeXp / 250) * 100)}%` }}
                  />
                </div>

                <p className="text-[11px] text-indigo-200/70 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Anti-farming XP guard active
                </p>

                <Button
                  onClick={() => {
                    setSmartPracticeMode('daily');
                    setSmartPracticeOpen(true);
                  }}
                  className="w-full justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold shadow-md active:scale-95 text-xs"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start Today's Daily Practice</span>
                </Button>
              </div>
            </div>
          </div>

          {/* SMART PRACTICE MODES GRID (8 MODES) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Select Practice Mode
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose a targeted practice format tailored to your current learning goal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Personalized Daily Questions */}
              <Card className="p-5 border border-indigo-200/80 dark:border-indigo-900/60 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <Badge variant="indigo" size="sm">
                      CURATED DAILY
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    Personalized Daily Questions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    5 high-yield daily curriculum questions selected based on your class syllabus, goals, and daily streak.
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ~5 mins
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Zap className="w-3.5 h-3.5 fill-current" /> +35 XP
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                    onClick={() => {
                      setSmartPracticeMode('daily');
                      setSmartPracticeOpen(true);
                    }}
                  >
                    Start Daily Practice
                  </Button>
                </div>
              </Card>

              {/* 2. Adaptive Difficulty Practice */}
              <Card className="p-5 border border-purple-200/80 dark:border-purple-900/60 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <Badge variant="purple" size="sm">
                      MULTI-TIER AI
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    Adaptive Difficulty
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    Dynamic leveling from Foundation to HOTS. Scales up on consecutive wins or steps down for remediation.
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ~6 mins
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Zap className="w-3.5 h-3.5 fill-current" /> +45 XP
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
                    onClick={() => {
                      setSmartPracticeMode('adaptive');
                      setSmartPracticeOpen(true);
                    }}
                  >
                    Start Adaptive Practice
                  </Button>
                </div>
              </Card>

              {/* 3. Spaced Repetition Revision */}
              <Card className="p-5 border border-blue-200/80 dark:border-blue-900/60 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <Badge variant="blue" size="sm">
                      SPACED REPETITION
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    Revision Questions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    Systematic spaced review of previously mastered concepts to prevent memory decay and keep formulas fresh.
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ~5 mins
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Zap className="w-3.5 h-3.5 fill-current" /> +30 XP
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                    onClick={() => {
                      setSmartPracticeMode('revision');
                      setSmartPracticeOpen(true);
                    }}
                  >
                    Start Revision
                  </Button>
                </div>
              </Card>

              {/* 4. Mistake-Based Practice */}
              <Card className="p-5 border border-rose-200/80 dark:border-rose-900/60 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <Badge variant="rose" size="sm">
                      MISTAKE FIXER
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                    Mistake-Based Practice
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    Questions targeting your specific past test errors, sign-convention traps, and misconception logs.
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ~5 mins
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Zap className="w-3.5 h-3.5 fill-current" /> +40 XP
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full justify-center bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
                    onClick={() => {
                      setSmartPracticeMode('mistake_fix');
                      setSmartPracticeOpen(true);
                    }}
                  >
                    Fix Past Mistakes
                  </Button>
                </div>
              </Card>

              {/* 5. Weak-Topic Practice */}
              <Card className="p-5 border border-amber-200/80 dark:border-amber-900/60 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <Target className="w-5 h-5" />
                    </div>
                    <Badge variant="amber" size="sm">
                      TARGETED REMEDIAL
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                    Weak-Topic Practice
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    Deep dive into topics where your accuracy is below 60%, with step-by-step hints and guided solutions.
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ~6 mins
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Zap className="w-3.5 h-3.5 fill-current" /> +35 XP
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full justify-center bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
                    onClick={() => {
                      setSmartPracticeMode('weak_topic');
                      setSmartPracticeOpen(true);
                    }}
                  >
                    Target Weak Topics
                  </Button>
                </div>
              </Card>

              {/* 6. Concept-Based Questions */}
              <Card className="p-5 border border-emerald-200/80 dark:border-emerald-900/60 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <Badge variant="emerald" size="sm">
                      CONCEPT REASONING
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    Concept-Based Questions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    Questions structured to test fundamental definitions, core theoretical mechanisms, and reasoning proofs.
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ~5 mins
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Zap className="w-3.5 h-3.5 fill-current" /> +30 XP
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                    onClick={() => {
                      setSmartPracticeMode('concept');
                      setSmartPracticeOpen(true);
                    }}
                  >
                    Practice Concepts
                  </Button>
                </div>
              </Card>

              {/* 7. Mixed Practice */}
              <Card className="p-5 border border-cyan-200/80 dark:border-cyan-900/60 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                      <Layers className="w-5 h-5" />
                    </div>
                    <Badge variant="blue" size="sm">
                      CROSS-CHAPTER
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">
                    Mixed Practice
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    Cross-chapter integrated questions blending physics, chemistry, biology, or multi-topic math problems.
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ~6 mins
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Zap className="w-3.5 h-3.5 fill-current" /> +35 XP
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs"
                    onClick={() => {
                      setSmartPracticeMode('mixed');
                      setSmartPracticeOpen(true);
                    }}
                  >
                    Start Mixed Practice
                  </Button>
                </div>
              </Card>

              {/* 8. Quick 5-Question Practice */}
              <Card className="p-5 border border-indigo-300 dark:border-indigo-800 bg-linear-to-br from-indigo-50/50 via-white to-indigo-50/20 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                      <Flame className="w-5 h-5 fill-current" />
                    </div>
                    <Badge variant="indigo" size="sm">
                      SPEED BLITZ
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    Quick 5-Question Blitz
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    Rapid 3-minute challenge with high-frequency Board exam questions. Perfect for quick study sprints!
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                      <Clock className="w-3.5 h-3.5" /> 3 mins (Blitz)
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Zap className="w-3.5 h-3.5 fill-current" /> +30 XP
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                    onClick={() => {
                      setSmartPracticeMode('quick_5');
                      setSmartPracticeOpen(true);
                    }}
                  >
                    Launch 5-Q Blitz ⚡
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Cross-System Integration Quick Action Grid */}
          <div className="p-6 rounded-3xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Smart Practice System Connections
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Seamlessly jump between practice results and EduAI Master learning tools
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              <button
                onClick={() => onNavigate('ask-ai')}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-center space-y-1.5 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                  <MessageSquareText className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">AI Teacher</span>
              </button>

              <button
                onClick={() => onNavigate('photo-solver')}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-center space-y-1.5 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">Photo Solver</span>
              </button>

              <button
                onClick={() => onNavigate('notes')}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-center space-y-1.5 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">Notes</span>
              </button>

              <button
                onClick={() => onNavigate('quiz')}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-center space-y-1.5 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">Quiz Mode</span>
              </button>

              <button
                onClick={() => onNavigate('exam-mode')}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-center space-y-1.5 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">Exam Mode</span>
              </button>

              <button
                onClick={() => onNavigate('study-planner')}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-center space-y-1.5 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">Planner</span>
              </button>

              <button
                onClick={() => onNavigate('progress')}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-center space-y-1.5 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">Progress</span>
              </button>

              <button
                onClick={() => onNavigate('achievements')}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-center space-y-1.5 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">Badges & XP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: AI ADAPTIVE LEARNING SYSTEM & PATH                                 */}
      {/* ========================================================================= */}
      {viewMode === 'adaptive_path' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hero / Adaptive System Overview */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
                  <Compass className="h-3.5 w-3.5 text-indigo-300" />
                  <span>Real-Time AI Adaptive Learning System</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {selectedSubject} Adaptive Mastery Path
                </h1>

                <p className="text-sm text-indigo-100/90 leading-relaxed">
                  Automatically tailored to your Class {profile.classLevel} ({profile.board}) accuracy, weak topics, exam mistakes, and study velocity. Practice dynamically scales difficulty as you learn.
                </p>

                {/* Real Data Calibration Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg backdrop-blur-xs font-medium">
                    Class {profile.classLevel} • {profile.board}
                  </span>
                  <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg backdrop-blur-xs font-medium flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-amber-400 fill-current" />
                    {profile.streakDays} Day Streak
                  </span>
                  <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3 py-1 rounded-lg backdrop-blur-xs font-medium">
                    {adaptivePath?.strongTopicsCount || 0} Strong Topics
                  </span>
                  <span className="bg-amber-500/20 border border-amber-400/30 text-amber-200 px-3 py-1 rounded-lg backdrop-blur-xs font-medium">
                    {adaptivePath?.strugglingTopicsCount || 0} In Progress
                  </span>
                </div>
              </div>

              {/* Subject Mastery Gauge & Refresh */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-md shrink-0">
                <div className="text-center">
                  <span className="text-xs uppercase tracking-wider text-indigo-200 font-bold block mb-1">
                    Overall Subject Mastery
                  </span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-300">
                      {adaptivePath?.overallMasteryPercentage || 68}%
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-200/80">
                    Difficulty Tier: {adaptivePath?.activeDifficultyTier || 'Level 2 - Standard'}
                  </span>
                </div>

                <Button
                  onClick={() => loadAdaptivePath(selectedSubject, true)}
                  disabled={pathRefreshing}
                  className="w-full justify-center gap-2 bg-white text-indigo-950 hover:bg-indigo-50 font-bold shadow-md active:scale-95 text-xs"
                >
                  <RefreshCw className={`h-4 w-4 ${pathRefreshing ? 'animate-spin' : ''}`} />
                  <span>Recalibrate Path</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Diagnostic Insight Callout */}
          {adaptivePath?.recentAssessmentInsight && (
            <Card className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                    AI Diagnostic Velocity Insight
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {adaptivePath.recentAssessmentInsight}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* DUAL SPOTLIGHT: CURRENT TOPIC & RECOMMENDED NEXT TOPIC */}
          {adaptivePath && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* 1. CURRENT ACTIVE TOPIC (7 Cols) */}
              <Card className="lg:col-span-7 p-6 border-2 border-indigo-500/40 dark:border-indigo-500/30 bg-white dark:bg-slate-900 rounded-3xl shadow-md space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Compass className="h-32 w-32 text-indigo-600" />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                        Current Focus Topic
                      </span>
                      {getStatusBadge(adaptivePath.currentTopic.status)}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      {adaptivePath.currentTopic.topicName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {adaptivePath.currentTopic.chapterName} • {adaptivePath.currentTopic.subjectName}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold border shrink-0 ${getDifficultyBadge(
                      adaptivePath.currentTopic.currentDifficulty
                    )}`}
                  >
                    {adaptivePath.currentTopic.currentDifficulty}
                  </span>
                </div>

                {/* Topic Mastery Progress Bar */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Topic Mastery: {adaptivePath.currentTopic.masteryPercentage}%</span>
                    <span className="text-slate-500 font-normal">
                      {adaptivePath.currentTopic.attemptsCount} test attempts • {adaptivePath.currentTopic.accuracyRate}% accuracy
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-indigo-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, adaptivePath.currentTopic.masteryPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Simple Concept Breakdown Toggle */}
                {adaptivePath.currentTopic.simpleExplanation && (
                  <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-200">
                      <span className="flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4 text-indigo-600" />
                        Simple Concept Overview
                      </span>
                      <button
                        onClick={() => setShowCurrentConcept((prev) => !prev)}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {showCurrentConcept ? 'Collapse' : 'Expand Rules →'}
                      </button>
                    </div>
                    {showCurrentConcept && (
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed pt-1 animate-in fade-in">
                        {adaptivePath.currentTopic.simpleExplanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Recent Mistakes if any */}
                {adaptivePath.currentTopic.recentMistakes && adaptivePath.currentTopic.recentMistakes.length > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Recent Mistake Logged: </span>
                      <span>{adaptivePath.currentTopic.recentMistakes[0]}</span>
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Button
                    onClick={() => handleStartPractice(adaptivePath.currentTopic)}
                    className="flex-1 justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 shadow-md rounded-2xl"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Start Adaptive Practice Session</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (onNavigateToAi) {
                        onNavigateToAi(
                          `Explain ${adaptivePath.currentTopic.topicName} with simple examples and formula derivations for Class ${profile.classLevel}.`
                        );
                      } else {
                        onNavigate('ask-ai');
                      }
                    }}
                    className="justify-center gap-1.5 border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-2xl"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Ask AI Tutor</span>
                  </Button>
                </div>
              </Card>

              {/* 2. RECOMMENDED NEXT TOPIC (5 Cols) */}
              <Card className="lg:col-span-5 p-6 border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Recommended Next Topic
                    </span>
                    {getStatusBadge(adaptivePath.recommendedNextTopic.status)}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {adaptivePath.recommendedNextTopic.topicName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {adaptivePath.recommendedNextTopic.chapterName}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Unlock Condition</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Reach ≥75% mastery on your current topic ({adaptivePath.currentTopic.topicName}) to advance.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Estimated Time: ~20 mins
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartPractice(adaptivePath.recommendedNextTopic)}
                    className="gap-1.5 border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <span>Preview & Practice</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC MASTERY ROADMAP & PROGRESS MATRIX                                   */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Mastery Progress & Adaptive Roadmap
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Syllabus topics calibrated into 4 difficulty stages based on your accuracy
                  </p>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {(['all', 'Beginner', 'Learning', 'Practicing', 'Strong'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setMasteryFilter(filterKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      masteryFilter === filterKey
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {filterKey === 'all' ? 'All Topics' : filterKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics by name, chapter, or formula..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Topic Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTopics.map((item) => (
                <Card
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    item.isCurrent
                      ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      {getStatusBadge(item.status)}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getDifficultyBadge(
                          item.currentDifficulty
                        )}`}
                      >
                        {item.currentDifficulty.split(' - ')[0]}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {item.topicName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.chapterName}
                      </p>
                    </div>

                    {/* Mini Mastery Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        <span>Mastery</span>
                        <span className="font-mono">{item.masteryPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.status === 'Strong'
                              ? 'bg-emerald-500'
                              : item.status === 'Practicing'
                              ? 'bg-indigo-500'
                              : item.status === 'Learning'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.max(5, item.masteryPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      {item.attemptsCount} attempts
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleStartPractice(item)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl gap-1"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Practice</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: PERSONALIZED RECOMMENDATIONS (STEP 17 VIEW)                        */}
      {/* ========================================================================= */}
      {viewMode === 'recommendations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Recommendations Header */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                  <span>{getTranslation(lang, 'appName')} AI Learning Engine</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {getTranslation(lang, 'personalLearningTitle')}
                </h1>

                <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
                  {getTranslation(lang, 'personalLearningSubtitle')}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                  <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg backdrop-blur-xs font-medium">
                    Class {profile.classLevel} • {profile.board}
                  </span>
                  <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg backdrop-blur-xs font-medium flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-amber-400 fill-current" />
                    {profile.streakDays} Day Streak
                  </span>
                  <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg backdrop-blur-xs font-medium flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-indigo-300" />
                    Level {profile.level} ({profile.xp} XP)
                  </span>
                </div>
              </div>

              {/* Readiness Score & Refresh Controls */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-md shrink-0">
                <div className="text-center">
                  <span className="text-xs uppercase tracking-wider text-indigo-200 font-bold block mb-1">
                    {getTranslation(lang, 'readinessScore')}
                  </span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-300">
                      {learningData?.readinessScore || 85}
                    </span>
                    <span className="text-lg text-indigo-200 font-semibold">/100</span>
                  </div>
                  <span className="text-[11px] text-indigo-200/80">
                    Calibrated against {profile.board} Board syllabus
                  </span>
                </div>

                <Button
                  onClick={() => loadRecommendations(true)}
                  disabled={recsRefreshing}
                  className="w-full justify-center gap-2 bg-white text-indigo-950 hover:bg-indigo-50 font-bold shadow-md active:scale-95 text-xs"
                >
                  <RefreshCw className={`h-4 w-4 ${recsRefreshing ? 'animate-spin' : ''}`} />
                  <span>{getTranslation(lang, 'refreshRecommendations')}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {getTranslation(lang, 'personalizedRecommendations')}
            </button>

            <button
              onClick={() => setActiveFilter('focus')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'focus'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {getTranslation(lang, 'todaysFocus')} ({learningData?.todaysFocus?.length || 0})
            </button>

            <button
              onClick={() => setActiveFilter('revise')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'revise'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {getTranslation(lang, 'topicsToRevise')} ({learningData?.topicsToRevise?.length || 0})
            </button>

            <button
              onClick={() => setActiveFilter('practice')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'practice'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {getTranslation(lang, 'recommendedPractice')} ({learningData?.recommendedPractice?.length || 0})
            </button>

            <button
              onClick={() => setActiveFilter('exam')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'exam'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {getTranslation(lang, 'examPreparation')} ({learningData?.examPreparation?.length || 0})
            </button>

            <button
              onClick={() => setActiveFilter('goals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'goals'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {getTranslation(lang, 'dailyGoals')} ({learningData?.dailyGoals?.length || 0})
            </button>
          </div>

          {/* Recommendations Content */}
          {learningData && (
            <div className="space-y-8">
              {(activeFilter === 'all' || activeFilter === 'focus') && learningData.todaysFocus?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        <Target className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {getTranslation(lang, 'todaysFocus')}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {learningData.todaysFocus.map((item) =>
                      renderRecommendationCard(
                        item,
                        "Today's Priority",
                        'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      )
                    )}
                  </div>
                </div>
              )}

              {(activeFilter === 'all' || activeFilter === 'revise') && learningData.topicsToRevise?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {getTranslation(lang, 'topicsToRevise')}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {learningData.topicsToRevise.map((item) =>
                      renderRecommendationCard(
                        item,
                        'Revision Urgent',
                        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      )
                    )}
                  </div>
                </div>
              )}

              {(activeFilter === 'all' || activeFilter === 'practice') && learningData.recommendedPractice?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        <HelpCircle className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {getTranslation(lang, 'recommendedPractice')}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {learningData.recommendedPractice.map((item) =>
                      renderRecommendationCard(
                        item,
                        'Targeted Drill',
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ADAPTIVE PRACTICE MODAL */}
      {practiceTopic && adaptivePath && (
        <AdaptivePracticeModal
          isOpen={practiceModalOpen}
          onClose={() => {
            setPracticeModalOpen(false);
            setPracticeTopic(null);
          }}
          topic={practiceTopic}
          path={adaptivePath}
          profile={profile}
          lang={lang}
          onUpdatePath={handleUpdatePath}
          onNavigateToAi={onNavigateToAi}
          onNavigateToNotes={() => onNavigate('notes')}
        />
      )}

      {/* SMART PRACTICE MODAL (8 MODES) */}
      <SmartPracticeModal
        isOpen={smartPracticeOpen}
        onClose={() => setSmartPracticeOpen(false)}
        mode={smartPracticeMode}
        subject={smartPracticeSubject}
        topic={smartPracticeTopic}
        chapter={smartPracticeChapter}
        profile={profile}
        lang={lang}
        onNavigate={onNavigate}
        onNavigateToAi={onNavigateToAi}
        onSessionComplete={(summary: SmartPracticeSessionSummary) => {
          // Update daily practice XP
          const todayKey = `eduai_smart_practice_daily_xp_${new Date().toISOString().split('T')[0]}`;
          const currentDaily = parseInt(localStorage.getItem(todayKey) || '0', 10);
          setDailyPracticeXp(currentDaily);

          // If topics improved, refresh adaptive path in background
          if (summary.topicsImproved.length > 0) {
            loadAdaptivePath(smartPracticeSubject, true);
          }
        }}
      />
    </div>
  );
};
