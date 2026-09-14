import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Award,
  GraduationCap,
  Layers,
  X
} from 'lucide-react';
import { AdminExamRecord, ClassLevel } from '../../../../types';
import { AdminService } from '../../../../services/adminService';
import { ALL_CLASSES_LIST, ALL_BOARDS_LIST } from '../../../../services/booksData';
import { Card } from '../../../common/Card';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';

export const AdminExamsTab: React.FC = () => {
  const [exams, setExams] = useState<AdminExamRecord[]>(() =>
    AdminService.getAdminExams()
  );
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<AdminExamRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [fTitle, setFTitle] = useState('');
  const [fSubject, setFSubject] = useState('Science');
  const [fClass, setFClass] = useState<ClassLevel>('10');
  const [fBoard, setFBoard] = useState('CBSE');
  const [fMarks, setFMarks] = useState(80);
  const [fDuration, setFDuration] = useState(180);

  const filteredExams = exams.filter((e) => {
    const matchClass = selectedClass === 'All' || e.classLevel === selectedClass;
    const matchSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  const showToast = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim()) return;

    const newExam: AdminExamRecord = {
      id: `ex-sys-${Date.now()}`,
      title: fTitle.trim(),
      subject: fSubject.trim(),
      classLevel: fClass,
      board: fBoard,
      totalMarks: Number(fMarks) || 80,
      durationMinutes: Number(fDuration) || 180,
      totalAttempts: 0,
      avgScorePercentage: 0,
      topScorePercentage: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    setExams([newExam, ...exams]);
    setIsAddModalOpen(false);
    setFTitle('');
    showToast(`Registered mock exam paper: "${newExam.title}"`);
  };

  const handleDelete = (id: string) => {
    setExams(exams.filter((e) => e.id !== id));
    showToast('Mock Exam paper deleted.');
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
            <FileCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Mock Exam Papers & Simulation Management
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Standard board-format 3-hour examination simulator papers and scoring benchmarks
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="text-xs shadow-xs"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Mock Exam Paper
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exam papers..."
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

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExams.map((exam) => (
          <Card
            key={exam.id}
            className="p-4 flex flex-col justify-between space-y-3 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Badge variant="indigo">Class {exam.classLevel}</Badge>
                  <Badge variant="slate">{exam.board}</Badge>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {exam.durationMinutes}m
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                {exam.title}
              </h4>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 grid grid-cols-3 gap-1.5 text-center text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Marks</span>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{exam.totalMarks}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Attempts</span>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{exam.totalAttempts}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Top Score</span>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{exam.topScorePercentage}%</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Created: {exam.createdAt}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedExam(exam)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
                  title="View Exam Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(exam.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete Exam Paper"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Inspect Modal */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Exam Paper Specification
              </h4>
              <button
                onClick={() => setSelectedExam(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedExam.title}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Board: {selectedExam.board} • Subject: {selectedExam.subject} • Class: {selectedExam.classLevel}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Standard Timing</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedExam.durationMinutes} Minutes (3 Hours)
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Maximum Marks</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedExam.totalMarks} Marks
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSelectedExam(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Create Mock Exam Paper
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExam} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={fTitle}
                  onChange={(e) => setFTitle(e.target.value)}
                  placeholder="e.g. CBSE Class 10 Pre-Board Full Paper"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Board</label>
                  <select
                    value={fBoard}
                    onChange={(e) => setFBoard(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium"
                  >
                    {ALL_BOARDS_LIST.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Max Marks</label>
                  <input
                    type="number"
                    value={fMarks}
                    onChange={(e) => setFMarks(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Duration (min)</label>
                  <input
                    type="number"
                    value={fDuration}
                    onChange={(e) => setFDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium"
                  />
                </div>
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
                  Create Paper
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
