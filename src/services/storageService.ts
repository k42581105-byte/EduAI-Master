import {
  StudentProfile,
  WeakTopic,
  StrongTopic,
  RecommendedTopic,
  Achievement,
  LevelMilestone,
  ActivityLog,
  SavedNote,
  StudyPlan,
  StudyTask,
  Quiz,
  Exam,
  Conversation,
  ChatMessage,
  SubjectTeacherMode,
  ScanHistoryItem,
  PersonalLearningSystemData,
  RecommendationItem,
} from '../types';
import { LanguageCode } from '../i18n/translations';

const KEYS = {
  PROFILE: 'eduai_profile',
  THEME: 'eduai_theme',
  LANG: 'eduai_lang',
  WEAK_TOPICS: 'eduai_weak_topics',
  STRONG_TOPICS: 'eduai_strong_topics',
  ACHIEVEMENTS: 'eduai_achievements',
  MILESTONES: 'eduai_level_milestones',
  QUESTIONS_SOLVED: 'eduai_questions_solved',
  ACTIVITIES: 'eduai_activities',
  NOTES: 'eduai_notes',
  STUDY_PLAN: 'eduai_study_plan',
  QUIZZES: 'eduai_quizzes',
  EXAMS: 'eduai_exams',
  CONVERSATIONS: 'eduai_conversations',
  ACTIVE_CONVERSATION_ID: 'eduai_active_conv_id',
  SUBJECT_MODE: 'eduai_subject_mode',
  SCAN_HISTORY: 'eduai_scan_history',
  PHOTO_XP_DATE: 'eduai_photo_xp_date',
  PHOTO_XP_COUNT: 'eduai_photo_xp_count',
  PHOTO_LAST_HASH: 'eduai_photo_last_hash',
  FAVORITE_BOOKS: 'eduai_favorite_books',
  RECENT_BOOKS: 'eduai_recent_books',
  PERSONAL_RECOMMENDATIONS: 'eduai_personal_recommendations',
  DISMISSED_RECOMMENDATIONS: 'eduai_dismissed_recommendations',
  ACCEPTED_RECOMMENDATIONS: 'eduai_accepted_recommendations',
};


// Initial default student profile
const DEFAULT_PROFILE: StudentProfile = {
  name: 'Rahul Sharma',
  classLevel: '10',
  board: 'CBSE',
  medium: 'English',
  preferredLanguage: 'en',
  selectedSubjects: ['Science', 'Mathematics', 'Social Science', 'English', 'Hindi (हिंदी)'],
  learningGoals: ['Score 95%+ in Class 10 CBSE Board Exams', 'Master Physics Mirror Formula', 'Complete Daily Quiz Streak'],
  xp: 340,
  level: 3,
  streakDays: 7,
  lastActiveDate: new Date().toISOString().split('T')[0],
  completedLessonsCount: 14,
  quizzesTaken: 8,
  examsCompleted: 2,
  avgScorePercentage: 88,
  dailyXpGoal: 100,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
};

// Initial Weak Topics
const DEFAULT_WEAK_TOPICS: WeakTopic[] = [
  {
    id: 'wt-1',
    subjectName: 'Science',
    chapterName: 'Light: Reflection & Refraction',
    topicName: 'Spherical Mirror Sign Convention & Magnification',
    accuracyRate: 42,
    lastPracticed: 'Yesterday',
    recommendedAction: 'Practice 5 AI Numericals & watch conceptual breakdown',
    urgency: 'Critical',
    difficultyLevel: 'Hard',
    recentPerformance: '42% in Quiz • Yesterday',
    improvementPercentage: -5,
    wrongAnswersCount: 6,
    attemptsCount: 3,
  },
  {
    id: 'wt-2',
    subjectName: 'Mathematics',
    chapterName: 'Quadratic Equations',
    topicName: 'Discriminant & Word Problem Formulations',
    accuracyRate: 55,
    lastPracticed: '3 days ago',
    recommendedAction: 'Take 10-Min AI Quick Practice Quiz',
    urgency: 'Moderate',
    difficultyLevel: 'Medium',
    recentPerformance: '55% in Quiz • 3 days ago',
    improvementPercentage: +10,
    wrongAnswersCount: 4,
    attemptsCount: 2,
  },
  {
    id: 'wt-3',
    subjectName: 'Science',
    chapterName: 'Carbon & Its Compounds',
    topicName: 'Isomerism & Covalent Bonding Structures',
    accuracyRate: 60,
    lastPracticed: '4 days ago',
    recommendedAction: 'Review AI Summary Notes & Dot Diagrams',
    urgency: 'Moderate',
    difficultyLevel: 'Medium',
    recentPerformance: '60% in Mock Exam • 4 days ago',
    improvementPercentage: +5,
    wrongAnswersCount: 3,
    attemptsCount: 2,
  },
];

// Initial Strong Topics
const DEFAULT_STRONG_TOPICS: StrongTopic[] = [
  {
    id: 'st-1',
    subjectName: 'Science',
    chapterName: 'Chemical Reactions & Equations',
    topicName: 'Types of Reactions & Redox Balancing',
    accuracyRate: 92,
    masteryLevel: 'Mastered',
    lastPracticed: '2 days ago',
    testsTakenCount: 5,
  },
  {
    id: 'st-2',
    subjectName: 'Mathematics',
    chapterName: 'Polynomials',
    topicName: 'Zeros of Polynomial & Relationship between Coefficients',
    accuracyRate: 88,
    masteryLevel: 'Strong',
    lastPracticed: '5 days ago',
    testsTakenCount: 4,
  },
  {
    id: 'st-3',
    subjectName: 'Social Science',
    chapterName: 'Rise of Nationalism in Europe',
    topicName: 'Unification of Germany & Italy Timeline',
    accuracyRate: 90,
    masteryLevel: 'Mastered',
    lastPracticed: '1 week ago',
    testsTakenCount: 3,
  },
  {
    id: 'st-4',
    subjectName: 'English',
    chapterName: 'A Letter to God',
    topicName: 'Character Sketch & Textual Analysis',
    accuracyRate: 95,
    masteryLevel: 'Mastered',
    lastPracticed: 'Yesterday',
    testsTakenCount: 4,
  },
];

// Initial Recommended Topics
const DEFAULT_RECOMMENDED_TOPICS: RecommendedTopic[] = [
  {
    id: 'rec-1',
    subjectName: 'Science',
    chapterName: 'Electricity',
    topicName: 'Ohm’s Law & Resistance in Series/Parallel',
    reason: 'Prerequisite topic with high weightage in Board Exams (8-10 marks)',
    importance: 'High Weightage',
    estimatedMinutes: 25,
  },
  {
    id: 'rec-2',
    subjectName: 'Mathematics',
    chapterName: 'Introduction to Trigonometry',
    topicName: 'Trigonometric Ratios & Specific Angles (0°-90°)',
    reason: 'Follows Algebra mastery; crucial for Application of Trigonometry chapter',
    importance: 'Prerequisite',
    estimatedMinutes: 30,
  },
  {
    id: 'rec-3',
    subjectName: 'Social Science',
    chapterName: 'Nationalism in India',
    topicName: 'Non-Cooperation Movement & Civil Disobedience',
    reason: 'Matches your strong historical analysis performance',
    importance: 'Next Step',
    estimatedMinutes: 20,
  },
];

