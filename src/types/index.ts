import { LanguageCode } from '../i18n/translations';

export * from './smartRevision';
export * from './notifications';

export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

export type NavigationSection =
  | 'home'
  | 'learning-coach'
  | 'personal-learning'
  | 'smart-revision'
  | 'ask-ai'
  | 'photo-solver'
  | 'notes'
  | 'books'
  | 'quiz'
  | 'exam-mode'
  | 'paper-generator'
  | 'study-planner'
  | 'weak-topics'
  | 'progress'
  | 'achievements'
  | 'parent-dashboard'
  | 'teacher-dashboard'
  | 'admin-dashboard'
  | 'profile'
  | 'settings'
  | 'notifications';

export type ClassLevel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

export type BoardType = 'CBSE' | 'ICSE' | 'State Boards' | 'Other';

export type MediumType = 'English' | 'Hindi' | 'Hinglish' | 'Other';

export interface StudentProfile {
  name: string;
  classLevel: ClassLevel;
  board: BoardType;
  medium: MediumType;
  preferredLanguage: LanguageCode;
  selectedSubjects: string[];
  learningGoals: string[];
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  completedLessonsCount: number;
  quizzesTaken: number;
  examsCompleted: number;
  avgScorePercentage: number;
  dailyXpGoal: number;
  avatarUrl: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  iconName: string;
  color: string;
  classLevels: ClassLevel[];
  books: Book[];
}

export interface Book {
  id: string;
  title: string;
  subjectId: string;
  subjectName?: string;
  board?: BoardType | string;
  classLevel?: ClassLevel;
  medium?: MediumType | string;
  author?: string;
  publisher?: string;
  academicYear?: string;
  coverColor?: string;
  coverPattern?: string;
  description?: string;
  editionBadge?: string;
  licenseInfo?: string;
  chapters: Chapter[];
  isFavorite?: boolean;
}

export interface RecentlyOpenedBook {
  bookId: string;
  title: string;
  board: string;
  classLevel: ClassLevel;
  medium: string;
  subjectName: string;
  author: string;
  openedAt: string;
  coverColor?: string;
  chapterCount?: number;
}

export interface Chapter {
  id: string;
  bookId: string;
  number: number;
  title: string;
  description: string;
  topics: Topic[];
  isCompleted?: boolean;
}

export interface Topic {
  id: string;
  chapterId: string;
  title: string;
  summary: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  keyConcepts?: string[];
  status?: 'published' | 'draft';
  lessons: Lesson[];
  masteryLevel: number; // 0 to 100
}

export interface Lesson {
  id: string;
  topicId: string;
  title: string;
  contentType: 'text' | 'ai-explained' | 'video-summary' | 'interactive';
  contentMarkdown: string;
  estimatedMinutes: number;
  isCompleted: boolean;
}

export type QuestionType = 'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer';

export interface QuizQuestion {
  id: string;
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  explanation: string;
  hint?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  topic?: string;
  questionType?: QuestionType;
  userSelectedIndex?: number;
  userTypedAnswer?: string;
}

export interface Quiz {
  id: string;
  title: string;
  subjectId: string;
  chapterName: string;
  topicName?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount?: number;
  language?: string;
  sourceType?: 'topic' | 'note' | 'photo';
  sourceTitle?: string;
  questions: QuizQuestion[];
  timeLimitSeconds?: number;
  rewardXp: number;
  createdDate: string;
  score?: number;
  isCompleted?: boolean;
  attemptCount?: number;
  bestScore?: number;
  accuracyPercentage?: number;
  timeTakenSeconds?: number;
  userAnswersRecord?: Record<number, { selectedIndex?: number; typedAnswer?: string; isCorrect: boolean; flagged?: boolean }>;
}

export interface ExamQuestion {
  id: string;
  section: string;
  type: 'mcq' | 'subjective';
  marks: number;
  question: string;
  options?: string[];
  correctAnswer?: string;
  sampleAnswer?: string;
  explanation: string;
  userAnswer?: string;
}

