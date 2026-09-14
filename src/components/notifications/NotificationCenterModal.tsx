import React, { useState, useEffect } from 'react';
import {
  X,
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
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  SlidersHorizontal,
  ChevronRight,
  Send,
  Volume2,
} from 'lucide-react';
import { AppNotification, NotificationFilterCategory, NotificationType } from '../../types/notifications';
import { NavigationSection } from '../../types';
import { NotificationService } from '../../services/notificationService';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: NavigationSection) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationFilterCategory>('all');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [browserPerm, setBrowserPerm] = useState<string>('default');

  const refreshNotifications = () => {
    setNotifications(NotificationService.getNotifications());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPerm(Notification.permission);
    }
  };

  useEffect(() => {
    if (isOpen) {
      NotificationService.syncContextualReminders();
      refreshNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => refreshNotifications();
    if (typeof window !== 'undefined') {
      window.addEventListener('eduai_notifications_updated', handleUpdate);
      return () => window.removeEventListener('eduai_notifications_updated', handleUpdate);
    }
  }, []);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((item) => {
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
        item.type === 'study-plan'
      );
    }
    if (activeFilter === 'gamification') {
      return item.type === 'achievement' || item.type === 'level-up';
    }
    if (activeFilter === 'portals') {
      return item.type === 'teacher-assignment' || item.type === 'parent-update';
    }
    return true;
  });

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    NotificationService.toggleRead(id);
    refreshNotifications();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    NotificationService.deleteNotification(id);
    refreshNotifications();
  };

  const handleMarkAllAsRead = () => {
    NotificationService.markAllAsRead();
    refreshNotifications();
  };

  const handleClearRead = () => {
    NotificationService.clearAllRead();
    refreshNotifications();
  };

  const handleActionClick = (item: AppNotification) => {
    NotificationService.markAsRead(item.id);
    refreshNotifications();
    if (item.actionSection) {
      onNavigate(item.actionSection);
      onClose();
    }
  };

  const handleEnablePush = async () => {
    await NotificationService.requestBrowserPermission();
    refreshNotifications();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'daily-goal':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
        );
      case 'study-plan':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
        );
      case 'revision-reminder':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <RotateCcw className="w-5 h-5" />
          </div>
        );
      case 'upcoming-exam':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 animate-pulse">
            <GraduationCap className="w-5 h-5" />
          </div>
        );
      case 'quiz-reminder':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <HelpCircle className="w-5 h-5" />
          </div>
        );
      case 'streak-reminder':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/60 dark:text-amber-400">
            <Flame className="w-5 h-5 fill-amber-500" />
          </div>
        );
      case 'achievement':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
        );
      case 'level-up':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
        );
      case 'teacher-assignment':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        );
      case 'parent-update':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400">
            <Heart className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  const filterTabs: { id: NotificationFilterCategory; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'reminders', label: 'Reminders' },
    { id: 'academic', label: 'Academic' },
    { id: 'gamification', label: 'Rewards' },
    { id: 'portals', label: 'Portals' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        {/* Backdrop click */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Slide-over Container */}
        <div className="relative z-10 flex flex-col w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Study reminders, tasks & updates</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPreferencesOpen(true)}
                className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                title="Notification Preferences"
              >
                <Settings className="w-4 h-4" />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Browser Permission Banner (if not granted) */}
          {browserPerm !== 'granted' && (
            <div className="px-5 py-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Enable background push alerts for exam & streak reminders</span>
              </div>
              <button
                onClick={handleEnablePush}
                className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shrink-0 shadow-xs active:scale-95"
              >
                Enable
              </button>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-slate-100 dark:border-slate-800 shrink-0 no-scrollbar">
            {filterTabs.map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        active ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-400 mb-3">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">You're all caught up!</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[240px] mt-1">
                  No notifications in this category. We will alert you when study goals, exams, or revision sessions are due.
                </p>
                <button
                  onClick={() => setActiveFilter('all')}
                  className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View all notifications
                </button>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => NotificationService.markAsRead(item.id)}
                  className={`group relative flex flex-col p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    !item.isRead
                      ? 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-800/60 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="shrink-0">{getNotificationIcon(item.type)}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs font-bold truncate ${
                            !item.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {item.timestamp}
                          </span>
                          {!item.isRead && (
                            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" title="Unread" />
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Metadata Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {item.metadata?.subject && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {item.metadata.subject}
                          </span>
                        )}
                        {item.metadata?.chapter && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {item.metadata.chapter}
                          </span>
                        )}
                        {typeof item.metadata?.xpReward === 'number' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            +{item.metadata.xpReward} XP
                          </span>
                        )}
                        {item.metadata?.urgencyText && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                            {item.metadata.urgencyText}
                          </span>
                        )}
                        {item.metadata?.senderName && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            {item.metadata.senderName}
                          </span>
                        )}
                      </div>

                      {/* Action Button & Controls */}
                      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                        {item.actionSection ? (
                          <button
                            onClick={() => handleActionClick(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-transform active:scale-95"
                          >
                            <span>{item.actionLabel || 'View'}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleToggleRead(item.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors text-[11px]"
                            title={item.isRead ? 'Mark as unread' : 'Mark as read'}
                          >
                            {item.isRead ? 'Mark Unread' : 'Mark Read'}
                          </button>

                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0 text-xs">
            <button
              onClick={handleClearRead}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Read</span>
            </button>

            <button
              onClick={() => setIsPreferencesOpen(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Reminder Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        onPreferencesUpdated={refreshNotifications}
      />
    </>
  );
};
