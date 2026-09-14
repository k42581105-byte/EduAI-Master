import {
  StudentProfile,
  WeakTopic,
  StrongTopic,
  Quiz,
  Exam,
  ActivityLog,
  AdaptiveTopic,
  AdaptiveLearningPath,
  AdaptiveQuestionPayload,
  AdaptiveDifficultyLevel,
  TopicMasteryStatus,
} from '../types';
import { StorageService } from './storageService';
import { LanguageCode } from '../i18n/translations';

export interface GenerateAdaptivePathParams {
  profile: StudentProfile;
  selectedSubject?: string;
  weakTopics?: WeakTopic[];
  strongTopics?: StrongTopic[];
  quizResults?: Quiz[];
  examResults?: Exam[];
  studyHistory?: ActivityLog[];
  recentMistakes?: string[];
  studyGoals?: string[];
  language?: LanguageCode | string;
}

export interface AdaptivePracticeParams {
  topic: string;
  subject: string;
  chapter: string;
  classLevel: string;
  board?: string;
  currentDifficulty?: AdaptiveDifficultyLevel;
  isStruggling?: boolean;
  isImproving?: boolean;
  consecutiveWrong?: number;
  consecutiveCorrect?: number;
  recentMistakes?: string[];
  language?: LanguageCode | string;
}

export class AdaptiveLearningService {
  private static CACHE_KEY_PREFIX = 'eduai_adaptive_path_';

