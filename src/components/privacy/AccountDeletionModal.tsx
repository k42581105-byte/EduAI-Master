import React, { useState } from 'react';
import { Trash2, AlertOctagon, X, Check, ShieldAlert, Lock, UserX } from 'lucide-react';
import { PrivacyService } from '../../services/privacyService';
import { Button } from '../common/Button';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onAccountDeleted: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onAccountDeleted,
}) => {
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetPhrase = 'DELETE MY ACCOUNT';

  const handleDeleteAccount = async () => {
    if (confirmPhrase.trim() !== targetPhrase) {
      setErrorMessage(`Please type exactly "${targetPhrase}" to confirm.`);
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await PrivacyService.deleteAccountAndAllData(userEmail);
      if (res.success) {
        onAccountDeleted();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An error occurred during account deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-300">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-900 dark:text-rose-100">
                Permanently Delete Account
              </h3>
              <p className="text-xs text-rose-600/80 dark:text-rose-400">
                GDPR Right to Erasure & Complete Account Purge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/70 space-y-2">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Warning: This action is permanent and irreversible
            </h4>
            <p className="text-xs text-rose-700/90 dark:text-rose-300/90 leading-relaxed">
              Deleting your account will immediately and irrevocably destroy:
            </p>
            <ul className="list-disc list-inside text-[11px] text-rose-700/80 dark:text-rose-300/80 space-y-1 pl-1">
              <li>Your student login profile and authenticated credentials</li>
              <li>All notes, formula cheatsheets, and personalized study plans</li>
              <li>Complete quiz attempt logs, mock exam results, and mistake books</li>
              <li>AI tutor conversation transcripts and photo solver history</li>
              <li>Multi-device synchronization records across cloud databases</li>
            </ul>
          </div>

          {userEmail && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Target Account:</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{userEmail}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              To confirm, type <span className="font-mono text-rose-600 font-bold">{targetPhrase}</span> below:
            </label>
            <input
              type="text"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder={targetPhrase}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 flex items-center justify-between">
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="danger"
            size="sm"
            className="text-xs"
            disabled={confirmPhrase.trim() !== targetPhrase || isDeleting}
            onClick={handleDeleteAccount}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            {isDeleting ? 'Deleting Account...' : 'Permanently Delete Account'}
          </Button>
        </div>
      </div>
    </div>
  );
};
