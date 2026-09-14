import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  HelpCircle,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Send,
  Search,
  Filter,
  FileText,
  Award,
  Flame,
  Star,
  RefreshCw,
  ChevronRight,
  Zap,
  Target,
  X,
  MessageSquare,
  PlusCircle,
  Trash2,
  Edit3,
  UserPlus,
  Calendar,
  AlertTriangle,
  Download,
  Check,
} from 'lucide-react';
import { StudentProfile, Quiz, Exam, WeakTopic, ActivityLog, UserRole } from '../../types';
import { StorageService } from '../../services/storageService';
import { Card } from '../common/Card';

interface TeacherDashboardViewProps {
  profile: StudentProfile;
  onNavigate: (section: any) => void;
  lang: string;
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

interface ClassStudent {
  id: string;
  rollNo: string;
  name: string;
  avatarUrl: string;
  streakDays: number;
  quizAvg: number;
  examAvg: number;
  status: 'Top Performer' | 'On Track' | 'Needs Support';
  weakSubject: string;
  lastActive: string;
  parentEmail?: string;
  isRealUser?: boolean;
}

interface ClassSection {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
  gradeAvg: number;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  profile: realProfile,
  onNavigate,
  currentRole = 'teacher',
  onRoleChange,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('class-10a');
  const [activeTab, setActiveTab] = useState<'roster' | 'classes' | 'reports' | 'quizzes' | 'exams' | 'weak-topics'>('roster');
  const [reportHorizon, setReportHorizon] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Interactive States
  const [selectedStudent, setSelectedStudent] = useState<ClassStudent | null>(null);

  // Modal 1: Add Student Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentParentEmail, setNewStudentParentEmail] = useState('');

  // Modal 2: Create Class Modal
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('Science');

  // Modal 3: Create Quiz Modal
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizSubject, setQuizSubject] = useState('Science');
  const [quizChapter, setQuizChapter] = useState('Light Reflection & Refraction');
  const [quizNumQuestions, setQuizNumQuestions] = useState(10);
  const [quizDifficulty, setQuizDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [quizPublished, setQuizPublished] = useState(false);

  // Modal 4: Create Exam Modal
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('Science');
  const [examTotalMarks, setExamTotalMarks] = useState(80);
  const [examDurationMins, setExamDurationMins] = useState(180);
  const [examDate, setExamDate] = useState('2026-08-30');
  const [examPublished, setExamPublished] = useState(false);

  // Modal 5: Assign Homework/Task Modal
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignSubject, setAssignSubject] = useState('Science');
  const [assignSuccess, setAssignSuccess] = useState(false);

  const [aiReportGenerated, setAiReportGenerated] = useState(false);
  const [aiReportLoading, setAiReportLoading] = useState(false);

  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Classes List
  const [classesList, setClassesList] = useState<ClassSection[]>([
    { id: 'class-10a', name: 'Class 10 - Section A', subject: 'Science & Mathematics', studentCount: 32, gradeAvg: 84 },
    { id: 'class-10b', name: 'Class 10 - Section B', subject: 'General Science', studentCount: 28, gradeAvg: 78 },
    { id: 'class-9a', name: 'Class 9 - Section A', subject: 'Science', studentCount: 30, gradeAvg: 81 },
  ]);

  // Derive class roster combining real profile data and class peers
  const realStudentQuizAvg = realProfile.avgScorePercentage || 88;
  const realStudentExamAvg = 90;