export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  board: BoardType;
  classLevel: ClassLevel;
  durationMinutes: number;
  totalMarks: number;
  instructions: string[];
  questions: ExamQuestion[];
  passingMarks: number;
  rewardXp: number;
  isSubmitted?: boolean;
  scoreEarned?: number;
  submittedAt?: string;
  timeSpentSeconds?: number;
  correctCount?: number;
  wrongCount?: number;
  unansweredCount?: number;
  accuracyPercentage?: number;
  chapterTopics?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  attemptCount?: number;
  bestScore?: number;
}

export interface ExamDateItem {
  id: string;
  subject: string;
  title: string;
  examDate: string;
}

export interface StudyTask {
  id: string;
  title: string;
  subjectName: string;
  topicName?: string;
  startTime?: string;
  dueDate: string;
  estimatedMinutes: number;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
  taskType: 'Lesson' | 'Quiz' | 'Revision' | 'Exam Practice' | 'Weak Topic Fix';
  dayOfWeek?: 'Today' | 'Tomorrow' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  completedAt?: string;
}

export interface StudyPlan {
  id: string;
  classLevel?: ClassLevel;
  selectedSubjects?: string[];
  availableHoursPerDay?: number;
  preferredTimeSlot?: string;
  examDates?: ExamDateItem[];
  personalGoals?: string[];
  dailyLearningTarget?: string;
  language?: 'en' | 'hi';
  startDate: string;
  targetExamDate: string;
  weeklyGoalHours: number;
  tasks: StudyTask[];
  aiAdviceNote?: string;
  updatedAt?: string;
}

export interface WeakTopic {
  id: string;
  subjectName: string;
  chapterName: string;
  topicName: string;
  accuracyRate: number; // e.g. 40%
  lastPracticed: string;
  recommendedAction: string;
  urgency: 'Critical' | 'Moderate' | 'Low';
  difficultyLevel?: 'Easy' | 'Medium' | 'Hard';
  recentPerformance?: string;
  improvementPercentage?: number;
  wrongAnswersCount?: number;
  attemptsCount?: number;
}

export interface StrongTopic {
  id: string;
  subjectName: string;
  chapterName: string;
  topicName: string;
  accuracyRate: number; // e.g. 92%
  masteryLevel: 'Mastered' | 'Strong' | 'Good';
  lastPracticed: string;
  testsTakenCount: number;
}

export interface RecommendedTopic {
  id: string;
  subjectName: string;
  chapterName: string;
  topicName: string;
  reason: string;
  importance: 'High Weightage' | 'Prerequisite' | 'Next Step';
  estimatedMinutes: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progressCurrent: number;
  progressTarget: number;
  rewardXp: number;
  category: 'Streak' | 'Quiz' | 'Notes' | 'Exam' | 'Solver' | 'Planner' | 'General';
  badgeRarity?: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  milestoneTitle?: string;
  unlockDate?: string;
}

export interface LevelMilestone {
  level: number;
  title: string;
  requiredXp: number;
  rewardTitle: string;
  rewardXpBonus: number;
  unlocked: boolean;
  claimed: boolean;
  perks: string[];
}

export interface ActivityLog {
  id: string;
  title: string;
  type: 'quiz' | 'note' | 'ask-ai' | 'photo-solver' | 'exam' | 'lesson';
  timestamp: string;
  xpEarned: number;
  details: string;
}

export interface SavedNote {
  id: string;
  title: string;
  subjectName: string;
  chapterName: string;
  topicName?: string;
  classLevel?: ClassLevel;
  language?: 'en' | 'hi';
  contentMarkdown: string;
  createdAt: string;
  tags: string[];
  isAiGenerated: boolean;
  sourceType?: 'topic' | 'photo' | 'conversation';
  isFavorite?: boolean;
  quickRevisionPoints?: string[];
}

export type SubjectTeacherMode =
  | 'general'
  | 'maths'
  | 'science'
  | 'english'
  | 'sst'
  | 'hindi'
  | 'sanskrit';

export interface ExtractedQuestion {
  id: string;
  questionNumber?: string;
  extractedText: string;
  subject?: string;
  topic?: string;
}

