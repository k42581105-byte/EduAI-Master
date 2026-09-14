import React from 'react';
import { Shield, ShieldCheck, Lock, EyeOff, UserCheck, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Student Privacy & Data Protection Policy
                <Badge variant="success" size="sm">
                  FERPA & COPPA Aligned
                </Badge>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Our strict commitments to student data safety, minimization, and privacy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {/* Key Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <EyeOff className="w-4 h-4" />
                <span>Data Minimization</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                We only collect data strictly necessary for personalized learning. We never collect financial info, location tracking, or device identifiers.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Shield className="w-4 h-4" />
                <span>Zero Ads & Third-Party Trackers</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                EduAI Master contains no commercial advertisements, no behavioral retargeting, and zero data brokering. Student data is never sold.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                <Lock className="w-4 h-4" />
                <span>Ephemeral Image Processing</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Uploaded problem photos are analyzed in-memory. Thumbnails are not permanently stored unless explicitly saved by the student.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                <UserCheck className="w-4 h-4" />
                <span>Role-Isolated Access</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Parents and Teachers only see aggregate academic progress. Private chats, journals, and credentials cannot be altered or accessed without authorization.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              1. Information We Collect
            </h4>
            <p>
              When you use EduAI Master, we store your self-selected grade level, board curriculum, selected subjects, practice quiz answers, and study notes. We use this exclusively to adapt AI difficulty, recommend revision topics, and track study streaks.
            </p>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              2. Image & Photo Solver Privacy
            </h4>
            <p>
              When you snap or upload a picture in Photo Solver, the image is passed securely to the optical character recognition model to extract math formulas and questions. The full raw image is immediately discarded from permanent storage; only the lightweight question text is indexed in your history.
            </p>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              3. Encryption & Storage Security
            </h4>
            <p>
              All communication between your device, the Express backend proxy, and Firestore database is protected via TLS 1.3 encryption. Data stored in Firestore is encrypted at rest using AES-256 standards.
            </p>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              4. Your Right to Portability & Erasure
            </h4>
            <p>
              In full compliance with GDPR Article 17 and Article 20, you can export your complete educational record in JSON or CSV format at any time, or trigger instant irreversible deletion of your account and all data.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Last updated: August 2026 • Version 2.4 Security & Privacy Standard
          </span>

          <Button variant="primary" size="sm" className="text-xs" onClick={onClose}>
            Understood & Accept
          </Button>
        </div>
      </div>
    </div>
  );
};
