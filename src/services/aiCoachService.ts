import { StorageService } from './storageService';
import { StudentProfile, WeakTopic, StrongTopic, Quiz, Exam, StudyPlan, ActivityLog } from '../types';
import { TodayLearningDashboardData, RecommendedPractice, WhatToStudy, WhatToRevise } from '../types/aiCoach';

const COACH_CACHE_KEY = 'eduai_coach_dashboard_cache_v1';
const COACH_CACHE_TIMESTAMP_KEY = 'eduai_coach_dashboard_cache_time_v1';

export class AiCoachService {
  /**
   * Fetches personalized "Today's Learning" dashboard data based on real student data
   */
  public static async getTodayLearningDashboard(
    profile: StudentProfile,
    lang: string = 'en',
    forceRefresh: boolean = false
  ): Promise<TodayLearningDashboardData> {
    // Check cached data if not forcing refresh (cached for 15 minutes)
    if (!forceRefresh) {
      const cached = this.getCachedDashboard();
      if (cached) {
        // Update live mutable progress (tasks done, XP gained today) without re-querying AI
        return this.syncLiveMutableStats(cached, profile);
      }
    }

    // Gather real student data
    const weakTopics = StorageService.getWeakTopics();
    const strongTopics = StorageService.getStrongTopics();
    const studyPlan = StorageService.getStudyPlan();
    const quizzes = StorageService.getSavedQuizzes();
    const exams = StorageService.getSavedExams();
    const activities = StorageService.getActivities();

    try {
      const res = await fetch('/api/ai-coach/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          weakTopics,
          strongTopics,
          studyPlan,
          quizzes,
          exams,
          activities,
          lang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && data.insights) {
          const fullDashboard = this.assembleDashboard(
            data.insights,
            profile,
            studyPlan,
            weakTopics,
            strongTopics,
            activities,
            data.isAiLiveGenerated
          );
          this.setCachedDashboard(fullDashboard);
          return fullDashboard;
        }
      }
    } catch (err) {
      console.warn('Backend AI Coach API call failed, generating local coach analysis:', err);
    }

