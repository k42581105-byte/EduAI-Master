import { NavigationSection } from './index';

export type NotificationType =
  | 'daily-goal'
  | 'study-plan'
  | 'revision-reminder'
  | 'upcoming-exam'
  | 'quiz-reminder'
  | 'streak-reminder'
  | 'topic-improved'
  | 'coach-insight'
  | 'achievement'
  | 'level-up'
  | 'teacher-assignment'
  | 'parent-update';

export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

export type NotificationFilterCategory = 'all' | 'unread' | 'reminders' | 'academic' | 'gamification' | 'portals';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  createdAt: string;
  isRead: boolean;
  priority: NotificationPriority;
  category: 'reminders' | 'academic' | 'gamification' | 'portals';
  actionSection?: NavigationSection;
  actionLabel?: string;
  actionPayload?: Record<string, any>;
  dedupKey?: string;
  metadata?: {
    subject?: string;
    chapter?: string;
    topic?: string;
    accuracyBefore?: number;
    accuracyAfter?: number;
    xpReward?: number;
    daysRemaining?: number;
    urgencyText?: string;
    accentColor?: string;
    senderName?: string;
  };
  isPinned?: boolean;
}

export interface NotificationPreferences {
  soundEnabled: boolean;
  browserPushEnabled: boolean;
  browserPermissionStatus: 'default' | 'granted' | 'denied' | 'unsupported';
  types: {
    'daily-goal': boolean;
    'study-plan': boolean;
    'revision-reminder': boolean;
    'upcoming-exam': boolean;
    'quiz-reminder': boolean;
    'streak-reminder': boolean;
    'topic-improved': boolean;
    'coach-insight': boolean;
    'achievement': boolean;
    'level-up': boolean;
    'teacher-assignment': boolean;
    'parent-update': boolean;
  };
  reminderTimes: {
    morningGoalTime: string; // e.g. "08:00"
    afternoonTaskTime: string; // e.g. "14:00"
    eveningRevisionTime: string; // e.g. "18:30"
    nightStreakTime: string; // e.g. "21:00"
    examNoticeDaysBefore: number; // e.g. 3
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // e.g. "22:00"
    endTime: string; // e.g. "07:00"
  };
}
