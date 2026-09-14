import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Sparkles,
  Award,
  GraduationCap,
  BookMarked,
  CheckCircle2,
  Target,
  Camera,
  Calendar,
  Star,
  ShieldCheck,
  Lock,
  Unlock,
  Clock,
  ArrowRight,
  Zap,
  RefreshCw,
  Gift,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { StudentProfile, Achievement, LevelMilestone, ActivityLog } from '../../types';
import { StorageService } from '../../services/storageService';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface AchievementsViewProps {
  profile: StudentProfile;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ profile: initialProfile }) => {
  const [profile, setProfile] = useState<StudentProfile>(initialProfile);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [milestones, setMilestones] = useState<LevelMilestone[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<'badges' | 'milestones' | 'history' | 'rules'>('badges');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const loadData = () => {
    // Sync最新 stats and check achievement triggers
    StorageService.checkAndEvaluateAchievements();
    const prof = StorageService.getProfile();
    const achs = StorageService.getAchievements();
    const ms = StorageService.getLevelMilestones();
    const acts = StorageService.getActivities();

    setProfile(prof);
    setAchievements(achs);
    setMilestones(ms);
    setActivities(acts);
  };

  useEffect(() => {
    loadData();

    // Listen to gamification events
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('eduai_badge_unlocked', handleUpdate);
    window.addEventListener('eduai_level_up', handleUpdate);

    return () => {
      window.removeEventListener('eduai_badge_unlocked', handleUpdate);
      window.removeEventListener('eduai_level_up', handleUpdate);
    };
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="h-6 w-6 text-amber-500" />;
      case 'Sparkles':
        return <Sparkles className="h-6 w-6 text-indigo-500" />;
      case 'Award':
        return <Award className="h-6 w-6 text-purple-500" />;
      case 'GraduationCap':
        return <GraduationCap className="h-6 w-6 text-rose-500" />;
      case 'BookMarked':
        return <BookMarked className="h-6 w-6 text-emerald-500" />;
      case 'Target':
        return <Target className="h-6 w-6 text-blue-500" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="h-6 w-6 text-teal-500" />;
      case 'Camera':
        return <Camera className="h-6 w-6 text-cyan-500" />;
      case 'Calendar':
        return <Calendar className="h-6 w-6 text-violet-500" />;
      default:
        return <Trophy className="h-6 w-6 text-amber-500" />;
    }
  };

  const getRarityBadge = (rarity?: string) => {
    switch (rarity) {
      case 'Diamond':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-300/50">Diamond</span>;
      case 'Gold':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/50">Gold</span>;
      case 'Silver':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/50">Silver</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-300/50">Bronze</span>;
    }
  };

  const handleClaimMilestone = (level: number) => {
    const res = StorageService.claimLevelMilestone(level);
    setClaimMessage(res.message);
    loadData();
    setTimeout(() => setClaimMessage(null), 4000);
  };

  // Filtering Badges
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const lockedCount = achievements.length - unlockedCount;
  const totalRewardXpEarned = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.rewardXp, 0);
  const overallCompletionPct = Math.round((unlockedCount / Math.max(1, achievements.length)) * 100);

  const filteredAchievements = achievements.filter((item) => {
    if (statusFilter === 'unlocked' && !item.unlocked) return false;
    if (statusFilter === 'locked' && item.unlocked) return false;
    if (categoryFilter !== 'all' && item.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    return true;
  });

  const categoriesList = ['all', 'Streak', 'Quiz', 'Exam', 'Notes', 'Solver', 'Planner', 'General'];

  // Current Level & Next Level calculations
  const nextLevelXp = profile.level * 150;
  const currentLevelStartXp = (profile.level - 1) * 150;
  const xpInCurrentLevel = profile.xp - currentLevelStartXp;
  const xpNeededForLevel = nextLevelXp - currentLevelStartXp;
  const levelProgressPct = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100)));

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-7 w-7 text-amber-500" />
            Gamification & Rewards Engine
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Earn fair XP, unlock milestone badges, and level up as you complete study tasks & practice tests
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Progress</span>
        </button>
      </div>

      {/* Level Summary Banner */}
      <Card className="relative overflow-hidden border-amber-200 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-6 shadow-xl">
        <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-amber-100 border border-white/30 uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Level {profile.level} Scholar</span>
            </div>
            <h3 className="text-3xl font-black tracking-tight">{profile.name}</h3>
            <p className="text-amber-100 text-xs sm:text-sm max-w-md">
              Current Streak: <strong className="text-white">{profile.streakDays} Days</strong> 🔥 • Total XP Earned: <strong className="text-white">{profile.xp} XP</strong>
            </p>
          </div>

          {/* Level Progress Circle / Bar */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[260px] space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>Level Progress</span>
              <span>{xpInCurrentLevel} / {xpNeededForLevel} XP ({levelProgressPct}%)</span>
            </div>
            <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-200 to-yellow-100 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${levelProgressPct}%` }}
              />
            </div>
            <div className="text-[11px] text-amber-100 text-right font-medium">
              +{nextLevelXp - profile.xp} XP needed for Level {profile.level + 1}
            </div>
          </div>
        </div>
      </Card>

      {/* Claim Notification Banner */}
      {claimMessage && (
        <div className="p-4 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-md flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <span>{claimMessage}</span>
          </div>
          <button onClick={() => setClaimMessage(null)} className="text-xs bg-black/20 px-2 py-1 rounded">Dismiss</button>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('badges')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'badges'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Badges & Achievements ({unlockedCount}/{achievements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'milestones'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Level Milestones & Rewards</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Achievement History</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Fair XP & Anti-Abuse Rules</span>
        </button>
      </div>

      {/* TAB 1: BADGES & ACHIEVEMENTS */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Unlocked Badges</span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {unlockedCount} / {achievements.length}
              </div>
            </Card>

            <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Locked Badges</span>
              <div className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
                {lockedCount}
              </div>
            </Card>

            <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Badge XP Earned</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                +{totalRewardXpEarned} XP
              </div>
            </Card>

            <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-900/40">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completion</span>
              <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {overallCompletionPct}%
              </div>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="p-4 space-y-3 bg-white dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Status:
                </span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All ({achievements.length})
                </button>
                <button
                  onClick={() => setStatusFilter('unlocked')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                    statusFilter === 'unlocked'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Unlocked ({unlockedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('locked')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                    statusFilter === 'locked'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Locked ({lockedCount})
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 capitalize ${
                      categoryFilter.toLowerCase() === cat.toLowerCase()
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <Trophy className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  No badges found matching current filters.
                </p>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredAchievements.map((item) => {
                const progressPct = Math.min(
                  100,
                  Math.round((item.progressCurrent / Math.max(1, item.progressTarget)) * 100)
                );

                return (
                  <Card
                    key={item.id}
                    className={`relative p-5 flex items-start gap-4 transition-all overflow-hidden ${
                      item.unlocked
                        ? 'border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 dark:border-amber-700/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 shadow-md'
                        : 'border-slate-200 bg-slate-50/60 opacity-80 dark:border-slate-800 dark:bg-slate-900/40'
                    }`}
                  >
                    {/* Badge Icon Box */}
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all ${
                          item.unlocked
                            ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700 shadow-md'
                            : 'bg-slate-200/80 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {getIcon(item.icon)}
                      </div>
                      {!item.unlocked && (
                        <div className="absolute -top-1 -right-1 bg-slate-700 text-white p-1 rounded-full shadow">
                          <Lock className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {item.title}
                            </h4>
                            {getRarityBadge(item.badgeRarity)}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          {item.unlocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/50">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              Unlocked
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              {item.progressCurrent}/{item.progressTarget}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Locked Progress Bar */}
                      {!item.unlocked && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>Progress Toward Unlock</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Reward Footer */}
                      <div className="pt-2 flex items-center justify-between text-[11px] font-semibold border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> Reward: +{item.rewardXp} XP
                        </span>
                        {item.unlocked && (
                          <span className="text-slate-400 text-[10px]">
                            {item.unlockDate ? `Unlocked ${item.unlockDate}` : `Unlocked ${item.unlockedAt || 'Recently'}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LEVEL MILESTONES & REWARDS */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border-indigo-200 dark:border-indigo-900/40">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Level Progression & Privileges Roadmap
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Reach higher levels to claim bonus XP rewards and unlock advanced AI learning capabilities
            </p>
          </Card>

          <div className="space-y-4">
            {milestones.map((ms) => {
              const isCurrentLevel = profile.level === ms.level;
              const canClaim = profile.level >= ms.level && !ms.claimed;

              return (
                <Card
                  key={ms.level}
                  className={`p-6 transition-all ${
                    isCurrentLevel
                      ? 'border-2 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-lg'
                      : ms.unlocked
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 opacity-60 dark:bg-slate-900/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Level Badge Circle */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 ${
                          ms.unlocked
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider">Lvl</span>
                        <span className="text-xl leading-none">{ms.level}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                            {ms.title}
                          </h4>
                          {isCurrentLevel && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white uppercase tracking-wider">
                              Current Rank
                            </span>
                          )}
                          {ms.claimed && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Claimed
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Required: {ms.requiredXp} Total XP • Reward: {ms.rewardTitle} (+{ms.rewardXpBonus} XP Bonus)
                        </p>

                        <div className="pt-2 flex flex-wrap gap-1.5">
                          {ms.perks.map((perk, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3 text-indigo-500" />
                              {perk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0 text-right">
                      {canClaim ? (
                        <button
                          onClick={() => handleClaimMilestone(ms.level)}
                          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Gift className="w-4 h-4" />
                          <span>Claim Reward (+{ms.rewardXpBonus} XP)</span>
                        </button>
                      ) : ms.claimed ? (
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Reward Claimed</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card className="p-6 bg-white dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Chronological Activity & Reward History
            </h3>

            {activities.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity logged yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                          {act.title}
                        </h5>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {act.details || 'Completed learning activity'} • {act.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg shrink-0">
                      +{act.xpEarned} XP
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: RULES */}
      {activeTab === 'rules' && (
        <Card className="p-6 space-y-6 bg-white dark:bg-slate-900">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Fair XP System & Abuse Prevention Protocol
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Our XP algorithms ensure meaningful learning progress with anti-farming safeguards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500" /> Practice Quiz XP Calculation
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                First-time quizzes grant XP proportional to your accuracy score (e.g., 90% score = 90 XP).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-blue-500" /> Quiz Retake Protection
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Retaking a quiz only awards bonus XP if you beat your previous best score, preventing repetitive farming.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-500" /> Photo Solver Daily Limit
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Photo solver awards +30 XP for up to 5 unique homework problems per day. Unlimited AI solving remains free!
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-emerald-500" /> Level Milestone Rules
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Levels advance every 150 XP. Milestone bonuses can be claimed once per level.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
