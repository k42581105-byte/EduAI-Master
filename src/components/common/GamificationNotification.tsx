import React, { useState, useEffect } from 'react';
import { Trophy, Award, Sparkles, Check, Flame, X, Star } from 'lucide-react';
import { Achievement } from '../../types';

export const GamificationNotification: React.FC = () => {
  const [notification, setNotification] = useState<{
    type: 'badge' | 'level';
    badge?: Achievement;
    level?: number;
    xp?: number;
  } | null>(null);

  useEffect(() => {
    const handleBadgeUnlocked = (e: any) => {
      const badge: Achievement = e.detail?.badge;
      if (badge) {
        setNotification({
          type: 'badge',
          badge,
        });
      }
    };

    const handleLevelUp = (e: any) => {
      const level: number = e.detail?.newLevel;
      const xp: number = e.detail?.newXp;
      if (level) {
        setNotification({
          type: 'level',
          level,
          xp,
        });
      }
    };

    window.addEventListener('eduai_badge_unlocked', handleBadgeUnlocked);
    window.addEventListener('eduai_level_up', handleLevelUp);

    return () => {
      window.removeEventListener('eduai_badge_unlocked', handleBadgeUnlocked);
      window.removeEventListener('eduai_level_up', handleLevelUp);
    };
  }, []);

  if (!notification) return null;

  const getRarityBadgeStyle = (rarity?: string) => {
    switch (rarity) {
      case 'Diamond':
        return 'from-cyan-500 via-blue-500 to-indigo-600 text-white border-cyan-300';
      case 'Gold':
        return 'from-amber-400 via-yellow-500 to-amber-600 text-amber-950 border-amber-300';
      case 'Silver':
        return 'from-slate-300 via-gray-400 to-slate-500 text-slate-900 border-slate-200';
      default:
        return 'from-orange-400 via-amber-600 to-amber-700 text-white border-orange-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center overflow-hidden">
        {/* Decorative Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/20 dark:bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={() => setNotification(null)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {notification.type === 'badge' && notification.badge && (
          <div className="flex flex-col items-center space-y-4 pt-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Badge Unlocked!</span>
            </div>

            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getRarityBadgeStyle(notification.badge.badgeRarity)} p-0.5 shadow-lg flex items-center justify-center`}>
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Trophy className="w-10 h-10 text-amber-500 dark:text-amber-400" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {notification.badge.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                {notification.badge.description}
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold px-4 py-1.5 rounded-full text-sm shadow-md">
              <Star className="w-4 h-4 fill-current" />
              <span>+{notification.badge.rewardXp} XP Bonus Earned</span>
            </div>

            <button
              onClick={() => setNotification(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-semibold rounded-xl transition-all shadow-md mt-2"
            >
              Awesome! Keep Going
            </button>
          </div>
        )}

        {notification.type === 'level' && notification.level && (
          <div className="flex flex-col items-center space-y-4 pt-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
              <Flame className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Level Up Milestone!</span>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  Lvl {notification.level}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                You Reached Level {notification.level}!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                New AI tools, privileges, and milestone rewards unlocked!
              </p>
            </div>

            <button
              onClick={() => setNotification(null)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md mt-2"
            >
              Claim Level {notification.level} Rewards
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
