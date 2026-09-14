import {
  SmartRevisionSheet,
  SmartRevisionMode,
  SmartRevisionSessionSummary,
  RevisionHistoryItem,
  RevisionDefinition,
  RevisionFormula,
  RevisionShortExplanation,
  RevisionFlashcard,
  RevisionQuickMcq,
  RevisionPracticeQuestion,
  StudentProfile,
  SavedNote,
  WeakTopic,
  StudyTask,
  Quiz,
  ClassLevel,
  BoardType,
} from '../types';
import { StorageService } from './storageService';

const STORAGE_KEYS = {
  REVISION_SHEETS: 'eduai_smart_revision_sheets',
  REVISION_HISTORY: 'eduai_smart_revision_history',
  DAILY_REVISION_XP_DATE: 'eduai_revision_xp_date',
  DAILY_REVISION_XP_AMOUNT: 'eduai_revision_xp_amount',
  SPACED_REPETITION_ITEMS: 'eduai_spaced_repetition_queue',
};

export class SmartRevisionService {
  // 1. Get Saved Revision Sheets
  static getSavedSheets(): SmartRevisionSheet[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVISION_SHEETS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveSheet(sheet: SmartRevisionSheet): void {
    try {
      const sheets = this.getSavedSheets();
      const existingIdx = sheets.findIndex((s) => s.id === sheet.id);
      if (existingIdx >= 0) {
        sheets[existingIdx] = sheet;
      } else {
        sheets.unshift(sheet);
      }
      localStorage.setItem(STORAGE_KEYS.REVISION_SHEETS, JSON.stringify(sheets.slice(0, 30)));
    } catch (e) {
      console.error('Failed to save revision sheet:', e);
    }
  }

  static deleteSheet(sheetId: string): void {
    try {
      const sheets = this.getSavedSheets().filter((s) => s.id !== sheetId);
      localStorage.setItem(STORAGE_KEYS.REVISION_SHEETS, JSON.stringify(sheets));
    } catch (e) {
      console.error('Failed to delete revision sheet:', e);
    }
  }

  // 2. Get Revision History
  static getHistory(): RevisionHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVISION_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addHistoryItem(item: RevisionHistoryItem): void {
    try {
      const history = this.getHistory();
      history.unshift(item);
      localStorage.setItem(STORAGE_KEYS.REVISION_HISTORY, JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.error('Failed to record revision history:', e);
    }
  }

  // 3. Spaced Repetition Due Queue
  static getDueRevisionSheets(): { sheet: SmartRevisionSheet; daysOverdue: number; stage: number }[] {
    const sheets = this.getSavedSheets();
    const now = new Date().getTime();
    const dueList: { sheet: SmartRevisionSheet; daysOverdue: number; stage: number }[] = [];

    sheets.forEach((sheet) => {
      if (sheet.nextRecommendedRevisionDate) {
        const dueDate = new Date(sheet.nextRecommendedRevisionDate).getTime();
        const diffDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          dueList.push({
            sheet,
            daysOverdue: diffDays,
            stage: sheet.spacedRepetitionStage || 1,
          });
        }
      }
    });

    return dueList.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  // 4. Anti-XP Farming & XP Rate Limiting
  static calculateRevisionXp(
    cardsReviewed: number,
    cardsLearned: number,
    mcqsCorrect: number,
    timeSpentSeconds: number,
    baseReward: number
  ): { xpAwarded: number; isCapped: boolean; message: string } {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem(STORAGE_KEYS.DAILY_REVISION_XP_DATE);
    let todayXp = 0;

    if (savedDate === today) {
      todayXp = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_REVISION_XP_AMOUNT) || '0', 10);
    } else {
      localStorage.setItem(STORAGE_KEYS.DAILY_REVISION_XP_DATE, today);
      localStorage.setItem(STORAGE_KEYS.DAILY_REVISION_XP_AMOUNT, '0');
    }

    const DAILY_MAX_REVISION_XP = 75; // Daily ceiling to prevent bot spam
    const remainingXpQuota = Math.max(0, DAILY_MAX_REVISION_XP - todayXp);

    if (remainingXpQuota <= 0) {
      return {
        xpAwarded: 0,
        isCapped: true,
        message: 'Daily Smart Revision XP limit reached (75/75 XP). Mastery and spaced repetition progress are still fully recorded!',
      };
    }

    // Minimum effort heuristic to avoid instant clicking
    if (timeSpentSeconds < 15 && cardsLearned === 0 && mcqsCorrect === 0) {
      return {
        xpAwarded: 0,
        isCapped: false,
        message: 'Spend at least 30 seconds revising or mark cards as learned to earn revision XP.',
      };
    }

    // Proportional reward
    const cardPoints = Math.min(25, cardsLearned * 5);
    const mcqPoints = Math.min(25, mcqsCorrect * 5);
    const timeBonus = Math.min(10, Math.floor(timeSpentSeconds / 30) * 2);
    const calculatedEarned = Math.min(baseReward, cardPoints + mcqPoints + timeBonus);

    const actualAwarded = Math.min(remainingXpQuota, Math.max(5, calculatedEarned));
    const newTotal = todayXp + actualAwarded;
    localStorage.setItem(STORAGE_KEYS.DAILY_REVISION_XP_AMOUNT, newTotal.toString());

    return {
      xpAwarded: actualAwarded,
      isCapped: actualAwarded < calculatedEarned,
      message: `+${actualAwarded} XP Earned! (Daily Revision Progress: ${newTotal}/${DAILY_MAX_REVISION_XP} XP)`,
    };
  }

