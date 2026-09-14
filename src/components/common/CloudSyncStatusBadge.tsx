import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { CloudSyncService } from '../../services/cloudSyncService';
import { CloudSyncState } from '../../types';

interface CloudSyncStatusBadgeProps {
  onOpenModal?: () => void;
  variant?: 'pill' | 'minimal' | 'card';
  className?: string;
}

export const CloudSyncStatusBadge: React.FC<CloudSyncStatusBadgeProps> = ({
  onOpenModal,
  variant = 'pill',
  className = '',
}) => {
  const [syncState, setSyncState] = useState<CloudSyncState>(() => CloudSyncService.getSyncState());

  useEffect(() => {
    const handleSyncUpdate = (e: any) => {
      setSyncState(e.detail || CloudSyncService.getSyncState());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('eduai_cloud_sync_updated', handleSyncUpdate);
      return () => window.removeEventListener('eduai_cloud_sync_updated', handleSyncUpdate);
    }
  }, []);

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Not yet synced';
    try {
      const date = new Date(isoString);
      const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSecs < 10) return 'Just now';
      if (diffSecs < 60) return `${diffSecs}s ago`;
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    } catch {
      return 'Recently';
    }
  };

  const getStatusDisplay = () => {
    if (!syncState.isOnline) {
      return {
        label: 'Offline',
        sub: 'Changes saved locally',
        icon: <CloudOff className="w-3.5 h-3.5 text-amber-500" />,
        badgeClass: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
        dotClass: 'bg-amber-500',
      };
    }

    switch (syncState.status) {
      case 'syncing':
        return {
          label: 'Syncing...',
          sub: 'Uploading to Cloud',
          icon: <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />,
          badgeClass: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300',
          dotClass: 'bg-indigo-500 animate-ping',
        };
      case 'error':
        return {
          label: 'Sync failed',
          sub: 'Tap to retry',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
          badgeClass: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
          dotClass: 'bg-rose-500',
        };
      case 'synced':
        return {
          label: 'Synced',
          sub: formatLastSync(syncState.lastSyncedAt),
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
          dotClass: 'bg-emerald-500',
        };
      default:
        return {
          label: syncState.authenticatedUser ? 'Cloud Ready' : 'Local Only',
          sub: syncState.authenticatedUser ? 'Ready to sync' : 'Sign in to sync',
          icon: <Cloud className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />,
          badgeClass: 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
          dotClass: 'bg-slate-400',
        };
    }
  };

  const status = getStatusDisplay();

  if (variant === 'minimal') {
    return (
      <button
        onClick={onOpenModal}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${status.badgeClass} ${className}`}
        title={`Cloud Sync Status: ${status.label} (${status.sub})`}
      >
        {status.icon}
        <span className="hidden sm:inline">{status.label}</span>
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <div
        onClick={onOpenModal}
        className={`cursor-pointer p-3.5 rounded-2xl border transition-all hover:shadow-xs ${status.badgeClass} ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-2xs">
              {status.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold">{status.label}</p>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
              </div>
              <p className="text-[11px] opacity-80">{status.sub}</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 opacity-60" />
        </div>
      </div>
    );
  }

  // Default 'pill'
  return (
    <button
      onClick={onOpenModal}
      className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border shadow-2xs transition-all active:scale-95 hover:opacity-90 ${status.badgeClass} ${className}`}
      title={`Cloud Sync: ${status.label} • ${status.sub} • Tap for details`}
    >
      <div className="flex items-center gap-1">
        {status.icon}
        <span className="font-bold text-[11px]">{status.label}</span>
      </div>
      {syncState.lastSyncedAt && (
        <span className="hidden xl:inline text-[10px] opacity-75 font-normal">
          • {formatLastSync(syncState.lastSyncedAt)}
        </span>
      )}
    </button>
  );
};