export interface PhotoAnalysisResult {
  detectedSubject: string;
  hasDiagram: boolean;
  diagramDescription?: string | null;
  questions: ExtractedQuestion[];
  rawOcrText?: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  questionText: string;
  solutionText: string;
  subject: string;
  hasDiagram?: boolean;
  thumbnailBase64?: string | null;
  language: 'en' | 'hi';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  status?: 'sending' | 'streaming' | 'complete' | 'error';
  isFallback?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  subjectMode: SubjectTeacherMode;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  studentContext?: {
    classLevel?: string;
    board?: string;
    medium?: string;
    subject?: string;
    book?: string;
    chapter?: string;
    topic?: string;
    language?: string;
  };
}

export interface QuestionPaperQuestion {
  id: string;
  questionNumber: number;
  section: string; // e.g. "Section A", "Section B"
  type: 'mcq' | 'vsa' | 'sa' | 'la' | 'case_study' | 'numerical';
  typeLabel: string; // e.g. "Multiple Choice Question", "Very Short Answer", "Short Answer", "Long Answer", "Case-Based", "Numerical Problem"
  marks: number;
  question: string;
  options?: string[];
  correctOptionIndex?: number;
  answerKey: string;
  markingScheme: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  chapterTopic?: string;
  userAnswer?: string;
}

export interface QuestionPaper {
  id: string;
  title: string;
  board: BoardType;
  classLevel: ClassLevel;
  subject: string;
  bookName: string;
  chapterTopic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  language: 'English' | 'Hindi';
  createdAt: string;
  instructions: string[];
  difficultyDistribution: {
    easyPercentage: number;
    mediumPercentage: number;
    hardPercentage: number;
  };
  questions: QuestionPaperQuestion[];
  isSaved?: boolean;
}

export type RecommendationType =
  | 'next_study'
  | 'topic_revision'
  | 'practice_quiz'
  | 'revision_note'
  | 'exam_prep'
  | 'daily_goal';

export interface RecommendationItem {
  id: string;
  type: RecommendationType;
  title: string;
  subtitle: string;
  subject: string;
  chapterTopic: string;
  recommendedDifficulty: 'Easy' | 'Medium' | 'Hard';
  reason: string; // Explainability linking to real app data
  dataTrigger: string; // e.g. "Low Quiz Score: 42%", "High Board Weightage", "Weak Topic Flagged"
  actionType: 'navigate_quiz' | 'navigate_notes' | 'navigate_exam' | 'navigate_books' | 'navigate_ask_ai' | 'navigate_paper';
  actionPayload?: {
    subject?: string;
    chapter?: string;
    topic?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    questionCount?: number;
    prompt?: string;
  };
  actionLabel: string;
  estimatedMinutes: number;
  priority: 'High' | 'Medium' | 'Low';
  xpReward: number;
  isAccepted?: boolean;
  isDismissed?: boolean;
}

export interface PersonalLearningSystemData {
  overviewSummary: string;
  performanceInsight: string;
  readinessScore: number; // 0-100
  todaysFocus: RecommendationItem[];
  topicsToRevise: RecommendationItem[];
  recommendedPractice: RecommendationItem[];
  examPreparation: RecommendationItem[];
  dailyGoals: RecommendationItem[];
  generatedAt: string;
  isAiGenerated?: boolean;
}

export type TopicMasteryStatus = 'Beginner' | 'Learning' | 'Practicing' | 'Strong';

export type AdaptiveDifficultyLevel =
  | 'Level 1 - Foundation'
  | 'Level 2 - Standard'
  | 'Level 3 - Advanced'
  | 'Level 4 - HOTS / Application';

export interface AdaptiveTopic {
  id: string;
  subjectName: string;
  chapterName: string;
  topicName: string;
  status: TopicMasteryStatus;
  masteryPercentage: number; // 0 - 100
  currentDifficulty: AdaptiveDifficultyLevel;
  attemptsCount: number;
  accuracyRate: number;
  recentMistakes: string[];
  keyFormulas?: string[];
  simpleExplanation?: string;
  easyExample?: {
    question: string;
    stepByStepSolution: string;
    keyTakeaway: string;
  };
  isCurrent: boolean;
  isNextRecommended: boolean;
  recommendedAction: string;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  lastAssessedAt: string;
}

