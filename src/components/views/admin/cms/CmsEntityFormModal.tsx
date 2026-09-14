import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Plus,
  Trash2,
  BookOpen,
  Layers,
  FileText,
  HelpCircle,
  Sparkles,
  Calendar,
  GraduationCap
} from 'lucide-react';
import {
  HierarchyLevel,
  ClassLevel,
  AcademicSession,
  CurriculumBoard,
  CurriculumClass,
  CurriculumMedium,
  CurriculumSubject,
  CurriculumBook,
  CurriculumChapter,
  CurriculumTopic,
  CurriculumLesson,
  AdminQuestionRecord,
} from '../../../../types';
import { ContentManagementService } from '../../../../services/contentManagementService';
import { ALL_BOARDS_LIST, ALL_CLASSES_LIST, ALL_MEDIUMS_LIST } from '../../../../services/booksData';
import { Button } from '../../../common/Button';
import { Badge } from '../../../common/Badge';

interface CmsEntityFormModalProps {
  isOpen: boolean;
  level: HierarchyLevel;
  initialData?: any;
  contextParams?: {
    sessionId?: string;
    boardId?: string;
    classLevel?: ClassLevel;
    medium?: string;
    subjectId?: string;
    bookId?: string;
    chapterId?: string;
    topicId?: string;
  };
  onClose: () => void;
  onSaveSuccess: (savedItem: any) => void;
}