    // Fallback to purely local heuristic engine
    const localData = this.generateLocalFallbackDashboard(
      profile,
      studyPlan,
      weakTopics,
      strongTopics,
      quizzes,
      exams,
      activities
    );
    this.setCachedDashboard(localData);
    return localData;
  }

  /**
   * Calculates live stats (today's tasks, XP today, streak)
   */
  private static assembleDashboard(
    insights: any,
    profile: StudentProfile,
    studyPlan: StudyPlan,
    weakTopics: WeakTopic[],
    strongTopics: StrongTopic[],
    activities: ActivityLog[],
    isAiLiveGenerated: boolean
  ): TodayLearningDashboardData {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPracticeKey = `eduai_smart_practice_daily_xp_${todayStr}`;
    const smartPracticeXp = parseInt(localStorage.getItem(todayPracticeKey) || '0', 10);

    const completedTasks = (studyPlan.tasks || []).filter((t) => t.completed).length;
    const totalTasks = (studyPlan.tasks || []).length || 4;

    const todayActivities = activities.filter((a) => {
      const ts = (a.timestamp || '').toLowerCase();
      return ts.includes('just now') || ts.includes('today') || ts.includes('min') || ts.includes('hour');
    });

    const todayXpSum = todayActivities.reduce((sum, a) => sum + (a.xpEarned || 0), 0) + smartPracticeXp;

    const daysLeft = insights.upcomingExam?.daysLeft || 14;

    return {
      briefing: {
        greeting: insights.greeting || `Good day, ${profile.name}!`,
        studentSummary: insights.studentSummary || `Class ${profile.classLevel} ${profile.board} • ${profile.streakDays}-Day Streak • Target Exam in ${daysLeft} Days`,
        coachMessage: insights.coachMessage || 'Keep up your consistent study habits today!',
        focusHighlight: insights.focusHighlight || 'Complete today’s key tasks and daily practice.',
        readinessScore: insights.readinessScore || 78,
        mindsetQuote: insights.mindsetQuote || 'Consistent effort creates exceptional results.',
      },
      todayGoal: {
        dailyXpTarget: profile.dailyXpGoal || 150,
        dailyXpEarned: Math.max(smartPracticeXp, todayXpSum),
        targetStudyMinutes: 60,
        completedStudyMinutes: Math.min(60, completedTasks * 15 + Math.round(smartPracticeXp / 2)),
        tasksCount: totalTasks,
        completedTasksCount: completedTasks,
        streakDays: profile.streakDays || 1,
        streakStatus: profile.streakDays > 5 ? 'milestone' : 'active',
      },
      whatToStudy: {
        subject: insights.whatToStudy?.subject || 'Science',
        chapter: insights.whatToStudy?.chapter || 'Light: Reflection and Refraction',
        topic: insights.whatToStudy?.topic || 'Ray Diagrams and Mirror Formula',
        estimatedMinutes: insights.whatToStudy?.estimatedMinutes || 25,
        importance: insights.whatToStudy?.importance || 'High Weightage',
        keyLearningOutcomes: insights.whatToStudy?.keyLearningOutcomes || [
          'Understand Cartesian sign conventions for spherical mirrors',
          'Solve numerical problems using 1/f = 1/v + 1/u',
        ],
        suggestedAction: insights.whatToStudy?.suggestedAction || 'read_book',
        actionRoute: 'books',
      },
      whatToRevise: {
        subject: insights.whatToRevise?.subject || 'Science',
        chapter: insights.whatToRevise?.chapter || 'Chemical Reactions and Equations',
        topic: insights.whatToRevise?.topic || 'Balancing Chemical Equations & Redox',
        lastPracticed: insights.whatToRevise?.lastPracticed || '3 days ago',
        spacedRepetitionStage: insights.whatToRevise?.spacedRepetitionStage || 'Active Recall (Interval 2)',
        quickFormulaOrKeyRule: insights.whatToRevise?.quickFormulaOrKeyRule || 'Conservation of Mass: Atoms on LHS = Atoms on RHS',
        quickRevisionPoints: insights.whatToRevise?.quickRevisionPoints || [
          'Combination: A + B -> AB',
          'Decomposition requires energy (Thermal, Electrolytic, or Photochemical)',
        ],
        actionRoute: 'notes',
      },
      recommendedPractice: {
        mode: insights.recommendedPractice?.mode || 'weak_topic',
        modeLabel: insights.recommendedPractice?.modeLabel || 'Weak Topic Practice',
        subject: insights.recommendedPractice?.subject || 'Science',
        chapter: insights.recommendedPractice?.chapter || 'Light: Reflection and Refraction',
        topic: insights.recommendedPractice?.topic || 'Spherical Mirror Sign Convention',
        questionCount: insights.recommendedPractice?.questionCount || 5,
        estimatedMinutes: insights.recommendedPractice?.estimatedMinutes || 8,
        rewardXp: insights.recommendedPractice?.rewardXp || 35,
        reason: insights.recommendedPractice?.reason || 'Based on recent quiz error patterns',
        urgencyLevel: insights.recommendedPractice?.urgencyLevel || 'High',
      },
      upcomingExam: {
        id: insights.upcomingExam?.id || 'exam-midterm-1',
        title: insights.upcomingExam?.title || `Class ${profile.classLevel} Mid-Term Assessment`,
        subject: insights.upcomingExam?.subject || 'Core Subjects',
        targetDate: insights.upcomingExam?.targetDate || studyPlan.targetExamDate || '2026-11-15',
        daysLeft,
        readinessPercentage: insights.upcomingExam?.readinessPercentage || 76,
        criticalTopics: insights.upcomingExam?.criticalTopics || [
          'Optics: Mirror & Lens Numericals',
          'Algebra: Quadratic Equations',
          'Chemistry: Chemical Reactions',
        ],
        recommendedFocus: insights.upcomingExam?.recommendedFocus || 'Complete 2 full mock papers before the weekend',
      },
      weakTopicAlert: insights.weakTopicAlert || (weakTopics[0] ? {
        id: weakTopics[0].id,
        subject: weakTopics[0].subjectName,
        chapter: weakTopics[0].chapterName,
        topic: weakTopics[0].topicName,
        accuracyRate: weakTopics[0].accuracyRate,
        urgency: weakTopics[0].accuracyRate < 50 ? 'Critical' : 'Moderate',
        identifiedMisconception: 'Sign convention confusion in mirror numericals',
        remedyAction: 'Review formula notes and solve 5 guided questions',
        wrongAnswersCount: weakTopics[0].wrongAnswersCount || 4,
      } : null),
      dailyProgress: {
        tasksCompleted: completedTasks,
        totalTasks: totalTasks,
        questionsPracticedToday: Math.round(smartPracticeXp / 10),
        todayXpGained: Math.max(smartPracticeXp, todayXpSum),
        studyTimeTodayMinutes: Math.min(120, completedTasks * 15 + Math.round(smartPracticeXp / 2)),
        recentTodayActivities: todayActivities.slice(0, 4).map((a) => ({
          id: a.id || `act-${Math.random()}`,
          title: a.title,
          timestamp: a.timestamp || 'Today',
          xp: a.xpEarned || 0,
          type: a.type || 'study',
          details: a.details,
        })),
        subjectDistribution: [
          { subject: 'Science', progressPercentage: 68, tasksDone: 2, color: 'bg-emerald-500' },
          { subject: 'Mathematics', progressPercentage: 54, tasksDone: 1, color: 'bg-blue-500' },
          { subject: 'Social Science', progressPercentage: 80, tasksDone: 1, color: 'bg-amber-500' },
        ],
      },
      coachTips: insights.coachTips || [
        '💡 Pomodoro Strategy: 25 minutes of deep focus followed by 5 minutes of active recall.',
        '✍️ Write While Learning: Summarizing concepts in your own handwriting improves retention by 40%.',
        '⚡ Night Review: Revisit today’s mistake log for 3 minutes before sleep.',
      ],
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAiLiveGenerated,
    };
  }

  /**
   * Generates deterministic local fallback dashboard
   */
  private static generateLocalFallbackDashboard(
    profile: StudentProfile,
    studyPlan: StudyPlan,
    weakTopics: WeakTopic[],
    strongTopics: StrongTopic[],
    quizzes: Quiz[],
    exams: Exam[],
    activities: ActivityLog[]
  ): TodayLearningDashboardData {
    const weakest = weakTopics[0];
    const strongest = strongTopics[0];
    const examDate = studyPlan.targetExamDate || '2026-11-15';
    const diffMs = new Date(examDate).getTime() - Date.now();
    const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const insights = {
      greeting: `Good day, ${profile.name}!`,
      studentSummary: `Class ${profile.classLevel} ${profile.board} • ${profile.streakDays}-Day Streak • Target Exam in ${daysLeft} Days`,
      coachMessage: weakest
        ? `I analyzed your recent study data. In ${weakest.subjectName}, your accuracy in "${weakest.topicName}" is ${weakest.accuracyRate}%. Let's fix this today with targeted practice!`
        : `Great momentum! With ${daysLeft} days until your exams, let's complete today's core study plan and boost your mastery score.`,
      focusHighlight: weakest
        ? `Priority #1: Master ${weakest.topicName} (${weakest.accuracyRate}% Accuracy)`
        : 'Priority #1: Complete Daily Study Goals & Practice',
      readinessScore: Math.min(95, Math.max(50, 75 + (profile.level || 1) * 2 - (weakTopics.length * 4))),
      mindsetQuote: 'Small, consistent daily improvements over time lead to stunning exam results.',
      whatToStudy: {
        subject: weakest ? weakest.subjectName : 'Science',
        chapter: weakest ? weakest.chapterName : 'Light: Reflection & Refraction',
        topic: weakest ? weakest.topicName : 'Ray Diagrams and Mirror Formula',
        estimatedMinutes: 25,
        importance: 'High Weightage',
        keyLearningOutcomes: [
          'Understand Cartesian sign conventions for spherical mirrors',
          'Apply 1/f = 1/v + 1/u accurately in numericals',
          'Solve 2 high-frequency Board exam questions',
        ],
        suggestedAction: 'read_book',
      },
      whatToRevise: {
        subject: strongest ? strongest.subjectName : 'Science',
        chapter: strongest ? strongest.chapterName : 'Chemical Reactions and Equations',
        topic: strongest ? strongest.topicName : 'Balancing Chemical Equations & Redox',
        lastPracticed: strongest ? strongest.lastPracticed : '3 days ago',
        spacedRepetitionStage: 'Spaced Repetition: 3-Day Recall Interval',
        quickFormulaOrKeyRule: 'Conservation of Mass: Number of atoms on LHS = Number of atoms on RHS',
        quickRevisionPoints: [
          'Combination: A + B -> AB',
          'Exothermic reactions release heat; endothermic reactions absorb heat',
        ],
      },
      recommendedPractice: {
        mode: weakest ? 'weak_topic' : 'quick_5',
        modeLabel: weakest ? 'Weak Topic Targeted Drill' : 'Quick 5-Question Sprint',
        subject: weakest ? weakest.subjectName : 'Science',
        chapter: weakest ? weakest.chapterName : 'Light: Reflection and Refraction',
        topic: weakest ? weakest.topicName : 'Mirror Formula & Sign Convention',
        questionCount: 5,
        estimatedMinutes: 8,
        rewardXp: 35,
        reason: weakest
          ? `Direct remedy for ${weakest.accuracyRate}% accuracy in ${weakest.topicName}`
          : 'Daily adaptive drill for active recall',
        urgencyLevel: weakest && weakest.accuracyRate < 50 ? 'High' : 'Medium',
      },
      upcomingExam: {
        id: 'exam-midterm-main',
        title: `Class ${profile.classLevel} Term-1 Assessment`,
        subject: 'All Core Subjects',
        targetDate: examDate,
        daysLeft,
        readinessPercentage: Math.min(94, Math.max(55, 78 + (profile.level || 1) * 2 - (weakTopics.length * 3))),
        criticalTopics: [
          'Optics: Mirror & Lens Numericals',
          'Algebra: Quadratic Equations',
          'Chemical Reactions: Types & Balancing',
        ],
        recommendedFocus: 'Complete 2 full mock papers before the weekend',
      },
      weakTopicAlert: weakest
        ? {
            id: weakest.id,
            subject: weakest.subjectName,
            chapter: weakest.chapterName,
            topic: weakest.topicName,
            accuracyRate: weakest.accuracyRate,
            urgency: weakest.accuracyRate < 50 ? 'Critical' : 'Moderate',
            identifiedMisconception: 'Sign convention confusion in concave vs convex mirror problems',
            remedyAction: 'Review formula notes and solve 5 guided questions',
            wrongAnswersCount: weakest.wrongAnswersCount || 4,
          }
        : null,
      coachTips: [
        '💡 25-Minute Focus: Study in 25-minute Pomodoro bursts with 5-minute active recall breaks.',
        '✍️ Active Summaries: Writing out key steps in your own words increases retention by 40%.',
        '⚡ Mistake Review: Spend 3 minutes at night checking your error logs from today’s questions.',
      ],
    };

    return this.assembleDashboard(
      insights,
      profile,
      studyPlan,
      weakTopics,
      strongTopics,
      activities,
      false
    );
  }

  private static syncLiveMutableStats(
    cached: TodayLearningDashboardData,
    profile: StudentProfile
  ): TodayLearningDashboardData {
    const studyPlan = StorageService.getStudyPlan();
    const completedTasks = (studyPlan.tasks || []).filter((t) => t.completed).length;
    const totalTasks = (studyPlan.tasks || []).length || 4;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayPracticeKey = `eduai_smart_practice_daily_xp_${todayStr}`;
    const smartPracticeXp = parseInt(localStorage.getItem(todayPracticeKey) || '0', 10);

    const activities = StorageService.getActivities();
    const todayActivities = activities.filter((a) => {
      const ts = (a.timestamp || '').toLowerCase();
      return ts.includes('just now') || ts.includes('today') || ts.includes('min') || ts.includes('hour');
    });
    const todayXpSum = todayActivities.reduce((sum, a) => sum + (a.xpEarned || 0), 0) + smartPracticeXp;

    return {
      ...cached,
      todayGoal: {
        ...cached.todayGoal,
        dailyXpTarget: profile.dailyXpGoal || 150,
        dailyXpEarned: Math.max(smartPracticeXp, todayXpSum),
        tasksCount: totalTasks,
        completedTasksCount: completedTasks,
        streakDays: profile.streakDays || 1,
      },
      dailyProgress: {
        ...cached.dailyProgress,
        tasksCompleted: completedTasks,
        totalTasks,
        todayXpGained: Math.max(smartPracticeXp, todayXpSum),
        recentTodayActivities: todayActivities.slice(0, 4).map((a) => ({
          id: a.id || `act-${Math.random()}`,
          title: a.title,
          timestamp: a.timestamp || 'Today',
          xp: a.xpEarned || 0,
          type: a.type || 'study',
          details: a.details,
        })),
      },
    };
  }

  private static getCachedDashboard(): TodayLearningDashboardData | null {
    try {
      const dataStr = localStorage.getItem(COACH_CACHE_KEY);
      const timeStr = localStorage.getItem(COACH_CACHE_TIMESTAMP_KEY);
      if (!dataStr || !timeStr) return null;

      const cacheTime = parseInt(timeStr, 10);
      const now = Date.now();
      // Cache valid for 15 minutes
      if (now - cacheTime > 15 * 60 * 1000) return null;

      return JSON.parse(dataStr);
    } catch {
      return null;
    }
  }

  private static setCachedDashboard(data: TodayLearningDashboardData): void {
    try {
      localStorage.setItem(COACH_CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(COACH_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (err) {
      console.warn('Failed to cache AI coach dashboard data:', err);
    }
  }

  public static clearCache(): void {
    localStorage.removeItem(COACH_CACHE_KEY);
    localStorage.removeItem(COACH_CACHE_TIMESTAMP_KEY);
  }
}
