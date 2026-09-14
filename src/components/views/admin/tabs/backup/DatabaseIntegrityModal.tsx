import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Activity,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';
import { PostRestoreValidationReport } from '../../../../../types';
import { BackupService } from '../../../../../services/backupService';
import { Button } from '../../../../common/Button';
import { Badge } from '../../../../common/Badge';

interface DatabaseIntegrityModalProps {
  onClose: () => void;
  onCreateSafetyBackup?: () => void;
}

export const DatabaseIntegrityModal: React.FC<DatabaseIntegrityModalProps> = ({
  onClose,
  onCreateSafetyBackup,
}) => {
  const [report, setReport] = useState<PostRestoreValidationReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const res = BackupService.validateActiveDatabaseIntegrity();
      setReport(res);
      setIsScanning(false);
    }, 450);
  };

  useEffect(() => {
    runScan();
  }, []);

  return (
    <div
      id="db-integrity-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="db-integrity-modal-card"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Database Health & Integrity Scanner
                </h3>
                {report && (
                  <Badge
                    variant={
                      report.status === 'healthy'
                        ? 'success'
                        : report.status === 'warning'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {report.status.toUpperCase()}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audits schema consistency, relational integrity, foreign key references, and secret sanitization across all active storage partitions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {isScanning ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-200 dark:border-emerald-900 border-t-emerald-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Scanning Active Database Partitions...
                </h4>
                <p className="text-xs text-slate-500">
                  Checking entity schemas, question payloads, relational links, and token safeguards.
                </p>
              </div>
            </div>
          ) : report ? (
            <div className="space-y-5">
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Verified Entities
                  </span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {report.totalRecordsVerified}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Orphaned Links
                  </span>
                  <span
                    className={`text-base font-bold ${
                      report.missingRelationsDetected === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {report.missingRelationsDetected}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Quarantined Entities
                  </span>
                  <span
                    className={`text-base font-bold ${
                      report.corruptedEntitiesQuarantined === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {report.corruptedEntitiesQuarantined}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  report.status === 'healthy'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                    : report.status === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                }`}
              >
                {report.status === 'healthy' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-bold">
                    {report.status === 'healthy'
                      ? 'Database Integrity Optimal'
                      : 'Database Validation Warnings'}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{report.summary}</p>
                </div>
              </div>

              {/* Checks Checklist */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Validation Checkpoints Breakdown
                </label>
                <div className="space-y-2">
                  {report.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${
                            chk.passed
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {chk.passed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {chk.name}
                            </span>
                            <Badge variant="neutral" size="sm">
                              {chk.category.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {chk.details}
                          </p>
                        </div>
                      </div>

                      <Badge variant={chk.passed ? 'success' : 'danger'} size="sm">
                        {chk.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={runScan}
            disabled={isScanning}
            className="text-xs"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />}
          >
            Re-scan Integrity
          </Button>

          <div className="flex items-center gap-2">
            {onCreateSafetyBackup && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onCreateSafetyBackup();
                }}
                className="text-xs border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50"
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Create Safety Backup
              </Button>
            )}
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
