import {
  AppNotification,
  NotificationPreferences,
  NotificationType,
  NotificationFilterCategory,
} from '../types/notifications';
import { StorageService } from './storageService';

const KEYS = {
  NOTIFICATIONS: 'eduai_notifications',
  PREFERENCES: 'eduai_notification_prefs',
  LAST_SYNC: 'eduai_notif_last_sync',
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  browserPushEnabled: false,
  browserPermissionStatus: typeof window !== 'undefined' && 'Notification' in window ? (Notification.permission as any) : 'unsupported',
  types: {
    'daily-goal': true,
    'study-plan': true,
    'revision-reminder': true,
    'upcoming-exam': true,
    'quiz-reminder': true,
    'streak-reminder': true,
    'topic-improved': true,
    'coach-insight': true,
    'achievement': true,
    'level-up': true,
    'teacher-assignment': true,
    'parent-update': true,
  },
  reminderTimes: {
    morningGoalTime: '08:00',
    afternoonTaskTime: '14:00',
    eveningRevisionTime: '18:30',
    nightStreakTime: '21:00',
    examNoticeDaysBefore: 3,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
  },
};

const DEFAULT_INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-daily-1',
    type: 'daily-goal',
    title: 'Your daily goal is almost complete! 🎯',
    message: 'You have earned 65 / 100 XP today. Complete 1 quick quiz or revision drill to reach 100%!',
    timestamp: '15m ago',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: false,
    priority: 'normal',
    category: 'reminders',
    actionSection: 'quiz',
    actionLabel: 'Take Quick Quiz',
    dedupKey: 'init-daily-goal',
    metadata: {
      xpReward: 35,
      accentColor: 'indigo',
    },
    isPinned: true,
  },
  {
    id: 'notif-streak-1',
    type: 'streak-reminder',
    title: 'Your streak may be missed today! 🔥',
    message: 'You are on a 7-day study streak! Practice any chapter today before midnight to secure your streak multiplier.',
    timestamp: '45m ago',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: false,
    priority: 'high',
    category: 'reminders',
    actionSection: 'smart-revision',
    actionLabel: '2-Min Revision',
    dedupKey: 'init-streak-risk',
    metadata: {
      accentColor: 'amber',
    },
  },
  {
    id: 'notif-rev-1',
    type: 'revision-reminder',
    title: 'This topic needs revision: Spherical Mirrors ⚡',
    message: 'Current accuracy is 42% in ray diagrams and sign conventions. Review formula traps in Smart Revision.',
    timestamp: '2h ago',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    isRead: false,
    priority: 'high',
    category: 'academic',
    actionSection: 'smart-revision',
    actionLabel: 'Launch Revision',
    dedupKey: 'init-topic-rev',
    metadata: {
      subject: 'Science',
      chapter: 'Light - Reflection & Refraction',
      urgencyText: 'Critical Revision',
      accentColor: 'rose',
    },
  },
  {
    id: 'notif-task-1',
    type: 'study-plan',
    title: 'You have an unfinished study task 📋',
    message: 'Mathematics: Solve 5 Quadratic Equation application problems. 20 minutes estimated.',
    timestamp: '3h ago',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    isRead: false,
    priority: 'normal',
    category: 'academic',
    actionSection: 'study-planner',
    actionLabel: 'Open Planner',
    dedupKey: 'init-task-pending',
    metadata: {
      subject: 'Mathematics',
      chapter: 'Quadratic Equations',
      accentColor: 'blue',
    },
  },
  {
    id: 'notif-exam-1',
    type: 'upcoming-exam',
    title: 'Your exam is approaching in 4 days! ⏳',
    message: 'CBSE Class 10 Science Mid-Term Mock Assessment is approaching. Test your readiness with the timed simulator.',
    timestamp: '4h ago',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    isRead: false,
    priority: 'urgent',
    category: 'academic',
    actionSection: 'exam-mode',
    actionLabel: 'Practice Mock Exam',
    dedupKey: 'init-exam-approaching',
    metadata: {
      subject: 'Science',
      daysRemaining: 4,
      urgencyText: 'High Weightage',
      accentColor: 'red',
    },
  },
  {
    id: 'notif-improved-1',
    type: 'topic-improved',
    title: 'You improved in Chemical Reactions! 📈',
    message: 'Outstanding progress! Accuracy increased from 40% to 75% after your revision session. +50 XP bonus earned.',
    timestamp: '5h ago',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    isRead: true,
    priority: 'normal',
    category: 'academic',
    actionSection: 'progress',
    actionLabel: 'View Analytics',
    dedupKey: 'init-topic-improved',
    metadata: {
      subject: 'Science',
      topic: 'Chemical Reactions & Equations',
      accuracyBefore: 40,
      accuracyAfter: 75,
      xpReward: 50,
      accentColor: 'emerald',
    },
  },
  {
    id: 'notif-ach-1',
    type: 'achievement',
    title: 'New Achievement Unlocked: Quiz Master 🏆',
    message: 'You have achieved a 90%+ score across 3 consecutive practice tests! +100 XP added to your profile.',
    timestamp: '1d ago',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    isRead: true,
    priority: 'normal',
    category: 'gamification',
    actionSection: 'achievements',
    actionLabel: 'View Achievements',
    dedupKey: 'init-ach-quiz-master',
    metadata: {
      xpReward: 100,
      accentColor: 'amber',
    },
  },
  {
    id: 'notif-coach-1',
    type: 'coach-insight',
    title: 'AI Coach: Personalized Study Focus 🤖',
    message: 'Coach analyzed your recent quiz mistakes: focus on Optics formulas today for maximum score boost.',
    timestamp: '1d ago',
    createdAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
    isRead: true,
    priority: 'normal',
    category: 'academic',
    actionSection: 'learning-coach',
    actionLabel: 'View Coach Plan',
    dedupKey: 'init-coach-insight',
    metadata: {
      accentColor: 'purple',
    },
  },
];

