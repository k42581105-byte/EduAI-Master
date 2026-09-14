import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  Cpu,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  RotateCcw,
  Sparkles,
  Server,
  FileText
} from 'lucide-react';
import { AdminAuditLog, BackupSystemStatus } from '../../../../types';
import { AdminService } from '../../../../services/adminService';
import { BackupService } from '../../../../services/backupService';
import { Card } from '../../../common/Card';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';

interface AdminSettingsTabProps {
  onLockSession: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  onLockSession,
  onNavigateTab,
}) => {
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() =>
    AdminService.getAuditLogs()
  );
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [streamBufferMs, setStreamBufferMs] = useState(120);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupSystemStatus>(() =>
    BackupService.getBackupSystemStatus()
  );
  const [isBackingUp, setIsBackingUp] = useState(false);

  const showToast = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleQuickBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const res = BackupService.createBackup('manual', 'Settings Quick Snapshot');
      setIsBackingUp(false);
      if (res.success && res.backup) {
        setBackupStatus(BackupService.getBackupSystemStatus());
        setAuditLogs(AdminService.getAuditLogs());
        showToast(`Backup "${res.backup.title}" created & verified successfully!`);
      } else {
        showToast(`Error creating backup: ${res.error}`);
      }
    }, 400);
  };

  const handleSaveAiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    AdminService.logAudit(
      'Principal Admin',
      'AI Parameters Updated',
      'system',
      `Active AI Model set to ${aiModel}, stream buffer ${streamBufferMs}ms.`
    );
    setAuditLogs(AdminService.getAuditLogs());
    showToast('AI Model configuration updated.');
  };

  const handleToggleMaintenance = () => {
    const nextState = !maintenanceMode;
    setMaintenanceMode(nextState);
    AdminService.logAudit(
      'Principal Admin',
      nextState ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
      'system',
      nextState ? 'System set to read-only for scheduled updates.' : 'System restored to full production operation.',
      nextState ? 'warning' : 'success'
    );
    setAuditLogs(AdminService.getAuditLogs());
    showToast(nextState ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.');
  };

  return (
    <div className="space-y-6">
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
            <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            System Governance & Security Audit Trail
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure AI routing parameters, platform maintenance, and inspect immutable audit logs
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-xs text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          onClick={onLockSession}
          icon={<Lock className="w-3.5 h-3.5" />}
        >
          Lock Admin Session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* AI Model Architecture Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              AI Inference Configuration
            </h4>
            <Badge variant="indigo">Gemini 2.5 SDK</Badge>
          </div>

          <form onSubmit={handleSaveAiConfig} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Primary Multimodal Engine
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-medium"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Ultra Fast)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning & Complex Proofs)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Stream Buffer Latency (ms)
              </label>
              <input
                type="number"
                value={streamBufferMs}
                onChange={(e) => setStreamBufferMs(Number(e.target.value))}
                min={30}
                max={500}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="sm" className="text-xs">
                Save AI Settings
              </Button>
            </div>
          </form>
        </Card>

        {/* Platform Maintenance & Security Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Platform Controls & Safety
            </h4>
            <Badge variant={maintenanceMode ? 'amber' : 'emerald'}>
              {maintenanceMode ? 'Maintenance Active' : 'Operational'}
            </Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Scheduled Maintenance Mode</p>
                <p className="text-[11px] text-slate-500">Temporarily pauses heavy AI batch jobs</p>
              </div>
              <button
                type="button"
                onClick={handleToggleMaintenance}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                  maintenanceMode
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {maintenanceMode ? 'Turn Off' : 'Enable'}
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Master Admin PIN</p>
                <p className="text-[11px] text-slate-500 font-mono">admin2026 (Active)</p>
              </div>
              <Badge variant="indigo">Secured</Badge>
            </div>
          </div>
        </Card>

        {/* Database Disaster Recovery Card */}
        <Card className="p-5 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Database Backups & Disaster Safeguards
            </h4>
            <Badge variant="emerald">
              {backupStatus.lastBackupStatus === 'verified' ? 'Zero-Trust Verified' : 'Operational'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-400 text-[11px]">Last Backup Point</div>
              <div className="font-bold text-slate-900 dark:text-white">
                {backupStatus.lastBackupAt
                  ? new Date(backupStatus.lastBackupAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'None Recorded'}
              </div>
              <div className="text-[11px] text-slate-500">
                Archive: {backupStatus.totalBackupsCount} Snapshots ({backupStatus.totalStorageSizeFormatted})
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-400 text-[11px]">Automated Background Schedule</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                {backupStatus.isScheduleRunning ? 'Enabled & Healthy' : 'Disabled'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {backupStatus.nextScheduledAt
                  ? `Next run: ${new Date(backupStatus.nextScheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Manual execution only'}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="font-bold text-slate-400 text-[11px]">Security Standard</div>
                <div className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">
                  Passwords & API keys sanitized automatically
                </div>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleQuickBackup}
                  disabled={isBackingUp}
                  className="text-xs w-full justify-center"
                  icon={<Database className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />}
                >
                  {isBackingUp ? 'Creating...' : 'Trigger Backup Now'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Immutable Audit Trail & Administrative Logs
          </h4>
          <span className="text-[11px] font-semibold text-slate-400">
            {auditLogs.length} Events Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {log.adminName}
                  </td>
                  <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Success
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
