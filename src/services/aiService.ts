import {
  Quiz,
  Exam,
  SavedNote,
  SubjectTeacherMode,
  PhotoAnalysisResult,
  StudyPlan,
  StudyTask,
  QuestionPaper,
  QuestionPaperQuestion,
  ClassLevel,
  BoardType,
  RecommendationItem,
  PersonalLearningSystemData,
  StudentProfile,
  WeakTopic,
  StrongTopic,
  ActivityLog,
} from '../types';
import { SecurityService } from './securityService';
import { aiResponseCache } from '../utils/cache';
import { detectLanguage } from '../utils/languageDetector';

// Enterprise security headers for client API calls
export function getSecureHeaders(endpoint: string, payload?: any): HeadersInit {
  const sessionToken = SecurityService.getOrGenerateSessionToken();
  const idempotencyKey = SecurityService.generateIdempotencyKey(endpoint, payload);
  return {
    'Content-Type': 'application/json',
    'X-Session-Token': sessionToken,
    'X-Idempotency-Key': idempotencyKey,
  };
}

export interface AskAiResponse {
  answer: string;
  isFallback: boolean;
}

export interface AnalyzePhotoResponse {
  analysis: PhotoAnalysisResult;
  isFallback: boolean;
}

export interface SolvePhotoResponse {
  solution: string;
  subjectUsed?: string;
  isFallback: boolean;
}

export interface GenerateNotesResponse {
  notes: string;
  title: string;
  isFallback: boolean;
}

export interface GenerateQuizResponse {
  quiz: Quiz;
  isFallback: boolean;
}

export interface GenerateExamResponse {
  exam: Exam;
  isFallback: boolean;
}

export interface GenerateStudyPlanOptions {
  classLevel?: string;
  selectedSubjects?: string[];
  availableHoursPerDay?: number;
  preferredTimeSlot?: string;
  examDates?: Array<{ id: string; subject: string; title: string; examDate: string }>;
  personalGoals?: string[];
  dailyLearningTarget?: string;
  language?: 'en' | 'hi';
  planMode?: 'standard' | 'focus-weak' | 'exam-prep' | 'quick-revision' | 'improve';
  customPrompt?: string;
  studentData?: {
    quizzesTaken?: number;
    avgScorePercentage?: number;
    examsCompleted?: number;
    weakTopics?: any[];
    xp?: number;
    streakDays?: number;
  };
}

export interface GenerateStudyPlanResponse {
  plan: StudyPlan;
  isFallback: boolean;
}

export interface GenerateQuestionPaperOptions {
  classLevel?: ClassLevel;
  board?: BoardType;
  subject?: string;
  bookName?: string;
  chapterTopic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  totalQuestions?: number;
  totalMarks?: number;
  durationMinutes?: number;
  language?: 'English' | 'Hindi';
  includeNumericals?: boolean;
}

export interface GenerateQuestionPaperResponse {
  paper: QuestionPaper;
  isFallback: boolean;
}

export interface AiStreamCallbacks {
  onChunk: (accumulatedText: string, deltaText: string) => void;
  onComplete: (fullText: string, isFallback: boolean) => void;
  onError: (errorMsg: string) => void;
}

export interface StudentContextOptions {
  classLevel?: string;
  board?: string;
  medium?: string;
  subject?: string;
  book?: string;
  chapter?: string;
  topic?: string;
  language?: string;
}

export interface AiRequestOptions {
  subjectMode?: SubjectTeacherMode;
  studentContext?: StudentContextOptions;
  actionType?: 'explain-simpler' | 'translate-hi' | 'translate-en' | 'make-notes' | 'quiz-me' | 'general';
  history?: Array<{ sender: 'user' | 'ai'; text: string }>;
}

// Fallback generator when offline or server API unavailable
function generateFallbackResponse(question: string, options?: AiRequestOptions): string {
  const mode = options?.subjectMode || 'general';
  const ctx = options?.studentContext || {};
  const classLvl = ctx.classLevel || '10';
  const subject = ctx.subject || 'Academic';
  const detectedLang = options?.actionType === 'translate-hi'
    ? 'hi'
    : options?.actionType === 'translate-en'
    ? 'en'
    : detectLanguage(question, ctx.language || 'en');

  if (detectedLang === 'hi') {
    if (mode === 'maths') {
      return `### 📐 गणित समाधान (कक्षा ${classLvl})

#### 1. दिया गया प्रश्न
* **प्रश्न**: "${question}"
* **लक्ष्य**: चरणबद्ध विधि से सही गणितीय उत्तर ज्ञात करना।

#### 2. प्रयुक्त सूत्र / प्रमेय
* **सूत्र**: संबंधित बीजगणितीय या ज्यामितीय सूत्र लागू करें।

#### 3. चरणबद्ध हल
1. **ज्ञात मान पहचानें**: प्रश्न से दी गई राशियों को लिखें।
2. **मान प्रतिस्थापित करें**: गणना को स्पष्टता से पूरा करें।
3. **उत्तर की पुष्टि करें**: गणना व इकाई की जांच करें।

#### 4. अंतिम उत्तर
**उत्तर**: $\\mathbf{सत्यापित\\ हल\\ तैयार\\ है}$`;
    }

    return `### 📚 AI शिक्षक व्याख्या (कक्षा ${classLvl})

नमस्ते! आपके प्रश्न का सरल और स्पष्ट विवरण यहाँ है: **"${question}"**

#### 1. मुख्य अवधारणा
कक्षा ${classLvl} ${subject} के पाठ्यक्रम के अनुसार यह एक महत्वपूर्ण विषय है।

#### 2. महत्वपूर्ण बिंदु
* **पहला चरण**: मूल परिभाषा और सिद्धांतों को समझें।
* **दूसरा चरण**: इसे वास्तविक उदाहरणों व अभ्यास प्रश्नों पर लागू करें।
* **तीसरा चरण**: मुख्य सूत्रों और नियमों को याद रखें।

#### 3. परीक्षा हेतु सुझाव
1. मुख्य परिभाषाओं और सूत्रों का नियमित अभ्यास करें।
2. पिछले वर्षों के प्रश्नों को हल करें।`;
  }

  if (detectedLang === 'hinglish') {
    return `### 📚 AI Teacher Explanation (Class ${classLvl})

Hello! Aapke question **"${question}"** ka simple aur clear explanation yahan hai:

#### 1. Main Concept
Class ${classLvl} ${subject} me yeh concept bohot important aur scoring hai.

#### 2. Step-by-Step Breakdown
* **Step 1**: Pehle basic definition aur rule ko samjhein.
* **Step 2**: Formula ya concept ko step-by-step apply karein.
* **Step 3**: Real-world examples ke sath relate karein.

#### 3. Exam Tips & Quick Revision
1. Main formulas aur definitions ko yaad rakhein.
2. Step-by-step calculations likhein taaki full marks milein!`;
  }

  if (mode === 'maths') {
    return `### 📐 Mathematics Solution (Class ${classLvl})

#### 1. Given & Problem Statement
* **Question**: "${question}"
* **Target**: Calculate or verify the mathematical solution step-by-step.

#### 2. Formula / Rule
* **Standard Equation / Law**: $y = f(x)$ or relevant algebraic formula.

#### 3. Step-by-Step Solution
1. **Identify Knowns**: Set up parameters derived from the problem statement.
2. **Substitute Values**: Perform careful line-by-line algebraic simplification.
3. **Verify Computation**: Double check sign conventions and arithmetic operations.

#### 4. Final Answer
**Result**: $\\mathbf{Calculated\\ Solution\\ Verified}$`;
  }

  if (mode === 'science') {
    return `### 🔬 Science Explanation (Class ${classLvl} ${subject})

#### 1. Core Concept Overview
The phenomenon behind **"${question}"** relies on core principles of Class ${classLvl} ${subject}.

#### 2. Process & Mechanism
1. **Initiation**: Primary condition triggering the scientific mechanism.
2. **Intermediate Stage**: Energy transformation or chemical/physical interaction.
3. **Outcome**: Final product or observable state.

#### 3. Real-World Examples
* **Everyday Analogy**: Like water flowing through a piped system under pressure.

#### 4. Important Points for Exams
* **Key Definition**: Always state the exact textbook definition first.
* **Common Pitfall**: Watch out for unit conversions!`;
  }

  return `### 📚 AI Learning Assistant Explanation

Hello! Here is a simple, structured breakdown for: **"${question}"**

#### 1. Conceptual Overview
In Class ${classLvl} ${subject}, this topic is essential for building a strong academic foundation.

#### 2. Key Step-by-Step Details
* **Step 1**: Understand the basic rule or definition.
* **Step 2**: Apply the principle to real-world scenarios or textbook problems.
* **Step 3**: Summarize key formulas, dates, or grammar rules.

#### 3. Practice & Key Takeaways
1. Memorize main definitions and equations.
2. Practice similar board exam questions.

*Tip: Try clicking the "Make notes" or "Create quiz" action buttons below!*`;
}

function simulateFallbackStream(
  text: string,
  callbacks: AiStreamCallbacks,
  signal?: AbortSignal
) {
  const words = text.split(' ');
  let current = '';
  let index = 0;

  const interval = setInterval(() => {
    if (signal?.aborted) {
      clearInterval(interval);
      callbacks.onComplete(current + '\n\n*(Generation stopped)*', true);
      return;
    }

    if (index >= words.length) {
      clearInterval(interval);
      callbacks.onComplete(text, true);
      return;
    }

    const nextWord = words[index] + (index === words.length - 1 ? '' : ' ');
    current += nextWord;
    callbacks.onChunk(current, nextWord);
    index++;
  }, 30);
}

