import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Layers,
  Users,
  ShieldCheck,
  X,
  FileCheck,
  Eye,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Lock,
  RefreshCw,
  Clock,
  Check,
  History,
  FileSpreadsheet,
  AlertCircle,
  Undo2,
} from 'lucide-react';
import {
  BackupMetadata,
  BackupSnapshotPayload,
  BackupContentCounts,
  RestorePreviewAnalysis,
  PostRestoreValidationReport,
} from '../../../../../types';
import { BackupService } from '../../../../../services/backupService';
import { Button } from '../../../../common/Button';
import { Badge } from '../../../../common/Badge';

interface BackupRestoreModalProps {
  backup: BackupMetadata;
  onClose: () => void;
  onRestoreSuccess: (counts: Partial<BackupContentCounts>, validationReport?: PostRestoreValidationReport) => void;
  onViewRecoveryLogs?: () => void;
}

type RestoreStep = 'config' | 'preview' | 'confirm' | 'executing' | 'result';

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  backup,
  onClose,
  onRestoreSuccess,
  onViewRecoveryLogs,
}) => {
  const [currentStep, setCurrentStep] = useState<RestoreStep>('config');
  const [mode, setMode] = useState<'merge' | 'overwrite'>('merge');
  const [restoreUserData, setRestoreUserData] = useState(true);
  const [restoreCurriculum, setRestoreCurriculum] = useState(true);
  const [restoreAdminContent, setRestoreAdminContent] = useState(true);

  // Security confirmation state
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [understoodRollback, setUnderstoodRollback] = useState(false);

  // Execution states
  const [executingPhase, setExecutingPhase] = useState<string>('Initializing safe restore...');
  const [executingProgress, setExecutingProgress] = useState(10);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [restoredCounts, setRestoredCounts] = useState<Partial<BackupContentCounts>>({});
  const [validationReport, setValidationReport] = useState<PostRestoreValidationReport | null>(null);
  const [safetyCheckpointId, setSafetyCheckpointId] = useState<string | null>(null);
  const [rollbackTriggered, setRollbackTriggered] = useState(false);

  const payload: BackupSnapshotPayload | null = useMemo(() => {
    return BackupService.getBackupPayload(backup.id);
  }, [backup.id]);

  // Generate Restore Preview Analysis
  const previewAnalysis: RestorePreviewAnalysis | null = useMemo(() => {
    if (!payload) return null;
    return BackupService.generateRestorePreviewAnalysis(
      backup,
      payload,
      mode,
      {
        userData: restoreUserData,
        curriculum: restoreCurriculum,
        adminContent: restoreAdminContent,
      }
    );
  }, [backup, payload, mode, restoreUserData, restoreCurriculum, restoreAdminContent]);

  const isConfigValid = restoreUserData || restoreCurriculum || restoreAdminContent;

  const isConfirmationSatisfied = useMemo(() => {
    if (!understoodRollback) return false;
    if (mode === 'overwrite') {
      return confirmPhrase.trim().toUpperCase() === 'RESTORE DATABASE';
    }
    return true;
  }, [mode, confirmPhrase, understoodRollback]);

  const handleExecuteRestore = () => {
    if (!payload) {
      setError('Snapshot payload could not be loaded from local secure storage.');
      return;
    }

    setCurrentStep('executing');
    setExecutingProgress(20);
    setExecutingPhase('Creating Pre-Restore Safety Checkpoint...');
    setError(null);

    // Simulated multi-stage atomic restore execution with visual progress
    setTimeout(() => {
      setExecutingProgress(50);
      setExecutingPhase('Applying verified entity state & deduplicating records...');

      setTimeout(() => {
        setExecutingProgress(80);
        setExecutingPhase('Executing 6-Point Database Health & Integrity Verification...');

        setTimeout(() => {
          const result = BackupService.restoreFromBackup(
            payload,
            {
              mode,
              restoreUserData,
              restoreCurriculum,
              restoreAdminContent,
            },
            'Principal Admin'
          );

          setExecutingProgress(100);
          setRestoredCounts(result.restoredCounts);
          if (result.validationReport) {
            setValidationReport(result.validationReport);
          }
          if (result.preRestoreSafetySnapshotId) {
            setSafetyCheckpointId(result.preRestoreSafetySnapshotId);
          }
          setRollbackTriggered(Boolean(result.rollbackOccurred));

          if (result.success) {
            setCurrentStep('result');
            onRestoreSuccess(result.restoredCounts, result.validationReport);
          } else {
            setError(result.errors?.join('; ') || 'Database restoration encountered an integrity failure.');
            setCurrentStep('result');
          }
        }, 600);
      }, 500);
    }, 400);
  };

  return (
    <div
      id="backup-restore-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="backup-restore-modal-card"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent dark:from-amber-950/25 dark:via-indigo-950/25">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Safe Database State Recovery
                </h3>
                <Badge
                  variant={backup.verificationStatus === 'verified' ? 'success' : 'warning'}
                  size="sm"
                >
                  {backup.verificationStatus === 'verified' ? 'Verified Snapshot' : 'Unverified'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target: <span className="font-semibold text-slate-700 dark:text-slate-300">{backup.title}</span> (v{backup.schemaVersion})
              </p>
            </div>
          </div>

          {currentStep !== 'executing' && (
            <button
              id="btn-close-restore-modal"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {currentStep !== 'executing' && currentStep !== 'result' && (
          <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] ${
                  currentStep === 'config'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                1
              </span>
              <span className={currentStep === 'config' ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-slate-500'}>
                Scope & Strategy
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] ${
                  currentStep === 'preview'
                    ? 'bg-amber-600 text-white'
                    : currentStep === 'confirm'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                2
              </span>
              <span className={currentStep === 'preview' ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-slate-500'}>
                Live Diff Preview
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] ${
                  currentStep === 'confirm'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                3
              </span>
              <span className={currentStep === 'confirm' ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-slate-500'}>
                Safeguard & Confirm
              </span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* STEP 1: CONFIG & SCOPE */}
          {currentStep === 'config' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Snapshot details card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Snapshot Integrity & Checksum</span>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                    <span>CRC32: {backup.checksum}</span>
                    <span className="text-slate-400">•</span>
                    <span>{backup.sizeFormatted}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">
                    {backup.triggerType.toUpperCase()}
                  </Badge>
                  <Badge variant="success" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                    Sanitized
                  </Badge>
                </div>
              </div>

              {/* Restoration Strategy */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Select Recovery Strategy
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="btn-strategy-merge"
                    onClick={() => setMode('merge')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      mode === 'merge'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Safe Merge (Recommended)</span>
                      {mode === 'merge' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Preserves all active records. Only restores missing items and deduplicates keys. Zero data loss.
                    </p>
                  </button>

                  <button
                    type="button"
                    id="btn-strategy-overwrite"
                    onClick={() => setMode('overwrite')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      mode === 'overwrite'
                        ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Clean Overwrite</span>
                      {mode === 'overwrite' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Completely replaces selected partitions with the exact snapshot state. Reverts local changes.
                    </p>
                  </button>
                </div>
              </div>

              {/* Partitions to Restore */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Select Partitions to Restore
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={restoreUserData}
                      onChange={(e) => setRestoreUserData(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          User Profiles & Student Activity
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {backup.counts.notes} notes • {backup.counts.quizzes} quizzes • {backup.counts.exams} exams
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Includes student profile, XP history, study plans, mistake book, and saved AI conversations.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={restoreCurriculum}
                      onChange={(e) => setRestoreCurriculum(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          Curriculum Hierarchy & Structure
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {backup.counts.curriculumBooks} textbooks
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Includes academic sessions, boards, grades, subjects, textbooks, chapters, and topics.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={restoreAdminContent}
                      onChange={(e) => setRestoreAdminContent(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-indigo-600" />
                          Admin Question Repository & Exams
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {backup.counts.adminQuestions} questions • {backup.counts.adminExams} exams
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Includes published mock exams, diagnostic quiz templates, and verified question items.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: RESTORE PREVIEW & DIFF ANALYSIS */}
          {currentStep === 'preview' && previewAnalysis && (
            <div className="space-y-5 animate-in fade-in">
              {/* Risk Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  previewAnalysis.potentialDataLossRisk === 'high'
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                    : previewAnalysis.potentialDataLossRisk === 'moderate'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                {previewAnalysis.potentialDataLossRisk === 'high' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                ) : previewAnalysis.potentialDataLossRisk === 'moderate' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold">
                    Risk Assessment:{' '}
                    <span className="uppercase">{previewAnalysis.potentialDataLossRisk} RISK</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {previewAnalysis.riskWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Current Records</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {previewAnalysis.totalCurrentRecords}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-center">
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block">Backup Records</span>
                  <span className="text-base font-bold text-indigo-700 dark:text-indigo-300">
                    {previewAnalysis.totalBackupRecords}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">Projected Total</span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                    {previewAnalysis.totalProjectedRecords} ({previewAnalysis.netChange >= 0 ? `+${previewAnalysis.netChange}` : previewAnalysis.netChange})
                  </span>
                </div>
              </div>

              {/* Diff Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Entity Diff & Changes Breakdown
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Strategy: <strong className="capitalize">{previewAnalysis.strategy}</strong>
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Entity Type</th>
                        <th className="py-2.5 px-2 text-center">Active</th>
                        <th className="py-2.5 px-2 text-center">Backup</th>
                        <th className="py-2.5 px-2 text-center">Projected</th>
                        <th className="py-2.5 px-3 text-right">Change Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewAnalysis.items.map((item) => (
                        <tr key={item.entityKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {item.label}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400">
                            {item.currentCount}
                          </td>
                          <td className="py-2.5 px-2 text-center font-semibold text-indigo-600 dark:text-indigo-400">
                            {item.backupCount}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-900 dark:text-white">
                            {item.projectedCount}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {mode === 'overwrite' ? (
                              <Badge variant="warning" size="sm">
                                Overwrite ({item.overwritesCount})
                              </Badge>
                            ) : item.additionsCount > 0 ? (
                              <Badge variant="success" size="sm">
                                +{item.additionsCount} new
                              </Badge>
                            ) : (
                              <Badge variant="neutral" size="sm">
                                No change
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PRE-RESTORE SAFEGUARD & MANDATORY RECOVERY CONFIRMATION */}
          {currentStep === 'confirm' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Automated Safety Checkpoint Notice */}
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-indigo-950 dark:text-indigo-200">
                    Automated Pre-Restore Safety Checkpoint
                  </div>
                  <p className="text-indigo-900 dark:text-indigo-300 text-[11px] leading-relaxed">
                    Prior to executing any writes, EduAI Master will automatically take a complete snapshot of your current database state. In the unlikely event of any issue, you can perform an instant 1-click rollback.
                  </p>
                </div>
              </div>

              {/* Overwrite Confirmation Challenge */}
              {mode === 'overwrite' ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Destructive Action: Confirmation Phrase Required
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed">
                    To prevent accidental state replacement, please type <strong className="font-mono bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded text-rose-900 dark:text-rose-200">RESTORE DATABASE</strong> below:
                  </p>
                  <input
                    type="text"
                    id="input-restore-confirm-phrase"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    placeholder="RESTORE DATABASE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 font-mono text-xs text-rose-900 dark:text-rose-100 placeholder:text-rose-300 dark:placeholder:text-rose-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Safe Merge Confirmation
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Existing records will be retained. Non-duplicate records from snapshot &quot;{backup.title}&quot; will be merged into the active database.
                  </p>
                </div>
              )}

              {/* Mandatory Checklist */}
              <div className="space-y-2.5">
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    id="chk-confirm-rollback"
                    checked={understoodRollback}
                    onChange={(e) => setUnderstoodRollback(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-[11px] text-slate-700 dark:text-slate-300">
                    <span className="font-bold block">Authorization & Safety Confirmation</span>
                    I authorize this database restoration as an authenticated administrator. I understand a safety rollback snapshot will be captured before data application.
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* EXECUTING STATE */}
          {currentStep === 'executing' && (
            <div className="py-8 space-y-6 text-center animate-in fade-in">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-amber-200 dark:border-amber-900 border-t-amber-600 animate-spin" />
                <RotateCcw className="w-6 h-6 text-amber-600 absolute" />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Executing Safe State Recovery
                </h4>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {executingPhase}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${executingProgress}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Please do not close this window while atomic restoration and 6-point data validation take place.
              </p>
            </div>
          )}

          {/* RESULT & VALIDATION REPORT STATE */}
          {currentStep === 'result' && (
            <div className="space-y-5 animate-in fade-in">
              {rollbackTriggered ? (
                /* Rollback Occurred Card */
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-3">
                  <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-300 font-bold">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>Emergency Rollback Automatically Triggered</span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed">
                    Post-restore validation detected critical integrity errors. To safeguard production records, active state was automatically reverted to safety checkpoint{' '}
                    <strong className="font-mono">{safetyCheckpointId}</strong>.
                  </p>
                  {error && (
                    <div className="p-2.5 bg-rose-100/70 dark:bg-rose-900/50 rounded-xl text-[11px] font-mono text-rose-900 dark:text-rose-200">
                      {error}
                    </div>
                  )}
                </div>
              ) : (
                /* Success Card */
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Database Successfully Restored & Verified</span>
                    </div>
                    <Badge variant="success" size="sm">
                      HEALTHY
                    </Badge>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    Snapshot &quot;{backup.title}&quot; was successfully applied to active storage. All database validation checks passed with 0 errors.
                  </p>
                </div>
              )}

              {/* Pre-Restore Checkpoint Info */}
              {safetyCheckpointId && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500">Safety Rollback Checkpoint Captured</span>
                    <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {safetyCheckpointId}
                    </div>
                  </div>
                  <Badge variant="info" size="sm" icon={<History className="w-3 h-3" />}>
                    Safe Checkpoint Saved
                  </Badge>
                </div>
              )}

              {/* Post-Restore 6-Point Data Validation Checks */}
              {validationReport && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Post-Restore Integrity Validation Report
                    </label>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {validationReport.totalRecordsVerified} entities checked
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {validationReport.checks.map((chk) => (
                      <div
                        key={chk.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          chk.passed
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {chk.passed ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {chk.name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {chk.details}
                            </span>
                          </div>
                        </div>
                        <Badge variant={chk.passed ? 'success' : 'danger'} size="sm">
                          {chk.passed ? 'PASSED' : 'FAILED'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          {currentStep === 'config' && (
            <>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                id="btn-next-to-preview"
                onClick={() => setCurrentStep('preview')}
                disabled={!isConfigValid}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                icon={<Eye className="w-3.5 h-3.5" />}
              >
                View Diff Preview
              </Button>
            </>
          )}

          {currentStep === 'preview' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep('config')}
                className="text-xs"
              >
                Back to Scope
              </Button>
              <Button
                variant="primary"
                size="sm"
                id="btn-next-to-confirm"
                onClick={() => setCurrentStep('confirm')}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
              >
                Proceed to Confirmation
              </Button>
            </>
          )}

          {currentStep === 'confirm' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep('preview')}
                className="text-xs"
              >
                Back to Preview
              </Button>
              <Button
                variant="primary"
                size="sm"
                id="btn-execute-restore"
                onClick={handleExecuteRestore}
                disabled={!isConfirmationSatisfied}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Confirm & Execute Safe Restore
              </Button>
            </>
          )}

          {currentStep === 'result' && (
            <div className="w-full flex items-center justify-between">
              {onViewRecoveryLogs && (
                <Button
                  variant="outline"
                  size="sm"
                  id="btn-modal-view-logs"
                  onClick={() => {
                    onClose();
                    onViewRecoveryLogs();
                  }}
                  className="text-xs"
                  icon={<History className="w-3.5 h-3.5" />}
                >
                  View Recovery Audit Logs
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                id="btn-finish-restore"
                onClick={onClose}
                className="text-xs ml-auto bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
