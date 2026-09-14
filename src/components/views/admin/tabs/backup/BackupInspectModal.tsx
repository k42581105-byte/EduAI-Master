import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  Database,
  Layers,
  Users,
  BookOpen,
  Calendar,
  Lock,
  Cpu,
  X,
  Code
} from 'lucide-react';
import { BackupMetadata, BackupSnapshotPayload } from '../../../../../types';
import { BackupService } from '../../../../../services/backupService';
import { Button } from '../../../../common/Button';
import { Badge } from '../../../../common/Badge';

interface BackupInspectModalProps {
  backup: BackupMetadata;
  onClose: () => void;
  onRestoreClick?: (backup: BackupMetadata) => void;
}

export const BackupInspectModal: React.FC<BackupInspectModalProps> = ({
  backup,
  onClose,
  onRestoreClick,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'verification' | 'breakdown' | 'json'>('overview');
  const [payload, setPayload] = useState<BackupSnapshotPayload | null>(() =>
    BackupService.getBackupPayload(backup.id)
  );

  const report = backup.verificationReport || (payload ? BackupService.verifyBackupPayload(payload) : null);

  const handleDownload = () => {
    const exported = BackupService.exportBackupAsJson(backup.id);
    if (!exported) return;
    const blob = new Blob([exported.jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exported.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {backup.title}
                </h3>
                <Badge
                  variant={
                    backup.verificationStatus === 'verified'
                      ? 'emerald'
                      : backup.verificationStatus === 'warning'
                      ? 'amber'
                      : 'rose'
                  }
                >
                  {backup.verificationStatus === 'verified' ? 'Integrity Verified' : backup.verificationStatus}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Snapshot ID: <span className="font-mono">{backup.id}</span> • {new Date(backup.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-2 bg-slate-50/30 dark:bg-slate-800/30 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Snapshot Overview
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'verification'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verification Report
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'breakdown'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Data Partition Metrics
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Raw Payload JSON
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Snapshot Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">Total Size</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {backup.sizeFormatted}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">Trigger Type</div>
                  <div className="text-sm font-extrabold capitalize text-slate-900 dark:text-white mt-1">
                    {backup.trigger.replace('_', ' ')}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">Total Records</div>
                  <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                    {backup.counts.totalRecords}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">Integrity Checksum</div>
                  <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 truncate mt-1">
                    {backup.checksum}
                  </div>
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">
                    Zero-Credential Snapshot Certification
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    This backup was sanitized before archiving. All passwords, authentication tokens, API keys, and admin PINs have been permanently excluded in compliance with Zero-Trust database storage standards.
                  </p>
                </div>
              </div>

              {/* Description */}
              {backup.description && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Notes / Scope: </span>
                  <span className="text-slate-600 dark:text-slate-400">{backup.description}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'verification' && report && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Security & Health Summary
                  </span>
                  <Badge variant={report.isValid ? 'emerald' : 'rose'}>
                    {report.isValid ? 'Passed All Integrity Rules' : 'Errors Detected'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {report.summaryMessage}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Credentials Stripped</span>
                  {report.credentialsStripped ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Certified Safe
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-bold text-rose-600">
                      <XCircle className="w-4 h-4" /> Risk Detected
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Schema Validation</span>
                  {report.schemaValid ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Schema Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-bold text-rose-600">
                      <XCircle className="w-4 h-4" /> Malformed
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Checksum Integrity</span>
                  {report.checksumMatched ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Hash Match
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-bold text-amber-600">
                      <AlertTriangle className="w-4 h-4" /> Unmatched
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Validation Timestamp</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {new Date(report.checkedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {report.warnings.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs space-y-1.5">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Advisory Warnings ({report.warnings.length})
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300 pl-1">
                    {report.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-500">User Profiles</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {backup.counts.profiles}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-500">Revision Notes</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {backup.counts.notes}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-500">AI Conversations</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {backup.counts.conversations}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-500">Quizzes & Mock Exams</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {backup.counts.quizzes + backup.counts.exams}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-500">Mistake Book (Weak Topics)</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {backup.counts.weakTopics}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-500">Curriculum Textbooks</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {backup.counts.curriculumBooks}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-500">Chapters & Topics</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {backup.counts.curriculumChapters} / {backup.counts.curriculumTopics}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-500">Admin Question Bank</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {backup.counts.adminQuestions}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-500">Security Audit Logs</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {backup.counts.adminAuditLogs}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Sanitized Payload Preview (truncated for display)</span>
                <button
                  onClick={handleDownload}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Download Full JSON
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] max-h-72 overflow-auto whitespace-pre-wrap border border-slate-800">
                {payload ? JSON.stringify(payload, null, 2) : 'Payload not loaded'}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            icon={<Download className="w-4 h-4" />}
            className="text-xs"
          >
            Export Backup JSON
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
            {onRestoreClick && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onRestoreClick(backup);
                }}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                icon={<Database className="w-4 h-4" />}
              >
                Restore from Snapshot
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
