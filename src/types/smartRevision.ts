import { NavigationSection, ClassLevel, BoardType } from './index';

export type SmartRevisionMode =
  | 'quick'
  | 'chapter'
  | 'weak_topic'
  | 'exam'
  | 'mistake'
  | 'daily'
  | 'custom';

export interface RevisionDefinition {
  id: string;
  term: string;
  definition: string;
  keyKeywords?: string[];
  example?: string;
}

export interface RevisionFormula {
  id: string;
  name: string;
  formula: string;
  variablesExplanation?: string;
  whenToUse?: string;
  commonMistakeAlert?: string;
}

export interface RevisionShortExplanation {
  id: string;
  concept: string;
  explanation: string;
  examTip?: string;
  mnemonicsOrAnalogy?: string;
}

export interface RevisionFlashcard {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  formulaRef?: string;
  topic?: string;
  isLearned?: boolean;
  userConfidence?: 'low' | 'medium' | 'high';
}

export interface RevisionQuickMcq {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  userSelectedIndex?: number;
  isCorrect?: boolean;
  isLearned?: boolean;
}

export interface RevisionPracticeQuestion {
  id: string;
  question: string;
  sampleAnswer: string;
  keyPointsToInclude: string[];
  marks: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface SmartRevisionSheet {
  id: string;
  title: string;
  subtitle: string;
  mode: SmartRevisionMode;
  subject: string;
  chapter: string;
  topic?: string;
  classLevel: ClassLevel;
  board: BoardType;
  summary: string;
  keyPoints: string[];
  definitions: RevisionDefinition[];
  formulas: RevisionFormula[];
  shortExplanations: RevisionShortExplanation[];
  flashcards: RevisionFlashcard[];
  quickMcqs: RevisionQuickMcq[];
  practiceQuestions: RevisionPracticeQuestion[];
  estimatedMinutes: number;
  rewardXp: number;
  masteryScore: number; // 0 - 100
  spacedRepetitionStage: number; // 1 (1 day), 2 (3 days), 3 (7 days), 4 (14 days), 5 (30 days)
  lastRevisedAt?: string;
  nextRecommendedRevisionDate?: string;
  createdAt: string;
  isSaved?: boolean;
}

export interface SmartRevisionSessionSummary {
  id: string;
  sheetId: string;
  title: string;
  mode: SmartRevisionMode;
  subject: string;
  chapter: string;
  topic?: string;
  cardsReviewedCount: number;
  cardsLearnedCount: number;
  mcqsAnsweredCount: number;
  mcqsCorrectCount: number;
  timeSpentSeconds: number;
  xpEarned: number;
  dailyXpCapped: boolean;
  previousMastery: number;
  newMastery: number;
  weakTopicUpdated?: boolean;
  weakTopicResolved?: boolean;
  weakTopicDelta?: {
    topicName: string;
    previousAccuracy: number;
    newAccuracy: number;
  };
  studyTaskCompleted?: {
    taskId: string;
    title: string;
  };
  nextRevisionRecommendation: {
    recommendedDate: string;
    daysFromNow: number;
    spacedRepetitionStage: number;
    reason: string;
    focusArea: string;
  };
  completedAt: string;
}

export interface RevisionHistoryItem {
  id: string;
  sheetId: string;
  title: string;
  mode: SmartRevisionMode;
  subject: string;
  chapter: string;
  completedAt: string;
  cardsLearnedCount: number;
  mcqsAccuracy: number;
  masteryScore: number;
  xpEarned: number;
  nextDueDate: string;
  isDue: boolean;
}
