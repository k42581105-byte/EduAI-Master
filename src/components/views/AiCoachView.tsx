import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Target,
  BookOpen,
  RotateCcw,
  HelpCircle,
  GraduationCap,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Award,
  Clock,
  Flame,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Lightbulb,
  FileText,
  ShieldCheck,
  Compass,
  Layers,
  BookMarked,
  Check,
  Sliders,
} from 'lucide-react';
import { StudentProfile, NavigationSection, SmartPracticeMode } from '../../types';
import { TodayLearningDashboardData } from '../../types/aiCoach';
import { AiCoachService } from '../../services/aiCoachService';
import { StorageService } from '../../services/storageService';
import { SmartPracticeModal } from './SmartPracticeModal';
import { UpdateStudyPlanModal } from './UpdateStudyPlanModal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { LanguageCode } from '../../i18n/translations';

interface AiCoachViewProps {
  profile: StudentProfile;
  lang?: LanguageCode;
  onNavigate: (section: NavigationSection) => void;
  onNavigateToAi?: (prompt: string) => void;
}

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  profile,
  lang = 'en',
  onNavigate,
  onNavigateToAi,
}) => {
  const [dashboardData, setDashboardData] = useState<TodayLearningDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [practiceMode, setPracticeMode] = useState<SmartPracticeMode>('weak_topic');
  const [practiceSubject, setPracticeSubject] = useState('Science');
  const [practiceTopic, setPracticeTopic] = useState('');
  const [practiceChapter, setPracticeChapter] = useState('');

  const [isUpdatePlanModalOpen, setIsUpdatePlanModalOpen] = useState(false);

  // Quick revision drawer state
  const [showRevisionCard, setShowRevisionCard] = useState(false);

  // Custom doubt prompt
  const [doubtText, setDoubtText] = useState('');

  const loadData = async (force: boolean = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await AiCoachService.getTodayLearningDashboard(profile, lang, force);
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load AI Coach dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [profile.classLevel, profile.xp, profile.streakDays]);

  // Action handlers
  const handleStartLearning = () => {
    if (!dashboardData) return;
    const { whatToStudy } = dashboardData;
    // Set active topic in session storage for books/notes to auto-highlight
    sessionStorage.setItem(
      'eduai_selected_study_topic',
      JSON.stringify({
        subject: whatToStudy.subject,
        chapter: whatToStudy.chapter,
        topic: whatToStudy.topic,
      })
    );
    onNavigate('books');
  };

  const handlePracticeNow = (
    modeOverride?: SmartPracticeMode,
    subjectOverride?: string,
    topicOverride?: string,
    chapterOverride?: string
  ) => {
    if (!dashboardData) return;
    const mode = modeOverride || (dashboardData.recommendedPractice.mode as SmartPracticeMode) || 'weak_topic';
    const sub = subjectOverride || dashboardData.recommendedPractice.subject || 'Science';
    const top = topicOverride || dashboardData.recommendedPractice.topic || '';
    const chap = chapterOverride || dashboardData.recommendedPractice.chapter || '';

    setPracticeMode(mode);
    setPracticeSubject(sub);
    setPracticeTopic(top);
    setPracticeChapter(chap);
    setIsPracticeModalOpen(true);
  };

  const handleReviseNow = () => {
    if (!dashboardData) return;
    setShowRevisionCard(true);
  };

  const handleAskAi = (customPrompt?: string) => {
    const prompt =
      customPrompt ||
      doubtText ||
      `Coach, please explain ${dashboardData?.whatToStudy.topic || 'today’s topic'} in simple terms with step-by-step examples.`;

    if (onNavigateToAi) {
      onNavigateToAi(prompt);
    } else {
      sessionStorage.setItem('eduai_prefill_ask_prompt', prompt);
      onNavigate('ask-ai');
    }
  };

  const handlePlanUpdated = () => {
    loadData(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-tr from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/20 animate-pulse">
          <Sparkles className="h-8 w-8 animate-spin" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            AI Learning Coach is analyzing your real performance data...
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Scanning your quiz results, weak topics, syllabus goals, and upcoming exam schedule...
          </p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Failed to load coach briefing.</p>
        <Button onClick={() => loadData(true)} className="mt-3">
          Retry
        </Button>
      </div>
    );
  }

  const {
    briefing,
    todayGoal,
    whatToStudy,
    whatToRevise,
    recommendedPractice,
    upcomingExam,
    weakTopicAlert,
    dailyProgress,
    coachTips,
  } = dashboardData;

  const xpProgressPercentage = Math.min(100, Math.round((todayGoal.dailyXpEarned / todayGoal.dailyXpTarget) * 100));
  const timeProgressPercentage = Math.min(100, Math.round((todayGoal.completedStudyMinutes / todayGoal.targetStudyMinutes) * 100));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* 1. TOP HEADER & COACH'S PERSONAL BRIEFING */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl dark:border-indigo-900/50">
        {/* Background ambient decorative shapes */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-20 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left Column: Greeting & Coach Synthesis */}
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md border border-indigo-400/30">
                <Sparkles className="h-3.5 w-3.5 text-indigo-300 animate-spin" />
                AI Learning Coach
              </span>
              <span className="text-xs text-indigo-200/80 font-medium">
                {briefing.studentSummary}
              </span>
              {dashboardData.isAiLiveGenerated && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  LIVE AI ANALYSIS
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {briefing.greeting}
            </h1>

            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed font-normal bg-white/5 p-3.5 rounded-2xl border border-white/10">
              "{briefing.coachMessage}"
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                <Target className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{briefing.focusHighlight}</span>
              </div>
              <span className="text-slate-500">•</span>
              <div className="flex items-center gap-1.5 text-xs text-indigo-200/70 italic">
                <Lightbulb className="h-3.5 w-3.5 text-indigo-300" />
                <span>{briefing.mindsetQuote}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Readiness Score Gauge & Refresh Action */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-900/40 p-4 text-center backdrop-blur-md w-full sm:w-44">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Exam Readiness
              </span>
              <div className="my-1.5 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{briefing.readinessScore}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 to-indigo-400 rounded-full transition-all duration-700"
                  style={{ width: `${briefing.readinessScore}%` }}
                />
              </div>
              <span className="mt-1.5 text-[10px] text-indigo-200/70">
                Target: Term-1 Board Exam
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="w-full border-indigo-400/30 text-indigo-100 hover:bg-indigo-800/50 bg-indigo-950/40 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Analyzing...' : 'Refresh Coach Analysis'}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S GOALS SUMMARY & QUICK STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily XP Target */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's XP Goal</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Zap className="h-4 w-4 fill-current" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {todayGoal.dailyXpEarned} <span className="text-xs font-normal text-slate-400">/ {todayGoal.dailyXpTarget} XP</span>
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{xpProgressPercentage}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${xpProgressPercentage}%` }}
            />
          </div>
        </div>

        {/* Study Time */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Study Time Today</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {todayGoal.completedStudyMinutes} <span className="text-xs font-normal text-slate-400">/ {todayGoal.targetStudyMinutes} mins</span>
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{timeProgressPercentage}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${timeProgressPercentage}%` }}
            />
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Tasks</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {todayGoal.completedTasksCount} <span className="text-xs font-normal text-slate-400">/ {todayGoal.tasksCount} Done</span>
            </span>
            <button
              onClick={() => setIsUpdatePlanModalOpen(true)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 underline cursor-pointer"
            >
              Edit Plan
            </button>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{
                width: `${todayGoal.tasksCount > 0 ? (todayGoal.completedTasksCount / todayGoal.tasksCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Streak Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Daily Streak</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <Flame className="h-4 w-4 fill-current" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {todayGoal.streakDays} <span className="text-xs font-normal text-slate-400">Days Active</span>
            </span>
            <Badge variant="success" className="text-[10px] px-2 py-0">
              {profile.streakDays >= 7 ? '7+ Day Streak' : 'Streak On'}
            </Badge>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Complete 1 practice session to protect streak.
          </p>
        </div>
      </div>

      {/* 3. CRITICAL WEAK TOPIC ALERT (IF EXISTS) */}
      {weakTopicAlert && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/70 p-5 dark:border-rose-900/50 dark:bg-rose-950/30 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Weak Topic Alert ({weakTopicAlert.accuracyRate}% Accuracy)
                  </span>
                  <Badge variant="danger" className="text-[10px] px-2 py-0">
                    {weakTopicAlert.urgency} Action Required
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {weakTopicAlert.subject} • {weakTopicAlert.topic}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-rose-800 dark:text-rose-300">Diagnosis:</span>{' '}
                  {weakTopicAlert.identifiedMisconception}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Remedy:</span> {weakTopicAlert.remedyAction}
                </p>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleAskAi(
                    `Coach, I need help with my weak topic in ${weakTopicAlert.subject}: ${weakTopicAlert.topic}. Can you explain step by step where students usually make mistakes?`
                  )
                }
                className="text-xs"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
                Ask AI Coach
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  handlePracticeNow(
                    'weak_topic',
                    weakTopicAlert.subject,
                    weakTopicAlert.topic,
                    weakTopicAlert.chapter
                  )
                }
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs shadow-xs"
              >
                <Zap className="h-3.5 w-3.5 mr-1" />
                Fix Topic Now (5 Qs)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CORE LEARNING TRIFECTA: WHAT TO STUDY, WHAT TO REVISE, RECOMMENDED PRACTICE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1: WHAT TO STUDY */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs transition-all hover:shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <BookOpen className="h-4 w-4" /> What to Study Today
              </span>
              <Badge variant="primary" className="text-[10px]">
                {whatToStudy.importance}
              </Badge>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {whatToStudy.subject} • {whatToStudy.chapter}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {whatToStudy.topic}
              </h3>
            </div>

            {/* Key Learning Outcomes */}
            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block uppercase tracking-wider">
                Key Learning Outcomes:
              </span>
              <ul className="space-y-1.5">
                {whatToStudy.keyLearningOutcomes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-indigo-500" /> ~{whatToStudy.estimatedMinutes} mins recommended
              </span>
              <span className="text-[11px] text-slate-400">Class {profile.classLevel} Syllabus</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Button onClick={handleStartLearning} className="w-full">
              <BookOpen className="h-4 w-4 mr-2" /> Start Learning
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAskAi(`Teach me ${whatToStudy.topic} in ${whatToStudy.subject}`)}
              title="Ask AI Teacher about this topic"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* CARD 2: WHAT TO REVISE */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs transition-all hover:shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                <RotateCcw className="h-4 w-4" /> What to Revise Today
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {whatToRevise.spacedRepetitionStage}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {whatToRevise.subject} • {whatToRevise.chapter}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {whatToRevise.topic}
              </h3>
            </div>

            {/* Quick Rule / Formula Card */}
            <div className="rounded-xl bg-purple-50/70 p-3.5 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-2">
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block uppercase tracking-wider">
                Key Memory Rule:
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {whatToRevise.quickFormulaOrKeyRule}
              </p>
              <ul className="space-y-1 pt-1">
                {whatToRevise.quickRevisionPoints.map((point, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Last practiced: {whatToRevise.lastPracticed}</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Active Recall</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleReviseNow}
              className="w-full bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Revise Now
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('notes')}
              title="Open Notes Book"
            >
              <BookMarked className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* CARD 3: RECOMMENDED PRACTICE */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs transition-all hover:shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Zap className="h-4 w-4" /> Recommended Practice
              </span>
              <Badge variant="success" className="text-[10px]">
                +{recommendedPractice.rewardXp} XP
              </Badge>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {recommendedPractice.subject} • {recommendedPractice.modeLabel}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {recommendedPractice.topic}
              </h3>
            </div>

            <div className="rounded-xl bg-emerald-50/70 p-3.5 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider">
                Coach Why:
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {recommendedPractice.reason}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium pt-1">
                <span>🎯 {recommendedPractice.questionCount} Questions</span>
                <span>⏱️ ~{recommendedPractice.estimatedMinutes} Mins</span>
                <span>⚡ Adaptive Difficulty</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Anti-farming safe mode</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Streak booster</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Button
              onClick={() => handlePracticeNow()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Zap className="h-4 w-4 mr-2" /> Practice Now
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('quiz')}
              title="Open full Quiz Hub"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 5. UPCOMING EXAM & DAILY PROGRESS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* UPCOMING EXAM COUNTDOWN CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-500" /> Upcoming Exam
            </span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
              {upcomingExam.daysLeft} Days Left
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {upcomingExam.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target Date: {new Date(upcomingExam.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Exam Readiness</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{upcomingExam.readinessPercentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${upcomingExam.readinessPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              High-Yield Revision Topics:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {upcomingExam.criticalTopics.map((topic, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('exam-mode')}
              className="w-full text-xs"
            >
              <GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Open Exam Mode
            </Button>
          </div>
        </div>

        {/* DAILY PROGRESS & SUBJECT DISTRIBUTION */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Today’s Activity & Progress
            </span>
            <button
              onClick={() => setIsUpdatePlanModalOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
            >
              <Sliders className="h-3.5 w-3.5" /> Update Study Plan
            </button>
          </div>

          {/* Core Subject Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dailyProgress.subjectDistribution.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.subject}</span>
                  <span className="text-slate-500">{item.progressPercentage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.progressPercentage}%` }}
                  />
                </div>
                <span className="mt-1 text-[10px] text-slate-400 block">{item.tasksDone} tasks done today</span>
              </div>
            ))}
          </div>

          {/* Today's Activity Log */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Recent Activity Today:
            </span>
            {dailyProgress.recentTodayActivities.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400 dark:bg-slate-800/40">
                No activities recorded today yet. Complete a practice or read a chapter to get started!
              </div>
            ) : (
              <div className="space-y-2">
                {dailyProgress.recentTodayActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{act.title}</p>
                        <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                      </div>
                    </div>
                    {act.xp > 0 && (
                      <Badge variant="success" className="text-[10px] px-2 py-0">
                        +{act.xp} XP
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. ASK AI COACH QUICK DOUBT & COACH TIPS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Ask AI Coach Input */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" /> Ask AI Learning Coach
            </span>
            <span className="text-[11px] text-slate-400">
              Personalized for Class {profile.classLevel}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Have a doubt about today’s syllabus, a numerical step, or how to study before exams? Ask your coach!
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`e.g., How do I apply mirror sign conventions in Physics?`}
              value={doubtText}
              onChange={(e) => setDoubtText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAskAi();
              }}
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <Button onClick={() => handleAskAi()} className="shrink-0">
              Ask AI <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Quick preset question chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => handleAskAi(`Coach, how should I schedule my study hours today for best retention?`)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 transition-colors"
            >
              📅 Schedule advice
            </button>
            <button
              onClick={() => handleAskAi(`Coach, explain the difference between concave and convex mirror focal length signs.`)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 transition-colors"
            >
              🔍 Optics sign rule
            </button>
            <button
              onClick={() => handleAskAi(`Coach, give me 3 high-probability exam questions from ${whatToStudy.topic}.`)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 transition-colors"
            >
              📝 3 Exam Questions
            </button>
          </div>
        </div>

        {/* Coach Daily Tips */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" /> Coach’s Study Tips
          </span>

          <div className="space-y-2.5">
            {coachTips.map((tip, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-amber-50/60 p-3 text-xs text-slate-700 dark:bg-amber-950/30 dark:text-slate-300 border border-amber-100/80 dark:border-amber-900/30"
              >
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK REVISION POPUP/MODAL */}
      {showRevisionCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-purple-50 dark:bg-purple-950/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Quick Revision • {whatToRevise.topic}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {whatToRevise.subject} • {whatToRevise.chapter}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRevisionCard(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="rounded-xl bg-purple-50 p-4 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block uppercase">
                  Core Formula / Rule:
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                  {whatToRevise.quickFormulaOrKeyRule}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Quick Memory Anchors:
                </span>
                <ul className="space-y-2">
                  {whatToRevise.quickRevisionPoints.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <span>Last practiced: {whatToRevise.lastPracticed}</span>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowRevisionCard(false);
                    onNavigate('notes');
                  }}
                >
                  <BookMarked className="h-3.5 w-3.5 mr-1" /> Open Complete Chapter Notes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMART PRACTICE MODAL INTEGRATION */}
      {isPracticeModalOpen && (
        <SmartPracticeModal
          isOpen={isPracticeModalOpen}
          onClose={() => {
            setIsPracticeModalOpen(false);
            loadData(false);
          }}
          mode={practiceMode}
          subject={practiceSubject}
          topic={practiceTopic}
          chapter={practiceChapter}
          profile={profile}
          lang={lang}
          onNavigate={onNavigate}
          onNavigateToAi={onNavigateToAi}
          onSessionComplete={(summary) => {
            setIsPracticeModalOpen(false);
            loadData(false);
          }}
        />
      )}

      {/* UPDATE STUDY PLAN MODAL INTEGRATION */}
      {isUpdatePlanModalOpen && (
        <UpdateStudyPlanModal
          isOpen={isUpdatePlanModalOpen}
          onClose={() => setIsUpdatePlanModalOpen(false)}
          profile={profile}
          onPlanUpdated={handlePlanUpdated}
        />
      )}
    </div>
  );
};