  // 5. Complete Session & Sync Progress, Weak Topics, Study Planner
  static completeRevisionSession(params: {
    sheet: SmartRevisionSheet;
    cardsReviewedCount: number;
    cardsLearnedCount: number;
    mcqsAnsweredCount: number;
    mcqsCorrectCount: number;
    timeSpentSeconds: number;
    profile: StudentProfile;
  }): SmartRevisionSessionSummary {
    const { sheet, cardsReviewedCount, cardsLearnedCount, mcqsAnsweredCount, mcqsCorrectCount, timeSpentSeconds, profile } = params;

    // 1. Calculate XP with anti-farming
    const xpResult = this.calculateRevisionXp(
      cardsReviewedCount,
      cardsLearnedCount,
      mcqsCorrectCount,
      timeSpentSeconds,
      sheet.rewardXp || 35
    );

    if (xpResult.xpAwarded > 0) {
      StorageService.addXp(xpResult.xpAwarded, `Completed ${sheet.title} Revision`);
    }

    // 2. Calculate New Mastery Score (0 - 100)
    const currentMastery = sheet.masteryScore || 40;
    const totalCards = Math.max(1, sheet.flashcards.length);
    const totalMcqs = Math.max(1, sheet.quickMcqs.length);
    const cardMasteryRatio = cardsLearnedCount / totalCards;
    const mcqMasteryRatio = mcqsAnsweredCount > 0 ? mcqsCorrectCount / mcqsAnsweredCount : 0.5;

    const sessionScore = Math.round((cardMasteryRatio * 60) + (mcqMasteryRatio * 40));
    const newMastery = Math.min(100, Math.max(currentMastery, Math.round((currentMastery * 0.4) + (sessionScore * 0.6))));

    // 3. Advance Spaced Repetition Stage (1 -> 2 -> 3 -> 4 -> 5)
    // Stage 1 = +1 day, Stage 2 = +3 days, Stage 3 = +7 days, Stage 4 = +14 days, Stage 5 = +30 days
    const currentStage = sheet.spacedRepetitionStage || 1;
    let nextStage = currentStage;
    if (newMastery >= 70 && currentStage < 5) {
      nextStage = currentStage + 1;
    } else if (newMastery < 50 && currentStage > 1) {
      nextStage = currentStage - 1;
    }

    const stageDayIntervals = [1, 3, 7, 14, 30];
    const daysToAdd = stageDayIntervals[Math.min(stageDayIntervals.length - 1, nextStage - 1)] || 3;
    const nextDateObj = new Date();
    nextDateObj.setDate(nextDateObj.getDate() + daysToAdd);
    const nextRecommendedDate = nextDateObj.toISOString().split('T')[0];

    // Update sheet in memory & storage
    const updatedSheet: SmartRevisionSheet = {
      ...sheet,
      masteryScore: newMastery,
      spacedRepetitionStage: nextStage,
      lastRevisedAt: new Date().toISOString(),
      nextRecommendedRevisionDate: nextRecommendedDate,
    };
    this.saveSheet(updatedSheet);

    // 4. Update Weak Topics if applicable
    let weakTopicUpdated = false;
    let weakTopicResolved = false;
    let weakTopicDelta: { topicName: string; previousAccuracy: number; newAccuracy: number } | undefined;

    const weakTopics = StorageService.getWeakTopics();
    const matchingWeak = weakTopics.find(
      (wt) =>
        wt.subjectName.toLowerCase().trim() === sheet.subject.toLowerCase().trim() &&
        (sheet.topic ? wt.topicName.toLowerCase().includes(sheet.topic.toLowerCase()) : wt.chapterName.toLowerCase().includes(sheet.chapter.toLowerCase()))
    );

    if (matchingWeak) {
      const oldAcc = matchingWeak.accuracyRate;
      const boost = Math.round(10 + (cardMasteryRatio * 15) + (mcqMasteryRatio * 15));
      const newAcc = Math.min(95, oldAcc + boost);

      if (newAcc >= 80) {
        // Resolve weak topic by filtering it out or moving to strong
        const allWeak = StorageService.getWeakTopics().filter((w) => w.id !== matchingWeak.id);
        StorageService.saveWeakTopics(allWeak);
        const strongList = StorageService.getStrongTopics();
        if (!strongList.some((st) => st.topicName.toLowerCase() === matchingWeak.topicName.toLowerCase())) {
          strongList.unshift({
            id: `st-${Date.now()}`,
            subjectName: matchingWeak.subjectName,
            chapterName: matchingWeak.chapterName,
            topicName: matchingWeak.topicName,
            accuracyRate: newAcc,
            masteryLevel: newAcc >= 90 ? 'Mastered' : 'Strong',
            lastPracticed: 'Just now',
            testsTakenCount: (matchingWeak.attemptsCount || 1) + 1,
          });
          StorageService.saveStrongTopics(strongList);
        }
        weakTopicResolved = true;
        weakTopicUpdated = true;
      } else {
        const allWeak = StorageService.getWeakTopics().map((w) => {
          if (w.id === matchingWeak.id) {
            return {
              ...w,
              accuracyRate: newAcc,
              lastPracticed: 'Just now',
              recentPerformance: `${newAcc}% after Smart Revision • Just now`,
              improvementPercentage: newAcc - oldAcc,
            };
          }
          return w;
        });
        StorageService.saveWeakTopics(allWeak);
        weakTopicUpdated = true;
      }

      weakTopicDelta = {
        topicName: matchingWeak.topicName,
        previousAccuracy: oldAcc,
        newAccuracy: newAcc,
      };
    }

    // 5. Update matching Study Plan Task if one exists
    let studyTaskCompleted: { taskId: string; title: string } | undefined;
    const studyPlan = StorageService.getStudyPlan();
    if (studyPlan && studyPlan.tasks) {
      const matchTask = studyPlan.tasks.find(
        (t) =>
          !t.completed &&
          (t.title.toLowerCase().includes(sheet.chapter.toLowerCase()) ||
            (sheet.topic && t.title.toLowerCase().includes(sheet.topic.toLowerCase())))
      );
      if (matchTask) {
        StorageService.toggleTaskCompleted(matchTask.id);
        studyTaskCompleted = {
          taskId: matchTask.id,
          title: matchTask.title,
        };
      }
    }

    // 6. Record in Revision History
    const mcqsAccuracy = mcqsAnsweredCount > 0 ? Math.round((mcqsCorrectCount / mcqsAnsweredCount) * 100) : 100;
    const historyItem: RevisionHistoryItem = {
      id: `rev-hist-${Date.now()}`,
      sheetId: sheet.id,
      title: sheet.title,
      mode: sheet.mode,
      subject: sheet.subject,
      chapter: sheet.chapter,
      completedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      cardsLearnedCount,
      mcqsAccuracy,
      masteryScore: newMastery,
      xpEarned: xpResult.xpAwarded,
      nextDueDate: nextRecommendedDate,
      isDue: false,
    };
    this.addHistoryItem(historyItem);

    // 7. Log Activity
    StorageService.logActivity({
      id: `act-rev-${Date.now()}`,
      title: `Revised ${sheet.title} (${sheet.mode.toUpperCase()})`,
      type: 'quiz',
      timestamp: 'Just now',
      xpEarned: xpResult.xpAwarded,
      details: `${cardsLearnedCount}/${totalCards} cards learned • ${newMastery}% topic mastery reached`,
    });

    // 8. Construct summary
    const summary: SmartRevisionSessionSummary = {
      id: `rev-sum-${Date.now()}`,
      sheetId: sheet.id,
      title: sheet.title,
      mode: sheet.mode,
      subject: sheet.subject,
      chapter: sheet.chapter,
      topic: sheet.topic,
      cardsReviewedCount,
      cardsLearnedCount,
      mcqsAnsweredCount,
      mcqsCorrectCount,
      timeSpentSeconds,
      xpEarned: xpResult.xpAwarded,
      dailyXpCapped: xpResult.isCapped,
      previousMastery: currentMastery,
      newMastery,
      weakTopicUpdated,
      weakTopicResolved,
      weakTopicDelta,
      studyTaskCompleted,
      nextRevisionRecommendation: {
        recommendedDate: nextRecommendedDate,
        daysFromNow: daysToAdd,
        spacedRepetitionStage: nextStage,
        reason:
          newMastery >= 85
            ? 'Excellent mastery! Spaced interval expanded to optimize long-term memory retention.'
            : 'Good progress. Follow-up review scheduled to reinforce newly learned concepts before decay.',
        focusArea: sheet.topic || sheet.chapter,
      },
      completedAt: new Date().toISOString(),
    };

    return summary;
  }