export interface AdaptiveLearningPath {
  studentClass: ClassLevel;
  selectedSubject: string;
  availableSubjects: string[];
  overallMasteryPercentage: number;
  currentTopic: AdaptiveTopic;
  recommendedNextTopic: AdaptiveTopic;
  topics: AdaptiveTopic[];
  strugglingTopicsCount: number;
  strongTopicsCount: number;
  activeDifficultyTier: AdaptiveDifficultyLevel;
  learningGoals: string[];
  generatedAt: string;
  recentAssessmentInsight: string;
}

export interface AdaptiveQuestionPayload {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'HOTS';
  difficultyTier: AdaptiveDifficultyLevel;
  topic: string;
  subject: string;
  hints: string[];
  isApplicationBased?: boolean;
  realWorldScenario?: string;
  guidedStepPrompt?: string;
  simpleConceptBreakdown?: string;
  easyExample?: {
    question: string;
    stepByStepSolution: string;
    keyTakeaway: string;
  };
}

export type SmartPracticeMode =
  | 'daily'
  | 'adaptive'
  | 'revision'
  | 'mistake_fix'
  | 'weak_topic'
  | 'concept'
  | 'mixed'
  | 'quick_5';

export interface SmartPracticeQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'HOTS';
  difficultyTier: AdaptiveDifficultyLevel;
  subject: string;
  chapter: string;
  topic: string;
  hints: string[];
  practiceMode: SmartPracticeMode;
  isApplicationBased?: boolean;
  realWorldScenario?: string;
  guidedStepPrompt?: string;
  simpleConceptBreakdown?: string;
  easyExample?: {
    question: string;
    stepByStepSolution: string;
    keyTakeaway: string;
  };
  relatedMistakeContext?: string;
  dedupHash?: string;
}

export interface SmartPracticeTopicDelta {
  topicName: string;
  chapterName: string;
  subjectName: string;
  previousMastery: number;
  newMastery: number;
  delta: number;
  status: TopicMasteryStatus;
}

export interface SmartPracticeTopicRevisionNeeded {
  topicName: string;
  chapterName: string;
  subjectName: string;
  currentAccuracy: number;
  mistakeHighlight: string;
  recommendedResource: 'notes' | 'quiz' | 'ask-ai' | 'photo-solver' | 'exam';
}

export interface SmartPracticeRecommendation {
  title: string;
  subtitle: string;
  mode: SmartPracticeMode;
  subject: string;
  topic: string;
  reason: string;
  actionType: 'start_practice' | 'navigate_notes' | 'navigate_quiz' | 'navigate_ask_ai' | 'navigate_exam' | 'navigate_photo' | 'navigate_planner';
  actionPayload?: Record<string, any>;
  actionLabel: string;
  estimatedMinutes: number;
  xpReward: number;
}

export interface SmartPracticeSessionSummary {
  id: string;
  mode: SmartPracticeMode;
  modeTitle: string;
  subject: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  accuracyPercentage: number;
  timeTakenSeconds: number;
  xpEarned: number;
  dailyXpCapReached: boolean;
  topicsImproved: SmartPracticeTopicDelta[];
  topicsNeedingRevision: SmartPracticeTopicRevisionNeeded[];
  recommendedNextPractice: SmartPracticeRecommendation;
  completedAt: string;
  questionHistory?: Array<{
    questionText: string;
    isCorrect: boolean;
    userSelected: string;
    correctAnswer: string;
    topic: string;
    difficultyTier: AdaptiveDifficultyLevel;
  }>;
}

// Cloud Sync Types
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'idle';

export interface SyncCategoryItem {
  key: string;
  label: string;
  count: number;
  lastSynced: string;
  status: 'synced' | 'pending' | 'conflict_resolved' | 'error';
  icon: string;
  description: string;
}

export interface SyncMetadata {
  userId: string;
  deviceId: string;
  clientVersion: string;
  lastSyncedAt: string;
  devicePlatform: string;
  syncedCollections: string[];
  conflictCount: number;
}

export interface CloudSyncState {
  status: SyncStatus;
  isOnline: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  pendingCount: number;
  categories: Record<string, SyncCategoryItem>;
  deviceId: string;
  authenticatedUser: { uid: string; email: string; displayName: string } | null;
  autoSyncEnabled: boolean;
}

// Admin Dashboard Types
export type AdminTab =
  | 'dashboard'
  | 'users'
  | 'curriculum'
  | 'books'
  | 'questions'
  | 'quizzes'
  | 'exams'
  | 'reports'
  | 'backups'
  | 'security'
  | 'settings';

