import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Lock, RefreshCw, LogOut } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onExtendSession: () => void;
  onLogout?: () => void;
  onLockSession?: () => void;
  remainingSeconds?: number;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  onExtendSession,
  onLogout,
  onLockSession,
  remainingSeconds = 60,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(remainingSeconds);

  const handleLockAction = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    } else if (typeof onLockSession === 'function') {
      onLockSession();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(remainingSeconds);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLockAction();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, remainingSeconds, onLogout, onLockSession]);

  if (!isOpen) return null;

  return (
    <div
      id="session-timeout-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in"
    >
      <div
        id="session-timeout-modal-card"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-900 shadow-2xl max-w-md w-full p-6 text-center space-y-5"
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="warning" size="sm">
              SESSION TIMEOUT WARNING
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Are you still learning?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            For data security and privacy, your active session will automatically lock in{' '}
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">
              {secondsLeft}s
            </span>{' '}
            due to inactivity.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-2 text-left">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All unsaved notes, progress & quiz states are preserved in your encrypted local store.</span>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLockAction}
            icon={<LogOut className="w-3.5 h-3.5" />}
            className="text-xs text-slate-500 hover:text-rose-600"
          >
            Lock Session Now
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onExtendSession}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
          >
            Stay Signed In
          </Button>
        </div>
      </div>
    </div>
  );
};
