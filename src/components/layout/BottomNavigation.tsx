import React, { useState } from 'react';
import {
  Home,
  MessageSquareText,
  Camera,
  HelpCircle,
  Grid,
  X,
  BookMarked,
  BookOpen,
  GraduationCap,
  Calendar,
  AlertCircle,
  TrendingUp,
  Trophy,
  User,
  Settings,
} from 'lucide-react';
import { NavigationSection } from '../../types';
import { getTranslation, LanguageCode } from '../../i18n/translations';
import { NAV_ITEMS } from './SidebarNavigation';

interface BottomNavProps {
  currentSection: NavigationSection;
  onNavigate: (section: NavigationSection) => void;
  lang: LanguageCode;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({ currentSection, onNavigate, lang }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainQuickTabs: { id: NavigationSection; labelKey: keyof any; icon: React.ReactNode }[] = [
    { id: 'home', labelKey: 'navHome', icon: <Home className="h-5 w-5" /> },
    { id: 'ask-ai', labelKey: 'navAskAi', icon: <MessageSquareText className="h-5 w-5" /> },
    { id: 'photo-solver', labelKey: 'navPhotoSolver', icon: <Camera className="h-5 w-5" /> },
    { id: 'quiz', labelKey: 'navQuiz', icon: <HelpCircle className="h-5 w-5" /> },
  ];

  const handleSelect = (section: NavigationSection) => {
    onNavigate(section);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Fixed Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-900/95 md:hidden transition-colors pb-safe">
        <div className="grid h-16 grid-cols-5 items-center px-1">
          {mainQuickTabs.map((tab) => {
            const active = currentSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelect(tab.id)}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 ${
                  active
                    ? 'text-indigo-600 font-bold dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                    active ? 'bg-indigo-50 dark:bg-indigo-950/80 shadow-2xs' : ''
                  }`}
                >
                  {tab.icon}
                </div>
                <span className="text-[10px] leading-tight truncate max-w-[64px]">
                  {getTranslation(lang, tab.labelKey as any)}
                </span>
              </button>
            );
          })}

          {/* More Drawer Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex min-h-[48px] flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 ${
              drawerOpen || !mainQuickTabs.some((t) => t.id === currentSection)
                ? 'text-indigo-600 font-bold dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <Grid className="h-5 w-5" />
            </div>
            <span className="text-[10px] leading-tight">All Modules</span>
          </button>
        </div>
      </nav>

      {/* All Modules Mobile Drawer Sheet */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {getTranslation(lang, 'allModules')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select any section to launch
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pb-8">
              {NAV_ITEMS.map((item) => {
                const active = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all active:scale-95 ${
                      active
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                        : 'border-slate-200 bg-slate-50/50 text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                        active
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium line-clamp-1">
                      {getTranslation(lang, item.labelKey as any)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
