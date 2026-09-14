import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  History,
  Sparkles,
  BookOpen,
  X,
  HelpCircle,
  BarChart3,
  Check,
  Send,
  Zap,
  Target,
  TrendingUp,
  XCircle,
  BrainCircuit,
  ArrowRight,
  BookmarkPlus,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { StudentProfile, Exam, ClassLevel, NavigationSection, SavedNote } from '../../types';
import { AiService } from '../../services/aiService';
import { StorageService } from '../../services/storageService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { LanguageCode } from '../../i18n/translations';

interface ExamModeViewProps {
  profile: StudentProfile;
  onNavigate?: (section: NavigationSection) => void;
  lang?: LanguageCode;
}

export const ExamModeView: React.FC<ExamModeViewProps> = ({ profile, onNavigate, lang = 'en' }) => {
  const isHindi = lang === 'hi';

  // View tabs
  const [activeTab, setActiveTab] = useState<'setup' | 'exam' | 'result' | 'history'>('setup');

  // Form State
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(profile.classLevel || '10');
  const [selectedSubject, setSelectedSubject] = useState<string>(profile.selectedSubjects[0] || 'Science');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [chapterTopics, setChapterTopics] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [examLanguage, setExamLanguage] = useState<'English' | 'Hindi'>(isHindi ? 'Hindi' : 'English');

  // Exam Active State
  const [loading, setLoading] = useState(false);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Result State
  const [evalResult, setEvalResult] = useState<{
    scoreEarned: number;
    totalMarks: number;
    percentage: number;
    earnedXp: number;
    leveledUp: boolean;
    newLevel: number;
    newXp: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    accuracyPercentage: number;
    timeSpentSeconds: number;
    isAutoSubmitted?: boolean;
    isRepeatedExam?: boolean;
    previousBestPercentage?: number;
    antiFarmingActive?: boolean;
  } | null>(null);

  // History State
  const [examHistory, setExamHistory] = useState<Exam[]>(() => StorageService.getSavedExams());
  const [viewingHistoryExam, setViewingHistoryExam] = useState<Exam | null>(null);
  const [noteCreatedNotice, setNoteCreatedNotice] = useState<string | null>(null);

  // Refresh History
  const refreshHistory = () => {
    setExamHistory(StorageService.getSavedExams());
  };

  // Consume pending exam from Paper Generator if available
  useEffect(() => {
    try {
      const pendingRaw = localStorage.getItem('eduai_pending_exam');
      if (pendingRaw) {
        localStorage.removeItem('eduai_pending_exam');
        const pendingExam: Exam = JSON.parse(pendingRaw);
        if (pendingExam && pendingExam.questions && pendingExam.questions.length > 0) {
          setActiveExam(pendingExam);
          setCurrentQuestionIndex(0);
          setUserAnswers({});
          setTimeLeftSeconds((pendingExam.durationMinutes || 60) * 60);
          setEvalResult(null);
          setActiveTab('exam');
        }
      }
    } catch (e) {
      console.warn('Error loading pending exam from paper generator:', e);
    }
  }, []);

  // Timer Effect: Countdown & Auto-Submit on Expiry
  useEffect(() => {
    if (activeTab !== 'exam' || !activeExam || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmitExam(true); // Auto-submit when timer hits 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab, activeExam, timeLeftSeconds]);

  // Available subjects
  const standardSubjects = [
    'Science',
    'Mathematics',
    'Social Science',
    'English',
    'Hindi',
    'Physics',
    'Chemistry',
    'Biology',
  ];

  // Handle Create Exam
  const handleStartExam = async () => {
    setLoading(true);
    const subjToUse = selectedSubject === 'Other' && customSubject ? customSubject : selectedSubject;

    try {
      const res = await AiService.generateExam({
        subject: subjToUse,
        classLevel: selectedClass,
        board: profile.board,
        chapterTopics: chapterTopics.trim() || 'Full Syllabus',
        difficulty,
        questionCount,
        language: examLanguage,
        durationMinutes: Math.max(10, questionCount * 2),
      });

      if (res.exam) {
        const examObj = {
          ...res.exam,
          chapterTopics: chapterTopics.trim() || 'Full Syllabus',
          difficulty,
        };
        setActiveExam(examObj);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setTimeLeftSeconds((res.exam.durationMinutes || 20) * 60);
        setEvalResult(null);
        setActiveTab('exam');
      }
    } catch (err) {
      console.error('Failed to generate exam:', err);
    } finally {
      setLoading(false);
    }
  };

  // Answer handler
  const handleAnswerChange = (questionId: string, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Submit Exam Execution
  const handleFinalSubmitExam = (autoSubmit = false) => {
    if (!activeExam) return;

    let totalScore = 0;

    activeExam.questions.forEach((q) => {
      const uAns = (userAnswers[q.id] || '').trim().toLowerCase();
      if (q.type === 'mcq') {
        const correct = (q.correctAnswer || '').trim().toLowerCase();
        if (uAns && uAns === correct) {
          totalScore += q.marks;
        }
      } else {
        // Descriptive keyword evaluation
        if (uAns.length > 15) {
          totalScore += Math.round(q.marks * 0.85); // award descriptive effort marks
        } else if (uAns.length > 5) {
          totalScore += Math.round(q.marks * 0.5);
        }
      }
    });

    const totalDurationSec = (activeExam.durationMinutes || 20) * 60;
    const timeSpent = Math.max(1, totalDurationSec - timeLeftSeconds);

    const res = StorageService.recordExamResult(activeExam, totalScore, userAnswers, timeSpent);

    setEvalResult({
      scoreEarned: totalScore,
      totalMarks: activeExam.totalMarks || 1,
      percentage: res.percentage,
      earnedXp: res.earnedXp,
      leveledUp: res.leveledUp,
      newLevel: res.newLevel,
      newXp: res.newXp,
      correctCount: res.correctCount,
      wrongCount: res.wrongCount,
      unansweredCount: res.unansweredCount,
      accuracyPercentage: res.accuracyPercentage,
      timeSpentSeconds: timeSpent,
      isAutoSubmitted: autoSubmit,
      isRepeatedExam: res.isRepeatedExam,
      previousBestPercentage: res.previousBestPercentage,
      antiFarmingActive: res.antiFarmingActive,
    });

    setShowSubmitConfirm(false);
    setActiveTab('result');
    refreshHistory();
  };

  // Retry same exam
  const handleRetryExam = () => {
    if (!activeExam) return;
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeftSeconds((activeExam.durationMinutes || 20) * 60);
    setEvalResult(null);
    setActiveTab('exam');
  };

  // Generate Notes from Exam Weak Topics
  const handleGenerateNotesFromExam = () => {
    if (!activeExam) return;
    const noteTitle = `${activeExam.subjectId}: ${activeExam.title} Revision Notes`;
    const noteContent = `## ${activeExam.title} - Exam Key Takeaways\n\n**Class:** ${
      activeExam.classLevel
    } (${activeExam.board})\n**Topic:** ${
      activeExam.chapterTopics || 'Full Syllabus'
    }\n\n### Weak Areas & Model Solutions\n\n${activeExam.questions
      .map(
        (q, idx) =>
          `#### Q${idx + 1}: ${q.question}\n- **Correct Answer / Scheme:** ${
            q.correctAnswer || q.sampleAnswer || 'N/A'
          }\n- **Explanation:** ${q.explanation}\n`
      )
      .join('\n')}`;

    const newNote: SavedNote = {
      id: `note-${Date.now()}`,
      title: noteTitle,
      subjectName: activeExam.subjectId,
      chapterName: activeExam.chapterTopics || 'Board Exam Paper',
      contentMarkdown: noteContent,
      createdAt: new Date().toISOString(),
      tags: [activeExam.subjectId, 'Exam Review', activeExam.board],
      isAiGenerated: true,
      sourceType: 'topic',
      isFavorite: true,
      quickRevisionPoints: activeExam.questions.slice(0, 5).map((q) => q.question),
    };

    StorageService.saveNote(newNote);
    setNoteCreatedNotice(
      isHindi
        ? 'नोट्स सफलतापूर्वक बनाए गए! नोट्स अनुभाग में देखें।'
        : 'Revision notes created & saved in Notes!'
    );

    setTimeout(() => {
      if (onNavigate) onNavigate('notes');
    }, 1200);
  };

  // Time format
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Answered count
  const answeredCount = activeExam
    ? activeExam.questions.filter((q) => (userAnswers[q.id] || '').trim().length > 0).length
    : 0;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            {isHindi ? 'एआई परीक्षा सिमुलेटर (Exam Mode)' : 'AI Board Exam Simulator'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isHindi
              ? `${profile.board} कक्षा ${profile.classLevel} के लिए समयबद्ध पूर्ण मॉक प्रश्न पत्र`
              : `Timed mock exam papers formatted for ${profile.board} Class ${profile.classLevel}`}
          </p>
        </div>

        {activeTab !== 'exam' && (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'setup'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isHindi ? 'नया टेस्ट बनाएं' : 'Create Exam'}
            </button>
            <button
              onClick={() => {
                refreshHistory();
                setActiveTab('history');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              {isHindi ? 'परीक्षा इतिहास' : 'Exam History'}
              {examHistory.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                  {examHistory.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: CREATE EXAM FORM */}
      {activeTab === 'setup' && (
        <Card className="space-y-6 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isHindi ? 'अपनी परीक्षा अनुकूलित करें' : 'Configure Custom Board Exam Paper'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHindi
                  ? 'कक्षा, विषय, अध्याय और प्रश्नों की संख्या चुनकर एआई परीक्षा पत्र तैयार करें'
                  : 'Select Class, Subject, Chapter and Difficulty to generate a standard mock paper'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Class Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isHindi ? 'कक्षा (Class Level)' : 'Select Class'}
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              >
                {(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as ClassLevel[]).map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls} ({profile.board})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isHindi ? 'विषय (Subject)' : 'Select Subject'}
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              >
                {standardSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="Other">{isHindi ? 'अन्य विषय (Custom Subject)' : 'Other Subject'}</option>
              </select>
              {selectedSubject === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter subject name..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                />
              )}
            </div>

            {/* Chapter / Topics */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isHindi ? 'अध्याय / विषय-सामग्री (Chapters / Topics)' : 'Select Chapter / Topics'}
              </label>
              <input
                type="text"
                placeholder={
                  isHindi
                    ? 'उदा. रासायनिक अभिक्रियाएं, प्रकाश परावर्तन या संपूर्ण पाठ्यक्रम'
                    : 'e.g. Chemical Reactions, Light Reflection, Electricity or Full Syllabus'
                }
                value={chapterTopics}
                onChange={(e) => setChapterTopics(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Full Syllabus', 'Term 1 Revision', 'High Yield Topics', 'Formula Practice'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setChapterTopics(chip)}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isHindi ? 'कठिनाई का स्तर (Difficulty)' : 'Select Difficulty'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      difficulty === diff
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isHindi ? 'प्रश्नों की संख्या (Number of Questions)' : 'Question Count'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      questionCount === cnt
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isHindi ? 'प्रश्न पत्र की भाषा (Medium)' : 'Exam Medium / Language'}
              </label>
              <div className="flex gap-3">
                {(['English', 'Hindi'] as const).map((l) => (
                  <label key={l} className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="radio"
                      name="examLanguage"
                      checked={examLanguage === l}
                      onChange={() => setExamLanguage(l)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-slate-800 dark:text-slate-200">{l} Medium</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              variant="rose"
              size="lg"
              className="w-full justify-center"
              onClick={handleStartExam}
              disabled={loading}
              icon={loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            >
              {loading
                ? isHindi
                  ? 'एआई प्रश्न पत्र तैयार कर रहा है...'
                  : 'Generating AI Board Exam Paper...'
                : isHindi
                ? 'समयबद्ध परीक्षा शुरू करें (Start Exam)'
                : 'Generate & Launch Timed Mock Exam'}
            </Button>
          </div>
        </Card>
      )}

      {/* VIEW 2: ACTIVE DISTRACTION-FREE EXAM SCREEN */}
      {activeTab === 'exam' && activeExam && (
        <div className="space-y-4 animate-in zoom-in-95 duration-150">
          {/* Top Sticky Header */}
          <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Badge variant="rose">{activeExam.board} Board</Badge>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">
                {activeExam.subjectId} (Class {activeExam.classLevel})
              </span>
            </div>

            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold shadow-inner ${
                timeLeftSeconds < 180
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse'
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>

            <Button
              variant="rose"
              size="sm"
              onClick={() => setShowSubmitConfirm(true)}
              icon={<Send className="h-3.5 w-3.5" />}
            >
              {isHindi ? 'सबमिट करें' : 'Submit'}
            </Button>
          </div>

          {/* Question Navigation Palette Grid */}
          <Card className="p-3 border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
              <span>QUESTION PALETTE ({answeredCount}/{activeExam.questions.length} Answered)</span>
              <span className="text-slate-400 font-normal text-[10px]">Tap to jump</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeExam.questions.map((q, idx) => {
                const isAns = (userAnswers[q.id] || '').trim().length > 0;
                const isCurr = currentQuestionIndex === idx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-all min-w-[32px] ${
                      isCurr
                        ? 'ring-2 ring-rose-500 ring-offset-2 bg-rose-600 text-white shadow-sm'
                        : isAns
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Active Question Card */}
          {activeExam.questions[currentQuestionIndex] && (
            <Card className="space-y-5 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Question {currentQuestionIndex + 1} of {activeExam.questions.length}
                  </span>
                  <Badge variant="outline">
                    {activeExam.questions[currentQuestionIndex].section}
                  </Badge>
                </div>

                <span className="text-xs font-bold text-slate-500">
                  {activeExam.questions[currentQuestionIndex].marks} {isHindi ? 'अंक' : 'Marks'}
                </span>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                  {activeExam.questions[currentQuestionIndex].question}
                </h3>

                {/* MCQ Options */}
                {activeExam.questions[currentQuestionIndex].type === 'mcq' &&
                  activeExam.questions[currentQuestionIndex].options && (
                    <div className="space-y-2 pt-2">
                      {activeExam.questions[currentQuestionIndex].options!.map((opt, oIdx) => {
                        const isSelected =
                          userAnswers[activeExam.questions[currentQuestionIndex].id] === opt;
                        return (
                          <button
                            key={oIdx}
                            onClick={() =>
                              handleAnswerChange(activeExam.questions[currentQuestionIndex].id, opt)
                            }
                            className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between min-h-[44px] ${
                              isSelected
                                ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/60 font-semibold text-rose-900 dark:text-rose-200 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{opt}</span>
                            <div
                              className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-rose-600 bg-rose-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                {/* Subjective Answer Input */}
                {activeExam.questions[currentQuestionIndex].type === 'subjective' && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                      {isHindi
                        ? 'अपना उत्तर टाइप करें (Type your detailed subjective answer):'
                        : 'Write your answer in detail:'}
                    </label>
                    <textarea
                      rows={5}
                      placeholder={
                        isHindi
                          ? 'मुख्य बिंदु, सूत्र और व्याख्या विस्तार से लिखें...'
                          : 'Type key steps, formulas, and full explanation here...'
                      }
                      value={userAnswers[activeExam.questions[currentQuestionIndex].id] || ''}
                      onChange={(e) =>
                        handleAnswerChange(
                          activeExam.questions[currentQuestionIndex].id,
                          e.target.value
                        )
                      }
                      className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Bottom Nav Controls */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  icon={<ChevronLeft className="h-4 w-4" />}
                >
                  {isHindi ? 'पिछला' : 'Previous'}
                </Button>

                {currentQuestionIndex < activeExam.questions.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setCurrentQuestionIndex((prev) => Math.min(activeExam.questions.length - 1, prev + 1))
                    }
                    icon={<ChevronRight className="h-4 w-4" />}
                  >
                    {isHindi ? 'अगला प्रश्न' : 'Next Question'}
                  </Button>
                ) : (
                  <Button
                    variant="rose"
                    size="sm"
                    onClick={() => setShowSubmitConfirm(true)}
                    icon={<Send className="h-4 w-4" />}
                  >
                    {isHindi ? 'परीक्षा समाप्त करें' : 'Finish & Submit Exam'}
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Submission Confirmation Modal */}
          {showSubmitConfirm && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="max-w-md w-full space-y-5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    {isHindi ? 'परीक्षा जमा करने की पुष्टि करें' : 'Confirm Exam Submission'}
                  </h3>
                  <button
                    onClick={() => setShowSubmitConfirm(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    {isHindi
                      ? 'क्या आप निश्चित रूप से अपनी उत्तर पुस्तिका जमा करना चाहते हैं?'
                      : 'Are you sure you want to finalize and submit your exam paper now?'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="text-[11px] text-slate-400">{isHindi ? 'उत्तर दिए गए प्रश्न' : 'Answered Questions'}</div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {answeredCount} / {activeExam.questions.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">{isHindi ? 'छूटे हुए प्रश्न' : 'Unanswered Questions'}</div>
                      <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                        {activeExam.questions.length - answeredCount}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowSubmitConfirm(false)}>
                    {isHindi ? 'परीक्षा जारी रखें' : 'Resume Exam'}
                  </Button>
                  <Button variant="rose" size="sm" onClick={() => handleFinalSubmitExam(false)}>
                    {isHindi ? 'हाँ, जमा करें' : 'Yes, Submit Exam'}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: COMPREHENSIVE RESULT & ANALYTICS REPORT */}
      {activeTab === 'result' && activeExam && evalResult && (
        <div className="space-y-6">
          {/* Note Created Alert */}
          {noteCreatedNotice && (
            <div className="p-3.5 rounded-xl bg-indigo-500 text-white font-medium text-xs flex items-center justify-between shadow-md animate-in fade-in">
              <span className="flex items-center gap-2">
                <BookmarkPlus className="h-4 w-4" />
                {noteCreatedNotice}
              </span>
              <button
                onClick={() => {
                  if (onNavigate) onNavigate('notes');
                }}
                className="underline text-xs font-bold hover:text-indigo-100"
              >
                View Notes
              </button>
            </div>
          )}

          {/* Auto-Submit Notice */}
          {evalResult.isAutoSubmitted && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
              <Clock className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 animate-bounce" />
              <div>
                <p className="font-bold">⏰ Time Expired! Exam Automatically Submitted</p>
                <p className="text-[11px] font-normal opacity-90">
                  The exam timer ran out. All completed answers were saved and automatically evaluated.
                </p>
              </div>
            </div>
          )}

          {/* Anti-Farming XP Warning Banner */}
          {evalResult.antiFarmingActive && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-bold">Anti-Farming Protection Active</p>
                <p className="text-[11px] opacity-90">
                  You previously achieved {evalResult.previousBestPercentage}% on this exam paper. XP for retakes is awarded only for net score improvement over your previous best. (+5 XP effort token awarded).
                </p>
              </div>
            </div>
          )}

          {/* Level Up Banner */}
          {evalResult.leveledUp && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-lg space-y-1 animate-in zoom-in-95">
              <div className="flex items-center gap-2 font-bold text-base">
                <Sparkles className="h-5 w-5" />
                <span>LEVEL UP! You reached Level {evalResult.newLevel}!</span>
              </div>
              <p className="text-xs text-amber-100">
                Outstanding board exam performance! Keep maintaining consistency to earn top academic ranks.
              </p>
            </div>
          )}

          {/* Core Score Banner */}
          <Card className="border-emerald-200 dark:border-emerald-950 space-y-6">
            <div className="text-center space-y-3 pt-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 shadow-sm">
                <Award className="h-9 w-9" />
              </div>

              <div>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={evalResult.percentage >= 60 ? 'emerald' : 'amber'}>
                    {evalResult.percentage >= 60 ? 'PASS - BOARD READY' : 'NEEDS REVISION'}
                  </Badge>
                  {evalResult.isRepeatedExam && <Badge variant="outline">Retake Attempt</Badge>}
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {activeExam.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeExam.board} Class {activeExam.classLevel} Evaluation
                </p>
              </div>

              {/* Key Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 max-w-3xl mx-auto pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {evalResult.scoreEarned} / {evalResult.totalMarks}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Percentage</div>
                  <div
                    className={`text-base font-extrabold mt-0.5 ${
                      evalResult.percentage >= 70
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {evalResult.percentage}%
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Accuracy</div>
                  <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {evalResult.accuracyPercentage}%
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    Correct
                  </div>
                  <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {evalResult.correctCount}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                    Wrong
                  </div>
                  <div className="text-base font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">
                    {evalResult.wrongCount}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                    Unanswered
                  </div>
                  <div className="text-base font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">
                    {evalResult.unansweredCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Analysis & Cross System Connectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Performance Analysis: Subject & Time */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-rose-500" />
                  Subject & Speed Analysis
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500">Subject / Class:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {activeExam.subjectId} (Class {activeExam.classLevel})
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500">Chapters Covered:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {activeExam.chapterTopics || 'Full Syllabus'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500">Time Taken:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {Math.floor(evalResult.timeSpentSeconds / 60)}m {evalResult.timeSpentSeconds % 60}s /{' '}
                      {activeExam.durationMinutes}m
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500">Avg Time per Question:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {Math.round(evalResult.timeSpentSeconds / (activeExam.questions.length || 1))} seconds
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">XP Earned:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      +{evalResult.earnedXp} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Weak vs Strong Topics & Ecosystem Links */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4 text-rose-500" />
                  Topic Mastery & Action Plan
                </h4>

                <div className="space-y-2 text-xs">
                  {evalResult.percentage >= 80 ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                      <span className="font-bold">🌟 Strong Mastery Detected:</span> You performed exceptionally on {activeExam.chapterTopics || activeExam.subjectId}.
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                      <span className="font-bold">⚠️ Weak Area Identified:</span> Score &lt; 70% in {activeExam.chapterTopics || activeExam.subjectId}. Auto-added to Weak Topics Manager.
                    </div>
                  )}

                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (onNavigate) onNavigate('ask-ai');
                      }}
                      className="text-[11px] justify-start"
                      icon={<HelpCircle className="h-3.5 w-3.5 text-indigo-500" />}
                    >
                      Ask AI Teacher
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (onNavigate) onNavigate('quiz');
                      }}
                      className="text-[11px] justify-start"
                      icon={<Zap className="h-3.5 w-3.5 text-amber-500" />}
                    >
                      Practice Quiz
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateNotesFromExam}
                      className="text-[11px] justify-start"
                      icon={<BookmarkPlus className="h-3.5 w-3.5 text-rose-500" />}
                    >
                      Generate Notes
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (onNavigate) onNavigate('weak-topics');
                      }}
                      className="text-[11px] justify-start"
                      icon={<Target className="h-3.5 w-3.5 text-emerald-500" />}
                    >
                      Weak Topics Log
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Question & Solutions Review */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-rose-500" />
                {isHindi ? 'प्रश्न-वार विस्तृत उत्तर एवं अंकन योजना' : 'Question Paper Evaluation & Solutions'}
              </h4>

              {activeExam.questions.map((q, idx) => {
                const uAns = userAnswers[q.id] || '';
                const isMcq = q.type === 'mcq';
                const isCorrectMcq = isMcq && uAns.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
                const isUnanswered = !uAns.trim();

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Q{idx + 1}. ({q.section}) - {q.marks} {isHindi ? 'अंक' : 'Marks'}
                      </span>
                      {isMcq ? (
                        <Badge variant={isCorrectMcq ? 'emerald' : isUnanswered ? 'amber' : 'rose'}>
                          {isCorrectMcq ? 'Correct' : isUnanswered ? 'Unanswered' : 'Incorrect'}
                        </Badge>
                      ) : (
                        <Badge variant={uAns.length > 15 ? 'emerald' : isUnanswered ? 'amber' : 'outline'}>
                          {uAns.length > 15 ? 'Detailed Answer' : isUnanswered ? 'Unanswered' : 'Attempted'}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                      {q.question}
                    </p>

                    <div className="text-xs space-y-1">
                      <div className="text-slate-600 dark:text-slate-400">
                        <span className="font-semibold">{isHindi ? 'आपका उत्तर:' : 'Your Answer:'}</span>{' '}
                        <span
                          className={`font-medium ${
                            isCorrectMcq
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                              : isUnanswered
                              ? 'text-amber-600 dark:text-amber-400 italic'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {uAns || '(Unanswered)'}
                        </span>
                      </div>

                      {isMcq ? (
                        <div className="text-emerald-700 dark:text-emerald-300 font-semibold">
                          {isHindi ? 'सही उत्तर:' : 'Correct Choice:'} {q.correctAnswer}
                        </div>
                      ) : (
                        <div className="text-emerald-700 dark:text-emerald-300 font-semibold">
                          {isHindi ? 'आदर्श उत्तर मॉडल:' : 'Model Answer Scheme:'} {q.sampleAnswer}
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200/80 dark:border-slate-700/80">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {isHindi ? 'व्याख्या / अंकन मानदंड:' : 'Marking Breakdown & Explanation:'}{' '}
                      </span>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exam Action Controls Footer */}
            <div className="flex flex-wrap justify-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" icon={<RotateCcw className="h-4 w-4" />} onClick={handleRetryExam}>
                {isHindi ? 'पुनः प्रयास करें (Retry Exam)' : 'Retry Exam'}
              </Button>

              <Button
                variant="outline"
                icon={<History className="h-4 w-4" />}
                onClick={() => {
                  refreshHistory();
                  setActiveTab('history');
                }}
              >
                {isHindi ? 'इतिहास देखें' : 'View History'}
              </Button>

              <Button
                variant="primary"
                icon={<Sparkles className="h-4 w-4" />}
                onClick={() => setActiveTab('setup')}
              >
                {isHindi ? 'नया टेस्ट शुरू करें' : 'Generate New Exam'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* VIEW 4: EXAM HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {viewingHistoryExam ? (
            /* Reviewing Past History Exam */
            <Card className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingHistoryExam(null)}
                  icon={<ChevronLeft className="h-4 w-4" />}
                >
                  {isHindi ? 'वापस जाएं' : 'Back to History'}
                </Button>

                <div className="flex items-center gap-2">
                  <Badge variant="rose">{viewingHistoryExam.board} Exam</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setActiveExam(viewingHistoryExam);
                      handleRetryExam();
                    }}
                  >
                    Retry Paper
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {viewingHistoryExam.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHindi ? 'जमा करने का समय:' : 'Submitted on:'}{' '}
                  {viewingHistoryExam.submittedAt
                    ? new Date(viewingHistoryExam.submittedAt).toLocaleDateString()
                    : 'Past Date'}
                </p>
              </div>

              <div className="space-y-3">
                {viewingHistoryExam.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs space-y-2"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Q{idx + 1}. {q.question}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Your Answer:</span>{' '}
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {q.userAnswer || '(Unanswered)'}
                      </span>
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      Correct Answer / Solution: {q.correctAnswer || q.sampleAnswer}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Explanation: {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            /* History List */
            <div className="space-y-3">
              {examHistory.length === 0 ? (
                <Card className="text-center py-12 space-y-3 border-slate-200 dark:border-slate-800">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                    <History className="h-7 w-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isHindi ? 'कोई पुराना परीक्षा परिणाम नहीं मिला' : 'No Previous Exam Records Found'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {isHindi
                      ? 'जब आप मॉक बोर्ड परीक्षा पूरी करेंगे, तो आपकी मार्कशीट और उत्तर कुंजी यहाँ सहेजी जाएगी।'
                      : 'Complete a timed mock board assessment to view detailed marksheet history and evaluations.'}
                  </p>
                  <Button variant="primary" size="sm" onClick={() => setActiveTab('setup')}>
                    {isHindi ? 'पहला टेस्ट दें' : 'Start First Exam'}
                  </Button>
                </Card>
              ) : (
                examHistory.map((ex) => (
                  <Card
                    key={ex.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-rose-300 dark:hover:border-rose-900 transition-all cursor-pointer"
                    onClick={() => setViewingHistoryExam(ex)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="rose">{ex.board}</Badge>
                        <span className="text-xs text-slate-500">Class {ex.classLevel}</span>
                        {ex.attemptCount && ex.attemptCount > 1 && (
                          <Badge variant="outline">{ex.attemptCount} Attempts</Badge>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {ex.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {ex.questions?.length || 0} Questions • Duration: {ex.durationMinutes} mins
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {ex.scoreEarned ?? 0} / {ex.totalMarks ?? 0} Marks
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {ex.submittedAt ? new Date(ex.submittedAt).toLocaleDateString() : 'Completed'}
                        </div>
                      </div>

                      <Button variant="outline" size="sm" icon={<BookOpen className="h-3.5 w-3.5" />}>
                        {isHindi ? 'समीक्षा करें' : 'Review'}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