export interface AdminSystemStats {
  totalUsers: number;
  studentsCount: number;
  parentsCount: number;
  teachersCount: number;
  adminsCount: number;
  activeUsersOnline: number;
  totalClasses: number;
  totalSubjects: number;
  totalBooks: number;
  totalQuizzesGenerated: number;
  totalExamsSimulated: number;
  totalAiQueries: number;
  totalAiTokensEstimated: number;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'maintenance';
    uptimePercentage: number;
    avgLatencyMs: number;
    storageUsedMb: number;
    errorRatePercentage: number;
  };
}

export interface AdminUserRecord {
  uid: string;
  displayName: string;
  emailMasked: string;
  role: UserRole;
  classGrade?: string;
  board?: string;
  status: 'online' | 'active' | 'idle' | 'suspended';
  lastActive: string;
  createdAt: string;
  xpEarned?: number;
  quizzesTaken?: number;
  questionsSolved?: number;
  isVerified: boolean;
}

export interface AdminCurriculumRecord {
  id: string;
  classLevel: ClassLevel;
  board: string;
  subjectName: string;
  subjectCode: string;
  chaptersCount: number;
  topicsCount: number;
  status: 'active' | 'draft' | 'archived';
  lastUpdated: string;
  difficultyRating: 'Foundation' | 'Standard' | 'Advanced';
}

export interface AdminQuestionRecord {
  id: string;
  question: string;
  subject: string;
  classLevel: ClassLevel;
  topic: string;
  type: 'mcq' | 'short_answer' | 'long_answer' | 'assertion_reason';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  verifiedByAdmin: boolean;
  usageCount: number;
  createdAt: string;
}

export interface AdminQuizRecord {
  id: string;
  title: string;
  subject: string;
  classLevel: ClassLevel;
  totalQuestions: number;
  totalAttempts: number;
  avgScorePercentage: number;
  createdBy: 'AI Generator' | 'Teacher' | 'Admin System';
  createdAt: string;
  status: 'published' | 'draft' | 'archived';
}

export interface AdminExamRecord {
  id: string;
  title: string;
  subject: string;
  classLevel: ClassLevel;
  board: string;
  totalMarks: number;
  durationMinutes: number;
  totalAttempts: number;
  avgScorePercentage: number;
  topScorePercentage: number;
  createdAt: string;
  status: 'active' | 'scheduled' | 'archived';
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  category: 'auth' | 'curriculum' | 'user_management' | 'security' | 'system';
  details: string;
  status: 'success' | 'warning' | 'error';
}

export interface AdminAiUsageDayStat {
  date: string;
  askAiQueries: number;
  photoScans: number;
  quizGenerations: number;
  examGenerations: number;
  tokensKilo: number;
  avgLatencyMs: number;
}

// ==========================================
// CONTENT MANAGEMENT SYSTEM (CMS) HIERARCHY
// Hierarchy: Session -> Board -> Class -> Medium -> Subject -> Book -> Chapter -> Topic -> Lesson
// ==========================================

export type HierarchyLevel =
  | 'session'
  | 'board'
  | 'class'
  | 'medium'
  | 'subject'
  | 'book'
  | 'chapter'
  | 'topic'
  | 'lesson'
  | 'question'
  | 'quiz'
  | 'exam';

