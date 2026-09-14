import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Bookmark,
  Layers,
  GraduationCap,
  Sparkles,
  Trash2,
  CheckCircle2,
  X,
  ExternalLink,
  Eye,
  ShieldCheck,
  Edit
} from 'lucide-react';
import { Book, ClassLevel, CurriculumBook } from '../../../../types';
import { ALL_CLASSES_LIST, ALL_BOARDS_LIST, getBooksForFilter } from '../../../../services/booksData';
import { ContentManagementService } from '../../../../services/contentManagementService';
import { Card } from '../../../common/Card';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';

export const AdminBooksTab: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('10');
  const [selectedBoard, setSelectedBoard] = useState<string>('CBSE');
  const [searchQuery, setSearchQuery] = useState('');
  const [booksList, setBooksList] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [bookTitle, setBookTitle] = useState('');
  const [bookSubject, setBookSubject] = useState('Science');
  const [bookAuthor, setBookAuthor] = useState('NCERT Editorial Board');
  const [bookPublisher, setBookPublisher] = useState('National Council of Educational Research & Training');
  const [bookLicense, setBookLicense] = useState('NCERT Open Educational Resource (OER) - CC BY-NC 4.0');
  const [bookChapters, setBookChapters] = useState(14);
  const [isCopyrightAuthorized, setIsCopyrightAuthorized] = useState(true);

  const loadBooks = (cls: ClassLevel, brd: string) => {
    const books = getBooksForFilter({ board: brd, classLevel: cls, medium: 'English' });
    setBooksList(books);
  };

  useEffect(() => {
    loadBooks(selectedClass, selectedBoard);
  }, [selectedClass, selectedBoard]);

  const handleFilterChange = (cls: ClassLevel, brd: string) => {
    setSelectedClass(cls);
    setSelectedBoard(brd);
    loadBooks(cls, brd);
  };

  const filteredBooks = booksList.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.subjectName || b.subjectId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.author || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showToast = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;

    const bookId = `bk-cms-${Date.now()}`;
    const generatedChapters = Array.from({ length: Number(bookChapters) || 12 }, (_, i) => ({
      id: `ch-c-${i + 1}`,
      bookId: bookId,
      number: i + 1,
      title: `Chapter ${i + 1}: Key Principles & Practice`,
      description: 'Comprehensive curriculum chapter coverage.',
      topics: [
        {
          id: `tp-${i + 1}-1`,
          chapterId: `ch-c-${i + 1}`,
          title: 'Core Theory & Formulations',
          summary: 'Comprehensive overview and conceptual foundation.',
          lessons: [],
          masteryLevel: 0,
        },
      ],
    }));

    const saveRes = ContentManagementService.saveBook({
      id: bookId,
      sessionId: 'sess-2026-2027',
      boardId: selectedBoard,
      classLevel: selectedClass,
      medium: 'English',
      subjectId: bookSubject.toLowerCase(),
      subjectName: bookSubject,
      title: bookTitle.trim(),
      author: bookAuthor.trim(),
      publisher: bookPublisher.trim(),
      editionBadge: '2026 Edition',
      description: `Official ${selectedBoard} standard curriculum textbook.`,
      licenseInfo: bookLicense,
      isAuthorized: isCopyrightAuthorized,
      status: 'published',
      chapters: generatedChapters,
    });

    if (!saveRes.success) {
      showToast(saveRes.errors?.[0] || 'Validation error saving textbook.');
      return;
    }

    loadBooks(selectedClass, selectedBoard);
    setIsAddModalOpen(false);
    setBookTitle('');
    showToast(`Added "${bookTitle.trim()}" to dynamic curriculum database.`);
  };

  const handleDeleteBook = (id: string) => {
    ContentManagementService.deleteBook(id);
    loadBooks(selectedClass, selectedBoard);
    showToast('Book removed from library inventory.');
  };

  const handleTogglePublish = (book: Book) => {
    const res = ContentManagementService.togglePublishBook(book.id);
    if (res.success) {
      loadBooks(selectedClass, selectedBoard);
      showToast(`Book status toggled to ${res.status}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {feedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Digital Textbooks & NCERT Catalog
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official curriculum books, chapter structures, and digital e-book reader inventory
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="text-xs shadow-xs"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Register Digital Book
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books by title or subject..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold">Class:</span>
          <select
            value={selectedClass}
            onChange={(e) => handleFilterChange(e.target.value as ClassLevel, selectedBoard)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2.5 text-xs font-semibold"
          >
            {ALL_CLASSES_LIST.map((cls) => (
              <option key={cls} value={cls}>
                Class {cls}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold">Board:</span>
          <select
            value={selectedBoard}
            onChange={(e) => handleFilterChange(selectedClass, e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2.5 text-xs font-semibold"
          >
            {ALL_BOARDS_LIST.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.map((book) => (
          <Card
            key={book.id}
            className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="indigo">Class {book.classLevel}</Badge>
                  <Badge variant="slate">{book.subjectName || book.subjectId}</Badge>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                    {book.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {book.description || `Publisher: ${book.publisher}`}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{book.licenseInfo || 'NCERT OER (CC BY-NC 4.0)'}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Chapters</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">
                    {book.totalChapters || book.chapters?.length || 0}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Pages Est.</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">
                    {book.totalPages || 240}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs py-1 px-2.5"
                onClick={() => setSelectedBook(book)}
                icon={<Eye className="w-3.5 h-3.5" />}
              >
                Inspect Chapters
              </Button>

              <button
                onClick={() => handleDeleteBook(book.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Remove Book"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Inspect Book Chapters Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedBook.title}
                </h4>
                <p className="text-xs text-slate-500">
                  Class {selectedBook.classLevel} • {selectedBook.subjectName || selectedBook.subjectId} • {selectedBook.board}
                </p>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Chapters Directory ({selectedBook.chapters?.length || 0})
              </p>
              {selectedBook.chapters && selectedBook.chapters.length > 0 ? (
                selectedBook.chapters.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {ch.title}
                      </span>
                      <Badge variant="indigo">Ch {ch.number}</Badge>
                    </div>
                    {ch.topics && ch.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {ch.topics.map((t) => (
                          <span
                            key={t.id}
                            className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300"
                          >
                            {t.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No chapters indexed.</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSelectedBook(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Add Digital Textbook
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Textbook Title
                </label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="e.g. NCERT Exemplar Problems - Mathematics"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={bookSubject}
                    onChange={(e) => setBookSubject(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Total Chapters
                  </label>
                  <input
                    type="number"
                    value={bookChapters}
                    onChange={(e) => setBookChapters(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Publisher / Board
                </label>
                <input
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Book
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
