import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Flame,
  Trophy,
  Sparkles,
  Calendar,
  RotateCcw,
  GraduationCap,
  HelpCircle,
  Users,
  Heart,
  Target,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  Send,
  Volume2,
  Search,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Bot,
} from 'lucide-react';
import { AppNotification, NotificationFilterCategory, NotificationType, NotificationPreferences } from '../../types/notifications';
import { NavigationSection, StudentProfile } from '../../types';
import { LanguageCode } from '../../i18n/translations';
import { NotificationService } from '../../services/notificationService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { NotificationPreferencesModal } from '../notifications/NotificationPreferencesModal';

interface NotificationsViewProps {
  profile: StudentProfile;
  onNavigate: (section: NavigationSection) => void;
  lang: LanguageCode;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  profile,
  onNavigate,
  lang,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationFilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => NotificationService.getPreferences());
  const [browserPerm, setBrowserPerm] = useState<string>('default');
  const [testSent, setTestSent] = useState(false);

  const loadData = () => {
    NotificationService.syncContextualReminders();
    setNotifications(NotificationService.getNotifications());
    setPrefs(NotificationService.getPreferences());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPerm(Notification.permission);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener('eduai_notifications_updated', handleUpdate);
      return () => window.removeEventListener('eduai_notifications_updated', handleUpdate);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((item) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        (item.metadata?.subject && item.metadata.subject.toLowerCase().includes(q)) ||
        (item.metadata?.chapter && item.metadata.chapter.toLowerCase().includes(q)) ||
        (item.metadata?.topic && item.metadata.topic.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Category filter
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !item.isRead;
    if (activeFilter === 'reminders') {
      return item.type === 'daily-goal' || item.type === 'streak-reminder' || item.type === 'study-plan';
    }
    if (activeFilter === 'academic') {
      return (
        item.type === 'revision-reminder' ||
        item.type === 'upcoming-exam' ||
        item.type === 'quiz-reminder' ||
        item.type === 'study-plan' ||
        item.type === 'topic-improved' ||
        item.type === 'coach-insight'
      );
    }
    if (activeFilter === 'gamification') {
      return item.type === 'achievement' || item.type === 'level-up' || item.type === 'topic-improved' || item.type === 'streak-reminder';
    }
    if (activeFilter === 'portals') {
      return item.type === 'teacher-assignment' || item.type === 'parent-update';
    }
    return true;
  });

  const handleToggleRead = (id: string) => {
    NotificationService.toggleRead(id);
    loadData();
  };

  const handleDelete = (id: string) => {
    NotificationService.deleteNotification(id);
    loadData();
  };

  const handleMarkAllAsRead = () => {
    NotificationService.markAllAsRead();
    loadData();
  };

  const handleClearRead = () => {
    NotificationService.clearAllRead();
    loadData();
  };

  const handleActionClick = (item: AppNotification) => {
    NotificationService.markAsRead(item.id);
    loadData();
    if (item.actionSection) {
      onNavigate(item.actionSection);
    }
  };

  const handleSendTest = () => {
    NotificationService.sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
    loadData();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'daily-goal':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
        );
      case 'study-plan':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
        );
      case 'revision-reminder':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <RotateCcw className="w-5 h-5" />
          </div>
        );
      case 'upcoming-exam':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 animate-pulse">
            <GraduationCap className="w-5 h-5" />
          </div>
        );
      case 'topic-improved':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        );
      case 'coach-insight':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
        );
      case 'quiz-reminder':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <HelpCircle className="w-5 h-5" />
          </div>
        );
      case 'streak-reminder':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-950/60 dark:text-amber-400">
            <Flame className="w-5 h-5 fill-amber-500" />
          </div>
        );
      case 'achievement':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
        );
      case 'level-up':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
        );
      case 'teacher-assignment':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        );
      case 'parent-update':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400">
            <Heart className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                Notification Center & Reminders
              </span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-extrabold animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Study Alerts, Deadlines & Reminders
            </h2>
            <p className="text-sm text-indigo-100/90 max-w-2xl">
              Stay organized with automated study targets, Spaced Repetition recall alerts, upcoming Board exam countdowns, and teacher assignments.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsPreferencesOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-xs transition-all active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Reminder Settings</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <CheckCheck className="w-4 h-4 text-indigo-600" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Reminder Schedule Timeline */}
        <div className="mt-6 pt-5 border-t border-indigo-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
            <div className="flex items-center gap-1.5 text-indigo-200 font-bold mb-1">
              <Target className="w-3.5 h-3.5" />
              <span>Morning Goal</span>
            </div>
            <p className="text-base font-extrabold text-white">{prefs.reminderTimes.morningGoalTime}</p>
            <p className="text-[10px] text-indigo-200/80">Daily XP kickoff</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
            <div className="flex items-center gap-1.5 text-indigo-200 font-bold mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Planner Task</span>
            </div>
            <p className="text-base font-extrabold text-white">{prefs.reminderTimes.afternoonTaskTime}</p>
            <p className="text-[10px] text-indigo-200/80">Scheduled tasks</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
            <div className="flex items-center gap-1.5 text-indigo-200 font-bold mb-1">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Smart Revision</span>
            </div>
            <p className="text-base font-extrabold text-white">{prefs.reminderTimes.eveningRevisionTime}</p>
            <p className="text-[10px] text-indigo-200/80">Spaced recall drill</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Streak Alert</span>
            </div>
            <p className="text-base font-extrabold text-white">{prefs.reminderTimes.nightStreakTime}</p>
            <p className="text-[10px] text-indigo-200/80">Before midnight alert</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Search, Filter Tabs & Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Bar & Filter Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search alerts, subjects, tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendTest}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 active:scale-95"
              >
                <Send className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{testSent ? 'Sent!' : 'Test Alert'}</span>
              </button>

              <button
                onClick={handleClearRead}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Clear Read</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all' as const, label: 'All Alerts', count: notifications.length },
              { id: 'unread' as const, label: 'Unread', count: unreadCount },
              { id: 'reminders' as const, label: 'Reminders & Goals' },
              { id: 'academic' as const, label: 'Exams & Revision' },
              { id: 'gamification' as const, label: 'Rewards & Levels' },
              { id: 'portals' as const, label: 'Teacher & Parent' },
            ].map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        active ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notification List Cards */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <Card className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No notifications found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  {searchQuery
                    ? `No notifications matched "${searchQuery}". Try searching for another keyword or clear filter.`
                    : 'You are completely caught up! We will notify you when study tasks or exams require your attention.'}
                </p>
              </Card>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-3xl border transition-all ${
                    !item.isRead
                      ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/80 shadow-md ring-1 ring-indigo-500/10'
                      : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="shrink-0">{getNotificationIcon(item.type)}</div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-sm font-bold truncate ${
                            !item.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.title}
                        </h4>

                        {!item.isRead && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            New
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Metadata Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {item.metadata?.subject && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {item.metadata.subject}
                          </span>
                        )}
                        {item.metadata?.chapter && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {item.metadata.chapter}
                          </span>
                        )}
                        {typeof item.metadata?.xpReward === 'number' && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            +{item.metadata.xpReward} XP Reward
                          </span>
                        )}
                        {item.metadata?.urgencyText && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                            {item.metadata.urgencyText}
                          </span>
                        )}
                        {item.metadata?.senderName && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            {item.metadata.senderName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center sm:flex-col items-end gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {item.actionSection && (
                      <button
                        onClick={() => handleActionClick(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-transform active:scale-95"
                      >
                        <span>{item.actionLabel || 'Launch'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleRead(item.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                      >
                        {item.isRead ? 'Mark Unread' : 'Mark Read'}
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Preferences, Channels & Summary Status */}
        <div className="space-y-4">
          {/* Delivery Status Card */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delivery Channels</h4>
              </div>
              <button
                onClick={() => setIsPreferencesOpen(true)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Configure
              </button>
            </div>

            {/* Browser Push */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Browser Push</span>
                  <span className="text-[10px] text-slate-400">Background system alerts</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  browserPerm === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {browserPerm === 'granted' ? 'Active' : 'Disabled'}
              </span>
            </div>

            {/* Audio Chime */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Harmonic Audio</span>
                  <span className="text-[10px] text-slate-400">Pleasant web chime</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  prefs.soundEnabled
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {prefs.soundEnabled ? 'Enabled' : 'Muted'}
              </span>
            </div>
          </Card>

          {/* Active Reminder Triggers Summary */}
          <Card className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Reminder Triggers
            </h4>

            <div className="space-y-2 text-xs">
              {[
                { label: 'Daily Study Goal', time: prefs.reminderTimes.morningGoalTime, enabled: prefs.types['daily-goal'] },
                { label: 'Study Planner Tasks', time: prefs.reminderTimes.afternoonTaskTime, enabled: prefs.types['study-plan'] },
                { label: 'Smart Revision Recall', time: prefs.reminderTimes.eveningRevisionTime, enabled: prefs.types['revision-reminder'] },
                { label: 'Streak Protection', time: prefs.reminderTimes.nightStreakTime, enabled: prefs.types['streak-reminder'] },
                { label: 'Exam Countdown', time: `${prefs.reminderTimes.examNoticeDaysBefore}d notice`, enabled: prefs.types['upcoming-exam'] },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{item.time}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${item.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      title={item.enabled ? 'Enabled' : 'Disabled'}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreferencesOpen(true)}
              className="w-full text-xs font-bold mt-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              Customize All 10 Notification Triggers
            </Button>
          </Card>
        </div>
      </div>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => {
          setIsPreferencesOpen(false);
          loadData();
        }}
        onPreferencesUpdated={loadData}
      />
    </div>
  );
};
