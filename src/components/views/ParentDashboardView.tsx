import React, { useState, useEffect } from 'react';
import {
  Heart,
  UserCheck,
  TrendingUp,
  Clock,
  HelpCircle,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Flame,
  Award,
  Sparkles,
  Send,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  BookOpen,
  Target,
  BarChart3,
  Users,
  Plus,
  Star,
  Zap,
  Bell,
  FileText,
  Download,
  Share2,
  Check,
  Lock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { StudentProfile, WeakTopic, StrongTopic, Quiz, Exam, ActivityLog, StudyTask, UserRole } from '../../types';
import { StorageService } from '../../services/storageService';
import { Card } from '../common/Card';

interface ParentDashboardViewProps {
  profile: StudentProfile;
  onNavigate: (section: any) => void;
  lang: string;
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

interface LinkedChild {
  id: string;
  name: string;
  classLevel: string;
  board: string;
  avatarUrl: string;
  isPrimary: boolean;
}

interface LearningNotification {
  id: string;
  type: 'score' | 'alert' | 'teacher' | 'milestone';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  profile: currentProfile,
  onNavigate,
  currentRole = 'parent',
  onRoleChange,
}) => {
  const [profile, setProfile] = useState<StudentProfile>(currentProfile);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [strongTopics, setStrongTopics] = useState<StrongTopic[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'weak-topics' | 'study-plan' | 'upcoming-exams' | 'notifications'>('overview');
  const [reportHorizon, setReportHorizon] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Parent Interactive States
  const [selectedChildId, setSelectedChildId] = useState<string>('child-1');
  const [encouragementText, setEncouragementText] = useState('');
  const [encouragementSent, setEncouragementSent] = useState(false);
  const [aiReportGenerated, setAiReportGenerated] = useState(false);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [parentTargetXp, setParentTargetXp] = useState<number>(profile.dailyXpGoal || 100);
  const [targetSaved, setTargetSaved] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildCode, setNewChildCode] = useState('');
  const [linkSuccessMsg, setLinkSuccessMsg] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Mock linked children list
  const [childrenList, setChildrenList] = useState<LinkedChild[]>([
    {
      id: 'child-1',
      name: profile.name || 'Rahul Sharma',
      classLevel: `Class ${profile.classLevel}`,
      board: profile.board,
      avatarUrl: profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      isPrimary: true,
    },
    {
      id: 'child-2',
      name: 'Priya Sharma',
      classLevel: 'Class 7',
      board: 'CBSE',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      isPrimary: false,
    },
  ]);

  // Notifications state
  const [notifications, setNotifications] = useState<LearningNotification[]>([
    {
      id: 'notif-1',
      type: 'score',
      title: 'High Quiz Score Achieved! 🎉',
      message: `${profile.name || 'Rahul'} scored 92% in Science - Chemical Reactions & Equations quiz!`,
      timestamp: '20 mins ago',
      read: false,
    },
    {
      id: 'notif-2',
      type: 'teacher',
      title: 'Teacher Note Received 💬',
      message: 'Mrs. Anita Roy (Science Teacher): "Rahul demonstrated excellent understanding of ray diagrams in today\'s session."',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 'notif-3',
      type: 'alert',
      title: 'Focus Area Flagged ⚠️',
      message: 'Physics Mirror Magnification sign convention needs 15 mins practice before upcoming mock.',
      timestamp: 'Yesterday',
      read: true,
    },
    {
      id: 'notif-4',
      type: 'milestone',
      title: '7-Day Study Streak Milestone 🔥',
      message: `${profile.name || 'Rahul'} maintained a 7-day study streak with 120+ XP earned daily!`,
      timestamp: '2 days ago',
      read: true,
    },
  ]);

  const loadData = () => {
    const prof = StorageService.getProfile();
    const qList = StorageService.getSavedQuizzes();
    const eList = StorageService.getSavedExams();
    const wList = StorageService.getWeakTopics();
    const sList = StorageService.getStrongTopics();
    const actList = StorageService.getActivities();
    const plan = StorageService.getStudyPlan();

    setProfile(prof);
    setQuizzes(qList);
    setExams(eList);
    setWeakTopics(wList);
    setStrongTopics(sList);
    setActivities(actList);
    setTasks(plan.tasks || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendEncouragement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!encouragementText.trim()) return;

    StorageService.addActivityLog(
      `Parent Encouragement Received`,
      `"${encouragementText.trim()}" — From Parent`,
      10
    );

    setEncouragementSent(true);
    setEncouragementText('');
    loadData();
    setTimeout(() => setEncouragementSent(false), 4000);
  };

  const handleGenerateAiReport = () => {
    setAiReportLoading(true);
    setTimeout(() => {
      setAiReportLoading(false);
      setAiReportGenerated(true);
    }, 1200);
  };

  const handleSaveDailyGoal = () => {
    const updated = { ...profile, dailyXpGoal: parentTargetXp };
    StorageService.saveProfile(updated);
    setProfile(updated);
    setTargetSaved(true);
    setTimeout(() => setTargetSaved(false), 3000);
  };

  const handleLinkChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildCode.trim()) return;

    const newChild: LinkedChild = {
      id: `child-${Date.now()}`,
      name: 'Aarav Sharma',
      classLevel: 'Class 9',
      board: 'ICSE',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
      isPrimary: false,
    };

    setChildrenList([...childrenList, newChild]);
    setLinkSuccessMsg(`Successfully linked ${newChild.name} (${newChild.classLevel})!`);
    setNewChildCode('');
    setTimeout(() => {
      setLinkSuccessMsg(null);
      setShowAddChildModal(false);
    }, 2500);
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  // Calculations
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasksCount = tasks.length || 1;
  const taskCompletionPct = Math.round((completedTasksCount / totalTasksCount) * 100);
  const avgQuizScore = profile.avgScorePercentage || 88;
  const completedExamsCount = exams.filter((e) => e.isCompleted).length;
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Upcoming Exams List
  const upcomingExams = [
    {
      id: 'ex-1',
      title: 'Class 10 CBSE Science Board Mock Exam 1',
      subject: 'Science (Physics, Chemistry, Biology)',
      date: 'Aug 25, 2026',
      daysLeft: 12,
      totalMarks: 80,
      durationMins: 180,
      syllabusCoverage: 85,
    },
    {
      id: 'ex-2',
      title: 'Class 10 CBSE Mathematics Mid-Term Assessment',
      subject: 'Mathematics (Algebra, Trigonometry, Geometry)',
      date: 'Sep 02, 2026',
      daysLeft: 20,
      totalMarks: 80,
      durationMins: 180,
      syllabusCoverage: 72,
    },
    {
      id: 'ex-3',
      title: 'Social Science Chapter 1-5 Assessment',
      subject: 'Social Science (History & Civics)',
      date: 'Sep 10, 2026',
      daysLeft: 28,
      totalMarks: 50,
      durationMins: 90,
      syllabusCoverage: 90,
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Role Access Verification Guard Banner */}
      {currentRole === 'student' && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-extrabold">Student Role Active:</span> You are currently viewing Parent Portal previews. Switch to Parent Role in the top header to enable administrative editing permissions.
            </div>
          </div>
          {onRoleChange && (
            <button
              onClick={() => onRoleChange('parent')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
            >
              Switch to Parent Mode
            </button>
          )}
        </Card>
      )}

      {/* Parent Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300/50 mb-2">
            <Heart className="w-3.5 h-3.5 text-purple-600 fill-current" />
            <span>Parent Monitoring & Safety Portal</span>
            <span className="flex items-center gap-1 text-[10px] ml-1 bg-purple-200 dark:bg-purple-900 px-1.5 py-0.5 rounded font-extrabold text-purple-900 dark:text-purple-100">
              <ShieldCheck className="w-3 h-3" /> Privately Encrypted
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Parent Dashboard & Progress Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time performance analytics, time reports, weak topics, study plan tracking & notifications for {profile.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddChildModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Link Child</span>
          </button>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* Linked Student Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {childrenList.map((child) => {
          const isSelected = selectedChildId === child.id;
          return (
            <Card
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`p-4 cursor-pointer transition-all border-2 ${
                isSelected
                  ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/30 shadow-md ring-2 ring-purple-400/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={child.avatarUrl}
                    alt={child.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                  />
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {child.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {child.classLevel} • {child.board}
                    </p>
                  </div>
                </div>

                {child.isPrimary ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <UserCheck className="w-3 h-3" /> Linked Child
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">Switch</span>
                )}
              </div>
            </Card>
          );
        })}

        <Card
          onClick={() => setShowAddChildModal(true)}
          className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-purple-400 transition-all cursor-pointer flex items-center justify-center text-center group"
        >
          <div className="space-y-1">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Link Another Child
            </p>
            <p className="text-[10px] text-slate-400">Enter Student Code / PIN</p>
          </div>
        </Card>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Daily, Weekly & Monthly Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('weak-topics')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'weak-topics'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Weak Topics ({weakTopics.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('study-plan')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'study-plan'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Study Plan Completion ({taskCompletionPct}%)</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming-exams')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'upcoming-exams'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Upcoming Exams ({upcomingExams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 relative ${
            activeTab === 'notifications'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Learning Alerts</span>
          {unreadNotifCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {unreadNotifCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Primary Linked Student Overview Header */}
          <Card className="relative overflow-hidden border-purple-200 dark:border-purple-900/50 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white/30 shadow-lg"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white uppercase tracking-wider">
                      Linked Student Profile
                    </span>
                    <span className="text-xs font-semibold text-purple-200">ID: EDU-8924-PT</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black">{profile.name}</h3>
                  <p className="text-purple-100 text-xs sm:text-sm">
                    Class {profile.classLevel} • {profile.board} Board • Medium: {profile.medium}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[280px]">
                <div>
                  <div className="text-xs font-medium text-purple-200">Level</div>
                  <div className="text-xl font-black text-white mt-0.5">Lvl {profile.level}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-purple-200">Streak</div>
                  <div className="text-xl font-black text-amber-300 mt-0.5 flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4 fill-current" /> {profile.streakDays}d
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-purple-200">Avg Accuracy</div>
                  <div className="text-xl font-black text-emerald-300 mt-0.5">{avgQuizScore}%</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold">Study Time (This Week)</span>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">18.5 Hrs</div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +2.4 hrs vs last week
              </p>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold">Practice Quizzes</span>
                <HelpCircle className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {quizzes.length || profile.quizzesTaken} Taken
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Avg Score: {avgQuizScore}%
              </p>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold">Mock Exams</span>
                <GraduationCap className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {completedExamsCount} Completed
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Passed Board Standard
              </p>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold">Planner Tasks</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {completedTasksCount} / {totalTasksCount}
              </div>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {taskCompletionPct}% Completion Rate
              </p>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Quiz & Exam Scores */}
              <Card className="p-6 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Recent Quiz & Assessment Scores
                  </h3>
                  <span className="text-xs font-bold text-slate-400">Real-Time Sync</span>
                </div>

                <div className="space-y-3">
                  {quizzes.slice(0, 4).map((q) => {
                    const scorePct = q.score || q.accuracyPercentage || 0;
                    return (
                      <div
                        key={q.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                              {q.title || `${q.subjectName} Quiz`}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                              {q.subjectName}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400">
                            {q.chapterName} • {q.dateTaken || 'Recently'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`text-base font-black ${
                              scorePct >= 80
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : scorePct >= 50
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {scorePct}%
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {q.correctAnswersCount}/{q.totalQuestions || 5} Correct
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Mastered Strong Topics */}
              <Card className="p-6 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Mastered Concepts (Strong Areas)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {strongTopics.map((st) => (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-1"
                    >
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                        {st.subjectName}
                      </span>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {st.topicName}
                      </h5>
                      <div className="flex justify-between items-center text-[11px] font-black text-emerald-600 dark:text-emerald-400 pt-1">
                        <span>{st.accuracyRate}% Mastery</span>
                        <span className="bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded text-[10px]">
                          {st.masteryLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Send Encouragement */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 via-white to-indigo-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/20 border-purple-200 dark:border-purple-900/40 space-y-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-current" />
                  Send Encouragement Note
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Send a praise message directly to {profile.name}'s app dashboard to boost motivation!
                </p>

                <form onSubmit={handleSendEncouragement} className="space-y-2">
                  <textarea
                    value={encouragementText}
                    onChange={(e) => setEncouragementText(e.target.value)}
                    placeholder={`e.g., So proud of your 90% score in Physics! Keep up the great work ${profile.name}! ❤️`}
                    rows={3}
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Praise to {profile.name}</span>
                  </button>
                </form>

                {encouragementSent && (
                  <div className="p-2.5 rounded-lg bg-emerald-500 text-white text-xs font-bold text-center animate-bounce">
                    ✨ Note sent successfully to {profile.name}! (+10 XP Motivation Bonus)
                  </div>
                )}
              </Card>

              {/* Set Daily Goal */}
              <Card className="p-6 bg-white dark:bg-slate-900 space-y-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  Set Student Daily Goal
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Daily XP Target (Current: {profile.dailyXpGoal || 100} XP)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={parentTargetXp}
                      onChange={(e) => setParentTargetXp(Number(e.target.value))}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                    />
                    <button
                      onClick={handleSaveDailyGoal}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shrink-0"
                    >
                      Save Goal
                    </button>
                  </div>
                  {targetSaved && (
                    <p className="text-[11px] font-bold text-emerald-600">Daily goal updated for student!</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPORTS (DAILY, WEEKLY, MONTHLY) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-slate-900 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" /> Periodic Learning Progress Reports
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Analyze {profile.name}'s study time, accuracy trends, and topic mastery across timeframes
                </p>
              </div>

              {/* Time Horizon Selector */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setReportHorizon('daily')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    reportHorizon === 'daily'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Daily Report
                </button>
                <button
                  onClick={() => setReportHorizon('weekly')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    reportHorizon === 'weekly'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Weekly Report
                </button>
                <button
                  onClick={() => setReportHorizon('monthly')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    reportHorizon === 'monthly'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Monthly Report
                </button>
              </div>
            </div>

            {/* Horizon Data Cards */}
            {reportHorizon === 'daily' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 space-y-1">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Today's Study Hours</span>
                    <div className="text-2xl font-black text-purple-900 dark:text-white">2.5 Hours</div>
                    <span className="text-[10px] text-purple-600 font-semibold">100% of Daily Goal</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 space-y-1">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Quizzes Solved Today</span>
                    <div className="text-2xl font-black text-indigo-900 dark:text-white">3 Quizzes</div>
                    <span className="text-[10px] text-emerald-600 font-bold">92% Today Accuracy</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Today XP Earned</span>
                    <div className="text-2xl font-black text-emerald-900 dark:text-white">120 XP</div>
                    <span className="text-[10px] text-emerald-600 font-bold">Target Reached!</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 space-y-1">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Active Streak</span>
                    <div className="text-2xl font-black text-amber-900 dark:text-white">🔥 {profile.streakDays} Days</div>
                    <span className="text-[10px] text-amber-600 font-bold">Consistent Study</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Today's Primary Subject Focus
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Spent 1.2 hrs on <strong>Science (Physics Light Reflection & Ray Diagrams)</strong> and 1.3 hrs completing <strong>Maths Quadratic Equation Practice</strong>.
                  </p>
                </div>
              </div>
            )}

            {reportHorizon === 'weekly' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 space-y-1">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Weekly Study Hours</span>
                    <div className="text-2xl font-black text-purple-900 dark:text-white">18.5 Hours</div>
                    <span className="text-[10px] text-emerald-600 font-bold">+2.4 hrs vs last week</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 space-y-1">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Quizzes Attempted</span>
                    <div className="text-2xl font-black text-indigo-900 dark:text-white">14 Quizzes</div>
                    <span className="text-[10px] text-indigo-600 font-bold">88% Weekly Avg</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Weak Topics Cleared</span>
                    <div className="text-2xl font-black text-emerald-900 dark:text-white">4 Cleared</div>
                    <span className="text-[10px] text-emerald-600 font-bold">Strong Progress</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 space-y-1">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Planner Completion</span>
                    <div className="text-2xl font-black text-rose-900 dark:text-white">{taskCompletionPct}%</div>
                    <span className="text-[10px] text-rose-600 font-bold">{completedTasksCount} Tasks Done</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-2 text-xs">
                  <div className="font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" /> Weekly AI Parent Teacher Summary:
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    Rahul demonstrated consistent study habits this week, logging 18.5 total study hours with peak performance in Chemistry and English Literature. He successfully revised 4 weak concepts.
                  </p>
                </div>
              </div>
            )}

            {reportHorizon === 'monthly' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 space-y-1">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Cumulative Monthly Hours</span>
                    <div className="text-2xl font-black text-purple-900 dark:text-white">74.2 Hours</div>
                    <span className="text-[10px] text-emerald-600 font-bold">+12% vs previous month</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 space-y-1">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Overall Accuracy</span>
                    <div className="text-2xl font-black text-indigo-900 dark:text-white">88.6%</div>
                    <span className="text-[10px] text-emerald-600 font-bold">Top 10% Class Tier</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Exam Readiness Index</span>
                    <div className="text-2xl font-black text-emerald-900 dark:text-white">91 / 100</div>
                    <span className="text-[10px] text-emerald-600 font-bold">High Board Preparedness</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 space-y-1">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Syllabus Coverage</span>
                    <div className="text-2xl font-black text-amber-900 dark:text-white">78%</div>
                    <span className="text-[10px] text-slate-500 font-bold">On Track for Board Exam</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Monthly Subject Mastery Growth
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border">
                      <span className="font-bold text-indigo-600">Science (CBSE)</span>
                      <p className="text-slate-500 text-[11px]">88% Mastery • 12 Chapters Covered</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border">
                      <span className="font-bold text-emerald-600">Mathematics</span>
                      <p className="text-slate-500 text-[11px]">82% Mastery • 10 Chapters Covered</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Report Trigger */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Official Parent Progress Report (PDF)</span>
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: WEAK TOPICS */}
      {activeTab === 'weak-topics' && (
        <Card className="p-6 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                Student Weak Topics & AI Remediation Plans
              </h3>
              <p className="text-xs text-slate-500">
                Identify concepts where {profile.name} struggled in recent quizzes and trigger targeted AI practice.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              {weakTopics.length} Identified
            </span>
          </div>

          <div className="space-y-3">
            {weakTopics.map((wt) => (
              <div
                key={wt.id}
                className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      {wt.subjectName} • {wt.chapterName}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                      {wt.topicName}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                      {wt.accuracyRate}% Accuracy
                    </span>
                    <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                      {wt.urgency} Urgency
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/30 text-xs space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> AI Recommended Remediation:
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{wt.recommendedAction}</p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => onNavigate('quiz')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch AI Remediation Quiz for {profile.name}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: STUDY PLAN COMPLETION */}
      {activeTab === 'study-plan' && (
        <Card className="p-6 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                Study Planner Task Completion Tracking
              </h3>
              <p className="text-xs text-slate-500">
                Monitor task completion rates, completed study sessions, and overdue schedule items.
              </p>
            </div>
            <span className="text-xs font-black text-purple-600">
              {completedTasksCount} / {totalTasksCount} ({taskCompletionPct}%)
            </span>
          </div>

          <div className="space-y-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                      t.completed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    {t.completed ? <Check className="w-4 h-4" /> : null}
                  </div>
                  <div>
                    <span className={`font-extrabold text-sm ${t.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {t.title}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Subject: {t.subject} • Target: {t.targetMinutes || 30} mins
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    t.completed
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {t.completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 5: UPCOMING EXAMS */}
      {activeTab === 'upcoming-exams' && (
        <Card className="p-6 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Upcoming Board Exams & Assessment Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Track countdowns, total marks, and syllabus revision coverage for {profile.name}'s exams.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {upcomingExams.map((ex) => (
              <div
                key={ex.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {ex.subject}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                      {ex.title}
                    </h4>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{ex.daysLeft} Days Left ({ex.date})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Syllabus Revision Coverage</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{ex.syllabusCoverage}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                      style={{ width: `${ex.syllabusCoverage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 6: LEARNING NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <Card className="p-6 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                Real-Time Learning Alerts & Teacher Notes
              </h3>
              <p className="text-xs text-slate-500">
                Automated notifications regarding test scores, study habits, and teacher communication.
              </p>
            </div>
            {unreadNotifCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs font-bold text-purple-600 hover:text-purple-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all space-y-1 ${
                  !notif.read
                    ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{notif.message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Link Child Modal */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" /> Link Student Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the unique 8-character Student Link Code or Parent PIN from your child's Profile page.
            </p>

            <form onSubmit={handleLinkChild} className="space-y-3">
              <input
                type="text"
                value={newChildCode}
                onChange={(e) => setNewChildCode(e.target.value.toUpperCase())}
                placeholder="e.g., EDU-8924-PT"
                className="w-full p-3 text-sm font-mono font-bold tracking-wider text-center uppercase rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
              />

              {linkSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500 text-white font-bold text-xs text-center">
                  {linkSuccessMsg}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Verify & Link Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Official Parent Progress Report Generated
              </h3>
              <p className="text-xs text-slate-500">
                Includes verified attendance logs, test accuracy curves, AI teacher recommendations & board readiness metrics for {profile.name}.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Document ID:</span>
                <span className="font-bold text-slate-900 dark:text-white">REP-2026-PT-08</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Format:</span>
                <span className="font-bold text-slate-900 dark:text-white">PDF / Print-Ready</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Downloaded official Parent Report for ${profile.name}!`);
                setShowExportModal(false);
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Report PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
