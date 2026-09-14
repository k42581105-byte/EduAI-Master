import React from 'react';
import {
  Sparkles,
  Flame,
  Award,
  BookOpen,
  Camera,
  MessageSquareText,
  BookMarked,
  HelpCircle,
  GraduationCap,
  ArrowRight,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Zap,
  FileText,
  Compass,
  ChevronRight,
  Clock,
  Info,
  RotateCcw,
} from 'lucide-react';
import { StudentProfile, NavigationSection } from '../../types';
import { getTranslation, LanguageCode } from '../../i18n/translations';
import { StorageService } from '../../services/storageService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { VoiceAiControl } from '../ai/VoiceAiControl';

interface HomeViewProps {
  profile: StudentProfile;
  onNavigate: (section: NavigationSection) => void;
  lang: LanguageCode;
}

export const HomeView: React.FC<HomeViewProps> = ({ profile, onNavigate, lang }) => {
  const weakTopics = StorageService.getWeakTopics();
  const activities = StorageService.getActivities().slice(0, 4);
  const personalLearningData = StorageService.getPersonalLearningData();
  const topFocus = personalLearningData?.todaysFocus?.[0];
  const topRevision = personalLearningData?.topicsToRevise?.[0];
  const readinessScore = personalLearningData?.readinessScore || 85;

  // Time-based greeting
  const hour = new Date().getHours();
  const greetingKey =
    hour < 12 ? 'greetingMorning' : hour < 17 ? 'greetingAfternoon' : 'greetingEvening';
  const greetingText = getTranslation(lang, greetingKey);

  // XP Progress to next level
  const currentLevelXp = (profile.level - 1) * 150;
  const nextLevelXp = profile.level * 150;
  const xpInCurrentLevel = Math.max(0, profile.xp - currentLevelXp);
  const xpNeededForNext = 150;
  const levelProgressPct = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNext) * 100));

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white shadow-md dark:border-indigo-900">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>AI Learning Companion Ready</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greetingText}, {profile.name}! 👋
            </h2>
            <p className="text-indigo-100 text-sm max-w-xl">
              Class {profile.classLevel} ({profile.board} • {profile.medium} Medium). Ready to conquer today's study goals with AI assistance?
            </p>
          </div>

          {/* Level Progress Widget */}
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/15 min-w-[220px] shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-1">
                <Award className="h-4 w-4 text-amber-300" />
                Level {profile.level} Student
              </span>
              <span className="text-indigo-200">{xpInCurrentLevel}/150 XP</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-black/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500"
                style={{ width: `${levelProgressPct}%` }}
              />
            </div>
            <p className="text-[11px] text-indigo-200 mt-2 text-right">
              {150 - xpInCurrentLevel} XP to Level {profile.level + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Voice AI Assistant Launcher */}
      <VoiceAiControl
        onVoiceAskAi={(prompt) => {
          localStorage.setItem('eduai_pending_ask_prompt', prompt);
          onNavigate('ask-ai');
        }}
        onVoiceCreateNote={(prompt) => {
          localStorage.setItem('eduai_pending_note_topic', prompt);
          onNavigate('notes');
        }}
        onVoiceCreateQuiz={(prompt) => {
          localStorage.setItem('eduai_pending_quiz_topic', prompt);
          onNavigate('quiz');
        }}
      />

      {/* AI Learning Coach Banner */}
      <Card className="border-2 border-indigo-300 dark:border-indigo-800 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 p-5 rounded-3xl shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Today's Learning AI Coach
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
                  REAL-TIME COGNITIVE BRIEF
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl">
                Personalized guidance synthesised from your Class {profile.classLevel} syllabus, recent quiz accuracy, weak topics, and upcoming board exams.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => onNavigate('learning-coach')}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              <span>Open AI Coach Dashboard</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 5 Instant Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4 pt-3 border-t border-indigo-100 dark:border-slate-800">
          <button
            onClick={() => onNavigate('learning-coach')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Start Learning</span>
          </button>

          <button
            onClick={() => onNavigate('personal-learning')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all shadow-xs"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Practice Now</span>
          </button>

          <button
            onClick={() => onNavigate('smart-revision')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Smart Revision</span>
          </button>

          <button
            onClick={() => onNavigate('ask-ai')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-xs"
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            <span>Ask AI</span>
          </button>

          <button
            onClick={() => onNavigate('study-planner')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs col-span-2 sm:col-span-1"
          >
            <Target className="h-3.5 w-3.5" />
            <span>Update Study Plan</span>
          </button>
        </div>
      </Card>

      {/* AI Personal Learning Advisor Widget */}
      <Card className="border-2 border-indigo-200/80 dark:border-indigo-900/80 bg-linear-to-r from-indigo-50/70 via-white to-purple-50/70 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 p-5 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {getTranslation(lang, 'personalizedRecommendations')}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  AI ADAPTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calibrated against your real quiz scores, weak topics, and upcoming board exams
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {getTranslation(lang, 'readinessScore')}
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {readinessScore}/100
              </span>
            </div>

            <Button
              size="sm"
              onClick={() => onNavigate('personal-learning')}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              <span>Explore All Recommendations</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Highlighted Recommendations Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
          {/* Item 1: Top Focus */}
          <div
            onClick={() => onNavigate('personal-learning')}
            className="group p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700/80 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md">
                {getTranslation(lang, 'todaysFocus')}
              </span>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Zap className="h-3 w-3 fill-current" /> +50 XP
              </span>
            </div>

            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
              {topFocus?.title || 'Science: Spherical Mirror Formula & Magnification'}
            </h4>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {topFocus?.reason || 'Targeting foundational concept before next mock test to boost retention.'}
            </p>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3 text-indigo-500" />
                <span>{topFocus?.dataTrigger || 'Based on recent 42% accuracy'}</span>
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                Start Now →
              </span>
            </div>
          </div>

          {/* Item 2: Revision Priority */}
          <div
            onClick={() => onNavigate('personal-learning')}
            className="group p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-rose-100 dark:border-slate-700/80 hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-md">
                {getTranslation(lang, 'topicsToRevise')}
              </span>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> 15 min
              </span>
            </div>

            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors line-clamp-1">
              {topRevision?.title || 'Mathematics: Quadratic Discriminant & Roots'}
            </h4>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {topRevision?.reason || '6-8 Marks syllabus weightage in upcoming exams.'}
            </p>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-rose-500" />
                <span>{topRevision?.dataTrigger || 'Weak Topic Flagged (55%)'}</span>
              </span>
              <span className="font-semibold text-rose-600 dark:text-rose-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                Revise Topic →
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Today's Goal & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Learning Target */}
        <Card className="md:col-span-2 relative overflow-hidden border-indigo-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {getTranslation(lang, 'todayGoal')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target: {profile.dailyXpGoal} XP today
                </p>
              </div>
            </div>
            <Badge variant="indigo" size="sm">
              60% Completed
            </Badge>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Complete 1 Science Practice Quiz
              </span>
              <span className="text-emerald-600 font-semibold">+50 XP</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                Ask 1 Doubt to AI Tutor
              </span>
              <span className="text-indigo-600 font-semibold">+20 XP</span>
            </div>
          </div>
        </Card>

        {/* Daily Streak Card */}
        <Card className="flex flex-col justify-between border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
                <Flame className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Streak Master
                </span>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                  {profile.streakDays} Days 🔥
                </h4>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
            Keep learning daily to maintain your streak shield and unlock double XP rewards!
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 border-amber-300 dark:border-amber-800"
            onClick={() => onNavigate('quiz')}
          >
            Maintain Streak
          </Button>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          {getTranslation(lang, 'quickActions')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <Card
            onClick={() => onNavigate('personal-learning')}
            className="group hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 p-4 text-center cursor-pointer border-2 border-indigo-500/30 shadow-xs"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300 bg-indigo-600 text-white shadow-xs group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6 fill-current animate-pulse" />
            </div>
            <h4 className="font-bold text-xs text-indigo-700 dark:text-indigo-300 mt-2.5">
              Smart Practice
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Adaptive 8-mode drills
            </p>
          </Card>

          <Card
            onClick={() => onNavigate('ask-ai')}
            className="group hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 p-4 text-center cursor-pointer"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-100 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <MessageSquareText className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-xs text-slate-900 dark:text-white mt-2.5">
              Ask AI Tutor
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Instant doubt solver
            </p>
          </Card>

          <Card
            onClick={() => onNavigate('photo-solver')}
            className="group hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 p-4 text-center cursor-pointer"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-200 bg-purple-100 text-purple-600 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Camera className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-xs text-slate-900 dark:text-white mt-2.5">
              Photo Solver
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Snap & solve homework
            </p>
          </Card>

          <Card
            onClick={() => onNavigate('notes')}
            className="group hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 p-4 text-center cursor-pointer"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-100 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <BookMarked className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-xs text-slate-900 dark:text-white mt-2.5">
              AI Notes
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Generate revision notes
            </p>
          </Card>

          <Card
            onClick={() => onNavigate('quiz')}
            className="group hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 p-4 text-center cursor-pointer"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100 text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-xs text-slate-900 dark:text-white mt-2.5">
              Practice Quiz
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Test concept mastery
            </p>
          </Card>

          <Card
            onClick={() => onNavigate('exam-mode')}
            className="group hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 p-4 text-center cursor-pointer"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-100 text-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-xs text-slate-900 dark:text-white mt-2.5">
              Exam Mode
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Timed mock assessments
            </p>
          </Card>

          <Card
            onClick={() => onNavigate('paper-generator')}
            className="group hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 p-4 text-center cursor-pointer"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-200 bg-teal-100 text-teal-600 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-xs text-slate-900 dark:text-white mt-2.5">
              Paper Generator
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Board test blueprint
            </p>
          </Card>
        </div>
      </div>

      {/* Continue Learning & Weak Topics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Continue Learning Card */}
        <Card className="flex flex-col justify-between border-indigo-100 dark:border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {getTranslation(lang, 'continueLearning')}
              </span>
              <Badge variant="indigo" size="sm">
                Chapter 2
              </Badge>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Science • Light: Reflection and Refraction
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Topic: Spherical Mirror Formula & Magnification Numericals
            </p>

            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span>Lesson Progress</span>
                <span>60%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-600 w-[60%]" />
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button
              size="sm"
              variant="primary"
              fullWidth
              icon={<ArrowRight className="h-4 w-4" />}
              onClick={() => onNavigate('books')}
            >
              Resume Lesson
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('ask-ai')}
            >
              Ask Doubt
            </Button>
          </div>
        </Card>

        {/* Weak Topics Preview */}
        <Card className="border-rose-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              {getTranslation(lang, 'weakTopicsPreview')}
            </h3>
            <button
              onClick={() => onNavigate('weak-topics')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View All ({weakTopics.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {weakTopics.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {item.subjectName}: {item.chapterName}
                    </span>
                    <Badge
                      variant={item.urgency === 'Critical' ? 'rose' : 'amber'}
                      size="sm"
                    >
                      {item.accuracyRate}% Accuracy
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {item.topicName}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-xs px-2.5"
                  onClick={() => onNavigate('quiz')}
                >
                  Practice
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            {getTranslation(lang, 'recentActivity')}
          </h3>
          <button
            onClick={() => onNavigate('progress')}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Full Analytics
          </button>
        </div>

        <div className="space-y-3">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 text-xs font-bold">
                  +{act.xpEarned}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {act.title}
                  </p>
                  <p className="text-[10px] text-slate-400">{act.timestamp} • {act.details}</p>
                </div>
              </div>
              <Badge variant="indigo" size="sm">
                +{act.xpEarned} XP
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
