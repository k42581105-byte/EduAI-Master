import React, { useState } from 'react';
import { User, Edit3, Award, Flame, BookOpen, Target, Check, X, Cloud, ShieldCheck, ArrowRight } from 'lucide-react';
import { StudentProfile, ClassLevel, BoardType, MediumType } from '../../types';
import { StorageService } from '../../services/storageService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { CloudSyncStatusBadge } from '../common/CloudSyncStatusBadge';
import { CloudSyncModal } from '../common/CloudSyncModal';

interface ProfileViewProps {
  profile: StudentProfile;
  onUpdateProfile: (updated: StudentProfile) => void;
  onNavigate?: (section: any) => void;
  lang?: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdateProfile, onNavigate, lang }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [classLevel, setClassLevel] = useState<ClassLevel>(profile.classLevel);
  const [board, setBoard] = useState<BoardType>(profile.board);
  const [medium, setMedium] = useState<MediumType>(profile.medium);
  const [dailyXpGoal, setDailyXpGoal] = useState(profile.dailyXpGoal);

  const handleSave = () => {
    const updated: StudentProfile = {
      ...profile,
      name,
      classLevel,
      board,
      medium,
      dailyXpGoal,
    };
    StorageService.saveProfile(updated);
    onUpdateProfile(updated);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Student Profile
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your personal profile, board preferences, and daily goals
          </p>
        </div>

        <Button variant="outline" icon={<Edit3 className="h-4 w-4" />} onClick={() => setIsEditing(true)}>
          Edit Profile
        </Button>
      </div>

      {/* Main Profile Info Card */}
      <Card className="flex flex-col sm:flex-row items-center gap-6 border-indigo-200 p-6">
        <div className="h-20 w-20 overflow-hidden rounded-3xl border-2 border-indigo-500 shadow-md shrink-0">
          <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {profile.name}
            </h3>
            <Badge variant="indigo">Class {profile.classLevel}</Badge>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {profile.board} Board • {profile.medium} Medium
          </p>

          <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
            <Badge variant="amber" icon={<Flame className="h-3.5 w-3.5" />}>
              {profile.streakDays} Day Streak
            </Badge>
            <Badge variant="purple" icon={<Award className="h-3.5 w-3.5" />}>
              Level {profile.level} ({profile.xp} XP)
            </Badge>
          </div>
        </div>
      </Card>

      {/* Learning Goals */}
      <Card className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-600" />
          Active Learning Targets
        </h4>

        <div className="space-y-2">
          {profile.learningGoals.map((g, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2"
            >
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{g}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Cloud Sync & Multi-Device Persistence Card */}
      <Card className="space-y-3 border-indigo-200 dark:border-indigo-900/60">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cloud className="h-4 w-4 text-indigo-600" />
            Multi-Device Cloud Sync
          </h4>
          <CloudSyncStatusBadge onOpenModal={() => setIsCloudSyncModalOpen(true)} />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your profile, notes, AI chat history, quiz attempts, and streak are protected with account-separated cloud synchronization.
        </p>

        <div className="pt-1 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            12 Learning Datastores Synchronized
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setIsCloudSyncModalOpen(true)}
          >
            <span>Sync Details</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </Card>

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
      />

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Student Details
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Class / Grade
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {['1','2','3','4','5','6','7','8','9','10','11','12'].map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Education Board
                </label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value as BoardType)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Boards">State Boards</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Medium of Instruction
                </label>
                <select
                  value={medium}
                  onChange={(e) => setMedium(e.target.value as MediumType)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Hinglish">Hinglish</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  Save Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