export const CmsEntityFormModal: React.FC<CmsEntityFormModalProps> = ({
  isOpen,
  level,
  initialData,
  contextParams,
  onClose,
  onSaveSuccess,
}) => {
  const isEdit = !!initialData?.id;

  // Generic Form State
  const [nameOrTitle, setNameOrTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived' | 'published'>('active');

  // Hierarchy Specific States
  const [sessionYear, setSessionYear] = useState('2026-2027');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2027-03-31');
  const [isCurrentSession, setIsCurrentSession] = useState(true);

  const [selectedBoard, setSelectedBoard] = useState<string>(contextParams?.boardId || 'CBSE');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(contextParams?.classLevel || '10');
  const [selectedMedium, setSelectedMedium] = useState<string>(contextParams?.medium || 'English');
  const [subjectCategory, setSubjectCategory] = useState<'Core' | 'Elective' | 'Language' | 'Vocational'>('Core');

  // Book Specific
  const [bookAuthor, setBookAuthor] = useState('NCERT Curriculum Committee');
  const [bookPublisher, setBookPublisher] = useState('National Council of Educational Research & Training');
  const [bookLicense, setBookLicense] = useState('NCERT Open Educational Resource (OER) - CC BY-NC 4.0');
  const [isCopyrightAuthorized, setIsCopyrightAuthorized] = useState(true);
  const [editionBadge, setEditionBadge] = useState('2026 Edition');

  // Chapter Specific
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [estimatedHours, setEstimatedHours] = useState<number>(6);

  // Topic Specific
  const [topicSummary, setTopicSummary] = useState('');
  const [topicDifficulty, setTopicDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  // Lesson Specific
  const [lessonContentType, setLessonContentType] = useState<'text' | 'ai-explained' | 'video-summary' | 'interactive'>('text');
  const [lessonMarkdown, setLessonMarkdown] = useState('');
  const [lessonMinutes, setLessonMinutes] = useState<number>(10);

  // Question Specific
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'mcq' | 'short_answer' | 'long_answer' | 'assertion_reason'>('mcq');
  const [mcqOptions, setMcqOptions] = useState<string[]>(['Option A', 'Option B', 'Option C', 'Option D']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isVerifiedQuestion, setIsVerifiedQuestion] = useState(true);

  // Validation Error State
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setNameOrTitle(initialData.name || initialData.title || initialData.question || '');
      setDescription(initialData.description || initialData.summary || '');
      setCode(initialData.code || '');
      setStatus(initialData.status || (level === 'book' ? 'published' : 'active'));

      if (level === 'session') {
        setSessionYear(initialData.academicYear || '2026-2027');
        setStartDate(initialData.startDate || '2026-04-01');
        setEndDate(initialData.endDate || '2027-03-31');
        setIsCurrentSession(initialData.isCurrent ?? true);
      } else if (level === 'subject') {
        setSelectedClass(initialData.classLevel || '10');
        setSelectedBoard(initialData.boardId || 'CBSE');
        setSelectedMedium(initialData.medium || 'English');
        setSubjectCategory(initialData.category || 'Core');
      } else if (level === 'book') {
        setSelectedClass(initialData.classLevel || '10');
        setSelectedBoard(initialData.boardId || 'CBSE');
        setSelectedMedium(initialData.medium || 'English');
        setBookAuthor(initialData.author || 'NCERT Curriculum Committee');
        setBookPublisher(initialData.publisher || 'NCERT');
        setBookLicense(initialData.licenseInfo || 'NCERT Open Educational Resource (OER) - CC BY-NC 4.0');
        setIsCopyrightAuthorized(initialData.isAuthorized ?? true);
        setEditionBadge(initialData.editionBadge || '2026 Edition');
      } else if (level === 'chapter') {
        setChapterNumber(initialData.number || 1);
        setEstimatedHours(initialData.estimatedHours || 6);
      } else if (level === 'topic') {
        setTopicSummary(initialData.summary || '');
        setTopicDifficulty(initialData.difficulty || 'Medium');
      } else if (level === 'lesson') {
        setLessonContentType(initialData.contentType || 'text');
        setLessonMarkdown(initialData.contentMarkdown || '');
        setLessonMinutes(initialData.estimatedMinutes || 10);
      } else if (level === 'question') {
        setQuestionText(initialData.question || '');
        setQuestionType(initialData.type || 'mcq');
        setMcqOptions(initialData.options || ['Option A', 'Option B', 'Option C', 'Option D']);
        setCorrectAnswer(initialData.correctAnswer || '');
        setExplanation(initialData.explanation || '');
        setIsVerifiedQuestion(initialData.verifiedByAdmin ?? true);
      }
    } else {
      // Default reset
      setNameOrTitle('');
      setDescription('');
      setCode('');
      setStatus(level === 'book' || level === 'chapter' ? 'published' : 'active');
      setLessonMarkdown('# Lesson Title\n\nLesson content overview and key concepts here.');
      if (contextParams?.classLevel) setSelectedClass(contextParams.classLevel);
      if (contextParams?.boardId) setSelectedBoard(contextParams.boardId);
      if (contextParams?.medium) setSelectedMedium(contextParams.medium);
    }
  }, [initialData, level, contextParams, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const now = new Date().toISOString();

    if (level === 'session') {
      const payload: Partial<AcademicSession> = {
        id: initialData?.id,
        name: nameOrTitle.trim(),
        academicYear: sessionYear.trim(),
        startDate,
        endDate,
        isCurrent: isCurrentSession,
        status: status as any,
        description: description.trim(),
      };
      const res = ContentManagementService.saveSession(payload);
      if (!res.success) return setFormErrors(res.errors || ['Validation failed']);
      onSaveSuccess(res.session);
    } else if (level === 'board') {
      const payload: Partial<CurriculumBoard> = {
        id: initialData?.id,
        sessionId: contextParams?.sessionId || 'sess-2026-2027',
        name: nameOrTitle.trim(),
        code: code.trim().toUpperCase() || nameOrTitle.slice(0, 4).toUpperCase(),
        country: 'India',
        status: status as any,
        description: description.trim(),
      };
      const res = ContentManagementService.saveBoard(payload);
      if (!res.success) return setFormErrors(res.errors || ['Validation failed']);
      onSaveSuccess(res.board);
    } else if (level === 'class') {
      const payload: Partial<CurriculumClass> = {
        id: initialData?.id,
        boardId: selectedBoard,
        sessionId: contextParams?.sessionId || 'sess-2026-2027',
        classLevel: selectedClass,
        name: nameOrTitle.trim() || `Class ${selectedClass}`,
        status: status as any,
        description: description.trim(),
      };
      const res = ContentManagementService.saveClass(payload);
      if (!res.success) return setFormErrors(res.errors || ['Validation failed']);
      onSaveSuccess(res.classItem);
    } else if (level === 'medium') {
      const payload: Partial<CurriculumMedium> = {
        id: initialData?.id,
        name: nameOrTitle.trim(),
        code: code.trim().toUpperCase() || nameOrTitle.slice(0, 3).toUpperCase(),
        status: status as any,
        description: description.trim(),
      };
      const res = ContentManagementService.saveMedium(payload);
      if (!res.success) return setFormErrors(res.errors || ['Validation failed']);
      onSaveSuccess(res.medium);
    } else if (level === 'subject') {
      const payload: Partial<CurriculumSubject> = {
        id: initialData?.id,
        boardId: selectedBoard,
        sessionId: contextParams?.sessionId || 'sess-2026-2027',
        classLevel: selectedClass,
        medium: selectedMedium,
        name: nameOrTitle.trim(),
        code: code.trim() || '001',
        category: subjectCategory,
        description: description.trim(),
        status: status as any,
      };
      const res = ContentManagementService.saveSubject(payload);
      if (!res.success) return setFormErrors(res.errors || ['Validation failed']);
      onSaveSuccess(res.subject);
    } else if (level === 'book') {
      const payload: Partial<CurriculumBook> = {
        id: initialData?.id,
        sessionId: contextParams?.sessionId || 'sess-2026-2027',
        boardId: selectedBoard,
        classLevel: selectedClass,
        medium: selectedMedium,
        subjectId: contextParams?.subjectId || nameOrTitle.toLowerCase().replace(/[^a-z0-9]/g, ''),
        subjectName: nameOrTitle.trim(),
        title: nameOrTitle.trim(),
        author: bookAuthor.trim(),
        publisher: bookPublisher.trim(),
        editionBadge: editionBadge.trim(),
        description: description.trim(),
        licenseInfo: bookLicense.trim(),
        isAuthorized: isCopyrightAuthorized,
        status: status as any,
        chapters: initialData?.chapters || [],
      };
      const res = ContentManagementService.saveBook(payload);
      if (!res.success) return setFormErrors(res.errors || ['Validation failed']);
      onSaveSuccess(res.book);
    } else if (level === 'chapter') {
      const bookId = contextParams?.bookId || initialData?.bookId;
      if (!bookId) return setFormErrors(['Parent book context is required to save chapter.']);
      const payload: Partial<CurriculumChapter> = {
        id: initialData?.id,
        bookId,
        number: Number(chapterNumber) || 1,
        title: nameOrTitle.trim(),
        description: description.trim(),
        estimatedHours: Number(estimatedHours) || 6,
        status: status as any,
      };
      const res = ContentManagementService.saveChapter(bookId, payload);
      if (!res.success) return setFormErrors(res.errors || ['Validation failed']);
      onSaveSuccess(res.chapter);
    } else if (level === 'topic') {
      const bookId = contextParams?.bookId;
      const chapterId = contextParams?.chapterId || initialData?.chapterId;
      if (!bookId || !chapterId) return setFormErrors(['Book & Chapter context required.']);
      const payload: Partial<CurriculumTopic> = {
        id: initialData?.id,
        chapterId,
        title: nameOrTitle.trim(),
        summary: topicSummary.trim() || description.trim(),
        difficulty: topicDifficulty,
        status: status as any,
      };
      const res = ContentManagementService.saveTopic(bookId, chapterId, payload);
      if (!res.success) return setFormErrors(res.errors || ['Validation failed']);
      onSaveSuccess(res.topic);
    } else if (level === 'lesson') {
      const bookId = contextParams?.bookId;
      const chapterId = contextParams?.chapterId;
      const topicId = contextParams?.topicId || initialData?.topicId;
      if (!bookId || !chapterId || !topicId) return setFormErrors(['Complete parent context required for lesson.']);
      const payload: Partial<CurriculumLesson> = {
        id: initialData?.id,
        topicId,
        title: nameOrTitle.trim(),
        contentType: lessonContentType,
        contentMarkdown: lessonMarkdown.trim(),
        estimatedMinutes: Number(lessonMinutes) || 10,
        status: status as any,
      };
      const res = ContentManagementService.saveLesson(bookId, chapterId, topicId, payload);
      if (!res.success) return setFormErrors(res.errors || ['Validation failed']);
      onSaveSuccess(res.lesson);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...mcqOptions];
    updated[index] = val;
    setMcqOptions(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {level === 'book' && <BookOpen className="w-5 h-5" />}
              {level === 'chapter' && <Layers className="w-5 h-5" />}
              {level === 'topic' && <FileText className="w-5 h-5" />}
              {level === 'lesson' && <Sparkles className="w-5 h-5" />}
              {level === 'question' && <HelpCircle className="w-5 h-5" />}
              {level === 'session' && <Calendar className="w-5 h-5" />}
              {level === 'board' && <GraduationCap className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {isEdit ? `Edit ${level}` : `Create New ${level}`}
              </h3>
              <p className="text-xs text-slate-500">Validated curriculum entity manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Validation Feedback */}
          {formErrors.length > 0 && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-semibold space-y-1">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Please correct the following:</span>
              </div>
              <ul className="list-disc ml-5 text-[11px] space-y-0.5">
                {formErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Primary Name / Title */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              {level === 'question' ? 'Question Statement' : `${level.charAt(0).toUpperCase() + level.slice(1)} Title / Name`}:
            </label>
            {level === 'question' ? (
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter complete question statement..."
                rows={3}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <input
                type="text"
                value={nameOrTitle}
                onChange={(e) => setNameOrTitle(e.target.value)}
                placeholder={`e.g. ${level === 'session' ? 'Academic Session 2026–2027' : level === 'book' ? 'NCERT Science (Class 10)' : 'Title...'}`}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* Context Selectors for Subject / Book / Class */}
          {(level === 'subject' || level === 'book' || level === 'class') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Target Board:</label>
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {ALL_BOARDS_LIST.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Class Level:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {ALL_CLASSES_LIST.map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Medium:</label>
                <select
                  value={selectedMedium}
                  onChange={(e) => setSelectedMedium(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {ALL_MEDIUMS_LIST.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Book Copyright & Legal Authorization Section */}
          {level === 'book' && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-indigo-950 dark:text-indigo-200">
                  Copyright & Legal Authorization Declaration
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Author / Committee:</label>
                  <input
                    type="text"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Publisher:</label>
                  <input
                    type="text"
                    value={bookPublisher}
                    onChange={(e) => setBookPublisher(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">License Notice:</label>
                <select
                  value={bookLicense}
                  onChange={(e) => setBookLicense(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                >
                  <option value="NCERT Open Educational Resource (OER) - CC BY-NC 4.0">NCERT Open Educational Resource (OER) - CC BY-NC 4.0</option>
                  <option value="SCERT State Open Syllabus (CC BY 4.0)">SCERT State Open Syllabus (CC BY 4.0)</option>
                  <option value="Public Domain Educational Works">Public Domain Educational Works</option>
                  <option value="Official Institutional Partner License">Official Institutional Partner License</option>
                </select>
              </div>

              <label className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isCopyrightAuthorized}
                  onChange={(e) => setIsCopyrightAuthorized(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>I confirm this content is legally authorized under Open Educational Resources / Fair Use.</span>
              </label>
            </div>
          )}

          {/* Chapter Specific Form */}
          {level === 'chapter' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Chapter Number:</label>
                <input
                  type="number"
                  min={1}
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Estimated Hours:</label>
                <input
                  type="number"
                  min={1}
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Lesson Markdown & Content */}
          {level === 'lesson' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Content Type:</label>
                  <select
                    value={lessonContentType}
                    onChange={(e) => setLessonContentType(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="text">Rich Text & Explanations</option>
                    <option value="ai-explained">AI Step-by-Step Breakdown</option>
                    <option value="video-summary">Video Concept Notes</option>
                    <option value="interactive">Interactive Playground</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Reading Time (Minutes):</label>
                  <input
                    type="number"
                    min={1}
                    value={lessonMinutes}
                    onChange={(e) => setLessonMinutes(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Lesson Markdown Content:</label>
                <textarea
                  value={lessonMarkdown}
                  onChange={(e) => setLessonMarkdown(e.target.value)}
                  rows={8}
                  className="w-full mt-1 font-mono text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Description / Summary Field */}
          {level !== 'lesson' && (
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Description / Syllabus Overview:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Curriculum learning outcomes, chapter scope and topics..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Status Switcher */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-700 dark:text-slate-300">Publishing Status:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`px-3 py-1 rounded-lg font-bold text-xs ${
                  status === 'active' || status === 'published'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Published / Active
              </button>
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`px-3 py-1 rounded-lg font-bold text-xs ${
                  status === 'draft'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Draft
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full justify-center">
              <Save className="w-4 h-4 mr-1.5" /> Save {level.toUpperCase()}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
