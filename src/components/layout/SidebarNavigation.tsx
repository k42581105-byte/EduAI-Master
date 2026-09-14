import React from 'react';
import {
  Home,
  Sparkles,
  RotateCcw,
  MessageSquareText,
  Camera,
  BookMarked,
  BookOpen,
  HelpCircle,
  GraduationCap,
  FileText,
  Calendar,
  AlertCircle,
  TrendingUp,
  Trophy,
  User,
  Settings,
  Heart,
  Users,
  ShieldCheck,
  Compass,
  Bell,
} from 'lucide-react';
import { NavigationSection } from '../../types';
import { getTranslation, LanguageCode } from '../../i18n/translations';

interface SidebarProps {
  currentSection: NavigationSection;
  onNavigate: (section: NavigationSection) => void;
  lang: LanguageCode;
}

export const NAV_ITEMS: { id: NavigationSection; labelKey: keyof any; icon: React.ReactNode; group: 'core' | 'portals' | 'tools' | 'track' | 'user' }[] = [
  { id: 'home', labelKey: 'navHome', icon: <Home className="h-5 w-5" />, group: 'core' },
  { id: 'learning-coach', labelKey: 'navLearningCoach', icon: <Sparkles className="h-5 w-5" />, group: 'core' },
  { id: 'smart-revision', labelKey: 'navSmartRevision', icon: <RotateCcw className="h-5 w-5" />, group: 'core' },
  { id: 'personal-learning', labelKey: 'navPersonalLearning', icon: <Compass className="h-5 w-5" />, group: 'core' },
  { id: 'parent-dashboard', labelKey: 'navParentDashboard', icon: <Heart className="h-5 w-5" />, group: 'portals' },
  { id: 'teacher-dashboard', labelKey: 'navTeacherDashboard', icon: <Users className="h-5 w-5" />, group: 'portals' },
  { id: 'admin-dashboard', labelKey: 'navAdminDashboard', icon: <ShieldCheck className="h-5 w-5" />, group: 'portals' },
  { id: 'ask-ai', labelKey: 'navAskAi', icon: <MessageSquareText className="h-5 w-5" />, group: 'tools' },
  { id: 'photo-solver', labelKey: 'navPhotoSolver', icon: <Camera className="h-5 w-5" />, group: 'tools' },
  { id: 'notes', labelKey: 'navNotes', icon: <BookMarked className="h-5 w-5" />, group: 'tools' },
  { id: 'books', labelKey: 'navBooks', icon: <BookOpen className="h-5 w-5" />, group: 'tools' },
  { id: 'quiz', labelKey: 'navQuiz', icon: <HelpCircle className="h-5 w-5" />, group: 'tools' },
  { id: 'exam-mode', labelKey: 'navExamMode', icon: <GraduationCap className="h-5 w-5" />, group: 'tools' },
  { id: 'paper-generator', labelKey: 'navPaperGenerator', icon: <FileText className="h-5 w-5" />, group: 'tools' },
  { id: 'study-planner', labelKey: 'navStudyPlanner', icon: <Calendar className="h-5 w-5" />, group: 'track' },
  { id: 'weak-topics', labelKey: 'navWeakTopics', icon: <AlertCircle className="h-5 w-5" />, group: 'track' },
  { id: 'progress', labelKey: 'navProgress', icon: <TrendingUp className="h-5 w-5" />, group: 'track' },
  { id: 'achievements', labelKey: 'navAchievements', icon: <Trophy className="h-5 w-5" />, group: 'track' },
  { id: 'notifications', labelKey: 'navNotifications', icon: <Bell className="h-5 w-5" />, group: 'track' },
  { id: 'profile', labelKey: 'navProfile', icon: <User className="h-5 w-5" />, group: 'user' },
  { id: 'settings', labelKey: 'navSettings', icon: <Settings className="h-5 w-5" />, group: 'user' },
];

export const SidebarNavigation: React.FC<SidebarProps> = ({ currentSection, onNavigate, lang }) => {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200/90 bg-white dark:border-slate-800/90 dark:bg-slate-900 min-h-[calc(100vh-4rem)] p-4 shrink-0 transition-colors">
      <div className="space-y-6">
        {/* Core */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Main Dashboard
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.filter((i) => i.group === 'core').map((item) => {
              const active = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex min-h-[42px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold border transition-all active:scale-[0.98] ${
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-2xs'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700/60'
                  }`}
                >
                  <span className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{getTranslation(lang, item.labelKey as any)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Parent & Teacher Dashboards */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2 flex items-center justify-between">
            <span>Parent & Teacher Portals</span>
            <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md font-extrabold">ROLES</span>
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.filter((i) => i.group === 'portals').map((item) => {
              const active = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex min-h-[42px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold border transition-all active:scale-[0.98] ${
                    active
                      ? 'border-purple-600 bg-purple-50 text-purple-700 dark:border-purple-500 dark:bg-purple-950/60 dark:text-purple-300 shadow-2xs'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700/60'
                  }`}
                >
                  <span className={active ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{getTranslation(lang, item.labelKey as any)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Learning Tools */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            AI Tools & Practice
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.filter((i) => i.group === 'tools').map((item) => {
              const active = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex min-h-[42px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold border transition-all active:scale-[0.98] ${
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-2xs'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700/60'
                  }`}
                >
                  <span className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{getTranslation(lang, item.labelKey as any)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tracking & Analytics */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Analytics & Planner
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.filter((i) => i.group === 'track').map((item) => {
              const active = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex min-h-[42px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold border transition-all active:scale-[0.98] ${
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-2xs'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700/60'
                  }`}
                >
                  <span className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{getTranslation(lang, item.labelKey as any)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Account */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Preferences
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.filter((i) => i.group === 'user').map((item) => {
              const active = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex min-h-[42px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold border transition-all active:scale-[0.98] ${
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-2xs'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700/60'
                  }`}
                >
                  <span className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{getTranslation(lang, item.labelKey as any)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
