import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import {
  BookOpen,
  Search,
  Star,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  BookCheck,
  CheckCircle2,
  Bookmark,
  Layers,
  GraduationCap,
  Filter,
  ArrowLeft,
  Copy,
  Share2,
  FileText,
  MessageSquare,
  Zap,
  Globe,
  Tag,
  Info,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { StudentProfile, ClassLevel, Book, Chapter, Topic, Lesson, RecentlyOpenedBook } from '../../types';
import { StorageService } from '../../services/storageService';
import { AiService } from '../../services/aiService';
import {
  ALL_BOARDS_LIST,
  ALL_MEDIUMS_LIST,
  ALL_CLASSES_LIST,
  getAvailableSubjectsForClass,
  getBooksForFilter,
  searchChaptersCatalog,
} from '../../services/booksData';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface BooksViewProps {
  profile: StudentProfile;
  onNavigate?: (section: any) => void;
  lang?: string;
}

type ViewTab = 'catalog' | 'recent' | 'favorites' | 'chapter-finder';

export const BooksView: React.FC<BooksViewProps> = ({ profile, onNavigate }) => {
  // Navigation Hierarchy States: Board -> Class -> Medium -> Subject
  const [selectedBoard, setSelectedBoard] = useState<string>(profile.board || 'CBSE');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(profile.classLevel || '10');
  const [selectedMedium, setSelectedMedium] = useState<string>(profile.medium || 'English');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  // Search & Tab States
  const [activeTab, setActiveTab] = useState<ViewTab>('catalog');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const BOOKS_PER_PAGE = 9;

  const debouncedSearch = useDebounce(searchQuery, 250);
  const debouncedChapterSearch = useDebounce(chapterSearchQuery, 250);

  // Favorites & Recent Books State
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => StorageService.getFavoriteBookIds());
  const [recentlyOpened, setRecentlyOpened] = useState<RecentlyOpenedBook[]>(() =>
    StorageService.getRecentlyOpenedBooks()
  );

  // Active Selected Book State (for reading Inspector)
  const [inspectingBook, setInspectingBook] = useState<Book | null>(null);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  // Active Lesson Reader Modal State
  const [readingLesson, setReadingLesson] = useState<{
    bookTitle: string;
    chapterTitle: string;
    topicTitle: string;
    lesson: Lesson;
  } | null>(null);

  // Ask AI Modal State
  const [askAiTopic, setAskAiTopic] = useState<{ bookTitle: string; chapterTitle: string; topicTitle: string } | null>(
    null
  );
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState<boolean>(false);
  const askAiAbortControllerRef = useRef<AbortController | null>(null);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Available subjects for selected class level
  const availableSubjects = useMemo(() => getAvailableSubjectsForClass(selectedClass), [selectedClass]);

  // Reset subject filter if not valid for new class
  useEffect(() => {
    if (selectedSubject !== 'All' && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject('All');
    }
    setCurrentPage(1);
  }, [selectedClass, selectedBoard, selectedMedium, selectedSubject, debouncedSearch, activeTab]);

  // Fetch filtered books memoized
  const currentBooks = useMemo(() => {
    return getBooksForFilter({
      board: selectedBoard,
      classLevel: selectedClass,
      medium: selectedMedium,
      subjectFilter: selectedSubject,
      searchQuery: debouncedSearch,
      favoriteIds: favoriteIds,
      onlyFavorites: activeTab === 'favorites',
    });
  }, [selectedBoard, selectedClass, selectedMedium, selectedSubject, debouncedSearch, favoriteIds, activeTab]);

  // Paginated books slice
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * BOOKS_PER_PAGE;
    return currentBooks.slice(start, start + BOOKS_PER_PAGE);
  }, [currentBooks, currentPage]);

  const totalPages = Math.ceil(currentBooks.length / BOOKS_PER_PAGE) || 1;

  // Handle Book Favorite Toggle
  const handleToggleFavorite = (bookId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = StorageService.toggleFavoriteBook(bookId);
    setFavoriteIds(updated);
    showToast(updated.includes(bookId) ? 'Book added to Favorites ⭐' : 'Removed from Favorites');
  };

  // Open Book Inspector & Add to Recent
  const handleOpenBook = (book: Book) => {
    setInspectingBook(book);
    setExpandedChapterId(book.chapters[0]?.id || null);

    // Save to recently opened
    StorageService.addRecentlyOpenedBook({
      bookId: book.id,
      title: book.title,
      board: book.board || selectedBoard,
      classLevel: book.classLevel || selectedClass,
      medium: book.medium || selectedMedium,
      subjectName: book.subjectName || 'General',
      author: book.author || 'NCERT Publications',
      coverColor: book.coverColor,
      chapterCount: book.chapters.length,
    });

    setRecentlyOpened(StorageService.getRecentlyOpenedBooks());
  };

  // Handle Quick Ask AI about topic
  const handleAskAiAboutTopic = async (bookTitle: string, chapterTitle: string, topicTitle: string) => {
    if (askAiAbortControllerRef.current) {
      askAiAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    askAiAbortControllerRef.current = controller;

    setAskAiTopic({ bookTitle, chapterTitle, topicTitle });
    setIsAskingAi(true);
    setAiAnswer(null);

    try {
      const res = await AiService.sendMessage(
        `Explain the concept of "${topicTitle}" from Chapter: "${chapterTitle}" in textbook "${bookTitle}" for Class ${selectedClass} ${selectedBoard} (${selectedMedium} Medium). Provide core definitions, key points, and 2 board exam practice questions.`,
        {
          studentContext: {
            classLevel: selectedClass,
            board: selectedBoard,
            medium: selectedMedium,
            subject: bookTitle,
            chapter: chapterTitle,
            topic: topicTitle,
          },
        },
        controller.signal
      );
      setAiAnswer(res.answer);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error(err);
      setAiAnswer('Failed to get AI response. Please try again.');
    } finally {
      setIsAskingAi(false);
    }
  };

  // Chapter Finder Results memoized
  const chapterResults = useMemo(() => {
    return searchChaptersCatalog({
      searchQuery: debouncedChapterSearch,
      board: selectedBoard,
      classLevel: selectedClass,
      medium: selectedMedium,
    });
  }, [debouncedChapterSearch, selectedBoard, selectedClass, selectedMedium]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-7xl mx-auto font-sans">
      {/* Toast Popup */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-2xl border border-indigo-500/30 bg-slate-900/95 px-4 py-3 text-xs font-bold text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Digital Books & Open Curriculum Library</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            NCERT & SCERT Textbook Library
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Browse open-access textbook chapters, topic outlines, and interactive AI study guides.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all border ${
              activeTab === 'catalog'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Library</span>
          </button>

          <button
            onClick={() => setActiveTab('recent')}
            className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all border ${
              activeTab === 'recent'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Recent ({recentlyOpened.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all border ${
              activeTab === 'favorites'
                ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>Favorites ({favoriteIds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chapter-finder')}
            className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all border ${
              activeTab === 'chapter-finder'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Chapter Finder</span>
          </button>
        </div>
      </div>

      {/* STEPPER / HIERARCHY SELECTOR CARD */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        {/* Navigation Breadcrumb Trail */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 overflow-x-auto pb-1 scrollbar-none">
          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="h-3.5 w-3.5" /> Board:
          </span>
          <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
            {selectedBoard}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />

          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            Class:
          </span>
          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
            Class {selectedClass}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />

          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
            Medium:
          </span>
          <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md">
            {selectedMedium}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />

          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            Subject:
          </span>
          <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">
            {selectedSubject}
          </span>
        </div>

        {/* Hierarchy Selector Controls Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* 1. Board Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              1. Board
            </label>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {ALL_BOARDS_LIST.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Class Level Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              2. Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {ALL_CLASSES_LIST.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Medium Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              3. Medium
            </label>
            <select
              value={selectedMedium}
              onChange={(e) => setSelectedMedium(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {ALL_MEDIUMS_LIST.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Search Filter Input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              4. Search Books
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title, author, topic..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-7 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Subject Filter Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Subjects:</span>
          <button
            onClick={() => setSelectedSubject('All')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
              selectedSubject === 'All'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            All ({availableSubjects.length})
          </button>
          {availableSubjects.map((sub) => {
            const active = selectedSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                  active
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </Card>

      {/* RECENTLY OPENED TAB */}
      {activeTab === 'recent' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" /> Recently Opened Books ({recentlyOpened.length})
            </h3>
            {recentlyOpened.length > 0 && (
              <button
                onClick={() => {
                  localStorage.removeItem('eduai_recent_books');
                  setRecentlyOpened([]);
                  showToast('Cleared recently opened list.');
                }}
                className="text-xs font-bold text-rose-500 hover:underline"
              >
                Clear Recent
              </button>
            )}
          </div>

          {recentlyOpened.length === 0 ? (
            <Card className="text-center py-12">
              <Clock className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs font-bold text-slate-500">No recently opened books.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Select any textbook from the Library to start reading!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentlyOpened.map((rec) => (
                <div
                  key={rec.bookId}
                  onClick={() => {
                    const match = currentBooks.find((b) => b.id === rec.bookId);
                    if (match) {
                      handleOpenBook(match);
                    } else {
                      // Fallback: construct temporary book object
                      handleOpenBook({
                        id: rec.bookId,
                        title: rec.title,
                        subjectId: rec.subjectName,
                        subjectName: rec.subjectName,
                        board: rec.board,
                        classLevel: rec.classLevel,
                        medium: rec.medium,
                        author: rec.author,
                        chapters: [],
                      });
                    }
                  }}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900 cursor-pointer transition-all shadow-2xs group flex items-start gap-3"
                >
                  <div
                    className={`h-16 w-12 rounded-xl bg-gradient-to-br ${
                      rec.coverColor || 'from-indigo-600 to-purple-800'
                    } flex items-center justify-center text-white shrink-0 shadow-xs`}
                  >
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <Badge variant="indigo" size="sm">
                        Class {rec.classLevel}
                      </Badge>
                      <span className="text-[10px] text-slate-400">{rec.openedAt}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600">
                      {rec.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {rec.author}
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      Continue Reading →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHAPTER FINDER TAB */}
      {activeTab === 'chapter-finder' && (
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-500" /> Search Chapter Title across {selectedBoard} Class {selectedClass} Books
            </h3>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={chapterSearchQuery}
                onChange={(e) => setChapterSearchQuery(e.target.value)}
                placeholder="Type chapter or topic name (e.g. Light, Chemical Reactions, Trigonometry)..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              {chapterSearchQuery && (
                <button
                  onClick={() => setChapterSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </Card>

          {chapterSearchQuery.trim() === '' ? (
            <Card className="text-center py-10">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500">Type in the search bar above to locate specific textbook chapters.</p>
            </Card>
          ) : chapterResults.length === 0 ? (
            <Card className="text-center py-10">
              <p className="text-xs font-semibold text-slate-500">No chapters match "{chapterSearchQuery}".</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {chapterResults.map(({ book, chapter }) => (
                <Card key={chapter.id} className="p-4 hover:border-indigo-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="indigo" size="sm">
                          Ch {chapter.number}
                        </Badge>
                        <span className="text-[11px] font-bold text-slate-500">
                          Book: {book.title}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {chapter.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {chapter.description}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      icon={<BookOpen className="h-3.5 w-3.5" />}
                      onClick={() => handleOpenBook(book)}
                    >
                      Open Chapter
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CATALOG & FAVORITES TAB: DIGITAL BOOKS SHELF */}
      {(activeTab === 'catalog' || activeTab === 'favorites') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              {activeTab === 'favorites' ? 'Favorite Books' : `${selectedBoard} Class ${selectedClass} Books`}
              <span className="text-xs font-normal text-slate-500">({currentBooks.length} available)</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {selectedMedium} Medium
            </span>
          </div>

          {currentBooks.length === 0 ? (
            <Card className="text-center py-16">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {activeTab === 'favorites' ? 'No Favorite Books Starred' : 'No Books Match Filters'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {activeTab === 'favorites'
                  ? 'Click the star icon ⭐ on any textbook card to add it to your quick-access favorites list.'
                  : 'Try changing your subject, search query, or board filter parameters.'}
              </p>
              {activeTab === 'favorites' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setActiveTab('catalog')}
                >
                  Explore Books Catalog
                </Button>
              )}
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedBooks.map((book) => {
                  const isFav = favoriteIds.includes(book.id);
                  return (
                    <div
                      key={book.id}
                      onClick={() => handleOpenBook(book)}
                      className="group relative rounded-3xl border border-slate-200 bg-white p-5 hover:border-indigo-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      {/* BOOK COVER GRAPHIC CONTAINER */}
                      <div>
                        <div
                          className={`relative h-44 w-full rounded-2xl bg-gradient-to-br ${
                            book.coverColor || 'from-indigo-600 to-purple-800'
                          } p-4 text-white shadow-md overflow-hidden flex flex-col justify-between`}
                        >
                          {/* Spine Texture Graphic */}
                          <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20 border-r border-white/20" />

                          {/* Top Badges */}
                          <div className="flex items-center justify-between pl-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white border border-white/20">
                              {book.editionBadge || '2025-26'}
                            </span>

                            <button
                              onClick={(e) => handleToggleFavorite(book.id, e)}
                              className="rounded-full bg-black/30 p-1.5 text-white/70 hover:text-amber-300 hover:bg-black/50 transition-colors"
                            >
                              <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                          </div>

                          {/* Cover Title Text */}
                          <div className="pl-2 space-y-1 my-auto">
                            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wide">
                              {book.subjectName}
                            </span>
                            <h4 className="font-black text-sm sm:text-base leading-tight drop-shadow-xs line-clamp-2">
                              {book.title}
                            </h4>
                          </div>

                          {/* Bottom Metadata Bar */}
                          <div className="flex items-center justify-between pl-2 text-[10px] text-white/80 border-t border-white/20 pt-2">
                            <span>{book.board}</span>
                            <span>Class {book.classLevel}</span>
                            <span>{book.medium}</span>
                          </div>
                        </div>

                        {/* Book Details Section */}
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                            <span className="truncate">{book.author}</span>
                            <span className="text-indigo-600 dark:text-indigo-400 shrink-0">
                              {book.chapters.length} Chs
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {book.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Action Button */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400">
                          Academic Year {book.academicYear?.slice(0, 7) || '2025-26'}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          Read Chapters <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500">
                    Showing {(currentPage - 1) * BOOKS_PER_PAGE + 1}–
                    {Math.min(currentPage * BOOKS_PER_PAGE, currentBooks.length)} of {currentBooks.length} books
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      icon={<ChevronLeft className="h-4 w-4" />}
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      icon={<ChevronRight className="h-4 w-4" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* BOOK INSPECTOR MODAL / DRAWER */}
      {inspectingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setInspectingBook(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo">{inspectingBook.subjectName}</Badge>
                    <Badge variant="emerald">Class {inspectingBook.classLevel}</Badge>
                    <span className="text-[10px] font-bold text-slate-400">{inspectingBook.medium} Medium</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {inspectingBook.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleFavorite(inspectingBook.id)}
                  className="p-2 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800 text-amber-500 hover:bg-slate-50"
                  title="Toggle Favorite"
                >
                  <Star
                    className={`h-4 w-4 ${
                      favoriteIds.includes(inspectingBook.id) ? 'fill-amber-400 text-amber-400' : ''
                    }`}
                  />
                </button>
                <Button variant="outline" size="sm" onClick={() => setInspectingBook(null)}>
                  Close
                </Button>
              </div>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Top Metadata Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Publisher: <span className="font-normal">{inspectingBook.publisher || inspectingBook.author}</span>
                  </p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Academic Year: <span className="font-normal">{inspectingBook.academicYear}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    License: {inspectingBook.licenseInfo}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="indigo">{inspectingBook.chapters.length} Chapters</Badge>
                </div>
              </div>

              {/* Chapters List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Textbook Chapters & Topics Breakdown:
                </h4>

                {inspectingBook.chapters.map((ch) => {
                  const isExpanded = expandedChapterId === ch.id;
                  return (
                    <Card key={ch.id} className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
                      <div
                        onClick={() => setExpandedChapterId(isExpanded ? null : ch.id)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-2xs">
                            Ch {ch.number}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {ch.title}
                            </h5>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {ch.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                            {ch.topics.length} Topics
                          </span>
                          <ChevronRight
                            className={`h-4 w-4 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Topics & Lessons */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
                          {ch.topics.map((tp) => (
                            <div
                              key={tp.id}
                              className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 space-y-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  Topic: {tp.title}
                                </span>
                                <Badge variant="emerald" size="sm">
                                  Mastery {tp.masteryLevel}%
                                </Badge>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {tp.summary}
                              </p>

                              {/* Lessons or AI Actions */}
                              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                                {tp.lessons.length > 0 ? (
                                  tp.lessons.map((les) => (
                                    <Button
                                      key={les.id}
                                      size="sm"
                                      variant="outline"
                                      icon={<BookCheck className="h-3.5 w-3.5" />}
                                      onClick={() =>
                                        setReadingLesson({
                                          bookTitle: inspectingBook.title,
                                          chapterTitle: ch.title,
                                          topicTitle: tp.title,
                                          lesson: les,
                                        })
                                      }
                                    >
                                      Read Lesson ({les.estimatedMinutes} mins)
                                    </Button>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-400">
                                    Standard Curriculum Topic
                                  </span>
                                )}

                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    icon={<Sparkles className="h-3.5 w-3.5" />}
                                    onClick={() =>
                                      handleAskAiAboutTopic(inspectingBook.title, ch.title, tp.title)
                                    }
                                  >
                                    Ask AI Tutor
                                  </Button>
                                  {onNavigate && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      icon={<FileText className="h-3.5 w-3.5" />}
                                      onClick={() => {
                                        setInspectingBook(null);
                                        onNavigate('notes');
                                      }}
                                    >
                                      Create Notes
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LESSON READER MODAL */}
      {readingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800 mb-4">
              <div>
                <Badge variant="indigo">{readingLesson.chapterTitle}</Badge>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {readingLesson.lesson.title}
                </h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setReadingLesson(null)}>
                Close
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto prose prose-xs sm:prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
              {readingLesson.lesson.contentMarkdown}
            </div>
          </div>
        </div>
      )}

      {/* ASK AI ABOUT TOPIC MODAL */}
      {askAiTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-indigo-600 p-2 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    AI Tutor Explanation: {askAiTopic.topicTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {askAiTopic.bookTitle} • {askAiTopic.chapterTitle}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (askAiAbortControllerRef.current) {
                    askAiAbortControllerRef.current.abort();
                  }
                  setAskAiTopic(null);
                }}
              >
                Close
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {isAskingAi ? (
                <div className="p-8 text-center space-y-3 animate-pulse">
                  <Sparkles className="mx-auto h-8 w-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Generating step-by-step textbook explanation & board exam questions...
                  </p>
                </div>
              ) : (
                <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {aiAnswer}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                icon={<Copy className="h-3.5 w-3.5" />}
                onClick={() => {
                  if (aiAnswer) {
                    navigator.clipboard.writeText(aiAnswer);
                    showToast('Explanation copied to clipboard!');
                  }
                }}
              >
                Copy Explanation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NOTICE ON OPEN CONTENT & LEGAL COMPLIANCE */}
      <div className="rounded-2xl border border-slate-200 bg-slate-100/60 p-4 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
        <p>
          <span className="font-bold text-slate-700 dark:text-slate-300">Legal & Educational Attribution:</span> EduAI Master provides open curriculum syllabus frameworks, NCERT & SCERT public educational outlines, chapter topics, and AI-assisted study guides under Open Educational Resources (OER) principles. All official trademarks belong to their respective educational boards.
        </p>
      </div>
    </div>
  );
};
