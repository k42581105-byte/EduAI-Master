import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  Clock,
  Target,
  Trash2,
  Edit2,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  Award,
  ChevronRight,
  Flame,
  Globe,
  Sliders,
  X,
  Check,
  CalendarDays,
  Brain,
  ArrowRight,
  Bell,
  BellOff,
  Wand2,
  Zap,
  TrendingUp,
  AlertCircle,
  Bot,
  ListTodo,
  BarChart3,
  BookMarked,
  GraduationCap,
  RotateCcw,
} from 'lucide-react';
import {
  StudentProfile,
  StudyPlan,
  StudyTask,
  ExamDateItem,
  ClassLevel,
  NavigationSection,
} from '../../types';
import { StorageService } from '../../services/storageService';
import { AiService } from '../../services/aiService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface StudyPlannerViewProps {
  profile: StudentProfile;
  onNavigate?: (section: NavigationSection) => void;
  lang?: 'en' | 'hi';
}

const ALL_CLASS_LEVELS: ClassLevel[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const AVAILABLE_SUBJECTS = [
  'Science',
  'Mathematics',
  'Social Science',
  'English',
  'Hindi (हिंदी)',
  'Sanskrit (संस्कृत)',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
];

const TIME_SLOTS = [
  'Morning (6 AM - 9 AM)',
  'Afternoon (12 PM - 3 PM)',
  'Evening (5 PM - 8 PM)',
  'Night (8 PM - 11 PM)',
];

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  profile,
  onNavigate,
  lang: initialLang = 'en',
}) => {
  // Plan & Language State
  const [plan, setPlan] = useState<StudyPlan>(() => StorageService.getStudyPlan());
  const [language, setLanguage] = useState<'en' | 'hi'>(initialLang || profile.preferredLanguage || 'en');
  const [isTranslatingPlan, setIsTranslatingPlan] = useState(false);
  const isHindi = language === 'hi';

  const handleTogglePlanLanguage = async () => {
    const targetLang = language === 'en' ? 'hi' : 'en';
    setLanguage(targetLang);
    setIsTranslatingPlan(true);
    triggerToast(targetLang === 'hi' ? 'AI द्वारा अध्ययन योजना का हिंदी में अनुवाद किया जा रहा है...' : 'Translating Study Plan with AI...');
    try {
      const res = await AiService.translateStudyPlan(plan, targetLang);
      if (res.translatedPlan) {
        StorageService.saveStudyPlan(res.translatedPlan);
        setPlan(res.translatedPlan);
        triggerToast(targetLang === 'hi' ? 'योजना का हिंदी में अनुवाद पूर्ण हुआ!' : 'Plan translated to English!');
      }
    } catch (err) {
      console.error('Plan translation error:', err);
    } finally {
      setIsTranslatingPlan(false);
    }
  };

  // Reminders state
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(() => {
    return localStorage.getItem('eduai_reminders_enabled') === 'true';
  });

  // Navigation & Filter State
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'calendar'>('daily');
  const [selectedDay, setSelectedDay] = useState<string>('Today');
  const [filterStatus, setFilterStatus] = useState<'all' | 'today' | 'completed' | 'missed'>('all');

  // Modals state
  const [showPlanSetupModal, setShowPlanSetupModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAskAiModal, setShowAskAiModal] = useState(false);
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingModeText, setGeneratingModeText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Goal completion state
  const [completedGoals, setCompletedGoals] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('eduai_completed_goals');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Plan Setup Form State
  const [setupClass, setSetupClass] = useState<ClassLevel>(profile.classLevel || '10');
  const [setupSubjects, setSetupSubjects] = useState<string[]>(
    profile.selectedSubjects && profile.selectedSubjects.length > 0
      ? profile.selectedSubjects
      : ['Science', 'Mathematics', 'English']
  );
  const [setupHours, setSetupHours] = useState<number>(plan.availableHoursPerDay || 3);
  const [setupTimeSlot, setSetupTimeSlot] = useState<string>(
    plan.preferredTimeSlot || 'Evening (5 PM - 8 PM)'
  );
  const [setupGoals, setSetupGoals] = useState<string[]>(
    plan.personalGoals && plan.personalGoals.length > 0
      ? plan.personalGoals
      : ['Score 95%+ in Board Exams', 'Master Mirror Formula & Numericals']
  );
  const [newGoalInput, setNewGoalInput] = useState('');
  const [setupExamDates, setSetupExamDates] = useState<ExamDateItem[]>(
    plan.examDates || [
      { id: 'ex-1', subject: 'Science', title: 'CBSE Midterm Paper', examDate: '2026-09-20' },
      { id: 'ex-2', subject: 'Mathematics', title: 'Math Board Exam', examDate: '2026-10-15' },
    ]
  );
  const [newExamSubject, setNewExamSubject] = useState(setupSubjects[0] || 'Science');
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [setupTarget, setSetupTarget] = useState<string>(
    plan.dailyLearningTarget || '3 Tasks & 100 XP'
  );

  // Add / Edit Task Form State
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormSubject, setTaskFormSubject] = useState(setupSubjects[0] || 'Science');
  const [taskFormTopic, setTaskFormTopic] = useState('');
  const [taskFormStartTime, setTaskFormStartTime] = useState('05:00 PM');
  const [taskFormMinutes, setTaskFormMinutes] = useState(30);
  const [taskFormPriority, setTaskFormPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [taskFormType, setTaskFormType] = useState<StudyTask['taskType']>('Revision');
  const [taskFormDay, setTaskFormDay] = useState<string>('Today');

  // Student Data & Analytics
  const weakTopics = StorageService.getWeakTopics();
  const criticalWeakTopics = weakTopics.filter((w) => w.urgency === 'Critical' || w.accuracyRate < 60);

  // Toast Notification Trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Save Reminders Toggle
  const toggleReminders = () => {
    const next = !remindersEnabled;
    setRemindersEnabled(next);
    localStorage.setItem('eduai_reminders_enabled', next ? 'true' : 'false');
    if (next) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      triggerToast(
        isHindi
          ? '🔔 अध्ययन अनुस्मारक (Study Reminders) सक्रिय किए गए'
          : '🔔 Study Reminders enabled! You will be notified before sessions.'
      );
    } else {
      triggerToast(isHindi ? '🔕 अनुस्मारक निष्क्रिय किए गए' : '🔕 Study Reminders disabled');
    }
  };

  // Toggle Goal Completed
  const toggleGoal = (goalText: string) => {
    const next = { ...completedGoals, [goalText]: !completedGoals[goalText] };
    setCompletedGoals(next);
    localStorage.setItem('eduai_completed_goals', JSON.stringify(next));
    if (next[goalText]) {
      triggerToast(isHindi ? '🎯 लक्ष्य पूरा हुआ! (+50 XP)' : '🎯 Personal Goal Accomplished! (+50 XP)');
    }
  };

  // Toggle Task Completion
  const handleToggleTask = (taskId: string) => {
    StorageService.toggleTaskCompleted(taskId);
    const updatedPlan = StorageService.getStudyPlan();
    setPlan(updatedPlan);

    const task = updatedPlan.tasks.find((t) => t.id === taskId);
    if (task && task.completed) {
      triggerToast(
        isHindi
          ? `🎉 कार्य पूर्ण! +30 XP अर्जित किए ("${task.title}")`
          : `🎉 Task Completed! +30 XP Earned ("${task.title}")`
      );
    }
  };

  // Open Edit Task Modal
  const handleOpenEditTask = (task: StudyTask) => {
    setEditingTask(task);
    setTaskFormTitle(task.title);
    setTaskFormSubject(task.subjectName);
    setTaskFormTopic(task.topicName || '');
    setTaskFormStartTime(task.startTime || '05:00 PM');
    setTaskFormMinutes(task.estimatedMinutes);
    setTaskFormPriority(task.priority);
    setTaskFormType(task.taskType);
    setTaskFormDay(task.dayOfWeek || task.dueDate || 'Today');
    setShowAddTaskModal(true);
  };

  // Save Add or Edit Task
  const handleSaveTaskForm = () => {
    if (!taskFormTitle.trim()) return;

    if (editingTask) {
      const updated: StudyTask = {
        ...editingTask,
        title: taskFormTitle,
        subjectName: taskFormSubject,
        topicName: taskFormTopic,
        startTime: taskFormStartTime,
        estimatedMinutes: taskFormMinutes,
        priority: taskFormPriority,
        taskType: taskFormType,
        dayOfWeek: taskFormDay as any,
        dueDate: taskFormDay,
      };
      StorageService.updateTask(updated);
      triggerToast(isHindi ? 'कार्य सफलतापूर्वक अद्यतन किया गया' : 'Task updated successfully');
    } else {
      const newTask: StudyTask = {
        id: `st-${Date.now()}`,
        title: taskFormTitle,
        subjectName: taskFormSubject,
        topicName: taskFormTopic,
        startTime: taskFormStartTime,
        estimatedMinutes: taskFormMinutes,
        completed: false,
        priority: taskFormPriority,
        taskType: taskFormType,
        dayOfWeek: taskFormDay as any,
        dueDate: taskFormDay,
      };
      StorageService.addTask(newTask);
      triggerToast(isHindi ? 'नया अध्ययन कार्य जोड़ा गया' : 'New study task added');
    }

    setPlan(StorageService.getStudyPlan());
    setShowAddTaskModal(false);
    setEditingTask(null);
    resetTaskForm();
  };

  const resetTaskForm = () => {
    setTaskFormTitle('');
    setTaskFormTopic('');
    setTaskFormMinutes(30);
    setTaskFormPriority('High');
    setTaskFormType('Revision');
    setTaskFormDay('Today');
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    StorageService.deleteTask(taskId);
    setPlan(StorageService.getStudyPlan());
    setDeletingTaskId(null);
    triggerToast(isHindi ? 'कार्य हटा दिया गया' : 'Task deleted');
  };

  // Auto-Adjust Unfinished / Missed Tasks to Today
  const handleAutoAdjustMissedTasks = () => {
    const currentPlan = StorageService.getStudyPlan();
    let adjustedCount = 0;

    const updatedTasks = currentPlan.tasks.map((task) => {
      const taskDay = (task.dayOfWeek || task.dueDate || '').toLowerCase();
      const isPastOrMissed =
        !task.completed &&
        (taskDay === 'yesterday' ||
          taskDay === 'monday' ||
          taskDay === 'tuesday' ||
          taskDay === 'wednesday' ||
          taskDay === 'thursday');

      if (isPastOrMissed) {
        adjustedCount++;
        return {
          ...task,
          dayOfWeek: 'Today' as const,
          dueDate: 'Today',
          priority: 'High' as const,
          title: task.title.includes('Rescheduled') ? task.title : `[Rescheduled] ${task.title}`,
        };
      }
      return task;
    });

    if (adjustedCount > 0) {
      currentPlan.tasks = updatedTasks;
      StorageService.saveStudyPlan(currentPlan);
      setPlan(currentPlan);
      triggerToast(
        isHindi
          ? `🔄 ${adjustedCount} छूटे हुए कार्य आज की योजना में पुनः व्यवस्थित किए गए!`
          : `🔄 Rescheduled ${adjustedCount} missed tasks to Today with High priority!`
      );
    } else {
      triggerToast(
        isHindi ? 'कोई छूटा हुआ कार्य नहीं मिला!' : 'All tasks are up to date! No missed tasks found.'
      );
    }
  };

  // Preset Plan Generators (Weak Topics, Exam Prep, Quick Revision, Improve Plan)
  const handleGeneratePresetPlan = async (
    mode: 'standard' | 'focus-weak' | 'exam-prep' | 'quick-revision' | 'improve',
    customPromptText = ''
  ) => {
    setIsGenerating(true);
    setGeneratingModeText(
      mode === 'focus-weak'
        ? isHindi ? 'कमजोर विषयों पर केंद्रित...' : 'Focusing on Weak Topics...'
        : mode === 'exam-prep'
        ? isHindi ? 'परीक्षा तैयारी मोड...' : 'Intensive Exam Preparation...'
        : mode === 'quick-revision'
        ? isHindi ? 'त्वरित पुनरावलोकन मोड...' : 'Generating Quick Revision Plan...'
        : mode === 'improve'
        ? isHindi ? 'एआई समय-सारणी सुधार रहा है...' : 'AI Optimizing Schedule...'
        : isHindi ? 'योजना तैयार की जा रही है...' : 'Generating Study Plan...'
    );

    try {
      const savedQuizzes = StorageService.getSavedQuizzes();
      const savedExams = StorageService.getSavedExams();

      const res = await AiService.generateStudyPlan({
        classLevel: setupClass,
        selectedSubjects: setupSubjects,
        availableHoursPerDay: setupHours,
        preferredTimeSlot: setupTimeSlot,
        examDates: setupExamDates,
        personalGoals: setupGoals,
        dailyLearningTarget: setupTarget,
        language,
        planMode: mode,
        customPrompt: customPromptText,
        studentData: {
          quizzesTaken: savedQuizzes.length,
          avgScorePercentage: profile.avgScorePercentage || 85,
          examsCompleted: savedExams.length,
          weakTopics,
          xp: profile.xp,
          streakDays: profile.streakDays,
        },
      });

      StorageService.saveStudyPlan(res.plan);
      setPlan(res.plan);
      setShowPlanSetupModal(false);
      setShowAskAiModal(false);
      setCustomAiPrompt('');

      triggerToast(
        isHindi
          ? `🎉 आपकी नई समय सारणी तैयार है! (${mode.toUpperCase()})`
          : `🎉 New personalized plan active! (${mode.toUpperCase()})`
      );
    } catch (err) {
      console.error('Failed to generate preset plan:', err);
    } finally {
      setIsGenerating(false);
      setGeneratingModeText('');
    }
  };

  // Subject Pill Toggle in Form
  const toggleSubject = (subj: string) => {
    if (setupSubjects.includes(subj)) {
      if (setupSubjects.length > 1) {
        setSetupSubjects(setupSubjects.filter((s) => s !== subj));
      }
    } else {
      setSetupSubjects([...setupSubjects, subj]);
    }
  };

  // Goal Add/Remove
  const handleAddGoal = () => {
    if (!newGoalInput.trim()) return;
    setSetupGoals([...setupGoals, newGoalInput.trim()]);
    setNewGoalInput('');
  };

  const handleRemoveGoal = (idx: number) => {
    setSetupGoals(setupGoals.filter((_, i) => i !== idx));
  };

  // Exam Date Add/Remove
  const handleAddExamDate = () => {
    if (!newExamTitle.trim() || !newExamDate) return;
    const item: ExamDateItem = {
      id: `ex-${Date.now()}`,
      subject: newExamSubject,
      title: newExamTitle.trim(),
      examDate: newExamDate,
    };
    setSetupExamDates([...setupExamDates, item]);
    setNewExamTitle('');
    setNewExamDate('');
  };

  const handleRemoveExamDate = (id: string) => {
    setSetupExamDates(setupExamDates.filter((e) => e.id !== id));
  };

  // Task filtering logic
  const missedTasks = plan.tasks.filter((t) => {
    const day = (t.dayOfWeek || t.dueDate || '').toLowerCase();
    return (
      !t.completed &&
      (day === 'yesterday' || day === 'monday' || day === 'tuesday' || day === 'wednesday')
    );
  });

  const completedTasksList = plan.tasks.filter((t) => t.completed);

  const filteredTasks = plan.tasks.filter((task) => {
    const taskDay = (task.dayOfWeek || task.dueDate || 'Today').toLowerCase();

    if (filterStatus === 'completed') return task.completed;
    if (filterStatus === 'missed') {
      return (
        !task.completed &&
        (taskDay === 'yesterday' || taskDay === 'monday' || taskDay === 'tuesday' || taskDay === 'wednesday')
      );
    }
    if (filterStatus === 'today') return taskDay === 'today';

    if (selectedDay === 'All') return true;
    return taskDay === selectedDay.toLowerCase();
  });

  const completedCount = completedTasksList.length;
  const totalTasksCount = plan.tasks.length;
  const pct = totalTasksCount ? Math.round((completedCount / totalTasksCount) * 100) : 0;
  const totalMinutes = plan.tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const totalGoalHours = plan.weeklyGoalHours || setupHours * 7;
  const completedMinutes = completedTasksList.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const completedHours = Math.round((completedMinutes / 60) * 10) / 10;

  // Check overloaded days (> 4 hours)
  const dayOverloadMap: Record<string, number> = {};
  plan.tasks.forEach((t) => {
    const d = t.dayOfWeek || t.dueDate || 'Today';
    dayOverloadMap[d] = (dayOverloadMap[d] || 0) + t.estimatedMinutes;
  });
  const overloadedDays = Object.entries(dayOverloadMap).filter(([_, mins]) => mins > 240);

  // Subject Badge Color
  const getSubjectColor = (subj: string) => {
    const s = subj.toLowerCase();
    if (s.includes('science') || s.includes('physics') || s.includes('chem') || s.includes('bio'))
      return 'indigo';
    if (s.includes('math')) return 'blue';
    if (s.includes('social') || s.includes('sst')) return 'amber';
    if (s.includes('hindi')) return 'rose';
    if (s.includes('english')) return 'emerald';
    return 'slate';
  };

  // Priority Badge
  const getPriorityBadge = (p: string) => {
    if (p === 'High') return <Badge variant="rose">High Priority</Badge>;
    if (p === 'Medium') return <Badge variant="amber">Medium</Badge>;
    return <Badge variant="slate">Low</Badge>;
  };

  const dayTabs = [
    'Today',
    'Tomorrow',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
    'All',
  ];

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-500/30 text-xs sm:text-sm font-semibold animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              {isHindi ? 'एआई अध्ययन योजनाकार एवं समय सारणी' : 'AI Study Planner & Schedule'}
            </h2>
            <Badge variant="indigo" size="sm">
              Class {plan.classLevel || profile.classLevel}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isHindi
              ? 'व्यक्तिगत एआई दैनिक एवं साप्ताहिक अध्ययन योजना, परीक्षा ट्रैकर और रिमाइंडर'
              : 'Personalized AI daily study plan, weekly calendar & exam schedule'}
          </p>
        </div>

        {/* Action Controls & Gamification Widgets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Study Streak Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold">
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span>{profile.streakDays || 1} Day Streak</span>
          </div>

          {/* Daily XP Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <Zap className="h-4 w-4 text-emerald-500 fill-emerald-500" />
            <span>{profile.xp || 350} XP</span>
          </div>

          {/* Reminders Toggle */}
          <button
            onClick={toggleReminders}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              remindersEnabled
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300'
                : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            {remindersEnabled ? (
              <Bell className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 animate-bounce" />
            ) : (
              <BellOff className="h-3.5 w-3.5" />
            )}
            <span>{remindersEnabled ? 'Reminders On' : 'Reminders Off'}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={handleTogglePlanLanguage}
            disabled={isTranslatingPlan}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-60"
          >
            <Globe className={`h-3.5 w-3.5 text-indigo-500 ${isTranslatingPlan ? 'animate-spin' : ''}`} />
            <span>{isTranslatingPlan ? 'Translating...' : (language === 'en' ? 'Hindi (हिंदी)' : 'English')}</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            icon={<Sliders className="h-4 w-4" />}
            onClick={() => setShowPlanSetupModal(true)}
          >
            {isHindi ? 'कॉन्फ़िगर करें' : 'Configure'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingTask(null);
              resetTaskForm();
              setShowAddTaskModal(true);
            }}
          >
            {isHindi ? 'कार्य जोड़ें' : 'Add Task'}
          </Button>
        </div>
      </div>

      {/* SMART AI PRESET ACTION STRIP */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 p-4 rounded-3xl text-white shadow-lg space-y-3 border border-indigo-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
            <h3 className="text-sm font-extrabold tracking-wide">
              {isHindi ? 'एआई स्मार्ट अध्ययन रणनीतियां (Smart AI Strategies)' : 'Smart AI Plan Presets & Strategy'}
            </h3>
          </div>
          <span className="text-[11px] text-indigo-200 font-medium">
            {isHindi ? '1-क्लिक में एआई द्वारा योजना बदलें' : 'Transform study schedule in 1-click'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setShowAskAiModal(true)}
            disabled={isGenerating}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-left flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between">
              <Bot className="h-5 w-5 text-indigo-300 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-3.5 w-3.5 text-indigo-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold leading-tight">
                {isHindi ? 'एआई से सुधार करवाएं' : 'Ask AI to Improve'}
              </h4>
              <p className="text-[10px] text-indigo-200 mt-0.5 line-clamp-1">Custom instructions</p>
            </div>
          </button>

          <button
            onClick={() => handleGeneratePresetPlan('focus-weak')}
            disabled={isGenerating}
            className="p-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-all text-left flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between">
              <Brain className="h-5 w-5 text-amber-300 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-3.5 w-3.5 text-amber-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-200 leading-tight">
                {isHindi ? 'कमजोर विषय विशेष' : 'Focus on Weak Topics'}
              </h4>
              <p className="text-[10px] text-amber-300/80 mt-0.5 line-clamp-1">Prioritize revision</p>
            </div>
          </button>

          <button
            onClick={() => handleGeneratePresetPlan('exam-prep')}
            disabled={isGenerating}
            className="p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all text-left flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between">
              <GraduationCap className="h-5 w-5 text-emerald-300 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-3.5 w-3.5 text-emerald-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-200 leading-tight">
                {isHindi ? 'परीक्षा विशेष तैयारी' : 'Exam Preparation Plan'}
              </h4>
              <p className="text-[10px] text-emerald-300/80 mt-0.5 line-clamp-1">Mocks & Board papers</p>
            </div>
          </button>

          <button
            onClick={() => handleGeneratePresetPlan('quick-revision')}
            disabled={isGenerating}
            className="p-3 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-all text-left flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between">
              <Zap className="h-5 w-5 text-purple-300 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-3.5 w-3.5 text-purple-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-purple-200 leading-tight">
                {isHindi ? 'त्वरित पुनरावलोकन' : 'Quick Revision Plan'}
              </h4>
              <p className="text-[10px] text-purple-300/80 mt-0.5 line-clamp-1">Light 15-30m drills</p>
            </div>
          </button>
        </div>

        {generatingModeText && (
          <div className="p-2.5 rounded-xl bg-white/10 text-xs font-semibold flex items-center gap-2 animate-pulse text-indigo-200">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>{generatingModeText}</span>
          </div>
        )}
      </div>

      {/* SMART RECOMMENDATION ALERTS & OVERLOADED DAY WARNINGS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Missed / Unfinished Tasks Auto-Adjuster Alert */}
        {missedTasks.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/60 flex items-start justify-between gap-3 text-rose-900 dark:text-rose-200">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/80 dark:text-rose-300 mt-0.5">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold">
                  {isHindi
                    ? `${missedTasks.length} छूटे हुए कार्य (Missed Tasks)`
                    : `${missedTasks.length} Missed Unfinished Tasks`}
                </h4>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                  {isHindi
                    ? 'अधूरी पढ़ाई को आज की समय सारणी में स्वतः स्थानांतरित करें'
                    : 'Unfinished tasks detected from earlier schedule.'}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white border-none text-xs"
              onClick={handleAutoAdjustMissedTasks}
            >
              {isHindi ? 'आज व्यवस्थित करें' : 'Reschedule to Today'}
            </Button>
          </div>
        )}

        {/* Critical Weak Topics Alert */}
        {criticalWeakTopics.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60 flex items-start justify-between gap-3 text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/80 dark:text-amber-300 mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold">
                  {isHindi
                    ? `कमजोर विषय: ${criticalWeakTopics[0].topicName}`
                    : `Weak Topic Priority: ${criticalWeakTopics[0].topicName}`}
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Accuracy rate: {criticalWeakTopics[0].accuracyRate}%. Increase review before exams.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white border-none text-xs"
              onClick={() => handleGeneratePresetPlan('focus-weak')}
            >
              {isHindi ? 'कमजोर विषय प्लान' : 'Fix Weak Topics'}
            </Button>
          </div>
        )}

        {/* Overloaded Day Alert */}
        {overloadedDays.length > 0 && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/60 flex items-start justify-between gap-3 text-blue-900 dark:text-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/80 dark:text-blue-300 mt-0.5">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold">
                  {isHindi
                    ? `${overloadedDays[0][0]} को समय सीमा अधिक है`
                    : `Overloaded Day Warning: ${overloadedDays[0][0]}`}
                </h4>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  Scheduled {Math.round(overloadedDays[0][1] / 60 * 10) / 10} hours (&gt;4 hrs/day). Balance subjects to avoid burnout.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => handleGeneratePresetPlan('improve', 'Balance subjects and ensure no day exceeds 3 hours.')}
            >
              {isHindi ? 'संतुलित करें' : 'Balance Schedule'}
            </Button>
          </div>
        )}
      </div>

      {/* STATS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Goal Progress */}
        <Card className="flex flex-col justify-between border-indigo-200 dark:border-indigo-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isHindi ? 'साप्ताहिक प्रगति' : 'Weekly Progress'}
            </span>
            <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {completedHours} / {totalGoalHours} {isHindi ? 'घंटे' : 'Hrs'}
            </h4>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((completedHours / totalGoalHours) * 100))}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Task Completion Rate */}
        <Card className="flex flex-col justify-between border-emerald-200 dark:border-emerald-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isHindi ? 'कार्य पूर्णता' : 'Tasks Completed'}
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {pct}% ({completedCount} / {totalTasksCount})
            </h4>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Total Scheduled Time */}
        <Card className="flex flex-col justify-between border-blue-200 dark:border-blue-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isHindi ? 'निर्धारित समय' : 'Scheduled Duration'}
            </span>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {Math.round(totalMinutes / 60 * 10) / 10} {isHindi ? 'घंटे' : 'Hours Total'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Slot: {plan.preferredTimeSlot || 'Evening'}
            </p>
          </div>
        </Card>

        {/* Upcoming Exams Count */}
        <Card className="flex flex-col justify-between border-purple-200 dark:border-purple-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isHindi ? 'आगामी परीक्षाएं' : 'Upcoming Exams'}
            </span>
            <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {(plan.examDates || setupExamDates).length} {isHindi ? 'परीक्षाएं' : 'Exams Added'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Target Exam: {(plan.examDates || setupExamDates)[0]?.examDate || 'Oct 2026'}
            </p>
          </div>
        </Card>
      </div>

      {/* PERSONAL GOALS PROGRESS TRACKER & UPCOMING EXAMS WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal Study Goals Checklist */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              <span>{isHindi ? 'व्यक्तिगत अध्ययन लक्ष्य' : 'Personal Study Goals Tracker'}</span>
            </h3>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {Object.values(completedGoals).filter(Boolean).length} / {(plan.personalGoals || setupGoals).length} Met
            </span>
          </div>

          <div className="space-y-2">
            {(plan.personalGoals || setupGoals).map((goalText, idx) => {
              const isDone = !!completedGoals[goalText];
              return (
                <div
                  key={idx}
                  onClick={() => toggleGoal(goalText)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isDone
                      ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50 text-slate-400'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    <span className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : ''}`}>
                      {goalText}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    +50 XP
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming Exam Schedule Card */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" />
              <span>{isHindi ? 'आगामी परीक्षा समय-सारणी' : 'Upcoming Exam Schedule'}</span>
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleGeneratePresetPlan('exam-prep')}
            >
              {isHindi ? 'परीक्षा मोड प्लान' : 'Exam Prep Mode'}
            </Button>
          </div>

          <div className="space-y-2">
            {(plan.examDates || setupExamDates).map((ex) => (
              <div
                key={ex.id}
                className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                      {ex.title}
                    </span>
                    <Badge variant="purple" size="sm">
                      {ex.subject}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                    Target Date: <strong className="font-semibold">{ex.examDate}</strong>
                  </p>
                </div>

                {onNavigate && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-xs border-none"
                    onClick={() => onNavigate('exam')}
                  >
                    {isHindi ? 'परीक्षा दें' : 'Take Exam Paper'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* VIEW MODE TOGGLE & STATUS FILTERS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Main View Mode Selector (Daily / Weekly / Calendar) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'daily'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isHindi ? 'दैनिक सूची' : 'Daily Schedule'}
            </button>

            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'weekly'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isHindi ? 'साप्ताहिक दृश्य' : 'Weekly Grid'}
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{isHindi ? 'मासिक कैलेंडर' : 'Calendar View'}</span>
            </button>
          </div>

          {/* Task Status Filters (All / Today / Completed / Missed) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'all'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All ({plan.tasks.length})
            </button>

            <button
              onClick={() => setFilterStatus('today')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'today'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Today
            </button>

            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'completed'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Completed ({completedCount})
            </button>

            <button
              onClick={() => setFilterStatus('missed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'missed'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Missed ({missedTasks.length})
            </button>
          </div>
        </div>

        {/* Days Horizontal Strip Filter */}
        {viewMode === 'daily' && filterStatus === 'all' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {dayTabs.map((day) => {
              const count = plan.tasks.filter(
                (t) => (t.dayOfWeek || t.dueDate || 'Today').toLowerCase() === day.toLowerCase()
              ).length;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                    selectedDay === day
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                  }`}
                >
                  <span>{day}</span>
                  {day !== 'All' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        selectedDay === day
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* WORKSPACE VIEW 1: DAILY SCHEDULE TASK LIST */}
      {viewMode === 'daily' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{filterStatus !== 'all' ? `${filterStatus.toUpperCase()} Tasks` : `${selectedDay} Tasks`}</span>
              <Badge variant="slate" size="sm">
                {filteredTasks.length} {isHindi ? 'कार्य' : 'Tasks'}
              </Badge>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isHindi ? 'कार्य पूरा होने पर +30 XP प्राप्त करें' : '+30 XP awarded on task completion'}
            </span>
          </div>

          {filteredTasks.length === 0 ? (
            <Card className="text-center py-10 space-y-3 border-dashed border-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isHindi ? 'इस श्रेणी के लिए कोई कार्य नहीं मिला' : 'No study tasks in this list'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {isHindi
                  ? 'नया अध्ययन कार्य जोड़ें या एआई से नया टाइमटेबल पुनः तैयार करवाएं।'
                  : 'Add a new custom task or hit Regenerate Plan to auto-schedule tasks.'}
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setEditingTask(null);
                  resetTaskForm();
                  setTaskFormDay(selectedDay === 'All' ? 'Today' : selectedDay);
                  setShowAddTaskModal(true);
                }}
              >
                {isHindi ? 'नया कार्य जोड़ें' : 'Add New Task'}
              </Button>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    task.completed
                      ? 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40 text-slate-400'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs'
                  }`}
                >
                  {/* Task Checkbox & Main Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0 hover:scale-110 transition-transform"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            task.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </span>

                        <Badge
                          variant={getSubjectColor(task.subjectName) as any}
                          size="sm"
                        >
                          {task.subjectName}
                        </Badge>

                        {getPriorityBadge(task.priority)}

                        {task.taskType === 'Weak Topic Fix' && (
                          <Badge variant="amber" size="sm">
                            ⚡ Weak Topic Fix
                          </Badge>
                        )}
                      </div>

                      {task.topicName && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                          Topic: {task.topicName}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                        {task.startTime && (
                          <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                            <Clock className="h-3 w-3" /> {task.startTime}
                          </span>
                        )}
                        <span>• ⌛ {task.estimatedMinutes} Mins</span>
                        <span>
                          • Schedule: <strong className="text-slate-600 dark:text-slate-300">{task.dayOfWeek || task.dueDate}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Task Action Bar & Deep Ecosystem Connections */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 sm:hidden">
                      +30 XP
                    </span>

                    {/* Integrated Feature Launchers */}
                    <div className="flex items-center gap-1">
                      {onNavigate && (
                        <>
                          <button
                            onClick={() => onNavigate('ask-ai')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px] font-bold"
                            title="Ask AI Teacher about this topic"
                          >
                            <Bot className="h-4 w-4" />
                            <span className="hidden lg:inline">Ask AI</span>
                          </button>

                          <button
                            onClick={() => onNavigate('quiz')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px] font-bold"
                            title="Take Practice Quiz"
                          >
                            <Brain className="h-4 w-4" />
                            <span className="hidden lg:inline">Quiz</span>
                          </button>

                          <button
                            onClick={() => onNavigate('notes')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px] font-bold"
                            title="Study Notes"
                          >
                            <BookMarked className="h-4 w-4" />
                            <span className="hidden lg:inline">Notes</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleOpenEditTask(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Task"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setDeletingTaskId(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <span className="hidden sm:inline-block text-xs font-black text-emerald-600 dark:text-emerald-400 ml-1">
                        +30 XP
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WORKSPACE VIEW 2: WEEKLY CALENDAR GRID */}
      {viewMode === 'weekly' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>{isHindi ? '7-दिवसीय साप्ताहिक अध्ययन ग्रिड' : '7-Day Weekly Schedule Grid'}</span>
            <span className="text-xs text-slate-500 font-normal">
              Goal: {totalGoalHours} Hrs / Week
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday',
            ].map((dayName) => {
              const dayTasks = plan.tasks.filter(
                (t) => (t.dayOfWeek || t.dueDate || 'Today').toLowerCase() === dayName.toLowerCase()
              );

              const completedInDay = dayTasks.filter((t) => t.completed).length;
              const minsInDay = dayTasks.reduce((s, t) => s + t.estimatedMinutes, 0);

              return (
                <Card
                  key={dayName}
                  className="space-y-3 hover:border-indigo-300 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedDay(dayName);
                    setViewMode('daily');
                  }}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {dayName}
                    </h4>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {minsInDay} Mins ({dayTasks.length} Tasks)
                    </span>
                  </div>

                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      {isHindi ? 'कोई कार्य तय नहीं' : 'No tasks scheduled'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                t.completed ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`}
                            />
                            <span
                              className={`truncate font-medium ${
                                t.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {t.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">{t.estimatedMinutes}m</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 text-center">
                          +{dayTasks.length - 3} {isHindi ? 'और कार्य' : 'more tasks'}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
                    <span>
                      {completedInDay}/{dayTasks.length} {isHindi ? 'पूर्ण' : 'Completed'}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      {isHindi ? 'देखें' : 'View Day'} <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* WORKSPACE VIEW 3: FULL MONTHLY CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                August 2026 Academic Calendar
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Click any date to inspect tasks
            </span>
          </div>

          {/* Calendar Month Grid */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-xs font-black text-slate-400 py-1 uppercase">
                {d}
              </div>
            ))}

            {Array.from({ length: 31 }, (_, i) => i + 1).map((dateNum) => {
              const isToday = dateNum === 13;
              const hasExam = dateNum === 15 || dateNum === 20;
              const taskCountForDate = dateNum % 3 === 0 ? 3 : dateNum % 2 === 0 ? 2 : 1;

              return (
                <div
                  key={dateNum}
                  onClick={() => {
                    setSelectedDay(isToday ? 'Today' : 'Tomorrow');
                    setViewMode('daily');
                  }}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-20 text-left ${
                    isToday
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {dateNum}
                    </span>
                    {hasExam && (
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" title="Upcoming Exam" />
                    )}
                  </div>

                  <div className="space-y-1">
                    {hasExam && (
                      <span
                        className={`text-[9px] font-bold px-1 py-0.5 rounded-md block truncate ${
                          isToday ? 'bg-indigo-500 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        🎓 Board Exam
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-semibold block ${
                        isToday ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {taskCountForDate} Tasks
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* MODAL 1: PLAN SETUP & CONFIGURATION WIZARD */}
      {showPlanSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-600" />
                  {isHindi ? 'एआई अध्ययन योजनाकार कॉन्फ़िगर करें' : 'Configure AI Study Planner'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isHindi
                    ? 'अपनी कक्षा, उपलब्ध समय, आगामी परीक्षा तिथियों और लक्ष्यों को सेट करें'
                    : 'Set class, study hours, exam dates & personal targets'}
                </p>
              </div>

              <button
                onClick={() => setShowPlanSetupModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="space-y-5 text-xs sm:text-sm">
              {/* Class Selection */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  1. {isHindi ? 'कक्षा (Class Level)' : 'Select Class Level'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CLASS_LEVELS.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSetupClass(cls)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        setupClass === cls
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Class {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Multi-Selection */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  2. {isHindi ? 'विषय चुनें (Select Subjects)' : 'Select Study Subjects'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SUBJECTS.map((subj) => {
                    const isSelected = setupSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => toggleSubject(subj)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                        <span>{subj}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Study Hours & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    3. {isHindi ? 'उपलब्ध दैनिक समय (Hours/Day)' : 'Available Time Per Day'}
                  </label>
                  <select
                    value={setupHours}
                    onChange={(e) => setSetupHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value={1}>1 Hour / Day</option>
                    <option value={2}>2 Hours / Day</option>
                    <option value={3}>3 Hours / Day</option>
                    <option value={4}>4 Hours / Day</option>
                    <option value={5}>5+ Hours / Day</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    4. {isHindi ? 'पसंदीदा समय (Preferred Time Slot)' : 'Preferred Study Time Slot'}
                  </label>
                  <select
                    value={setupTimeSlot}
                    onChange={(e) => setSetupTimeSlot(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Daily Target */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  5. {isHindi ? 'दैनिक शिक्षण लक्ष्य' : 'Daily Learning Target'}
                </label>
                <input
                  type="text"
                  value={setupTarget}
                  onChange={(e) => setSetupTarget(e.target.value)}
                  placeholder="e.g. 3 Tasks & 100 XP per day"
                  className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Add Exam Dates */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  6. {isHindi ? 'परीक्षा तिथियां जोड़ें (Add Exam Dates)' : 'Add Exam Dates'}
                </label>

                <div className="space-y-2 mb-3">
                  {setupExamDates.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          [{ex.subject}] {ex.title}
                        </span>
                        <span className="text-slate-400 ml-2">• Date: {ex.examDate}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExamDate(ex.id)}
                        className="text-rose-500 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={newExamSubject}
                    onChange={(e) => setNewExamSubject(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white"
                  >
                    {setupSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Exam Title (e.g. CBSE Term 1)"
                    value={newExamTitle}
                    onChange={(e) => setNewExamTitle(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white"
                  />

                  <div className="flex gap-1">
                    <input
                      type="date"
                      value={newExamDate}
                      onChange={(e) => setNewExamDate(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white"
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={handleAddExamDate}>
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Personal Study Goals */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  7. {isHindi ? 'व्यक्तिगत अध्ययन लक्ष्य' : 'Personal Study Goals'}
                </label>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {setupGoals.map((g, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-xs font-semibold"
                    >
                      <span>{g}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGoal(idx)}
                        className="hover:text-rose-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add goal e.g. Master Trigonometric Identities"
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddGoal}>
                    Add Goal
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" onClick={() => setShowPlanSetupModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<Sparkles className="h-4 w-4" />}
                onClick={() => handleGeneratePresetPlan('standard')}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Save & Generate AI Plan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASK AI TO IMPROVE MY PLAN */}
      {showAskAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                <span>{isHindi ? 'एआई से समय सारणी सुधरवाएं' : 'Ask AI to Improve My Plan'}</span>
              </h3>
              <button
                onClick={() => setShowAskAiModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Tell EduAI how you want your study plan optimized (e.g. "Increase revision for Math", "Avoid heavy study on Sundays", "Include 20m breaks between sessions").
            </p>

            <textarea
              rows={3}
              value={customAiPrompt}
              onChange={(e) => setCustomAiPrompt(e.target.value)}
              placeholder="e.g. Please balance Science and Math evenly, add revision before my Physics test, and ensure I finish by 8 PM every night."
              className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAskAiModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Sparkles className="h-4 w-4" />}
                onClick={() => handleGeneratePresetPlan('improve', customAiPrompt)}
                disabled={isGenerating}
              >
                {isGenerating ? 'Optimizing...' : 'Optimize Plan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD OR EDIT TASK FORM */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTask
                  ? isHindi ? 'कार्य संपादित करें' : 'Edit Study Task'
                  : isHindi ? 'नया अध्ययन कार्य जोड़ें' : 'Add New Study Task'}
              </h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskFormTitle}
                  onChange={(e) => setTaskFormTitle(e.target.value)}
                  placeholder="e.g. Revise Optics Mirror Formula & Ray Diagrams"
                  className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={taskFormSubject}
                    onChange={(e) => setTaskFormSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    {setupSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Topic Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={taskFormTopic}
                    onChange={(e) => setTaskFormTopic(e.target.value)}
                    placeholder="e.g. Light Reflection"
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={taskFormStartTime}
                    onChange={(e) => setTaskFormStartTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duration
                  </label>
                  <select
                    value={taskFormMinutes}
                    onChange={(e) => setTaskFormMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value={15}>15 Mins</option>
                    <option value={30}>30 Mins</option>
                    <option value={45}>45 Mins</option>
                    <option value={60}>60 Mins</option>
                    <option value={90}>90 Mins</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskFormPriority}
                    onChange={(e) => setTaskFormPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Task Type
                  </label>
                  <select
                    value={taskFormType}
                    onChange={(e) => setTaskFormType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="Revision">Revision</option>
                    <option value="Lesson">Lesson Read</option>
                    <option value="Quiz">Quiz Practice</option>
                    <option value="Exam Practice">Exam Practice</option>
                    <option value="Weak Topic Fix">Weak Topic Fix</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Day / Schedule
                  </label>
                  <select
                    value={taskFormDay}
                    onChange={(e) => setTaskFormDay(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 p-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setShowAddTaskModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveTaskForm}>
                Save Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION MODAL */}
      {deletingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center animate-in zoom-in-95">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {isHindi ? 'कार्य हटाएं?' : 'Delete Study Task?'}
            </h4>
            <p className="text-xs text-slate-500">
              {isHindi
                ? 'क्या आप निश्चित रूप से इस अध्ययन कार्य को समय सारणी से हटाना चाहते हैं?'
                : 'Are you sure you want to remove this task from your study plan?'}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingTaskId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteTask(deletingTaskId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