  // 6. Export Revision Sheet to NotesView
  static exportRevisionToNote(sheet: SmartRevisionSheet): SavedNote {
    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    let markdown = `# ${sheet.title}\n\n`;
    markdown += `> **Subject**: ${sheet.subject} | **Chapter**: ${sheet.chapter} | **Class**: ${sheet.classLevel} (${sheet.board})\n\n`;
    markdown += `### 📌 Summary\n${sheet.summary}\n\n`;

    if (sheet.keyPoints && sheet.keyPoints.length > 0) {
      markdown += `### 🎯 High-Yield Key Points\n`;
      sheet.keyPoints.forEach((kp) => {
        markdown += `- ${kp}\n`;
      });
      markdown += `\n`;
    }

    if (sheet.definitions && sheet.definitions.length > 0) {
      markdown += `### 📚 Core Definitions\n`;
      sheet.definitions.forEach((d) => {
        markdown += `- **${d.term}**: ${d.definition}${d.example ? ` *(Example: ${d.example})*` : ''}\n`;
      });
      markdown += `\n`;
    }

    if (sheet.formulas && sheet.formulas.length > 0) {
      markdown += `### ⚡ Key Formulas & Rules\n`;
      sheet.formulas.forEach((f) => {
        markdown += `- **${f.name}**: \`${f.formula}\`\n`;
        if (f.variablesExplanation) markdown += `  - *Variables*: ${f.variablesExplanation}\n`;
        if (f.commonMistakeAlert) markdown += `  - ⚠️ *Mistake Alert*: ${f.commonMistakeAlert}\n`;
      });
      markdown += `\n`;
    }

    if (sheet.shortExplanations && sheet.shortExplanations.length > 0) {
      markdown += `### 💡 Short Explanations & Exam Tips\n`;
      sheet.shortExplanations.forEach((se) => {
        markdown += `#### ${se.concept}\n${se.explanation}\n`;
        if (se.examTip) markdown += `> 💡 **Exam Tip**: ${se.examTip}\n`;
        markdown += `\n`;
      });
    }

    if (sheet.practiceQuestions && sheet.practiceQuestions.length > 0) {
      markdown += `### ✍️ Practice Questions\n`;
      sheet.practiceQuestions.forEach((pq, idx) => {
        markdown += `**Q${idx + 1} (${pq.marks} Marks): ${pq.question}**\n\n`;
        markdown += `*Answer*: ${pq.sampleAnswer}\n\n`;
        if (pq.keyPointsToInclude && pq.keyPointsToInclude.length > 0) {
          markdown += `*Key Points for Full Marks*:\n`;
          pq.keyPointsToInclude.forEach((kp) => {
            markdown += `- ${kp}\n`;
          });
          markdown += `\n`;
        }
      });
    }

    const note: SavedNote = {
      id: `note-rev-${Date.now()}`,
      title: `${sheet.title} (Smart Revision)`,
      subjectName: sheet.subject,
      chapterName: sheet.chapter,
      topicName: sheet.topic || 'High-Yield Revision',
      classLevel: sheet.classLevel,
      language: 'en',
      createdAt: formattedDate,
      tags: ['Smart Revision', sheet.subject, sheet.chapter, `Class ${sheet.classLevel}`],
      isAiGenerated: true,
      isFavorite: true,
      sourceType: 'topic',
      quickRevisionPoints: sheet.keyPoints.slice(0, 5),
      contentMarkdown: markdown,
    };

    StorageService.saveNote(note);
    return note;
  }

