import React, { useState, useEffect } from 'react';
import {
  Layers,
  BookOpen,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  X,
  FileText,
  AlertCircle,
  Eye,
  Download,
  Upload,
  Calendar,
  Globe,
  Languages,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  FolderTree
} from 'lucide-react';
import {
  HierarchyLevel,
  ClassLevel,
  AcademicSession,
  CurriculumBoard,
  CurriculumClass,
  CurriculumMedium,
  CurriculumSubject,
  CurriculumBook,
  CurriculumChapter,
  CurriculumTopic,
  CurriculumLesson,
} from '../../../../types';
import { ContentManagementService } from '../../../../services/contentManagementService';
import { ALL_BOARDS_LIST, ALL_CLASSES_LIST, ALL_MEDIUMS_LIST } from '../../../../services/booksData';
import { CmsHierarchyBreadcrumb } from '../cms/CmsHierarchyBreadcrumb';
import { CmsPreviewModal, CmsPreviewPayload } from '../cms/CmsPreviewModal';
import { CmsImportExportModal } from '../cms/CmsImportExportModal';
import { CmsEntityFormModal } from '../cms/CmsEntityFormModal';
import { Card } from '../../../common/Card';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';

export const AdminCurriculumTab: React.FC = () => {
  // Navigation & View State
  const [currentLevel, setCurrentLevel] = useState<HierarchyLevel>('subject');
  const [drilldownChain, setDrilldownChain] = useState<{ level: HierarchyLevel; id: string; name: string }[]>([]);

  // Filter States
  const [selectedSession, setSelectedSession] = useState<string>('sess-2026-2027');
  const [selectedBoard, setSelectedBoard] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedMedium, setSelectedMedium] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Parent Context for Drilldown
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formLevel, setFormLevel] = useState<HierarchyLevel>('subject');

  const [previewPayload, setPreviewPayload] = useState<CmsPreviewPayload | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Data Lists
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [boards, setBoards] = useState<CurriculumBoard[]>([]);
  const [classes, setClasses] = useState<CurriculumClass[]>([]);
  const [mediums, setMediums] = useState<CurriculumMedium[]>([]);
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [books, setBooks] = useState<CurriculumBook[]>([]);

  const refreshAllData = () => {
    setSessions(ContentManagementService.getSessions());
    setBoards(ContentManagementService.getBoards());
    setClasses(ContentManagementService.getClasses());
    setMediums(ContentManagementService.getMediums());
    setSubjects(ContentManagementService.getSubjects());
    setBooks(ContentManagementService.getBooks());
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Level selector click handler
  const handleSelectLevel = (level: HierarchyLevel, id?: string) => {
    setCurrentLevel(level);
    setFormLevel(level);

    if (level === 'session') {
      setDrilldownChain([]);
      setActiveBookId(null);
      setActiveChapterId(null);
      setActiveTopicId(null);
    } else if (level === 'board' && id) {
      const b = boards.find((x) => x.id === id);
      setDrilldownChain([{ level: 'board', id, name: b?.code || b?.name || id }]);
      setSelectedBoard(b?.code || id);
    } else if (level === 'book' && id) {
      const bk = books.find((x) => x.id === id);
      setActiveBookId(id);
      setDrilldownChain([
        { level: 'board', id: bk?.boardId || 'CBSE', name: bk?.boardId || 'CBSE' },
        { level: 'class', id: bk?.classLevel || '10', name: `Class ${bk?.classLevel || '10'}` },
        { level: 'book', id, name: bk?.title || id },
      ]);
    }
  };

  const handleResetHierarchy = () => {
    setCurrentLevel('subject');
    setFormLevel('subject');
    setDrilldownChain([]);
    setActiveBookId(null);
    setActiveChapterId(null);
    setActiveTopicId(null);
    setSelectedBoard('All');
    setSelectedClass('All');
    setSelectedMedium('All');
    setSearchQuery('');
  };

  // Open Add Modal for current level
  const handleOpenAddModal = (levelToCreate?: HierarchyLevel) => {
    const targetLvl = levelToCreate || currentLevel;
    setFormLevel(targetLvl);
    setEditingItem(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: any, levelToEdit: HierarchyLevel) => {
    setFormLevel(levelToEdit);
    setEditingItem(item);
    setIsFormModalOpen(true);
  };

  // Toggle Publish
  const handleTogglePublish = (item: any, level: HierarchyLevel) => {
    if (level === 'book') {
      const res = ContentManagementService.togglePublishBook(item.id);
      if (res.success) {
        refreshAllData();
        showToast(`Book status set to ${res.status}`);
      }
    }
  };

  // Delete Entity
  const handleDeleteItem = (id: string, level: HierarchyLevel, parentId?: string) => {
    if (window.confirm(`Are you sure you want to delete this ${level}? This action cannot be undone.`)) {
      if (level === 'session') ContentManagementService.deleteSession(id);
      else if (level === 'board') ContentManagementService.deleteBoard(id);
      else if (level === 'class') ContentManagementService.deleteClass(id);
      else if (level === 'medium') ContentManagementService.deleteMedium(id);
      else if (level === 'subject') ContentManagementService.deleteSubject(id);
      else if (level === 'book') ContentManagementService.deleteBook(id);
      else if (level === 'chapter' && activeBookId) ContentManagementService.deleteChapter(activeBookId, id);
      else if (level === 'topic' && activeBookId && activeChapterId) ContentManagementService.deleteTopic(activeBookId, activeChapterId, id);
      else if (level === 'lesson' && activeBookId && activeChapterId && activeTopicId) ContentManagementService.deleteLesson(activeBookId, activeChapterId, activeTopicId, id);

      refreshAllData();
      showToast(`${level.toUpperCase()} successfully deleted.`);
    }
  };

  // Filtered Subject Items
  const filteredSubjects = subjects.filter((s) => {
    const matchBoard = selectedBoard === 'All' || s.boardId === selectedBoard || s.boardId.includes(selectedBoard);
    const matchClass = selectedClass === 'All' || s.classLevel === selectedClass;
    const matchMedium = selectedMedium === 'All' || s.medium.toLowerCase() === selectedMedium.toLowerCase();
    const matchStatus = selectedStatus === 'All' || s.status === selectedStatus;
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBoard && matchClass && matchMedium && matchStatus && matchSearch;
  });

  // Filtered Books
  const filteredBooks = books.filter((b) => {
    const matchBoard = selectedBoard === 'All' || b.boardId === selectedBoard || b.boardId.includes(selectedBoard);
    const matchClass = selectedClass === 'All' || b.classLevel === selectedClass;
    const matchMedium = selectedMedium === 'All' || b.medium.toLowerCase() === selectedMedium.toLowerCase();
    const matchStatus = selectedStatus === 'All' || b.status === selectedStatus;
    const matchSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.licenseInfo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBoard && matchClass && matchMedium && matchStatus && matchSearch;
  });

  // Active Book for Chapter Drilldown
  const activeBook = books.find((b) => b.id === activeBookId);
  const activeChapter = activeBook?.chapters?.find((c) => c.id === activeChapterId);
  const activeTopic = activeChapter?.topics?.find((t) => t.id === activeTopicId);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-600 text-white shadow-xs">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Content Management System
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                  Dynamic DB
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Hierarchy: Session → Board → Class → Medium → Subject → Book → Chapter → Topic → Lesson
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setIsImportExportOpen(true)}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Import / Export
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="text-xs"
            onClick={() => handleOpenAddModal(currentLevel)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add {currentLevel.toUpperCase()}
          </Button>
        </div>
      </div>

      {/* Legal Copyright Compliance Banner */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-emerald-950 dark:text-emerald-200">
            Legal & Copyright Governance Active:
          </span>
          <span className="text-emerald-800 dark:text-emerald-400 ml-1.5 leading-relaxed">
            All stored curricula, books, and question items are verified under the National Curriculum Framework (NCERT OER, CC BY-NC 4.0, and Public Domain). Copyrighted commercial publications are strictly restricted.
          </span>
        </div>
      </div>

      {/* Hierarchy Level Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(
          [
            { id: 'session', label: '1. Sessions', icon: <Calendar className="w-3.5 h-3.5" />, count: sessions.length },
            { id: 'board', label: '2. Boards', icon: <GraduationCap className="w-3.5 h-3.5" />, count: boards.length },
            { id: 'class', label: '3. Classes', icon: <Layers className="w-3.5 h-3.5" />, count: classes.length },
            { id: 'medium', label: '4. Mediums', icon: <Languages className="w-3.5 h-3.5" />, count: mediums.length },
            { id: 'subject', label: '5. Subjects', icon: <BookOpen className="w-3.5 h-3.5" />, count: subjects.length },
            { id: 'book', label: '6. Books', icon: <BookOpen className="w-3.5 h-3.5" />, count: books.length },
            { id: 'chapter', label: '7. Chapters', icon: <FileText className="w-3.5 h-3.5" />, count: books.reduce((acc, b) => acc + (b.chapters?.length || 0), 0) },
            { id: 'topic', label: '8. Topics', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'lesson', label: '9. Lessons', icon: <FileText className="w-3.5 h-3.5" /> },
          ] as { id: HierarchyLevel; label: string; icon: React.ReactNode; count?: number }[]
        ).map((tab) => {
          const isActive = currentLevel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectLevel(tab.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-2xs ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Breadcrumb Navigator */}
      <CmsHierarchyBreadcrumb
        items={drilldownChain}
        currentLevel={currentLevel}
        onSelectLevel={handleSelectLevel}
        onReset={handleResetHierarchy}
      />

      {/* Multi-Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${currentLevel}s by title, code, author or license...`}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Board Filter */}
          <div>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="All">All Boards (CBSE/ICSE/State)</option>
              {ALL_BOARDS_LIST.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="All">All Classes (1 to 12)</option>
              {ALL_CLASSES_LIST.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active / Published</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SESSIONS VIEW */}
      {/* ------------------------------------------------------------- */}
      {currentLevel === 'session' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Academic Sessions & Cycles ({sessions.length})
            </h3>
            <Button size="sm" variant="primary" onClick={() => handleOpenAddModal('session')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Session
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-4 rounded-3xl border bg-white dark:bg-slate-900 space-y-3 transition-all ${
                  sess.isCurrent
                    ? 'border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge variant={sess.isCurrent ? 'indigo' : 'slate'}>
                    {sess.isCurrent ? 'Current Active' : sess.status}
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-400">{sess.academicYear}</span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{sess.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sess.description}</p>
                </div>

                <div className="text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
                  <span>{sess.startDate} to {sess.endDate}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(sess, 'session')}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {!sess.isCurrent && (
                      <button
                        onClick={() => handleDeleteItem(sess.id, 'session')}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. BOARDS VIEW */}
      {/* ------------------------------------------------------------- */}
      {currentLevel === 'board' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Education Boards & Councils ({boards.length})
            </h3>
            <Button size="sm" variant="primary" onClick={() => handleOpenAddModal('board')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Board
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {boards.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                    {b.code}
                  </span>
                  <Badge variant={b.status === 'active' ? 'emerald' : 'amber'}>{b.status}</Badge>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{b.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{b.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => handleSelectLevel('board', b.id)}
                    className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
                  >
                    <span>View Curriculum</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(b, 'board')}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(b.id, 'board')}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. SUBJECTS VIEW */}
      {/* ------------------------------------------------------------- */}
      {currentLevel === 'subject' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Subject Syllabi ({filteredSubjects.length} of {subjects.length})
            </h3>
            <Button size="sm" variant="primary" onClick={() => handleOpenAddModal('subject')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Subject
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSubjects.map((subj) => (
              <div
                key={subj.id}
                className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="indigo">Class {subj.classLevel}</Badge>
                    <Badge variant="slate">{subj.medium}</Badge>
                    <Badge variant="slate">{subj.boardId || 'CBSE'}</Badge>
                  </div>
                  <Badge variant={subj.status === 'active' ? 'emerald' : 'amber'}>{subj.status}</Badge>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{subj.name}</h4>
                    <span className="text-[11px] font-mono text-slate-400">Code: {subj.code}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{subj.description || `${subj.category} syllabus curriculum.`}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => {
                      setSelectedClass(subj.classLevel);
                      handleSelectLevel('book');
                    }}
                    className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
                  >
                    <span>Inspect Textbooks</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(subj, 'subject')}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(subj.id, 'subject')}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. BOOKS VIEW */}
      {/* ------------------------------------------------------------- */}
      {currentLevel === 'book' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Textbooks Repository ({filteredBooks.length} of {books.length})
            </h3>
            <Button size="sm" variant="primary" onClick={() => handleOpenAddModal('book')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Textbook
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="indigo">Class {book.classLevel}</Badge>
                      <Badge variant="slate">{book.subjectName}</Badge>
                      <Badge variant="slate">{book.medium}</Badge>
                    </div>
                    <button
                      onClick={() => handleTogglePublish(book, 'book')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                        book.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {book.status === 'published' ? '● Published' : '○ Draft'}
                    </button>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-14 rounded-xl bg-gradient-to-br ${
                        book.coverGradient || 'from-indigo-600 to-purple-600'
                      } flex items-center justify-center text-white font-black text-xs shrink-0 shadow-2xs`}
                    >
                      {book.subjectName?.slice(0, 2).toUpperCase() || 'BK'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {book.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        By {book.author || 'NCERT Committee'} • {book.chapters?.length || 0} Chapters
                      </p>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-1">
                        {book.licenseInfo}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveBookId(book.id);
                        handleSelectLevel('chapter', book.id);
                      }}
                      className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
                    >
                      <span>Drilldown Chapters ({book.chapters?.length || 0})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewPayload({ type: 'book', data: book })}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Preview Textbook"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(book, 'book')}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Textbook"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(book.id, 'book')}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Delete Textbook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. CHAPTERS DRILLDOWN VIEW */}
      {/* ------------------------------------------------------------- */}
      {currentLevel === 'chapter' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Active Textbook Drilldown
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {activeBook?.title || 'Selected Book'}
              </h3>
              <p className="text-xs text-slate-500">
                Class {activeBook?.classLevel} • {activeBook?.subjectName} • {activeBook?.chapters?.length || 0} Total Chapters
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => handleOpenAddModal('chapter')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Chapter
            </Button>
          </div>

          <div className="space-y-2.5">
            {(activeBook?.chapters || []).map((ch) => (
              <div
                key={ch.id}
                className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-xs transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {ch.number}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ch.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ch.description}</p>
                    <span className="text-[11px] text-slate-400">{ch.topics?.length || 0} Topics included</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      setActiveChapterId(ch.id);
                      handleSelectLevel('topic');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                  >
                    <span>View Topics ({ch.topics?.length || 0})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setPreviewPayload({ type: 'chapter', data: ch })}
                    className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Preview Chapter"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(ch, 'chapter')}
                    className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit Chapter"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(ch.id, 'chapter')}
                    className="p-2 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete Chapter"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. TOPICS & LESSONS DRILLDOWN */}
      {/* ------------------------------------------------------------- */}
      {currentLevel === 'topic' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Chapter Topics & Sub-topics
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {activeChapter?.title || 'Selected Chapter'}
              </h3>
              <p className="text-xs text-slate-500">
                Book: {activeBook?.title || 'Textbook'}
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => handleOpenAddModal('topic')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Topic
            </Button>
          </div>

          <div className="space-y-2.5">
            {(activeChapter?.topics || []).map((tp) => (
              <div
                key={tp.id}
                className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{tp.title}</h4>
                    <Badge variant="indigo" className="text-[10px]">{tp.difficulty || 'Medium'}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{tp.summary}</p>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      setActiveTopicId(tp.id);
                      handleSelectLevel('lesson');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                  >
                    <span>Lessons ({tp.lessons?.length || 0})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewPayload({ type: 'topic', data: tp })}
                    className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Preview Topic"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(tp, 'topic')}
                    className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit Topic"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(tp.id, 'topic')}
                    className="p-2 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete Topic"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. LESSONS VIEW */}
      {/* ------------------------------------------------------------- */}
      {currentLevel === 'lesson' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Lessons & Interactive Markdown Modules
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {activeTopic?.title || 'Selected Topic'}
              </h3>
            </div>
            <Button size="sm" variant="primary" onClick={() => handleOpenAddModal('lesson')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Lesson
            </Button>
          </div>

          <div className="space-y-2.5">
            {(activeTopic?.lessons || []).map((ls) => (
              <div
                key={ls.id}
                className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ls.title}</h4>
                    <Badge variant="indigo">{ls.contentType}</Badge>
                    <span className="text-xs text-slate-500">{ls.estimatedMinutes || 8} mins</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => setPreviewPayload({ type: 'lesson', data: ls })}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Markdown</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(ls, 'lesson')}
                    className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit Lesson"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(ls.id, 'lesson')}
                    className="p-2 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete Lesson"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CMS MODALS & DRAWERS */}
      {/* ------------------------------------------------------------- */}
      <CmsEntityFormModal
        isOpen={isFormModalOpen}
        level={formLevel}
        initialData={editingItem}
        contextParams={{
          sessionId: selectedSession,
          boardId: selectedBoard !== 'All' ? selectedBoard : 'CBSE',
          classLevel: (selectedClass !== 'All' ? selectedClass : '10') as ClassLevel,
          medium: selectedMedium !== 'All' ? selectedMedium : 'English',
          bookId: activeBookId || undefined,
          chapterId: activeChapterId || undefined,
          topicId: activeTopicId || undefined,
        }}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingItem(null);
        }}
        onSaveSuccess={(item) => {
          setIsFormModalOpen(false);
          setEditingItem(null);
          refreshAllData();
          showToast(`Saved ${formLevel.toUpperCase()} successfully!`);
        }}
      />

      <CmsPreviewModal
        payload={previewPayload}
        onClose={() => setPreviewPayload(null)}
      />

      <CmsImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onImportSuccess={(cnt) => {
          refreshAllData();
          showToast(`Imported ${cnt} curriculum records!`);
        }}
      />
    </div>
  );
};
