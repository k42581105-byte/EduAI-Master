import React, { useState } from 'react';
import {
  History,
  X,
  RotateCcw,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Clock,
  User,
  Layers,
} from 'lucide-react';
import { RecoveryLogRecord } from '../../../../../types';
import { BackupService } from '../../../../../services/backupService';
import { Button } from '../../../../common/Button';
import { Badge } from '../../../../common/Badge';

interface RecoveryLogsModalProps {
  onClose: () => void;
  onRollbackRequested?: (snapshotId: string) => void;
}

export const RecoveryLogsModal: React.FC<RecoveryLogsModalProps> = ({
  onClose,
  onRollbackRequested,
}) => {
  const [logs, setLogs] = useState<RecoveryLogRecord[]>(() => BackupService.getRecoveryLogs());
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [rollbackStatus, setRollbackStatus] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const handleRefresh = () => {
    setLogs(BackupService.getRecoveryLogs());
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all recovery audit logs?')) {
      BackupService.clearRecoveryLogs();
      setLogs([]);
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    const data = BackupService.exportRecoveryLogs(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduai-recovery-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExecuteRollback = (checkpointId: string) => {
    if (!checkpointId) return;
    if (
      window.confirm(
        `Are you sure you want to roll back the active database to safety checkpoint "${checkpointId}"?`
      )
    ) {
      setIsRollingBack(true);
      setRollbackStatus(null);
      setTimeout(() => {
        const res = BackupService.rollbackToSafetySnapshot(checkpointId, 'Principal Admin');
        setIsRollingBack(false);
        if (res.success) {
          setRollbackStatus(`Successfully rolled back state to checkpoint ${checkpointId}.`);
          handleRefresh();
          if (onRollbackRequested) onRollbackRequested(checkpointId);
        } else {
          setRollbackStatus(`Rollback failed: ${res.message}`);
        }
      }, 500);
    }
  };

  return (
    <div
      id="recovery-logs-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="recovery-logs-modal-card"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  State Recovery & Disaster Audit Logs
                </h3>
                <Badge variant="neutral" size="sm">
                  {logs.length} Recorded Runs
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete audit trail of all database restoration, diff verification, and emergency rollback events.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
              className="text-xs"
              icon={<Download className="w-3.5 h-3.5" />}
            >
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              className="text-xs"
              icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            >
              CSV
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {rollbackStatus && (
            <div
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                rollbackStatus.includes('Successfully')
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-700 dark:text-rose-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{rollbackStatus}</span>
            </div>
          )}

          {logs.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  No Recovery Logs Yet
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you execute state restores or rollback operations from verified snapshots, audit entries with full 6-point validation reports will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/40 dark:bg-slate-800/30 transition-colors"
                  >
                    {/* Log summary row */}
                    <div
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {log.status === 'success' ? (
                          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : log.status === 'rolled_back' ? (
                          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                            <RotateCcw className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                            <XCircle className="w-4 h-4" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {log.backupTitle}
                            </span>
                            <Badge
                              variant={
                                log.status === 'success'
                                  ? 'success'
                                  : log.status === 'rolled_back'
                                  ? 'warning'
                                  : 'danger'
                              }
                              size="sm"
                            >
                              {log.status === 'success'
                                ? 'RESTORE SUCCESS'
                                : log.status === 'rolled_back'
                                ? 'AUTO ROLLED BACK'
                                : 'FAILED'}
                            </Badge>
                            <Badge variant="neutral" size="sm">
                              {log.strategy.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.initiatedBy}
                            </span>
                            <span>•</span>
                            <span>{log.durationMs}ms duration</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5 animate-in fade-in">
                        {/* Pre-Restore Checkpoint info & Rollback Action */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[11px] text-slate-500">Safety Checkpoint ID</span>
                            <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                              {log.preRestoreSafetySnapshotId}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExecuteRollback(log.preRestoreSafetySnapshotId)}
                            disabled={isRollingBack}
                            className="text-xs border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            icon={<RotateCcw className="w-3.5 h-3.5" />}
                          >
                            Emergency Rollback to Checkpoint
                          </Button>
                        </div>

                        {/* Restored entity counts */}
                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                            Entities Restored
                          </span>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Notes</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {log.restoredCounts.notes || 0}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Quizzes</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {log.restoredCounts.quizzes || 0}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Exams</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {log.restoredCounts.exams || 0}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Questions</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {log.restoredCounts.adminQuestions || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Validation Checkpoints breakdown */}
                        {log.validationReport && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                                Post-Restore Health Checks
                              </span>
                              <Badge
                                variant={log.validationReport.status === 'healthy' ? 'success' : 'warning'}
                                size="sm"
                              >
                                {log.validationReport.status.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="space-y-1">
                              {log.validationReport.checks.map((chk) => (
                                <div
                                  key={chk.id}
                                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px] flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    {chk.passed ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    )}
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                      {chk.name}
                                    </span>
                                  </div>
                                  <span className="text-slate-500">{chk.details}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {log.errorMessage && (
                          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                            <span className="font-bold block">Error Diagnostic:</span>
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear Audit Logs
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="text-xs"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
