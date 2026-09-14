import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Award, Sun, Moon, Languages, User, Heart, Users, ChevronDown, LogIn, LogOut, ShieldCheck, Check, Globe, Bell } from 'lucide-react';
import { StudentProfile, UserRole } from '../../types';
import { LanguageCode, SUPPORTED_LANGUAGES, getTranslation } from '../../i18n/translations';
import { NotificationService } from '../../services/notificationService';
import { NotificationCenterModal } from '../notifications/NotificationCenterModal';
import { CloudSyncStatusBadge } from '../common/CloudSyncStatusBadge';
import { CloudSyncModal } from '../common/CloudSyncModal';

interface HeaderProps {
  profile: StudentProfile;
  activeLanguage: LanguageCode;
  activeTheme: 'light' | 'dark' | 'system';
  currentRole: UserRole;
  authUser: { email: string; displayName: string; role: UserRole } | null;
  onRoleChange: (role: UserRole) => void;
  onLanguageChange: (lang: LanguageCode) => void;
  onThemeToggle: () => void;
  onNavigate: (section: any) => void;
  onOpenAuthModal: (mode: 'login' | 'signup') => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeLanguage,
  activeTheme,
  currentRole,
  authUser,
  onRoleChange,
  onLanguageChange,
  onThemeToggle,
  onNavigate,
  onOpenAuthModal,
  onLogout,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(() => NotificationService.getUnreadCount());

  useEffect(() => {
    const updateCount = () => {
      setUnreadNotifsCount(NotificationService.getUnreadCount());
    };
    updateCount();
    if (typeof window !== 'undefined') {
      window.addEventListener('eduai_notifications_updated', updateCount);
      return () => window.removeEventListener('eduai_notifications_updated', updateCount);
    }
  }, []);

  const activeLangOption = SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage) || SUPPORTED_LANGUAGES[0];

  const handleSelectRole = (role: UserRole) => {
    onRoleChange(role);
    setRoleDropdownOpen(false);
    if (role === 'parent') {
      onNavigate('parent-dashboard');
    } else if (role === 'teacher') {
      onNavigate('teacher-dashboard');
    } else if (role === 'admin') {
      onNavigate('admin-dashboard');
    } else {
      onNavigate('home');
    }
  };

  const handleSelectLanguage = (code: LanguageCode) => {
    onLanguageChange(code);
    setLangDropdownOpen(false);
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'parent':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300/50">
            <Heart className="w-3.5 h-3.5 text-purple-600 fill-current" />
            <span className="hidden sm:inline">Parent Mode</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </span>
        );
      case 'teacher':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300/50">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Teacher Mode</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </span>
        );
      case 'admin':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-indigo-950 dark:text-indigo-200 border border-slate-700 dark:border-indigo-800 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Admin Mode</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="hidden sm:inline">Student Mode</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <div
          onClick={() => onNavigate('home')}
          className="flex cursor-pointer items-center gap-2.5 transition-transform active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500 bg-indigo-600 text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              EduAI <span className="text-indigo-600 dark:text-indigo-400">Master</span>
            </h1>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Class {profile.classLevel} • {profile.board}
            </p>
          </div>
        </div>

        {/* Role Switcher & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="focus:outline-none transition-transform active:scale-95"
              title="Switch User Role"
            >
              {getRoleBadge()}
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                  Select Active Role
                </div>
                <button
                  onClick={() => handleSelectRole('student')}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    currentRole === 'student' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>Student Portal</span>
                </button>
                <button
                  onClick={() => handleSelectRole('parent')}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    currentRole === 'parent' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Heart className="w-4 h-4 text-purple-500 fill-current" />
                  <span>Parent Dashboard</span>
                </button>
                <button
                  onClick={() => handleSelectRole('teacher')}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    currentRole === 'teacher' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Teacher Dashboard</span>
                </button>
                <button
                  onClick={() => handleSelectRole('admin')}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-800 pt-2 ${
                    currentRole === 'admin' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span className="flex items-center justify-between flex-1">
                    <span>Admin Console</span>
                    <span className="text-[9px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">PIN</span>
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Daily Streak */}
          <div className="hidden sm:flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400">
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{profile.streakDays}d</span>
          </div>

          {/* XP & Level */}
          <div
            onClick={() => onNavigate('achievements')}
            className="hidden lg:flex cursor-pointer items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Lvl {profile.level}</span>
            <span className="text-indigo-400">•</span>
            <span>{profile.xp} XP</span>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex min-h-[40px] items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-2.5 sm:px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              title="Change Display Language"
              aria-label="Change Display Language"
            >
              <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{activeLangOption.flag}</span>
              <span className="hidden sm:inline font-bold">{activeLangOption.label}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {getTranslation(activeLanguage, 'switchLanguage')}
                  </div>

                  <div className="space-y-1">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        disabled={!lang.isAvailable}
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors active:scale-[0.98] ${
                          activeLanguage === lang.code
                            ? 'bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : lang.isAvailable
                            ? 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                            : 'cursor-not-allowed opacity-40 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <div>
                            <p className="font-semibold">{lang.nativeLabel}</p>
                            {!lang.isAvailable && (
                              <span className="text-[10px] text-slate-400">Coming soon</span>
                            )}
                          </div>
                        </div>
                        {activeLanguage === lang.code && (
                          <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Cloud Sync Status Badge */}
          <CloudSyncStatusBadge onOpenModal={() => setIsCloudSyncModalOpen(true)} />

          {/* Notification Bell Button */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            title="Notifications & Reminders"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-extrabold text-white shadow-xs animate-bounce">
                {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            title="Toggle Theme"
            aria-label="Toggle Dark/Light Mode"
          >
            {activeTheme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* AUTH STATUS / ACCOUNT CONTROL BUTTONS */}
          {authUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('profile')}
                className="flex min-h-[40px] items-center space-x-2 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                title={`Logged in as ${authUser.displayName}`}
              >
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {authUser.displayName ? authUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline max-w-[90px] truncate">{authUser.displayName}</span>
              </button>

              <button
                onClick={() => onLogout?.()}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuthModal('login')}
              className="flex min-h-[40px] items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Cloud Sync Details Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* Notification Center Slide-over Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={onNavigate}
      />
    </header>
  );
};