export const AiService = {
  // 1. Stream response (Real-time SSE token by token)
  async streamResponse(
    question: string,
    options: AiRequestOptions,
    callbacks: AiStreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    let accumulated = '';
    try {
      const response = await fetch('/api/ai/stream-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          subjectMode: options.subjectMode || 'general',
          studentContext: options.studentContext || {},
          actionType: options.actionType,
          history: options.history || [],
        }),
        signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            callbacks.onComplete(accumulated, false);
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              accumulated += parsed.text;
              callbacks.onChunk(accumulated, parsed.text);
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // ignore partial JSON parse error
          }
        }
      }

      callbacks.onComplete(accumulated || 'No response generated.', false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        callbacks.onComplete(accumulated + '\n\n*(Generation stopped)*', false);
        return;
      }
      console.warn('Streaming API call failed, switching to fallback simulation:', err);
      const fallbackText = generateFallbackResponse(question, options);
      simulateFallbackStream(fallbackText, callbacks, signal);
    }
  },

  // 2. Send Message (Non-streaming fallback/wrapper with caching & AbortSignal)
  async sendMessage(question: string, options: AiRequestOptions, signal?: AbortSignal): Promise<AskAiResponse> {
    const cacheKey = `ask:${options.subjectMode || 'gen'}:${question.trim().toLowerCase()}:${options.actionType || 'none'}`;
    const cached = aiResponseCache.get(cacheKey);
    if (cached) {
      return { answer: cached, isFallback: false };
    }

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          subjectMode: options.subjectMode || 'general',
          studentContext: options.studentContext || {},
          actionType: options.actionType,
          history: options.history || [],
        }),
        signal,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.answer) {
          aiResponseCache.set(cacheKey, data.answer);
          return { answer: data.answer, isFallback: false };
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { answer: '*(Request cancelled)*', isFallback: false };
      }
      console.warn('Backend API request failed, using fallback tutor response:', err);
    }

    return { answer: generateFallbackResponse(question, options), isFallback: true };
  },

  // 3. Regenerate Response
  async regenerateResponse(
    question: string,
    options: AiRequestOptions,
    callbacks: AiStreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    return this.streamResponse(question, options, callbacks, signal);
  },

  // 4. Explain Simpler
  async explainSimpler(
    question: string,
    options: AiRequestOptions,
    callbacks: AiStreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    return this.streamResponse(question, { ...options, actionType: 'explain-simpler' }, callbacks, signal);
  },

  // 5. Translate Response
  async translateResponse(
    question: string,
    targetLanguage: 'hi' | 'en',
    options: AiRequestOptions,
    callbacks: AiStreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const actionType = targetLanguage === 'hi' ? 'translate-hi' : 'translate-en';
    return this.streamResponse(question, { ...options, actionType }, callbacks, signal);
  },

  // 6. Ask Question (Legacy compatibility)
  async askQuestion(
    question: string,
    options?: {
      subject?: string;
      classLevel?: string;
      language?: string;
      explanationStyle?: string;
    }
  ): Promise<AskAiResponse> {
    return this.sendMessage(question, {
      studentContext: {
        subject: options?.subject,
        classLevel: options?.classLevel,
        language: options?.language,
      },
    });
  },

  // 7a. Analyze Photo (OCR, subject detection, multiple questions, diagrams)
  async analyzePhoto(
    imageBase64: string,
    options?: {
      mimeType?: string;
      classLevel?: string;
      language?: string;
    }
  ): Promise<AnalyzePhotoResponse> {
    try {
      const res = await fetch('/api/ai/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: options?.mimeType || 'image/jpeg',
          classLevel: options?.classLevel || '10',
          language: options?.language || 'en',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          return { analysis: data.analysis, isFallback: false };
        }
      }
    } catch (err) {
      console.warn('Photo analyze API failed, using fallback:', err);
    }

    // Fallback extraction
    return {
      analysis: {
        detectedSubject: 'General',
        hasDiagram: false,
        diagramDescription: null,
        questions: [
          {
            id: 'q1',
            questionNumber: 'Q1',
            extractedText: 'Sample extracted question from image. Please verify or edit.',
            subject: 'Science',
            topic: 'General Topic',
          },
        ],
        rawOcrText: 'Sample extracted question text.',
      },
      isFallback: true,
    };
  },

  // 7b. Solve Photo Problem
  async solvePhoto(
    imageBase64: string | null,
    options?: {
      questionText?: string;
      additionalNotes?: string;
      subject?: string;
      classLevel?: string;
      language?: string;
      hasDiagram?: boolean;
      diagramDescription?: string;
      mimeType?: string;
    }
  ): Promise<SolvePhotoResponse> {
    try {
      const res = await fetch('/api/ai/solve-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64 || '',
          mimeType: options?.mimeType || 'image/jpeg',
          questionText: options?.questionText || '',
          additionalNotes: options?.additionalNotes || '',
          subject: options?.subject || 'Science',
          classLevel: options?.classLevel || '10',
          language: options?.language || 'en',
          hasDiagram: options?.hasDiagram || false,
          diagramDescription: options?.diagramDescription || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.solution) {
          return { solution: data.solution, subjectUsed: data.subjectUsed || options?.subject, isFallback: false };
        }
      }
    } catch (err) {
      console.warn('Photo solver API call failed, falling back:', err);
    }

    const subj = options?.subject || 'Science';
    const isMath = subj.toLowerCase().includes('math');

    const fallbackSolution = isMath
      ? `### 📐 Given
* **Problem**: ${options?.questionText || 'Quadratic Equation Solution'}
* **Values**: Given parameters from image/problem statement

### 🎯 Required
* Calculate exact values step-by-step.

### ⚡ Formula
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

### 📝 Steps
1. Identify coefficients $a, b, c$.
2. Calculate Discriminant $D = b^2 - 4ac$.
3. Substitute into formula to derive solutions.

### ✅ Final Answer
**$x = 3$ or $x = 0.5$**`
      : `### 🔬 Concept
* **Core Principle**: Fundamental mechanism in ${subj} (Class ${options?.classLevel || '10'})

### 💡 Explanation
Detailed step-by-step breakdown explaining: "${options?.questionText || 'Concept explanation'}"

### 📌 Important Points
* **Point 1**: Key definition to write in exam paper.
* **Point 2**: Important units and formulas.

### ✅ Answer
**Complete, accurate solution to full marks standard.**`;

    return { solution: fallbackSolution, subjectUsed: subj, isFallback: true };
  },

  // 8. Generate Notes
  async generateNotes(
    topic: string,
    options?: {
      chapter?: string;
      subject?: string;
      classLevel?: string;
      language?: string;
      sourceType?: 'topic' | 'photo' | 'conversation';
      questionText?: string;
      conversationText?: string;
      imageBase64?: string | null;
      mimeType?: string;
    }
  ): Promise<GenerateNotesResponse> {
    try {
      const res = await fetch('/api/ai/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          chapter: options?.chapter || topic,
          subject: options?.subject || 'Science',
          classLevel: options?.classLevel || '10',
          language: options?.language || 'en',
          sourceType: options?.sourceType || 'topic',
          questionText: options?.questionText,
          conversationText: options?.conversationText,
          imageBase64: options?.imageBase64,
          mimeType: options?.mimeType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.notes) {
          return { notes: data.notes, title: data.title || topic, isFallback: false };
        }
      }
    } catch (err) {
      console.warn('Generate notes API failed, using fallback:', err);
    }

    const isHindi = options?.language === 'hi' || options?.language === 'Hindi';
    const subj = options?.subject || 'Science';
    const cls = options?.classLevel || '10';

    const fallbackNotes = isHindi
      ? `# ${subj} - ${topic} (Class ${cls})

### 📌 संक्षेप (Short Summary)
${topic} बोर्ड परीक्षा के दृष्टिकोण से अत्यंत महत्त्वपूर्ण अध्याय है। इसमें प्रमुख अवधारणाओं और मूलभूत सिद्धांतों को सरल रूप में समझाया गया है।

### 🎯 मुख्य बिंदु (Key Points)
- ${topic} के मूलभूत सिद्धांत और नियम परीक्षा में बार-बार पूछे जाते हैं।
- मुख्य प्रक्रिया एवं सिद्धांतों का नियमबद्ध पालन करना आवश्यक है।
- परिभाषाओं एवं समीकरणों का सटीक उपयोग करें।
- सिद्धांतों को उदाहरणों के माध्यम से याद रखें।

### 📚 महत्त्वपूर्ण परिभाषाएँ (Important Definitions)
- **मूल अवधारणा**: वह प्राथमिक सिद्धांत जिस पर यह विषय आधारित है।
- **मुख्य कारक**: वे घटक जो प्रक्रिया की दर एवं परिणाम को प्रभावित करते हैं।

### ⚡ सूत्र एवं नियम (Formulas & Rules)
- **मुख्य सूत्र**: \`परिणाम = इनपुट × गुणांक\`
- **मूल नियम**: ऊर्जा एवं द्रव्यमान के संरक्षण का नियम लागू होता है।

### 💡 उदाहरण (Examples)
- **उदाहरण 1**: दैनिक जीवन में ${topic} का व्यावहारिक अनुप्रयोग।
- **उदाहरण 2**: प्रयोगशाला एवं औद्योगिक क्षेत्र में इसका उपयोग।

### ❓ महत्त्वपूर्ण प्रश्न (Important Questions)
1. **प्रश्न: ${topic} की मुख्य परिभाषा क्या है?**
   **उत्तर:** यह वह प्रक्रिया है जिसके द्वारा तंत्र में ऊर्जा तथा पदार्थ का परिवर्तन होता है।
2. **प्रश्न: इसका मुख्य अनुप्रयोग कहाँ होता है?**
   **उत्तर:** इसका उपयोग दैनिक जीवन एवं वैज्ञानिक अनुसंधान में व्यापक रूप से होता है।

### ⚡ त्वरित पुनरावृत्ति (Quick Revision)
- ⚡ ${topic} का अध्ययन करते समय मुख्य सूत्र याद रखें।
- ⚡ परिभाषाओं को सटीक शब्दों में लिखें।
- ⚡ अभ्यास प्रश्नों को हल करके अपनी तैयारी मजबूत करें।`
      : `# ${subj} - ${topic} (Class ${cls})

### 📌 Short Summary
${topic} is a key concept in the Class ${cls} curriculum. Mastering these core principles prepares students for both school assessments and board exams.

### 🎯 Key Points
- Fundamental laws and definitions governing ${topic}.
- Step-by-step mechanisms and conceptual interactions.
- Exam-oriented problem solving techniques.
- Common errors to avoid during answer writing.

### 📚 Important Definitions
- **Core Principle**: The baseline scientific/mathematical rule governing this process.
- **Key Factor**: Primary variables influencing the rate and output of this phenomenon.

### ⚡ Formulas & Key Rules
- **Primary Formula**: \`Result = Input × Conservation Multiplier\`
- **Fundamental Law**: Conservation and equilibrium laws apply across standard closed systems.

### 💡 Examples
- **Example 1**: Practical application observed in everyday household phenomena.
- **Example 2**: Industrial and laboratory implementation of ${topic}.

### ❓ Important Questions
1. **Q**: What is the main definition of ${topic}?**
   **A:** It refers to the fundamental process governing transformations and balance in the system.
2. **Q**: Mention two key real-world applications.**
   **A:** Used in technological design and environmental science analysis.

### ⚡ Quick Revision
- ⚡ Remember core definitions with key keywords.
- ⚡ Practice numerical steps line-by-line.
- ⚡ Review summary bullet points before tests.`;

    return { notes: fallbackNotes, title: `${subj} - ${topic}`, isFallback: true };
  },

  // 9. Generate Quiz
  async generateQuiz(
    topic: string,
    options?: {
      subject?: string;
      chapter?: string;
      classLevel?: string;
      questionCount?: number;
      difficulty?: 'Easy' | 'Medium' | 'Hard';
      language?: string;
      sourceType?: 'topic' | 'note' | 'photo';
      sourceTitle?: string;
      sourceContent?: string;
      questionTypes?: string[];
    }
  ): Promise<GenerateQuizResponse> {
    const qCount = options?.questionCount || 5;
    const isHindi = options?.language === 'hi' || options?.language === 'Hindi';
    const langLabel = isHindi ? 'Hindi' : 'English';

    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          chapter: options?.chapter || topic,
          subject: options?.subject || 'Science',
          classLevel: options?.classLevel || '10',
          questionCount: qCount,
          difficulty: options?.difficulty || 'Medium',
          language: langLabel,
          sourceType: options?.sourceType || 'topic',
          sourceTitle: options?.sourceTitle,
          sourceContent: options?.sourceContent,
          questionTypes: options?.questionTypes || ['mcq', 'true_false', 'fill_in_blank', 'short_answer'],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.quiz && data.quiz.questions) {
          return { quiz: data.quiz, isFallback: false };
        }
      }
    } catch (err) {
      console.warn('Generate quiz API failed, returning fallback quiz:', err);
    }

    // Comprehensive multi-format fallback quiz generator
    const sampleQuestions: any[] = [];
    const subj = options?.subject || 'Science';
    const diff = options?.difficulty || 'Medium';

    // Generate requested count of questions
    for (let i = 1; i <= qCount; i++) {
      const typeIndex = (i - 1) % 4;
      if (typeIndex === 0) {
        // MCQ
        sampleQuestions.push({
          id: `q-${i}`,
          question: isHindi
            ? `प्रश्न ${i}: ${topic} के संदर्भ में कौन सा कथन सही है?`
            : `Question ${i}: Which of the following statements accurately applies to ${topic}?`,
          options: isHindi
            ? [
                `यह विषय ${subj} की मूलभूत अवधारणाओं का पालन करता है।`,
                `यह ऊर्जा तथा द्रव्यमान संरक्षण के नियमों को नकारता है।`,
                `यह केवल शून्य ताप पर ही लागू होता है।`,
                `उपर्युक्त में से कोई नहीं।`,
              ]
            : [
                `It governs core fundamental principles of Class ${options?.classLevel || '10'} ${subj}.`,
                `It violates the law of conservation of energy.`,
                `It only applies at absolute zero temperature.`,
                `None of the above statements.`,
              ],
          correctIndex: 0,
          correctAnswer: isHindi ? `यह विषय ${subj} की मूलभूत अवधारणाओं का पालन करता है।` : `It governs core fundamental principles of Class ${options?.classLevel || '10'} ${subj}.`,
          explanation: isHindi
            ? `सही उत्तर विकल्प (A) है। यह अवधारणा कक्षा ${options?.classLevel || '10'} पाठ्यक्रम का मुख्य आधार है।`
            : `Correct choice is Option A. This is a core concept tested in board exams.`,
          hint: isHindi ? `पाठ्यपुस्तक की मुख्य परिभाषा को याद करें.` : `Think about standard textbook principles.`,
          difficulty: diff,
          topic,
          questionType: 'mcq',
        });
      } else if (typeIndex === 1) {
        // True / False
        sampleQuestions.push({
          id: `q-${i}`,
          question: isHindi
            ? `प्रश्न ${i}: कथन: ${topic} में दी गई प्रक्रिया हमेशा ऊर्जा संरक्षण नियम का पालन करती है। (सत्य/असत्य)`
            : `Question ${i}: Statement: The phenomenon involved in ${topic} strictly obeys the Law of Conservation of Energy. (True/False)`,
          options: isHindi ? ['सत्य (True)', 'असत्य (False)'] : ['True', 'False'],
          correctIndex: 0,
          correctAnswer: isHindi ? 'सत्य (True)' : 'True',
          explanation: isHindi
            ? `यह कथन पूर्णतः सत्य है। सभी प्राकृतिक भौतिक/रासायनिक प्रक्रियाएं ऊर्जा संरक्षण नियम का पालन करती हैं।`
            : `This statement is True. Isolated systems always conserve total energy.`,
          hint: isHindi ? `क्या ऊर्जा को नष्ट किया जा सकता है?` : `Can energy be created or destroyed?`,
          difficulty: diff,
          topic,
          questionType: 'true_false',
        });
      } else if (typeIndex === 2) {
        // Fill in the blank
        sampleQuestions.push({
          id: `q-${i}`,
          question: isHindi
            ? `प्रश्न ${i}: ${topic} के अध्ययन में एस.आई. (S.I.) मात्रक __________ है।`
            : `Question ${i}: The standard SI unit used when measuring output in ${topic} is __________.`,
          options: isHindi
            ? ['न्यूटन / जूल (Joules/Newtons)', 'पास्कल (Pascal)', 'वाट (Watt)', 'एम्पियर (Ampere)']
            : ['Joule / Newton', 'Pascal', 'Watt', 'Ampere'],
          correctIndex: 0,
          correctAnswer: isHindi ? 'न्यूटन / जूल (Joules/Newtons)' : 'Joule / Newton',
          explanation: isHindi
            ? `सही उत्तर 'न्यूटन / जूल' है। भौतिक एवं रासायनिक गणनाओं में यह मानक मात्रक है।`
            : `The standard unit for energy/force measurement in this chapter is Joules/Newtons.`,
          hint: isHindi ? `ऊर्जा या बल का मानक मात्रक.` : `Named after famous physicists.`,
          difficulty: diff,
          topic,
          questionType: 'fill_in_blank',
        });
      } else {
        // Short Answer
        sampleQuestions.push({
          id: `q-${i}`,
          question: isHindi
            ? `प्रश्न ${i}: ${topic} की मुख्य परिभाषा तथा इसका एक व्यावहारिक अनुप्रयोग लिखें।`
            : `Question ${i}: State the key definition of ${topic} and mention one practical real-world application.`,
          options: [],
          correctAnswer: isHindi
            ? `${topic} वह प्रक्रिया या नियम है जिसके द्वारा निकाय की अवस्था में परिवर्तन होता है। अनुप्रयोग: दैनिक जीवन एवं तकनीकी उपकरणों में।`
            : `${topic} refers to the fundamental mechanism governing systems in Class ${options?.classLevel || '10'} ${subj}. Application: Used in engineering and daily life.`,
          explanation: isHindi
            ? `पूर्ण अंक हेतु सटीक परिभाषा तथा एक सुसंगत व्यावहारिक उदाहरण लिखना आवश्यक है।`
            : `To score full marks, write the exact textbook definition followed by a real-world example.`,
          hint: isHindi ? `परिभाषा + उदाहरण` : `State definition + one example.`,
          difficulty: diff,
          topic,
          questionType: 'short_answer',
        });
      }
    }

    const fallbackQuiz: Quiz = {
      id: `qz-${Date.now()}`,
      title: `${subj}: ${topic} AI Quiz`,
      subjectId: subj,
      chapterName: options?.chapter || topic,
      topicName: topic,
      difficulty: diff,
      questionCount: qCount,
      language: langLabel,
      sourceType: options?.sourceType || 'topic',
      sourceTitle: options?.sourceTitle || topic,
      rewardXp: Math.min(200, qCount * 15),
      createdDate: new Date().toISOString(),
      questions: sampleQuestions,
    };

    return { quiz: fallbackQuiz, isFallback: true };
  },

  // 10. Generate Exam Paper
  async generateExam(options?: {
    subject?: string;
    classLevel?: string;
    board?: string;
    chapterTopics?: string;
    chapterList?: string[];
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    questionCount?: number;
    language?: string;
    durationMinutes?: number;
  }): Promise<GenerateExamResponse> {
    const qCount = options?.questionCount || 10;
    const isHindi = options?.language === 'hi' || options?.language === 'Hindi' || options?.language === 'हिंदी';
    const langLabel = isHindi ? 'Hindi' : 'English';
    const subj = options?.subject || 'Science';
    const boardName = options?.board || 'CBSE';
    const clsLevel = options?.classLevel || '10';
    const diff = options?.difficulty || 'Medium';
    const topics = options?.chapterTopics || (options?.chapterList && options.chapterList.length > 0 ? options.chapterList.join(', ') : 'Full Syllabus');
    const durMins = options?.durationMinutes || Math.max(10, qCount * 2);

    try {
      const res = await fetch('/api/ai/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subj,
          classLevel: clsLevel,
          board: boardName,
          chapterTopics: topics,
          chapterList: options?.chapterList || [],
          difficulty: diff,
          questionCount: qCount,
          language: langLabel,
          durationMinutes: durMins,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.exam && data.exam.questions) {
          return { exam: data.exam, isFallback: false };
        }
      }
    } catch (err) {
      console.warn('Generate exam API failed, returning fallback exam:', err);
    }

    // Dynamic Fallback Exam Paper
    const mcqCount = Math.ceil(qCount / 2);
    const subjectiveCount = qCount - mcqCount;
    const sampleQuestions: any[] = [];

    // Section A: MCQs
    for (let i = 1; i <= mcqCount; i++) {
      sampleQuestions.push({
        id: `ex-q${i}`,
        section: isHindi ? 'खंड अ (बहुविकल्पीय)' : 'Section A (MCQ)',
        type: 'mcq',
        marks: 2,
        question: isHindi
          ? `प्रश्न ${i}: ${subj} (कक्षा ${clsLevel}) के अंतर्गत '${topics}' से संबंधित कौन सा विकल्प सही है?`
          : `Question ${i}: Which option correctly applies to '${topics}' in Class ${clsLevel} ${subj}?`,
        options: isHindi
          ? [
              `यह ${subj} का मूलभूत सिद्धांत है।`,
              `यह ऊर्जा संरक्षण नियम का उल्लंघन करता है।`,
              `यह केवल प्रयोगशाला में ही लागू होता है।`,
              `इनमें से कोई नहीं।`,
            ]
          : [
              `It governs standard fundamental principles of ${subj}.`,
              `It violates energy conservation principles.`,
              `It is restricted only to laboratory conditions.`,
              `None of the above.`,
            ],
        correctAnswer: isHindi ? `यह ${subj} का मूलभूत सिद्धांत है।` : `It governs standard fundamental principles of ${subj}.`,
        explanation: isHindi
          ? `विकल्प (A) सही उत्तर है। यह कक्षा ${clsLevel} परीक्षा बोर्ड पैटर्न के अनुरूप है।`
          : `Option A is correct. This aligns with Class ${clsLevel} board exam curriculum.`,
      });
    }

    // Section B: Short Answer Questions
    for (let j = 1; j <= subjectiveCount; j++) {
      const qNum = mcqCount + j;
      sampleQuestions.push({
        id: `ex-q${qNum}`,
        section: isHindi ? 'खंड ब (लघु उत्तरीय)' : 'Section B (Short Answer)',
        type: 'subjective',
        marks: 5,
        question: isHindi
          ? `प्रश्न ${qNum}: '${topics}' के संबंध में मुख्य अवधारणा की व्याख्या करें और एक उदाहरण दें।`
          : `Question ${qNum}: Explain the core principle of '${topics}' and give one real-world application.`,
        sampleAnswer: isHindi
          ? `${topics} एक मुख्य शैक्षणिक अवधारणा है। उदाहरण: दैनिक जीवन तथा व्यावहारिक अनुप्रयोगों में।`
          : `${topics} is a key concept in Class ${clsLevel} ${subj}. Application: Widely utilized in daily life and technology.`,
        explanation: isHindi
          ? `सटीक परिभाषा तथा एक सही उदाहरण लिखने पर पूर्ण 5 अंक दिए जाएंगे।`
          : `Full 5 marks awarded for writing exact definition followed by a valid example.`,
      });
    }

    const totalM = mcqCount * 2 + subjectiveCount * 5;

    const fallbackExam: Exam = {
      id: `ex-${Date.now()}`,
      title: `${boardName} Class ${clsLevel} ${subj} Mock Paper`,
      subjectId: subj,
      board: boardName as any,
      classLevel: clsLevel as any,
      durationMinutes: durMins,
      totalMarks: totalM,
      passingMarks: Math.round(totalM * 0.4),
      rewardXp: totalM * 3,
      instructions: isHindi
        ? [
            'सभी प्रश्न अनिवार्य हैं।',
            'खंड अ में बहुविकल्पीय प्रश्न (MCQs) तथा खंड ब में लघु उत्तरीय प्रश्न शामिल हैं।',
            'समय सीमा का विशेष ध्यान रखें।',
          ]
        : [
            'All questions are compulsory.',
            'Section A contains MCQs (2 marks each) and Section B contains Short Answer questions (5 marks each).',
            'Keep track of the countdown timer.',
          ],
      questions: sampleQuestions,
    };

    return { exam: fallbackExam, isFallback: true };
  },

  // 11. Generate Study Plan
  async generateStudyPlan(options?: GenerateStudyPlanOptions): Promise<GenerateStudyPlanResponse> {
    const isHindi = options?.language === 'hi' || (options?.language as unknown as string) === 'Hindi';
    const classLvl = options?.classLevel || '10';
    const hours = options?.availableHoursPerDay || 3;
    const subjects = options?.selectedSubjects || ['Science', 'Mathematics', 'English'];

    try {
      const res = await fetch('/api/ai/generate-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classLevel: classLvl,
          selectedSubjects: subjects,
          availableHoursPerDay: hours,
          preferredTimeSlot: options?.preferredTimeSlot || 'Evening (5 PM - 8 PM)',
          examDates: options?.examDates || [],
          personalGoals: options?.personalGoals || [],
          dailyLearningTarget: options?.dailyLearningTarget || '3 Tasks & 100 XP',
          language: isHindi ? 'hi' : 'en',
          planMode: options?.planMode || 'standard',
          customPrompt: options?.customPrompt || '',
          studentData: options?.studentData || {},
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.plan && data.plan.tasks) {
          const fullPlan: StudyPlan = {
            id: `plan-${Date.now()}`,
            classLevel: classLvl as any,
            selectedSubjects: subjects,
            availableHoursPerDay: hours,
            preferredTimeSlot: options?.preferredTimeSlot || 'Evening (5 PM - 8 PM)',
            examDates: options?.examDates || [],
            personalGoals: options?.personalGoals || [],
            dailyLearningTarget: options?.dailyLearningTarget || '3 Tasks & 100 XP',
            language: isHindi ? 'hi' : 'en',
            startDate: new Date().toISOString().split('T')[0],
            targetExamDate: options?.examDates?.[0]?.examDate || '2026-11-15',
            weeklyGoalHours: data.plan.weeklyGoalHours || hours * 7,
            tasks: data.plan.tasks,
            aiAdviceNote: data.plan.aiAdviceNote,
            updatedAt: new Date().toISOString(),
          };
          return { plan: fullPlan, isFallback: false };
        }
      }
    } catch (err) {
      console.warn('Generate planner API failed, using intelligent fallback planner:', err);
    }

    // Comprehensive Fallback Plan Generator
    const fallbackTasks: StudyTask[] = [];
    const mainSubject = subjects[0] || 'Science';
    const secondSubject = subjects[1] || 'Mathematics';
    const thirdSubject = subjects[2] || 'English';

    const weakTopics = options?.studentData?.weakTopics || [];
    let taskId = 1;

    // Weak Topic High Priority Task
    if (weakTopics.length > 0) {
      const wt = weakTopics[0];
      fallbackTasks.push({
        id: `st-${taskId++}`,
        title: isHindi
          ? `कमजोर विषय समाधान: ${wt.subjectName} - ${wt.topicName || wt.chapterName} की संकल्पना समझें`
          : `Weak Topic Mastery: Review ${wt.subjectName} - ${wt.topicName || wt.chapterName}`,
        subjectName: wt.subjectName || mainSubject,
        topicName: wt.topicName || wt.chapterName,
        startTime: '05:00 PM',
        estimatedMinutes: 45,
        priority: 'High',
        completed: false,
        taskType: 'Weak Topic Fix',
        dayOfWeek: 'Today',
        dueDate: 'Today',
      });
    }

    // Core Subject Revision Task
    fallbackTasks.push({
      id: `st-${taskId++}`,
      title: isHindi
        ? `${mainSubject}: अध्याय के मुख्य सूत्रों का पुनरावलोकन`
        : `Revise ${mainSubject} Core Chapter Formulas & Notes`,
      subjectName: mainSubject,
      topicName: 'Formula & Concept Review',
      startTime: '06:00 PM',
      estimatedMinutes: 30,
      priority: 'High',
      completed: false,
      taskType: 'Revision',
      dayOfWeek: 'Today',
      dueDate: 'Today',
    });

    // Quiz Practice Task
    fallbackTasks.push({
      id: `st-${taskId++}`,
      title: isHindi
        ? `${secondSubject}: 10 मिनट की AI प्रश्नोत्तरी हल करें`
        : `Solve 10-Min AI Quick Practice Quiz on ${secondSubject}`,
      subjectName: secondSubject,
      topicName: 'Algebra & Concepts',
      startTime: '06:45 PM',
      estimatedMinutes: 20,
      priority: 'Medium',
      completed: false,
      taskType: 'Quiz',
      dayOfWeek: 'Today',
      dueDate: 'Today',
    });

    // Tomorrow Tasks
    fallbackTasks.push({
      id: `st-${taskId++}`,
      title: isHindi
        ? `${thirdSubject}: पाठ्यपुस्तक अध्याय पाठन एवं व्याकरण अभ्यास`
        : `Read ${thirdSubject} Textbook Lesson & Grammar Rules`,
      subjectName: thirdSubject,
      topicName: 'Reading & Grammar',
      startTime: '05:30 PM',
      estimatedMinutes: 40,
      priority: 'Medium',
      completed: false,
      taskType: 'Lesson',
      dayOfWeek: 'Tomorrow',
      dueDate: 'Tomorrow',
    });

    fallbackTasks.push({
      id: `st-${taskId++}`,
      title: isHindi
        ? `${mainSubject}: बोर्ड परीक्षा मॉक पेपर हल करें`
        : `Take ${mainSubject} Board Exam Practice Paper`,
      subjectName: mainSubject,
      topicName: 'Board Exam Paper',
      startTime: '06:30 PM',
      estimatedMinutes: 60,
      priority: 'High',
      completed: false,
      taskType: 'Exam Practice',
      dayOfWeek: 'Tomorrow',
      dueDate: 'Tomorrow',
    });

    // Weekly Tasks (Monday - Sunday)
    const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'> = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    days.forEach((day, idx) => {
      const subj = subjects[idx % subjects.length] || mainSubject;
      fallbackTasks.push({
        id: `st-${taskId++}`,
        title: isHindi
          ? `${subj}: अध्याय स्वाध्याय एवं अभ्यास प्रश्न`
          : `Self Study & Practice Exercise for ${subj}`,
        subjectName: subj,
        topicName: `Unit ${idx + 1} Review`,
        startTime: '05:00 PM',
        estimatedMinutes: 45,
        priority: idx % 2 === 0 ? 'High' : 'Medium',
        completed: false,
        taskType: idx % 3 === 0 ? 'Revision' : idx % 3 === 1 ? 'Quiz' : 'Lesson',
        dayOfWeek: day,
        dueDate: day,
      });
    });

    const fallbackPlan: StudyPlan = {
      id: `plan-${Date.now()}`,
      classLevel: classLvl as any,
      selectedSubjects: subjects,
      availableHoursPerDay: hours,
      preferredTimeSlot: options?.preferredTimeSlot || 'Evening (5 PM - 8 PM)',
      examDates: options?.examDates || [],
      personalGoals: options?.personalGoals || [],
      dailyLearningTarget: options?.dailyLearningTarget || '3 Tasks & 100 XP',
      language: isHindi ? 'hi' : 'en',
      startDate: new Date().toISOString().split('T')[0],
      targetExamDate: options?.examDates?.[0]?.examDate || '2026-11-15',
      weeklyGoalHours: hours * 7,
      tasks: fallbackTasks,
      aiAdviceNote: isHindi
        ? `यह योजना आपकी प्राथमिकता वाली पढ़ाई समय-सारणी के अनुसार कक्षा ${classLvl} के लिए स्वचालित रूप से तैयार की गई है।`
        : `This plan is tailored for Class ${classLvl} with target tasks matching your preferred study slot and weak topics.`,
      updatedAt: new Date().toISOString(),
    };

    return { plan: fallbackPlan, isFallback: true };
  },

  // Generate Question Paper
  async generateQuestionPaper(
    options: GenerateQuestionPaperOptions
  ): Promise<GenerateQuestionPaperResponse> {
    try {
      const response = await fetch('/api/ai/generate-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.paper && Array.isArray(data.paper.questions) && data.paper.questions.length > 0) {
          return { paper: data.paper, isFallback: false };
        }
      }
    } catch (err) {
      console.warn('Backend API unavailable for Question Paper generation, generating fallback paper:', err);
    }

    // Fallback Paper Generator
    const classLvl = options.classLevel || '10';
    const board = options.board || 'CBSE';
    const subj = options.subject || 'Science';
    const book = options.bookName || 'NCERT';
    const topic = options.chapterTopic || 'General Chapter Syllabus';
    const diff = options.difficulty || 'Mixed';
    const totalMarks = options.totalMarks || 40;
    const duration = options.durationMinutes || 60;
    const lang = options.language || 'English';
    const isHindi = lang === 'Hindi';

    const questions: QuestionPaperQuestion[] = [
      // Section A: MCQs
      {
        id: `qp-q1-${Date.now()}`,
        questionNumber: 1,
        section: 'Section A',
        type: 'mcq',
        typeLabel: isHindi ? 'बहुविकल्पीय प्रश्न (MCQ)' : 'Multiple Choice Question',
        marks: 1,
        question: isHindi
          ? `${topic} के संदर्भ में निम्नलिखित में से कौन सा कथन सही है?`
          : `Which of the following principles correctly applies to ${topic} in ${subj}?`,
        options: isHindi
          ? [
              'विकल्प A: यह मौलिक नियम का सटीक रूप से पालन करता है',
              'विकल्प B: यह केवल आदर्श परिस्थितियों में ही लागू होता है',
              'विकल्प C: यह नियतांक मान को बदल देता है',
              'विकल्प D: उपरोक्त में से कोई नहीं'
            ]
          : [
              'Option A: It strictly obeys the fundamental governing law',
              'Option B: It applies only under ideal experimental conditions',
              'Option C: It reduces the systemic constant value',
              'Option D: None of the above'
            ],
        correctOptionIndex: 0,
        answerKey: isHindi
          ? 'सही उत्तर (A): मौलिक नियम का पालन करता है।'
          : 'Correct Answer (A): It strictly obeys the fundamental governing law.',
        markingScheme: [isHindi ? '+1 अंक सही विकल्प चुनने पर' : '+1 mark for selecting correct option A'],
        difficulty: 'Easy',
        chapterTopic: topic,
      },
      {
        id: `qp-q2-${Date.now()}`,
        questionNumber: 2,
        section: 'Section A',
        type: 'mcq',
        typeLabel: isHindi ? 'बहुविकल्पीय प्रश्न (MCQ)' : 'Multiple Choice Question',
        marks: 1,
        question: isHindi
          ? `कक्षा ${classLvl} ${subj} के अनुसार, ${topic} की SI इकाई क्या है?`
          : `According to Class ${classLvl} ${subj}, what is the standard SI unit associated with ${topic}?`,
        options: isHindi
          ? ['Joule (J) / Pascal', 'Newton (N) / Ampere', 'Standard SI Metric Unit', 'Dimensionless Quantity']
          : ['Joule (J) / Pascal', 'Newton (N) / Ampere', 'Standard SI Metric Unit', 'Dimensionless Quantity'],
        correctOptionIndex: 2,
        answerKey: isHindi ? 'सही उत्तर (C): मानकीकृत SI मात्रक।' : 'Correct Answer (C): Standard SI Metric Unit.',
        markingScheme: [isHindi ? '+1 अंक सही उत्तर पर' : '+1 mark for correct unit identification'],
        difficulty: 'Easy',
        chapterTopic: topic,
      },
      // Section B: VSA
      {
        id: `qp-q3-${Date.now()}`,
        questionNumber: 3,
        section: 'Section B',
        type: 'vsa',
        typeLabel: isHindi ? 'अति लघु उत्तरीय प्रश्न (VSA)' : 'Very Short Answer Question',
        marks: 2,
        question: isHindi
          ? `${topic} को एक वाक्य में परिभाषित कीजिए एवं इसका एक अनुप्रयोग लिखिए।`
          : `Define ${topic} in one clear sentence and mention one key practical application in ${subj}.`,
        answerKey: isHindi
          ? `${topic} की परिभाषा: मुख्य पाठ्यपुस्तकीय नियम का पालन करने वाली प्रक्रिया।\nअनुप्रयोग: औद्योगिक एवं प्रयोगशाला प्रयोगों में।`
          : `Definition: ${topic} is defined as the core principle governing the system in Class ${classLvl} ${subj}.\nApplication: Widely used in engineering, lab experiments, and everyday physical phenomena.`,
        markingScheme: [
          isHindi ? '+1 अंक सटीक परिभाषा के लिए' : '+1 mark for accurate technical definition',
          isHindi ? '+1 अंक सही अनुप्रयोग लिखने पर' : '+1 mark for valid practical application'
        ],
        difficulty: 'Medium',
        chapterTopic: topic,
      },
      // Section C: Short Answer (SA)
      {
        id: `qp-q4-${Date.now()}`,
        questionNumber: 4,
        section: 'Section C',
        type: 'sa',
        typeLabel: isHindi ? 'लघु उत्तरीय प्रश्न (SA)' : 'Short Answer Question',
        marks: 3,
        question: isHindi
          ? `${topic} के 3 मुख्य गुणों/विशेषताओं की व्याख्या कीजिए।`
          : `Explain three major characteristics or fundamental properties of ${topic} with suitable points.`,
        answerKey: isHindi
          ? `1. पहला गुण: यह नियम के अनुसार आचरण करता है।\n2. दूसरा गुण: यह बाह्य कारकों द्वारा प्रभावित होता है।\n3. तीसरा गुण: यह ऊर्जा संरक्षण सिद्धांत का पालन करता है।`
          : `1. Property 1: It demonstrates linear proportionality under standard temperature and pressure.\n2. Property 2: It directly correlates with fundamental system parameters.\n3. Property 3: It adheres to law of conservation of energy/matter.`,
        markingScheme: [
          isHindi ? '+1 अंक प्रत्येक बिंदु की सही व्याख्या पर (कुल 3 अंक)' : '+1 mark for each valid point explained clearly (Total 3 marks)'
        ],
        difficulty: 'Medium',
        chapterTopic: topic,
      },
      // Section D: Long Answer (LA)
      {
        id: `qp-q5-${Date.now()}`,
        questionNumber: 5,
        section: 'Section D',
        type: 'la',
        typeLabel: isHindi ? 'दीर्घ उत्तरीय प्रश्न (LA)' : 'Long Answer Question',
        marks: 5,
        question: isHindi
          ? `${topic} का विस्तृत सिद्धांत स्पष्ट कीजिए। संबंधित आरेख/सूत्र व्युत्पत्ति एवं सावधानियाँ लिखिए।`
          : `Derive or explain in detail the working mechanism of ${topic}. Include necessary equations, diagrammatic steps, and precautions.`,
        answerKey: isHindi
          ? `व्यापक उत्तर:\n1. मुख्य सिद्धांत की विस्तृत व्याख्या\n2. सूत्र व्युत्पत्ति चरण 1, 2 एवं 3\n3. महत्वपूर्ण सावधानियां एवं परीक्षा उपयोगी बिंदु।`
          : `Comprehensive Answer:\n1. Detailed Theoretical Background & Underlying Assumptions.\n2. Step-by-Step Algebraic Derivation or Logical Proof.\n3. Diagrammatic Schematic & Key Experimental Precautions.`,
        markingScheme: [
          isHindi ? '+1.5 अंक सिद्धांत एवं परिभाषा हेतु' : '+1.5 marks for theory and statement',
          isHindi ? '+2 अंक चरणबद्ध सूत्र/प्रमाण हेतु' : '+2 marks for step-by-step derivation/proof',
          isHindi ? '+1.5 अंक निष्कर्ष एवं सावधानियों हेतु' : '+1.5 marks for conclusions and precautions'
        ],
        difficulty: 'Hard',
        chapterTopic: topic,
      },
      // Section E: Case Study Question
      {
        id: `qp-q6-${Date.now()}`,
        questionNumber: 6,
        section: 'Section E',
        type: 'case_study',
        typeLabel: isHindi ? 'केस स्टडी आधारित प्रश्न' : 'Case-Based Integrated Question',
        marks: 4,
        question: isHindi
          ? `केस अध्ययन: एक छात्र प्रयोगशाला में ${topic} से संबंधित प्रयोग कर रहा है। वह पाता है कि बाह्य परिस्थितियाँ बदलने पर परिणाम बदलते हैं।\n(i) छात्र द्वारा देखी गई मुख्य घटना का नाम लिखिए। (1 अंक)\n(ii) इस स्थिति में काम करने वाला मुख्य सूत्र लिखिए। (1 अंक)\n(iii) यदि मान दोगुना कर दिया जाए तो क्या परिवर्तन होगा? (2 अंक)`
          : `Case Study: A Class ${classLvl} student is conducting a practical laboratory setup on ${topic}. The student observes systematically that altering external parameters causes proportional shifts in measurements.\n(i) Identify the scientific/mathematical phenomenon demonstrated. (1 Mark)\n(ii) State the governing formula or mathematical identity. (1 Mark)\n(iii) Calculate or predict the outcome if the input parameter is doubled. (2 Marks)`,
        answerKey: isHindi
          ? `(i) घटना का नाम: ${topic}\n(ii) मुख्य सूत्र: $Y = k \\cdot X$\n(iii) मान दोगुना होने पर अंतिम परिणाम भी 2 गुना (दोगुना) हो जाएगा।`
          : `(i) Phenomenon Identified: ${topic}.\n(ii) Governing Formula: $Y = k \\cdot X$ where $k$ is constant.\n(iii) When input $X$ is doubled, the output $Y$ becomes $2 \\cdot Y$ (doubles proportionally).`,
        markingScheme: [
          '+1 mark for sub-question (i)',
          '+1 mark for sub-question (ii)',
          '+2 marks for correct calculation in sub-question (iii)'
        ],
        difficulty: 'Hard',
        chapterTopic: topic,
      }
    ];

    // Optional Numerical Question if applicable
    if (options.includeNumericals || subj.toLowerCase().includes('math') || subj.toLowerCase().includes('physic') || subj.toLowerCase().includes('chem')) {
      questions.push({
        id: `qp-q7-${Date.now()}`,
        questionNumber: 7,
        section: 'Section C',
        type: 'numerical',
        typeLabel: isHindi ? 'आंकिक/गणना प्रश्न' : 'Numerical Problem',
        marks: 4,
        question: isHindi
          ? `आंकिक प्रश्न: ${topic} पर आधारित:\nयदि $x = 10$ और $y = 5$ है, तो सूत्र $Z = \\frac{2x + y^2}{x - y}$ का उपयोग करके $Z$ का मान ज्ञात कीजिए।`
          : `Numerical Problem based on ${topic}:\nGiven $x = 10$ units and $y = 5$ units. Calculate the parameter $Z$ using the relation $Z = \\frac{2x + y^2}{x - y}$. Show all steps and state final units.`,
        answerKey: isHindi
          ? `चरण 1: दिए गए मान $x = 10, y = 5$\nचरण 2: अंश = $2(10) + 5^2 = 20 + 25 = 45$\nचरण 3: हर = $10 - 5 = 5$\nचरण 4: $Z = 45 / 5 = 9$ इकाई।`
          : `Step 1: Given $x = 10$, $y = 5$.\nStep 2: Numerator $2(10) + 5^2 = 20 + 25 = 45$.\nStep 3: Denominator $10 - 5 = 5$.\nStep 4: $Z = 45 / 5 = 9$ units.`,
        markingScheme: [
          '+1 mark for writing given values and correct formula',
          '+2 marks for step-by-step substitution and calculations',
          '+1 mark for final value with correct units ($Z = 9$ units)'
        ],
        difficulty: 'Medium',
        chapterTopic: topic,
      });
    }

    const fallbackPaper: QuestionPaper = {
      id: `paper-${Date.now()}`,
      title: `${board} Class ${classLvl} ${subj} Question Paper`,
      board: board as BoardType,
      classLevel: classLvl as ClassLevel,
      subject: subj,
      bookName: book,
      chapterTopic: topic,
      difficulty: diff,
      totalQuestions: questions.length,
      totalMarks: totalMarks,
      durationMinutes: duration,
      language: isHindi ? 'Hindi' : 'English',
      createdAt: new Date().toISOString(),
      instructions: [
        'General Instructions:',
        `1. This question paper comprises ${questions.length} questions across 5 sections.`,
        '2. All questions are compulsory. Internal choices are indicated where applicable.',
        '3. Section A contains MCQs carrying 1 mark each.',
        '4. Section B contains Very Short Answer questions carrying 2 marks each.',
        '5. Section C contains Short Answer / Numerical questions carrying 3 to 4 marks.',
        '6. Section D contains Long Answer questions carrying 5 marks each.',
        '7. Section E contains Case-based integrated questions carrying 4 marks each.'
      ],
      difficultyDistribution: {
        easyPercentage: 35,
        mediumPercentage: 45,
        hardPercentage: 20,
      },
      questions: questions,
    };

    return { paper: fallbackPaper, isFallback: true };
  },

  // 8. Dedicated AI Translation Methods
  async translateText(
    text: string,
    targetLanguage: string = 'hi',
    sourceLanguage?: string
  ): Promise<{ translatedText: string; isFallback: boolean }> {
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage,
          type: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          return { translatedText: data.translatedText, isFallback: data.isFallback || false };
        }
      }
    } catch (err) {
      console.warn('Backend translation failed, falling back to original:', err);
    }

    return { translatedText: text, isFallback: true };
  },

  async translateNote(
    note: SavedNote,
    targetLanguage: string = 'hi'
  ): Promise<{ translatedNote: SavedNote; isFallback: boolean }> {
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage,
          type: 'note',
          data: note,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedData) {
          const translatedNote: SavedNote = {
            ...note,
            ...data.translatedData,
            language: targetLanguage === 'hi' ? 'hi' : 'en',
          };
          return { translatedNote, isFallback: data.isFallback || false };
        }
      }
    } catch (err) {
      console.warn('Backend note translation failed:', err);
    }

    return { translatedNote: note, isFallback: true };
  },

  async translateQuiz(
    quiz: Quiz,
    targetLanguage: string = 'hi'
  ): Promise<{ translatedQuiz: Quiz; isFallback: boolean }> {
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage,
          type: 'quiz',
          data: quiz,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedData) {
          const translatedQuiz: Quiz = {
            ...quiz,
            ...data.translatedData,
            language: targetLanguage === 'hi' ? 'Hindi' : 'English',
          };
          return { translatedQuiz, isFallback: data.isFallback || false };
        }
      }
    } catch (err) {
      console.warn('Backend quiz translation failed:', err);
    }

    return { translatedQuiz: quiz, isFallback: true };
  },

  async translateStudyPlan(
    plan: StudyPlan,
    targetLanguage: string = 'hi'
  ): Promise<{ translatedPlan: StudyPlan; isFallback: boolean }> {
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage,
          type: 'plan',
          data: plan,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedData) {
          const translatedPlan: StudyPlan = {
            ...plan,
            ...data.translatedData,
          };
          return { translatedPlan, isFallback: data.isFallback || false };
        }
      }
    } catch (err) {
      console.warn('Backend study plan translation failed:', err);
    }

    return { translatedPlan: plan, isFallback: true };
  },

  // 9. AI Personal Learning System Recommendations
  async generatePersonalRecommendations(options: {
    profile: StudentProfile;
    weakTopics: WeakTopic[];
    strongTopics: StrongTopic[];
    quizResults: Quiz[];
    examResults: Exam[];
    studyPlan: StudyPlan;
    savedNotes: SavedNote[];
    activities: ActivityLog[];
    language?: string;
  }): Promise<{ recommendations: PersonalLearningSystemData; isFallback: boolean }> {
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: options.profile,
          weakTopics: options.weakTopics,
          strongTopics: options.strongTopics,
          quizResults: options.quizResults,
          examResults: options.examResults,
          studyPlan: options.studyPlan,
          savedNotes: options.savedNotes,
          activities: options.activities,
          language: options.language || options.profile.preferredLanguage || 'en',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.recommendations && data.recommendations.todaysFocus) {
          return {
            recommendations: {
              ...data.recommendations,
              generatedAt: data.generatedAt || new Date().toISOString(),
              isAiGenerated: true,
            },
            isFallback: false,
          };
        }
      }
    } catch (err) {
      console.warn('Backend personal recommendations API failed, generating smart deterministic fallback:', err);
    }

    // High precision, explainable deterministic fallback based on actual student metrics
    const { profile, weakTopics, strongTopics, quizResults, examResults, studyPlan } = options;
    const isHindi = options.language === 'hi' || profile.preferredLanguage === 'hi';
    const isHinglish = options.language === 'hinglish' || profile.preferredLanguage === 'hinglish';

    const avgQuizScore = profile.avgScorePercentage || 85;
    const criticalWeak = weakTopics.filter((w) => w.urgency === 'Critical');
    const primaryWeak = weakTopics[0] || {
      id: 'wt-default',
      subjectName: 'Science',
      chapterName: 'Light: Reflection & Refraction',
      topicName: 'Spherical Mirror Formula & Magnification',
      accuracyRate: 42,
      lastPracticed: 'Yesterday',
      urgency: 'Critical' as const,
      difficultyLevel: 'Hard' as const,
      wrongAnswersCount: 6,
    };

    const primaryStrong = strongTopics[0] || {
      subjectName: 'Mathematics',
      chapterName: 'Polynomials',
      topicName: 'Zeros of Polynomials',
      accuracyRate: 92,
      masteryLevel: 'Mastered' as const,
    };

    // Calculate readiness score (0-100)
    let score = Math.round(
      avgQuizScore * 0.5 +
        (100 - (criticalWeak.length * 12)) * 0.3 +
        Math.min(100, (profile.streakDays || 1) * 10) * 0.2
    );
    score = Math.max(45, Math.min(98, score));

    const todaysFocus: RecommendationItem[] = [
      {
        id: `rec-focus-1-${Date.now()}`,
        type: 'next_study',
        title: isHindi
          ? `${primaryWeak.subjectName}: ${primaryWeak.chapterName} की मुख्य अवधारणाएं`
          : isHinglish
          ? `${primaryWeak.subjectName}: ${primaryWeak.chapterName} Core Concepts`
          : `${primaryWeak.subjectName}: ${primaryWeak.chapterName} Core Concepts`,
        subtitle: primaryWeak.topicName,
        subject: primaryWeak.subjectName,
        chapterTopic: primaryWeak.chapterName,
        recommendedDifficulty: primaryWeak.accuracyRate < 50 ? 'Easy' : 'Medium',
        reason: isHindi
          ? `पिछले टेस्ट में ${primaryWeak.accuracyRate}% सटीकता रही। बुनियादी सिद्धांतों की समीक्षा करने से स्कोर में ~25% सुधार होगा।`
          : isHinglish
          ? `Recent test me ${primaryWeak.accuracyRate}% accuracy thi. Fundamental concepts revise karne se score ~25% boost hoga.`
          : `Recent test accuracy was ${primaryWeak.accuracyRate}%. Reviewing foundation concepts before taking retests boosts retention by ~25%.`,
        dataTrigger: isHindi
          ? `कमजोर विषय सटीकता: ${primaryWeak.accuracyRate}% (${primaryWeak.lastPracticed})`
          : `Weak Topic Accuracy: ${primaryWeak.accuracyRate}% (${primaryWeak.lastPracticed})`,
        actionType: 'navigate_notes',
        actionPayload: {
          subject: primaryWeak.subjectName,
          chapter: primaryWeak.chapterName,
          topic: primaryWeak.topicName,
        },
        actionLabel: isHindi ? 'AI रिवीजन नोट्स खोलें' : isHinglish ? 'AI Notes Padhein' : 'Review AI Summary Notes',
        estimatedMinutes: 20,
        priority: 'High',
        xpReward: 50,
      },
      {
        id: `rec-focus-2-${Date.now()}`,
        type: 'next_study',
        title: isHindi
          ? `${primaryStrong.subjectName}: उन्नत संख्यात्मक एवं अनुप्रयोग`
          : isHinglish
          ? `${primaryStrong.subjectName}: Advanced Numericals & Applications`
          : `${primaryStrong.subjectName}: Advanced Problems & Applications`,
        subtitle: primaryStrong.topicName,
        subject: primaryStrong.subjectName,
        chapterTopic: primaryStrong.chapterName,
        recommendedDifficulty: 'Hard',
        reason: isHindi
          ? `आपकी ${primaryStrong.accuracyRate}% दक्षता है। बोर्ड परीक्षा में 100/100 स्कोर करने के लिए कठिन प्रश्नों का अभ्यास करें।`
          : isHinglish
          ? `Aapki ${primaryStrong.accuracyRate}% mastery hai. Board exam me 100/100 target karne ke liye advanced problems solve karein.`
          : `You hold ${primaryStrong.accuracyRate}% accuracy in this topic. Tackle level-3 hard problems to lock in perfect exam marks.`,
        dataTrigger: isHindi
          ? `मजबूत विषय दक्षता: ${primaryStrong.accuracyRate}% सटीकता`
          : `Mastery Benchmark: ${primaryStrong.accuracyRate}% Accuracy`,
        actionType: 'navigate_quiz',
        actionPayload: {
          subject: primaryStrong.subjectName,
          chapter: primaryStrong.chapterName,
          topic: primaryStrong.topicName,
          difficulty: 'Hard',
          questionCount: 5,
        },
        actionLabel: isHindi ? 'उन्नत क्विज शुरू करें' : isHinglish ? 'Advanced Quiz Shuru Karein' : 'Take Mastery Quiz',
        estimatedMinutes: 15,
        priority: 'Medium',
        xpReward: 60,
      },
    ];

    const topicsToRevise: RecommendationItem[] = weakTopics.slice(0, 3).map((wt, idx) => ({
      id: `rec-rev-${wt.id || idx}-${Date.now()}`,
      type: 'topic_revision',
      title: isHindi
        ? `पुनरावृत्ति: ${wt.chapterName}`
        : isHinglish
        ? `Revision: ${wt.chapterName}`
        : `Revision: ${wt.chapterName}`,
      subtitle: wt.topicName,
      subject: wt.subjectName,
      chapterTopic: `${wt.chapterName} • ${wt.topicName}`,
      recommendedDifficulty: wt.accuracyRate < 45 ? 'Easy' : 'Medium',
      reason: isHindi
        ? `${wt.wrongAnswersCount || 4} गलत उत्तर दर्ज हुए। परीक्षा से पहले सूत्र और चिन्ह परिपाटी दोहराना आवश्यक है।`
        : isHinglish
        ? `${wt.wrongAnswersCount || 4} incorrect answers recorded. Exam se pehle formulas aur key points revise karein.`
        : `${wt.wrongAnswersCount || 4} incorrect answers recorded in past attempts. Targeted formula review recommended.`,
      dataTrigger: isHindi
        ? `सटीकता: ${wt.accuracyRate}% • तात्कालिकता: ${wt.urgency || 'Critical'}`
        : `Accuracy: ${wt.accuracyRate}% • Urgency: ${wt.urgency || 'Critical'}`,
      actionType: 'navigate_ask_ai',
      actionPayload: {
        subject: wt.subjectName,
        chapter: wt.chapterName,
        topic: wt.topicName,
        prompt: `Please explain ${wt.topicName} from ${wt.chapterName} step-by-step with formulas and 2 solved examples for Class ${profile.classLevel}.`,
      },
      actionLabel: isHindi ? 'AI ट्यूटर से समझें' : isHinglish ? 'AI Tutor Se Samjhein' : 'Ask AI Doubt Tutor',
      estimatedMinutes: 15,
      priority: wt.urgency === 'Critical' ? 'High' : 'Medium',
      xpReward: 45,
    }));

    const recommendedPractice: RecommendationItem[] = [
      {
        id: `rec-prac-1-${Date.now()}`,
        type: 'practice_quiz',
        title: isHindi
          ? `${primaryWeak.subjectName} 5-प्रश्नोत्तरी गति परीक्षण`
          : isHinglish
          ? `${primaryWeak.subjectName} 5-Question Speed Drill`
          : `${primaryWeak.subjectName} 5-Question Quick Retest`,
        subtitle: `${primaryWeak.chapterName} • ${primaryWeak.topicName}`,
        subject: primaryWeak.subjectName,
        chapterTopic: primaryWeak.chapterName,
        recommendedDifficulty: 'Medium',
        reason: isHindi
          ? 'कमजोर टॉपिक पर तुरंत 5 प्रश्नों का क्विज देने से ज्ञान पक्का होता है।'
          : isHinglish
          ? 'Weak topic par 5-Q quick quiz dene se confidence aur accuracy improve hoti hai.'
          : 'Taking an immediate 5-question adaptive drill reinforces concepts and updates your performance metrics.',
        dataTrigger: isHindi
          ? `पुनः परीक्षण अनुशंसित (${primaryWeak.accuracyRate}% आधार)`
          : `Adaptive Retest Recommended (${primaryWeak.accuracyRate}% Baseline)`,
        actionType: 'navigate_quiz',
        actionPayload: {
          subject: primaryWeak.subjectName,
          chapter: primaryWeak.chapterName,
          topic: primaryWeak.topicName,
          difficulty: 'Medium',
          questionCount: 5,
        },
        actionLabel: isHindi ? 'क्विज अभ्यास शुरू करें' : isHinglish ? 'Practice Quiz Shuru Karein' : 'Start 5-Q Practice Quiz',
        estimatedMinutes: 10,
        priority: 'High',
        xpReward: 50,
      },
      {
        id: `rec-prac-2-${Date.now()}`,
        type: 'practice_quiz',
        title: isHindi
          ? 'गणित द्विघात समीकरण एवं शब्द समस्याएं'
          : isHinglish
          ? 'Mathematics Quadratic Equations Drill'
          : 'Mathematics Word Problem & Discriminant Drill',
        subtitle: 'Mathematics • Chapter 4',
        subject: 'Mathematics',
        chapterTopic: 'Quadratic Equations',
        recommendedDifficulty: 'Medium',
        reason: isHindi
          ? 'बोर्ड परीक्षा में 6-8 अंक का उच्च वेटेज है। विविध प्रश्न हल करने का अभ्यास करें।'
          : isHinglish
          ? 'Board exam me 6-8 marks ka high weightage hai. Formula applications practice karein.'
          : 'Carries 6-8 marks weightage in CBSE/State board papers. Tests formula application speed.',
        dataTrigger: isHindi
          ? 'बोर्ड परीक्षा उच्च वेटेज (6-8 अंक)'
          : 'High Board Syllabus Weightage (6-8 Marks)',
        actionType: 'navigate_quiz',
        actionPayload: {
          subject: 'Mathematics',
          chapter: 'Quadratic Equations',
          topic: 'Discriminant & Word Problem Formulations',
          difficulty: 'Medium',
          questionCount: 5,
        },
        actionLabel: isHindi ? 'गणित क्विज शुरू करें' : isHinglish ? 'Maths Quiz Shuru Karein' : 'Start Maths Practice Quiz',
        estimatedMinutes: 15,
        priority: 'Medium',
        xpReward: 50,
      },
    ];

    const examPreparation: RecommendationItem[] = [
      {
        id: `rec-exam-1-${Date.now()}`,
        type: 'exam_prep',
        title: isHindi
          ? `कक्षा ${profile.classLevel} विज्ञान पूर्ण अध्याय मॉक परीक्षा`
          : isHinglish
          ? `Class ${profile.classLevel} Science Full Mock Exam`
          : `Class ${profile.classLevel} Science Board Mock Assessment`,
        subtitle: 'Light: Reflection & Refraction + Chemical Reactions (Timed 45 Mins)',
        subject: 'Science',
        chapterTopic: 'Light & Chemical Reactions',
        recommendedDifficulty: 'Medium',
        reason: isHindi
          ? 'समय प्रबंधन और वास्तविक परीक्षा दबाव का अभ्यास करने के लिए 45 मिनट की समयबद्ध परीक्षा दें।'
          : isHinglish
          ? 'Time management aur real board exam pressure practice karne ke liye 45-min timed mock exam dein.'
          : 'Simulates strict timed exam environment to train pacing across Section A (MCQs) and Section B (Subjective numericals).',
        dataTrigger: isHindi
          ? `आगामी परीक्षा तिथि: ${studyPlan?.targetExamDate || '14 दिन शेष'}`
          : `Exam Roadmap Target: ${studyPlan?.targetExamDate || '14 Days Remaining'}`,
        actionType: 'navigate_exam',
        actionPayload: {
          subject: 'Science',
          chapter: 'Light: Reflection and Refraction',
          difficulty: 'Medium',
        },
        actionLabel: isHindi ? 'मॉक परीक्षा शुरू करें' : isHinglish ? 'Mock Exam Shuru Karein' : 'Start 45-Min Mock Exam',
        estimatedMinutes: 45,
        priority: 'High',
        xpReward: 100,
      },
      {
        id: `rec-exam-2-${Date.now()}`,
        type: 'exam_prep',
        title: isHindi
          ? 'कस्टम बोर्ड प्रश्न पत्र ब्लूप्रिंट जनरेटर'
          : isHinglish
          ? 'Custom Board Question Paper Blueprint'
          : 'Generate Custom Board Test Paper',
        subtitle: `${profile.board || 'CBSE'} Class ${profile.classLevel} Marking Scheme Blueprint`,
        subject: 'Mathematics',
        chapterTopic: 'Full Syllabus Mixed Blueprint',
        recommendedDifficulty: 'Medium',
        reason: isHindi
          ? 'नवीनतम 2026 परीक्षा पैटर्न के अनुसार 1-अंक, 2-अंक, 3-अंक और केस-स्टडी प्रश्नों का अभ्यास करें।'
          : isHinglish
          ? 'New 2026 exam pattern ke hisaab se 1-mark, 2-mark, aur case study questions generate karein.'
          : 'Generates a standardized CBSE/State blueprint test paper with marking scheme and step-by-step evaluation keys.',
        dataTrigger: isHindi
          ? `बोर्ड पैटर्न: ${profile.board || 'CBSE'} कक्षा ${profile.classLevel}`
          : `Board Pattern: ${profile.board || 'CBSE'} Class ${profile.classLevel}`,
        actionType: 'navigate_paper',
        actionPayload: {
          subject: 'Mathematics',
          difficulty: 'Medium',
        },
        actionLabel: isHindi ? 'प्रश्न पत्र जनरेट करें' : isHinglish ? 'Paper Generate Karein' : 'Generate Question Paper',
        estimatedMinutes: 30,
        priority: 'Medium',
        xpReward: 80,
      },
    ];

    const dailyGoals: RecommendationItem[] = [
      {
        id: `rec-goal-1-${Date.now()}`,
        type: 'daily_goal',
        title: isHindi
          ? `आज का XP लक्ष्य: ${profile.dailyXpGoal || 100} XP पूरा करें`
          : isHinglish
          ? `Complete Daily ${profile.dailyXpGoal || 100} XP Goal`
          : `Reach Daily ${profile.dailyXpGoal || 100} XP Goal`,
        subtitle: isHindi ? '1 क्विज + 1 डाउट हल करने पर लक्ष्य पूरा होगा' : '1 Quiz + 1 AI Doubt solves your target',
        subject: 'General',
        chapterTopic: 'Daily Target',
        recommendedDifficulty: 'Easy',
        reason: isHindi
          ? `अपने ${profile.streakDays || 1}-दिवसीय स्ट्रिक को बनाए रखें और लेवल ${profile.level + 1} के करीब पहुंचें।`
          : isHinglish
          ? `Apna ${profile.streakDays || 1}-day streak maintain karein aur Level ${profile.level + 1} unlock karein.`
          : `Maintains your ${profile.streakDays || 1}-day study streak and moves you closer to Level ${profile.level + 1}.`,
        dataTrigger: isHindi ? `दैनिक स्ट्रिक: ${profile.streakDays || 1} दिन 🔥` : `Daily Streak: ${profile.streakDays || 1} Days 🔥`,
        actionType: 'navigate_quiz',
        actionPayload: {
          subject: 'Science',
          difficulty: 'Easy',
          questionCount: 5,
        },
        actionLabel: isHindi ? 'दैनिक क्विज हल करें' : isHinglish ? 'Daily Quiz Solve Karein' : 'Complete Daily Quiz (+50 XP)',
        estimatedMinutes: 10,
        priority: 'High',
        xpReward: 50,
      },
      {
        id: `rec-goal-2-${Date.now()}`,
        type: 'daily_goal',
        title: isHindi
          ? 'कमजोर टॉपिक से 1 प्रश्न AI ट्यूटर से पूछें'
          : isHinglish
          ? 'Ask 1 Doubt to AI Tutor from Weak Topic'
          : 'Clear 1 Doubt with AI Tutor',
        subtitle: `${primaryWeak.subjectName}: ${primaryWeak.topicName}`,
        subject: primaryWeak.subjectName,
        chapterTopic: primaryWeak.chapterName,
        recommendedDifficulty: 'Easy',
        reason: isHindi
          ? 'दैनिक रूप से 1 डाउट पूछने से अवधारणा स्पष्ट होती है।'
          : isHinglish
          ? 'Daily 1 concept doubt solve karne se fear khatam hota hai.'
          : 'Clearing single doubt daily prevents confusion compounding before tests.',
        dataTrigger: isHindi ? 'दैनिक डाउट निवारण' : 'Daily Doubts Habit',
        actionType: 'navigate_ask_ai',
        actionPayload: {
          subject: primaryWeak.subjectName,
          chapter: primaryWeak.chapterName,
          topic: primaryWeak.topicName,
        },
        actionLabel: isHindi ? 'AI ट्यूटर से पूछें' : isHinglish ? 'AI Tutor Se Poocho' : 'Ask AI Doubt (+20 XP)',
        estimatedMinutes: 5,
        priority: 'Medium',
        xpReward: 20,
      },
    ];

    const overviewSummary = isHindi
      ? `आपके हालिया स्कोर (${avgQuizScore}% औसत) और ${weakTopics.length} कमजोर विषयों के आधार पर आपका AI लर्निंग प्लान तैयार है। आज का मुख्य फोकस ${primaryWeak.subjectName} के साइन कन्वेंशन और न्यूमेरिकल पर है।`
      : isHinglish
      ? `Aapke recent performance (${avgQuizScore}% avg score) aur ${weakTopics.length} weak topics ke base par aapka AI Study Plan ready hai. Aaj ka primary focus ${primaryWeak.subjectName} ke formulas aur numericals par hai.`
      : `Based on your recent performance (${avgQuizScore}% average quiz accuracy) and ${weakTopics.length} flagged weak topics, your AI study path is prioritized for high-yield board results. Today's primary focus is mastering ${primaryWeak.subjectName} foundations.`;

    const performanceInsight = isHindi
      ? `आपने ${primaryStrong.subjectName} में उत्कृष्ट ${primaryStrong.accuracyRate}% प्रदर्शन किया है। यदि आप ${primaryWeak.chapterName} के 5 प्रश्नों का दैनिक अभ्यास करेंगे, तो समग्र परीक्षा तत्परता 95%+ तक पहुंच जाएगी।`
      : isHinglish
      ? `Aapne ${primaryStrong.subjectName} me ${primaryStrong.accuracyRate}% strong score maintain kiya hai. Agar aap ${primaryWeak.chapterName} me formula revision karenge toh overall readiness 95%+ ho jayegi.`
      : `Strong mastery demonstrated in ${primaryStrong.subjectName} (${primaryStrong.accuracyRate}% accuracy). Focusing 20 minutes daily on ${primaryWeak.chapterName} will lift your overall readiness score to 95%+.`;

    return {
      recommendations: {
        overviewSummary,
        performanceInsight,
        readinessScore: score,
        todaysFocus,
        topicsToRevise,
        recommendedPractice,
        examPreparation,
        dailyGoals,
        generatedAt: new Date().toISOString(),
        isAiGenerated: false,
      },
      isFallback: true,
    };
  },
};


