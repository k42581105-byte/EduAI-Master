import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Square,
  Plus,
  Trash2,
  History,
  RotateCcw,
  BookMarked,
  Check,
  Copy,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Bot,
  User,
  X,
  Volume2,
} from 'lucide-react';
import { StudentProfile, Conversation, ChatMessage, SubjectTeacherMode } from '../../types';
import { AiService } from '../../services/aiService';
import { StorageService } from '../../services/storageService';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { MarkdownRenderer } from '../ai/MarkdownRenderer';
import { SubjectModeSelector, SUBJECT_MODES_CONFIG } from '../ai/SubjectModeSelector';
import { StudentContextBar } from '../ai/StudentContextBar';
import { QuickPromptsBar } from '../ai/QuickPromptsBar';
import { MessageActionButtons } from '../ai/MessageActionButtons';
import { ConversationHistoryDrawer } from '../ai/ConversationHistoryDrawer';
import { VoiceAiControl } from '../ai/VoiceAiControl';

interface AskAiViewProps {
  profile: StudentProfile;
  onNavigate?: (viewId: string) => void;
  onNavigateToView?: (viewId: string) => void;
  lang?: string;
}


const SAMPLE_QUESTIONS = [
  {
    title: 'Explain Photosynthesis',
    subtitle: 'Class 10 Science • Life Processes',
    prompt: 'Explain the mechanism of photosynthesis with chemical equation and key exam points.',
    subjectMode: 'science' as SubjectTeacherMode,
  },
  {
    title: 'Solve Quadratic Equation',
    subtitle: 'Class 10 Maths • Algebra',
    prompt: 'Explain how to solve 2x² - 5x + 3 = 0 using the quadratic formula step-by-step.',
    subjectMode: 'maths' as SubjectTeacherMode,
  },
  {
    title: 'Formal Letter Format',
    subtitle: 'Class 10 English • Writing Skills',
    prompt: 'Provide the official CBSE format for a Letter to the Editor with a sample example.',
    subjectMode: 'english' as SubjectTeacherMode,
  },
  {
    title: 'कबीर के दोहे का अर्थ',
    subtitle: 'Class 10 Hindi • स्पर्श भाग 2',
    prompt: 'कबीर के दोहे "ऐसी बाणी बोलिए, मन का आपा खोइ" का सरल अर्थ और व्याख्या समझाएं।',
    subjectMode: 'hindi' as SubjectTeacherMode,
  },
];