  const [classRoster, setClassRoster] = useState<ClassStudent[]>([
    {
      id: 'st-real',
      rollNo: '1001',
      name: realProfile.name || 'Rahul Sharma',
      avatarUrl: realProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      streakDays: realProfile.streakDays || 7,
      quizAvg: realStudentQuizAvg,
      examAvg: realStudentExamAvg,
      status: 'Top Performer',
      weakSubject: 'Physics Mirrors',
      lastActive: '5 mins ago',
      parentEmail: 'parent.rahul@example.com',
      isRealUser: true,
    },
    {
      id: 'st-2',
      rollNo: '1002',
      name: 'Ananya Patel',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      streakDays: 12,
      quizAvg: 94,
      examAvg: 92,
      status: 'Top Performer',
      weakSubject: 'Trigonometry',
      lastActive: '20 mins ago',
      parentEmail: 'ananya.parent@example.com',
    },
    {
      id: 'st-3',
      rollNo: '1003',
      name: 'Rohan Verma',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
      streakDays: 5,
      quizAvg: 76,
      examAvg: 72,
      status: 'On Track',
      weakSubject: 'Quadratic Equations',
      lastActive: '1 hr ago',
      parentEmail: 'rohan.p@example.com',
    },
    {
      id: 'st-4',
      rollNo: '1004',
      name: 'Priya Singh',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      streakDays: 2,
      quizAvg: 58,
      examAvg: 54,
      status: 'Needs Support',
      weakSubject: 'Chemical Reactions & Equations',
      lastActive: '3 hrs ago',
      parentEmail: 'priya.singh.p@example.com',
    },
    {
      id: 'st-5',
      rollNo: '1005',
      name: 'Aarav Gupta',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      streakDays: 9,
      quizAvg: 85,
      examAvg: 88,
      status: 'On Track',
      weakSubject: 'Rise of Nationalism',
      lastActive: '30 mins ago',
      parentEmail: 'aarav.g@example.com',
    },
    {
      id: 'st-6',
      rollNo: '1006',
      name: 'Sneha Rao',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80',
      streakDays: 1,
      quizAvg: 48,
      examAvg: 52,
      status: 'Needs Support',
      weakSubject: 'Electricity Ohm’s Law',
      lastActive: 'Yesterday',
      parentEmail: 'sneha.p@example.com',
    },
  ]);

  const filteredRoster = classRoster.filter((st) =>
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.rollNo.includes(searchQuery)
  );

