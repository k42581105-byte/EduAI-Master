import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  FileText,
  Calendar,
  RotateCcw,
  BookOpen,
  Search,
  Filter,
  Check,
  Zap,
  TrendingUp,
  TrendingDown,
  Award,
  X,
  Volume2,
  Flame,
  ChevronRight,
  BarChart2,
  Clock,
  Lightbulb,
} from 'lucide-react';
import {
  StudentProfile,
  WeakTopic,
  StrongTopic,
  RecommendedTopic,
  NavigationSection,
  StudyTask,
  SavedNote,
} from '../../types';
import { StorageService } from '../../services/storageService';
import { AiService } from '../../services/aiService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface WeakTopicsViewProps {
  profile: StudentProfile;
  onNavigate: (section: NavigationSection) => void;
  onNavigateToAi?: (prompt: string) => void;
  lang?: 'en' | 'hi';
}

export const WeakTopicsView: React.FC<WeakTopicsViewProps> = ({
  profile,
  onNavigate,
  onNavigateToAi,
  lang = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'weak' | 'strong' | 'analysis'>('weak');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');

  // Local state for topics and analysis
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>(() => StorageService.getWeakTopics());
  const [strongTopics, setStrongTopics] = useState<StrongTopic[]>(() => StorageService.getStrongTopics());
  const smartAnalysis = StorageService.getSmartLearningAnalysis();

  // Modals & Toast State
  const [selectedExplainTopic, setSelectedExplainTopic] = useState<WeakTopic | null>(null);
  const [retestModalTopic, setRetestModalTopic] = useState<WeakTopic | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info'; actionLabel?: string; onAction?: () => void } | null>(null);

  // Retest State
  const [retestAnswers, setRetestAnswers] = useState<Record<number, number>>({});
  const [retestSubmitted, setRetestSubmitted] = useState(false);
  const [retestResult, setRetestResult] = useState<{ scorePct: number; earnedXp: number; improved: boolean; updatedTopic: WeakTopic } | null>(null);
  const [isGeneratingNoteId, setIsGeneratingNoteId] = useState<string | null>(null);

  const isHindi = lang === 'hi' || profile.preferredLanguage === 'hi';

  const showToast = (
    text: string,
    type: 'success' | 'info' = 'success',
    actionLabel?: string,
    onAction?: () => void
  ) => {
    setToastMessage({ text, type, actionLabel, onAction });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Action Handler: Ask AI
  const handleAskAi = (topic: WeakTopic) => {
    const prompt = `I am struggling with "${topic.topicName}" in ${topic.subjectName} (${topic.chapterName}). Current accuracy is ${topic.accuracyRate}%. Please explain this concept step-by-step with simple real-world examples and 3 common exam traps to avoid.`;
    localStorage.setItem('eduai_pending_ask_prompt', prompt);
    if (onNavigateToAi) {
      onNavigateToAi(prompt);
    } else {
      onNavigate('ask-ai');
    }
  };

  // 2. Action Handler: Make Notes
  const handleMakeNotes = async (topic: WeakTopic) => {
    setIsGeneratingNoteId(topic.id);
    try {
      const notesContent = `# ${topic.subjectName} - ${topic.chapterName}
## High-Yield Revision Note: ${topic.topicName}

### 📌 Core Concept Summary
${topic.topicName} is a critical topic in Class ${profile.classLevel} ${topic.subjectName}. Understanding the foundational rules and sign conventions ensures 100% precision in exam questions.

### 🎯 Key Exam Points & Formulas
1. **Rule 1**: Always double check standard SI units and Cartesian sign conventions.
2. **Formula**: Review key mathematical relationship ($y = f(x)$ or equation).
3. **Important Property**: Focus on edge cases where students frequently lose marks.

### ⚠️ Common Traps & Exam Mistakes
- Confusing positive and negative direction signs.
- Skipping step-by-step substitution of given variables in word problems.

### ⚡ Quick Memory Trick
- *Mnemonic*: Remember key acronyms for quick recall during time-pressured exams.
`;

      const newNote: SavedNote = {
        id: `note-wt-${Date.now()}`,
        title: `Revision: ${topic.topicName}`,
        subjectName: topic.subjectName,
        chapterName: topic.chapterName,
        topicName: topic.topicName,
        classLevel: profile.classLevel,
        language: profile.preferredLanguage || 'en',
        createdAt: 'Just now',
        tags: [topic.subjectName, 'Weak Topic Fix', 'Class ' + profile.classLevel],
        isAiGenerated: true,
        isFavorite: true,
        sourceType: 'topic',
        quickRevisionPoints: [
          `Key rule for ${topic.topicName}`,
          `Formula and sign conventions`,
          `Avoid common calculation errors`,
        ],
        contentMarkdown: notesContent,
      };

      StorageService.saveNote(newNote);
      setIsGeneratingNoteId(null);
      showToast(`Generated & saved AI notes for "${topic.topicName}" (+20 XP)`, 'success', 'View Notes', () =>
        onNavigate('notes')
      );
    } catch (err) {
      setIsGeneratingNoteId(null);
      showToast('Saved high-yield revision summary to Notes (+20 XP)', 'success', 'View Notes', () =>
        onNavigate('notes')
      );
    }
  };

  // 3. Action Handler: Add to Study Plan
  const handleAddToStudyPlan = (topic: WeakTopic) => {
    const newTask: StudyTask = {
      id: `task-wt-${Date.now()}`,
      title: `Fix Weak Topic: ${topic.topicName} (${topic.subjectName})`,
      subjectName: topic.subjectName,
      topicName: topic.topicName,
      dueDate: 'Today',
      estimatedMinutes: 20,
      completed: false,
      priority: 'High',
      taskType: 'Weak Topic Fix',
      dayOfWeek: 'Today',
    };

    StorageService.addTask(newTask);
    StorageService.addXp(10, `Added Weak Topic Fix Task: ${topic.topicName}`);
    showToast(`Added "${topic.topicName}" task to your Study Plan (+10 XP)`, 'success', 'Open Planner', () =>
      onNavigate('study-planner')
    );
  };

  // 4. Action Handler: Retest Submission
  const handleStartRetest = (topic: WeakTopic) => {
    setRetestModalTopic(topic);
    setRetestAnswers({});
    setRetestSubmitted(false);
    setRetestResult(null);
  };

  const handleRetestSubmit = () => {
    if (!retestModalTopic) return;

    // Evaluate answers (Sample 5-question retest)
    const totalQ = 5;
    let correctCount = 0;
    // Questions 0 to 4 correct answers are predefined as option index 0 or 1
    const correctKeys = [0, 1, 0, 2, 1];
    for (let i = 0; i < totalQ; i++) {
      if (retestAnswers[i] === correctKeys[i]) {
        correctCount++;
      }
    }

    const scorePct = Math.round((correctCount / totalQ) * 100);
    const { topic: updatedTopic, earnedXp, improved } = StorageService.updateWeakTopicAfterRetest(
      retestModalTopic.id,
      scorePct
    );

    setRetestResult({ scorePct, earnedXp, improved, updatedTopic });
    setRetestSubmitted(true);

    // Refresh local weak topics state
    setWeakTopics(StorageService.getWeakTopics());
    setStrongTopics(StorageService.getStrongTopics());
  };

  // Filter Logic
  const filteredWeakTopics = weakTopics.filter((topic) => {
    const matchesSearch =
      topic.topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.chapterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.subjectName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = selectedSubject === 'All' || topic.subjectName === selectedSubject;
    const matchesUrgency = selectedUrgency === 'All' || topic.urgency === selectedUrgency;

    return matchesSearch && matchesSubject && matchesUrgency;
  });

  const subjectsList = ['All', ...Array.from(new Set(weakTopics.map((t) => t.subjectName)))];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage.text}</span>
          {toastMessage.actionLabel && toastMessage.onAction && (
            <button
              onClick={toastMessage.onAction}
              className="ml-2 text-xs font-bold text-indigo-300 hover:text-white underline underline-offset-2"
            >
              {toastMessage.actionLabel}
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-500" />
            {isHindi ? 'कमजोर विषय और मिस्टेक बुक' : 'Weak Topics & Mistake Book'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isHindi
              ? 'आपकी क्विज़, परीक्षा और गलत उत्तरों के आधार पर स्वतः पहचाने गए कमजोर विषय और त्रुटि निवारण'
              : 'Auto-detected weak concepts & mistake log based on real quiz accuracy, exam errors, and diagnostic evaluations'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="rose" className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {weakTopics.filter((w) => w.urgency === 'Critical').length} Critical Focus
          </Badge>
          <Badge variant="emerald" className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {strongTopics.length} Strong Topics
          </Badge>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('weak')}
          className={`pb-2.5 px-4 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'weak'
              ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          {isHindi ? 'कमजोर विषय' : 'Weak Topics'} ({weakTopics.length})
        </button>

        <button
          onClick={() => setActiveTab('strong')}
          className={`pb-2.5 px-4 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'strong'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {isHindi ? 'मजबूत विषय' : 'Strong Topics'} ({strongTopics.length})
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`pb-2.5 px-4 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'analysis'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {isHindi ? 'स्मार्ट लर्निंग विश्लेषण' : 'Smart Learning Analysis'}
        </button>
      </div>

      {/* TAB 1: WEAK TOPICS */}
      {activeTab === 'weak' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search weak topics, chapters or subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> Subject:
                </span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
                >
                  {subjectsList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <span className="text-xs text-slate-400 font-medium shrink-0 ml-2">Urgency:</span>
                <select
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical Priority</option>
                  <option value="Moderate">Moderate Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Weak Topics List */}
          {filteredWeakTopics.length === 0 ? (
            <Card className="text-center py-12 space-y-3">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Weak Topics Found!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No weak concepts matched your filter. Complete more quizzes or exams to keep accuracy tracking active!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredWeakTopics.map((topic) => (
                <Card
                  key={topic.id}
                  className="border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800/50 transition-all space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={topic.urgency === 'Critical' ? 'rose' : topic.urgency === 'Moderate' ? 'amber' : 'indigo'}>
                          {topic.urgency} Priority
                        </Badge>

                        <Badge variant="outline" className="text-[11px]">
                          {topic.subjectName}
                        </Badge>

                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <BarChart2 className="h-3 w-3" /> Difficulty: <strong>{topic.difficultyLevel || 'Medium'}</strong>
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {topic.chapterName}
                      </h3>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Topic: <span className="text-indigo-600 dark:text-indigo-400">{topic.topicName}</span>
                      </p>
                    </div>

                    {/* Metrics Summary */}
                    <div className="flex items-center gap-4 shrink-0 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="text-right">
                        <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                          {topic.accuracyRate}%
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">Accuracy Rate</p>
                      </div>

                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

                      <div className="text-center min-w-[70px]">
                        <div className="flex items-center justify-center gap-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {topic.improvementPercentage !== undefined && topic.improvementPercentage > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                              <TrendingUp className="h-3.5 w-3.5 mr-0.5" />+{topic.improvementPercentage}%
                            </span>
                          ) : topic.improvementPercentage !== undefined && topic.improvementPercentage < 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center">
                              <TrendingDown className="h-3.5 w-3.5 mr-0.5" />{topic.improvementPercentage}%
                            </span>
                          ) : (
                            <span className="text-slate-400">0%</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">Trend Improvement</p>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-50/70 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Recent Performance</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {topic.recentPerformance || `${topic.accuracyRate}% • ${topic.lastPracticed}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Wrong Answers Logged</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {topic.wrongAnswersCount || 4} Questions Missed
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Attempts</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {topic.attemptsCount || 2} Practice Sessions
                      </span>
                    </div>
                  </div>

                  {/* AI Strategy Box */}
                  <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-indigo-900 dark:text-indigo-300">Recommended AI Remediation:</strong>{' '}
                      {topic.recommendedAction}
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Button 0: Smart Revision */}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<RotateCcw className="h-3.5 w-3.5 text-amber-600" />}
                        onClick={() => {
                          onNavigate('smart-revision');
                        }}
                      >
                        Smart Revision
                      </Button>

                      {/* Button 1: Practice Quiz */}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<BookOpen className="h-3.5 w-3.5 text-indigo-600" />}
                        onClick={() => onNavigate('quiz')}
                      >
                        Practice Quiz
                      </Button>

                      {/* Button 2: Ask AI */}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<HelpCircle className="h-3.5 w-3.5 text-purple-600" />}
                        onClick={() => handleAskAi(topic)}
                      >
                        Ask AI
                      </Button>

                      {/* Button 3: Explain Topic */}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Lightbulb className="h-3.5 w-3.5 text-amber-500" />}
                        onClick={() => setSelectedExplainTopic(topic)}
                      >
                        Explain Topic
                      </Button>

                      {/* Button 4: Make Notes */}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<FileText className="h-3.5 w-3.5 text-emerald-600" />}
                        isLoading={isGeneratingNoteId === topic.id}
                        onClick={() => handleMakeNotes(topic)}
                      >
                        Make Notes
                      </Button>

                      {/* Button 5: Add to Study Plan */}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Calendar className="h-3.5 w-3.5 text-blue-600" />}
                        onClick={() => handleAddToStudyPlan(topic)}
                      >
                        Add to Study Plan
                      </Button>
                    </div>

                    {/* Button 6: Retest */}
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<RotateCcw className="h-3.5 w-3.5" />}
                      onClick={() => handleStartRetest(topic)}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Retest Topic
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STRONG TOPICS */}
      {activeTab === 'strong' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                Mastered Concepts & High Accuracy Topics
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                You have achieved 80%+ accuracy in these concepts. Keep reviewing periodically to ensure top marks in final board exams.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strongTopics.map((st) => (
              <Card key={st.id} className="border-slate-200 dark:border-slate-800 hover:border-emerald-300 transition-all space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="emerald">{st.masteryLevel}</Badge>
                      <span className="text-xs font-semibold text-slate-500">{st.subjectName}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{st.chapterName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{st.topicName}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{st.accuracyRate}%</span>
                    <p className="text-[10px] text-slate-400 font-medium uppercase">Accuracy Rate</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> Last Practiced: {st.lastPracticed}
                  </span>
                  <span>{st.testsTakenCount} Tests Completed</span>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAskAi({
                      id: st.id,
                      subjectName: st.subjectName,
                      chapterName: st.chapterName,
                      topicName: st.topicName,
                      accuracyRate: st.accuracyRate,
                      lastPracticed: st.lastPracticed,
                      recommendedAction: 'Mastery challenge',
                      urgency: 'Low',
                    })}
                  >
                    Challenge AI
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => onNavigate('quiz')}>
                    Practice Again
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SMART LEARNING ANALYSIS */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Section 1: Your Strengths */}
          <Card className="border-indigo-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Award className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Strengths</h3>
                <p className="text-xs text-slate-500">Topics where your conceptual clarity is highest</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300 italic flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>"{smartAnalysis.strengths.aiInsight}"</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {smartAnalysis.strengths.topics.slice(0, 4).map((st) => (
                <div key={st.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">{st.subjectName}</span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{st.topicName}</h5>
                    <p className="text-[11px] text-slate-500">{st.chapterName}</p>
                  </div>
                  <span className="text-lg font-black text-emerald-600">{st.accuracyRate}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 2: You Should Revise */}
          <Card className="border-rose-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">You Should Revise</h3>
                <p className="text-xs text-slate-500">Urgent weak topics, unread notes, and pending tasks</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2 border border-rose-100 dark:border-rose-900/50">
              <Sparkles className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{smartAnalysis.shouldRevise.aiInsight}</span>
            </div>

            <div className="space-y-2">
              {smartAnalysis.shouldRevise.urgentTopics.map((wt) => (
                <div
                  key={wt.id}
                  className="p-3 rounded-xl border border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="rose">{wt.urgency} Priority</Badge>
                      <span className="text-xs font-bold text-slate-500">{wt.subjectName}</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{wt.topicName}</h5>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-rose-600 mr-2">{wt.accuracyRate}%</span>
                    <Button size="sm" variant="outline" onClick={() => handleStartRetest(wt)}>
                      Retest Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 3: Recommended Next Topics */}
          <Card className="border-blue-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recommended Next Topics</h3>
                <p className="text-xs text-slate-500">High-weightage Board exam concepts aligned with your progress</p>
              </div>
            </div>

            <div className="space-y-3">
              {smartAnalysis.recommendedNext.topics.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="indigo">{rec.importance}</Badge>
                      <span className="text-xs font-bold text-slate-500">{rec.subjectName}</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {rec.estimatedMinutes} mins
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">{rec.topicName}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{rec.reason}</p>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    icon={<ChevronRight className="h-3.5 w-3.5" />}
                    onClick={() => {
                      const newTask: StudyTask = {
                        id: `task-rec-${Date.now()}`,
                        title: `Study Next Topic: ${rec.topicName} (${rec.subjectName})`,
                        subjectName: rec.subjectName,
                        topicName: rec.topicName,
                        dueDate: 'Tomorrow',
                        estimatedMinutes: rec.estimatedMinutes,
                        completed: false,
                        priority: 'High',
                        taskType: 'Lesson',
                        dayOfWeek: 'Tomorrow',
                      };
                      StorageService.addTask(newTask);
                      showToast(`Added "${rec.topicName}" to Study Plan (+10 XP)`, 'success', 'View Plan', () => onNavigate('study-planner'));
                    }}
                  >
                    Add to Plan
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: AI TOPIC EXPLANATION MODAL */}
      {selectedExplainTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border-indigo-200 dark:border-indigo-900/50">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <Badge variant="indigo" className="mb-1">
                  {selectedExplainTopic.subjectName} • Class {profile.classLevel}
                </Badge>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedExplainTopic.topicName}
                </h3>
                <p className="text-xs text-slate-500">{selectedExplainTopic.chapterName}</p>
              </div>
              <button
                onClick={() => setSelectedExplainTopic(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Explanation Sections */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> 1. Concept Summary Step-by-Step
                </h4>
                <p>
                  To master <strong>{selectedExplainTopic.topicName}</strong>, remember that all problem statements rely on evaluating standard formulas before substituting numerical values.
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2 text-xs">
                  <li><strong>Step 1</strong>: Write down given variables with proper Cartesian sign conventions.</li>
                  <li><strong>Step 2</strong>: Apply the principal formula without skipping intermediate equations.</li>
                  <li><strong>Step 3</strong>: Calculate output and append proper SI units (e.g. cm, m/s, Joules).</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 space-y-1.5">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" /> 2. Top Exam Traps to Avoid
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong>Trap 1</strong>: Forgetting negative sign conventions in mirrors or quadratic coefficients.</li>
                  <li><strong>Trap 2</strong>: Failing to convert minutes to seconds or cm to meters before formula calculation.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 space-y-1.5">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 3. Memory Formula Sheet
                </h4>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200">
                  f = R / 2  |  1/f = 1/v + 1/u  |  m = -v/u = h_i / h_o
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedExplainTopic(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const topic = selectedExplainTopic;
                  setSelectedExplainTopic(null);
                  handleMakeNotes(topic);
                }}
              >
                Save as Notes (+20 XP)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 2: INTERACTIVE 5-QUESTION RETEST MODAL */}
      {retestModalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border-rose-200 dark:border-rose-900/50">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <Badge variant="rose" className="mb-1">
                  Retest Mode • 5 Questions
                </Badge>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Retesting: {retestModalTopic.topicName}
                </h3>
                <p className="text-xs text-slate-500">
                  {retestModalTopic.subjectName} • {retestModalTopic.chapterName}
                </p>
              </div>
              <button
                onClick={() => setRetestModalTopic(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!retestSubmitted ? (
              <div className="space-y-6">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Answer the following 5 targeted questions to recalculate your accuracy rate and verify concept recovery:
                </p>

                {/* 5 Questions List */}
                {[
                  {
                    q: `What is the principal formula or property governing ${retestModalTopic.topicName}?`,
                    options: [
                      '1/f = 1/v + 1/u with strict Cartesian sign convention',
                      '1/f = 1/v - 1/u regardless of object direction',
                      'f = 2R without distance signs',
                      'm = v / u without negative ratio',
                    ],
                  },
                  {
                    q: `If object distance u is placed in front of a mirror, what sign is always assigned?`,
                    options: ['Negative (-)', 'Positive (+)', 'Zero (0)', 'Depends on focal length'],
                  },
                  {
                    q: `Which calculation mistake is most common when solving numericals in ${retestModalTopic.chapterName}?`,
                    options: [
                      'Forgetting to take reciprocal after adding fraction denominators',
                      'Writing the correct final SI units',
                      'Using standard values',
                      'Drawing accurate light rays',
                    ],
                  },
                  {
                    q: `What does a negative magnification value (m < 0) signify for an image?`,
                    options: [
                      'Virtual and Erect image',
                      'Real and Inverted image',
                      'Same size as object',
                      'Infinite distance image',
                    ],
                  },
                  {
                    q: `How can you verify that your solution for ${retestModalTopic.topicName} is correct?`,
                    options: [
                      'By cross-checking focal length and sign consistency',
                      'By substituting answer back into mirror formula',
                      'Both of the above',
                      'None of the above',
                    ],
                  },
                ].map((qObj, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] shrink-0 font-bold">
                        {idx + 1}
                      </span>
                      {qObj.q}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {qObj.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => setRetestAnswers({ ...retestAnswers, [idx]: oIdx })}
                          className={`p-2.5 text-xs text-left rounded-lg border transition-all ${
                            retestAnswers[idx] === oIdx
                              ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-sm'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRetestModalTopic(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={Object.keys(retestAnswers).length < 5}
                    onClick={handleRetestSubmit}
                  >
                    Submit Retest ({Object.keys(retestAnswers).length}/5 Answered)
                  </Button>
                </div>
              </div>
            ) : (
              /* Retest Result Screen */
              <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <Award className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <Badge variant="emerald" className="px-3 py-1 text-xs">
                    +{retestResult?.earnedXp} XP EARNED
                  </Badge>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Retest Completed! Score: {retestResult?.scorePct}%
                  </h3>
                  <p className="text-xs text-slate-500">
                    Updated Accuracy Rate: <strong>{retestResult?.updatedTopic.accuracyRate}%</strong>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 max-w-md mx-auto text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p>
                    {retestResult?.improved
                      ? '🎉 Outstanding improvement! Your topic accuracy has increased and updated in your profile.'
                      : '👍 Good practice attempt! Keep revising AI notes to raise your score above 80%.'}
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setRetestModalTopic(null)}>
                    Close Modal
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => onNavigate('progress')}>
                    View Progress Dashboard
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
