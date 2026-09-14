import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  ShieldCheck,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  Users,
  BookOpen,
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  ShieldAlert,
  Server,
  Activity,
  HardDrive,
  History,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  BackupMetadata,
  BackupScheduleConfig,
  BackupSystemStatus,
  BackupTriggerType,
  BackupContentCounts,
  BackupSnapshotPayload,
  PostRestoreValidationReport,
} from '../../../../types';
import { BackupService } from '../../../../services/backupService';
import { Card } from '../../../common/Card';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';
import { BackupInspectModal } from './backup/BackupInspectModal';
import { BackupRestoreModal } from './backup/BackupRestoreModal';
import { RecoveryLogsModal } from './backup/RecoveryLogsModal';
import { DatabaseIntegrityModal } from './backup/DatabaseIntegrityModal';

export const AdminBackupsTab: React.FC = () => {
  const [history, setHistory] = useState<BackupMetadata[]>([]);
  const [status, setStatus] = useState<BackupSystemStatus>(() => BackupService.getBackupSystemStatus());
  const [scheduleConfig, setScheduleConfig] = useState<BackupScheduleConfig>(() => BackupService.getScheduleConfig());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrigger, setFilterTrigger] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Modals & UI States
  const [inspectingBackup, setInspectingBackup] = useState<BackupMetadata | null>(null);
  const [restoringBackup, setRestoringBackup] = useState<BackupMetadata | null>(null);
  const [showRecoveryLogs, setShowRecoveryLogs] = useState(false);
  const [showIntegrityScanner, setShowIntegrityScanner] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reloadData = () => {
    BackupService.initialize();
    setHistory(BackupService.getBackupsHistory());
    setStatus(BackupService.getBackupSystemStatus());
    setScheduleConfig(BackupService.getScheduleConfig());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const showToast = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 5000);
  };

  // Create manual backup
  const handleCreateManualBackup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingBackup(true);

    setTimeout(() => {
      const res = BackupService.createBackup('manual', customTitle || undefined, customDescription || undefined);
      setIsCreatingBackup(false);
      setIsManualModalOpen(false);
      setCustomTitle('');
      setCustomDescription('');

      if (res.success && res.backup) {
        showToast(`Backup "${res.backup.title}" created & verified with zero credentials!`);
        reloadData();
      } else {
        showToast(`Error: ${res.error || 'Backup creation failed'}`);
      }
    }, 400);
  };

  // Delete backup
  const handleDeleteBackup = (backupId: string, title: string) => {
    if (window.confirm(`Are you sure you want to permanently delete backup "${title}"?`)) {
      const res = BackupService.deleteBackup(backupId);
      if (res.success) {
        showToast(`Backup "${title}" deleted.`);
        reloadData();
      } else {
        showToast(`Error: ${res.error}`);
      }
    }
  };

  // Export / Download
  const handleDownloadBackup = (backupId: string) => {
    const exported = BackupService.exportBackupAsJson(backupId);
    if (!exported) {
      showToast('Could not load backup payload for export.');
      return;
    }
    const blob = new Blob([exported.jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exported.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded sanitized snapshot: ${exported.filename}`);
  };

  // Verify backup payload directly
  const handleVerifyBackup = (backupId: string) => {
    const payload = BackupService.getBackupPayload(backupId);
    if (!payload) {
      showToast('Could not locate backup payload.');
      return;
    }
    const report = BackupService.verifyBackupPayload(payload);
    if (report.isValid) {
      showToast(`Snapshot verified healthy! CRC32: ${payload.metadata.checksum} • Zero secret leaks (${report.totalRecordsCount} records verified).`);
    } else {
      showToast(`Verification issue: ${report.errors.join('; ')}`);
    }
    reloadData();
  };

  // Handle schedule config update
  const handleUpdateSchedule = (updates: Partial<BackupScheduleConfig>) => {
    const updated = BackupService.saveScheduleConfig(updates);
    setScheduleConfig(updated);
    setStatus(BackupService.getBackupSystemStatus());
    showToast('Auto-backup schedule configuration updated.');
  };

  // Handle file import
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as BackupSnapshotPayload;
        const report = BackupService.verifyBackupPayload(parsed);

        if (!report.isValid) {
          showToast(`Uploaded backup failed verification: ${report.errors.join(', ')}`);
          return;
        }

        // If valid, open in restore modal
        setRestoringBackup(parsed.metadata);
      } catch (err: any) {
        showToast(`Invalid JSON backup file: ${err?.message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filter backups list
  const filteredHistory = history.filter((b) => {
    const matchQuery =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchTrigger = filterTrigger === 'All' || b.trigger === filterTrigger;
    const matchStatus = filterStatus === 'All' || b.verificationStatus === filterStatus;

    return matchQuery && matchTrigger && matchStatus;
  });

  const recoveryLogsCount = BackupService.getRecoveryLogs().length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Database Backup & Disaster Recovery Console
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              Zero-Trust Sanitized
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated scheduled snapshots, pre-restore safety checkpoints, live diff preview, and rollback protection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Recovery Audit Logs Button */}
          <Button
            variant="outline"
            size="sm"
            id="btn-open-recovery-logs"
            onClick={() => setShowRecoveryLogs(true)}
            icon={<History className="w-3.5 h-3.5 text-indigo-600" />}
            className="text-xs"
          >
            Recovery Logs ({recoveryLogsCount})
          </Button>

          {/* Database Health & Integrity Scanner Button */}
          <Button
            variant="outline"
            size="sm"
            id="btn-open-db-integrity-scanner"
            onClick={() => setShowIntegrityScanner(true)}
            icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
            className="text-xs"
          >
            Health Scanner
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept=".json"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Import Snapshot
          </Button>

          <Button
            variant="primary"
            size="sm"
            id="btn-create-backup-now"
            onClick={() => setIsManualModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isCreatingBackup}
          >
            Create Backup Now
          </Button>
        </div>
      </div>

      {/* KPI Cards: System Backup Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 space-y-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Last Backup
            </span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {status.lastBackupAt
              ? new Date(status.lastBackupAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'No Backups Yet'}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Badge
              variant={
                status.lastBackupStatus === 'verified'
                  ? 'success'
                  : status.lastBackupStatus === 'warning'
                  ? 'warning'
                  : 'neutral'
              }
              size="sm"
            >
              {status.lastBackupStatus === 'verified' ? 'Verified Safe' : status.lastBackupStatus}
            </Badge>
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Automated Schedule
            </span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
            {scheduleConfig.enabled ? scheduleConfig.frequency.replace('_', ' ') : 'Disabled'}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {scheduleConfig.nextScheduledBackupAt
              ? `Next: ${new Date(scheduleConfig.nextScheduledBackupAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Manual triggers only'}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Backup Archive
            </span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {status.totalBackupsCount} Snapshots
          </div>
          <div className="text-[11px] text-slate-500">
            Total footprint: <span className="font-semibold">{status.totalStorageSizeFormatted}</span>
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Database Integrity
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
            {status.healthScore}% Healthy
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
            {status.securityNotice}
          </div>
        </Card>
      </div>

      {/* Scheduled Backup Settings Drawer/Panel */}
      <Card className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Automated Snapshot Scheduler & Retention Policy
            </h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowScheduleConfig(!showScheduleConfig)}
            className="text-xs text-indigo-600 dark:text-indigo-400"
          >
            {showScheduleConfig ? 'Collapse Settings' : 'Configure Schedule'}
          </Button>
        </div>

        {showScheduleConfig && (
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Scheduler Status
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateSchedule({ enabled: !scheduleConfig.enabled })}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    scheduleConfig.enabled
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {scheduleConfig.enabled ? 'Active (Enabled)' : 'Disabled'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Execution Frequency
              </label>
              <select
                value={scheduleConfig.frequency}
                onChange={(e) =>
                  handleUpdateSchedule({
                    frequency: e.target.value as any,
                  })
                }
                disabled={!scheduleConfig.enabled}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="hourly">Hourly (Continuous Safeguard)</option>
                <option value="every_6_hours">Every 6 Hours</option>
                <option value="daily">Daily (Standard Production Recommendation)</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Snapshot Retention Cap
              </label>
              <select
                value={scheduleConfig.retentionCount}
                onChange={(e) =>
                  handleUpdateSchedule({
                    retentionCount: Number(e.target.value),
                  })
                }
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="5">Keep Last 5 Backups</option>
                <option value="10">Keep Last 10 Backups (Recommended)</option>
                <option value="20">Keep Last 20 Backups</option>
                <option value="50">Keep Last 50 Backups</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Backups Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search backup title, ID or scope..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterTrigger}
            onChange={(e) => setFilterTrigger(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="All">All Triggers</option>
            <option value="scheduled">Scheduled Auto</option>
            <option value="manual">Manual Admin</option>
            <option value="pre_update">Pre-Restore Checkpoints</option>
            <option value="system_checkpoint">System Checkpoints</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="verified">Verified Only</option>
            <option value="warning">Warnings</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={reloadData}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs shrink-0"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Backup History Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
              <tr>
                <th className="p-3.5 pl-4">Snapshot & ID</th>
                <th className="p-3.5">Trigger</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Size & Records</th>
                <th className="p-3.5">Integrity & Checksum</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold">No database backups match your filter criteria.</p>
                    <p className="text-[11px] mt-1">
                      Click &quot;Create Backup Now&quot; to capture a verified system snapshot.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((backup) => (
                  <tr
                    key={backup.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Snapshot Name */}
                    <td className="p-3.5 pl-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{backup.title}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {backup.id}
                      </div>
                    </td>

                    {/* Trigger */}
                    <td className="p-3.5">
                      <Badge
                        variant={
                          backup.trigger === 'scheduled'
                            ? 'info'
                            : backup.trigger === 'pre_update'
                            ? 'warning'
                            : backup.trigger === 'system_checkpoint'
                            ? 'neutral'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {backup.trigger.replace('_', ' ')}
                      </Badge>
                    </td>

                    {/* Timestamp */}
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {new Date(backup.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(backup.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Size & Partition Count */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {backup.sizeFormatted}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {backup.counts.totalRecords} records ({backup.counts.notes} notes, {backup.counts.curriculumBooks} books)
                      </div>
                    </td>

                    {/* Integrity & Verification */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            backup.verificationStatus === 'verified'
                              ? 'success'
                              : backup.verificationStatus === 'warning'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {backup.verificationStatus === 'verified' ? 'Verified Valid' : backup.verificationStatus}
                        </Badge>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px] mt-0.5">
                        CRC32: {backup.checksum}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectingBackup(backup)}
                          icon={<Eye className="w-3.5 h-3.5" />}
                          className="h-8 px-2 text-xs"
                          title="Inspect verification report & payload"
                        >
                          Inspect
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyBackup(backup.id)}
                          icon={<FileCheck className="w-3.5 h-3.5 text-emerald-600" />}
                          className="h-8 px-2 text-xs"
                          title="Run integrity check"
                        />

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadBackup(backup.id)}
                          icon={<Download className="w-3.5 h-3.5" />}
                          className="h-8 px-2 text-xs"
                          title="Export JSON snapshot"
                        />

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRestoringBackup(backup)}
                          icon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                          className="h-8 px-2 text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                          title="Restore database state"
                        >
                          Restore
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBackup(backup.id, backup.title)}
                          icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                          className="h-8 px-2 text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Delete snapshot"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Backup Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Create Manual Backup Snapshot
                </h3>
                <p className="text-xs text-slate-500">
                  Snapshot current state of users, curriculum & admin content
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateManualBackup} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Backup Title / Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pre-Exam Revision Snapshot"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Description / Purpose (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Backup taken before updating Class 10 Science question bank."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Zero-Credential Security Guarantee
                </div>
                <p>
                  All credentials, password hashes, and API keys are automatically stripped prior to checksum calculation and storage.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsManualModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isCreatingBackup}
                  icon={<Plus className={`w-3.5 h-3.5 ${isCreatingBackup ? 'animate-spin' : ''}`} />}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isCreatingBackup ? 'Capturing Snapshot...' : 'Generate & Verify'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snapshot Inspect Modal */}
      {inspectingBackup && (
        <BackupInspectModal
          backup={inspectingBackup}
          onClose={() => setInspectingBackup(null)}
          onRestoreClick={(b) => setRestoringBackup(b)}
        />
      )}

      {/* Safe State Recovery Modal */}
      {restoringBackup && (
        <BackupRestoreModal
          backup={restoringBackup}
          onClose={() => setRestoringBackup(null)}
          onRestoreSuccess={(counts, valReport) => {
            showToast(
              `State successfully restored! (Notes: ${counts.notes || 0}, Quizzes: ${counts.quizzes || 0}, Questions: ${counts.adminQuestions || 0}) • 6-Point validation: ${valReport?.status || 'HEALTHY'}`
            );
            reloadData();
          }}
          onViewRecoveryLogs={() => setShowRecoveryLogs(true)}
        />
      )}

      {/* Recovery Audit Logs Modal */}
      {showRecoveryLogs && (
        <RecoveryLogsModal
          onClose={() => setShowRecoveryLogs(false)}
          onRollbackRequested={(chkId) => {
            showToast(`Active state reverted to checkpoint ${chkId}.`);
            reloadData();
          }}
        />
      )}

      {/* Database Health & Integrity Scanner Modal */}
      {showIntegrityScanner && (
        <DatabaseIntegrityModal
          onClose={() => setShowIntegrityScanner(false)}
          onCreateSafetyBackup={() => {
            setIsManualModalOpen(true);
            setCustomTitle('Pre-Validation Safety Snapshot');
          }}
        />
      )}
    </div>
  );
};