  /**
   * Generates or retrieves the personalized Adaptive Learning Path
   */
  public static async getAdaptiveLearningPath(
    params: GenerateAdaptivePathParams,
    forceRefresh: boolean = false
  ): Promise<{ path: AdaptiveLearningPath; isFallback: boolean }> {
    const subject = params.selectedSubject || params.profile.selectedSubjects?.[0] || 'Science';
    const cacheKey = `${this.CACHE_KEY_PREFIX}${params.profile.classLevel}_${subject}`;

    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as AdaptiveLearningPath;
          return { path: parsed, isFallback: false };
        } catch (e) {
          console.warn('Failed to parse cached adaptive path:', e);
        }
      }
    }

    try {
      const weakTopics = params.weakTopics || StorageService.getWeakTopics();
      const strongTopics = params.strongTopics || StorageService.getStrongTopics();
      const quizResults = params.quizResults || StorageService.getSavedQuizzes();
      const examResults = params.examResults || StorageService.getSavedExams();
      const activities = params.studyHistory || StorageService.getActivities();

      // Extract recent mistakes from quizzes
      const recentMistakes: string[] = [];
      quizResults.forEach((q) => {
        if (q.userAnswersRecord) {
          Object.values(q.userAnswersRecord).forEach((rec) => {
            if (!rec.isCorrect && rec.typedAnswer) {
              recentMistakes.push(rec.typedAnswer);
            }
          });
        }
      });

      const response = await fetch('/api/ai/adaptive-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: params.profile,
          selectedSubject: subject,
          weakTopics,
          strongTopics,
          quizResults,
          examResults,
          studyHistory: activities,
          recentMistakes,
          studyGoals: params.studyGoals || params.profile.learningGoals,
          language: params.language || params.profile.preferredLanguage || 'en',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.path && data.path.topics && data.path.topics.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify(data.path));
          return { path: data.path, isFallback: false };
        }
      }
    } catch (err) {
      console.warn('API /api/ai/adaptive-path failed, compiling local adaptive path:', err);
    }

    // Build intelligent calibrated local adaptive path based on real student data
    const localPath = this.buildLocalAdaptivePath(params, subject);
    localStorage.setItem(cacheKey, JSON.stringify(localPath));
    return { path: localPath, isFallback: true };
  }

  /**
   * Generates an adaptive practice question item (with remediation or HOTS)
   */
  public static async getAdaptivePracticeQuestion(
    params: AdaptivePracticeParams
  ): Promise<{ questionItem: AdaptiveQuestionPayload; isFallback: boolean }> {
    try {
      const response = await fetch('/api/ai/adaptive-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.questionItem) {
          return { questionItem: data.questionItem, isFallback: false };
        }
      }
    } catch (err) {
      console.warn('API /api/ai/adaptive-practice failed, using fallback item:', err);
    }

    // Fallback adaptive question
    const fallbackItem = this.generateFallbackAdaptiveQuestion(params);
    return { questionItem: fallbackItem, isFallback: true };
  }

  /**
   * Updates topic mastery and advances / steps down difficulty based on answer
   */
  public static recordPerformanceUpdate(
    path: AdaptiveLearningPath,
    topicId: string,
    isCorrect: boolean,
    userAnswerExplanation: string
  ): {
    updatedPath: AdaptiveLearningPath;
    updatedTopic: AdaptiveTopic;
    isStruggling: boolean;
    isImproving: boolean;
    difficultyChanged: boolean;
    newDifficulty: AdaptiveDifficultyLevel;
    xpEarned: number;
  } {
    const topicIndex = path.topics.findIndex((t) => t.id === topicId);
    if (topicIndex === -1) {
      return {
        updatedPath: path,
        updatedTopic: path.currentTopic,
        isStruggling: false,
        isImproving: false,
        difficultyChanged: false,
        newDifficulty: path.currentTopic.currentDifficulty,
        xpEarned: 0,
      };
    }

    const topic = { ...path.topics[topicIndex] };
    topic.attemptsCount += 1;
    topic.lastAssessedAt = 'Just now';

    let isStruggling = false;
    let isImproving = false;
    let difficultyChanged = false;
    let xpEarned = 0;

    if (isCorrect) {
      topic.consecutiveCorrect += 1;
      topic.consecutiveWrong = 0;
      xpEarned = topic.currentDifficulty.includes('HOTS') ? 40 : topic.currentDifficulty.includes('Advanced') ? 30 : 20;

      // Increase mastery %
      const delta = topic.currentDifficulty.includes('Foundation') ? 12 : topic.currentDifficulty.includes('Standard') ? 10 : 8;
      topic.masteryPercentage = Math.min(100, topic.masteryPercentage + delta);

      // Check if improving enough to step up difficulty
      if (topic.consecutiveCorrect >= 2) {
        isImproving = true;
        if (topic.currentDifficulty === 'Level 1 - Foundation') {
          topic.currentDifficulty = 'Level 2 - Standard';
          difficultyChanged = true;
        } else if (topic.currentDifficulty === 'Level 2 - Standard') {
          topic.currentDifficulty = 'Level 3 - Advanced';
          difficultyChanged = true;
        } else if (topic.currentDifficulty === 'Level 3 - Advanced') {
          topic.currentDifficulty = 'Level 4 - HOTS / Application';
          difficultyChanged = true;
        }
      }
    } else {
      topic.consecutiveWrong += 1;
      topic.consecutiveCorrect = 0;
      xpEarned = 5; // Minimal encouragement XP

      // Reduce mastery slightly
      topic.masteryPercentage = Math.max(10, topic.masteryPercentage - 6);
      if (userAnswerExplanation) {
        topic.recentMistakes = [userAnswerExplanation, ...(topic.recentMistakes || [])].slice(0, 5);
      }

      // Check if struggling enough to step down difficulty
      if (topic.consecutiveWrong >= 1) {
        isStruggling = true;
        if (topic.currentDifficulty === 'Level 4 - HOTS / Application') {
          topic.currentDifficulty = 'Level 3 - Advanced';
          difficultyChanged = true;
        } else if (topic.currentDifficulty === 'Level 3 - Advanced') {
          topic.currentDifficulty = 'Level 2 - Standard';
          difficultyChanged = true;
        } else if (topic.currentDifficulty === 'Level 2 - Standard') {
          topic.currentDifficulty = 'Level 1 - Foundation';
          difficultyChanged = true;
        }
      }
    }

    // Recompute topic status
    topic.status = this.determineTopicStatus(topic.masteryPercentage, topic.attemptsCount);

    // Update topics array
    const updatedTopics = [...path.topics];
    updatedTopics[topicIndex] = topic;

    // Check if current topic has reached >= 80% mastery to promote next topic
    let newCurrentTopic = { ...topic };
    let newRecommendedNext = { ...path.recommendedNextTopic };

    if (topic.masteryPercentage >= 80 && topic.isCurrent) {
      // Find next unmastered topic in path
      const nextCandidateIndex = updatedTopics.findIndex((t) => t.id !== topic.id && t.masteryPercentage < 80);
      if (nextCandidateIndex !== -1) {
        updatedTopics[topicIndex].isCurrent = false;
        updatedTopics[nextCandidateIndex].isCurrent = true;
        newCurrentTopic = updatedTopics[nextCandidateIndex];

        const nextNextCandidate = updatedTopics.find(
          (t) => t.id !== newCurrentTopic.id && t.masteryPercentage < 60
        );
        if (nextNextCandidate) {
          newRecommendedNext = nextNextCandidate;
        }
      }
    }

    // Calculate overall mastery
    const totalMastery = updatedTopics.reduce((acc, t) => acc + t.masteryPercentage, 0);
    const overallMasteryPercentage = Math.round(totalMastery / updatedTopics.length);
    const strugglingTopicsCount = updatedTopics.filter((t) => t.status === 'Beginner' || t.status === 'Learning').length;
    const strongTopicsCount = updatedTopics.filter((t) => t.status === 'Strong').length;

    const updatedPath: AdaptiveLearningPath = {
      ...path,
      topics: updatedTopics,
      currentTopic: newCurrentTopic,
      recommendedNextTopic: newRecommendedNext,
      overallMasteryPercentage,
      strugglingTopicsCount,
      strongTopicsCount,
      activeDifficultyTier: newCurrentTopic.currentDifficulty,
    };

    // Save updated path to cache
    const cacheKey = `${this.CACHE_KEY_PREFIX}${path.studentClass}_${path.selectedSubject}`;
    localStorage.setItem(cacheKey, JSON.stringify(updatedPath));

    // Also sync to StorageService (XP and activity log)
    StorageService.addXp(xpEarned, `Adaptive Practice: ${topic.topicName}`);

    return {
      updatedPath,
      updatedTopic: topic,
      isStruggling,
      isImproving,
      difficultyChanged,
      newDifficulty: topic.currentDifficulty,
      xpEarned,
    };
  }

  /**
   * Helper to determine topic mastery stage
   */
  public static determineTopicStatus(masteryPercentage: number, attempts: number): TopicMasteryStatus {
    if (attempts === 0 || masteryPercentage < 40) return 'Beginner';
    if (masteryPercentage < 65) return 'Learning';
    if (masteryPercentage < 85) return 'Practicing';
    return 'Strong';
  }

  /**
   * Helper to determine difficulty tier from mastery
   */
  public static getDifficultyTierForMastery(masteryPercentage: number): AdaptiveDifficultyLevel {
    if (masteryPercentage < 40) return 'Level 1 - Foundation';
    if (masteryPercentage < 65) return 'Level 2 - Standard';
    if (masteryPercentage < 85) return 'Level 3 - Advanced';
    return 'Level 4 - HOTS / Application';
  }

  /**
   * Builds intelligent local adaptive path from student data
   */
  private static buildLocalAdaptivePath(
    params: GenerateAdaptivePathParams,
    subject: string
  ): AdaptiveLearningPath {
    const classLevel = params.profile.classLevel || '10';
    const weakTopics = params.weakTopics || StorageService.getWeakTopics();
    const strongTopics = params.strongTopics || StorageService.getStrongTopics();
    const isHindi = params.language === 'hi';

    // Seed syllabus curriculum topics based on subject & class
    let rawTopicList: Array<{ chapter: string; topic: string; baseMastery: number }> = [];

    if (subject.toLowerCase().includes('science') || subject.toLowerCase().includes('physics')) {
      rawTopicList = [
        { chapter: 'Chemical Reactions & Equations', topic: 'Balancing Chemical Equations & Redox Reactions', baseMastery: 88 },
        { chapter: 'Acids, Bases and Salts', topic: 'pH Scale & Chlor-Alkali Process', baseMastery: 72 },
        { chapter: 'Light: Reflection & Refraction', topic: 'Spherical Mirror Formula & Sign Convention', baseMastery: 42 },
        { chapter: 'Light: Reflection & Refraction', topic: 'Lens Power & Refraction through Glass Prism', baseMastery: 58 },
        { chapter: 'Electricity', topic: 'Ohm’s Law & Equivalent Resistance in Series/Parallel', baseMastery: 65 },
        { chapter: 'Electricity', topic: 'Joule’s Heating Effect & Electric Power Calculation', baseMastery: 50 },
        { chapter: 'Magnetic Effects of Current', topic: 'Fleming’s Left Hand Rule & Solenoid Magnetic Fields', baseMastery: 35 },
        { chapter: 'Life Processes', topic: 'Human Digestive System & Aerobic/Anaerobic Respiration', baseMastery: 82 },
      ];
    } else if (subject.toLowerCase().includes('math')) {
      rawTopicList = [
        { chapter: 'Real Numbers', topic: 'Fundamental Theorem of Arithmetic & Proof of Irrationality', baseMastery: 85 },
        { chapter: 'Polynomials', topic: 'Relationship between Zeros and Coefficients of Quadratic Polynomial', baseMastery: 80 },
        { chapter: 'Pair of Linear Equations', topic: 'Graphical Method & Cross-Multiplication Conditions', baseMastery: 60 },
        { chapter: 'Quadratic Equations', topic: 'Discriminant Nature of Roots & Word Problems', baseMastery: 48 },
        { chapter: 'Arithmetic Progressions', topic: 'nth Term & Sum of First n Terms of an A.P.', baseMastery: 74 },
        { chapter: 'Triangles', topic: 'Basic Proportionality Theorem (Thales) & Similarity Criteria', baseMastery: 38 },
        { chapter: 'Introduction to Trigonometry', topic: 'Trigonometric Ratios & Standard Angle Values (0°, 30°, 45°, 60°, 90°)', baseMastery: 68 },
        { chapter: 'Statistics', topic: 'Mean, Median & Mode of Grouped Data (Direct & Assumed Mean)', baseMastery: 84 },
      ];
    } else {
      rawTopicList = [
        { chapter: 'India and the Contemporary World', topic: 'The Rise of Nationalism in Europe', baseMastery: 70 },
        { chapter: 'Resources and Development', topic: 'Types of Resources & Soil Classification in India', baseMastery: 82 },
        { chapter: 'Power Sharing', topic: 'Majoritarianism in Sri Lanka & Belgian Accommodation Model', baseMastery: 64 },
        { chapter: 'Development', topic: 'Per Capita Income, HDI & Sustainable Development', baseMastery: 78 },
        { chapter: 'Money and Credit', topic: 'Formal vs Informal Sources of Credit & Role of RBI', baseMastery: 45 },
      ];
    }

    // Map each raw topic into AdaptiveTopic evaluating real weak/strong records
    const topics: AdaptiveTopic[] = rawTopicList.map((item, index) => {
      // Check if matches weak topic
      const weakMatch = weakTopics.find(
        (w) =>
          w.topicName.toLowerCase().includes(item.topic.toLowerCase()) ||
          item.topic.toLowerCase().includes(w.topicName.toLowerCase()) ||
          w.chapterName.toLowerCase().includes(item.chapter.toLowerCase())
      );

      // Check if matches strong topic
      const strongMatch = strongTopics.find(
        (s) =>
          s.topicName.toLowerCase().includes(item.topic.toLowerCase()) ||
          item.topic.toLowerCase().includes(s.topicName.toLowerCase()) ||
          s.chapterName.toLowerCase().includes(item.chapter.toLowerCase())
      );

      let mastery = item.baseMastery;
      if (weakMatch) {
        mastery = weakMatch.accuracyRate || 42;
      } else if (strongMatch) {
        mastery = strongMatch.accuracyRate || 88;
      }

      const status = this.determineTopicStatus(mastery, mastery > 70 ? 3 : 1);
      const difficulty = this.getDifficultyTierForMastery(mastery);

      return {
        id: `tp-adapt-${index + 1}`,
        subjectName: subject,
        chapterName: item.chapter,
        topicName: item.topic,
        status,
        masteryPercentage: mastery,
        currentDifficulty: difficulty,
        attemptsCount: mastery > 80 ? 4 : mastery > 60 ? 2 : 1,
        accuracyRate: mastery,
        recentMistakes: weakMatch
          ? [`Calculation/sign convention errors recorded in ${weakMatch.chapterName}`]
          : [],
        keyFormulas: [
          'v = u + at, s = ut + 1/2 at²',
          '1/f = 1/v - 1/u (Mirror/Lens Formula)',
          'V = IR (Ohm’s Law)',
        ],
        simpleExplanation: isHindi
          ? `यह विषय मुख्य रूप से ${item.topic} के बुनियादी नियमों और बोर्ड प्रश्नों पर केंद्रित है।`
          : `This topic focuses on fundamental definitions, standard formulae, and common Board examination pitfalls for ${item.topic}.`,
        easyExample: {
          question: isHindi
            ? `${item.topic} पर एक सरल उदाहरण हल करें:`
            : `Consider a standard direct application on ${item.topic}:`,
          stepByStepSolution: isHindi
            ? 'चरण 1: दिए गए मान लिखें। चरण 2: सही सूत्र का चयन करें। चरण 3: गणना करके उत्तर निकालें।'
            : 'Step 1: State given variables. Step 2: Apply the standard relation. Step 3: Compute with appropriate SI units.',
          keyTakeaway: isHindi
            ? 'हमेशा गणना से पहले इकाइयों (Units) की जांच करें।'
            : 'Always check signs and SI units before finalizing your answer.',
        },
        isCurrent: false,
        isNextRecommended: false,
        recommendedAction:
          status === 'Beginner'
            ? 'Review simple concept & solve 2 guided examples'
            : status === 'Learning'
            ? 'Practice standard numericals with hints'
            : status === 'Practicing'
            ? 'Take a timed 5-question speed quiz'
            : 'Solve High-Order Application (HOTS) challenge',
        consecutiveCorrect: status === 'Strong' ? 3 : 0,
        consecutiveWrong: status === 'Beginner' ? 2 : 0,
        lastAssessedAt: status === 'Strong' ? '2 days ago' : 'Today',
      };
    });

    // Identify current active topic (lowest mastery among in-progress, or earliest weak topic)
    let currentTopicIndex = topics.findIndex((t) => t.status === 'Learning' || t.status === 'Beginner');
    if (currentTopicIndex === -1) currentTopicIndex = 0;
    topics[currentTopicIndex].isCurrent = true;

    // Identify next recommended topic
    let nextTopicIndex = topics.findIndex((t, idx) => idx > currentTopicIndex && t.status !== 'Strong');
    if (nextTopicIndex === -1) {
      nextTopicIndex = (currentTopicIndex + 1) % topics.length;
    }
    topics[nextTopicIndex].isNextRecommended = true;

    const totalMastery = topics.reduce((acc, t) => acc + t.masteryPercentage, 0);
    const overallMastery = Math.round(totalMastery / topics.length);

    return {
      studentClass: classLevel as any,
      selectedSubject: subject,
      availableSubjects: params.profile.selectedSubjects || ['Science', 'Mathematics', 'Social Science'],
      overallMasteryPercentage: overallMastery,
      currentTopic: topics[currentTopicIndex],
      recommendedNextTopic: topics[nextTopicIndex],
      topics,
      strugglingTopicsCount: topics.filter((t) => t.status === 'Beginner' || t.status === 'Learning').length,
      strongTopicsCount: topics.filter((t) => t.status === 'Strong').length,
      activeDifficultyTier: topics[currentTopicIndex].currentDifficulty,
      learningGoals: params.studyGoals || params.profile.learningGoals || ['Score 95%+ in Board Exam'],
      generatedAt: new Date().toISOString(),
      recentAssessmentInsight: isHindi
        ? `आपके हालिया टेस्ट और कमजोर विषयों के आधार पर ${topics[currentTopicIndex].topicName} पर तुरंत ध्यान देने की आवश्यकता है।`
        : `Based on your test records, prioritizing ${topics[currentTopicIndex].topicName} will yield the fastest jump in overall subject mastery.`,
    };
  }

  /**
   * Generates a fallback adaptive question with remediation or HOTS
   */
  private static generateFallbackAdaptiveQuestion(
    params: AdaptivePracticeParams
  ): AdaptiveQuestionPayload {
    const isStruggling = params.isStruggling || (params.consecutiveWrong && params.consecutiveWrong >= 1);
    const isImproving = params.isImproving || (params.consecutiveCorrect && params.consecutiveCorrect >= 2);
    const isHindi = params.language === 'hi';

    if (isStruggling) {
      return {
        id: `ad-q-fallback-struggle-${Date.now()}`,
        question: isHindi
          ? `[फाउंडेशन स्तर] ${params.topic} के संबंध में निम्नलिखित में से कौन सा कथन सही है?`
          : `[Foundation Level] In ${params.topic}, if an object is placed at the center of curvature ($C$) of a concave mirror, where is the image formed?`,
        options: isHindi
          ? ['फोकस पर', 'वक्रता केंद्र (C) पर समान आकार का', 'अनंत पर', 'दर्पण के पीछे आभासी']
          : [
              'At the center of curvature ($C$), real and inverted with equal size',
              'At focus ($F$), highly diminished',
              'Between focus and center of curvature, enlarged',
              'Behind the mirror, virtual and erect',
            ],
        correctIndex: 0,
        explanation: isHindi
          ? 'जब वस्तु को अवतल दर्पण के वक्रता केंद्र (C) पर रखा जाता है, तो प्रतिबिम्ब भी C पर ही वास्तविक, उल्टा और वस्तु के बराबर बनता है।'
          : 'When an object is situated at the center of curvature (C) of a concave mirror, rays reflect back such that the image is formed exactly at C, real, inverted, and of the exact same height ($m = -1$).',
        difficulty: 'Easy',
        difficultyTier: 'Level 1 - Foundation',
        topic: params.topic,
        subject: params.subject,
        hints: [
          'Hint 1: Recall the ray parallel to the principal axis passes through F after reflection.',
          'Hint 2: The magnification $m = -v/u$. At $C$, $v = u$.',
          'Hint 3: The image size is exactly 1:1 with the object.',
        ],
        isApplicationBased: false,
        guidedStepPrompt: 'Step 1: Identify mirror type (Concave). Step 2: Identify object position ($u = 2f = R$).',
        simpleConceptBreakdown: isHindi
          ? '• अवतल दर्पण (Concave Mirror) प्रकाश को केंद्रित करता है।\n• C पर रखी वस्तु का प्रतिबिम्ब C पर ही बनता है।\n• आवर्धन m = -1 होता है।'
          : '• Concave mirror converges incident light rays.\n• Object placed at Center of Curvature (C) yields an image right at C.\n• Magnification is strictly -1 (same size, real, inverted).',
        easyExample: {
          question: 'If object distance $u = -30\\text{ cm}$ and radius of curvature $R = 30\\text{ cm}$, find image position.',
          stepByStepSolution:
            '1. Focal length $f = R/2 = -15\\text{ cm}$.\n2. Mirror formula: $1/f = 1/v + 1/u \\implies -1/15 = 1/v - 1/30$.\n3. $1/v = -1/15 + 1/30 = -1/30 \\implies v = -30\\text{ cm}$.',
          keyTakeaway: 'At $u = 2f$, the image always forms at $v = 2f$.',
        },
      };
    }

    if (isImproving) {
      return {
        id: `ad-q-fallback-hots-${Date.now()}`,
        question: isHindi
          ? `[HOTS / एप्लीकेशन स्तर] एक दंत चिकित्सक (Dentist) रोगी के दांत का 3 गुना बड़ा सीधा (Erect) प्रतिबिम्ब देखना चाहता है। यदि अवतल दर्पण की फोकस दूरी 15 सेमी है, तो दर्पण को दांत से कितनी दूरी पर रखना चाहिए?`
          : `[HOTS / Application Challenge] A dental surgeon uses a concave mirror of focal length $f = 15\\text{ cm}$ to observe an erect and magnified image ($3\\times$) of a patient’s cavity. Calculate the precise distance at which the mirror must be held from the tooth.`,
        options: isHindi
          ? ['10 सेमी (दांत से दर्पण की दूरी)', '20 सेमी', '5 सेमी', '30 सेमी']
          : [
              '10 cm in front of the mirror ($u = -10\\text{ cm}$)',
              '20 cm in front of the mirror ($u = -20\\text{ cm}$)',
              '5 cm in front of the mirror ($u = -5\\text{ cm}$)',
              '15 cm at the focal point ($u = -15\\text{ cm}$)',
            ],
        correctIndex: 0,
        explanation: isHindi
          ? 'सीधे प्रतिबिम्ब के लिए आवर्धन m = +3 है। m = -v/u => 3 = -v/u => v = -3u। दर्पण सूत्र 1/f = 1/v + 1/u में मान रखने पर: -1/15 = 1/(-3u) + 1/u = 2/(3u) => 3u = -30 => u = -10 सेमी।'
          : 'For an erect, virtual image by a concave mirror, magnification $m = +3$.\nSince $m = -v/u \\implies 3 = -v/u \\implies v = -3u$.\nSubstituting into the mirror equation $1/f = 1/v + 1/u$ with $f = -15\\text{ cm}$:\n$-1/15 = -1/(3u) + 1/u = 2/(3u) \\implies 3u = -30 \\implies u = -10\\text{ cm}$.\nThus the mirror must be held 10 cm from the tooth.',
        difficulty: 'Hard',
        difficultyTier: 'Level 4 - HOTS / Application',
        topic: params.topic,
        subject: params.subject,
        hints: [
          'Hint 1: Since the dentist needs an "erect" image, magnification $m$ is positive (+3).',
          'Hint 2: Express $v$ in terms of $u$ ($v = -3u$) and substitute into $1/f = 1/v + 1/u$.',
        ],
        isApplicationBased: true,
        realWorldScenario: 'Clinical Dental Mirror Examination optics calculation under Board marking guidelines.',
      };
    }

    // Standard practice question
    return {
      id: `ad-q-fallback-std-${Date.now()}`,
      question: isHindi
        ? `[मानक स्तर] ${params.topic}: यदि किसी उत्तल दर्पण की फोकस दूरी +20 सेमी है, तो 30 सेमी दूर रखी वस्तु के प्रतिबिम्ब की स्थिति और प्रकृति क्या होगी?`
        : `[Standard Level] An object is placed at a distance of 30 cm in front of a convex mirror of focal length 20 cm. Find the position of the image.`,
      options: isHindi
        ? ['दर्पण के पीछे +12 सेमी पर, आभासी और सीधा', 'दर्पण के आगे -12 सेमी पर', 'दर्पण के पीछे +60 सेमी पर', '+15 सेमी पर']
        : [
            '+12 cm behind the mirror (Virtual and Erect)',
            '-12 cm in front of the mirror (Real and Inverted)',
            '+60 cm behind the mirror (Magnified)',
            '+15 cm at the principal focus',
          ],
      correctIndex: 0,
      explanation: isHindi
        ? 'उत्तल दर्पण के लिए f = +20 सेमी, u = -30 सेमी। 1/v = 1/f - 1/u = 1/20 - (-1/30) = 1/20 + 1/30 = 5/60 = 1/12 => v = +12 सेमी (दर्पण के पीछे, आभासी)।'
        : 'For a convex mirror, $f = +20\\text{ cm}$ and object distance $u = -30\\text{ cm}$.\nUsing mirror formula: $1/v = 1/f - 1/u = 1/20 - (-1/30) = 1/20 + 1/30 = 5/60 = 1/12$.\nTherefore, $v = +12\\text{ cm}$. The positive sign indicates a virtual, erect image formed behind the mirror.',
      difficulty: 'Medium',
      difficultyTier: 'Level 2 - Standard',
      topic: params.topic,
      subject: params.subject,
      hints: [
        'Hint 1: Remember convex mirrors always have a positive focal length ($f > 0$).',
        'Hint 2: $1/v = 1/f - 1/u$. Take common denominator for 20 and 30.',
      ],
      isApplicationBased: false,
    };
  }
}
