import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import {
  BookMarked,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Share2,
  Edit3,
  Camera,
  Upload,
  MessageSquare,
  RefreshCw,
  X,
  ArrowLeft,
  Languages,
  Sliders,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  GraduationCap,
  Save,
  Star,
  Zap,
  HelpCircle,
  Send,
  BookOpen,
  Filter,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Play,
} from 'lucide-react';
import { StudentProfile, SavedNote, ClassLevel, Conversation, Quiz, QuizQuestion } from '../../types';
import { StorageService } from '../../services/storageService';
import { AiService } from '../../services/aiService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { MarkdownRenderer } from '../ai/MarkdownRenderer';
import { validateImageFile } from '../../utils/imageUtils';
import { VoiceAiControl } from '../ai/VoiceAiControl';

interface NotesViewProps {
  profile: StudentProfile;
  onNavigate?: (section: any) => void;
  lang?: string;
}

type NoteSourceType = 'topic' | 'photo' | 'conversation';

const SUBJECT_OPTIONS = [
  'Science',
  'Maths',
  'English',
  'Hindi',
  'Social Studies (SST)',
  'Sanskrit',
  'General Knowledge',
];

const CLASS_LEVELS: ClassLevel[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const NotesView: React.FC<NotesViewProps> = ({ profile, onNavigate }) => {
  // Main State
  const [notes, setNotes] = useState<SavedNote[]>(() => StorageService.getNotes());
  const [activeNote, setActiveNote] = useState<SavedNote | null>(notes[0] || null);

  // View Mode: "library" or "studio"
  const [activeViewMode, setActiveViewMode] = useState<'library' | 'studio'>('library');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Filters & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('All');
  const [onlyFavoritesFilter, setOnlyFavoritesFilter] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<'recent' | 'oldest' | 'alphabetical' | 'favorites'>('recent');
  const [notesPage, setNotesPage] = useState(1);
  const NOTES_PER_PAGE = 8;

  // AI Notes Generator Form State
  const [sourceType, setSourceType] = useState<NoteSourceType>('topic');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(profile.classLevel || '10');
  const [selectedSubject, setSelectedSubject] = useState<string>(
    profile.selectedSubjects[0] || 'Science'
  );
  const [chapterName, setChapterName] = useState('Life Processes');
  const [topicName, setTopicName] = useState('Photosynthesis & Respiration');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>(
    profile.preferredLanguage || 'en'
  );

  // Photo Source State
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoQuestionText, setPhotoQuestionText] = useState('');
  const [photoMimeType, setPhotoMimeType] = useState('image/jpeg');

  // Conversation Source State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');

  // Generation & Interactive States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslatingNote, setIsTranslatingNote] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Edit Note Modal State
  const [editingNote, setEditingNote] = useState<SavedNote | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editClass, setEditClass] = useState<ClassLevel>('10');
  const [editSubject, setEditSubject] = useState('');
  const [editChapter, setEditChapter] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editContent, setEditContent] = useState('');

  // Quick Revision Modal State
  const [quickRevisionNote, setQuickRevisionNote] = useState<SavedNote | null>(null);
  const [revisionIndex, setRevisionIndex] = useState(0);

  // Generate Quiz Modal State
  const [quizNote, setQuizNote] = useState<SavedNote | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [userQuizAnswers, setUserQuizAnswers] = useState<{ [qId: string]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Ask AI from Note Modal State
  const [askAiNote, setAskAiNote] = useState<SavedNote | null>(null);
  const [askAiHistory, setAskAiHistory] = useState<{ sender: 'user' | 'ai'; text: string; timestamp: string }[]>([]);
  const [askAiInput, setAskAiInput] = useState('');
  const [isThinkingAi, setIsThinkingAi] = useState(false);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load conversations on mount
  useEffect(() => {
    const convs = StorageService.getConversations();
    setConversations(convs);
    if (convs.length > 0) {
      setSelectedConvId(convs[0].id);
    }
  }, []);

  // Get unique chapters for filter dropdown
  const uniqueChapters = useMemo(() => {
    return Array.from(new Set(notes.map((n) => n.chapterName).filter(Boolean))).sort();
  }, [notes]);

  // Reset page when filters change
  useEffect(() => {
    setNotesPage(1);
  }, [debouncedSearch, selectedClassFilter, selectedSubjectFilter, selectedChapterFilter, onlyFavoritesFilter, sortOption]);

  // Filter & Sort Notes
  const filteredAndSortedNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const matchesSearch =
          debouncedSearch === '' ||
          n.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          n.chapterName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (n.topicName && n.topicName.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          n.contentMarkdown.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          n.tags.some((t) => t.toLowerCase().includes(debouncedSearch.toLowerCase()));

        const matchesClass =
          selectedClassFilter === 'All' || n.classLevel === selectedClassFilter;

        const matchesSubject =
          selectedSubjectFilter === 'All' || n.subjectName === selectedSubjectFilter;

        const matchesChapter =
          selectedChapterFilter === 'All' || n.chapterName === selectedChapterFilter;

        const matchesFavorites = !onlyFavoritesFilter || !!n.isFavorite;

        return matchesSearch && matchesClass && matchesSubject && matchesChapter && matchesFavorites;
      })
      .sort((a, b) => {
        if (sortOption === 'favorites') {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
        }
        if (sortOption === 'oldest') {
          return a.id.localeCompare(b.id);
        }
        if (sortOption === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        // default: recent (id or date order)
        return b.id.localeCompare(a.id);
      });
  }, [notes, debouncedSearch, selectedClassFilter, selectedSubjectFilter, selectedChapterFilter, onlyFavoritesFilter, sortOption]);

  const paginatedNotes = useMemo(() => {
    const start = (notesPage - 1) * NOTES_PER_PAGE;
    return filteredAndSortedNotes.slice(start, start + NOTES_PER_PAGE);
  }, [filteredAndSortedNotes, notesPage]);

  const totalNotesPages = Math.ceil(filteredAndSortedNotes.length / NOTES_PER_PAGE) || 1;

  // Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateImageFile(file);
    if (!check.valid) {
      showToast(check.error || 'Invalid image file.');
      return;
    }

    setPhotoMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result as string);
      showToast('Photo uploaded! Ready to generate notes.');
    };
    reader.readAsDataURL(file);
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = StorageService.toggleFavoriteNote(id);
    setNotes(updated);
    const updatedNote = updated.find((n) => n.id === id);
    if (activeNote?.id === id && updatedNote) {
      setActiveNote(updatedNote);
    }
    showToast(updatedNote?.isFavorite ? 'Added to Favorites ⭐' : 'Removed from Favorites');
  };

  // 1. Generate Notes Action
  const handleGenerateNotes = async () => {
    if (isGenerating) return;

    let finalTopic = topicName.trim() || chapterName.trim();
    let questionText = photoQuestionText;
    let conversationText = '';

    if (sourceType === 'photo') {
      if (!photoBase64 && !photoQuestionText.trim()) {
        showToast('Please upload a photo or type the question text first.');
        return;
      }
      finalTopic = photoQuestionText.slice(0, 50) || 'Scanned Photo Problem';
    } else if (sourceType === 'conversation') {
      const selectedConv = conversations.find((c) => c.id === selectedConvId);
      if (!selectedConv || selectedConv.messages.length === 0) {
        showToast('Please select a valid Ask AI conversation.');
        return;
      }
      finalTopic = selectedConv.title;
      conversationText = selectedConv.messages
        .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
        .join('\n');
    } else {
      if (!chapterName.trim() && !topicName.trim()) {
        showToast('Please enter a Chapter or Topic name.');
        return;
      }
    }

    setIsGenerating(true);
    setGenerationStep('Analyzing curriculum context & key concepts...');

    try {
      setTimeout(() => setGenerationStep('Extracting key definitions & formulas...'), 1200);
      setTimeout(() => setGenerationStep('Writing student-friendly 7-part revision summary...'), 2400);

      const res = await AiService.generateNotes(finalTopic, {
        chapter: chapterName,
        subject: selectedSubject,
        classLevel: selectedClass,
        language: selectedLanguage,
        sourceType,
        questionText,
        conversationText,
        imageBase64: photoBase64,
        mimeType: photoMimeType,
      });

      // Generate quick revision points automatically
      const quickPoints = [
        `Core Concept: ${finalTopic} for Class ${selectedClass} ${selectedSubject}.`,
        `Key Subject: ${selectedSubject} - Chapter: ${chapterName || finalTopic}.`,
        `Summary: Exam-focused revision notes with core definitions and formulas.`,
        `Practice Questions: Includes top board exam questions and step-by-step model answers.`,
      ];

      const newSavedNote: SavedNote = {
        id: `note-${Date.now()}`,
        title: res.title || `${selectedSubject}: ${finalTopic}`,
        subjectName: selectedSubject,
        chapterName: chapterName || 'General Revision',
        topicName: topicName || finalTopic,
        classLevel: selectedClass,
        language: selectedLanguage,
        contentMarkdown: res.notes,
        createdAt: new Date().toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        tags: [selectedSubject, `Class ${selectedClass}`, sourceType.toUpperCase()],
        isAiGenerated: true,
        sourceType,
        isFavorite: false,
        quickRevisionPoints: quickPoints,
      };

      StorageService.saveNote(newSavedNote);
      const updatedList = StorageService.getNotes();
      setNotes(updatedList);
      setActiveNote(newSavedNote);

      showToast('🎉 Note generated! +20 XP awarded to your profile.');
      setActiveViewMode('library');
      setMobileDetailOpen(true);
    } catch (err) {
      console.error(err);
      showToast('Note generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // 2. Regenerate Action
  const handleRegenerate = async (note: SavedNote) => {
    setIsGenerating(true);
    showToast('Regenerating study notes with fresh AI details...');
    try {
      const res = await AiService.generateNotes(note.topicName || note.title, {
        chapter: note.chapterName,
        subject: note.subjectName,
        classLevel: note.classLevel || profile.classLevel,
        language: note.language || profile.preferredLanguage,
        sourceType: note.sourceType || 'topic',
      });

      const updated: SavedNote = {
        ...note,
        contentMarkdown: res.notes,
        createdAt: `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      };

      StorageService.saveNote(updated);
      const list = StorageService.getNotes();
      setNotes(list);
      setActiveNote(updated);
      showToast('Study note regenerated successfully!');
    } catch (err) {
      console.error(err);
      showToast('Regeneration error.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Edit Note Actions
  const handleOpenEditModal = (note: SavedNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingNote(note);
    setEditTitle(note.title);
    setEditClass(note.classLevel || '10');
    setEditSubject(note.subjectName);
    setEditChapter(note.chapterName);
    setEditTopic(note.topicName || '');
    setEditContent(note.contentMarkdown);
  };

  const handleSaveEdit = () => {
    if (!editingNote) return;
    const updated: SavedNote = {
      ...editingNote,
      title: editTitle.trim() || editingNote.title,
      classLevel: editClass,
      subjectName: editSubject,
      chapterName: editChapter.trim() || editingNote.chapterName,
      topicName: editTopic.trim(),
      contentMarkdown: editContent,
    };

    StorageService.saveNote(updated);
    const updatedList = StorageService.getNotes();
    setNotes(updatedList);
    setActiveNote(updated);
    setEditingNote(null);
    showToast('Saved note changes!');
  };

  // 4. Quick Revision Mode Action
  const handleOpenQuickRevision = (note: SavedNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQuickRevisionNote(note);
    setRevisionIndex(0);
  };

  // Extract points for quick revision modal
  const getRevisionPoints = (note: SavedNote): string[] => {
    if (note.quickRevisionPoints && note.quickRevisionPoints.length > 0) {
      return note.quickRevisionPoints;
    }
    // Parse bullets from markdown if not explicitly set
    const lines = note.contentMarkdown.split('\n');
    const points: string[] = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (
        (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('⚡')) &&
        trimmed.length > 10
      ) {
        points.push(trimmed.replace(/^[-*⚡]\s*/, '').replace(/\*\*/g, ''));
      }
    });
    if (points.length > 0) return points.slice(0, 8);
    return [
      `Subject: ${note.subjectName} (Class ${note.classLevel || '10'})`,
      `Chapter: ${note.chapterName}`,
      `Key Topic: ${note.topicName || note.title}`,
      `Review core definitions, formulas, and textbook questions.`,
    ];
  };

  // 5. Generate Quiz Action
  const handleGenerateQuizForNote = async (note: SavedNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQuizNote(note);
    setGeneratedQuiz(null);
    setUserQuizAnswers({});
    setQuizSubmitted(false);
    setIsGeneratingQuiz(true);

    try {
      const res = await AiService.generateQuiz(note.topicName || note.chapterName, {
        subject: note.subjectName,
        classLevel: note.classLevel || '10',
        questionCount: 5,
        language: note.language || 'en',
      });
      setGeneratedQuiz(res.quiz);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate quiz. Try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectQuizOption = (qId: string, optionIdx: number) => {
    if (quizSubmitted) return;
    setUserQuizAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitNoteQuiz = () => {
    if (!generatedQuiz) return;
    setQuizSubmitted(true);
    let correct = 0;
    generatedQuiz.questions.forEach((q) => {
      if (userQuizAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    StorageService.addXp(20, `Completed Quiz for note: ${quizNote?.title}`);
    showToast(`Quiz completed! You scored ${correct}/${generatedQuiz.questions.length} (+20 XP)`);
  };

  // 6. Ask AI Action
  const handleOpenAskAiModal = (note: SavedNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAskAiNote(note);
    setAskAiHistory([
      {
        sender: 'ai',
        text: `Hello! I am your AI Tutor. Ask me any doubt or question about your note: **${note.title}** (${note.subjectName} - ${note.chapterName}).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setAskAiInput('');
  };

  const handleSendNoteQuestion = async (customPrompt?: string) => {
    const questionText = customPrompt || askAiInput.trim();
    if (!questionText || !askAiNote || isThinkingAi) return;

    const userMsg = {
      sender: 'user' as const,
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAskAiHistory((prev) => [...prev, userMsg]);
    if (!customPrompt) setAskAiInput('');
    setIsThinkingAi(true);

    try {
      const res = await AiService.sendMessage(questionText, {
        subjectMode: 'general',
        studentContext: {
          classLevel: askAiNote.classLevel || profile.classLevel,
          subject: askAiNote.subjectName,
          chapter: askAiNote.chapterName,
          topic: askAiNote.topicName || askAiNote.title,
        },
      });

      const aiMsg = {
        sender: 'ai' as const,
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setAskAiHistory((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      showToast('Could not get answer right now. Please try again.');
    } finally {
      setIsThinkingAi(false);
    }
  };

  // Translate Note
  const handleTranslateNote = async (note: SavedNote, targetLang: 'hi' | 'en', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsTranslatingNote(true);
    showToast(targetLang === 'hi' ? 'AI द्वारा नोट का हिंदी में अनुवाद किया जा रहा है...' : 'Translating note with AI...');
    try {
      const res = await AiService.translateNote(note, targetLang);
      if (res.translatedNote) {
        StorageService.saveNote(res.translatedNote);
        const updated = StorageService.getNotes();
        setNotes(updated);
        setActiveNote(res.translatedNote);
        showToast(targetLang === 'hi' ? 'नोट का हिंदी में अनुवाद पूर्ण हुआ!' : 'Note translated to English!');
      }
    } catch (err) {
      showToast('Could not translate right now. Please try again.');
    } finally {
      setIsTranslatingNote(false);
    }
  };

  // 7. Copy Note
  const handleCopyNote = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedNoteId(id);
    showToast('Copied full note text to clipboard!');
    setTimeout(() => setCopiedNoteId(null), 2500);
  };

  // 8. Share Note
  const handleShareNote = async (note: SavedNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: `EduAI Revision Note (${note.subjectName} - ${note.chapterName}):\n\n${note.contentMarkdown.slice(0, 300)}...`,
        });
        showToast('Shared successfully!');
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(`${note.title}\n\n${note.contentMarkdown}`);
    showToast('Note copied to clipboard for sharing!');
  };

  // 9. Delete Note
  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this study note?')) {
      StorageService.deleteNote(id);
      const updated = StorageService.getNotes();
      setNotes(updated);
      if (activeNote?.id === id) {
        setActiveNote(updated[0] || null);
      }
      showToast('Note deleted.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-2xl border border-indigo-500/30 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3">
          <Sparkles className="h-4 w-4 text-amber-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <BookMarked className="h-4 w-4" />
            <span>EduAI Notes Library & AI Generator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Smart Notes Library & Quick Revision
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Search, filter, favorite, revise with quick flashcards, generate quizzes, or Ask AI directly.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => {
              setActiveViewMode('library');
              setMobileDetailOpen(false);
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all border ${
              activeViewMode === 'library'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <BookMarked className="h-4 w-4" />
            <span>Library ({notes.length})</span>
          </button>

          <button
            onClick={() => setActiveViewMode('studio')}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all border ${
              activeViewMode === 'studio'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Create AI Notes</span>
          </button>
        </div>
      </div>

      {/* Voice AI Assistant Bar */}
      <VoiceAiControl
        onTranscriptReady={(transcriptText) => {
          if (transcriptText) setTopicName(transcriptText);
        }}
        onVoiceCreateNote={(prompt) => {
          setTopicName(prompt);
          setActiveViewMode('studio');
          showToast(`Set topic to "${prompt}". Click "Generate Notes" below!`);
        }}
        onVoiceAskAi={(prompt) => {
          localStorage.setItem('eduai_pending_ask_prompt', prompt);
          if (onNavigate) onNavigate('ask-ai');
        }}
        onVoiceCreateQuiz={(prompt) => {
          setTopicName(prompt);
          showToast(`Topic set to "${prompt}". Generating quiz...`);
        }}
        latestAiResponse={activeNote ? activeNote.contentMarkdown : undefined}
      />

      {/* VIEW MODE 1: AI NOTES GENERATOR STUDIO */}
      {activeViewMode === 'studio' && (
        <div className="space-y-6">
          <Card className="border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900">
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-indigo-600 p-2 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Create New Structured Study Notes
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select source, target class level, subject, and language preference
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={<ArrowLeft className="h-3.5 w-3.5" />}
                onClick={() => setActiveViewMode('library')}
              >
                Back to Library
              </Button>
            </div>

            {/* Step 1: Select Source Type */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                1. Choose Note Source:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Source 1: Typed Topic */}
                <button
                  type="button"
                  onClick={() => setSourceType('topic')}
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                    sourceType === 'topic'
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-2" />
                  <span className="font-bold text-xs">Typed Topic / Chapter</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Enter chapter title & subtopic manually
                  </span>
                </button>

                {/* Source 2: Photo / Question */}
                <button
                  type="button"
                  onClick={() => setSourceType('photo')}
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                    sourceType === 'photo'
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-2" />
                  <span className="font-bold text-xs">Uploaded Photo / Question</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Upload image of textbook, question paper, or diagram
                  </span>
                </button>

                {/* Source 3: Ask AI Conversations */}
                <button
                  type="button"
                  onClick={() => setSourceType('conversation')}
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                    sourceType === 'conversation'
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <span className="font-bold text-xs">Ask AI Conversation</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Convert recent AI doubt session into notes
                  </span>
                </button>
              </div>

              {/* Source Inputs */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
                {sourceType === 'topic' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Chapter Name *
                      </label>
                      <input
                        type="text"
                        value={chapterName}
                        onChange={(e) => setChapterName(e.target.value)}
                        placeholder="e.g. Chemical Reactions, Light Reflection, Trigonometry..."
                        className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Topic / Focus Concept *
                      </label>
                      <input
                        type="text"
                        value={topicName}
                        onChange={(e) => setTopicName(e.target.value)}
                        placeholder="e.g. Types of Reactions, Mirror Formula, Identity proofs..."
                        className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {sourceType === 'photo' && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {photoBase64 ? (
                        <div className="relative h-28 w-28 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-xs shrink-0">
                          <img
                            src={photoBase64}
                            alt="Uploaded note source"
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => setPhotoBase64(null)}
                            className="absolute top-1 right-1 rounded-full bg-slate-900/80 p-1 text-white hover:bg-slate-900"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-28 w-full sm:w-48 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20 cursor-pointer hover:bg-indigo-50 transition-colors">
                          <Upload className="h-6 w-6 text-indigo-500 mb-1" />
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Upload Question Image
                          </span>
                          <span className="text-[10px] text-slate-400">JPG, PNG, WEBP &lt; 10MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      )}

                      <div className="flex-1 w-full space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                          Extracted Question or Additional Details
                        </label>
                        <textarea
                          rows={3}
                          value={photoQuestionText}
                          onChange={(e) => setPhotoQuestionText(e.target.value)}
                          placeholder="Type or edit question text from the uploaded photo..."
                          className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {sourceType === 'conversation' && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Select Recent Ask AI Doubt Session:
                    </label>

                    {conversations.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 text-center">
                        No recent Ask AI conversations found. Start a doubt session in Ask AI first or use Typed Topic.
                      </div>
                    ) : (
                      <select
                        value={selectedConvId}
                        onChange={(e) => setSelectedConvId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        {conversations.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.messages.length} messages) - {new Date(c.updatedAt).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Metadata Controls */}
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block pt-2">
                2. Target Academic Settings:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                {/* Class Level */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Class Level
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {CLASS_LEVELS.map((cls) => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {SUBJECT_OPTIONS.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Notes Language
                  </label>
                  <div className="flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedLanguage('en')}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                        selectedLanguage === 'en'
                          ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLanguage('hi')}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                        selectedLanguage === 'hi'
                          ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Hindi (हिंदी)
                    </button>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Generates 7 sections: Summary, Key Points, Definitions, Formulas, Examples & Questions.</span>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  disabled={isGenerating}
                  onClick={handleGenerateNotes}
                  className="w-full sm:w-auto px-8"
                  icon={
                    isGenerating ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )
                  }
                >
                  {isGenerating ? 'Generating AI Notes...' : 'Generate Notes (+20 XP)'}
                </Button>
              </div>

              {/* Live Generation Progress Bar */}
              {isGenerating && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-900 dark:bg-indigo-950/40 animate-pulse space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-600 animate-spin" />
                      {generationStep}
                    </span>
                    <span>Class {selectedClass} • {selectedSubject}</span>
                  </div>
                  <div className="h-1.5 w-full bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full animate-indeterminate" />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* VIEW MODE 2: COMPLETE NOTES LIBRARY */}
      {activeViewMode === 'library' && (
        <div className="space-y-5">
          {/* Filters & Sorting Control Bar */}
          <Card className="space-y-4">
            {/* Top Search Input Row */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes by title, subject, chapter, topic, or content..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Favorite Quick Filter Button */}
              <button
                onClick={() => setOnlyFavoritesFilter(!onlyFavoritesFilter)}
                className={`flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all border shrink-0 ${
                  onlyFavoritesFilter
                    ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <Star className={`h-4 w-4 ${onlyFavoritesFilter ? 'fill-white' : 'text-amber-500'}`} />
                <span>Favorites Only</span>
              </button>
            </div>

            {/* Bottom Filter Controls Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              {/* Filter by Class */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Class
                </label>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="All">All Classes</option>
                  {CLASS_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Subject */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="All">All Subjects</option>
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Chapter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Chapter
                </label>
                <select
                  value={selectedChapterFilter}
                  onChange={(e) => setSelectedChapterFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="All">All Chapters</option>
                  {uniqueChapters.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Sort By
                </label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="recent">Recent First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">Title (A-Z)</option>
                  <option value="favorites">Favorites First</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Library Split Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Notes List Column */}
            <div className={`space-y-3 ${mobileDetailOpen ? 'hidden md:block' : 'block'}`}>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Showing {filteredAndSortedNotes.length} notes</span>
                {filteredAndSortedNotes.length > 0 && <span>Select to view</span>}
              </div>

              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {filteredAndSortedNotes.length === 0 ? (
                  <Card className="text-center py-12">
                    <BookMarked className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs font-semibold text-slate-500">No notes match your filters.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try clearing search/filters or click "Create AI Notes".
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedClassFilter('All');
                        setSelectedSubjectFilter('All');
                        setSelectedChapterFilter('All');
                        setOnlyFavoritesFilter(false);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </Card>
                ) : (
                  <>
                    {paginatedNotes.map((note) => {
                      const isActive = activeNote?.id === note.id;
                      return (
                        <div
                          key={note.id}
                          onClick={() => {
                            setActiveNote(note);
                            setMobileDetailOpen(true);
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                            isActive
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 dark:border-indigo-500 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                          }`}
                        >
                          {/* Card Header Badges & Favorite Star */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="indigo" size="sm">
                                {note.subjectName}
                              </Badge>
                              {note.classLevel && (
                                <Badge variant="emerald" size="sm">
                                  Class {note.classLevel}
                                </Badge>
                              )}
                            </div>

                            <button
                              onClick={(e) => handleToggleFavorite(note.id, e)}
                              className="p-1 text-slate-300 hover:text-amber-400 dark:text-slate-600 transition-colors"
                              title="Toggle Favorite"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  note.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                                }`}
                              />
                            </button>
                          </div>

                          {/* Title */}
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-2.5 line-clamp-2 leading-snug">
                            {note.title}
                          </h4>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                            Ch: {note.chapterName}
                          </p>

                          {/* Note Card Quick Action Toolbar */}
                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                            <span className="text-[10px] text-slate-400">{note.createdAt}</span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleOpenQuickRevision(note, e)}
                                className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                title="Quick Revision"
                              >
                                <Zap className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={(e) => handleGenerateQuizForNote(note, e)}
                                className="p-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                title="Generate Quiz"
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={(e) => handleOpenAskAiModal(note, e)}
                                className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="Ask AI"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    {totalNotesPages > 1 && (
                      <div className="flex items-center justify-between pt-2 text-xs font-semibold text-slate-500">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={notesPage === 1}
                          onClick={() => setNotesPage((p) => Math.max(1, p - 1))}
                          icon={<ChevronLeft className="h-3.5 w-3.5" />}
                        >
                          Prev
                        </Button>
                        <span className="text-[11px] font-bold">
                          {notesPage} / {totalNotesPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={notesPage >= totalNotesPages}
                          onClick={() => setNotesPage((p) => Math.min(totalNotesPages, p + 1))}
                          icon={<ChevronRight className="h-3.5 w-3.5" />}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Selected Note Workspace Column */}
            <div className={`md:col-span-2 ${!mobileDetailOpen ? 'hidden md:block' : 'block'}`}>
              {activeNote ? (
                <Card className="space-y-5">
                  {/* Mobile Back Button */}
                  <div className="md:hidden flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <button
                      onClick={() => setMobileDetailOpen(false)}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Notes Library</span>
                    </button>
                  </div>

                  {/* Header Title & Metadata */}
                  <div className="border-b border-slate-100 pb-4 dark:border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={(e) => handleToggleFavorite(activeNote.id, e)}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="Toggle Favorite"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            activeNote.isFavorite
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-400'
                          }`}
                        />
                      </button>

                      <Badge variant="indigo">{activeNote.subjectName}</Badge>
                      {activeNote.classLevel && (
                        <Badge variant="emerald">Class {activeNote.classLevel}</Badge>
                      )}
                      {activeNote.language && (
                        <Badge variant="amber">
                          {activeNote.language === 'hi' ? 'Hindi (हिंदी)' : 'English'}
                        </Badge>
                      )}
                      {activeNote.sourceType && (
                        <Badge variant="slate" size="sm">
                          Source: {activeNote.sourceType.toUpperCase()}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activeNote.createdAt}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                      {activeNote.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span><strong>Chapter:</strong> {activeNote.chapterName}</span>
                      {activeNote.topicName && (
                        <span><strong>Topic:</strong> {activeNote.topicName}</span>
                      )}
                    </div>
                  </div>

                  {/* Note Feature Toolbars */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
                    {/* Primary Feature Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="amber"
                        icon={<Zap className="h-3.5 w-3.5" />}
                        onClick={(e) => handleOpenQuickRevision(activeNote, e)}
                      >
                        Quick Revision
                      </Button>

                      <Button
                        size="sm"
                        variant="indigo"
                        icon={<HelpCircle className="h-3.5 w-3.5" />}
                        onClick={(e) => handleGenerateQuizForNote(activeNote, e)}
                      >
                        Generate Quiz
                      </Button>

                      <Button
                        size="sm"
                        variant="emerald"
                        icon={<MessageSquare className="h-3.5 w-3.5" />}
                        onClick={(e) => handleOpenAskAiModal(activeNote, e)}
                      >
                        Ask AI
                      </Button>
                    </div>

                    {/* Utility Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={isTranslatingNote}
                        icon={<Languages className="h-3.5 w-3.5 text-blue-500" />}
                        onClick={(e) => handleTranslateNote(activeNote, activeNote.language === 'hi' ? 'en' : 'hi', e)}
                      >
                        {activeNote.language === 'hi' ? 'Translate to English' : 'Translate to हिंदी'}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        icon={
                          copiedNoteId === activeNote.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )
                        }
                        onClick={(e) => handleCopyNote(activeNote.contentMarkdown, activeNote.id, e)}
                      >
                        {copiedNoteId === activeNote.id ? 'Copied' : 'Copy'}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Share2 className="h-3.5 w-3.5 text-indigo-500" />}
                        onClick={(e) => handleShareNote(activeNote, e)}
                      >
                        Share
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Edit3 className="h-3.5 w-3.5 text-amber-500" />}
                        onClick={(e) => handleOpenEditModal(activeNote, e)}
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={(e) => handleDeleteNote(activeNote.id, e)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Note Markdown Content Body */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
                    <MarkdownRenderer content={activeNote.contentMarkdown} />
                  </div>
                </Card>
              ) : (
                <Card className="text-center py-20">
                  <BookMarked className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-3">
                    No note selected
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a note from the left list or click "Create AI Notes" above.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK REVISION MODAL */}
      {quickRevisionNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl border border-amber-500/30 bg-slate-900 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-amber-500 p-2 text-slate-950">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">⚡ Quick Revision Mode</h3>
                  <p className="text-xs text-amber-400 font-semibold">
                    {quickRevisionNote.subjectName} • {quickRevisionNote.chapterName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickRevisionNote(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Flashcard Carousel */}
            {(() => {
              const points = getRevisionPoints(quickRevisionNote);
              const total = points.length;
              const currentPoint = points[revisionIndex] || points[0];

              return (
                <div className="space-y-4">
                  <div className="min-h-[160px] flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-800/90 to-slate-800 border border-amber-500/30 shadow-inner">
                    <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider">
                      Flashcard {revisionIndex + 1} of {total}
                    </span>

                    <p className="text-sm sm:text-base font-bold text-slate-100 my-4 leading-relaxed">
                      {currentPoint}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Swipe or click arrows to cycle</span>
                      <span>Class {quickRevisionNote.classLevel || '10'}</span>
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      disabled={revisionIndex === 0}
                      onClick={() => setRevisionIndex((prev) => Math.max(0, prev - 1))}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {points.map((_, idx) => (
                        <div
                          key={idx}
                          onClick={() => setRevisionIndex(idx)}
                          className={`h-2 rounded-full cursor-pointer transition-all ${
                            idx === revisionIndex ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      disabled={revisionIndex === total - 1}
                      onClick={() => setRevisionIndex((prev) => Math.min(total - 1, prev + 1))}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-700 text-slate-300"
                onClick={() => {
                  const pts = getRevisionPoints(quickRevisionNote);
                  navigator.clipboard.writeText(pts.join('\n• '));
                  showToast('Copied revision points!');
                }}
              >
                Copy Points
              </Button>

              <Button
                variant="indigo"
                size="sm"
                icon={<HelpCircle className="h-3.5 w-3.5" />}
                onClick={() => {
                  const note = quickRevisionNote;
                  setQuickRevisionNote(null);
                  handleGenerateQuizForNote(note);
                }}
              >
                Practice Quiz
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* GENERATE QUIZ MODAL */}
      {quizNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-indigo-500/30 bg-slate-900 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-indigo-600 p-2 text-white">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">🎯 Note Quiz Practice</h3>
                  <p className="text-xs text-indigo-400 font-semibold">
                    {quizNote.subjectName} • {quizNote.chapterName}
                  </p>
                </div>
              </div>
              <button onClick={() => setQuizNote(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isGeneratingQuiz ? (
              <div className="text-center py-12 space-y-3">
                <Sparkles className="mx-auto h-10 w-10 text-indigo-400 animate-spin" />
                <p className="text-sm font-bold text-white">Generating 5 Practice Questions...</p>
                <p className="text-xs text-slate-400">Extracting key concepts from note content</p>
              </div>
            ) : generatedQuiz ? (
              <div className="space-y-6">
                {generatedQuiz.questions.map((q, qIdx) => {
                  const selectedOpt = userQuizAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3"
                    >
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {qIdx + 1}. {q.question}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedOpt === optIdx;
                          const isCorrect = q.correctAnswer === optIdx;

                          let btnStyle = 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500';
                          if (quizSubmitted) {
                            if (isCorrect) btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-300';
                            else if (isSelected && !isCorrect) btnStyle = 'bg-rose-950 border-rose-500 text-rose-300';
                          } else if (isSelected) {
                            btnStyle = 'bg-indigo-950 border-indigo-500 text-indigo-200';
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectQuizOption(q.id, optIdx)}
                              className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${btnStyle}`}
                            >
                              <span className="mr-1.5 font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && q.explanation && (
                        <div className="p-2.5 rounded-xl bg-slate-900/90 text-[11px] text-slate-300 border border-slate-800">
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  {onNavigate && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-300"
                      onClick={() => {
                        setQuizNote(null);
                        onNavigate('quiz');
                      }}
                    >
                      Open Quiz Studio
                    </Button>
                  )}

                  {!quizSubmitted ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleSubmitNoteQuiz}
                      className="ml-auto px-6"
                    >
                      Submit Quiz (+20 XP)
                    </Button>
                  ) : (
                    <Button
                      variant="emerald"
                      size="md"
                      onClick={() => setQuizNote(null)}
                      className="ml-auto"
                    >
                      Done
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ASK AI FROM NOTE MODAL */}
      {askAiNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-emerald-600 p-2 text-white">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">💬 Ask AI About This Note</h3>
                  <p className="text-xs text-emerald-400 font-semibold">
                    {askAiNote.subjectName} • {askAiNote.title}
                  </p>
                </div>
              </div>
              <button onClick={() => setAskAiNote(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => handleSendNoteQuestion('Explain this note in simple 5-year-old terms.')}
                className="rounded-xl bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-slate-700 border border-emerald-500/30"
              >
                💡 Explain simpler
              </button>
              <button
                onClick={() => handleSendNoteQuestion('Give me 3 top board exam questions from this note.')}
                className="rounded-xl bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-slate-700 border border-emerald-500/30"
              >
                🎯 3 Board Questions
              </button>
              <button
                onClick={() => handleSendNoteQuestion('List all important formulas and key terms in bullet points.')}
                className="rounded-xl bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-slate-700 border border-emerald-500/30"
              >
                ⚡ List Formulas
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 min-h-[220px] max-h-[360px]">
              {askAiHistory.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                    }`}
                  >
                    <MarkdownRenderer content={m.text} />
                    <span className="text-[9px] opacity-60 block text-right mt-1">{m.timestamp}</span>
                  </div>
                </div>
              ))}

              {isThinkingAi && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-slate-800 p-3 text-xs text-emerald-400 flex items-center gap-2 border border-slate-700">
                    <Sparkles className="h-4 w-4 animate-spin text-emerald-400" />
                    <span>AI Tutor is analyzing note & formulating answer...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800 shrink-0">
              <input
                type="text"
                value={askAiInput}
                onChange={(e) => setAskAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendNoteQuestion()}
                placeholder="Ask any doubt about this note..."
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder:text-slate-500"
              />
              <Button
                variant="emerald"
                icon={<Send className="h-4 w-4" />}
                onClick={() => handleSendNoteQuestion()}
                disabled={isThinkingAi || !askAiInput.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT NOTE MODAL */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                Edit Saved Study Note
              </h3>
              <button
                onClick={() => setEditingNote(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Class Level
                  </label>
                  <select
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value as ClassLevel)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {CLASS_LEVELS.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject
                  </label>
                  <select
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {SUBJECT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Chapter
                  </label>
                  <input
                    type="text"
                    value={editChapter}
                    onChange={(e) => setEditChapter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Note Content (Markdown)
                </label>
                <textarea
                  rows={10}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setEditingNote(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<Save className="h-4 w-4" />}
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
