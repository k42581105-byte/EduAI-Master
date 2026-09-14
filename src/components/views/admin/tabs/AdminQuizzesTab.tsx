import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle2,
  Sparkles,
  BarChart2,
  Calendar,
  Layers,
  GraduationCap,
  X
} from 'lucide-react';
import { AdminQuizRecord, ClassLevel } from '../../../../types';
import { AdminService } from '../../../../services/adminService';
import { ALL_CLASSES_LIST } from '../../../../services/booksData';
import { Card } from '../../../common/Card';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';

export const AdminQuizzesTab: React.FC = () => {
  const [quizzes, setQuizzes] = useState<AdminQuizRecord[]>(() =>
    AdminService.getAdminQuizzes()
  );
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<AdminQuizRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredQuizzes = quizzes.filter((q) => {
    const matchClass = selectedClass === 'All' || q.classLevel === selectedClass;
    const matchSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  const showToast = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDelete = (id: string) => {
    setQuizzes(quizzes.filter((q) => q.id !== id));
    showToast('Quiz removed from directory.');
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
            Quiz Management & Performance Tracking
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor practice quiz attempts, average scores, and student question evaluations
          </p>
        </div>

        <Badge variant="indigo">
          {quizzes.length} Quizzes Logged
        </Badge>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quizzes by title or subject..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold">Class:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2.5 text-xs font-semibold"
          >
            <option value="All">All Classes</option>
            {ALL_CLASSES_LIST.map((cls) => (
              <option key={cls} value={cls}>
                Class {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quizzes Table Card */}
      <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Quiz Title & Subject</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Avg Score</th>
                <th className="py-3 px-4">Created By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredQuizzes.map((quiz) => (
                <tr
                  key={quiz.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {quiz.title}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {quiz.subject} • Date: {quiz.createdAt}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant="indigo">Class {quiz.classLevel}</Badge>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                    {quiz.totalQuestions} Qs
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                    {quiz.totalAttempts}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {quiz.avgScorePercentage}%
                      </span>
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            quiz.avgScorePercentage >= 75
                              ? 'bg-emerald-500'
                              : quiz.avgScorePercentage >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${quiz.avgScorePercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {quiz.createdBy}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedQuiz(quiz)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
                        title="Inspect Quiz"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(quiz.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quiz Details Modal */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Quiz Diagnostics
              </h4>
              <button
                onClick={() => setSelectedQuiz(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedQuiz.title}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Subject: {selectedQuiz.subject} • Class: {selectedQuiz.classLevel}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Attempts</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedQuiz.totalAttempts}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Average Score</span>
                  <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedQuiz.avgScorePercentage}%
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSelectedQuiz(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
