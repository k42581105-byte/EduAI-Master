import React from 'react';
import {
  Users,
  GraduationCap,
  Heart,
  Briefcase,
  Activity,
  Layers,
  BookOpen,
  HelpCircle,
  FileCheck,
  Bot,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Server,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AdminSystemStats, AdminTab, AdminAiUsageDayStat } from '../../../../types';
import { Card } from '../../../common/Card';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';

interface AdminOverviewTabProps {
  stats: AdminSystemStats;
  aiUsageTrends: AdminAiUsageDayStat[];
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  stats,
  aiUsageTrends,
  onNavigateTab,
}) => {
  // Format token counts
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
    return tokens.toString();
  };

  const overviewCards = [
    {
      id: 'total-users',
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+14% this week',
      icon: <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      border: 'border-indigo-100 dark:border-indigo-900/60',
      tabTarget: 'users' as AdminTab,
    },
    {
      id: 'students',
      label: 'Students Enrolled',
      value: stats.studentsCount.toLocaleString(),
      change: 'Classes 1–12',
      icon: <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      border: 'border-blue-100 dark:border-blue-900/60',
      tabTarget: 'users' as AdminTab,
    },
    {
      id: 'parents',
      label: 'Parents Connected',
      value: stats.parentsCount.toLocaleString(),
      change: 'Active Weekly Sync',
      icon: <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400 fill-current" />,
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      border: 'border-purple-100 dark:border-purple-900/60',
      tabTarget: 'users' as AdminTab,
    },
    {
      id: 'teachers',
      label: 'Teachers & Faculty',
      value: stats.teachersCount.toLocaleString(),
      change: 'Curriculum Managers',
      icon: <Briefcase className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      bg: 'bg-teal-50 dark:bg-teal-950/50',
      border: 'border-teal-100 dark:border-teal-900/60',
      tabTarget: 'users' as AdminTab,
    },
    {
      id: 'active-users',
      label: 'Live Active Users',
      value: stats.activeUsersOnline.toLocaleString(),
      change: 'Online Right Now',
      icon: <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      border: 'border-emerald-100 dark:border-emerald-900/60',
      tabTarget: 'users' as AdminTab,
    },
    {
      id: 'classes',
      label: 'Standard Classes',
      value: `${stats.totalClasses} Grades`,
      change: 'Class 1 to Class 12',
      icon: <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      border: 'border-amber-100 dark:border-amber-900/60',
      tabTarget: 'curriculum' as AdminTab,
    },
    {
      id: 'subjects',
      label: 'Curriculum Subjects',
      value: stats.totalSubjects.toLocaleString(),
      change: 'CBSE, ICSE & State',
      icon: <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      bg: 'bg-cyan-50 dark:bg-cyan-950/50',
      border: 'border-cyan-100 dark:border-cyan-900/60',
      tabTarget: 'curriculum' as AdminTab,
    },
    {
      id: 'books',
      label: 'Digital Textbooks',
      value: stats.totalBooks.toLocaleString(),
      change: 'NCERT & State Catalog',
      icon: <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      bg: 'bg-violet-50 dark:bg-violet-950/50',
      border: 'border-violet-100 dark:border-violet-900/60',
      tabTarget: 'books' as AdminTab,
    },
    {
      id: 'quizzes',
      label: 'AI Quizzes Taken',
      value: stats.totalQuizzesGenerated.toLocaleString(),
      change: '78.4% Average Score',
      icon: <HelpCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      border: 'border-rose-100 dark:border-rose-900/60',
      tabTarget: 'quizzes' as AdminTab,
    },
    {
      id: 'exams',
      label: 'Exam Simulations',
      value: stats.totalExamsSimulated.toLocaleString(),
      change: 'Timed Mock Papers',
      icon: <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      border: 'border-indigo-100 dark:border-indigo-900/60',
      tabTarget: 'exams' as AdminTab,
    },
    {
      id: 'ai-usage',
      label: 'AI Inquiries & OCR',
      value: stats.totalAiQueries.toLocaleString(),
      change: `${formatTokens(stats.totalAiTokensEstimated)} Tokens est.`,
      icon: <Bot className="w-5 h-5 text-amber-500 fill-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      border: 'border-amber-100 dark:border-amber-900/60',
      tabTarget: 'reports' as AdminTab,
    },
    {
      id: 'system-health',
      label: 'System Uptime & Health',
      value: `${stats.systemHealth.uptimePercentage}%`,
      change: `${stats.systemHealth.avgLatencyMs}ms Latency`,
      icon: <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      border: 'border-emerald-100 dark:border-emerald-900/60',
      tabTarget: 'settings' as AdminTab,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Platform Security Banner */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">
                EduAI Master Production Environment
              </h3>
              <Badge variant="emerald">Live & Protected</Badge>
            </div>
            <p className="text-xs text-slate-300">
              Role-protected administrative console with strict privacy masking. Student passwords & sensitive credentials are encrypted.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
            onClick={() => onNavigateTab('reports')}
          >
            <span>View Full Reports</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="text-xs shadow-md"
            onClick={() => onNavigateTab('users')}
          >
            <span>Manage Users ({stats.totalUsers})</span>
          </Button>
        </div>
      </div>

      {/* 12 Key Metrics Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Core System & Academic Metrics (12 KPI Cards)
          </h4>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Realtime Analytics Stream
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {overviewCards.map((card) => (
            <div
              key={card.id}
              onClick={() => onNavigateTab(card.tabTarget)}
              className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.bg} ${card.border}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-2xs">
                  {card.icon}
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {card.label}
                </p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {card.value}
                </p>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {card.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simple Analytics Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly AI Engagement Trend */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                7-Day AI Activity & Inquiries Volume
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ask AI chats, Photo Solver OCR scans, and instant quiz paper generations
              </p>
            </div>
            <Badge variant="indigo">Daily Aggregates</Badge>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-2 pt-2">
              {aiUsageTrends.map((day, idx) => {
                const maxVal = 2000;
                const totalDayQueries = day.askAiQueries + day.photoScans + day.quizGenerations;
                const heightPercent = Math.min(100, Math.round((totalDayQueries / maxVal) * 100));

                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-col justify-end p-1 relative overflow-hidden group">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-lg bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-700 group-hover:to-indigo-500 transition-all"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-950/75 text-white text-[9px] font-bold rounded-xl transition-opacity p-1 text-center">
                        {totalDayQueries} calls
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                  Ask AI Conversations
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400" />
                  Photo Solver OCR
                </span>
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Peak Day: {Math.max(...aiUsageTrends.map((d) => d.askAiQueries + d.photoScans + d.quizGenerations))} requests
              </span>
            </div>
          </div>
        </Card>

        {/* User Distribution by Role */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              User Role Distribution
            </h4>
            <Badge variant="purple">1,911 Total</Badge>
          </div>

          <div className="space-y-3.5">
            {/* Students */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                  Students (74.7%)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {stats.studentsCount}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '74.7%' }} />
              </div>
            </div>

            {/* Parents */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-purple-500 fill-current" />
                  Parents (20.1%)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {stats.parentsCount}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '20.1%' }} />
              </div>
            </div>

            {/* Teachers */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-teal-500" />
                  Teachers (5.0%)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {stats.teachersCount}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: '5.0%' }} />
              </div>
            </div>

            {/* Admins */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  System Admins (0.2%)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {stats.adminsCount}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '3%' }} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center text-xs"
              onClick={() => onNavigateTab('users')}
            >
              Open User Directory
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Administrative Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => onNavigateTab('curriculum')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all text-left shadow-2xs group"
        >
          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
            Curriculum Matrix
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Classes 1–12 syllabus topics & boards
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('questions')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all text-left shadow-2xs group"
        >
          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
            Master Questions
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            MCQs, Assertions, Numerical items
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('exams')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all text-left shadow-2xs group"
        >
          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
            Mock Exam Papers
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Timed board mock simulator tests
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('backups')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all text-left shadow-2xs group"
        >
          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
            Database Backups
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Automated snapshots & recovery
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all text-left shadow-2xs group"
        >
          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
            System & AI Settings
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Gemini token buffers & audit logs
          </p>
        </button>
      </div>
    </div>
  );
};
