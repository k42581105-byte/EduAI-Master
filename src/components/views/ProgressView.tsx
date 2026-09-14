import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  BookOpen,
  Target,
  Flame,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Clock,
  ChevronRight,
  BarChart2,
  HelpCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import { StudentProfile, NavigationSection, WeakTopic, StrongTopic } from '../../types';
import { StorageService } from '../../services/storageService';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface ProgressViewProps {
  profile: StudentProfile;
  onNavigate?: (section: NavigationSection) => void;
  lang?: 'en' | 'hi';
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  profile,
  onNavigate,
  lang = 'en',
}) => {
  const isHindi = lang === 'hi' || profile.preferredLanguage === 'hi';

  const weakTopics = StorageService.getWeakTopics();
  const strongTopics = StorageService.getStrongTopics();
  const smartAnalysis = StorageService.getSmartLearningAnalysis();
  const recentActivities = StorageService.getActivities();

  const criticalCount = weakTopics.filter((w) => w.urgency === 'Critical').length;

  const subjectsMastery = [
    { subject: 'Science', mastery: 82, color: 'bg-purple-600' },
    { subject: 'Mathematics', mastery: 74, color: 'bg-blue-600' },
    { subject: 'Social Science', mastery: 88, color: 'bg-amber-600' },
    { subject: 'English', mastery: 92, color: 'bg-emerald-600' },
    { subject: 'Hindi', mastery: 90, color: 'bg-rose-600' },
  ];

  const handleAskAiForTopic = (topicName: string, subjectName: string) => {
    const prompt = `Please explain "${topicName}" in ${subjectName} with step-by-step examples and key board exam formulas.`;
    localStorage.setItem('eduai_pending_ask_prompt', prompt);
    if (onNavigate) {
      onNavigate('ask-ai');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            {isHindi ? 'प्रगति और अधिगम विश्लेषण' : 'Learning Analytics & Progress'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isHindi
              ? 'विषय दक्षता, परीक्षा अंक, कमजोर विषयों का विश्लेषण और सीखने की निरंतरता ट्रैकिंग'
              : 'Track subject mastery, weak topics, exam accuracy, XP growth, and overall learning consistency'}
          </p>
        </div>

        {onNavigate && (
          <Button
            variant="outline"
            size="sm"
            icon={<AlertCircle className="h-4 w-4 text-rose-500" />}
            onClick={() => onNavigate('weak-topics')}
          >
            {isHindi ? 'कमजोर विषय देखें' : 'View Weak Topics Engine'}
          </Button>
        )}
      </div>

      {/* Grid Stats (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="text-center p-3.5 space-y-1">
          <Award className="mx-auto h-6 w-6 text-indigo-600 mb-0.5" />
          <h4 className="text-xl font-black text-slate-900 dark:text-white">{profile.xp}</h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total XP</span>
        </Card>

        <Card className="text-center p-3.5 space-y-1">
          <Flame className="mx-auto h-6 w-6 text-amber-500 mb-0.5" />
          <h4 className="text-xl font-black text-slate-900 dark:text-white">{profile.streakDays} Days</h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Daily Streak</span>
        </Card>

        <Card className="text-center p-3.5 space-y-1">
          <BookOpen className="mx-auto h-6 w-6 text-emerald-600 mb-0.5" />
          <h4 className="text-xl font-black text-slate-900 dark:text-white">{profile.completedLessonsCount}</h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Lessons Done</span>
        </Card>

        <Card className="text-center p-3.5 space-y-1">
          <Target className="mx-auto h-6 w-6 text-rose-600 mb-0.5" />
          <h4 className="text-xl font-black text-slate-900 dark:text-white">{profile.avgScorePercentage}%</h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Quiz Score</span>
        </Card>

        <Card
          className="text-center p-3.5 space-y-1 border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 cursor-pointer hover:border-rose-400 transition-colors"
          onClick={() => onNavigate && onNavigate('weak-topics')}
        >
          <AlertCircle className="mx-auto h-6 w-6 text-rose-500 mb-0.5" />
          <h4 className="text-xl font-black text-rose-600 dark:text-rose-400">{weakTopics.length}</h4>
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Weak Topics</span>
        </Card>

        <Card
          className="text-center p-3.5 space-y-1 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 cursor-pointer hover:border-emerald-400 transition-colors"
          onClick={() => onNavigate && onNavigate('weak-topics')}
        >
          <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600 mb-0.5" />
          <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{strongTopics.length}</h4>
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Strong Topics</span>
        </Card>
      </div>

      {/* Subject Concept Mastery Breakdown */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-600" />
            Subject Concept Mastery Breakdown
          </h3>
          <span className="text-xs text-slate-400">Class {profile.classLevel} Syllabus</span>
        </div>

        <div className="space-y-3">
          {subjectsMastery.map((item) => (
            <div key={item.subject} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>{item.subject}</span>
                <span>{item.mastery}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: `${item.mastery}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* WEAK TOPICS & REMEDIATION SUMMARY SECTION */}
      <Card className="border-rose-200 dark:border-rose-900/50 space-y-4 bg-slate-50/40 dark:bg-slate-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Weak Topics & Action Plan
              </h3>
              <p className="text-xs text-slate-500">
                Concepts flagged for accuracy &lt; 65%. Practice these to boost overall performance.
              </p>
            </div>
          </div>

          {onNavigate && (
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => onNavigate('weak-topics')}
            >
              Manage Weak Topics
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {weakTopics.slice(0, 3).map((topic) => (
            <div
              key={topic.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant={topic.urgency === 'Critical' ? 'rose' : 'amber'}>
                    {topic.urgency}
                  </Badge>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                    {topic.accuracyRate}%
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {topic.chapterName}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{topic.topicName}</p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <button
                  onClick={() => handleAskAiForTopic(topic.topicName, topic.subjectName)}
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="h-3 w-3" /> Ask AI
                </button>

                {onNavigate && (
                  <button
                    onClick={() => onNavigate('quiz')}
                    className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <BookOpen className="h-3 w-3" /> Quiz
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* SMART LEARNING ANALYSIS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Your Strengths */}
        <Card className="border-emerald-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Your Strengths</h4>
          </div>

          <div className="space-y-2">
            {smartAnalysis.strengths.topics.slice(0, 3).map((st) => (
              <div
                key={st.id}
                className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{st.topicName}</span>
                  <span className="text-[10px] text-slate-500">{st.subjectName}</span>
                </div>
                <span className="font-black text-emerald-600">{st.accuracyRate}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* You Should Revise */}
        <Card className="border-rose-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">You Should Revise</h4>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('smart-revision')}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Smart Revision
              </button>
            )}
          </div>

          <div className="space-y-2">
            {smartAnalysis.shouldRevise.urgentTopics.slice(0, 3).map((wt) => (
              <div
                key={wt.id}
                className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">{wt.topicName}</span>
                  <span className="text-[10px] text-rose-600 font-bold">{wt.urgency} Priority</span>
                </div>
                <span className="font-black text-rose-600">{wt.accuracyRate}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recommended Next Topics */}
        <Card className="border-blue-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recommended Next</h4>
          </div>

          <div className="space-y-2">
            {smartAnalysis.recommendedNext.topics.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{rec.topicName}</span>
                  <Badge variant="indigo" className="text-[9px]">{rec.importance}</Badge>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">{rec.reason}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* RECENT TEST PERFORMANCE & ACTIVITY LOG */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" /> Recent Test & Quiz History
          </h3>
          <span className="text-xs text-slate-400">Real User Log</span>
        </div>

        <div className="space-y-2">
          {recentActivities.slice(0, 5).map((act) => (
            <div
              key={act.id}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white block">{act.title}</span>
                <span className="text-slate-400 text-[11px]">{act.details}</span>
              </div>

              <div className="text-right shrink-0">
                <Badge variant="emerald" className="text-[10px]">+{act.xpEarned} XP</Badge>
                <span className="text-[10px] text-slate-400 block mt-0.5">{act.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