export const AskAiView: React.FC<AskAiViewProps> = ({ profile, onNavigate, onNavigateToView }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [subjectMode, setSubjectMode] = useState<SubjectTeacherMode>('general');
  const [activeSubject, setActiveSubject] = useState<string>(profile.selectedSubjects[0] || 'Science');
  const [activeChapter, setActiveChapter] = useState<string>('Life Processes');
  const [activeTopic, setActiveTopic] = useState<string>('Photosynthesis');

  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load conversations on mount
  useEffect(() => {
    const list = StorageService.getConversations();
    setConversations(list);

    const activeId = StorageService.getActiveConversationId();
    if (activeId && list.some((c) => c.id === activeId)) {
      setActiveConversationId(activeId);
    } else if (list.length > 0) {
      setActiveConversationId(list[0].id);
      StorageService.setActiveConversationId(list[0].id);
    } else {
      createNewConversation();
    }

    const savedMode = StorageService.getSelectedSubjectMode();
    if (savedMode) setSubjectMode(savedMode);

    // Check if there is a pending ask AI prompt from Weak Topics or Study Planner
    const pendingPrompt = localStorage.getItem('eduai_pending_ask_prompt');
    if (pendingPrompt) {
      setInputQuery(pendingPrompt);
      localStorage.removeItem('eduai_pending_ask_prompt');
    }
  }, []);

  // Auto-scroll on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, streamingText, isGenerating]);

  // Current Active Conversation
  const currentConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to update active conversation in state & storage
  const updateCurrentConversation = (updater: (prevConv: Conversation) => Conversation) => {
    if (!activeConversationId) return;

    setConversations((prevList) => {
      const updatedList = prevList.map((conv) => {
        if (conv.id === activeConversationId) {
          const updatedConv = updater(conv);
          StorageService.saveConversation(updatedConv);
          return updatedConv;
        }
        return conv;
      });
      return updatedList;
    });
  };

  // 1. Create New Conversation
  const createNewConversation = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New AI Doubt Session',
      subjectMode: subjectMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      studentContext: {
        classLevel: profile.classLevel,
        board: profile.board,
        subject: activeSubject,
        chapter: activeChapter,
        topic: activeTopic,
        language: profile.preferredLanguage,
      },
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    StorageService.saveConversation(newConv);
    StorageService.setActiveConversationId(newConv.id);
  };

  // 2. Select Subject Mode
  const handleSelectSubjectMode = (mode: SubjectTeacherMode) => {
    setSubjectMode(mode);
    StorageService.setSelectedSubjectMode(mode);
    if (currentConversation) {
      updateCurrentConversation((conv) => ({ ...conv, subjectMode: mode }));
    }
  };

  // 3. Send Question to AI with SSE Streaming
  const handleSendQuestion = async (overridePrompt?: string, actionTypeOverride?: any) => {
    const query = overridePrompt || inputQuery;
    if (!query.trim() || isGenerating) return;

    if (!activeConversationId || !currentConversation) {
      createNewConversation();
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Auto-rename title if first message
    const isFirstMsg = currentConversation?.messages.length === 0;
    const newTitle = isFirstMsg ? (query.length > 35 ? `${query.slice(0, 35)}...` : query) : currentConversation?.title || 'Doubt Session';

    // Append user message
    updateCurrentConversation((conv) => ({
      ...conv,
      title: newTitle,
      updatedAt: new Date().toISOString(),
      messages: [...conv.messages, userMsg],
    }));

    setInputQuery('');
    setIsGenerating(true);
    setStreamingText('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Build chat history for model context
    const historyPayload = (currentConversation?.messages || []).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    await AiService.streamResponse(
      query,
      {
        subjectMode,
        studentContext: {
          classLevel: profile.classLevel,
          board: profile.board,
          subject: activeSubject,
          chapter: activeChapter,
          topic: activeTopic,
          language: profile.preferredLanguage,
        },
        actionType: actionTypeOverride,
        history: historyPayload,
      },
      {
        onChunk: (accumulated) => {
          setStreamingText(accumulated);
        },
        onComplete: (fullText) => {
          const aiMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: 'ai',
            text: fullText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'complete',
          };

          updateCurrentConversation((conv) => ({
            ...conv,
            messages: [...conv.messages, aiMsg],
          }));

          setStreamingText('');
          setIsGenerating(false);
          StorageService.addXp(15, 'Solved Doubt with AI Teacher');
        },
        onError: (err) => {
          showToast('Could not get answer right now. Please try again.');
          setIsGenerating(false);
        },
      },
      abortController.signal
    );
  };

  // Stop Generation
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  // Clear Current Conversation
  const handleClearConversation = () => {
    if (!currentConversation) return;
    updateCurrentConversation((conv) => ({
      ...conv,
      messages: [],
      updatedAt: new Date().toISOString(),
    }));
    showToast('Conversation cleared.');
  };

  // Handle Response Actions
  const handleRegenerate = () => {
    if (!currentConversation || currentConversation.messages.length === 0) return;
    const lastUserMsg = [...currentConversation.messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      handleSendQuestion(lastUserMsg.text);
    }
  };

  const handleExplainSimpler = () => {
    if (!currentConversation || currentConversation.messages.length === 0) return;
    const lastUserMsg = [...currentConversation.messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      handleSendQuestion(lastUserMsg.text, 'explain-simpler');
    }
  };

  const handleTranslate = (targetLang: 'hi' | 'en') => {
    if (!currentConversation || currentConversation.messages.length === 0) return;
    const lastUserMsg = [...currentConversation.messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      handleSendQuestion(lastUserMsg.text, targetLang === 'hi' ? 'translate-hi' : 'translate-en');
    }
  };

  const handleSaveNote = (text: string) => {
    StorageService.saveNote({
      id: `note-${Date.now()}`,
      title: `AI Tutor Note: ${activeTopic || activeSubject}`,
      subjectName: activeSubject,
      chapterName: activeChapter || 'AI Tutor Session',
      contentMarkdown: text,
      createdAt: 'Just now',
      tags: [activeSubject, `Class ${profile.classLevel}`, 'AI-Teacher'],
      isAiGenerated: true,
    });
    showToast('Saved note to Notes module!');
  };

  const handleCreateQuizFromAi = async (text: string) => {
    showToast('Generating quiz from explanation...');
    const res = await AiService.generateQuiz(activeTopic || activeSubject, {
      subject: activeSubject,
      classLevel: profile.classLevel,
    });
    if (res.quiz) {
      StorageService.addXp(20, 'Generated Quiz from AI Teacher');
      const nav = onNavigate || onNavigateToView;
      if (nav) {
        nav('quiz');
      } else {
        showToast('Quiz created! Check the Quiz module.');
      }
    }
  };

  return (
    <div className="space-y-4 pb-16 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl border border-indigo-500 bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-in slide-in-from-top duration-200 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHistoryDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 shadow-2xs transition-colors active:scale-95"
            title="Open Conversation History"
          >
            <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">History</span>
          </button>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              EduAI Master Teacher
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px] sm:max-w-md">
              {currentConversation?.title || '24/7 AI Doubt Solver & Concept Tutor'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={createNewConversation}
            className="flex items-center gap-1.5 rounded-xl border-2 border-indigo-600 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300 transition-colors active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>

          {currentConversation && currentConversation.messages.length > 0 && (
            <button
              onClick={handleClearConversation}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-rose-400 transition-colors active:scale-95"
              title="Clear current messages"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Student Context Bar */}
      <StudentContextBar
        profile={profile}
        activeSubject={activeSubject}
        activeChapter={activeChapter}
        activeTopic={activeTopic}
        onUpdateContext={(updates) => {
          if (updates.subject) setActiveSubject(updates.subject);
          if (updates.chapter !== undefined) setActiveChapter(updates.chapter);
          if (updates.topic !== undefined) setActiveTopic(updates.topic);
        }}
      />

      {/* 3. Subject Mode Selector */}
      <SubjectModeSelector currentMode={subjectMode} onSelectMode={handleSelectSubjectMode} />

      {/* 4. Conversation Messages / Empty State */}
      <div className="min-h-[380px] space-y-4">
        {(!currentConversation || currentConversation.messages.length === 0) && !isGenerating ? (
          /* Empty State Welcome */
          <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-6 dark:border-indigo-900/60 dark:bg-indigo-950/20 text-center space-y-6 my-4 animate-in fade-in duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Bot className="h-8 w-8" />
            </div>

            <div className="space-y-1 max-w-lg mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Hi! I'm your AI Learning Assistant 👋
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ask me any doubt in Class {profile.classLevel} ({profile.board}) syllabus. I can explain formulas, step-by-step numericals, or summarize chapters in simple language!
              </p>
            </div>

            {/* Sample Question Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
              {SAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSubjectMode(q.subjectMode);
                    handleSendQuestion(q.prompt);
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-indigo-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500 transition-all text-left group active:scale-98"
                >
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center justify-between">
                    <span>{q.title}</span>
                    <Sparkles className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{q.subtitle}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 line-clamp-2">
                    "{q.prompt}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render Messages Log */
          <div className="space-y-4">
            {currentConversation?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-indigo-500 bg-indigo-600 text-white shadow-xs mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'border border-indigo-500 bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-800 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-tl-xs space-y-3'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <div className="whitespace-pre-wrap font-sans font-medium">{msg.text}</div>
                  ) : (
                    <>
                      <MarkdownRenderer content={msg.text} />
                      <MessageActionButtons
                        messageText={msg.text}
                        onRegenerate={handleRegenerate}
                        onExplainSimpler={handleExplainSimpler}
                        onTranslate={handleTranslate}
                        onSaveNote={handleSaveNote}
                        onCreateQuiz={handleCreateQuizFromAi}
                      />
                    </>
                  )}

                  <div
                    className={`flex items-center justify-between text-[10px] pt-1 ${
                      msg.sender === 'user'
                        ? 'text-indigo-200'
                        : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <span className="font-medium text-indigo-500 dark:text-indigo-400">
                        Class {profile.classLevel} Teacher Response
                      </span>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-xs mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Live Streaming Indicator */}
            {isGenerating && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-indigo-500 bg-indigo-600 text-white shadow-xs animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="max-w-[88%] sm:max-w-[80%] rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                  {streamingText ? (
                    <MarkdownRenderer content={streamingText} />
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="h-4 w-4 animate-spin" />
                      EduAI Master Teacher is synthesizing response...
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Voice AI Control Assistant */}
      <VoiceAiControl
        onTranscriptReady={(transcriptText) => {
          if (transcriptText) setInputQuery(transcriptText);
        }}
        onVoiceAskAi={(prompt) => {
          setInputQuery(prompt);
          handleSendQuestion(prompt);
        }}
        onVoiceCreateNote={(prompt) => {
          handleSaveNote(`Voice Note Topic: ${prompt}\n\nKey Concepts:\n- Spoken Topic: ${prompt}\n- High yield study points for Class ${profile.classLevel}`);
        }}
        onVoiceCreateQuiz={(prompt) => {
          handleCreateQuizFromAi(prompt);
        }}
        latestAiResponse={currentConversation?.messages.filter((m) => m.sender === 'ai').slice(-1)[0]?.text || streamingText}
      />

      {/* 5. Input Form & Quick Action Chips */}
      <Card className="sticky bottom-18 md:bottom-4 border-indigo-200 shadow-xl dark:border-slate-800 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 p-3 sm:p-4 space-y-3">
        {/* Quick Action Chips */}
        <QuickPromptsBar
          onSelectPrompt={(prefix) => {
            setInputQuery((prev) => (prev ? `${prefix} ${prev}` : prefix));
          }}
        />

        {/* Input Area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuestion();
          }}
          className="space-y-2"
        >
          <div className="relative">
            <textarea
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendQuestion();
                }
              }}
              placeholder={`Ask any doubt in ${activeSubject} (${SUBJECT_MODES_CONFIG[subjectMode].label}). Press Enter to send, Shift+Enter for new line...`}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 p-3 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white dark:focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
              Class {profile.classLevel} ({profile.board}) • {SUBJECT_MODES_CONFIG[subjectMode].label} Mode
            </span>

            <div className="flex items-center gap-2 ml-auto">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGenerating}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-rose-500 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500 dark:bg-rose-950/60 dark:text-rose-300 transition-colors active:scale-95"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <Button
                  type="submit"
                  size="md"
                  disabled={!inputQuery.trim() || isGenerating}
                  icon={<Send className="h-4 w-4" />}
                >
                  Ask AI Teacher
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Conversation History Drawer Component */}
      <ConversationHistoryDrawer
        conversations={conversations}
        activeConversationId={activeConversationId}
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          StorageService.setActiveConversationId(id);
        }}
        onNewConversation={createNewConversation}
        onRenameConversation={(id, newTitle) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
          );
          const target = conversations.find((c) => c.id === id);
          if (target) StorageService.saveConversation({ ...target, title: newTitle });
        }}
        onDeleteConversation={(id) => {
          StorageService.deleteConversation(id);
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeConversationId === id) {
            const remaining = conversations.filter((c) => c.id !== id);
            if (remaining.length > 0) {
              setActiveConversationId(remaining[0].id);
              StorageService.setActiveConversationId(remaining[0].id);
            } else {
              createNewConversation();
            }
          }
        }}
      />
    </div>
  );
};
