import {
  StudentProfile,
  WeakTopic,
  StrongTopic,
  SmartPracticeMode,
  SmartPracticeQuestionItem,
  SmartPracticeSessionSummary,
  SmartPracticeTopicDelta,
  SmartPracticeTopicRevisionNeeded,
  SmartPracticeRecommendation,
  AdaptiveLearningPath,
  TopicMasteryStatus,
  AdaptiveDifficultyLevel,
} from '../types';
import { StorageService } from './storageService';
import { LanguageCode } from '../i18n/translations';

export interface SmartPracticeRequestParams {
  profile: StudentProfile;
  mode: SmartPracticeMode;
  subject?: string;
  topic?: string;
  chapter?: string;
  count?: number;
  weakTopics?: WeakTopic[];
  strongTopics?: StrongTopic[];
  recentMistakes?: string[];
  learningGoals?: string[];
  language?: LanguageCode | string;
}

export class SmartPracticeService {
  private static DEDUP_CACHE_KEY = 'eduai_smart_practice_dedup_hashes';
  private static DAILY_XP_KEY_PREFIX = 'eduai_smart_practice_daily_xp_';
  private static MAX_DAILY_PRACTICE_XP = 250; // Anti-farming daily ceiling

  /**
   * Generates a tailored Smart Practice session for any of the 8 modes
   */
  public static async generateSmartPracticeSession(
    params: SmartPracticeRequestParams
  ): Promise<{ questions: SmartPracticeQuestionItem[]; isFallback: boolean; mode: SmartPracticeMode }> {
    const subject = params.subject || params.profile.selectedSubjects?.[0] || 'Science';
    const weakTopics = params.weakTopics || StorageService.getWeakTopics();
    const strongTopics = params.strongTopics || StorageService.getStrongTopics();
    const savedQuizzes = StorageService.getSavedQuizzes();

    // Extract recent mistake hints from quiz records
    const recentMistakes: string[] = [...(params.recentMistakes || [])];
    savedQuizzes.forEach((q) => {
      if (q.userAnswersRecord) {
        Object.values(q.userAnswersRecord).forEach((rec) => {
          if (!rec.isCorrect && rec.typedAnswer) {
            recentMistakes.push(rec.typedAnswer);
          }
        });
      }
    });

    const excludedHashes = this.getRecentDedupHashes();

    try {
      const response = await fetch('/api/ai/smart-practice-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: params.mode,
          subject,
          topic: params.topic || (params.mode === 'weak_topic' && weakTopics[0] ? weakTopics[0].topicName : ''),
          chapter: params.chapter || (params.mode === 'weak_topic' && weakTopics[0] ? weakTopics[0].chapterName : ''),
          classLevel: params.profile.classLevel || '10',
          board: params.profile.board || 'CBSE',
          count: params.count || (params.mode === 'quick_5' ? 5 : 5),
          weakTopics,
          strongTopics,
          recentMistakes: recentMistakes.slice(0, 8),
          learningGoals: params.learningGoals || params.profile.learningGoals || [],
          excludedHashes,
          language: params.language || params.profile.preferredLanguage || 'en',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sessionData && data.sessionData.questions && data.sessionData.questions.length > 0) {
          // Record generated question hashes to prevent repetition
          data.sessionData.questions.forEach((q: SmartPracticeQuestionItem) => {
            this.recordQuestionHash(this.computeQuestionHash(q.question));
          });

          return {
            questions: data.sessionData.questions,
            isFallback: data.isFallback || false,
            mode: params.mode,
          };
        }
      }
    } catch (err) {
      console.warn('API /api/ai/smart-practice-session failed, generating dynamic fallback:', err);
    }