export interface AcademicSession {
  id: string;
  name: string; // e.g., "2026–2027"
  academicYear: string; // e.g. "2026-2027"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'active' | 'upcoming' | 'archived';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumBoard {
  id: string;
  sessionId?: string;
  name: string; // e.g. "CBSE - Central Board of Secondary Education"
  code: string; // e.g. "CBSE"
  country: string;
  status: 'active' | 'draft' | 'archived';
  description?: string;
  websiteUrl?: string;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumClass {
  id: string;
  boardId: string;
  sessionId?: string;
  classLevel: ClassLevel; // '1' - '12'
  name: string; // "Class 10"
  stage: 'Primary' | 'Middle' | 'Secondary' | 'Senior Secondary';
  status: 'active' | 'draft' | 'archived';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumMedium {
  id: string;
  name: string; // "English" | "Hindi" | "Hinglish" | "Other"
  code: string; // "EN", "HI", "HIN"
  status: 'active' | 'draft';
  description?: string;
}

export interface CurriculumSubject {
  id: string;
  boardId: string;
  sessionId?: string;
  classLevel: ClassLevel;
  medium: string;
  name: string; // e.g. "Science", "Mathematics"
  code: string; // e.g. "086"
  category: 'Core' | 'Elective' | 'Language' | 'Vocational';
  description?: string;
  iconName?: string;
  color?: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumBook {
  id: string;
  sessionId?: string;
  boardId: string;
  classLevel: ClassLevel;
  medium: string;
  subjectId: string;
  subjectName: string;
  title: string;
  author: string;
  publisher: string;
  editionBadge?: string;
  description?: string;
  licenseInfo: string; // e.g. "NCERT Open Educational Resource (OER) - CC BY-NC 4.0"
  isAuthorized: boolean; // Legal compliance confirmation
  copyrightDisclaimer?: string;
  chapters: Chapter[];
  status: 'published' | 'draft' | 'archived';
  coverGradient?: string;
  totalPages?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumChapter {
  id: string;
  bookId: string;
  number: number;
  title: string;
  description: string;
  estimatedHours?: number;
  topics: Topic[];
  status: 'published' | 'draft';
  createdAt?: string;
  updatedAt?: string;
}

export interface CurriculumTopic {
  id: string;
  chapterId: string;
  title: string;
  summary: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  keyConcepts?: string[];
  lessons: Lesson[];
  masteryLevel?: number;
  status: 'published' | 'draft';
  createdAt?: string;
  updatedAt?: string;
}

export interface CurriculumLesson {
  id: string;
  topicId: string;
  title: string;
  contentType: 'text' | 'ai-explained' | 'video-summary' | 'interactive';
  contentMarkdown: string;
  estimatedMinutes: number;
  author?: string;
  status: 'published' | 'draft';
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
  warnings?: { field: string; message: string }[];
}

export interface ContentExportData {
  version: string;
  exportedAt: string;
  licenseNotice: string;
  sessions: AcademicSession[];
  boards: CurriculumBoard[];
  classes: CurriculumClass[];
  mediums: CurriculumMedium[];
  subjects: CurriculumSubject[];
  books: CurriculumBook[];
  questions: AdminQuestionRecord[];
  quizzes: AdminQuizRecord[];
  exams: AdminExamRecord[];
}

// -------------------------------------------------------------
// Database Backup System Types (Step 22)
// -------------------------------------------------------------

export type BackupScheduleFrequency = 'hourly' | 'every_6_hours' | 'daily' | 'weekly' | 'manual_only';

export type BackupTriggerType = 'manual' | 'scheduled' | 'pre_update' | 'system_checkpoint';

export type BackupVerificationStatus = 'verified' | 'failed' | 'unverified' | 'warning';

export interface BackupContentCounts {
  profiles: number;
  notes: number;
  conversations: number;
  chatMessages: number;
  quizzes: number;
  exams: number;
  studyPlans: number;
  weakTopics: number;
  strongTopics: number;
  achievements: number;
  milestones: number;
  scanHistory: number;
  questionsSolved: number;
  curriculumSessions: number;
  curriculumBoards: number;
  curriculumClasses: number;
  curriculumMediums: number;
  curriculumSubjects: number;
  curriculumBooks: number;
  curriculumChapters: number;
  curriculumTopics: number;
  curriculumLessons: number;
  adminQuestions: number;
  adminQuizzes: number;
  adminExams: number;
  adminAuditLogs: number;
  totalRecords: number;
}

export interface BackupVerificationReport {
  isValid: boolean;
  checkedAt: string;
  credentialsStripped: boolean;
  schemaValid: boolean;
  checksumMatched: boolean;
  totalRecordsCount: number;
  errors: string[];
  warnings: string[];
  summaryMessage: string;
}

export interface BackupMetadata {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  trigger: BackupTriggerType;
  version: string;
  sizeBytes: number;
  sizeFormatted: string;
  checksum: string;
  verificationStatus: BackupVerificationStatus;
  verificationReport?: BackupVerificationReport;
  counts: BackupContentCounts;
  createdBy: string;
  storageKey?: string;
}

export interface BackupSnapshotPayload {
  version: string;
  exportFormat: 'EDUAI-SECURE-BACKUP-V2';
  metadata: BackupMetadata;
  sanitizedAt: string;
  data: {
    profile: StudentProfile;
    users?: AdminUserRecord[];
    notes: SavedNote[];
    conversations: Conversation[];
    quizzes: Quiz[];
    exams: Exam[];
    studyPlan: StudyPlan;
    weakTopics: WeakTopic[];
    strongTopics: StrongTopic[];
    achievements: Achievement[];
    milestones: LevelMilestone[];
    scanHistory: ScanHistoryItem[];
    questionsSolved: number;
    activities: ActivityLog[];
    curriculum: {
      sessions: AcademicSession[];
      boards: CurriculumBoard[];
      classes: CurriculumClass[];
      mediums: CurriculumMedium[];
      subjects: CurriculumSubject[];
      books: CurriculumBook[];
    };
    admin: {
      questions: AdminQuestionRecord[];
      quizzes: AdminQuizRecord[];
      exams: AdminExamRecord[];
      auditLogs: AdminAuditLog[];
    };
  };
}

export interface BackupScheduleConfig {
  enabled: boolean;
  frequency: BackupScheduleFrequency;
  lastAutoBackupAt: string | null;
  nextScheduledBackupAt: string | null;
  retentionCount: number; // max backups to retain, e.g. 10
  autoVerifyAfterBackup: boolean;
  autoDownloadAfterBackup: boolean;
}

export interface BackupSystemStatus {
  lastBackupAt: string | null;
  lastBackupStatus: BackupVerificationStatus | 'none';
  totalBackupsCount: number;
  totalStorageSizeBytes: number;
  totalStorageSizeFormatted: string;
  isScheduleRunning: boolean;
  nextScheduledAt: string | null;
  healthScore: number; // 0 to 100
  securityNotice: string;
}

// -------------------------------------------------------------
// Secure Disaster Recovery & State Restoration Types (Step 22 Extension)
// -------------------------------------------------------------

export interface RestorePreviewDiffItem {
  entityKey: string;
  label: string;
  category: 'user_data' | 'curriculum' | 'admin_content';
  currentCount: number;
  backupCount: number;
  projectedCount: number;
  additionsCount: number;
  overwritesCount: number;
  retainedCount: number;
  status: 'increased' | 'decreased' | 'unchanged' | 'overwritten';
  sampleRecords?: { id: string; title: string; action: 'insert' | 'overwrite' | 'preserve' }[];
}

export interface RestorePreviewAnalysis {
  backupId: string;
  backupTitle: string;
  analyzedAt: string;
  strategy: 'merge' | 'overwrite';
  items: RestorePreviewDiffItem[];
  totalCurrentRecords: number;
  totalBackupRecords: number;
  totalProjectedRecords: number;
  netChange: number;
  potentialDataLossRisk: 'none' | 'low' | 'moderate' | 'high';
  riskWarnings: string[];
  isEligibleForRestore: boolean;
  preRestoreSafetySnapshotRequired: boolean;
}

export interface PostRestoreValidationCheck {
  id: string;
  name: string;
  category: 'schema' | 'integrity' | 'relations' | 'security';
  passed: boolean;
  details: string;
  countVerified?: number;
}

export interface PostRestoreValidationReport {
  status: 'healthy' | 'warning' | 'failed';
  validatedAt: string;
  checks: PostRestoreValidationCheck[];
  totalRecordsVerified: number;
  missingRelationsDetected: number;
  corruptedEntitiesQuarantined: number;
  summary: string;
}

export interface RecoveryLogRecord {
  id: string;
  timestamp: string;
  backupId: string;
  backupTitle: string;
  initiatedBy: string;
  strategy: 'merge' | 'overwrite';
  partitions: {
    userData: boolean;
    curriculum: boolean;
    adminContent: boolean;
  };
  preRestoreSafetySnapshotId: string;
  status: 'success' | 'failed' | 'rolled_back';
  restoredCounts: Partial<BackupContentCounts>;
  durationMs: number;
  errorMessage?: string;
  validationReport: PostRestoreValidationReport;
  rollbackOccurred?: boolean;
}







