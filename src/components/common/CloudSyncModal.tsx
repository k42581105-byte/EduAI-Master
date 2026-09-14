import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Smartphone,
  Server,
  User,
  FileText,
  MessageSquare,
  Camera,
  HelpCircle,
  GraduationCap,
  Calendar,
  TrendingUp,
  Zap,
  Award,
  AlertTriangle,
  Sliders,
  Check,
  Info,
  Lock,
  ArrowRight
} from 'lucide-react';
import { CloudSyncService } from '../../services/cloudSyncService';
import { CloudSyncState, SyncCategoryItem } from '../../types';
import { Button } from './Button';
import { Badge } from './Badge';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal?: (mode: 'login' | 'signup') => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  profile: <User className="w-4 h-4 text-indigo-500" />,
  notes: <FileText className="w-4 h-4 text-blue-500" />,
  conversations: <MessageSquare className="w-4 h-4 text-emerald-500" />,
  scans: <Camera className="w-4 h-4 text-purple-500" />,
  quizzes: <HelpCircle className="w-4 h-4 text-amber-500" />,
  exams: <GraduationCap className="w-4 h-4 text-rose-500" />,
  studyPlans: <Calendar className="w-4 h-4 text-teal-500" />,
  progress: <TrendingUp className="w-4 h-4 text-cyan-500" />,
  xp: <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />,
  achievements: <Award className="w-4 h-4 text-yellow-500" />,
  mistakeBook: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  preferences: <Sliders className="w-4 h-4 text-slate-500" />,
};

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onOpenAuthModal,
}) => {
  const [syncState, setSyncState] = useState<CloudSyncState>(() => CloudSyncService.getSyncState());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    const handleSyncUpdate = (e: any) => {
      setSyncState(e.detail || CloudSyncService.getSyncState());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('eduai_cloud_sync_updated', handleSyncUpdate);
      return () => window.removeEventListener('eduai_cloud_sync_updated', handleSyncUpdate);
    }
  }, []);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await CloudSyncService.syncAllData('manual_modal_trigger');
      if (res.success) {
        setSyncFeedback({ text: 'All 12 learning collections synced securely with Cloud Storage.' });
      } else {
        setSyncFeedback({ text: res.message || 'Sync failed. Please check internet connection.', isError: true });
      }
    } catch (e: any) {
      setSyncFeedback({ text: e.message || 'Failed to complete cloud synchronization.', isError: true });
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncFeedback(null);
      }, 5000);
    }
  };

  const handleToggleAutoSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    CloudSyncService.setAutoSyncEnabled(e.target.checked);
  };

  const categories: SyncCategoryItem[] = Object.values(syncState.categories) as SyncCategoryItem[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Cloud Sync & Data Security
                <Badge variant={syncState.isOnline ? 'emerald' : 'amber'}>
                  {syncState.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-device synchronization across 12 learning modules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Active Account Status Banner */}
          {syncState.authenticatedUser ? (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {syncState.authenticatedUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {syncState.authenticatedUser.displayName}
                    </p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      Isolated Tenant
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {syncState.authenticatedUser.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-indigo-200/40 dark:border-indigo-800/40">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Account-Separated Encrypted Storage</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Guest Mode (Local Storage Only)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sign in to sync your study notes, quizzes, and XP across your phone, tablet, and PC.
                  </p>
                </div>
              </div>

              {onOpenAuthModal && (
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal('login');
                  }}
                >
                  <span>Sign In to Sync</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          )}

          {/* Sync Feedback Toast */}
          {syncFeedback && (
            <div
              className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in ${
                syncFeedback.isError
                  ? 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
              }`}
            >
              {syncFeedback.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{syncFeedback.text}</span>
            </div>
          )}

          {/* 12 Synced Collections Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Synchronized Collections (12 Categories)
              </h4>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Safe Conflict Resolution Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                      {CATEGORY_ICONS[cat.key] || <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {cat.label}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {cat.count} {cat.key === 'xp' ? 'XP' : 'items'} • {cat.lastSynced}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {cat.status === 'synced' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" />
                        <span>Synced</span>
                      </span>
                    ) : cat.status === 'error' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                        <AlertCircle className="w-3 h-3" />
                        <span>Retry</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        Ready
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Settings & Security Details */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Background Auto-Sync
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically sync changes when online every 90 seconds
                </p>
              </div>

              <input
                type="checkbox"
                checked={syncState.autoSyncEnabled}
                onChange={handleToggleAutoSync}
                className="h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Device ID: {syncState.deviceId}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                <span>Last Synced: {syncState.lastSyncedAt ? new Date(syncState.lastSyncedAt).toLocaleString() : 'Never'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {syncState.authenticatedUser ? 'Cloud Sync active' : 'Sign in to enable Cloud backup'}
          </p>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>

            {syncState.authenticatedUser && (
              <Button
                variant="primary"
                size="sm"
                className="text-xs"
                disabled={isSyncing || !syncState.isOnline}
                onClick={handleManualSync}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