    // Dynamic intelligent fallback
    const fallbackQuestions = this.generateLocalQuestionPool(params, subject, weakTopics);
    return {
      questions: fallbackQuestions,
      isFallback: true,
      mode: params.mode,
    };
  }

  /**
   * Finalizes a completed Smart Practice session, calculates topic mastery deltas,
   * checks anti-farming limits, logs activity, awards XP, and builds next recommendations.
   */
  public static finalizeSessionSummary(
    sessionQuestions: SmartPracticeQuestionItem[],
    answers: Array<{ questionIndex: number; selectedIndex: number; isCorrect: boolean; timeTaken: number }>,
    mode: SmartPracticeMode,
    subject: string,
    profile: StudentProfile
  ): SmartPracticeSessionSummary {
    const totalQuestions = sessionQuestions.length;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const accuracyPercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const totalTimeTakenSeconds = answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0);

    // Calculate XP with Anti-Farming rules
    const todayKey = `${this.DAILY_XP_KEY_PREFIX}${new Date().toISOString().split('T')[0]}`;
    const todayEarnedXp = parseInt(localStorage.getItem(todayKey) || '0', 10);
    const remainingDailyCap = Math.max(0, this.MAX_DAILY_PRACTICE_XP - todayEarnedXp);

    let rawXp = 0;
    answers.forEach((ans, idx) => {
      const q = sessionQuestions[idx];
      if (ans.isCorrect) {
        const baseXP = q.difficultyTier.includes('HOTS') ? 25 : q.difficultyTier.includes('Advanced') ? 20 : 15;
        rawXp += baseXP;
      } else {
        rawXp += 3; // Effort XP
      }
    });

    // Accuracy bonus
    if (accuracyPercentage === 100) rawXp += 25;
    else if (accuracyPercentage >= 80) rawXp += 15;

    // Apply daily cap
    const xpEarned = Math.min(rawXp, remainingDailyCap);
    const dailyXpCapReached = xpEarned < rawXp || remainingDailyCap === 0;
    localStorage.setItem(todayKey, (todayEarnedXp + xpEarned).toString());

    if (xpEarned > 0) {
      StorageService.addXp(xpEarned, `Smart Practice (${mode.replace('_', ' ')})`);
    }

    // Process Topics Improved & Topics Needing Revision
    const weakTopics = StorageService.getWeakTopics();
    const strongTopics = StorageService.getStrongTopics();
    const topicsImproved: SmartPracticeTopicDelta[] = [];
    const topicsNeedingRevision: SmartPracticeTopicRevisionNeeded[] = [];

    // Group answers by topic
    const topicResults: Record<string, { total: number; correct: number; chapter: string; subject: string; mistakes: string[] }> = {};
    sessionQuestions.forEach((q, idx) => {
      const ans = answers[idx];
      const key = q.topic || 'General Topic';
      if (!topicResults[key]) {
        topicResults[key] = {
          total: 0,
          correct: 0,
          chapter: q.chapter || 'Chapter',
          subject: q.subject || subject,
          mistakes: [],
        };
      }
      topicResults[key].total += 1;
      if (ans?.isCorrect) {
        topicResults[key].correct += 1;
      } else if (ans) {
        topicResults[key].mistakes.push(q.explanation || 'Review formula & signs');
      }
    });

    // Compute deltas and update local weak/strong collections
    Object.entries(topicResults).forEach(([tName, res]) => {
      const topicAccuracy = Math.round((res.correct / res.total) * 100);
      const existingWeakIndex = weakTopics.findIndex((w) => w.topicName.toLowerCase() === tName.toLowerCase());
      const existingStrongIndex = strongTopics.findIndex((s) => s.topicName.toLowerCase() === tName.toLowerCase());

      const previousMastery = existingStrongIndex !== -1
        ? strongTopics[existingStrongIndex].accuracyRate || 85
        : existingWeakIndex !== -1
        ? weakTopics[existingWeakIndex].accuracyRate || 40
        : 60;

      const delta = topicAccuracy >= 70 ? Math.min(25, Math.round(topicAccuracy * 0.2)) : -Math.round((100 - topicAccuracy) * 0.1);
      const newMastery = Math.min(100, Math.max(10, previousMastery + delta));
      const status: TopicMasteryStatus =
        newMastery >= 85 ? 'Strong' : newMastery >= 65 ? 'Practicing' : newMastery >= 40 ? 'Learning' : 'Beginner';

      if (delta > 0) {
        topicsImproved.push({
          topicName: tName,
          chapterName: res.chapter,
          subjectName: res.subject,
          previousMastery,
          newMastery,
          delta,
          status,
        });

        // If improved significantly, move out of weak topics or into strong topics
        if (newMastery >= 75 && existingWeakIndex !== -1) {
          weakTopics.splice(existingWeakIndex, 1);
          StorageService.saveWeakTopics(weakTopics);
        }
        if (newMastery >= 85 && existingStrongIndex === -1) {
          strongTopics.push({
            id: `str-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            topicName: tName,
            chapterName: res.chapter,
            subjectName: res.subject,
            accuracyRate: newMastery,
            masteryLevel: newMastery >= 90 ? 'Mastered' : 'Strong',
            lastPracticed: 'Just now',
            testsTakenCount: 1,
          });
          StorageService.saveStrongTopics(strongTopics);
        }
      }

      if (res.correct < res.total || topicAccuracy < 70) {
        topicsNeedingRevision.push({
          topicName: tName,
          chapterName: res.chapter,
          subjectName: res.subject,
          currentAccuracy: topicAccuracy,
          mistakeHighlight: res.mistakes[0] || 'Formula substitution or sign errors identified during practice.',
          recommendedResource: topicAccuracy < 40 ? 'notes' : topicAccuracy < 60 ? 'ask-ai' : 'quiz',
        });

        // Add or update weak topics record
        if (existingWeakIndex === -1 && newMastery < 65) {
          weakTopics.push({
            id: `wk-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            topicName: tName,
            chapterName: res.chapter,
            subjectName: res.subject,
            accuracyRate: topicAccuracy,
            lastPracticed: 'Just now',
            recommendedAction: 'Review AI Summary Notes & Step-by-Step Examples',
            urgency: topicAccuracy < 40 ? 'Critical' : 'Moderate',
            wrongAnswersCount: res.total - res.correct,
            attemptsCount: 1,
          });
          StorageService.saveWeakTopics(weakTopics);
        }
      }
    });

    // Also update cached AdaptiveLearningPath if exists
    this.updateCachedAdaptivePath(topicsImproved, topicsNeedingRevision, profile.classLevel, subject);

    // Build intelligent recommended next practice
    const recommendedNext = this.buildNextRecommendation(
      mode,
      subject,
      accuracyPercentage,
      topicsNeedingRevision,
      topicsImproved
    );

    // Record activity log
    const activityMsg = `Completed Smart Practice (${mode.replace('_', ' ')}) in ${subject}: ${correctCount}/${totalQuestions} (${accuracyPercentage}%)`;
    StorageService.addActivityLog(
      `Smart Practice: ${mode.toUpperCase().replace('_', ' ')}`,
      activityMsg,
      xpEarned
    );

    // Check & trigger achievements
    StorageService.checkAndEvaluateAchievements();

    const modeTitles: Record<SmartPracticeMode, string> = {
      daily: 'Personalized Daily Questions',
      adaptive: 'Adaptive Difficulty Practice',
      revision: 'Spaced Repetition Revision',
      mistake_fix: 'Mistake-Based Practice',
      weak_topic: 'Weak-Topic Targeted Practice',
      concept: 'Concept-Based Reasoning',
      mixed: 'Mixed Subject & Chapter Practice',
      quick_5: 'Quick 5-Question Blitz',
    };

    return {
      id: `sp-summary-${Date.now()}`,
      mode,
      modeTitle: modeTitles[mode] || 'Smart Practice Session',
      subject,
      totalQuestions,
      correctCount,
      score: correctCount * 20,
      accuracyPercentage,
      timeTakenSeconds: totalTimeTakenSeconds,
      xpEarned,
      dailyXpCapReached,
      topicsImproved,
      topicsNeedingRevision,
      recommendedNextPractice: recommendedNext,
      completedAt: new Date().toISOString(),
      questionHistory: sessionQuestions.map((q, idx) => ({
        questionText: q.question,
        isCorrect: answers[idx]?.isCorrect || false,
        userSelected: q.options[answers[idx]?.selectedIndex || 0] || 'Unanswered',
        correctAnswer: q.options[q.correctIndex],
        topic: q.topic,
        difficultyTier: q.difficultyTier,
      })),
    };
  }

  /**
   * Anti-repetition deduplication storage
   */
  private static getRecentDedupHashes(): string[] {
    try {
      const data = localStorage.getItem(this.DEDUP_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static recordQuestionHash(hash: string) {
    try {
      const hashes = this.getRecentDedupHashes();
      if (!hashes.includes(hash)) {
        hashes.unshift(hash);
        // Keep max 50 recent hashes
        localStorage.setItem(this.DEDUP_CACHE_KEY, JSON.stringify(hashes.slice(0, 50)));
      }
    } catch (e) {
      console.warn('Failed to save dedup hash:', e);
    }
  }

  private static computeQuestionHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return `h_${Math.abs(hash)}`;
  }

  /**
   * Builds high-yield next recommendation
   */
  private static buildNextRecommendation(
    currentMode: SmartPracticeMode,
    subject: string,
    accuracy: number,
    needingRevision: SmartPracticeTopicRevisionNeeded[],
    improved: SmartPracticeTopicDelta[]
  ): SmartPracticeRecommendation {
    if (needingRevision.length > 0 && accuracy < 60) {
      const topIssue = needingRevision[0];
      return {
        title: `Clear Doubts on ${topIssue.topicName}`,
        subtitle: `Accuracy was ${topIssue.currentAccuracy}%. Ask AI Teacher to explain the fundamental principles step-by-step.`,
        mode: 'concept',
        subject: topIssue.subjectName,
        topic: topIssue.topicName,
        reason: topIssue.mistakeHighlight,
        actionType: 'navigate_ask_ai',
        actionLabel: 'Ask AI Teacher',
        estimatedMinutes: 5,
        xpReward: 35,
      };
    }

    if (accuracy >= 80 && currentMode !== 'adaptive') {
      const topTopic = improved[0]?.topicName || 'Curriculum Milestone';
      return {
        title: `Take Adaptive Difficulty Challenge`,
        subtitle: `You scored ${accuracy}%! Step up to HOTS and CBSE Board application questions.`,
        mode: 'adaptive',
        subject,
        topic: topTopic,
        reason: 'Mastery achieved on foundational items. Ready for Level 3/4 Application challenges.',
        actionType: 'start_practice',
        actionLabel: 'Start Adaptive Challenge',
        estimatedMinutes: 6,
        xpReward: 50,
      };
    }

    if (currentMode === 'mistake_fix') {
      return {
        title: `Take Quick 5-Question Blitz`,
        subtitle: `Test your speed and solidified accuracy under a timed format.`,
        mode: 'quick_5',
        subject,
        topic: 'Mixed Revision',
        reason: 'Reinforce corrected mistake concepts under realistic exam timing.',
        actionType: 'start_practice',
        actionLabel: 'Start 5-Q Blitz',
        estimatedMinutes: 4,
        xpReward: 30,
      };
    }

    return {
      title: `Daily Personalized Practice`,
      subtitle: `Keep your study streak active with 5 curated daily questions.`,
      mode: 'daily',
      subject,
      topic: 'Daily Path',
      reason: 'Maintain consistent spaced repetition across core subjects.',
      actionType: 'start_practice',
      actionLabel: 'Start Daily Questions',
      estimatedMinutes: 5,
      xpReward: 40,
    };
  }

  /**
   * Syncs updates back into cached Adaptive Learning Path
   */
  private static updateCachedAdaptivePath(
    improved: SmartPracticeTopicDelta[],
    needingRevision: SmartPracticeTopicRevisionNeeded[],
    classLevel: string,
    subject: string
  ) {
    const cacheKey = `eduai_adaptive_path_${classLevel}_${subject}`;
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return;

    try {
      const path: AdaptiveLearningPath = JSON.parse(raw);
      let changed = false;

      improved.forEach((imp) => {
        const tIndex = path.topics.findIndex(
          (t) => t.topicName.toLowerCase().includes(imp.topicName.toLowerCase()) || imp.topicName.toLowerCase().includes(t.topicName.toLowerCase())
        );
        if (tIndex !== -1) {
          path.topics[tIndex].masteryPercentage = imp.newMastery;
          path.topics[tIndex].status = imp.status;
          path.topics[tIndex].attemptsCount += 1;
          path.topics[tIndex].consecutiveCorrect += 1;
          path.topics[tIndex].consecutiveWrong = 0;
          changed = true;
        }
      });

      needingRevision.forEach((rev) => {
        const tIndex = path.topics.findIndex(
          (t) => t.topicName.toLowerCase().includes(rev.topicName.toLowerCase()) || rev.topicName.toLowerCase().includes(t.topicName.toLowerCase())
        );
        if (tIndex !== -1) {
          path.topics[tIndex].consecutiveWrong += 1;
          path.topics[tIndex].consecutiveCorrect = 0;
          path.topics[tIndex].recentMistakes = [rev.mistakeHighlight, ...(path.topics[tIndex].recentMistakes || [])].slice(0, 5);
          changed = true;
        }
      });

      if (changed) {
        const total = path.topics.reduce((sum, t) => sum + t.masteryPercentage, 0);
        path.overallMasteryPercentage = Math.round(total / path.topics.length);
        path.strugglingTopicsCount = path.topics.filter((t) => t.status === 'Beginner' || t.status === 'Learning').length;
        path.strongTopicsCount = path.topics.filter((t) => t.status === 'Strong').length;
        localStorage.setItem(cacheKey, JSON.stringify(path));
      }
    } catch (e) {
      console.warn('Failed to update cached adaptive path:', e);
    }
  }

  /**
   * Builds intelligent local question pool for fallback
   */
  private static generateLocalQuestionPool(
    params: SmartPracticeRequestParams,
    subject: string,
    weakTopics: WeakTopic[]
  ): SmartPracticeQuestionItem[] {
    const isMath = subject.toLowerCase().includes('math');

    if (isMath) {
      return [
        {
          id: `sp-math-1-${Date.now()}`,
          question: `Find the zeroes of the quadratic polynomial $p(x) = x^2 - 2x - 8$ and verify the relationship between zeroes and coefficients.`,
          options: [
            `Zeroes are $4$ and $-2$. Sum $= 2$, Product $= -8$`,
            `Zeroes are $-4$ and $2$. Sum $= -2$, Product $= -8$`,
            `Zeroes are $4$ and $2$. Sum $= 6$, Product $= 8$`,
            `Zeroes are $-4$ and $-2$. Sum $= -6$, Product $= 8$`,
          ],
          correctIndex: 0,
          explanation: `Factorizing $x^2 - 2x - 8 = (x - 4)(x + 2) = 0 \\implies x = 4, -2$. Sum of zeroes $\\alpha + \\beta = 4 + (-2) = 2 = -b/a = -(-2)/1 = 2$. Product $\\alpha\\beta = 4(-2) = -8 = c/a = -8/1 = -8$.`,
          difficulty: 'Medium',
          difficultyTier: 'Level 2 - Standard',
          subject: 'Mathematics',
          chapter: 'Polynomials',
          topic: 'Zeroes and Coefficients of Quadratic Polynomials',
          hints: [
            'Hint 1: Split the middle term: find two numbers that multiply to -8 and add to -2 (-4 and +2).',
            'Hint 2: Verify using $\\alpha + \\beta = -b/a$ and $\\alpha\\beta = c/a$.',
          ],
          practiceMode: params.mode,
          simpleConceptBreakdown: '• For $ax^2 + bx + c = 0$, Sum of zeroes $= -b/a$.\n• Product of zeroes $= c/a$.\n• Setting factors equal to 0 gives individual roots.',
        },
        {
          id: `sp-math-2-${Date.now()}`,
          question: `If the radius of the base of a right circular cylinder is halved keeping the height constant, what is the ratio of the volume of the reduced cylinder to that of the original cylinder?`,
          options: [
            `$1 : 4$`,
            `$1 : 2$`,
            `$1 : 8$`,
            `$1 : 16$`,
          ],
          correctIndex: 0,
          explanation: `Volume of cylinder $V = \\pi r^2 h$. New radius $r' = r/2$. New volume $V' = \\pi (r/2)^2 h = \\pi (r^2/4) h = V/4$. Therefore the ratio $V' : V = 1 : 4$.`,
          difficulty: 'Easy',
          difficultyTier: 'Level 1 - Foundation',
          subject: 'Mathematics',
          chapter: 'Surface Areas and Volumes',
          topic: 'Volume Relations of Solids',
          hints: [
            'Hint 1: Write formula $V = \\pi r^2 h$.',
            'Hint 2: Since radius is squared in the formula, halving $r$ decreases volume by $(1/2)^2 = 1/4$.',
          ],
          practiceMode: params.mode,
        },
        {
          id: `sp-math-3-${Date.now()}`,
          question: `Prove that $\\sqrt{5}$ is an irrational number by contradiction. Which of the following statements constitutes the key logical contradiction in the standard proof?`,
          options: [
            `5 divides both $a$ and $b$, contradicting the assumption that $a$ and $b$ are co-prime`,
            `5 is an even number, which contradicts arithmetic principles`,
            `$a^2$ cannot equal $5b^2$ because integers cannot be factored`,
            `$\\sqrt{5}$ equals a rational terminating decimal $2.236$`,
          ],
          correctIndex: 0,
          explanation: `Let $\\sqrt{5} = a/b$ where $a, b$ are co-prime integers ($b \\neq 0$). Then $5b^2 = a^2 \\implies 5$ divides $a^2 \\implies 5$ divides $a$. Let $a = 5k \\implies 5b^2 = 25k^2 \\implies b^2 = 5k^2 \\implies 5$ divides $b$. Since 5 divides both $a$ and $b$, it contradicts the fundamental assumption that $a$ and $b$ are co-prime.`,
          difficulty: 'Hard',
          difficultyTier: 'Level 3 - Advanced',
          subject: 'Mathematics',
          chapter: 'Real Numbers',
          topic: 'Proof of Irrationality',
          hints: [
            'Hint 1: Recall theorem: If a prime $p$ divides $a^2$, then $p$ divides $a$.',
            'Hint 2: Co-prime integers have no common positive factor other than 1.',
          ],
          practiceMode: params.mode,
        },
        {
          id: `sp-math-4-${Date.now()}`,
          question: `In an equilateral triangle $\\triangle ABC$ with side length $a$, find the length of its altitude $AD$ drawn from $A$ perpendicular to $BC$.`,
          options: [
            `$\\frac{\\sqrt{3}}{2}a$`,
            `$\\frac{\\sqrt{3}}{4}a$`,
            `$\\frac{1}{2}a$`,
            `$\\sqrt{3}a$`,
          ],
          correctIndex: 0,
          explanation: `The altitude $AD$ bisects the base $BC$, so $BD = a/2$. In right-angled triangle $\\triangle ABD$, using Pythagoras theorem: $AD^2 = AB^2 - BD^2 = a^2 - (a/2)^2 = a^2 - a^2/4 = 3a^2/4 \\implies AD = \\frac{\\sqrt{3}}{2}a$.`,
          difficulty: 'Medium',
          difficultyTier: 'Level 2 - Standard',
          subject: 'Mathematics',
          chapter: 'Triangles',
          topic: 'Pythagoras Theorem & Equilateral Triangles',
          hints: [
            'Hint 1: In an equilateral triangle, the altitude is also the median.',
            'Hint 2: Apply $h^2 = a^2 - (a/2)^2$.',
          ],
          practiceMode: params.mode,
        },
        {
          id: `sp-math-5-${Date.now()}`,
          question: `Find the value of $k$ for which the pair of linear equations $kx + 3y = k - 3$ and $12x + ky = k$ have infinitely many solutions (coincident lines).`,
          options: [
            `$k = 6$`,
            `$k = -6$`,
            `$k = 0$`,
            `$k = 12$`,
          ],
          correctIndex: 0,
          explanation: `For infinitely many solutions: $a_1/a_2 = b_1/b_2 = c_1/c_2 \\implies k/12 = 3/k = (k-3)/k$. From $k/12 = 3/k \\implies k^2 = 36 \\implies k = \\pm 6$. Testing $k = 6$: $6/12 = 3/6 = 3/6 = 1/2$ (Consistent). Testing $k = -6$: $-6/12 = -1/2$, but $(-6-3)/(-6) = 9/6 = 3/2 \\neq -1/2$. Hence, strictly $k = 6$.`,
          difficulty: 'Hard',
          difficultyTier: 'Level 4 - HOTS / Application',
          subject: 'Mathematics',
          chapter: 'Pair of Linear Equations in Two Variables',
          topic: 'Conditions for Consistency & Infinite Solutions',
          hints: [
            'Hint 1: Write condition $a_1/a_2 = b_1/b_2 = c_1/c_2$.',
            'Hint 2: $k^2 = 36$ gives $k = 6$ or $k = -6$. Always test both in the third fraction!',
          ],
          practiceMode: params.mode,
          isApplicationBased: true,
        },
      ];
    }

    // Default Science Pool
    return [
      {
        id: `sp-sci-1-${Date.now()}`,
        question: `An object is placed at $20\\text{ cm}$ in front of a concave mirror of focal length $15\\text{ cm}$. At what distance from the mirror will the image be formed, and what is its nature?`,
        options: [
          `$v = -60\\text{ cm}$, Real and Inverted`,
          `$v = +60\\text{ cm}$, Virtual and Erect`,
          `$v = -30\\text{ cm}$, Real and Inverted`,
          `$v = +15\\text{ cm}$, Virtual and Diminished`,
        ],
        correctIndex: 0,
        explanation: `Given: $f = -15\\text{ cm}$, $u = -20\\text{ cm}$. Using mirror formula: $1/v = 1/f - 1/u = 1/(-15) - 1/(-20) = -1/15 + 1/20 = (-4 + 3)/60 = -1/60 \\implies v = -60\\text{ cm}$. The negative sign confirms real and inverted image in front of the mirror.`,
        difficulty: 'Medium',
        difficultyTier: 'Level 2 - Standard',
        subject: 'Science',
        chapter: 'Light: Reflection and Refraction',
        topic: 'Mirror Formula & Magnification',
        hints: [
          'Hint 1: Recall concave mirror focal length is negative ($f = -15\\text{ cm}$).',
          'Hint 2: Mirror formula is $1/v = 1/f - 1/u$.',
        ],
        practiceMode: params.mode,
        simpleConceptBreakdown: '• Distances in front of mirror are negative (-).\n• Focal length of concave mirror is negative (-).\n• Negative $v$ means real, inverted image.',
      },
      {
        id: `sp-sci-2-${Date.now()}`,
        question: `What happens when dilute Hydrochloric Acid ($\\text{HCl}$) is added to Iron filings ($\\text{Fe}$)?`,
        options: [
          `Hydrogen gas and Iron(II) chloride ($\\text{FeCl}_2$) are produced`,
          `Chlorine gas and Iron hydroxide are produced`,
          `No reaction takes place because iron is less reactive than hydrogen`,
          `Iron salt and water are produced without any gas`,
        ],
        correctIndex: 0,
        explanation: `Iron is more reactive than hydrogen in the electrochemical activity series. It displaces hydrogen: $\\text{Fe}(s) + 2\\text{HCl}(aq) \\to \\text{FeCl}_2(aq) + \\text{H}_2(g) \\uparrow$. Hydrogen gas is liberated with effervescence.`,
        difficulty: 'Easy',
        difficultyTier: 'Level 1 - Foundation',
        subject: 'Science',
        chapter: 'Chemical Reactions & Equations',
        topic: 'Displacement Reactions & Reactivity Series',
        hints: [
          'Hint 1: Metal + Acid -> Salt + Hydrogen gas.',
          'Hint 2: Iron forms Ferrous chloride ($\\text{FeCl}_2$).',
        ],
        practiceMode: params.mode,
      },
      {
        id: `sp-sci-3-${Date.now()}`,
        question: `An electric circuit consists of three resistors $R_1 = 2\\,\\Omega$, $R_2 = 3\\,\\Omega$, and $R_3 = 6\\,\\Omega$ connected in parallel across a $6\\text{ V}$ battery. What is the total equivalent resistance and total current drawn from the battery?`,
        options: [
          `$R_{\\text{eq}} = 1\\,\\Omega$, Total Current $I = 6\\text{ A}$`,
          `$R_{\\text{eq}} = 11\\,\\Omega$, Total Current $I = 0.54\\text{ A}$`,
          `$R_{\\text{eq}} = 2\\,\\Omega$, Total Current $I = 3\\text{ A}$`,
          `$R_{\\text{eq}} = 0.5\\,\\Omega$, Total Current $I = 12\\text{ A}$`,
        ],
        correctIndex: 0,
        explanation: `For parallel resistors: $1/R_{\\text{eq}} = 1/R_1 + 1/R_2 + 1/R_3 = 1/2 + 1/3 + 1/6 = (3 + 2 + 1)/6 = 6/6 = 1\\,\\Omega^{-1} \\implies R_{\\text{eq}} = 1\\,\\Omega$. Using Ohm's Law: $I = V/R_{\\text{eq}} = 6\\text{ V}/1\\,\\Omega = 6\\text{ A}$.`,
        difficulty: 'Medium',
        difficultyTier: 'Level 2 - Standard',
        subject: 'Science',
        chapter: 'Electricity',
        topic: 'Resistors in Parallel & Ohm’s Law',
        hints: [
          'Hint 1: $1/R_{\\text{eq}} = 1/2 + 1/3 + 1/6$.',
          'Hint 2: Find common denominator 6.',
          'Hint 3: $I = V / R_{\\text{eq}}$.',
        ],
        practiceMode: params.mode,
      },
      {
        id: `sp-sci-4-${Date.now()}`,
        question: `Which enzyme present in human saliva initiates the chemical digestion of carbohydrates in the buccal cavity, and what does it convert starch into?`,
        options: [
          `Salivary Amylase (Ptyalin); converts Starch into Maltose (simple disaccharide sugar)`,
          `Pepsin; converts Starch into Amino Acids`,
          `Trypsin; converts Starch into Glucose directly`,
          `Lipase; converts Starch into Fatty Acids`,
        ],
        correctIndex: 0,
        explanation: `Saliva contains the enzyme Salivary Amylase (Ptyalin), which hydrolyzes starch (complex carbohydrate) into maltose (a disaccharide) at an optimum pH of approximately 6.8: $\\text{Starch} \\xrightarrow{\\text{Salivary Amylase}} \\text{Maltose}$.`,
        difficulty: 'Easy',
        difficultyTier: 'Level 1 - Foundation',
        subject: 'Science',
        chapter: 'Life Processes',
        topic: 'Human Digestion & Enzymes',
        hints: [
          'Hint 1: Recall the enzyme produced by salivary glands.',
          'Hint 2: It breaks down complex starch into maltose.',
        ],
        practiceMode: params.mode,
      },
      {
        id: `sp-sci-5-${Date.now()}`,
        question: `A magnetic field is directed horizontally towards the North. A positively charged alpha particle moving vertically upward enters this field. According to Fleming's Left-Hand Rule, in which direction will the particle be deflected?`,
        options: [
          `Towards the West`,
          `Towards the East`,
          `Towards the South`,
          `Vertically Downward`,
        ],
        correctIndex: 0,
        explanation: `Using Fleming's Left-Hand Rule: Index finger points North (Magnetic Field $B$), Middle finger points Upward (Current $I$, direction of positive alpha particle motion). The outstretched Thumb naturally points towards the West (Direction of Magnetic Force $F$).`,
        difficulty: 'Hard',
        difficultyTier: 'Level 4 - HOTS / Application',
        subject: 'Science',
        chapter: 'Magnetic Effects of Electric Current',
        topic: 'Fleming’s Left-Hand Rule & Lorentz Force',
        hints: [
          'Hint 1: Forefinger = Field (North).',
          'Hint 2: Center finger = Current (Upward, same as positive charge).',
          'Hint 3: Thumb gives Force direction.',
        ],
        practiceMode: params.mode,
        isApplicationBased: true,
        realWorldScenario: 'Particle accelerator beam deflection and CRT electron steering.',
      },
    ];
  }
}