// Initial Achievements & Badges
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-first-quiz',
    title: 'First Quiz',
    description: 'Complete your first practice quiz',
    icon: 'BookOpen',
    unlocked: true,
    unlockedAt: 'Aug 10, 2026',
    unlockDate: 'Aug 10, 2026',
    progressCurrent: 1,
    progressTarget: 1,
    rewardXp: 50,
    category: 'Quiz',
    badgeRarity: 'Bronze',
  },
  {
    id: 'ach-first-exam',
    title: 'First Exam',
    description: 'Complete your first timed AI mock exam',
    icon: 'GraduationCap',
    unlocked: true,
    unlockedAt: 'Aug 11, 2026',
    unlockDate: 'Aug 11, 2026',
    progressCurrent: 1,
    progressTarget: 1,
    rewardXp: 100,
    category: 'Exam',
    badgeRarity: 'Bronze',
  },
  {
    id: 'ach-7day-streak',
    title: '7-Day Streak',
    description: 'Maintain a 7-day consecutive study streak',
    icon: 'Flame',
    unlocked: true,
    unlockedAt: 'Aug 13, 2026',
    unlockDate: 'Aug 13, 2026',
    progressCurrent: 7,
    progressTarget: 7,
    rewardXp: 100,
    category: 'Streak',
    badgeRarity: 'Silver',
  },
  {
    id: 'ach-100-qs',
    title: '100 Questions Solved',
    description: 'Solve 100 total practice and exam questions',
    icon: 'Target',
    unlocked: false,
    progressCurrent: 48,
    progressTarget: 100,
    rewardXp: 250,
    category: 'General',
    badgeRarity: 'Gold',
  },
  {
    id: 'ach-10-notes',
    title: '10 Notes Created',
    description: 'Generate and save 10 AI revision notes',
    icon: 'BookMarked',
    unlocked: false,
    progressCurrent: 6,
    progressTarget: 10,
    rewardXp: 120,
    category: 'Notes',
    badgeRarity: 'Silver',
  },
  {
    id: 'ach-quiz-master',
    title: 'Quiz Master',
    description: 'Score 100% accuracy in 5 practice quizzes',
    icon: 'Award',
    unlocked: false,
    progressCurrent: 3,
    progressTarget: 5,
    rewardXp: 200,
    category: 'Quiz',
    badgeRarity: 'Gold',
  },
  {
    id: 'ach-study-streak',
    title: 'Study Streak',
    description: 'Maintain a 14-day study streak',
    icon: 'Flame',
    unlocked: false,
    progressCurrent: 7,
    progressTarget: 14,
    rewardXp: 300,
    category: 'Streak',
    badgeRarity: 'Gold',
  },
  {
    id: 'ach-topic-expert',
    title: 'Topic Expert',
    description: 'Master 3 weak topics with 80%+ retest accuracy',
    icon: 'CheckCircle2',
    unlocked: false,
    progressCurrent: 2,
    progressTarget: 3,
    rewardXp: 200,
    category: 'General',
    badgeRarity: 'Gold',
  },
  {
    id: 'ach-photo-genius',
    title: 'Photo Solver Genius',
    description: 'Solve 5 homework problems with AI Photo Solver',
    icon: 'Sparkles',
    unlocked: false,
    progressCurrent: 4,
    progressTarget: 5,
    rewardXp: 150,
    category: 'Solver',
    badgeRarity: 'Silver',
  },
  {
    id: 'ach-planner-dynamo',
    title: 'Planner Dynamo',
    description: 'Complete 10 study tasks in Study Planner',
    icon: 'Trophy',
    unlocked: false,
    progressCurrent: 6,
    progressTarget: 10,
    rewardXp: 150,
    category: 'Planner',
    badgeRarity: 'Silver',
  },
];

// Initial Level Milestones & Rewards
const DEFAULT_LEVEL_MILESTONES: LevelMilestone[] = [
  {
    level: 1,
    title: 'Novice Student',
    requiredXp: 0,
    rewardTitle: 'Starter Scholar Badge',
    rewardXpBonus: 0,
    unlocked: true,
    claimed: true,
    perks: ['Access to AI Doubts Teacher', 'Basic Practice Quiz Mode'],
  },
  {
    level: 2,
    title: 'Enthusiast Learner',
    requiredXp: 150,
    rewardTitle: 'Photo Homework Solver Unlock',
    rewardXpBonus: 50,
    unlocked: true,
    claimed: true,
    perks: ['AI Camera Photo Solver', 'AI Notes High-Yield Generator'],
  },
  {
    level: 3,
    title: 'Academic Scholar',
    requiredXp: 300,
    rewardTitle: 'Timed Board Mock Exams',
    rewardXpBonus: 100,
    unlocked: true,
    claimed: true,
    perks: ['Timed AI Mock Exam Engine', 'Custom Study Planner Scheduler'],
  },
  {
    level: 4,
    title: 'Master Tactician',
    requiredXp: 450,
    rewardTitle: 'Weak Topic Remediation Engine',
    rewardXpBonus: 150,
    unlocked: true,
    claimed: false,
    perks: ['Weak Topics Auto-Diagnosis', '2x Retest XP Boost'],
  },
  {
    level: 5,
    title: 'Grand Academic Titan',
    requiredXp: 600,
    rewardTitle: 'Titan Avatar Ring & Custom Title',
    rewardXpBonus: 250,
    unlocked: false,
    claimed: false,
    perks: ['Diamond Profile Badge', 'Priority AI Tutor Response Speed'],
  },
  {
    level: 6,
    title: 'Knowledge Sovereign',
    requiredXp: 900,
    rewardTitle: 'Sovereign Trophy & Master Certificate',
    rewardXpBonus: 500,
    unlocked: false,
    claimed: false,
    perks: ['Gold Avatar Ring', 'All Advanced AI Learning Features'],
  },
];

// Initial Recent Activities
const DEFAULT_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    title: 'Completed Science Quiz: Chemical Reactions',
    type: 'quiz',
    timestamp: '20 mins ago',
    xpEarned: 50,
    details: 'Scored 9/10 (90%) - Earned +50 XP',
  },
  {
    id: 'act-2',
    title: 'Generated Notes: Physics Light & Reflection',
    type: 'note',
    timestamp: '2 hours ago',
    xpEarned: 20,
    details: 'Saved high-yield revision summary to Notes',
  },
  {
    id: 'act-3',
    title: 'Solved Math Homework Photo with AI',
    type: 'photo-solver',
    timestamp: 'Yesterday',
    xpEarned: 30,
    details: 'Analyzed Quadratic Equation word problem',
  },
  {
    id: 'act-4',
    title: 'Completed Class 10 Science Mock Exam',
    type: 'exam',
    timestamp: '2 days ago',
    xpEarned: 100,
    details: 'Scored 44/50 (88%) - Passed with Distinction',
  },
];

