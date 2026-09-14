import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { AdminService } from '../../../services/adminService';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';

interface AdminLockScreenProps {
  onUnlockSuccess: () => void;
  onCancel: () => void;
}

export const AdminLockScreen: React.FC<AdminLockScreenProps> = ({
  onUnlockSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Please enter your Admin Passcode or Security Key.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    setTimeout(() => {
      const res = AdminService.verifyAdminPin(pin);
      if (res.success) {
        onUnlockSuccess();
      } else {
        setErrorMsg(res.message || 'Invalid security key.');
        setIsVerifying(false);
      }
    }, 400);
  };

  const handleQuickDemoUnlock = () => {
    setPin('admin2026');
    const res = AdminService.verifyAdminPin('admin2026');
    if (res.success) {
      onUnlockSuccess();
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              EduAI Master Admin Console
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Protected Administrator Area • Authentication Required
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Admin Security Key / Master PIN</span>
              <span className="text-[10px] text-slate-400 font-normal">Role-Protected</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter security key (e.g. admin2026)"
                autoFocus
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center text-sm py-2.5 shadow-sm"
            disabled={isVerifying}
            icon={<Lock className="w-4 h-4" />}
          >
            {isVerifying ? 'Authenticating Admin Session...' : 'Authenticate & Open Console'}
          </Button>
        </form>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-200">
                Master Demo Access Key:
              </p>
              <p className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md inline-block">
                admin2026
              </p>
              <p className="text-[10px] text-slate-400">
                Authorized admins can manage users, curriculum, digital books, master question bank, quizzes, mock exams, and analytics.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-xs"
            >
              Back to App
            </Button>

            <button
              type="button"
              onClick={handleQuickDemoUnlock}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Unlock (Demo)</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