  // 7. Convert Revision Sheet to Practice Quiz
  static createQuizFromRevision(sheet: SmartRevisionSheet): Quiz {
    const questions = sheet.quickMcqs.map((mcq, idx) => ({
      id: `q-rev-${idx + 1}`,
      question: mcq.question,
      options: mcq.options,
      correctIndex: mcq.correctIndex,
      explanation: mcq.explanation,
      difficulty: 'Medium' as const,
      topic: sheet.topic || sheet.chapter,
    }));

    const quiz: Quiz = {
      id: `quiz-rev-${Date.now()}`,
      title: `${sheet.title} - Diagnostic Check`,
      subjectId: sheet.subject,
      chapterName: sheet.chapter,
      topicName: sheet.topic,
      difficulty: 'Medium',
      questionCount: questions.length,
      questions,
      rewardXp: 50,
      createdDate: new Date().toISOString().split('T')[0],
      isCompleted: false,
    };

    StorageService.saveQuiz(quiz);
    return quiz;
  }

  // 8. Generate Smart Revision Sheet (AI Backend with comprehensive Fallback Heuristic)
  static async generateSheet(params: {
    mode: SmartRevisionMode;
    subject: string;
    chapter: string;
    topic?: string;
    classLevel: ClassLevel;
    board: BoardType;
    language?: string;
    mistakesContext?: string;
  }): Promise<SmartRevisionSheet> {
    try {
      const res = await fetch('/api/smart-revision/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.sheet) {
          this.saveSheet(data.sheet);
          return data.sheet;
        }
      }
    } catch (e) {
      console.warn('Backend revision generator endpoint unavailable, building curriculum-calibrated fallback:', e);
    }

