import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Volume2,
  Clock,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  Calendar,
  RotateCcw,
  GraduationCap,
  HelpCircle,
  Flame,
  Trophy,
  Users,
  Heart,
  Target,
  TrendingUp,
  Bot,
} from 'lucide-react';
import { NotificationPreferences } from '../../types/notifications';
import { NotificationService } from '../../services/notificationService';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesUpdated?: () => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
  onPreferencesUpdated,
}) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => NotificationService.getPreferences());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [testSent, setTestSent] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrefs(NotificationService.getPreferences());
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleCategory = (key: keyof NotificationPreferences['types']) => {
    const updated: NotificationPreferences = {
      ...prefs,
      types: {
        ...prefs.types,
        [key]: !prefs.types[key],
      },
    };
    setPrefs(updated);
    NotificationService.savePreferences(updated);
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  const handleTimeChange = (key: keyof NotificationPreferences['reminderTimes'], value: string | number) => {
    const updated: NotificationPreferences = {
      ...prefs,
      reminderTimes: {
        ...prefs.reminderTimes,
        [key]: value,
      },
    };
    setPrefs(updated);
    NotificationService.savePreferences(updated);
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  const handleQuietHoursToggle = () => {
    const updated: NotificationPreferences = {
      ...prefs,
      quietHours: {
        ...prefs.quietHours,
        enabled: !prefs.quietHours.enabled,
      },
    };
    setPrefs(updated);
    NotificationService.savePreferences(updated);
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  const handleQuietHoursTimeChange = (field: 'startTime' | 'endTime', val: string) => {
    const updated: NotificationPreferences = {
      ...prefs,
      quietHours: {
        ...prefs.quietHours,
        [field]: val,
      },
    };
    setPrefs(updated);
    NotificationService.savePreferences(updated);
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  const handleToggleSound = () => {
    const updated = { ...prefs, soundEnabled: !prefs.soundEnabled };
    setPrefs(updated);
    NotificationService.savePreferences(updated);
    if (updated.soundEnabled) {
      NotificationService.playNotificationSound();
    }
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  const handleRequestPush = async () => {
    const res = await NotificationService.requestBrowserPermission();
    setPermissionStatus(res);
    setPrefs(NotificationService.getPreferences());
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  const handleSendTest = () => {
    NotificationService.sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
    if (onPreferencesUpdated) onPreferencesUpdated();
  };

  const notificationCategories = [
    {
      key: 'daily-goal' as const,
      label: 'Daily Study Goals',
      description: 'Morning goals and daily XP target milestones',
      icon: <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      key: 'study-plan' as const,
      label: 'Study Planner Tasks',
      description: 'Alerts when scheduled study tasks are due',
      icon: <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    },
    {
      key: 'revision-reminder' as const,
      label: 'Smart Revision & Spaced Repetition',
      description: 'Ebbinghaus memory curve review alerts',
      icon: <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
    },
    {
      key: 'upcoming-exam' as const,
      label: 'Upcoming Exams & Mock Tests',
      description: 'Countdown notices before Board & Term exams',
      icon: <GraduationCap className="w-4 h-4 text-red-600 dark:text-red-400" />,
    },
    {
      key: 'topic-improved' as const,
      label: 'Topic Mastery & Improvements',
      description: 'Celebrations when your accuracy increases in weak areas',
      icon: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      key: 'coach-insight' as const,
      label: 'AI Coach Focus Insights',
      description: 'Personalized study suggestions from AI learning coach',
      icon: <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
    },
    {
      key: 'quiz-reminder' as const,
      label: 'Practice Quizzes & MCQs',
      description: 'Recommendations to test recently revised concepts',
      icon: <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      key: 'streak-reminder' as const,
      label: 'Streak Protection Alert',
      description: 'Reminder to practice before midnight to protect streaks',
      icon: <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />,
    },
    {
      key: 'achievement' as const,
      label: 'Achievements & Badges',
      description: 'Notifications when you unlock new badges and XP rewards',
      icon: <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    },
    {
      key: 'level-up' as const,
      label: 'Level Ups & Milestones',
      description: 'Celebrations when advancing student levels',
      icon: <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
    },
    {
      key: 'teacher-assignment' as const,
      label: 'Teacher Assignments & Feedback',
      description: 'Homework notices and teacher notes',
      icon: <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      key: 'parent-update' as const,
      label: 'Parent Digest & Reports',
      description: 'Weekly learning reports and parent sync updates',
      icon: <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Notification & Reminder Preferences
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize when, what, and how you receive study alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Browser & Sound Delivery */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Delivery Channels
            </h4>

            {/* Browser Push Permission Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Browser Push Alerts</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        permissionStatus === 'granted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : permissionStatus === 'denied'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {permissionStatus === 'granted'
                        ? 'Granted'
                        : permissionStatus === 'denied'
                        ? 'Blocked'
                        : 'Not Requested'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Receive background alerts even when the tab is inactive
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {permissionStatus !== 'granted' ? (
                  <button
                    onClick={handleRequestPush}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-transform active:scale-95"
                  >
                    Enable Browser Push
                  </button>
                ) : (
                  <button
                    onClick={handleSendTest}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-500" />
                    {testSent ? 'Sent!' : 'Send Test Alert'}
                  </button>
                )}
              </div>
            </div>

            {/* Sound Effects Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Alert Audio Chime</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Play a gentle harmonic chime on new reminders and XP alerts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => NotificationService.playNotificationSound()}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Preview Tone
                </button>
                <button
                  onClick={handleToggleSound}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    prefs.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      prefs.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Custom Reminder Times */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Custom Daily Reminder Times
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Morning Study Target */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Morning Goal Call</span>
                  <p className="text-[10px] text-slate-400">Daily plan kickoff</p>
                </div>
                <input
                  type="time"
                  value={prefs.reminderTimes.morningGoalTime}
                  onChange={(e) => handleTimeChange('morningGoalTime', e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Afternoon Planner Tasks */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Study Plan Check</span>
                  <p className="text-[10px] text-slate-400">Scheduled task nudge</p>
                </div>
                <input
                  type="time"
                  value={prefs.reminderTimes.afternoonTaskTime}
                  onChange={(e) => handleTimeChange('afternoonTaskTime', e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Evening Smart Revision */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Evening Revision</span>
                  <p className="text-[10px] text-slate-400">Spaced recall drill</p>
                </div>
                <input
                  type="time"
                  value={prefs.reminderTimes.eveningRevisionTime}
                  onChange={(e) => handleTimeChange('eveningRevisionTime', e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Night Streak Alert */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Streak Protection</span>
                  <p className="text-[10px] text-slate-400">Before midnight alert</p>
                </div>
                <input
                  type="time"
                  value={prefs.reminderTimes.nightStreakTime}
                  onChange={(e) => handleTimeChange('nightStreakTime', e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Exam Countdown Threshold */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Upcoming Exam Notice</span>
                <p className="text-[10px] text-slate-400">Start reminder notices X days prior to Board & Mock exams</p>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={prefs.reminderTimes.examNoticeDaysBefore}
                  onChange={(e) => handleTimeChange('examNoticeDaysBefore', Number(e.target.value))}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1 day before</option>
                  <option value={2}>2 days before</option>
                  <option value={3}>3 days before</option>
                  <option value={5}>5 days before</option>
                  <option value={7}>7 days before</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Notification Categories / Toggles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Notification Types & Triggers (10 Categories)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {notificationCategories.map((cat) => {
                const isEnabled = prefs.types[cat.key];
                return (
                  <div
                    key={cat.key}
                    onClick={() => handleToggleCategory(cat.key)}
                    className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                      isEnabled
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 pr-2">
                      <div className="mt-0.5">{cat.icon}</div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {cat.description}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCategory(cat.key);
                      }}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                        isEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Quiet Hours / Do Not Disturb */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Quiet Hours (Do Not Disturb)</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Mute all sound chimes and push alerts during sleep or focused study hours
                  </p>
                </div>
              </div>

              <button
                onClick={handleQuietHoursToggle}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  prefs.quietHours.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    prefs.quietHours.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {prefs.quietHours.enabled && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">From</span>
                <input
                  type="time"
                  value={prefs.quietHours.startTime}
                  onChange={(e) => handleQuietHoursTimeChange('startTime', e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Until</span>
                <input
                  type="time"
                  value={prefs.quietHours.endTime}
                  onChange={(e) => handleQuietHoursTimeChange('endTime', e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences auto-saved</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-transform active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