// Initial Saved Notes
const DEFAULT_NOTES: SavedNote[] = [
  {
    id: 'note-1',
    title: 'Chemical Reactions & Equations - Key Revision',
    subjectName: 'Science',
    chapterName: 'Chemical Reactions',
    topicName: 'Types of Chemical Reactions & Redox',
    classLevel: '10',
    language: 'en',
    createdAt: 'Today, 10:30 AM',
    tags: ['Class 10', 'Chemistry', 'Board Exam'],
    isAiGenerated: true,
    isFavorite: true,
    sourceType: 'topic',
    quickRevisionPoints: [
      'Combination Reaction: Single product formed from 2 or more reactants (A + B -> AB).',
      'Decomposition Reaction: Single compound breaks down using heat, light, or electricity.',
      'Displacement Reaction: More reactive element displaces less reactive element from solution.',
      'Double Displacement: Mutual exchange of ions between reactants forming a precipitate.',
      'Redox Reaction: Simultaneous oxidation (gain of O / loss of H) and reduction (gain of H / loss of O).',
    ],
    contentMarkdown: `# Science - Chemical Reactions & Equations (Class 10)

### 📌 Short Summary
Chemical reactions represent transformations of matter into new chemical substances with distinct properties. Mastering reaction balancing and types ensures top scores in board examinations.

### 🎯 Key Points
- Mass is conserved in all chemical reactions according to the Law of Conservation of Mass.
- Skeletal chemical equations must be balanced by making atoms of each element equal on both sides.
- Exothermic reactions release energy; endothermic reactions absorb heat energy.
- Corrosion (rusting of iron) and Rancidity (oxidation of fats) are everyday effects of oxidation.

### 📚 Important Definitions
- **Combination Reaction**: Two or more substances combine to form a single new product.
- **Precipitation Reaction**: Any reaction that produces an insoluble solid precipitate.
- **Oxidation**: Gain of oxygen or loss of hydrogen by a substance in a reaction.

### ⚡ Formulas & Key Rules
- **Displacement Rule**: \`Fe(s) + CuSO4(aq) -> FeSO4(aq) + Cu(s)\`
- **Double Displacement**: \`Na2SO4(aq) + BaCl2(aq) -> BaSO4(s)↓ + 2NaCl(aq)\`

### 💡 Examples
- **Example 1**: Quicklime (CaO) reacting with water to form Slaked Lime [Ca(OH)2] with evolution of heat.
- **Example 2**: Silver chloride turning gray in sunlight due to photochemical decomposition into silver and chlorine.

### ❓ Important Questions
1. **Q: What happens when magnesium ribbon burns in air?**
   **A:** It burns with a dazzling white flame to form white magnesium oxide powder [2Mg + O2 -> 2MgO].
2. **Q: Why are oil and fat containing food items flushed with nitrogen gas?**
   **A:** To prevent oxidation and rancidity by creating an inert atmosphere.

### ⚡ Quick Revision
- ⚡ Always write physical states (s, l, g, aq) alongside chemical formulas.
- ⚡ Redox occurs when oxidation and reduction take place simultaneously.
- ⚡ Antidotes for rancidity include adding antioxidants and vacuum packaging.`,
  },
  {
    id: 'note-2',
    title: 'Spherical Mirrors Formulae & Ray Rules',
    subjectName: 'Science',
    chapterName: 'Light: Reflection and Refraction',
    topicName: 'Mirror Formula & Magnification',
    classLevel: '10',
    language: 'en',
    createdAt: 'Yesterday',
    tags: ['Physics', 'Formulas', 'Diagrams'],
    isAiGenerated: true,
    isFavorite: false,
    sourceType: 'topic',
    quickRevisionPoints: [
      'Mirror Formula: 1/f = 1/v + 1/u (focal length, image distance, object distance).',
      'Sign Convention: Object distance u is ALWAYS negative (-).',
      'Focal Length f: Negative for Concave Mirror, Positive for Convex Mirror.',
      'Magnification m = -v/u = h_i / h_o. Negative m indicates real & inverted image.',
      'Convex mirror always forms virtual, erect, and diminished image behind mirror.',
    ],
    contentMarkdown: `# Science - Light: Reflection & Refraction (Class 10)

### 📌 Short Summary
Spherical mirrors focus or diverge light rays according to fundamental laws of reflection. Understanding ray diagrams and sign conventions guarantees success in optics numerical problems.

### 🎯 Key Points
- Concave mirrors converge parallel light rays to a real focus in front of the mirror.
- Convex mirrors diverge light rays, forming virtual images behind the mirror.
- Focal length (f) is half of the radius of curvature (R): \`f = R / 2\`.
- Real images are inverted and can be projected on a screen; virtual images are erect.

### 📚 Important Definitions
- **Principal Focus**: The point on the principal axis where rays parallel to principal axis converge or appear to diverge from.
- **Magnification**: Ratio of the height of the image to the height of the object.

### ⚡ Formulas & Key Rules
- **Mirror Formula**: \`1/f = 1/v + 1/u\`
- **Magnification**: \`m = -v / u = h_i / h_o\`

### 💡 Examples
- **Example 1**: Concave mirrors used by dentists and solar furnaces to concentrate heat at the focus.
- **Example 2**: Convex mirrors used as rear-view mirrors in vehicles due to wide field of view.

### ❓ Important Questions
1. **Q: Find the focal length of a spherical mirror whose radius of curvature is 32 cm.**
   **A:** \`f = R / 2 = 32 / 2 = +16 cm\`.
2. **Q: Why do we prefer a convex mirror as a rear view mirror in vehicles?**
   **A:** It always forms an erect, diminished image and gives a wider field of view to the driver.

### ⚡ Quick Revision
- ⚡ Remember Cartesian sign convention: distances measured against incident light are negative.
- ⚡ Concave mirror focal length is always negative (-f).
- ⚡ Refractive index of medium 2 w.r.t 1 = Speed of light in 1 / Speed of light in 2.`,
  },
  {
    id: 'note-3',
    title: 'Quadratic Equations & Discriminant Rules',
    subjectName: 'Maths',
    chapterName: 'Quadratic Equations',
    topicName: 'Nature of Roots & Quadratic Formula',
    classLevel: '10',
    language: 'en',
    createdAt: '2 days ago',
    tags: ['Class 10', 'Algebra', 'Formulas'],
    isAiGenerated: true,
    isFavorite: true,
    sourceType: 'topic',
    quickRevisionPoints: [
      'Standard Form: ax² + bx + c = 0 (where a ≠ 0).',
      'Discriminant D = b² - 4ac.',
      'If D > 0: Two distinct real roots.',
      'If D = 0: Two equal real roots (x = -b / 2a).',
      'If D < 0: No real roots (imaginary roots).',
      'Quadratic Formula: x = (-b ± √(b² - 4ac)) / 2a.',
    ],
    contentMarkdown: `# Maths - Quadratic Equations (Class 10)

### 📌 Short Summary
A quadratic equation is a second-degree polynomial equation. Solving quadratic equations via factoring or the quadratic formula is a foundational topic in Class 10 Board Mathematics.

### 🎯 Key Points
- Any equation of the form \`ax² + bx + c = 0\` where \`a ≠ 0\` is a quadratic equation.
- Roots of a quadratic equation are the values of x that satisfy the equation.
- The discriminant \`D = b² - 4ac\` determines the nature of the roots without finding them explicitly.

### 📚 Important Definitions
- **Discriminant**: The expression \`b² - 4ac\` derived from the coefficients of the quadratic equation.
- **Nature of Roots**: Classification of roots as distinct real, equal real, or non-real.

### ⚡ Formulas & Key Rules
- **Quadratic Formula**: \`x = (-b ± √(b² - 4ac)) / (2a)\`
- **Discriminant Rules**:
  - \`D > 0\`: Two distinct real roots
  - \`D = 0\`: Two equal real roots
  - \`D < 0\`: No real roots

### 💡 Examples
- **Example 1**: Finding dimensions of a rectangular field whose area is 300 m² and length is 1m more than twice its breadth.
- **Example 2**: Speed of boat in still water vs stream speed problems.

### ❓ Important Questions
1. **Q: Find the discriminant of 2x² - 4x + 3 = 0 and hence find the nature of its roots.**
   **A:** \`D = (-4)² - 4(2)(3) = 16 - 24 = -8\`. Since D < 0, there are no real roots.
2. **Q: For what value of k does kx(x - 2) + 6 = 0 have two equal roots?**
   **A:** Rewrite as \`kx² - 2kx + 6 = 0\`. Set \`D = 4k² - 24k = 0\` => \`k = 6\`.

### ⚡ Quick Revision
- ⚡ Always write quadratic equation in standard descending power form before calculating D.
- ⚡ Check if discriminant is a perfect square to quickly determine if roots are rational.
- ⚡ Sum of roots = -b/a, Product of roots = c/a.`,
  },
];

// Initial Study Plan
const DEFAULT_STUDY_PLAN: StudyPlan = {
  id: 'plan-1',
  startDate: new Date().toISOString().split('T')[0],
  targetExamDate: '2026-11-15',
  weeklyGoalHours: 14,
  tasks: [
    {
      id: 'st-1',
      title: 'Revise Physics Mirror Formula & Numericals',
      subjectName: 'Science',
      dueDate: 'Today',
      estimatedMinutes: 30,
      completed: false,
      priority: 'High',
      taskType: 'Revision',
    },
    {
      id: 'st-2',
      title: 'Complete Math Quiz on Discriminants',
      subjectName: 'Mathematics',
      dueDate: 'Today',
      estimatedMinutes: 15,
      completed: true,
      priority: 'High',
      taskType: 'Quiz',
    },
    {
      id: 'st-3',
      title: 'Read Life Processes: Circulation Chapter',
      subjectName: 'Science',
      dueDate: 'Tomorrow',
      estimatedMinutes: 45,
      completed: false,
      priority: 'Medium',
      taskType: 'Lesson',
    },
    {
      id: 'st-4',
      title: 'Take Full Science Mid-Term Mock Test',
      subjectName: 'Science',
      dueDate: 'In 3 Days',
      estimatedMinutes: 60,
      completed: false,
      priority: 'High',
      taskType: 'Exam Practice',
    },
  ],
};

// In-memory cache store for high performance and zero JSON-parse overhead on repeated renders
const memoryCacheStore: Record<string, any> = {};

function getCached<T>(key: string, parseFn: () => T): T {
  if (memoryCacheStore[key] !== undefined) {
    return memoryCacheStore[key];
  }
  const val = parseFn();
  memoryCacheStore[key] = val;
  return val;
}

function setCached(key: string, val: any): void {
  memoryCacheStore[key] = val;
}

function invalidateCached(key?: string): void {
  if (key) {
    delete memoryCacheStore[key];
  } else {
    for (const k of Object.keys(memoryCacheStore)) {
      delete memoryCacheStore[k];
    }
  }
}