    // High quality instant fallback
    const fallbackSheet = this.createLocalCurriculumSheet(params);
    this.saveSheet(fallbackSheet);
    return fallbackSheet;
  }

  // Local Curriculum Sheet Generator
  static createLocalCurriculumSheet(params: {
    mode: SmartRevisionMode;
    subject: string;
    chapter: string;
    topic?: string;
    classLevel: ClassLevel;
    board: BoardType;
  }): SmartRevisionSheet {
    const { mode, subject, chapter, topic, classLevel, board } = params;
    const title = topic ? `${topic} • ${chapter}` : `${chapter} Revision`;
    const subTitleMap: Record<SmartRevisionMode, string> = {
      quick: '5-Minute High-Yield Flashcard & Formula Review',
      chapter: 'Comprehensive Chapter Breakdown & Board Exam Blueprint',
      weak_topic: 'Targeted Remedial Drill & Misconception Breakdown',
      exam: 'High-Weightage Board Exam Questions & Time Management',
      mistake: 'Error Notebook & Common Traps Correction Drill',
      daily: 'Spaced Repetition Active Recall Sprint',
      custom: 'Custom Tailored Revision Session',
    };

    const isScience = subject.toLowerCase().includes('sci') || subject.toLowerCase().includes('phy') || subject.toLowerCase().includes('chem') || subject.toLowerCase().includes('bio');
    const isMath = subject.toLowerCase().includes('math');

    // Key points tailored to subject & mode
    const keyPoints = isScience
      ? [
          'Law of Conservation of Energy/Mass applies across all state changes and reactions.',
          'Always use Cartesian Sign Conventions: distances against incident light are negative (-).',
          'Differentiate between fundamental concepts, SI units, and scalar vs vector quantities.',
          'In exam answer scripts, always include labelled diagrams with pencil and straight-edge arrows.',
          'SI units must always be written with final calculation answers to avoid 0.5-mark deductions.',
        ]
      : isMath
      ? [
          'Verify quadratic discriminant D = b² - 4ac: D > 0 gives two distinct real roots, D = 0 gives two equal real roots.',
          'Always state the theorem name (e.g. Pythagoras Theorem, Basic Proportionality Theorem) in geometric proofs.',
          'In word problems, explicitly declare assumed variables with appropriate units (e.g., Let speed = x km/h).',
          'Check for extraneous roots by substituting solutions back into the original equation.',
          'Simplify intermediate fractions before performing large multiplications to reduce calculation errors.',
        ]
      : [
          'Identify primary cause-and-effect relationships and critical historical dates / constitutional provisions.',
          'Highlight key terminology and technical keywords in underline for high board exam scoring.',
          'Structure multi-mark answers into distinct heading points rather than monolithic paragraphs.',
          'Connect theoretical principles with practical examples and contextual real-world applications.',
        ];

    // Definitions
    const definitions: RevisionDefinition[] = isScience
      ? [
          {
            id: 'def-1',
            term: 'Principal Focus (F)',
            definition: 'The point on the principal axis of a spherical mirror where parallel incident rays converge (concave) or appear to diverge from (convex).',
            keyKeywords: ['Principal axis', 'Converge', 'Focal length'],
            example: 'A concave mirror in a solar cooker focuses sunlight to a hot spot at F.',
          },
          {
            id: 'def-2',
            term: 'Linear Magnification (m)',
            definition: 'The ratio of the height of the image formed by an optical device to the height of the object (m = h_i / h_o = -v / u).',
            keyKeywords: ['Height ratio', 'Image distance v', 'Object distance u'],
            example: 'A negative magnification value (m = -2) indicates an inverted, enlarged real image.',
          },
          {
            id: 'def-3',
            term: 'Exothermic Reaction',
            definition: 'A chemical reaction accompanied by the evolution of heat energy into the surrounding environment.',
            keyKeywords: ['Evolution of heat', 'Enthalpy change', 'Temperature rise'],
            example: 'Respiration and burning of natural gas (CH4 + 2O2 -> CO2 + 2H2O + Heat).',
          },
        ]
      : isMath
      ? [
          {
            id: 'def-1',
            term: 'Discriminant (D)',
            definition: 'The algebraic quantity D = b² - 4ac in quadratic equation ax² + bx + c = 0 that determines the nature of the roots.',
            keyKeywords: ['b² - 4ac', 'Nature of roots', 'Real vs imaginary'],
            example: 'For x² - 4x + 4 = 0, D = (-4)² - 4(1)(4) = 0 (two equal real roots).',
          },
          {
            id: 'def-2',
            term: 'Arithmetic Progression (A.P.)',
            definition: 'A sequence of numbers in which each term is obtained by adding a constant difference (d) to the preceding term.',
            keyKeywords: ['Common difference (d)', 'First term (a)', 'nth term an = a + (n-1)d'],
            example: '2, 7, 12, 17, ... where a = 2 and common difference d = 5.',
          },
        ]
      : [
          {
            id: 'def-1',
            term: 'Sovereignty',
            definition: 'The supreme power and independent authority of a state to govern itself and make laws without external interference.',
            keyKeywords: ['Supreme authority', 'Self-governance', 'Constitutional power'],
            example: 'The Preamble to the Indian Constitution declares India as a Sovereign Republic.',
          },
        ];

    // Formulas
    const formulas: RevisionFormula[] = isScience
      ? [
          {
            id: 'form-1',
            name: 'Mirror Formula & Radius Relation',
            formula: '1/f = 1/v + 1/u  and  f = R / 2',
            variablesExplanation: 'f = focal length, v = image distance, u = object distance (always negative), R = radius of curvature',
            whenToUse: 'When calculating image position, nature, or focal length for spherical mirrors.',
            commonMistakeAlert: 'Remember that concave mirror focal length is ALWAYS negative (-f), while convex is positive (+f).',
          },
          {
            id: 'form-2',
            name: 'Refractive Index Formula',
            formula: 'n_21 = v_1 / v_2 = sin(i) / sin(r)',
            variablesExplanation: 'n_21 = refractive index of medium 2 w.r.t 1, v = speed of light in medium, i = angle of incidence, r = angle of refraction',
            whenToUse: 'When light passes from one optical medium to another.',
            commonMistakeAlert: 'Do not confuse absolute refractive index (w.r.t vacuum/air) with relative refractive index.',
          },
        ]
      : isMath
      ? [
          {
            id: 'form-1',
            name: 'Quadratic Formula (Sridharacharya Rule)',
            formula: 'x = (-b ± √(b² - 4ac)) / (2a)',
            variablesExplanation: 'a, b, c are coefficients from standard form ax² + bx + c = 0 (where a ≠ 0)',
            whenToUse: 'When roots cannot be easily factored by splitting the middle term.',
            commonMistakeAlert: 'Divide the entire numerator (-b ± √D) by 2a, not just the square root portion.',
          },
          {
            id: 'form-2',
            name: 'Sum of n terms of an A.P.',
            formula: 'S_n = n/2 [2a + (n - 1)d] = n/2 [a + l]',
            variablesExplanation: 'n = number of terms, a = first term, d = common difference, l = last term',
            whenToUse: 'Calculating total sum of series or arithmetic sequences in word problems.',
            commonMistakeAlert: 'Ensure n is always a positive whole number.',
          },
        ]
      : [
          {
            id: 'form-1',
            name: 'HDI (Human Development Index) Ratio',
            formula: 'HDI = (Life Expectancy Index × Education Index × Income Index)^(1/3)',
            variablesExplanation: 'Standard UN composite index measuring overall development beyond pure GDP.',
            whenToUse: 'Economics chapter comparing national development standards.',
          },
        ];

    // Short explanations
    const shortExplanations: RevisionShortExplanation[] = [
      {
        id: 'se-1',
        concept: `Core Principle of ${topic || chapter}`,
        explanation: `Mastering ${topic || chapter} requires understanding how foundational rules interconnect with practical problem solving. Always start by identifying given constraints before applying specific theorems or laws.`,
        examTip: `In 3-mark questions, examiners award 1 mark for the formula/definition, 1.5 marks for intermediate working, and 0.5 mark for the final answer with correct SI units.`,
        mnemonicsOrAnalogy: 'Think of this as a balance scale: what goes into the system must balance out accurately on both sides.',
      },
      {
        id: 'se-2',
        concept: 'Common Pitfalls & Board Exam Traps',
        explanation: `Students frequently drop marks by rushing arithmetic simplifications or forgetting negative signs in algebraic/optics substitutions. Taking 10 seconds to re-verify signs saves crucial marks.`,
        examTip: `Always underline the final numerical answer or write it inside a neat boxed enclosure.`,
      },
    ];

    // Flashcards for active recall
    const flashcards: RevisionFlashcard[] = isScience
      ? [
          {
            id: 'fc-1',
            question: 'What is the sign of focal length for a Concave Mirror and Convex Mirror according to Cartesian convention?',
            answer: 'Concave mirror focal length is ALWAYS Negative (-), and Convex mirror focal length is ALWAYS Positive (+).',
            explanation: 'In concave mirrors, the focus lies in front of the reflecting surface (measured opposite to incident ray direction).',
            difficulty: 'Easy',
            topic: chapter,
          },
          {
            id: 'fc-2',
            question: 'If an object is placed at 2F (Centre of Curvature C) in front of a concave mirror, where is the image formed and what is its nature?',
            answer: 'The image is formed at 2F (Centre of Curvature C). It is Real, Inverted, and of the Same Size as the object (m = -1).',
            explanation: 'Rays through the center of curvature retrace their path along the normal, converging at C below the principal axis.',
            difficulty: 'Medium',
            topic: chapter,
          },
          {
            id: 'fc-3',
            question: 'Why does a convex mirror provide a much wider field of view than a plane or concave mirror?',
            answer: 'Because convex mirrors are curved outwards, allowing light from a wider angular span to form erect, diminished virtual images.',
            explanation: 'This optical property makes convex mirrors the universal standard for vehicle rear-view mirrors and blind corner security.',
            difficulty: 'Medium',
            topic: chapter,
          },
          {
            id: 'fc-4',
            question: 'State Snell’s Law of Refraction mathematically.',
            answer: 'The ratio of the sine of angle of incidence to the sine of angle of refraction is constant for a given pair of media: sin(i) / sin(r) = constant = n₂₁.',
            explanation: 'This constant represents the relative refractive index of medium 2 with respect to medium 1.',
            difficulty: 'Hard',
            topic: chapter,
          },
        ]
      : isMath
      ? [
          {
            id: 'fc-1',
            question: 'What are the two conditions for a quadratic equation ax² + bx + c = 0 to have real and equal roots?',
            answer: 'The discriminant must be exactly zero: D = b² - 4ac = 0. In this case, both roots equal -b / (2a).',
            explanation: 'When D = 0, the parabolic curve touches the x-axis at a single tangent vertex point.',
            difficulty: 'Easy',
            topic: chapter,
          },
          {
            id: 'fc-2',
            question: 'Write the formula for the nth term of an Arithmetic Progression.',
            answer: 'a_n = a + (n - 1)d, where a is the first term, d is the common difference, and n is the term position.',
            explanation: 'Each term adds (n-1) differences to the initial starting value a.',
            difficulty: 'Easy',
            topic: chapter,
          },
          {
            id: 'fc-3',
            question: 'If the discriminant D < 0 for ax² + bx + c = 0, what can you conclude about its roots?',
            answer: 'The equation has No Real Roots (it has two distinct complex/imaginary conjugate roots).',
            explanation: 'Square root of a negative number is not a real number, meaning the parabola never intersects the x-axis.',
            difficulty: 'Medium',
            topic: chapter,
          },
        ]
      : [
          {
            id: 'fc-1',
            question: 'What is the significance of the Preamble in the Indian Constitution?',
            answer: 'It acts as the preface and guiding philosophy, outlining the core values of Justice, Liberty, Equality, and Fraternity.',
            explanation: 'It establishes India as a Sovereign, Socialist, Secular, Democratic Republic.',
            difficulty: 'Medium',
            topic: chapter,
          },
        ];

    // Quick MCQs
    const quickMcqs: RevisionQuickMcq[] = isScience
      ? [
          {
            id: 'mcq-1',
            question: 'The focal length of a spherical mirror with radius of curvature R = 30 cm is:',
            options: ['15 cm', '30 cm', '60 cm', '7.5 cm'],
            correctIndex: 0,
            explanation: 'Focal length is half of the radius of curvature: f = R / 2 = 30 / 2 = 15 cm.',
          },
          {
            id: 'mcq-2',
            question: 'Magnification produced by a rear-view mirror fitted in vehicles is always:',
            options: ['Less than 1', 'More than 1', 'Equal to 1', 'Can be more or less than 1'],
            correctIndex: 0,
            explanation: 'Convex mirrors always form diminished images of distant objects, so height of image < height of object (m < 1).',
          },
          {
            id: 'mcq-3',
            question: 'When light travels from an optically rarer medium to a denser medium, it:',
            options: ['Bends towards the normal and slows down', 'Bends away from the normal and speeds up', 'Continues undeviated', 'Reflects completely back'],
            correctIndex: 0,
            explanation: 'In a denser medium, the speed of light decreases, causing the ray to bend towards the normal line.',
          },
        ]
      : isMath
      ? [
          {
            id: 'mcq-1',
            question: 'The discriminant of the quadratic equation 2x² - 4x + 3 = 0 is:',
            options: ['-8', '8', '-40', '16'],
            correctIndex: 0,
            explanation: 'D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8.',
          },
          {
            id: 'mcq-2',
            question: 'If the roots of quadratic equation kx² - 6x + 1 = 0 are equal, what is the value of k?',
            options: ['9', '6', '36', '3'],
            correctIndex: 0,
            explanation: 'For equal roots, D = 0 => (-6)² - 4(k)(1) = 0 => 36 = 4k => k = 9.',
          },
        ]
      : [
          {
            id: 'mcq-1',
            question: 'Which of the following is considered a primary indicator of national economic development?',
            options: ['Per Capita Income & HDI', 'Total Land Area', 'Total Military Strength', 'Currency Exchange Rate alone'],
            correctIndex: 0,
            explanation: 'Human Development Index combines per capita income with health and educational attainment.',
          },
        ];

    // Practice Questions
    const practiceQuestions: RevisionPracticeQuestion[] = isScience
      ? [
          {
            id: 'pq-1',
            question: 'An object 4.0 cm in size is placed at 25.0 cm in front of a concave mirror of focal length 15.0 cm. Find the distance from the mirror at which a screen should be placed in order to obtain a sharp image. Also find the nature and size of the image.',
            sampleAnswer: 'Given: h = +4.0 cm, u = -25.0 cm, f = -15.0 cm.\nUsing Mirror Formula: 1/v = 1/f - 1/u = 1/(-15) - 1/(-25) = -1/15 + 1/25 = (-5 + 3)/75 = -2/75.\nTherefore, v = -37.5 cm (screen should be placed 37.5 cm in front of mirror).\nMagnification m = -v/u = -(-37.5)/(-25.0) = -1.5.\nImage height h_i = m × h = -1.5 × 4.0 cm = -6.0 cm.\nNature: Real, Inverted, and Enlarged (6 cm tall).',
            keyPointsToInclude: ['Correct sign convention application', 'Mirror formula substitution: 1/f = 1/v + 1/u', 'Calculation of v = -37.5 cm', 'Calculation of image height = -6.0 cm with Real & Inverted nature'],
            marks: 3,
            difficulty: 'Hard',
          },
          {
            id: 'pq-2',
            question: 'Why do stars twinkle in the night sky while planets do not? Explain with a neat conceptual diagram outline.',
            sampleAnswer: 'Stars are point-sized light sources located immensely far away. As star light enters Earth\'s atmosphere, it undergoes continuous atmospheric refraction through layers of constantly fluctuating optical density and temperature. This causes the apparent position and amount of light entering the eye to flicker.\n\nPlanets, being much closer to Earth, act as extended sources composed of numerous point sources of light. The total variation in light intensity from all individual points averages out to zero, eliminating any noticeable twinkling effect.',
            keyPointsToInclude: ['Atmospheric refraction due to fluctuating air densities', 'Stars as point-sized sources vs planets as extended sources', 'Averaging effect of extended light sources'],
            marks: 3,
            difficulty: 'Medium',
          },
        ]
      : isMath
      ? [
          {
            id: 'pq-1',
            question: 'Find the roots of the quadratic equation 2x² - 7x + 3 = 0 using the quadratic formula.',
            sampleAnswer: 'Standard form: ax² + bx + c = 0, here a = 2, b = -7, c = 3.\nDiscriminant D = b² - 4ac = (-7)² - 4(2)(3) = 49 - 24 = 25.\nSince D > 0, there are two distinct real roots.\nx = (-b ± √D) / (2a) = (7 ± √25) / (2 × 2) = (7 ± 5) / 4.\nCase 1: x = (7 + 5) / 4 = 12 / 4 = 3.\nCase 2: x = (7 - 5) / 4 = 2 / 4 = 1/2.\nRoots are x = 3 and x = 1/2.',
            keyPointsToInclude: ['Identification of coefficients a=2, b=-7, c=3', 'Calculation of discriminant D=25', 'Application of quadratic formula', 'Final roots x = 3 and x = 1/2'],
            marks: 3,
            difficulty: 'Medium',
          },
        ]
      : [
          {
            id: 'pq-1',
            question: 'Explain three key differences between Renewable and Non-Renewable resources with examples.',
            sampleAnswer: '1. Replenishment: Renewable resources regenerate naturally over short periods (Solar, Wind), while non-renewable take geological epochs to form (Coal, Petroleum).\n2. Environmental Impact: Renewable energy creates minimal pollution, whereas fossil fuels release greenhouse gases.\n3. Exhaustibility: Renewable resources are inexhaustible with sustainable usage, while non-renewable reserves are finite.',
            keyPointsToInclude: ['Replenishment rate distinction', 'Ecological footprint comparison', 'Examples for both categories'],
            marks: 3,
            difficulty: 'Easy',
          },
        ];

    const todayDate = new Date();
    const nextDate = new Date();
    nextDate.setDate(todayDate.getDate() + 1);

    return {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title,
      subtitle: subTitleMap[mode] || 'Smart High-Yield Revision Session',
      mode,
      subject,
      chapter,
      topic: topic || 'All Core Concepts',
      classLevel,
      board,
      summary: `High-yield revision session for Class ${classLevel} ${subject} covering "${chapter}". Designed with active recall flashcards, formula cheat sheets, diagnostic MCQs, and exam question blueprints to reinforce long-term mastery before upcoming assessments.`,
      keyPoints,
      definitions,
      formulas,
      shortExplanations,
      flashcards,
      quickMcqs,
      practiceQuestions,
      estimatedMinutes: mode === 'quick' ? 5 : mode === 'exam' ? 15 : 10,
      rewardXp: mode === 'quick' ? 20 : mode === 'exam' ? 45 : 35,
      masteryScore: 50,
      spacedRepetitionStage: 1,
      lastRevisedAt: undefined,
      nextRecommendedRevisionDate: nextDate.toISOString().split('T')[0],
      createdAt: todayDate.toISOString(),
      isSaved: true,
    };
  }
}
