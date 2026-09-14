import { ClassLevel, BoardType, NavigationSection } from './index';

export interface CoachBriefing {
  greeting: string;
  studentSummary: string;
  coachMessage: string;
  focusHighlight: string;
  readinessScore: number;
  mindsetQuote: string;
}

export interface TodayGoal {
  dailyXpTarget: number;
  dailyXpEarned: number;
  targetStudyMinutes: number;
  completedStudyMinutes: number;
  tasksCount: number;
  completedTasksCount: number;
  streakDays: number;
  streakStatus: 'active' | 'at_risk' | 'milestone';
}

export interface WhatToStudy {
  subject: string;
  chapter: string;
  topic: string;
  estimatedMinutes: number;
  importance: 'Core Board Syllabus' | 'High Weightage' | 'Prerequisite' | 'Foundation';
  keyLearningOutcomes: string[];
  suggestedAction: 'read_book' | 'open_notes' | 'ai_explanation';
  actionRoute: NavigationSection;
}

export interface WhatToRevise {
  subject: string;
  chapter: string;
  topic: string;
  lastPracticed: string;
  spacedRepetitionStage: string;
  quickFormulaOrKeyRule: string;
  quickRevisionPoints: string[];
  actionRoute: NavigationSection;
}

export interface RecommendedPractice {
  mode: 'weak_topic' | 'daily' | 'adaptive' | 'revision' | 'mistake_fix' | 'concept_based' | 'quick_5';
  modeLabel: string;
  subject: string;
  chapter: string;
  topic: string;
  questionCount: number;
  estimatedMinutes: number;
  rewardXp: number;
  reason: string;
  urgencyLevel: 'High' | 'Medium' | 'Normal';
}

export interface UpcomingExamInfo {
  id: string;
  title: string;
  subject: string;
  targetDate: string;
  daysLeft: number;
  readinessPercentage: number;
  criticalTopics: string[];
  recommendedFocus: string;
}

export interface WeakTopicAlert {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  accuracyRate: number;
  urgency: 'Critical' | 'Moderate';
  identifiedMisconception: string;
  remedyAction: string;
  wrongAnswersCount: number;
}

export interface DailyActivityItem {
  id: string;
  title: string;
  timestamp: string;
  xp: number;
  type: string;
  details?: string;
}

export interface DailyProgressSnapshot {
  tasksCompleted: number;
  totalTasks: number;
  questionsPracticedToday: number;
  todayXpGained: number;
  studyTimeTodayMinutes: number;
  recentTodayActivities: DailyActivityItem[];
  subjectDistribution: Array<{
    subject: string;
    progressPercentage: number;
    tasksDone: number;
    color: string;
  }>;
}

export interface TodayLearningDashboardData {
  briefing: CoachBriefing;
  todayGoal: TodayGoal;
  whatToStudy: WhatToStudy;
  whatToRevise: WhatToRevise;
  recommendedPractice: RecommendedPractice;
  upcomingExam: UpcomingExamInfo;
  weakTopicAlert: WeakTopicAlert | null;
  dailyProgress: DailyProgressSnapshot;
  coachTips: string[];
  generatedAt: string;
  isAiLiveGenerated: boolean;
}
