import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
  Sparkles,
  Layers,
  BookOpen,
  X,
  Eye,
  Tag,
  GraduationCap
} from 'lucide-react';
import { AdminQuestionRecord, ClassLevel } from '../../../../types';
import { AdminService } from '../../../../services/adminService';
import { ALL_CLASSES_LIST } from '../../../../services/booksData';
import { Card } from '../../../common/Card';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';

export const AdminQuestionsTab: React.FC = () => {
  const [questions, setQuestions] = useState<AdminQuestionRecord[]>(() =>
    AdminService.getQuestionsList()
  );
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedQ, setSelectedQ] = useState<AdminQuestionRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [fQuestion, setFQuestion] = useState('');
  const [fSubject, setFSubject] = useState('Science');
  const [fClass, setFClass] = useState<ClassLevel>('10');
  const [fTopic, setFTopic] = useState('');
  const [fType, setFType] = useState<'mcq' | 'short_answer' | 'long_answer' | 'assertion_reason'>('mcq');
  const [fDifficulty, setFDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [fOptions, setFOptions] = useState<string>('Option A\nOption B\nOption C\nOption D');
  const [fCorrectAnswer, setFCorrectAnswer] = useState('');
  const [fExplanation, setFExplanation] = useState('');

  const filteredQuestions = questions.filter((q) => {
    const matchClass = selectedClass === 'All' || q.classLevel === selectedClass;
    const matchSubject = selectedSubject === 'All' || q.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchType = selectedType === 'All' || q.type === selectedType;
    const matchDiff = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
    const matchSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSubject && matchType && matchDiff && matchSearch;
  });

  const showToast = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleToggleVerify = (id: string) => {
    AdminService.toggleQuestionVerification(id);
    setQuestions(AdminService.getQuestionsList());
    showToast('Question verification status updated.');
  };

  const handleDelete = (id: string) => {
    AdminService.deleteQuestionRecord(id);
    setQuestions(AdminService.getQuestionsList());
    showToast('Question deleted from bank.');
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fQuestion.trim() || !fCorrectAnswer.trim()) return;

    const optList = fType === 'mcq' || fType === 'assertion_reason'
      ? fOptions.split('\n').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const newQ = AdminService.addQuestionRecord({
      question: fQuestion.trim(),
      subject: fSubject.trim(),
      classLevel: fClass,
      topic: fTopic.trim() || 'General Curriculum',
      type: fType,
      difficulty: fDifficulty,
      options: optList,
      correctAnswer: fCorrectAnswer.trim(),
      explanation: fExplanation.trim() || 'Standard curriculum model answer.',
      verifiedByAdmin: true,
    });

    setQuestions(AdminService.getQuestionsList());
    setIsAddModalOpen(false);
    setFQuestion('');
    setFCorrectAnswer('');
    setFExplanation('');
    showToast(`Added new ${newQ.type} question to Master Bank.`);
  };

  const getDifficultyBadge = (diff: AdminQuestionRecord['difficulty']) => {
    switch (diff) {
      case 'Easy':
        return <Badge variant="emerald">Easy</Badge>;
      case 'Medium':
        return <Badge variant="amber">Medium</Badge>;
      case 'Hard':
        return <Badge variant="rose">Hard</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {feedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Master Question Bank & Item Repository
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validated item bank for AI quiz generators, mock exams, and Photo Solver matching
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="text-xs shadow-xs"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Question Item
        </Button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or topics..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 dark:text-white"
          />
        </div>

        {/* Class Filter */}
        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-2.5 text-xs font-semibold"
          >
            <option value="All">All Classes</option>
            {ALL_CLASSES_LIST.map((cls) => (
              <option key={cls} value={cls}>
                Class {cls}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-2.5 text-xs font-semibold"
          >
            <option value="All">All Types</option>
            <option value="mcq">MCQ (Single Choice)</option>
            <option value="assertion_reason">Assertion-Reason</option>
            <option value="short_answer">Short Answer</option>
            <option value="long_answer">Long Answer</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-2.5 text-xs font-semibold"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <Card className="py-12 text-center text-slate-400">
            No questions found matching your filter criteria.
          </Card>
        ) : (
          filteredQuestions.map((q) => (
            <Card
              key={q.id}
              className="p-4 space-y-3 border-slate-200 dark:border-slate-800 hover:shadow-xs transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="indigo">Class {q.classLevel}</Badge>
                    <Badge variant="slate">{q.subject}</Badge>
                    <Badge variant="purple">{q.topic}</Badge>
                    {getDifficultyBadge(q.difficulty)}
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {q.type.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                    {q.question}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleToggleVerify(q.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      q.verifiedByAdmin
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {q.verifiedByAdmin ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Unverified</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedQ(q)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
                    title="Inspect Question"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options Preview for MCQs */}
              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                        opt === q.correctAnswer
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Usage: Used in {q.usageCount} generated tests</span>
                <span>Created: {new Date(q.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Inspect Modal */}
      {selectedQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Question Item Details
              </h4>
              <button
                onClick={() => setSelectedQ(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Question Statement</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {selectedQ.question}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                  Model Solution / Correct Answer
                </span>
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {selectedQ.correctAnswer}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Pedagogical Explanation & Concept
                </span>
                <p className="text-slate-600 dark:text-slate-300">
                  {selectedQ.explanation}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSelectedQ(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Add Question Item to Master Bank
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Class</label>
                  <select
                    value={fClass}
                    onChange={(e) => setFClass(e.target.value as ClassLevel)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium"
                  >
                    {ALL_CLASSES_LIST.map((cls) => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Type</label>
                  <select
                    value={fType}
                    onChange={(e) => setFType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium"
                  >
                    <option value="mcq">MCQ</option>
                    <option value="assertion_reason">Assertion-Reason</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="long_answer">Long Answer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Difficulty</label>
                  <select
                    value={fDifficulty}
                    onChange={(e) => setFDifficulty(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject</label>
                  <input
                    type="text"
                    value={fSubject}
                    onChange={(e) => setFSubject(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Topic / Chapter</label>
                  <input
                    type="text"
                    value={fTopic}
                    onChange={(e) => setFTopic(e.target.value)}
                    placeholder="e.g. Electricity, Optics"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Question Statement
                </label>
                <textarea
                  value={fQuestion}
                  onChange={(e) => setFQuestion(e.target.value)}
                  rows={2}
                  placeholder="Enter full question text..."
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium"
                />
              </div>

              {(fType === 'mcq' || fType === 'assertion_reason') && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Options (1 per line)
                  </label>
                  <textarea
                    value={fOptions}
                    onChange={(e) => setFOptions(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-mono"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Correct Answer / Solution
                </label>
                <input
                  type="text"
                  value={fCorrectAnswer}
                  onChange={(e) => setFCorrectAnswer(e.target.value)}
                  placeholder="Exact correct answer string or option"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Explanation
                </label>
                <textarea
                  value={fExplanation}
                  onChange={(e) => setFExplanation(e.target.value)}
                  rows={2}
                  placeholder="Reasoning, formula, or steps..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save to Bank
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
