import React, { useState } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Clock,
  Flame,
  AlertCircle,
  Save,
  Check,
} from 'lucide-react';
import { StudyPlan, StudyTask, StudentProfile } from '../../types';
import { StorageService } from '../../services/storageService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface UpdateStudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onPlanUpdated: (updatedPlan: StudyPlan) => void;
}

export const UpdateStudyPlanModal: React.FC<UpdateStudyPlanModalProps> = ({
  isOpen,
  onClose,
  profile,
  onPlanUpdated,
}) => {
  const [studyPlan, setStudyPlan] = useState<StudyPlan>(() => StorageService.getStudyPlan());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Science');
  const [newTaskType, setNewTaskType] = useState<StudyTask['taskType']>('Lesson');
  const [newTaskPriority, setNewTaskPriority] = useState<StudyTask['priority']>('High');
  const [newTaskMinutes, setNewTaskMinutes] = useState(25);
  const [newTaskDueDate, setNewTaskDueDate] = useState('Today');
  const [targetExamDate, setTargetExamDate] = useState(studyPlan.targetExamDate || '2026-11-15');
  const [weeklyHours, setWeeklyHours] = useState(studyPlan.weeklyGoalHours || 14);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggleTask = (taskId: string) => {
    StorageService.toggleTaskCompleted(taskId);
    const updated = StorageService.getStudyPlan();
    setStudyPlan(updated);
    onPlanUpdated(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    StorageService.deleteTask(taskId);
    const updated = StorageService.getStudyPlan();
    setStudyPlan(updated);
    onPlanUpdated(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: StudyTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      subjectName: newTaskSubject,
      taskType: newTaskType,
      priority: newTaskPriority,
      estimatedMinutes: Number(newTaskMinutes) || 25,
      dueDate: newTaskDueDate,
      completed: false,
    };

    StorageService.addTask(newTask);
    const updated = StorageService.getStudyPlan();
    setStudyPlan(updated);
    onPlanUpdated(updated);

    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleSaveExamAndGoals = () => {
    const updated: StudyPlan = {
      ...studyPlan,
      targetExamDate,
      weeklyGoalHours: Number(weeklyHours) || 14,
    };
    StorageService.saveStudyPlan(updated);
    setStudyPlan(updated);
    onPlanUpdated(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const subjects = profile.selectedSubjects?.length
    ? profile.selectedSubjects
    : ['Science', 'Mathematics', 'Social Science', 'English', 'Hindi'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Update Today’s Study Plan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage tasks, customize daily goals, and align with exam deadlines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Exam Date & Weekly Goal Setting */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <Flame className="h-4 w-4" /> Target Exam & Weekly Target
              </span>
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Saved!
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Target Exam Date
                </label>
                <input
                  type="date"
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Weekly Goal (Hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button size="sm" variant="secondary" onClick={handleSaveExamAndGoals}>
                <Save className="h-3.5 w-3.5 mr-1" /> Save Exam Settings
              </Button>
            </div>
          </div>

          {/* Today's Tasks List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Today’s Checklist ({studyPlan.tasks.filter((t) => t.completed).length}/{studyPlan.tasks.length} Completed)</span>
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
              </Button>
            </div>

            {/* Inline Add Task Form */}
            {isAddingTask && (
              <form
                onSubmit={handleAddTask}
                className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80 space-y-3 animate-in fade-in"
              >
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  New Study Task
                </h4>
                <input
                  type="text"
                  placeholder="Task title (e.g., Revise Optics Ray Diagrams)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Subject</label>
                    <select
                      value={newTaskSubject}
                      onChange={(e) => setNewTaskSubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Type</label>
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="Lesson">Lesson</option>
                      <option value="Revision">Revision</option>
                      <option value="Quiz">Quiz</option>
                      <option value="Exam Practice">Exam Practice</option>
                      <option value="Notes">Notes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Est. Minutes</label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={newTaskMinutes}
                      onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setIsAddingTask(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Add to Checklist
                  </Button>
                </div>
              </form>
            )}

            {/* Tasks list */}
            <div className="space-y-2">
              {studyPlan.tasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No study tasks found. Click "Add Task" to create one.
                </div>
              ) : (
                studyPlan.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                      task.completed
                        ? 'border-slate-200 bg-slate-50/70 text-slate-400 dark:border-slate-800 dark:bg-slate-900/40 line-through'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs'
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => handleToggleTask(task.id)}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">
                            {task.subjectName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {task.estimatedMinutes} mins
                          </span>
                          <span>•</span>
                          <span className="text-slate-400">{task.dueDate}</span>
                          <Badge
                            variant={
                              task.priority === 'High'
                                ? 'danger'
                                : task.priority === 'Medium'
                                ? 'warning'
                                : 'default'
                            }
                            className="text-[9px] px-1.5 py-0"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <p className="text-xs text-slate-500">
            Changes are saved automatically to your profile.
          </p>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};
