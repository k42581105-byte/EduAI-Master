import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Globe,
  Bell,
  Shield,
  RotateCcw,
  Download,
  UploadCloud,
  Database,
  Check,
  AlertCircle,
  SlidersHorizontal,
  Volume2,
  Clock,
  Send,
  Cloud,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Eye,
  Trash2,
  Lock,
  Smartphone,
  LogOut,
  Info,
  Sliders,
  Sparkles,
  Camera,
  UserX,
  FileText,
} from 'lucide-react';
import { StudentProfile, UserRole } from '../../types';
import { StorageService } from '../../services/storageService';
import { NotificationService } from '../../services/notificationService';
import { CloudSyncService } from '../../services/cloudSyncService';
import { PrivacyService, PrivacyPreferences, ActiveDeviceSession } from '../../services/privacyService';
import { NotificationPreferencesModal } from '../notifications/NotificationPreferencesModal';
import { CloudSyncModal } from '../common/CloudSyncModal';
import { CloudSyncStatusBadge } from '../common/CloudSyncStatusBadge';
import { DataInventoryModal } from '../privacy/DataInventoryModal';
import { GranularDataErasureModal } from '../privacy/GranularDataErasureModal';
import { AccountDeletionModal } from '../privacy/AccountDeletionModal';
import { PrivacyPolicyModal } from '../privacy/PrivacyPolicyModal';
import { LanguageCode, SUPPORTED_LANGUAGES, getTranslation } from '../../i18n/translations';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface SettingsViewProps {
  profile: StudentProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  lang: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  onResetData: () => void;
  authUser?: { uid: string; email: string; displayName: string; role: UserRole } | null;
  onAccountDeleted?: () => void;
  onNavigate?: (section: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  darkMode,
  onToggleDarkMode,
  lang,
  onChangeLanguage,
  onResetData,
  authUser,
  onAccountDeleted,
  onNavigate,
}) => {
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isErasureModalOpen, setIsErasureModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState(() => NotificationService.getPreferences());
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPreferences>(() =>
    PrivacyService.getPrivacyPreferences()
  );
  const [activeSessions, setActiveSessions] = useState<ActiveDeviceSession[]>(() =>
    PrivacyService.getActiveSessions()
  );
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshNotifPrefs = () => {
    setNotifPrefs(NotificationService.getPreferences());
  };

  const handleUpdatePrivacyPref = (key: keyof PrivacyPreferences, val: any) => {
    const updated = PrivacyService.savePrivacyPreferences({ [key]: val });
    setPrivacyPrefs(updated);
    setBackupMessage({ text: 'Privacy preferences updated.' });
    setTimeout(() => setBackupMessage(null), 3000);
  };

  const handleSignOutOtherSessions = () => {
    const res = PrivacyService.signOutOtherSessions();
    if (res.success) {
      setActiveSessions(PrivacyService.getActiveSessions());
      setSessionMessage('Successfully signed out from all other active device sessions.');
      setTimeout(() => setSessionMessage(null), 4000);
    }
  };

  const handleExportBackup = () => {
    try {
      const jsonStr = StorageService.exportAllDataJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eduai_master_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupMessage({ text: 'Backup downloaded successfully as JSON!' });
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (err: any) {
      setBackupMessage({ text: `Backup export failed: ${err.message}`, isError: true });
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const result = StorageService.importDataJSON(content);
        if (result.success) {
          setBackupMessage({ text: result.message });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setBackupMessage({ text: result.message, isError: true });
        }
      }
    };
    reader.onerror = () => {
      setBackupMessage({ text: 'Failed to read backup file.', isError: true });
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            Settings & Privacy Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your account settings, data privacy, AI preferences, and notification controls
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-xs shrink-0"
          onClick={() => setIsPolicyModalOpen(true)}
          icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
        >
          Privacy Policy & Disclosures
        </Button>
      </div>

      {backupMessage && (
        <div
          className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
            backupMessage.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
          }`}
        >
          {backupMessage.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          ) : (
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span>{backupMessage.text}</span>
        </div>
      )}

      {sessionMessage && (
        <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{sessionMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* PRIVACY & STORED DATA TRANSPARENCY (NEW) */}
        <Card className="space-y-4 border-indigo-200 dark:border-indigo-900/60 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Stored Data & Privacy Transparency
            </h3>
            <Badge variant="primary" size="sm">
              GDPR & FERPA
            </Badge>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Inspect all stored learning records, profile items, quiz attempts, and AI transcripts. We practice strict data minimization with zero third-party ads or trackers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Inspect Stored Data</p>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  View itemized breakdown, storage footprint (KB), and export offline backups.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="text-xs mt-3 w-full"
                onClick={() => setIsInventoryModalOpen(true)}
                icon={<Eye className="w-3.5 h-3.5" />}
              >
                View Stored Data & Export
              </Button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Delete Saved Content</p>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Selectively erase AI chat history, photo scans, notes, or quiz attempts.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs mt-3 w-full hover:border-rose-300 hover:text-rose-600"
                onClick={() => setIsErasureModalOpen(true)}
                icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              >
                Manage Saved Content
              </Button>
            </div>
          </div>
        </Card>

        {/* AI & DATA PREFERENCES (NEW) */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              AI & Data Privacy Preferences
            </h3>
            <span className="text-[11px] text-slate-400">Fine-grained control</span>
          </div>

          <div className="space-y-3">
            {/* AI Personalization */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5 max-w-[80%]">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  AI Context Personalization
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Allow AI tutor to reference your weak topics and quiz history to tailor pedagogical hints and difficulty.
                </p>
              </div>

              <button
                onClick={() =>
                  handleUpdatePrivacyPref(
                    'aiContextPersonalization',
                    !privacyPrefs.aiContextPersonalization
                  )
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  privacyPrefs.aiContextPersonalization ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    privacyPrefs.aiContextPersonalization ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Ephemeral Photo Upload Mode */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5 max-w-[80%]">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-purple-500" />
                  Ephemeral Photo Solver Mode
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Do not permanently store uploaded images. Photos are processed in-memory and immediately discarded after solving.
                </p>
              </div>

              <button
                onClick={() =>
                  handleUpdatePrivacyPref('ephemeralPhotoUpload', !privacyPrefs.ephemeralPhotoUpload)
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  privacyPrefs.ephemeralPhotoUpload ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    privacyPrefs.ephemeralPhotoUpload ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Diagnostic Telemetry Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5 max-w-[80%]">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  Anonymous Diagnostics & Telemetry
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Share anonymous error reports to help diagnose crash scenarios. Zero personal or identifiable data is collected.
                </p>
              </div>

              <button
                onClick={() =>
                  handleUpdatePrivacyPref('analyticsTelemetry', !privacyPrefs.analyticsTelemetry)
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  privacyPrefs.analyticsTelemetry ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    privacyPrefs.analyticsTelemetry ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* MULTI-DEVICE SESSIONS & REMOTE SIGN-OUT (NEW) */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Active Device Sessions
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Zero-Trust Active</span>
          </div>

          <div className="space-y-2.5">
            {activeSessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-xs text-slate-700 dark:text-slate-200">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {sess.deviceName} • {sess.browser}
                      </p>
                      {sess.isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {sess.ipPlaceholder} • {sess.lastActive}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-1 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleSignOutOtherSessions}
              icon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
            >
              Sign Out From All Other Sessions
            </Button>
          </div>
        </Card>

        {/* Appearance Settings */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {darkMode ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
            Appearance & Visual Theme
          </h3>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dark Mode Canvas</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Switch between high-contrast light theme and eye-safe dark theme
              </p>
            </div>

            <button
              onClick={onToggleDarkMode}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                darkMode ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              aria-label="Toggle dark mode"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Language & Regional Settings */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            {getTranslation(lang, 'languageSettings')}
          </h3>

          <div className="space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {getTranslation(lang, 'languageSelect')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {getTranslation(lang, 'autoTranslateAi')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              {SUPPORTED_LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  disabled={!item.isAvailable}
                  onClick={() => onChangeLanguage(item.code)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    lang === item.code
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 shadow-xs'
                      : item.isAvailable
                      ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30 text-slate-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.flag}</span>
                    <div className="text-left">
                      <p>{item.nativeLabel}</p>
                      {!item.isAvailable && (
                        <span className="text-[10px] font-normal text-slate-400">Coming soon</span>
                      )}
                    </div>
                  </div>
                  {lang === item.code && (
                    <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Study Reminders & Notification Preferences */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Study Reminders & Notification Center
            </h3>
            <button
              onClick={() => setIsPrefsModalOpen(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Customize Times</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Daily Reminder Schedule</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Goal: {notifPrefs.reminderTimes.morningGoalTime} • Rev: {notifPrefs.reminderTimes.eveningRevisionTime} • Streak: {notifPrefs.reminderTimes.nightStreakTime}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Alert Sounds & Chimes</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {notifPrefs.soundEnabled ? 'Harmonic chime enabled' : 'Alert sounds muted'}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  NotificationService.playNotificationSound();
                }}
              >
                Test Sound
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage all 10 notification categories (Study goals, tasks, spaced revision, upcoming exams, streak protection, achievements, teacher assignments & parent reports).
            </p>

            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto text-xs shrink-0"
              onClick={() => setIsPrefsModalOpen(true)}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              Open Notification Preferences
            </Button>
          </div>
        </Card>

        {/* Cloud Sync & Multi-Device Persistence */}
        <Card className="space-y-4 border-indigo-200 dark:border-indigo-900/60">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cloud className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Secure Cloud Synchronization & Multi-Device Backup
            </h3>
            <CloudSyncStatusBadge onOpenModal={() => setIsCloudSyncModalOpen(true)} />
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  12 Learning Collections Synchronized
                </p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Syncs Profile, Notes, Chats, Scans, Quizzes, Mock Exams, Study Plans, Weak Topics, XP, Badges, Mistake Book & Preferences safely between devices.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                className="text-xs"
                onClick={() => setIsCloudSyncModalOpen(true)}
              >
                <span>Manage Cloud Sync</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Data Backup & Restore Architecture */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-600" />
            Data Backup & Export Architecture
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Export Local Backup</h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Download all saved notes, quiz scores, exam papers, and streak progress as a JSON backup file.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs mt-1"
                onClick={handleExportBackup}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Export Backup JSON
              </Button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Import Backup File</h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Restore study history, XP, and profile statistics from a previously exported JSON backup.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportBackup}
                accept=".json,application/json"
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs mt-1"
                onClick={() => fileInputRef.current?.click()}
                icon={<UploadCloud className="w-3.5 h-3.5" />}
              >
                Import JSON File
              </Button>
            </div>
          </div>
        </Card>

        {/* ACCOUNT SETTINGS & PROFILE ACCESS */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Account Settings & Credentials
            </h3>
            {authUser ? (
              <Badge variant="primary" size="sm">
                Authenticated ({authUser.role})
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                Guest Mode
              </Badge>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {profile.name} • Class {profile.classLevel} ({profile.board})
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {authUser?.email ? `Linked account: ${authUser.email}` : 'Local profile stored on this device'}
              </p>
            </div>

            {onNavigate && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs shrink-0"
                onClick={() => onNavigate('profile')}
              >
                Edit Profile Details
              </Button>
            )}
          </div>
        </Card>

        {/* Danger Zone: Data Reset & Permanent Account Deletion */}
        <Card className="space-y-4 border-rose-200 dark:border-rose-950">
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Danger Zone: Data Reset & Account Erasure
          </h3>

          <div className="space-y-3">
            {/* Reset All Study Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Reset All Study Progress</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Resets XP, quiz history, saved notes, and restores default seed data
                </p>
              </div>

              {!resetConfirmed ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:border-rose-300 hover:text-rose-600 text-xs"
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  onClick={() => setResetConfirmed(true)}
                >
                  Reset Progress
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      onResetData();
                      setResetConfirmed(false);
                    }}
                  >
                    Confirm Reset
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setResetConfirmed(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Permanent Account Deletion (GDPR Right to Erasure) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-2xl bg-rose-100/40 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80">
              <div>
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-rose-600" />
                  Permanently Delete Account
                </p>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                  GDPR Article 17 Right to Erasure. Irrevocably destroys all profile records, cloud documents, and local database cache.
                </p>
              </div>

              <Button
                variant="danger"
                size="sm"
                className="text-xs shrink-0"
                onClick={() => setIsDeleteAccountModalOpen(true)}
                icon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* MODALS */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
      />

      <NotificationPreferencesModal
        isOpen={isPrefsModalOpen}
        onClose={() => {
          setIsPrefsModalOpen(false);
          refreshNotifPrefs();
        }}
        onPreferencesUpdated={refreshNotifPrefs}
      />

      <DataInventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
      />

      <GranularDataErasureModal
        isOpen={isErasureModalOpen}
        onClose={() => setIsErasureModalOpen(false)}
        userId={authUser?.uid}
        onContentDeleted={(msg) => {
          setBackupMessage({ text: msg });
          setTimeout(() => setBackupMessage(null), 4000);
        }}
      />

      <AccountDeletionModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        userEmail={authUser?.email}
        onAccountDeleted={() => {
          if (onAccountDeleted) {
            onAccountDeleted();
          } else {
            onResetData();
          }
          setBackupMessage({ text: 'Your account and all associated data have been permanently deleted.' });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }}
      />

      <PrivacyPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
      />
    </div>
  );
};