// Storage helper methods
export const StorageService = {
  // 1. Profile
  getProfile(): StudentProfile {
    return getCached(KEYS.PROFILE, () => {
      try {
        const data = localStorage.getItem(KEYS.PROFILE);
        return data ? JSON.parse(data) : DEFAULT_PROFILE;
      } catch {
        return DEFAULT_PROFILE;
      }
    });
  },

  saveProfile(profile: StudentProfile): void {
    try {
      setCached(KEYS.PROFILE, profile);
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  },

  // XP & Level Calculator
  addXp(amount: number, activityTitle?: string): { newXp: number; newLevel: number; leveledUp: boolean } {
    const profile = this.getProfile();
    const oldXp = profile.xp;
    const oldLevel = profile.level;
    const newXp = oldXp + amount;

    // Level formula: Level = Math.floor(Xp / 150) + 1
    const newLevel = Math.floor(newXp / 150) + 1;
    const leveledUp = newLevel > oldLevel;

    profile.xp = newXp;
    profile.level = newLevel;
    this.saveProfile(profile);

    if (activityTitle) {
      this.logActivity({
        id: `act-${Date.now()}`,
        title: activityTitle,
        type: 'ask-ai',
        timestamp: 'Just now',
        xpEarned: amount,
        details: `Earned +${amount} XP`,
      });
    }

    if (leveledUp && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('eduai_level_up', { detail: { newLevel, oldLevel, newXp } })
      );
    }

    return { newXp, newLevel, leveledUp };
  },

  // 2. Theme
  getTheme(): 'light' | 'dark' | 'system' {
    try {
      return (localStorage.getItem(KEYS.THEME) as any) || 'light';
    } catch {
      return 'light';
    }
  },

  saveTheme(theme: 'light' | 'dark' | 'system'): void {
    try {
      localStorage.setItem(KEYS.THEME, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (err) {
      console.error('Theme save error:', err);
    }
  },

  // 3. Language
  getLanguage(): LanguageCode {
    try {
      return (localStorage.getItem(KEYS.LANG) as any) || 'en';
    } catch {
      return 'en';
    }
  },

  saveLanguage(lang: LanguageCode): void {
    try {
      localStorage.setItem(KEYS.LANG, lang);
      const profile = this.getProfile();
      profile.preferredLanguage = lang;
      this.saveProfile(profile);
    } catch (err) {
      console.error('Language save error:', err);
    }
  },

  // 4. Weak Topics & Performance Analysis
  getWeakTopics(): WeakTopic[] {
    return getCached(KEYS.WEAK_TOPICS, () => {
      try {
        const data = localStorage.getItem(KEYS.WEAK_TOPICS);
        const topics: WeakTopic[] = data ? JSON.parse(data) : DEFAULT_WEAK_TOPICS;
        // Ensure all fields exist
        return topics.map((t) => ({
          ...t,
          difficultyLevel: t.difficultyLevel || (t.accuracyRate < 45 ? 'Hard' : t.accuracyRate < 60 ? 'Medium' : 'Easy'),
          recentPerformance: t.recentPerformance || `${t.accuracyRate}% in Quiz • ${t.lastPracticed}`,
          improvementPercentage: t.improvementPercentage ?? 0,
          wrongAnswersCount: t.wrongAnswersCount ?? Math.max(1, Math.round((100 - t.accuracyRate) / 10)),
          attemptsCount: t.attemptsCount ?? 2,
        }));
      } catch {
        return DEFAULT_WEAK_TOPICS;
      }
    });
  },

  saveWeakTopics(topics: WeakTopic[]): void {
    setCached(KEYS.WEAK_TOPICS, topics);
    localStorage.setItem(KEYS.WEAK_TOPICS, JSON.stringify(topics));
  },

  getStrongTopics(): StrongTopic[] {
    return getCached(KEYS.STRONG_TOPICS, () => {
      try {
        const data = localStorage.getItem(KEYS.STRONG_TOPICS);
        return data ? JSON.parse(data) : DEFAULT_STRONG_TOPICS;
      } catch {
        return DEFAULT_STRONG_TOPICS;
      }
    });
  },

  saveStrongTopics(topics: StrongTopic[]): void {
    setCached(KEYS.STRONG_TOPICS, topics);
    localStorage.setItem(KEYS.STRONG_TOPICS, JSON.stringify(topics));
  },

  getRecommendedTopics(): RecommendedTopic[] {
    return DEFAULT_RECOMMENDED_TOPICS;
  },

  recordWeakTopic(
    subjectName: string,
    chapterName: string,
    topicName: string,
    accuracyRate: number,
    difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
  ): void {
    const list = this.getWeakTopics();
    const existingIndex = list.findIndex(
      (wt) =>
        wt.subjectName.toLowerCase() === subjectName.toLowerCase() &&
        (wt.topicName.toLowerCase() === topicName.toLowerCase() ||
          wt.chapterName.toLowerCase() === chapterName.toLowerCase())
    );

    const urgency: 'Critical' | 'Moderate' | 'Low' =
      accuracyRate < 45 ? 'Critical' : accuracyRate < 70 ? 'Moderate' : 'Low';

    const recommendedAction =
      accuracyRate < 50
        ? 'Review AI Summary Notes & practice 5 AI Numericals'
        : 'Take 10-Min AI Quick Practice Quiz';

    if (existingIndex >= 0) {
      const prevAcc = list[existingIndex].accuracyRate;
      const imp = accuracyRate - prevAcc;
      list[existingIndex] = {
        ...list[existingIndex],
        accuracyRate,
        lastPracticed: 'Just now',
        urgency,
        recommendedAction,
        difficultyLevel: difficulty,
        recentPerformance: `${accuracyRate}% in test • Just now`,
        improvementPercentage: imp,
        attemptsCount: (list[existingIndex].attemptsCount || 1) + 1,
        wrongAnswersCount: Math.max(1, Math.round((100 - accuracyRate) / 10)),
      };
    } else {
      list.unshift({
        id: `wt-${Date.now()}`,
        subjectName,
        chapterName,
        topicName,
        accuracyRate,
        lastPracticed: 'Just now',
        recommendedAction,
        urgency,
        difficultyLevel: difficulty,
        recentPerformance: `${accuracyRate}% in test • Just now`,
        improvementPercentage: 0,
        wrongAnswersCount: Math.max(1, Math.round((100 - accuracyRate) / 10)),
        attemptsCount: 1,
      });
    }

    this.saveWeakTopics(list);
  },

  updateWeakTopicAfterRetest(
    topicId: string,
    retestAccuracy: number
  ): { topic: WeakTopic; earnedXp: number; improved: boolean } {
    const list = this.getWeakTopics();
    const idx = list.findIndex((t) => t.id === topicId);
    
    if (idx < 0) {
      const fallback = list[0] || DEFAULT_WEAK_TOPICS[0];
      return { topic: fallback, earnedXp: 0, improved: false };
    }

    const existing = list[idx];
    const oldAccuracy = existing.accuracyRate;
    const newAccuracy = Math.round((oldAccuracy + retestAccuracy) / 2);
    const improvement = retestAccuracy - oldAccuracy;
    const improved = improvement > 0;

    const newUrgency: 'Critical' | 'Moderate' | 'Low' =
      newAccuracy < 45 ? 'Critical' : newAccuracy < 70 ? 'Moderate' : 'Low';

    const updated: WeakTopic = {
      ...existing,
      accuracyRate: newAccuracy,
      lastPracticed: 'Just now',
      urgency: newUrgency,
      improvementPercentage: improvement,
      recentPerformance: `${retestAccuracy}% in Retest • Just now`,
      attemptsCount: (existing.attemptsCount || 1) + 1,
      wrongAnswersCount: Math.max(0, Math.round((100 - retestAccuracy) / 10)),
      recommendedAction:
        newAccuracy >= 75
          ? 'Great progress! Concept ready for review.'
          : 'Review AI Summary Notes & practice again.',
    };

    list[idx] = updated;
    this.saveWeakTopics(list);

    // If newAccuracy >= 80, add to Strong Topics
    if (newAccuracy >= 80) {
      const strongList = this.getStrongTopics();
      if (!strongList.some((st) => st.topicName.toLowerCase() === existing.topicName.toLowerCase())) {
        strongList.unshift({
          id: `st-${Date.now()}`,
          subjectName: existing.subjectName,
          chapterName: existing.chapterName,
          topicName: existing.topicName,
          accuracyRate: newAccuracy,
          masteryLevel: newAccuracy >= 90 ? 'Mastered' : 'Strong',
          lastPracticed: 'Just now',
          testsTakenCount: (existing.attemptsCount || 1) + 1,
        });
        this.saveStrongTopics(strongList);
      }
    }

    const earnedXp = improved ? 50 : 25;
    this.addXp(earnedXp, `Completed Retest on ${existing.topicName} (${retestAccuracy}%)`);
    this.checkAndEvaluateAchievements();

    if (improved && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('eduai_topic_improved', {
          detail: {
            topicName: existing.topicName,
            subjectName: existing.subjectName,
            chapterName: existing.chapterName,
            accuracyBefore: oldAccuracy,
            accuracyAfter: newAccuracy,
            xpBonus: 50,
          },
        })
      );
    }

    return { topic: updated, earnedXp, improved };
  },

  getSmartLearningAnalysis() {
    const weak = this.getWeakTopics();
    const strong = this.getStrongTopics();
    const recommended = this.getRecommendedTopics();
    const notes = this.getNotes();
    const plan = this.getStudyPlan();

    const criticalCount = weak.filter((w) => w.urgency === 'Critical').length;
    const pendingTasks = plan.tasks.filter((t) => !t.completed).length;

    return {
      strengths: {
        title: 'Your Strengths',
        topics: strong,
        aiInsight: `Outstanding problem-solving precision in ${strong[0]?.subjectName || 'Science'} & ${strong[1]?.subjectName || 'Maths'}! You have achieved 90%+ accuracy in core definitions.`,
      },
      shouldRevise: {
        title: 'You Should Revise',
        urgentTopics: weak.filter((w) => w.urgency === 'Critical' || w.urgency === 'Moderate'),
        pendingNotesCount: notes.length,
        pendingTasksCount: pendingTasks,
        aiInsight: criticalCount > 0
          ? `You have ${criticalCount} critical topic(s) needing attention before the next test. Spending 15 minutes revising formulas will boost accuracy by ~20%.`
          : 'All weak topics are currently under control! Keep revising prior notes to maintain memory retention.',
      },
      recommendedNext: {
        title: 'Recommended Next Topics',
        topics: recommended,
        aiInsight: 'Based on Board syllabus weightage and your recent progress, focusing on these topics will yield maximum exam marks.',
      },
    };
  },

  // 5. Achievements
  getAchievements(): Achievement[] {
    try {
      const data = localStorage.getItem(KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : DEFAULT_ACHIEVEMENTS;
    } catch {
      return DEFAULT_ACHIEVEMENTS;
    }
  },

  checkAndEvaluateAchievements(): { unlockedBadges: Achievement[] } {
    const achievements = this.getAchievements();
    const profile = this.getProfile();
    const quizzes = this.getSavedQuizzes();
    const exams = this.getSavedExams();
    const notes = this.getNotes();
    const scanHistory = this.getScanHistory();
    const plan = this.getStudyPlan();
    const strongTopics = this.getStrongTopics();

    // Stats calculations from real user activity
    const quizzesCount = Math.max(profile.quizzesTaken || 0, quizzes.length);
    const examsCount = exams.filter((e) => e.isCompleted).length;
    const notesCount = notes.length;
    const streakDays = profile.streakDays || 1;
    const photoSolvesCount = scanHistory.length;
    const completedTasksCount = plan.tasks.filter((t) => t.completed).length;
    const perfectQuizzesCount = quizzes.filter((q) => (q.score || 0) >= 100 || (q.accuracyPercentage || 0) >= 100).length;
    const strongTopicsCount = strongTopics.length;

    // Total questions solved estimate
    let totalQs = quizzes.reduce((sum, q) => sum + (q.questions?.length || 5), 0);
    totalQs += exams.reduce((sum, e) => sum + (e.questions?.length || 10), 0);
    totalQs += photoSolvesCount;

    const newlyUnlocked: Achievement[] = [];
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const updatedList = achievements.map((ach) => {
      let cur = ach.progressCurrent;
      switch (ach.id) {
        case 'ach-first-quiz':
          cur = Math.min(ach.progressTarget, quizzesCount);
          break;
        case 'ach-first-exam':
          cur = Math.min(ach.progressTarget, examsCount);
          break;
        case 'ach-7day-streak':
          cur = Math.min(ach.progressTarget, streakDays);
          break;
        case 'ach-100-qs':
          cur = Math.min(ach.progressTarget, totalQs);
          break;
        case 'ach-10-notes':
          cur = Math.min(ach.progressTarget, notesCount);
          break;
        case 'ach-quiz-master':
          cur = Math.min(ach.progressTarget, perfectQuizzesCount);
          break;
        case 'ach-study-streak':
          cur = Math.min(ach.progressTarget, streakDays);
          break;
        case 'ach-topic-expert':
          cur = Math.min(ach.progressTarget, strongTopicsCount);
          break;
        case 'ach-photo-genius':
          cur = Math.min(ach.progressTarget, photoSolvesCount);
          break;
        case 'ach-planner-dynamo':
          cur = Math.min(ach.progressTarget, completedTasksCount);
          break;
        case 'ach-titan-scholar':
          cur = Math.min(ach.progressTarget, profile.level);
          break;
        default:
          break;
      }

      const isNowUnlocked = cur >= ach.progressTarget;
      if (isNowUnlocked && !ach.unlocked) {
        const unlockedAch: Achievement = {
          ...ach,
          progressCurrent: cur,
          unlocked: true,
          unlockedAt: 'Just now',
          unlockDate: dateStr,
        };
        newlyUnlocked.push(unlockedAch);
        return unlockedAch;
      }

      return {
        ...ach,
        progressCurrent: cur,
      };
    });

    localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(updatedList));

    // Award XP and dispatch event for newly unlocked achievements
    newlyUnlocked.forEach((ach) => {
      this.addXp(ach.rewardXp, `Unlocked Badge: ${ach.title}`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('eduai_badge_unlocked', { detail: { badge: ach } })
        );
      }
    });

    return { unlockedBadges: newlyUnlocked };
  },

  // Level Milestones
  getLevelMilestones(): LevelMilestone[] {
    try {
      const data = localStorage.getItem(KEYS.MILESTONES);
      const list: LevelMilestone[] = data ? JSON.parse(data) : DEFAULT_LEVEL_MILESTONES;
      const profile = this.getProfile();

      return list.map((m) => ({
        ...m,
        unlocked: profile.level >= m.level,
      }));
    } catch {
      return DEFAULT_LEVEL_MILESTONES;
    }
  },

  claimLevelMilestone(level: number): { success: boolean; earnedXpBonus: number; milestone?: LevelMilestone; message: string } {
    const list = this.getLevelMilestones();
    const idx = list.findIndex((m) => m.level === level);
    if (idx < 0) return { success: false, earnedXpBonus: 0, message: 'Milestone not found' };

    const milestone = list[idx];
    const profile = this.getProfile();

    if (profile.level < milestone.level) {
      return { success: false, earnedXpBonus: 0, message: `Reach Level ${milestone.level} to unlock this milestone reward!` };
    }

    if (milestone.claimed) {
      return { success: false, earnedXpBonus: 0, message: 'Milestone reward already claimed!' };
    }

    list[idx].claimed = true;
    localStorage.setItem(KEYS.MILESTONES, JSON.stringify(list));

    if (milestone.rewardXpBonus > 0) {
      this.addXp(milestone.rewardXpBonus, `Claimed Level ${milestone.level} Milestone: ${milestone.rewardTitle}`);
    }

    return {
      success: true,
      earnedXpBonus: milestone.rewardXpBonus,
      milestone: list[idx],
      message: `Claimed Level ${milestone.level} Reward: ${milestone.rewardTitle}! (+${milestone.rewardXpBonus} XP Bonus)`,
    };
  },

  // 6. Activities
  getActivities(): ActivityLog[] {
    try {
      const data = localStorage.getItem(KEYS.ACTIVITIES);
      return data ? JSON.parse(data) : DEFAULT_ACTIVITIES;
    } catch {
      return DEFAULT_ACTIVITIES;
    }
  },

  logActivity(act: ActivityLog): void {
    const list = this.getActivities();
    list.unshift(act);
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(list.slice(0, 20)));
  },

  addActivityLog(title: string, details?: string, xpEarned: number = 0): void {
    this.logActivity({
      id: `act-${Date.now()}`,
      title,
      type: 'ask-ai',
      timestamp: 'Just now',
      xpEarned,
      details,
    });
  },

  // 7. Notes
  getNotes(): SavedNote[] {
    return getCached(KEYS.NOTES, () => {
      try {
        const data = localStorage.getItem(KEYS.NOTES);
        return data ? JSON.parse(data) : DEFAULT_NOTES;
      } catch {
        return DEFAULT_NOTES;
      }
    });
  },

  getSavedNotes(): SavedNote[] {
    return this.getNotes();
  },

  saveNote(note: SavedNote): void {
    const list = [...this.getNotes()];
    const existingIndex = list.findIndex((n) => n.id === note.id);
    if (existingIndex >= 0) {
      list[existingIndex] = note;
    } else {
      list.unshift(note);
      this.addXp(20, `Generated Notes: ${note.title}`);
    }
    setCached(KEYS.NOTES, list);
    localStorage.setItem(KEYS.NOTES, JSON.stringify(list));
    this.checkAndEvaluateAchievements();
  },

  deleteNote(id: string): void {
    const list = this.getNotes().filter((n) => n.id !== id);
    setCached(KEYS.NOTES, list);
    localStorage.setItem(KEYS.NOTES, JSON.stringify(list));
  },

  toggleFavoriteNote(id: string): SavedNote[] {
    const list = this.getNotes().map((n) => {
      if (n.id === id) {
        return { ...n, isFavorite: !n.isFavorite };
      }
      return n;
    });
    setCached(KEYS.NOTES, list);
    localStorage.setItem(KEYS.NOTES, JSON.stringify(list));
    return list;
  },

  // 7b. Quizzes Storage
  getQuizzes(): Quiz[] {
    return this.getSavedQuizzes();
  },

  getSavedQuizzes(): Quiz[] {
    return getCached(KEYS.QUIZZES, () => {
      try {
        const data = localStorage.getItem(KEYS.QUIZZES);
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    });
  },

  saveQuiz(quiz: Quiz): void {
    const list = [...this.getSavedQuizzes()];
    const existingIndex = list.findIndex((q) => q.id === quiz.id);
    if (existingIndex >= 0) {
      list[existingIndex] = quiz;
    } else {
      list.unshift(quiz);
    }
    const truncated = list.slice(0, 30);
    setCached(KEYS.QUIZZES, truncated);
    localStorage.setItem(KEYS.QUIZZES, JSON.stringify(truncated));
  },

  deleteSavedQuiz(id: string): void {
    const list = this.getSavedQuizzes().filter((q) => q.id !== id);
    setCached(KEYS.QUIZZES, list);
    localStorage.setItem(KEYS.QUIZZES, JSON.stringify(list));
  },

  recordQuizResult(
    quiz: Quiz,
    scorePercentage: number,
    accuracyPercentage: number,
    timeTakenSeconds: number,
    userAnswersRecord: Record<number, { selectedIndex?: number; typedAnswer?: string; isCorrect: boolean; flagged?: boolean }>
  ): { earnedXp: number; isRetake: boolean; leveledUp: boolean; newLevel: number; newXp: number } {
    const list = this.getSavedQuizzes();
    const existing = list.find((q) => q.id === quiz.id);

    const prevAttemptCount = existing?.attemptCount || (existing?.isCompleted ? 1 : 0);
    const newAttemptCount = prevAttemptCount + 1;
    const isRetake = prevAttemptCount > 0;

    const previousBest = existing?.bestScore ?? (existing?.score ?? 0);
    const newBest = Math.max(previousBest, scorePercentage);

    let xpToAward = 0;
    let activityText = '';

    if (!isRetake) {
      // First attempt: Award XP proportional to score %
      const baseReward = quiz.rewardXp || 100;
      xpToAward = Math.round((scorePercentage / 100) * baseReward);
      activityText = `Completed Quiz: ${quiz.title} (${scorePercentage}%)`;
    } else {
      // Retake attempt: Anti-farming protection!
      // Only award bonus XP if score improved over previous best
      if (scorePercentage > previousBest) {
        const improvementMargin = scorePercentage - previousBest;
        xpToAward = Math.max(5, Math.round((improvementMargin / 100) * (quiz.rewardXp || 100) * 0.5));
        activityText = `Improved Quiz Score: ${quiz.title} (${previousBest}% ➔ ${scorePercentage}%)`;
      } else {
        // No improvement on retake - award 0 XP to prevent farming
        xpToAward = 0;
        activityText = `Practiced Quiz (Retake #${newAttemptCount}): ${quiz.title}`;
      }
    }

    // Award XP via addXp if > 0, or log activity if 0
    let xpResult = { newXp: 0, newLevel: 0, leveledUp: false };
    if (xpToAward > 0) {
      xpResult = this.addXp(xpToAward, activityText);
    } else {
      this.logActivity({
        id: `act-${Date.now()}`,
        title: activityText,
        type: 'quiz',
        timestamp: 'Just now',
        xpEarned: 0,
        details: `Scored ${scorePercentage}% (No extra XP earned on retake)`,
      });
      const prof = this.getProfile();
      xpResult = { newXp: prof.xp, newLevel: prof.level, leveledUp: false };
    }

    // Update Profile statistics
    const profile = this.getProfile();
    profile.quizzesTaken = (profile.quizzesTaken || 0) + 1;

    // Recalculate average quiz score across completed quizzes
    const completedQuizzes = list.filter((q) => q.isCompleted);
    const totalScores = completedQuizzes.reduce((sum, q) => sum + (q.score || 0), scorePercentage);
    const count = completedQuizzes.length + (existing?.isCompleted ? 0 : 1);
    profile.avgScorePercentage = Math.round(totalScores / Math.max(1, count));
    this.saveProfile(profile);

    // Save updated quiz
    const updatedQuiz: Quiz = {
      ...quiz,
      score: scorePercentage,
      isCompleted: true,
      attemptCount: newAttemptCount,
      bestScore: newBest,
      accuracyPercentage,
      timeTakenSeconds,
      userAnswersRecord,
    };

    this.saveQuiz(updatedQuiz);

    // Record weak topic if accuracy < 70% or score < 70%
    if (accuracyPercentage < 70 || scorePercentage < 70) {
      this.recordWeakTopic(
        quiz.subjectId || 'General',
        quiz.chapterName || quiz.title,
        quiz.topicName || quiz.chapterName || quiz.title,
        accuracyPercentage
      );
    }

    this.checkAndEvaluateAchievements();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('eduai_quiz_completed', {
          detail: {
            quizTitle: quiz.title,
            subjectName: quiz.subjectId || 'Science',
            scorePercentage,
            accuracyPercentage,
            wrongCount: quiz.questions.length - Math.round((accuracyPercentage / 100) * quiz.questions.length),
          },
        })
      );
    }

    return {
      earnedXp: xpToAward,
      isRetake,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      newXp: xpResult.newXp,
    };
  },

  // 8. Study Plan
  getStudyPlan(): StudyPlan {
    return getCached(KEYS.STUDY_PLAN, () => {
      try {
        const data = localStorage.getItem(KEYS.STUDY_PLAN);
        return data ? JSON.parse(data) : DEFAULT_STUDY_PLAN;
      } catch {
        return DEFAULT_STUDY_PLAN;
      }
    });
  },

  saveStudyPlan(plan: StudyPlan): void {
    setCached(KEYS.STUDY_PLAN, plan);
    localStorage.setItem(KEYS.STUDY_PLAN, JSON.stringify(plan));
  },

  toggleTaskCompleted(taskId: string): void {
    const plan = this.getStudyPlan();
    const task = plan.tasks.find((t) => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveStudyPlan(plan);
      if (task.completed) {
        this.addXp(30, `Completed Task: ${task.title}`);
      }
      this.checkAndEvaluateAchievements();
    }
  },

  addTask(task: StudyTask): void {
    const plan = this.getStudyPlan();
    plan.tasks.unshift(task);
    this.saveStudyPlan(plan);
  },

  updateTask(updatedTask: StudyTask): void {
    const plan = this.getStudyPlan();
    const idx = plan.tasks.findIndex((t) => t.id === updatedTask.id);
    if (idx >= 0) {
      plan.tasks[idx] = updatedTask;
      this.saveStudyPlan(plan);
    }
  },

  deleteTask(taskId: string): void {
    const plan = this.getStudyPlan();
    plan.tasks = plan.tasks.filter((t) => t.id !== taskId);
    this.saveStudyPlan(plan);
  },

  // 8b. Exam Storage & History
  getExams(): Exam[] {
    return this.getSavedExams();
  },

  getSavedExams(): Exam[] {
    return getCached(KEYS.EXAMS, () => {
      try {
        const data = localStorage.getItem(KEYS.EXAMS);
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    });
  },

  getQuestionsSolved(): number {
    try {
      const stored = localStorage.getItem(KEYS.QUESTIONS_SOLVED);
      if (stored) return parseInt(stored, 10) || 0;
      const quizzes = this.getSavedQuizzes();
      const exams = this.getSavedExams();
      const scans = this.getScanHistory();
      let total = quizzes.reduce((sum, q) => sum + (q.questions?.length || 5), 0);
      total += exams.reduce((sum, e) => sum + (e.questions?.length || 10), 0);
      total += scans.length;
      return total;
    } catch {
      return 0;
    }
  },

  saveExam(exam: Exam): void {
    const list = [...this.getSavedExams()];
    const idx = list.findIndex((e) => e.id === exam.id);
    if (idx >= 0) {
      list[idx] = exam;
    } else {
      list.unshift(exam);
    }
    setCached(KEYS.EXAMS, list);
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(list));
  },

  deleteSavedExam(id: string): void {
    const list = this.getSavedExams().filter((e) => e.id !== id);
    setCached(KEYS.EXAMS, list);
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(list));
  },

  recordExamResult(
    exam: Exam,
    scoreEarned: number,
    answers: Record<string, string>,
    timeSpentSeconds?: number
  ): {
    earnedXp: number;
    percentage: number;
    leveledUp: boolean;
    newLevel: number;
    newXp: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    accuracyPercentage: number;
    isRepeatedExam: boolean;
    previousBestPercentage: number;
    antiFarmingActive: boolean;
  } {
    const totalM = exam.totalMarks || 1;
    const percentage = Math.round((scoreEarned / totalM) * 100);

    // Calculate question breakdown
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    exam.questions.forEach((q) => {
      const uAns = (answers[q.id] || '').trim();
      if (!uAns) {
        unansweredCount++;
      } else if (q.type === 'mcq') {
        const isCorr = uAns.toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
        if (isCorr) correctCount++;
        else wrongCount++;
      } else {
        // Descriptive scoring heuristics
        if (uAns.length > 15) correctCount++;
        else if (uAns.length > 5) correctCount++;
        else wrongCount++;
      }
    });

    const attemptedCount = correctCount + wrongCount;
    const accuracyPercentage =
      attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    // Check anti-farming / retake history
    const savedExams = this.getSavedExams();
    const previousAttempts = savedExams.filter(
      (e) => (e.id === exam.id || e.title === exam.title) && e.isSubmitted
    );

    let isRepeatedExam = false;
    let previousBestScore = 0;
    let previousBestPercentage = 0;
    let antiFarmingActive = false;
    let earnedXp = 0;

    const baseReward = exam.rewardXp || 100;

    if (previousAttempts.length > 0) {
      isRepeatedExam = true;
      previousBestScore = Math.max(...previousAttempts.map((e) => e.scoreEarned || 0));
      previousBestPercentage = Math.round((previousBestScore / totalM) * 100);

      const scoreImprovement = scoreEarned - previousBestScore;

      if (scoreImprovement > 0) {
        // Only award XP for score improvement + small retry bonus
        earnedXp = Math.round((scoreImprovement / totalM) * baseReward) + 10;
        antiFarmingActive = false;
      } else {
        // Repeated attempt with no score improvement: apply anti-farming token XP
        earnedXp = 5;
        antiFarmingActive = true;
      }
    } else {
      // First attempt: Full calculated XP
      earnedXp = Math.round((percentage / 100) * baseReward);
    }

    // Award XP
    const xpNotice = antiFarmingActive
      ? `Retook Exam: ${exam.title} (Anti-Farming: Score ${percentage}% vs Best ${previousBestPercentage}%)`
      : `Submitted Exam: ${exam.title} (${scoreEarned}/${totalM} Marks - ${percentage}%)`;

    const xpResult = this.addXp(earnedXp, xpNotice);

    // Save/update completed exam record
    const updatedExam: Exam = {
      ...exam,
      isSubmitted: true,
      scoreEarned,
      submittedAt: new Date().toISOString(),
      timeSpentSeconds: timeSpentSeconds || (exam.durationMinutes || 20) * 60,
      correctCount,
      wrongCount,
      unansweredCount,
      accuracyPercentage,
      attemptCount: (previousAttempts.length || 0) + 1,
      bestScore: Math.max(scoreEarned, previousBestScore),
      questions: exam.questions.map((q) => ({
        ...q,
        userAnswer: answers[q.id] || '',
      })),
    };

    this.saveExam(updatedExam);

    // Record weak topic if performance < 70%
    if (percentage < 70 || accuracyPercentage < 70) {
      this.recordWeakTopic(
        exam.subjectId || 'General',
        exam.chapterTopics || exam.title,
        `Board Exam Review Required (${percentage}% Score)`,
        accuracyPercentage || percentage
      );
    }

    // Log activity
    this.logActivity({
      id: `act-${Date.now()}`,
      title: `Exam Completed: ${exam.title}`,
      type: 'quiz',
      timestamp: 'Just now',
      xpEarned: earnedXp,
      score: percentage,
    });

    this.checkAndEvaluateAchievements();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('eduai_exam_completed', {
          detail: {
            examTitle: exam.title,
            subject: exam.subjectId || 'Science',
            percentage,
            scoreEarned,
            totalMarks: exam.totalMarks,
          },
        })
      );
    }

    return {
      earnedXp,
      percentage,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      newXp: xpResult.newXp,
      correctCount,
      wrongCount,
      unansweredCount,
      accuracyPercentage,
      isRepeatedExam,
      previousBestPercentage,
      antiFarmingActive,
    };
  },

  // 9. AI Conversations
  getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : DEFAULT_CONVERSATIONS;
    } catch {
      return DEFAULT_CONVERSATIONS;
    }
  },

  saveConversation(conversation: Conversation): void {
    const conversations = this.getConversations();
    const index = conversations.findIndex((c) => c.id === conversation.id);
    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.unshift(conversation);
    }
    localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(conversations));
  },

  deleteConversation(id: string): void {
    const conversations = this.getConversations().filter((c) => c.id !== id);
    localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(conversations));
    if (this.getActiveConversationId() === id) {
      this.setActiveConversationId(conversations[0]?.id || null);
    }
  },

  getActiveConversationId(): string | null {
    return localStorage.getItem(KEYS.ACTIVE_CONVERSATION_ID);
  },

  setActiveConversationId(id: string | null): void {
    if (id) {
      localStorage.setItem(KEYS.ACTIVE_CONVERSATION_ID, id);
    } else {
      localStorage.removeItem(KEYS.ACTIVE_CONVERSATION_ID);
    }
  },

  getSelectedSubjectMode(): SubjectTeacherMode {
    return (localStorage.getItem(KEYS.SUBJECT_MODE) as SubjectTeacherMode) || 'general';
  },

  setSelectedSubjectMode(mode: SubjectTeacherMode): void {
    localStorage.setItem(KEYS.SUBJECT_MODE, mode);
  },

  // 10. Scan History
  getScanHistory(): ScanHistoryItem[] {
    try {
      const data = localStorage.getItem(KEYS.SCAN_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveScanHistoryItem(item: ScanHistoryItem): void {
    try {
      const list = this.getScanHistory();
      // Remove any existing duplicate by ID
      const filtered = list.filter((i) => i.id !== item.id);
      filtered.unshift(item);
      // Keep max 30 items
      localStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(filtered.slice(0, 30)));
    } catch (err) {
      console.error('Failed to save scan history item:', err);
    }
  },

  deleteScanHistoryItem(id: string): void {
    try {
      const filtered = this.getScanHistory().filter((i) => i.id !== id);
      localStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(filtered));
    } catch (err) {
      console.error('Failed to delete scan history item:', err);
    }
  },

  clearScanHistory(): void {
    try {
      localStorage.removeItem(KEYS.SCAN_HISTORY);
    } catch (err) {
      console.error('Failed to clear scan history:', err);
    }
  },

  // 11. Photo Solver XP with Anti-Abuse Protection
  addPhotoSolverXp(amount: number, questionText: string): { awarded: boolean; xpAdded: number; message: string } {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem(KEYS.PHOTO_XP_DATE);
    let currentCount = 0;

    if (savedDate === today) {
      currentCount = parseInt(localStorage.getItem(KEYS.PHOTO_XP_COUNT) || '0', 10);
    } else {
      localStorage.setItem(KEYS.PHOTO_XP_DATE, today);
      localStorage.setItem(KEYS.PHOTO_XP_COUNT, '0');
    }

    const MAX_DAILY_PHOTO_SOLVES = 5; // max 5 XP awards per day = 150 XP max
    if (currentCount >= MAX_DAILY_PHOTO_SOLVES) {
      return {
        awarded: false,
        xpAdded: 0,
        message: `Daily Photo Solver XP limit reached (${MAX_DAILY_PHOTO_SOLVES * amount}/${MAX_DAILY_PHOTO_SOLVES * amount} XP). Unlimited AI solving is still active!`,
      };
    }

    // Duplicate check within 60s
    const normText = questionText.trim().toLowerCase().slice(0, 100);
    const lastHash = localStorage.getItem(KEYS.PHOTO_LAST_HASH);
    const lastHashTime = parseInt(localStorage.getItem('eduai_photo_last_time') || '0', 10);
    const now = Date.now();

    if (lastHash === normText && now - lastHashTime < 60000) {
      return {
        awarded: false,
        xpAdded: 0,
        message: 'Identical question re-submitted. XP awarded once per question.',
      };
    }

    // Award XP
    localStorage.setItem(KEYS.PHOTO_LAST_HASH, normText);
    localStorage.setItem('eduai_photo_last_time', now.toString());
    localStorage.setItem(KEYS.PHOTO_XP_COUNT, (currentCount + 1).toString());

    this.addXp(amount, `Solved Photo Problem: ${questionText.slice(0, 30)}...`);
    this.checkAndEvaluateAchievements();

    return {
      awarded: true,
      xpAdded: amount,
      message: `+${amount} XP Earned! (${currentCount + 1}/${MAX_DAILY_PHOTO_SOLVES} daily bonus solved)`,
    };
  },

  // 12. Favorite & Recently Opened Books
  getFavoriteBookIds(): string[] {
    try {
      const data = localStorage.getItem(KEYS.FAVORITE_BOOKS);
      return data ? JSON.parse(data) : ['bk-sci-10', 'bk-mth-10'];
    } catch {
      return ['bk-sci-10', 'bk-mth-10'];
    }
  },

  toggleFavoriteBook(bookId: string): string[] {
    const favorites = this.getFavoriteBookIds();
    const index = favorites.indexOf(bookId);
    let updated: string[];
    if (index >= 0) {
      updated = favorites.filter((id) => id !== bookId);
    } else {
      updated = [...favorites, bookId];
    }
    localStorage.setItem(KEYS.FAVORITE_BOOKS, JSON.stringify(updated));
    return updated;
  },

  getRecentlyOpenedBooks(): any[] {
    try {
      const data = localStorage.getItem(KEYS.RECENT_BOOKS);
      return data ? JSON.parse(data) : [
        {
          bookId: 'bk-sci-10',
          title: 'NCERT Science Class 10',
          board: 'CBSE',
          classLevel: '10',
          medium: 'English',
          subjectName: 'Science',
          author: 'NCERT Publications',
          openedAt: '10 mins ago',
          coverColor: 'from-purple-600 to-indigo-800',
          chapterCount: 16,
        },
        {
          bookId: 'bk-mth-10',
          title: 'NCERT Mathematics Class 10',
          board: 'CBSE',
          classLevel: '10',
          medium: 'English',
          subjectName: 'Mathematics',
          author: 'NCERT Publications',
          openedAt: '2 hours ago',
          coverColor: 'from-blue-600 to-cyan-800',
          chapterCount: 15,
        },
      ];
    } catch {
      return [];
    }
  },

  addRecentlyOpenedBook(item: {
    bookId: string;
    title: string;
    board: string;
    classLevel: string;
    medium: string;
    subjectName: string;
    author: string;
    coverColor?: string;
    chapterCount?: number;
  }): void {
    const list = this.getRecentlyOpenedBooks();
    const filtered = list.filter((b) => b.bookId !== item.bookId);
    filtered.unshift({
      ...item,
      openedAt: 'Just now',
    });
    localStorage.setItem(KEYS.RECENT_BOOKS, JSON.stringify(filtered.slice(0, 10)));
  },

  // Reset to seed demo data
  resetAllData(): void {
    invalidateCached();
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.WEAK_TOPICS);
    localStorage.removeItem(KEYS.STRONG_TOPICS);
    localStorage.removeItem(KEYS.ACHIEVEMENTS);
    localStorage.removeItem(KEYS.ACTIVITIES);
    localStorage.removeItem(KEYS.NOTES);
    localStorage.removeItem(KEYS.QUIZZES);
    localStorage.removeItem(KEYS.EXAMS);
    localStorage.removeItem(KEYS.STUDY_PLAN);
    localStorage.removeItem(KEYS.CONVERSATIONS);
    localStorage.removeItem(KEYS.ACTIVE_CONVERSATION_ID);
    localStorage.removeItem(KEYS.SUBJECT_MODE);
  },

  // 13. Data Backup & Restore Architecture
  exportAllDataJSON(): string {
    const backupObj = {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      appName: 'EduAI Master',
      profile: this.getProfile(),
      weakTopics: this.getWeakTopics(),
      strongTopics: this.getStrongTopics(),
      achievements: this.getAchievements(),
      activities: this.getActivities(),
      notes: this.getNotes(),
      quizzes: this.getSavedQuizzes(),
      exams: this.getSavedExams(),
      studyPlan: this.getStudyPlan(),
      scanHistory: this.getScanHistory(),
    };
    return JSON.stringify(backupObj, null, 2);
  },

  importDataJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Invalid JSON backup format.' };
      }

      if (parsed.profile) {
        localStorage.setItem(KEYS.PROFILE, JSON.stringify(parsed.profile));
      }
      if (Array.isArray(parsed.weakTopics)) {
        localStorage.setItem(KEYS.WEAK_TOPICS, JSON.stringify(parsed.weakTopics));
      }
      if (Array.isArray(parsed.strongTopics)) {
        localStorage.setItem(KEYS.STRONG_TOPICS, JSON.stringify(parsed.strongTopics));
      }
      if (Array.isArray(parsed.achievements)) {
        localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(parsed.achievements));
      }
      if (Array.isArray(parsed.activities)) {
        localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(parsed.activities));
      }
      if (Array.isArray(parsed.notes)) {
        localStorage.setItem(KEYS.NOTES, JSON.stringify(parsed.notes));
      }
      if (Array.isArray(parsed.quizzes)) {
        localStorage.setItem(KEYS.QUIZZES, JSON.stringify(parsed.quizzes));
      }
      if (Array.isArray(parsed.exams)) {
        localStorage.setItem(KEYS.EXAMS, JSON.stringify(parsed.exams));
      }
      if (parsed.studyPlan) {
        localStorage.setItem(KEYS.STUDY_PLAN, JSON.stringify(parsed.studyPlan));
      }
      if (Array.isArray(parsed.scanHistory)) {
        localStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(parsed.scanHistory));
      }

      return { success: true, message: 'All backup data successfully imported and restored!' };
    } catch (err: any) {
      return { success: false, message: `Failed to import JSON backup: ${err.message || 'Syntax error'}` };
    }
  },

  // Personal Learning System Storage
  getPersonalLearningData(): PersonalLearningSystemData | null {
    const raw = localStorage.getItem(KEYS.PERSONAL_RECOMMENDATIONS);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  savePersonalLearningData(data: PersonalLearningSystemData): void {
    localStorage.setItem(KEYS.PERSONAL_RECOMMENDATIONS, JSON.stringify(data));
  },

  getDismissedRecommendationIds(): string[] {
    const raw = localStorage.getItem(KEYS.DISMISSED_RECOMMENDATIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  },

  dismissRecommendation(id: string): void {
    const current = this.getDismissedRecommendationIds();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(KEYS.DISMISSED_RECOMMENDATIONS, JSON.stringify(current));
    }
  },

  getAcceptedRecommendationIds(): string[] {
    const raw = localStorage.getItem(KEYS.ACCEPTED_RECOMMENDATIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  },

  acceptRecommendation(id: string, item?: RecommendationItem): void {
    const current = this.getAcceptedRecommendationIds();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(KEYS.ACCEPTED_RECOMMENDATIONS, JSON.stringify(current));
    }

    // If an item is provided, add it to Study Plan tasks seamlessly!
    if (item) {
      const plan = this.getStudyPlan();
      const newTask: StudyTask = {
        id: `task-rec-${Date.now()}`,
        title: item.title,
        subjectName: item.subject,
        topicName: item.chapterTopic || item.subtitle,
        taskType: item.type === 'practice_quiz' ? 'Quiz' : item.type === 'exam_prep' ? 'Exam Practice' : 'Revision',
        priority: item.priority === 'High' ? 'High' : item.priority === 'Medium' ? 'Medium' : 'Low',
        estimatedMinutes: item.estimatedMinutes || 20,
        completed: false,
        dueDate: 'Today',
      };
      plan.tasks.unshift(newTask);
      this.saveStudyPlan(plan);

      // Log activity
      this.logActivity({
        type: 'study',
        title: `Added Recommendation: ${item.title}`,
        subject: item.subject,
        durationMinutes: item.estimatedMinutes || 15,
        xpEarned: 10,
      });
    }
  },
};

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-sample-1',
    title: 'Photosynthesis in Plants',
    subjectMode: 'science',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    studentContext: {
      classLevel: '10',
      board: 'CBSE',
      subject: 'Science',
      chapter: 'Life Processes',
      topic: 'Photosynthesis',
      language: 'en',
    },
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Can you explain photosynthesis in simple words?',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 'msg-2',
        sender: 'ai',
        text: `### 🌿 Understanding Photosynthesis (Class 10 Science)

Hello! I am your AI Learning Assistant. Let us break down **Photosynthesis** into easy, logical steps!

---

#### 1. Core Concept Overview
Photosynthesis is the fundamental biological process by which green plants manufacture their own food (glucose) using **sunlight**, **water**, and **carbon dioxide**.

---

#### 2. Chemical Equation
$$6CO_2 + 12H_2O \\xrightarrow[Chlorophyll]{Sunlight} C_6H_{12}O_6 + 6O_2 + 6H_2O$$

---

#### 3. Step-by-Step Mechanism
1. **Absorption of Light Energy**: Chlorophyll present in green leaves traps solar radiation.
2. **Conversion & Splitting**: Solar energy is converted into chemical energy, splitting water molecules ($H_2O$) into Hydrogen and Oxygen ($O_2$).
3. **Reduction of $CO_2$**: Carbon dioxide is reduced to form Carbohydrate (Glucose $C_6H_{12}O_6$).

---

#### 4. Key Takeaways for Exams
* **Primary Site**: Chloroplasts inside mesophyll cells of leaves.
* **By-Product**: Oxygen gas released through **Stomata**.

*Would you like me to create a quick 3-question quiz on this chapter or summarize stomatal opening & closing?*`,
        timestamp: new Date(Date.now() - 3590000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'complete',
      },
    ],
  },
];

