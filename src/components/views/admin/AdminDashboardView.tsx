import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
  HelpCircle,
  FileCheck,
  FileText,
  Settings,
  ShieldCheck,
  Lock,
  RefreshCw,
  Sparkles,
  Server,
  Activity,
  ArrowLeft,
  Calendar,
  Database
} from 'lucide-react';
import { AdminTab, AdminSystemStats, StudentProfile, UserRole } from '../../../types';
import { AdminService } from '../../../services/adminService';
import { AdminLockScreen } from './AdminLockScreen';
import { AdminOverviewTab } from './tabs/AdminOverviewTab';
import { AdminUsersTab } from './tabs/AdminUsersTab';
import { AdminCurriculumTab } from './tabs/AdminCurriculumTab';
import { AdminBooksTab } from './tabs/AdminBooksTab';
import { AdminQuestionsTab } from './tabs/AdminQuestionsTab';
import { AdminQuizzesTab } from './tabs/AdminQuizzesTab';
import { AdminExamsTab } from './tabs/AdminExamsTab';
import { AdminReportsTab } from './tabs/AdminReportsTab';
import { AdminBackupsTab } from './tabs/AdminBackupsTab';
import { AdminSecurityTab } from './tabs/AdminSecurityTab';
import { AdminSettingsTab } from './tabs/AdminSettingsTab';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';

interface AdminDashboardViewProps {
  profile: StudentProfile;
  userRole?: UserRole;
  onNavigateSection?: (section: any) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  profile,
  userRole,
  onNavigateSection,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() =>
    AdminService.isAdminUnlocked(userRole)
  );
  const [stats, setStats] = useState<AdminSystemStats>(() =>
    AdminService.getSystemStats()
  );
  const [aiUsageTrends, setAiUsageTrends] = useState(() =>
    AdminService.getAiUsageHistory()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshAllStats = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStats(AdminService.getSystemStats());
      setAiUsageTrends(AdminService.getAiUsageHistory());
      setIsRefreshing(false);
    }, 300);
  };

  const handleLockSession = () => {
    AdminService.lockAdmin();
    setIsUnlocked(false);
  };

  if (!isUnlocked) {
    return (
      <AdminLockScreen
        onUnlockSuccess={() => {
          setIsUnlocked(true);
          refreshAllStats();
        }}
        onCancel={() => {
          if (onNavigateSection) {
            onNavigateSection('home');
          }
        }}
      />
    );
  }

  const adminNavItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'curriculum', label: 'Curriculum', icon: <Layers className="w-4 h-4" /> },
    { id: 'books', label: 'Books', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'questions', label: 'Questions', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'exams', label: 'Exams', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'backups', label: 'Backups', icon: <Database className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Audit', icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Admin Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Admin Console
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                Authorized Session
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              System governance, user partitions, curriculum catalog & AI analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={refreshAllStats}
            disabled={isRefreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            onClick={handleLockSession}
            icon={<Lock className="w-3.5 h-3.5" />}
          >
            <span>Lock</span>
          </Button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 min-w-max">
          {adminNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Tab Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'dashboard' && (
          <AdminOverviewTab
            stats={stats}
            aiUsageTrends={aiUsageTrends}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'users' && (
          <AdminUsersTab onRefreshStats={refreshAllStats} />
        )}
        {activeTab === 'curriculum' && <AdminCurriculumTab />}
        {activeTab === 'books' && <AdminBooksTab />}
        {activeTab === 'questions' && <AdminQuestionsTab />}
        {activeTab === 'quizzes' && <AdminQuizzesTab />}
        {activeTab === 'exams' && <AdminExamsTab />}
        {activeTab === 'reports' && (
          <AdminReportsTab stats={stats} aiUsageTrends={aiUsageTrends} />
        )}
        {activeTab === 'backups' && <AdminBackupsTab />}
        {activeTab === 'security' && <AdminSecurityTab />}
        {activeTab === 'settings' && (
          <AdminSettingsTab onLockSession={handleLockSession} />
        )}
      </div>
    </div>
  );
};