export class NotificationService {
  // 1. Get all notifications
  static getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(KEYS.NOTIFICATIONS);
      if (!data) {
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_INITIAL_NOTIFICATIONS));
        return DEFAULT_INITIAL_NOTIFICATIONS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_INITIAL_NOTIFICATIONS;
    }
  }

  // 2. Save notifications
  static saveNotifications(notifications: AppNotification[]): void {
    try {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications.slice(0, 60)));
      this.dispatchUpdateEvent();
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }

  // 3. Get Preferences
  static getPreferences(): NotificationPreferences {
    try {
      const data = localStorage.getItem(KEYS.PREFERENCES);
      if (!data) {
        return DEFAULT_PREFERENCES;
      }
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        types: { ...DEFAULT_PREFERENCES.types, ...(parsed.types || {}) },
        reminderTimes: { ...DEFAULT_PREFERENCES.reminderTimes, ...(parsed.reminderTimes || {}) },
        quietHours: { ...DEFAULT_PREFERENCES.quietHours, ...(parsed.quietHours || {}) },
      };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  // 4. Save Preferences
  static savePreferences(prefs: NotificationPreferences): void {
    try {
      localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
      this.dispatchUpdateEvent();
    } catch (e) {
      console.error('Failed to save preferences', e);
    }
  }

  // 5. Unread count
  static getUnreadCount(): number {
    const list = this.getNotifications();
    return list.filter((n) => !n.isRead).length;
  }

  // 6. Mark single notification as read/unread
  static toggleRead(id: string): void {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n));
    this.saveNotifications(updated);
  }

  static markAsRead(id: string): void {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveNotifications(updated);
  }

  // 7. Mark all as read
  static markAllAsRead(): void {
    const list = this.getNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(updated);
  }

  // 8. Delete notification
  static deleteNotification(id: string): void {
    const list = this.getNotifications();
    const updated = list.filter((n) => n.id !== id);
    this.saveNotifications(updated);
  }

  // 9. Clear all read notifications
  static clearAllRead(): void {
    const list = this.getNotifications();
    const updated = list.filter((n) => !n.isRead || n.isPinned);
    this.saveNotifications(updated);
  }

  // 10. Add new notification with Anti-Spam & Deduplication Safeguards
  static addNotification(
    item: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean }
  ): AppNotification | null {
    const prefs = this.getPreferences();

    // RULE 1: Respect User Preferences - If type is disabled, do not add or alert
    if (prefs.types[item.type] === false) {
      return null;
    }

    const current = this.getNotifications();
    const now = Date.now();

    // RULE 2: Duplicate Prevention
    // Check 1: Explicit dedupKey match within 18 hours
    if (item.dedupKey) {
      const existingWithKey = current.find(
        (n) => n.dedupKey === item.dedupKey && Math.abs(new Date(n.createdAt).getTime() - now) < 18 * 3600 * 1000
      );
      if (existingWithKey) {
        return null;
      }
    }

    // Check 2: Exact duplicate title + message within 2 hours
    const isDuplicate = current.some(
      (n) => n.title === item.title && Math.abs(new Date(n.createdAt).getTime() - now) < 2 * 3600 * 1000
    );

    if (isDuplicate) {
      return null;
    }

    const newNotif: AppNotification = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      isRead: item.isRead ?? false,
    };

    current.unshift(newNotif);
    this.saveNotifications(current);

    // Audio chime if enabled and not in quiet hours
    if (prefs.soundEnabled && !this.isInQuietHours(prefs)) {
      this.playNotificationSound();
    }

    // Browser push notification if permitted
    if (
      prefs.browserPushEnabled &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(newNotif.title, {
          body: newNotif.message,
          icon: '/favicon.ico',
        });
      } catch (err) {
        // ignore push error
      }
    }

    return newNotif;
  }

  // Check Quiet Hours
  static isInQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHours.enabled) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = prefs.quietHours.startTime.split(':').map(Number);
    const [endH, endM] = prefs.quietHours.endTime.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal <= endTotal) {
      return currentMinutes >= startTotal && currentMinutes <= endTotal;
    } else {
      // Overnight (e.g. 22:00 to 07:00)
      return currentMinutes >= startTotal || currentMinutes <= endTotal;
    }
  }

  // Safe Browser Permission Management
  static async requestBrowserPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      const prefs = this.getPreferences();
      prefs.browserPermissionStatus = permission as any;
      if (permission === 'granted') {
        prefs.browserPushEnabled = true;
      } else {
        prefs.browserPushEnabled = false;
      }
      this.savePreferences(prefs);
      return permission;
    } catch (e) {
      console.warn('Browser notification permission request error:', e);
      return 'denied';
    }
  }

  // Send Test Push Notification
  static sendTestNotification(): boolean {
    this.addNotification({
      type: 'daily-goal',
      title: '🔔 Test Notification Successful!',
      message: 'EduAI Master smart notification and alert system is active and functioning properly.',
      timestamp: 'Just now',
      priority: 'normal',
      category: 'reminders',
      actionSection: 'settings',
      actionLabel: 'Preferences',
      metadata: {
        accentColor: 'indigo',
      },
    });

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🔔 EduAI Master Notification Test', {
          body: 'Your smart learning alerts are connected and functioning!',
          icon: '/favicon.ico',
        });
        return true;
      } catch (err) {
        return false;
      }
    }
    return true;
  }

  // Pleasant Web Audio Chime Synthesizer
  static playNotificationSound(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      
      const now = ctx.currentTime;
      
      // Note 1 (High chime: E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2 (Resolve chord: A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1);
      gain2.gain.setValueAtTime(0.08, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.5);
    } catch (e) {
      // Audio autoplay policy might restrict without user interaction
    }
  }

  // =========================================================================
  // SMART LEARNING ALERTS ENGINE (BASED ON REAL APPLICATION DATA)
  // =========================================================================
  static syncContextualReminders(): void {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const profile = StorageService.getProfile();
      const studyPlan = StorageService.getStudyPlan();
      const weakTopics = StorageService.getWeakTopics();
      const exams = StorageService.getSavedExams();
      const activities = StorageService.getActivities();
      const prefs = this.getPreferences();

      // -----------------------------------------------------------------------
      // SMART ALERT 1: "You have an unfinished study task."
      // -----------------------------------------------------------------------
      if (prefs.types['study-plan'] && studyPlan && studyPlan.tasks) {
        const pendingTasks = studyPlan.tasks.filter((t) => !t.completed);
        if (pendingTasks.length > 0) {
          // Select high priority or first pending task
          const task = pendingTasks.find((t) => t.priority === 'High') || pendingTasks[0];
          this.addNotification({
            type: 'study-plan',
            title: `You have an unfinished study task: ${task.title}`,
            message: `${task.subjectName} • ${task.estimatedMinutes} mins estimated • Scheduled for ${task.dueDate || 'today'}. Complete it to stay on track!`,
            timestamp: 'Scheduled',
            priority: task.priority === 'High' ? 'high' : 'normal',
            category: 'academic',
            actionSection: 'study-planner',
            actionLabel: 'Open Planner',
            dedupKey: `task-pending-${task.id}-${todayStr}`,
            metadata: {
              subject: task.subjectName,
              topic: task.topicName,
              accentColor: 'blue',
            },
          });
        }
      }

      // -----------------------------------------------------------------------
      // SMART ALERT 2: "Your exam is approaching."
      // -----------------------------------------------------------------------
      if (prefs.types['upcoming-exam']) {
        const noticeDays = prefs.reminderTimes.examNoticeDaysBefore || 3;
        
        // Check saved upcoming/uncompleted exams
        const uncompletedExams = exams.filter((e) => !e.isSubmitted);
        if (uncompletedExams.length > 0) {
          const exam = uncompletedExams[0];
          const examSubject = exam.subjectId || 'Science';
          this.addNotification({
            type: 'upcoming-exam',
            title: `Your ${examSubject} exam is approaching! ⏳`,
            message: `"${exam.title}" (${exam.totalMarks || 50} Marks, ${exam.durationMinutes || 30} mins). Practice now with the timed simulator to maximize scores.`,
            timestamp: 'Upcoming',
            priority: 'urgent',
            category: 'academic',
            actionSection: 'exam-mode',
            actionLabel: 'Practice Mock Exam',
            dedupKey: `exam-approaching-${exam.id}-${todayStr}`,
            metadata: {
              subject: examSubject,
              daysRemaining: noticeDays,
              urgencyText: 'Mock Ready',
              accentColor: 'red',
            },
          });
        } else {
          // Default board milestone exam check
          this.addNotification({
            type: 'upcoming-exam',
            title: 'Your Board Mock Assessment is approaching! ⏳',
            message: 'CBSE Science & Mathematics comprehensive syllabus test is scheduled. Evaluate your preparedness with AI Exam Mode.',
            timestamp: 'In 4 days',
            priority: 'high',
            category: 'academic',
            actionSection: 'exam-mode',
            actionLabel: 'Start Mock Exam',
            dedupKey: `exam-board-milestone-${todayStr}`,
            metadata: {
              subject: 'Science & Maths',
              daysRemaining: 4,
              accentColor: 'red',
            },
          });
        }
      }

      // -----------------------------------------------------------------------
      // SMART ALERT 3: "This topic needs revision."
      // -----------------------------------------------------------------------
      if (prefs.types['revision-reminder'] && weakTopics && weakTopics.length > 0) {
        // Find critical weak topic with lowest accuracy
        const sortedWeak = [...weakTopics].sort((a, b) => a.accuracyRate - b.accuracyRate);
        const mostCritical = sortedWeak[0];

        if (mostCritical && (mostCritical.accuracyRate < 60 || mostCritical.urgency === 'Critical')) {
          this.addNotification({
            type: 'revision-reminder',
            title: `This topic needs revision: ${mostCritical.topicName}`,
            message: `Current accuracy is ${mostCritical.accuracyRate}% in ${mostCritical.subjectName}. Review key definitions and formulas in Smart Revision to boost mastery.`,
            timestamp: 'Recommended',
            priority: 'high',
            category: 'academic',
            actionSection: 'smart-revision',
            actionLabel: 'Revise Topic Now',
            dedupKey: `topic-needs-rev-${mostCritical.id}-${todayStr}`,
            metadata: {
              subject: mostCritical.subjectName,
              chapter: mostCritical.chapterName,
              topic: mostCritical.topicName,
              urgencyText: `${mostCritical.accuracyRate}% Accuracy`,
              accentColor: 'rose',
            },
          });
        }
      }

      // -----------------------------------------------------------------------
      // SMART ALERT 4: "Your daily goal is almost complete."
      // -----------------------------------------------------------------------
      if (prefs.types['daily-goal'] && profile.dailyXpGoal) {
        const goal = profile.dailyXpGoal;
        const currentXp = profile.xp || 0;
        // Estimate daily progress using activities recorded today
        const todayActivities = activities.filter(
          (a) => a.timestamp.includes('Just now') || a.timestamp.includes('m ago') || a.timestamp.includes('Today')
        );
        const earnedToday = todayActivities.reduce((sum, a) => sum + (a.xpEarned || 0), 0) || Math.min(65, currentXp % goal);
        const remaining = Math.max(0, goal - earnedToday);

        if (remaining > 0 && remaining <= goal * 0.45) {
          this.addNotification({
            type: 'daily-goal',
            title: 'Your daily goal is almost complete! 🎯',
            message: `You earned ${earnedToday} / ${goal} XP today. Just ${remaining} XP remaining to lock in your daily study target!`,
            timestamp: 'Today',
            priority: 'normal',
            category: 'reminders',
            actionSection: 'quiz',
            actionLabel: 'Complete Goal (+XP)',
            dedupKey: `goal-almost-complete-${todayStr}`,
            metadata: {
              xpReward: remaining,
              accentColor: 'indigo',
            },
          });
        }
      }

      // -----------------------------------------------------------------------
      // SMART ALERT 5: "Your streak may be missed today."
      // -----------------------------------------------------------------------
      if (prefs.types['streak-reminder'] && (profile.streakDays || 0) > 0) {
        const streak = profile.streakDays;
        // Check if practice activity was completed recently
        const hasStudiedRecently = activities.some(
          (a) => a.timestamp.includes('Just now') || a.timestamp.includes('m ago')
        );

        if (!hasStudiedRecently) {
          this.addNotification({
            type: 'streak-reminder',
            title: `Your ${streak}-day streak may be missed today! 🔥`,
            message: `Practice any 2-minute Smart Revision or Quick Quiz before midnight to keep your flame and XP bonus multiplier active.`,
            timestamp: 'Streak Alert',
            priority: 'high',
            category: 'reminders',
            actionSection: 'smart-revision',
            actionLabel: '2-Min Revision',
            dedupKey: `streak-miss-warning-${todayStr}`,
            metadata: {
              accentColor: 'amber',
            },
          });
        }
      }

      // -----------------------------------------------------------------------
      // SMART ALERT 6: "You improved in this topic."
      // -----------------------------------------------------------------------
      if (prefs.types['topic-improved'] && weakTopics && weakTopics.length > 0) {
        const improvedTopic = weakTopics.find(
          (w) => (w.improvementPercentage && w.improvementPercentage > 0) || (w.accuracyRate >= 70 && w.recentPerformance?.includes('Retest'))
        );

        if (improvedTopic) {
          const imp = improvedTopic.improvementPercentage || 25;
          const before = Math.max(10, improvedTopic.accuracyRate - imp);
          this.addNotification({
            type: 'topic-improved',
            title: `You improved in ${improvedTopic.topicName}! 📈`,
            message: `Excellent work! Accuracy increased from ${before}% to ${improvedTopic.accuracyRate}% (+50 XP earned). You are moving closer to topic mastery!`,
            timestamp: 'Recent Milestone',
            priority: 'normal',
            category: 'academic',
            actionSection: 'progress',
            actionLabel: 'View Analytics',
            dedupKey: `topic-improved-${improvedTopic.id}-${improvedTopic.accuracyRate}`,
            metadata: {
              subject: improvedTopic.subjectName,
              chapter: improvedTopic.chapterName,
              topic: improvedTopic.topicName,
              accuracyBefore: before,
              accuracyAfter: improvedTopic.accuracyRate,
              xpReward: 50,
              accentColor: 'emerald',
            },
          });
        }
      }

      // -----------------------------------------------------------------------
      // SMART ALERT 7: AI Learning Coach Study Recommendation
      // -----------------------------------------------------------------------
      if (prefs.types['coach-insight']) {
        const smartAnalysis = StorageService.getSmartLearningAnalysis();
        const topWeak = smartAnalysis.shouldRevise.urgentTopics[0];
        if (topWeak) {
          this.addNotification({
            type: 'coach-insight',
            title: `AI Coach: Targeted Focus for ${topWeak.subjectName} 🤖`,
            message: `Coach detected score opportunities in "${topWeak.topicName}". Spending 10 minutes on formulas will boost your test readiness.`,
            timestamp: 'AI Recommendation',
            priority: 'normal',
            category: 'academic',
            actionSection: 'learning-coach',
            actionLabel: 'View Coach Plan',
            dedupKey: `coach-rec-${topWeak.id}-${todayStr}`,
            metadata: {
              subject: topWeak.subjectName,
              chapter: topWeak.chapterName,
              accentColor: 'purple',
            },
          });
        }
      }
    } catch (err) {
      console.warn('Error in smart learning alerts sync:', err);
    }
  }

  // =========================================================================
  // DIRECT CROSS-MODULE SMART ALERT TRIGGERS
  // =========================================================================

  /**
   * Triggered when a user completes a quiz, retest, or revision and improves accuracy
   */
  static notifyTopicImproved(
    topicNameOrParams: string | {
      topicName: string;
      subjectName: string;
      chapterName?: string;
      accuracyBefore: number;
      accuracyAfter: number;
      xpBonus?: number;
    },
    subjectName?: string,
    accuracyBefore?: number,
    accuracyAfter?: number,
    xpBonus?: number
  ): void {
    let topicName: string;
    let subject: string;
    let chapter: string | undefined;
    let accBefore: number;
    let accAfter: number;
    let bonus: number;

    if (typeof topicNameOrParams === 'object') {
      topicName = topicNameOrParams.topicName;
      subject = topicNameOrParams.subjectName;
      chapter = topicNameOrParams.chapterName;
      accBefore = topicNameOrParams.accuracyBefore;
      accAfter = topicNameOrParams.accuracyAfter;
      bonus = topicNameOrParams.xpBonus || 50;
    } else {
      topicName = topicNameOrParams;
      subject = subjectName || 'General';
      chapter = undefined;
      accBefore = accuracyBefore ?? 40;
      accAfter = accuracyAfter ?? 75;
      bonus = xpBonus || 50;
    }

    const imp = accAfter - accBefore;
    this.addNotification({
      type: 'topic-improved',
      title: `You improved in ${topicName}! 📈`,
      message: `Accuracy increased from ${accBefore}% to ${accAfter}% (+${imp}% gain). ${bonus ? `+${bonus} XP Bonus awarded!` : 'Keep going!'}`,
      timestamp: 'Just now',
      priority: 'normal',
      category: 'academic',
      actionSection: 'progress',
      actionLabel: 'View Analytics',
      dedupKey: `topic-improved-direct-${topicName.toLowerCase().replace(/\s+/g, '-')}-${accAfter}`,
      metadata: {
        subject,
        chapter,
        topic: topicName,
        accuracyBefore: accBefore,
        accuracyAfter: accAfter,
        xpReward: bonus,
        accentColor: 'emerald',
      },
    });
  }

  /**
   * Triggered after a quiz with mistakes to prompt targeted revision
   */
  static notifyQuizMistakesRevision(quizTitle: string, subjectName: string, mistakesCount: number): void {
    if (mistakesCount <= 0) return;
    this.addNotification({
      type: 'revision-reminder',
      title: `Revise ${mistakesCount} Missed Questions in ${subjectName} ⚡`,
      message: `You missed ${mistakesCount} questions in "${quizTitle}". Review step-by-step AI explanations in Smart Revision.`,
      timestamp: 'Just now',
      priority: 'high',
      category: 'academic',
      actionSection: 'smart-revision',
      actionLabel: 'Revise Mistakes',
      dedupKey: `quiz-mistakes-${quizTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`,
      metadata: {
        subject: subjectName,
        urgencyText: `${mistakesCount} Mistakes to Review`,
        accentColor: 'rose',
      },
    });
  }

  /**
   * Triggered when AI Coach generates a new study focus
   */
  static notifyCoachInsight(title: string, message: string, subjectName?: string): void {
    this.addNotification({
      type: 'coach-insight',
      title: `AI Coach: ${title} 🤖`,
      message,
      timestamp: 'Just now',
      priority: 'normal',
      category: 'academic',
      actionSection: 'learning-coach',
      actionLabel: 'Open AI Coach',
      dedupKey: `coach-insight-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`,
      metadata: {
        subject: subjectName,
        accentColor: 'purple',
      },
    });
  }

  // Dispatch custom window event for real-time reactivity
  private static dispatchUpdateEvent(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eduai_notifications_updated'));
    }
  }
}

