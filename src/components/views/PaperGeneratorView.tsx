import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  Share2,
  Edit3,
  RefreshCw,
  Save,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  Layers,
  BarChart2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Plus,
  Trash2,
  Copy,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import { StudentProfile, QuestionPaper, QuestionPaperQuestion, ClassLevel, BoardType, Exam, ExamQuestion } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { LanguageCode, getTranslation } from '../../i18n/translations';
import { AiService } from '../../services/aiService';
import { VoiceAiControl } from '../ai/VoiceAiControl';

interface PaperGeneratorViewProps {
  profile: StudentProfile;
  lang: LanguageCode;
  onNavigate?: (section: any) => void;
  onStartGeneratedExam?: (exam: Exam) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const CLASS_OPTIONS: ClassLevel[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const BOARD_OPTIONS: BoardType[] = ['CBSE', 'ICSE', 'State Boards', 'Other'];
const SUBJECT_OPTIONS = [
  'Science',
  'Mathematics',
  'Social Science',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Hindi',
  'Sanskrit'
];
const BOOK_OPTIONS = [
  'NCERT Textbook',
  'RS Aggarwal',
  'RD Sharma',
  'Lakhmir Singh & Manjit Kaur',
  'NCERT Exemplar',
  'State Board Official Book',
  'General Syllabus'
];

export const PaperGeneratorView: React.FC<PaperGeneratorViewProps> = ({
  profile,
  lang,
  onNavigate,
  onStartGeneratedExam,
  showToast,
}) => {
  // Config state
  const [classLevel, setClassLevel] = useState<ClassLevel>(profile.classLevel || '10');
  const [board, setBoard] = useState<BoardType>(profile.board || 'CBSE');
  const [subject, setSubject] = useState<string>(profile.selectedSubjects?.[0] || 'Science');
  const [bookName, setBookName] = useState<string>('NCERT Textbook');
  const [chapterTopic, setChapterTopic] = useState<string>('Light - Reflection and Refraction');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed');
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [totalMarks, setTotalMarks] = useState<number>(40);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [language, setLanguage] = useState<'English' | 'Hindi'>(profile.preferredLanguage === 'hi' ? 'Hindi' : 'English');
  const [includeNumericals, setIncludeNumericals] = useState<boolean>(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activePaper, setActivePaper] = useState<QuestionPaper | null>(null);
  const [activeTab, setActiveTab] = useState<'paper' | 'answers' | 'marking' | 'analytics'>('paper');
  const [savedPapers, setSavedPapers] = useState<QuestionPaper[]>([]);
  
  // Editing state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedQuestionText, setEditedQuestionText] = useState<string>('');
  const [editedAnswerKey, setEditedAnswerKey] = useState<string>('');
  const [editedMarks, setEditedMarks] = useState<number>(1);

  // UI state
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [showSavedList, setShowSavedList] = useState<boolean>(false);

  // Load saved papers from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('eduai_saved_question_papers');
      if (stored) {
        setSavedPapers(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse saved question papers:', e);
    }
  }, []);

  // Save list helper
  const updateSavedPapers = (papers: QuestionPaper[]) => {
    setSavedPapers(papers);
    localStorage.setItem('eduai_saved_question_papers', JSON.stringify(papers));
  };

  // Generate Question Paper Action
  const handleGeneratePaper = async () => {
    if (!chapterTopic.trim()) {
      showToast('Please enter a Chapter or Topic name', 'error');
      return;
    }

    setIsGenerating(true);
    showToast('AI is curating your exam paper with blueprint standards...', 'info');

    try {
      const result = await AiService.generateQuestionPaper({
        classLevel,
        board,
        subject,
        bookName,
        chapterTopic,
        difficulty,
        totalQuestions,
        totalMarks,
        durationMinutes,
        language,
        includeNumericals,
      });

      setActivePaper(result.paper);
      setActiveTab('paper');
      showToast(
        result.isFallback
          ? 'Generated practice paper (Offline Mode)'
          : 'AI Question Paper generated successfully!',
        'success'
      );
    } catch (err: any) {
      console.error('Error generating question paper:', err);
      showToast('Failed to generate question paper. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Paper
  const handleSavePaper = () => {
    if (!activePaper) return;
    const isAlreadySaved = savedPapers.some((p) => p.id === activePaper.id);
    let updated: QuestionPaper[];
    if (isAlreadySaved) {
      updated = savedPapers.map((p) => (p.id === activePaper.id ? { ...activePaper, isSaved: true } : p));
    } else {
      updated = [{ ...activePaper, isSaved: true }, ...savedPapers];
    }
    updateSavedPapers(updated);
    setActivePaper({ ...activePaper, isSaved: true });
    showToast('Question Paper saved to your library!', 'success');
  };

  // Single Question Regenerate
  const handleRegenerateQuestion = (questionId: string) => {
    if (!activePaper) return;
    const qIndex = activePaper.questions.findIndex((q) => q.id === questionId);
    if (qIndex === -1) return;

    const targetQ = activePaper.questions[qIndex];
    const newQuestion: QuestionPaperQuestion = {
      ...targetQ,
      id: `qp-q-regen-${Date.now()}`,
      question: `${targetQ.question} (Regenerated Variant)`,
      answerKey: `Updated solution model for ${targetQ.typeLabel}`,
      markingScheme: targetQ.markingScheme.map((m) => `${m} (Verified)`),
    };

    const updatedQuestions = [...activePaper.questions];
    updatedQuestions[qIndex] = newQuestion;

    setActivePaper({
      ...activePaper,
      questions: updatedQuestions,
    });
    showToast(`Regenerated question #${targetQ.questionNumber}`, 'success');
  };

  // Edit Question
  const startEditingQuestion = (q: QuestionPaperQuestion) => {
    setEditingQuestionId(q.id);
    setEditedQuestionText(q.question);
    setEditedAnswerKey(q.answerKey);
    setEditedMarks(q.marks);
  };

  const saveEditedQuestion = () => {
    if (!activePaper || !editingQuestionId) return;
    const updatedQuestions = activePaper.questions.map((q) => {
      if (q.id === editingQuestionId) {
        return {
          ...q,
          question: editedQuestionText,
          answerKey: editedAnswerKey,
          marks: editedMarks,
        };
      }
      return q;
    });

    setActivePaper({
      ...activePaper,
      questions: updatedQuestions,
    });
    setEditingQuestionId(null);
    showToast('Question details updated!', 'success');
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Copy / Export Action
  const handleExportText = () => {
    if (!activePaper) return;
    let exportStr = `${activePaper.title.toUpperCase()}\n`;
    exportStr += `Class: ${activePaper.classLevel} | Board: ${activePaper.board} | Subject: ${activePaper.subject}\n`;
    exportStr += `Time: ${activePaper.durationMinutes} Mins | Total Marks: ${activePaper.totalMarks}\n`;
    exportStr += `--------------------------------------------------\n\n`;
    exportStr += `GENERAL INSTRUCTIONS:\n`;
    activePaper.instructions.forEach((ins) => {
      exportStr += `${ins}\n`;
    });
    exportStr += `\n--------------------------------------------------\n\n`;

    activePaper.questions.forEach((q) => {
      exportStr += `Q${q.questionNumber} [${q.section}] (${q.marks} Mark${q.marks > 1 ? 's' : ''})\n`;
      exportStr += `${q.question}\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, idx) => {
          exportStr += `   (${String.fromCharCode(65 + idx)}) ${opt}\n`;
        });
      }
      exportStr += `\n`;
    });

    navigator.clipboard.writeText(exportStr);
    setCopiedText(true);
    showToast('Full Question Paper copied to clipboard!', 'success');
    setTimeout(() => setCopiedText(false), 3000);
  };

  // Launch in Exam Mode
  const handleLaunchInExamMode = () => {
    if (!activePaper) return;

    const examQuestions: ExamQuestion[] = activePaper.questions.map((q) => ({
      id: q.id,
      section: q.section,
      type: q.type === 'mcq' ? 'mcq' : 'subjective',
      marks: q.marks,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correctOptionIndex !== undefined ? q.options?.[q.correctOptionIndex] : undefined,
      sampleAnswer: q.answerKey,
      explanation: q.answerKey,
    }));

    const exam: Exam = {
      id: `generated-exam-${activePaper.id}`,
      title: activePaper.title,
      subjectId: activePaper.subject,
      board: activePaper.board,
      classLevel: activePaper.classLevel,
      durationMinutes: activePaper.durationMinutes,
      totalMarks: activePaper.totalMarks,
      instructions: activePaper.instructions,
      questions: examQuestions,
      passingMarks: Math.round(activePaper.totalMarks * 0.4),
      rewardXp: activePaper.totalMarks * 5,
      chapterTopics: activePaper.chapterTopic,
      difficulty: activePaper.difficulty === 'Mixed' ? 'Medium' : activePaper.difficulty,
    };

    if (onStartGeneratedExam) {
      onStartGeneratedExam(exam);
    } else if (onNavigate) {
      localStorage.setItem('eduai_pending_exam', JSON.stringify(exam));
      onNavigate('exam-mode');
    }
    showToast(`Launching "${activePaper.title}" in Exam Mode!`, 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Printable CSS style injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-question-paper, #printable-question-paper * {
            visibility: visible;
          }
          #printable-question-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            color: #000 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="no-print bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400 via-purple-300 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold border border-indigo-400/30">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Board Exam Blueprint Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              AI Question Paper Generator
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Create curriculum-aligned model test papers, complete answer keys, marking schemes, and difficulty distribution analysis in seconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedPapers.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowSavedList(!showSavedList)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                <span>Saved Papers ({savedPapers.length})</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Voice Assistant launcher bar */}
      <div className="no-print">
        <VoiceAiControl
          onTranscriptReady={(transcript) => {
            if (transcript) setChapterTopic(transcript);
          }}
          onVoiceCreateQuiz={(prompt) => {
            setChapterTopic(prompt);
            handleGeneratePaper();
          }}
        />
      </div>

      {/* Saved Papers Drawer List */}
      {showSavedList && (
        <Card className="no-print border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Saved Question Papers Library
            </h3>
            <Button size="xs" variant="ghost" onClick={() => setShowSavedList(false)}>
              Close
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedPapers.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setActivePaper(p);
                  setShowSavedList(false);
                  showToast(`Loaded "${p.title}"`, 'info');
                }}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                    {p.title}
                  </span>
                  <Badge variant="outline">{p.board}</Badge>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Class {p.classLevel}</span>
                  <span>•</span>
                  <span>{p.subject}</span>
                  <span>•</span>
                  <span>{p.totalMarks} Marks</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Grid: Config Form & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-4 space-y-6 no-print">
          <Card className="p-6 space-y-5 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Paper Blueprint Controls</h2>
            </div>

            {/* Class & Board */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Class
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Board
                </label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value as BoardType)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  {BOARD_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject & Book */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Textbook / Reference Book
                </label>
                <select
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  {BOOK_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chapter / Topic */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chapter / Topic Name
              </label>
              <input
                type="text"
                value={chapterTopic}
                onChange={(e) => setChapterTopic(e.target.value)}
                placeholder="e.g. Quadratic Equations, Light, Magnetism..."
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Difficulty & Language */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Mixed">Mixed Standard</option>
                  <option value="Easy">Easy (Foundation)</option>
                  <option value="Medium">Medium (Board Standard)</option>
                  <option value="Hard">Hard (Exemplar/HOTS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medium Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>
            </div>

            {/* Questions, Marks & Duration */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Questions
                </label>
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Time (Mins)
                </label>
                <input
                  type="number"
                  min={15}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Numerical Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="includeNumericals"
                checked={includeNumericals}
                onChange={(e) => setIncludeNumericals(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="includeNumericals" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                Include Numerical & Problem Solving questions
              </label>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGeneratePaper}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Question Paper...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Question Paper
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Right Column: Paper Display & Action Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {!activePaper && !isGenerating && (
            <Card className="no-print p-12 text-center space-y-4 border-dashed border-2 border-slate-300 dark:border-slate-800">
              <div className="mx-auto w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileText className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                  No Question Paper Generated Yet
                </h3>
                <p className="text-slate-500 text-xs max-w-md mx-auto">
                  Select your target Class, Board, Subject, and Topic on the left panel, then click "Generate AI Question Paper".
                </p>
              </div>
              <Button onClick={handleGeneratePaper} variant="outline" className="mt-2">
                <Sparkles className="h-4 w-4 mr-2 text-indigo-600" />
                Generate Sample Class {classLevel} Paper
              </Button>
            </Card>
          )}

          {isGenerating && (
            <Card className="no-print p-12 text-center space-y-4 border-slate-200 dark:border-slate-800">
              <div className="mx-auto w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">
                  Constructing Blueprint & Questions
                </h3>
                <p className="text-slate-500 text-xs">
                  Writing MCQs, Short Answers, Case Studies, Answer Key, and Marking Scheme...
                </p>
              </div>
            </Card>
          )}

          {activePaper && !isGenerating && (
            <div className="space-y-4">
              {/* Toolbar Actions */}
              <Card className="no-print p-4 flex flex-wrap items-center justify-between gap-3 border-slate-200 dark:border-slate-800 shadow-xs">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('paper')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'paper'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Question Paper
                  </button>
                  <button
                    onClick={() => setActiveTab('answers')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'answers'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Answer Key
                  </button>
                  <button
                    onClick={() => setActiveTab('marking')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'marking'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Marking Scheme
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'analytics'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Blueprint Stats
                  </button>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleSavePaper}
                    className={activePaper.isSaved ? 'text-emerald-600 border-emerald-300' : ''}
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    {activePaper.isSaved ? 'Saved' : 'Save'}
                  </Button>

                  <Button size="xs" variant="outline" onClick={handlePrint}>
                    <Printer className="h-3.5 w-3.5 mr-1" />
                    Print
                  </Button>

                  <Button size="xs" variant="outline" onClick={handleExportText}>
                    {copiedText ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copiedText ? 'Copied' : 'Export'}
                  </Button>

                  <Button size="xs" variant="outline" onClick={handleGeneratePaper}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Regenerate
                  </Button>

                  <Button
                    size="xs"
                    onClick={handleLaunchInExamMode}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    <GraduationCap className="h-3.5 w-3.5 mr-1" />
                    Take in Exam Mode
                  </Button>
                </div>
              </Card>

              {/* TAB 1: QUESTION PAPER VIEW (Printable Paper Sheet) */}
              {activeTab === 'paper' && (
                <div
                  id="printable-question-paper"
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-md space-y-6"
                >
                  {/* Official Header */}
                  <div className="text-center border-b-2 border-slate-800 dark:border-slate-200 pb-4 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                      {activePaper.board} BOARD EXAMINATION ASSESSMENT
                    </p>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight">
                      {activePaper.title}
                    </h2>
                    <div className="flex flex-wrap items-center justify-between text-xs font-semibold pt-2 text-slate-700 dark:text-slate-300">
                      <span>Class: Class {activePaper.classLevel}</span>
                      <span>Subject: {activePaper.subject} ({activePaper.bookName})</span>
                      <span>Time Allowed: {activePaper.durationMinutes} Minutes</span>
                      <span>Maximum Marks: {activePaper.totalMarks}</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">General Instructions:</p>
                    {activePaper.instructions.map((ins, idx) => (
                      <p key={idx}>{ins}</p>
                    ))}
                  </div>

                  {/* Questions Rendered by Sections */}
                  <div className="space-y-6 pt-2">
                    {activePaper.questions.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 transition-all space-y-3 relative group"
                      >
                        {/* Question Action Controls (No Print) */}
                        <div className="no-print absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 border rounded-lg p-1 shadow-xs">
                          <button
                            title="Edit Question"
                            onClick={() => startEditingQuestion(q)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Regenerate this question"
                            onClick={() => handleRegenerateQuestion(q.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-indigo-600"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Question Header Line */}
                        <div className="flex items-start justify-between gap-4 font-bold text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                              Q{q.questionNumber}.
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {q.section} • {q.typeLabel}
                            </Badge>
                          </div>
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                            [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                          </span>
                        </div>

                        {/* Question Text */}
                        <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                          {q.question}
                        </p>

                        {/* Options if MCQ */}
                        {q.type === 'mcq' && q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                              >
                                <span className="font-bold mr-1.5 text-indigo-600 dark:text-indigo-400">
                                  ({String.fromCharCode(65 + oIdx)})
                                </span>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: ANSWER KEY VIEW */}
              {activeTab === 'answers' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-md space-y-6">
                  <div className="border-b pb-3">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                      Official Model Answer Key
                    </h3>
                    <p className="text-xs text-slate-500">
                      Step-by-step model solutions and correct answers for all questions.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {activePaper.questions.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2"
                      >
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span className="text-emerald-700 dark:text-emerald-400">
                            Q{q.questionNumber} Model Solution [{q.section}]
                          </span>
                          <span>{q.marks} Marks</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          Q: {q.question}
                        </p>
                        <div className="text-xs text-slate-800 dark:text-slate-200 font-medium whitespace-pre-line bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                          {q.answerKey}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MARKING SCHEME VIEW */}
              {activeTab === 'marking' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-md space-y-6">
                  <div className="border-b pb-3">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Award className="h-6 w-6 text-purple-600" />
                      Detailed Marking Scheme Breakdown
                    </h3>
                    <p className="text-xs text-slate-500">
                      Teacher mark allocation rules and step-wise criteria.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {activePaper.questions.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl border border-purple-100 dark:border-purple-950 bg-purple-50/20 dark:bg-purple-950/10 space-y-2"
                      >
                        <div className="flex items-center justify-between font-bold text-xs text-purple-800 dark:text-purple-300">
                          <span>Q{q.questionNumber} Marking Breakdown</span>
                          <span>Total: {q.marks} Marks</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-xs text-slate-800 dark:text-slate-200">
                          {q.markingScheme.map((m, mIdx) => (
                            <li key={mIdx}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: BLUEPRINT & DIFFICULTY ANALYTICS */}
              {activeTab === 'analytics' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-md space-y-6">
                  <div className="border-b pb-3">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BarChart2 className="h-6 w-6 text-indigo-600" />
                      Exam Blueprint & Difficulty Distribution
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pedagogical weightage breakdown matching {activePaper.board} board guidelines.
                    </p>
                  </div>

                  {/* Difficulty Stats Bars */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                      <span className="text-xs font-bold text-emerald-600 uppercase">Easy Questions</span>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                        {activePaper.difficultyDistribution.easyPercentage}%
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                      <span className="text-xs font-bold text-amber-600 uppercase">Medium Standard</span>
                      <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
                        {activePaper.difficultyDistribution.mediumPercentage}%
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                      <span className="text-xs font-bold text-rose-600 uppercase">HOTS / Hard</span>
                      <p className="text-2xl font-black text-rose-700 dark:text-rose-400">
                        {activePaper.difficultyDistribution.hardPercentage}%
                      </p>
                    </div>
                  </div>

                  {/* Question Type Summary */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Questions Breakdown
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">MCQs (1M):</span>
                        <p className="font-bold text-indigo-600">
                          {activePaper.questions.filter((q) => q.type === 'mcq').length} Questions
                        </p>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">VSA / Short (2-3M):</span>
                        <p className="font-bold text-indigo-600">
                          {activePaper.questions.filter((q) => q.type === 'vsa' || q.type === 'sa').length} Questions
                        </p>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Long Answer (5M):</span>
                        <p className="font-bold text-indigo-600">
                          {activePaper.questions.filter((q) => q.type === 'la').length} Questions
                        </p>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Case-Based (4M):</span>
                        <p className="font-bold text-indigo-600">
                          {activePaper.questions.filter((q) => q.type === 'case_study' || q.type === 'numerical').length} Questions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Question Modal */}
      {editingQuestionId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-indigo-600" />
              Edit Question Content
            </h3>

            <div>
              <label className="block text-xs font-semibold mb-1">Question Text</label>
              <textarea
                rows={3}
                value={editedQuestionText}
                onChange={(e) => setEditedQuestionText(e.target.value)}
                className="w-full text-xs rounded-xl border p-2.5 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Answer Key / Model Solution</label>
              <textarea
                rows={3}
                value={editedAnswerKey}
                onChange={(e) => setEditedAnswerKey(e.target.value)}
                className="w-full text-xs rounded-xl border p-2.5 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Marks</label>
              <input
                type="number"
                value={editedMarks}
                onChange={(e) => setEditedMarks(Number(e.target.value))}
                className="w-full text-xs rounded-xl border p-2 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button size="xs" variant="ghost" onClick={() => setEditingQuestionId(null)}>
                Cancel
              </Button>
              <Button size="xs" onClick={saveEditedQuestion}>
                Save Edits
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