  // Handlers
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentRoll.trim()) return;

    const added: ClassStudent = {
      id: `st-${Date.now()}`,
      rollNo: newStudentRoll,
      name: newStudentName,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      streakDays: 0,
      quizAvg: 75,
      examAvg: 75,
      status: 'On Track',
      weakSubject: 'Getting Started',
      lastActive: 'Just now',
      parentEmail: newStudentParentEmail,
    };

    setClassRoster([...classRoster, added]);
    setNewStudentName('');
    setNewStudentRoll('');
    setNewStudentParentEmail('');
    setShowAddStudentModal(false);
  };

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newCls: ClassSection = {
      id: `class-${Date.now()}`,
      name: newClassName,
      subject: newClassSubject,
      studentCount: 1,
      gradeAvg: 80,
    };

    setClassesList([...classesList, newCls]);
    setNewClassName('');
    setShowCreateClassModal(false);
  };

  const handleCreateQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) return;

    StorageService.addActivityLog(
      `Teacher Quiz Created & Published`,
      `"${quizTitle}" (${quizSubject} - ${quizChapter}) published to Class 10A`,
      25
    );

    setQuizPublished(true);
    setTimeout(() => {
      setQuizPublished(false);
      setShowCreateQuizModal(false);
      setQuizTitle('');
    }, 2000);
  };

  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return;

    StorageService.addActivityLog(
      `Teacher Mock Exam Scheduled`,
      `"${examTitle}" (${examTotalMarks} Marks) scheduled for ${examDate}`,
      30
    );

    setExamPublished(true);
    setTimeout(() => {
      setExamPublished(false);
      setShowCreateExamModal(false);
      setExamTitle('');
    }, 2000);
  };

  const handleAssignTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;

    StorageService.addActivityLog(
      `Teacher Task Broadcasted`,
      `"${assignTitle}" in ${assignSubject} assigned to Class 10A`,
      15
    );

    setAssignSuccess(true);
    setAssignTitle('');
    setTimeout(() => {
      setAssignSuccess(false);
      setShowAssignTaskModal(false);
    }, 2000);
  };

  const handleGenerateDiagnostics = () => {
    setAiReportLoading(true);
    setTimeout(() => {
      setAiReportLoading(false);
      setAiReportGenerated(true);
    }, 1200);
  };

  const handleSendFeedback = () => {
    if (!feedbackNote.trim() || !selectedStudent) return;
    setFeedbackSent(true);
    setFeedbackNote('');
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (confirm('Are you sure you want to remove this student from the class roster?')) {
      setClassRoster(classRoster.filter((st) => st.id !== studentId));
      if (selectedStudent?.id === studentId) setSelectedStudent(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Role Security Warning Banner */}
      {currentRole === 'student' && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-extrabold">Student Role Active:</span> You are viewing Teacher Dashboard previews. Switch to Teacher Mode in the top navigation header to create real quizzes, schedule exams & broadcast tasks.
            </div>
          </div>
          {onRoleChange && (
            <button
              onClick={() => onRoleChange('teacher')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
            >
              Switch to Teacher Mode
            </button>
          )}
        </Card>
      )}

      {/* Teacher Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300/50 mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Teacher Educator Management Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Teacher Dashboard & Class Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage students, create custom quizzes, schedule mock exams, review weak topics & publish study tasks
          </p>
        </div>

        {/* Class Selector & Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs focus:ring-2 focus:ring-indigo-500"
          >
            {classesList.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.subject})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateQuizModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quiz</span>
          </button>

          <button
            onClick={() => setShowCreateExamModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Exam</span>
          </button>

          <button
            onClick={() => onNavigate('paper-generator')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Paper Generator</span>
          </button>
        </div>
      </div>

      {/* Class KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">Class Roster</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {classRoster.length} Students
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 96% Attendance
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">Class Quiz Average</span>
            <HelpCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">82.4%</div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +4.2% vs last quiz
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">Board Mock Pass Rate</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">95.2%</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            30 / 32 Passed Cutoff
          </p>
        </Card>

        <Card className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 space-y-1">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-bold">At-Risk Students</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300">2 Students</div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
            Needs AI Remediation
          </p>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Roster ({classRoster.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'classes'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Class & Subject Management</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Class Reports (Daily, Weekly, Monthly)</span>
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'quizzes'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Quizzes & Item Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'exams'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Mock Exams</span>
        </button>

        <button
          onClick={() => setActiveTab('weak-topics')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'weak-topics'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Class Weak Topics</span>
        </button>
      </div>

      {/* TAB 1: STUDENT ROSTER */}
      {activeTab === 'roster' && (
        <Card className="p-6 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student by name or roll number..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Student</span>
              </button>

              <button
                onClick={handleGenerateDiagnostics}
                disabled={aiReportLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Diagnostics</span>
              </button>
            </div>
          </div>

          {aiReportGenerated && (
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> AI Class Diagnostic Summary:
              </div>
              <p>
                Class 10A exhibits <strong>88%+ mastery</strong> in Chemistry & English. <strong>2 students (Priya & Sneha)</strong> require targeted remedial practice on Physics Mirror Formula & Electricity Ohm's Law.
              </p>
            </div>
          )}

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Streak</th>
                  <th className="p-3">Quiz Avg</th>
                  <th className="p-3">Exam Avg</th>
                  <th className="p-3">Primary Focus Topic</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRoster.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-slate-500">{student.rollNo}</td>
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                      <div>
                        <span>{student.name}</span>
                        {student.isRealUser && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            Active Student
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-amber-600 dark:text-amber-400">
                      🔥 {student.streakDays}d
                    </td>
                    <td className="p-3 font-black text-slate-900 dark:text-white">{student.quizAvg}%</td>
                    <td className="p-3 font-black text-slate-900 dark:text-white">{student.examAvg}%</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">{student.weakSubject}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          student.status === 'Top Performer'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : student.status === 'On Track'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-all"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Remove Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: CLASS & SUBJECT MANAGEMENT */}
      {activeTab === 'classes' && (
        <Card className="p-6 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Managed Classes & Subject Assignments
              </h3>
              <p className="text-xs text-slate-500">
                Create new class sections, assign subject teachers, and monitor class grade averages.
              </p>
            </div>

            <button
              onClick={() => setShowCreateClassModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Class Section</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classesList.map((cls) => (
              <div
                key={cls.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{cls.name}</h4>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{cls.subject}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl">
                    <span className="text-slate-400 text-[10px]">Total Roster</span>
                    <div className="text-sm font-black text-slate-900 dark:text-white">{cls.studentCount} Students</div>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl">
                    <span className="text-slate-400 text-[10px]">Grade Average</span>
                    <div className="text-sm font-black text-indigo-600">{cls.gradeAvg}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: CLASS REPORTS (DAILY, WEEKLY, MONTHLY) */}
      {activeTab === 'reports' && (
        <Card className="p-6 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Aggregated Class Learning Performance Reports
              </h3>
              <p className="text-xs text-slate-500">
                Analyze total class study hours, quiz accuracy distributions, and attendance curves.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setReportHorizon('daily')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  reportHorizon === 'daily' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setReportHorizon('weekly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  reportHorizon === 'weekly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setReportHorizon('monthly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  reportHorizon === 'monthly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {reportHorizon === 'daily' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">Today Class Active</span>
                  <div className="text-2xl font-black text-indigo-600 mt-1">31 / 32 Students</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">Today Quizzes Solved</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">42 Quizzes</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">Today Avg Score</span>
                  <div className="text-2xl font-black text-purple-600 mt-1">84.2%</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">XP Awarded Today</span>
                  <div className="text-2xl font-black text-amber-600 mt-1">3,850 XP</div>
                </div>
              </div>
            </div>
          )}

          {reportHorizon === 'weekly' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">Weekly Class Study Hours</span>
                  <div className="text-2xl font-black text-indigo-600 mt-1">480.5 Hours</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">Weekly Quiz Pass Rate</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">94.8%</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">Remedial Concepts Cleared</span>
                  <div className="text-2xl font-black text-purple-600 mt-1">18 Cleared</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">Top Performing Subject</span>
                  <div className="text-2xl font-black text-amber-600 mt-1">Chemistry</div>
                </div>
              </div>
            </div>
          )}

          {reportHorizon === 'monthly' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">Monthly Roster Hours</span>
                  <div className="text-2xl font-black text-indigo-600 mt-1">1,920 Hours</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">Board Readiness Index</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">92 / 100</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">Monthly Syllabus Completed</span>
                  <div className="text-2xl font-black text-purple-600 mt-1">82%</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500">Class Average Grade</span>
                  <div className="text-2xl font-black text-amber-600 mt-1">Grade A</div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: QUIZZES & ITEM ANALYSIS */}
      {activeTab === 'quizzes' && (
        <Card className="p-6 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                Class Quiz Management & Question Item Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Review specific question concepts where students made the highest number of errors.
              </p>
            </div>

            <button
              onClick={() => setShowCreateQuizModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create AI Class Quiz</span>
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Q4: Mirror Magnification Sign Convention for Convex Mirrors',
                subject: 'Science - Optics',
                errorRate: 58,
                totalAttempted: 32,
              },
              {
                q: 'Q2: Formulating Quadratic Equations from Speed-Distance Word Problems',
                subject: 'Mathematics',
                errorRate: 42,
                totalAttempted: 32,
              },
              {
                q: 'Q5: Balancing Redox Reactions in Acidic Medium',
                subject: 'Science - Chemistry',
                errorRate: 25,
                totalAttempted: 32,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                      {item.subject}
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-white mt-0.5">{item.q}</h5>
                  </div>
                  <span className="px-2.5 py-1 rounded-full font-black text-rose-600 bg-rose-100 dark:bg-rose-950 dark:text-rose-300">
                    {item.errorRate}% Class Error
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 5: MOCK EXAMS */}
      {activeTab === 'exams' && (
        <Card className="p-6 bg-white dark:bg-slate-900 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                Class Board Mock Exam Schedule & Grade Distribution
              </h3>
            </div>

            <button
              onClick={() => setShowCreateExamModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule New Mock Exam</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Grade A (90%+)</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">11 Students</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300">Grade B (75-89%)</span>
              <div className="text-2xl font-black text-blue-600 mt-1">15 Students</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Grade C (60-74%)</span>
              <div className="text-2xl font-black text-amber-600 mt-1">4 Students</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">Grade D (&lt;60%)</span>
              <div className="text-2xl font-black text-rose-600 mt-1">2 Students</div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 6: CLASS WEAK TOPICS */}
      {activeTab === 'weak-topics' && (
        <Card className="p-6 bg-white dark:bg-slate-900 space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            Class-Wide Aggregated Weak Topics
          </h3>

          <div className="space-y-3">
            {[
              { topic: 'Spherical Mirror Sign Convention & Magnification', subject: 'Science', studentsCount: 14 },
              { topic: 'Quadratic Equation Speed-Distance Word Formulations', subject: 'Mathematics', studentsCount: 10 },
              { topic: 'Carbon Covalent Bonding Structures', subject: 'Science', studentsCount: 8 },
            ].map((wt, i) => (
              <div key={i} className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase">{wt.subject}</span>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">{wt.topic}</h5>
                </div>
                <span className="px-3 py-1 rounded-full font-black text-rose-700 bg-rose-100 dark:bg-rose-900 dark:text-rose-200">
                  {wt.studentsCount} Students Struggling
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODAL 1: ADD STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" /> Add Student to Class Roster
            </h3>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Student Roll Number</label>
                <input
                  type="text"
                  value={newStudentRoll}
                  onChange={(e) => setNewStudentRoll(e.target.value)}
                  placeholder="e.g. 1007"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Student Full Name</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Parent Email (Optional)</label>
                <input
                  type="email"
                  value={newStudentParentEmail}
                  onChange={(e) => setNewStudentParentEmail(e.target.value)}
                  placeholder="e.g. parent.vikram@example.com"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE CLASS SECTION */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600" /> Create New Class Section
            </h3>

            <form onSubmit={handleCreateClassSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Class & Section Name</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Class 10 - Section C"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Assigned Subject</label>
                <select
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                >
                  <option value="Science & Mathematics">Science & Mathematics</option>
                  <option value="General Science">General Science</option>
                  <option value="Social Science">Social Science</option>
                  <option value="English Literature">English Literature</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE QUIZ */}
      {showCreateQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" /> Create & Broadcast AI Practice Quiz
            </h3>

            <form onSubmit={handleCreateQuizSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Quiz Title</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Light Reflection Ray Diagrams Diagnostic Quiz"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Subject</label>
                  <select
                    value={quizSubject}
                    onChange={(e) => setQuizSubject(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                  >
                    <option value="Science">Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Social Science">Social Science</option>
                    <option value="English">English</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Difficulty</label>
                  <select
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard Board Standard</option>
                  </select>
                </div>
              </div>

              {quizPublished && (
                <div className="p-3 rounded-xl bg-emerald-500 text-white font-bold text-xs text-center">
                  ✨ Quiz created & published to all students in Class 10A!
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateQuizModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Publish Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE EXAM */}
      {showCreateExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" /> Schedule Class Board Mock Exam
            </h3>

            <form onSubmit={handleCreateExamSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Exam Title</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. CBSE Science Mid-Term Full Syllabus Mock Exam"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Marks</label>
                  <input
                    type="number"
                    value={examTotalMarks}
                    onChange={(e) => setExamTotalMarks(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Duration (Mins)</label>
                  <input
                    type="number"
                    value={examDurationMins}
                    onChange={(e) => setExamDurationMins(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Scheduled Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold mt-1"
                />
              </div>

              {examPublished && (
                <div className="p-3 rounded-xl bg-purple-600 text-white font-bold text-xs text-center">
                  ✨ Exam scheduled & added to students' exam calendars!
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateExamModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT INSPECT MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <img
                src={selectedStudent.avatarUrl}
                alt={selectedStudent.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500"
              />
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedStudent.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Roll No: {selectedStudent.rollNo} • Class 10A • Streak: 🔥 {selectedStudent.streakDays}d
                </p>
                <p className="text-[11px] font-mono text-indigo-600 mt-0.5">
                  Parent Email: {selectedStudent.parentEmail || 'Not linked'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span>Quiz Average</span>
                <div className="text-lg font-black text-indigo-600 mt-0.5">{selectedStudent.quizAvg}%</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span>Exam Average</span>
                <div className="text-lg font-black text-purple-600 mt-0.5">{selectedStudent.examAvg}%</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Send Direct Teacher Note to Student or Parent
              </label>
              <textarea
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder="e.g., Excellent performance on today's quiz! Keep focusing on Ray Diagrams."
                rows={3}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
              />
              <button
                onClick={handleSendFeedback}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Note</span>
              </button>
              {feedbackSent && (
                <p className="text-xs font-bold text-emerald-600 text-center">Feedback note sent!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
