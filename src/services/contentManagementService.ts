import {
  HierarchyLevel,
  AcademicSession,
  CurriculumBoard,
  CurriculumClass,
  CurriculumMedium,
  CurriculumSubject,
  CurriculumBook,
  CurriculumChapter,
  CurriculumTopic,
  CurriculumLesson,
  ContentValidationResult,
  ContentExportData,
  AdminQuestionRecord,
  AdminQuizRecord,
  AdminExamRecord,
  ClassLevel,
  BoardType,
} from '../types';
import { StorageService } from './storageService';
import { AdminService } from './adminService';

const CMS_STORAGE_KEYS = {
  SESSIONS: 'eduai_cms_sessions_list',
  BOARDS: 'eduai_cms_boards_list',
  CLASSES: 'eduai_cms_classes_list',
  MEDIUMS: 'eduai_cms_mediums_list',
  SUBJECTS: 'eduai_cms_subjects_list',
  BOOKS: 'eduai_cms_books_list',
  CHAPTERS: 'eduai_cms_chapters_list',
  TOPICS: 'eduai_cms_topics_list',
  LESSONS: 'eduai_cms_lessons_list',
  QUESTIONS: 'eduai_cms_questions_master',
  QUIZZES: 'eduai_cms_quizzes_master',
  EXAMS: 'eduai_cms_exams_master',
};

// Initial Seed Data - Academic Sessions
const INITIAL_SESSIONS: AcademicSession[] = [
  {
    id: 'sess-2026-2027',
    name: 'Academic Session 2026–2027',
    academicYear: '2026-2027',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    isCurrent: true,
    status: 'active',
    description: 'Current active session following NEP 2020 & NCF-SE national curriculum standards.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'sess-2025-2026',
    name: 'Academic Session 2025–2026',
    academicYear: '2025-2026',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    isCurrent: false,
    status: 'archived',
    description: 'Previous academic cycle curriculum and exam papers archive.',
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2026-03-31T00:00:00Z',
  },
  {
    id: 'sess-2027-2028',
    name: 'Academic Session 2027–2028',
    academicYear: '2027-2028',
    startDate: '2027-04-01',
    endDate: '2028-03-31',
    isCurrent: false,
    status: 'upcoming',
    description: 'Draft curriculum and pilot test series for upcoming national session.',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
];

// Initial Seed Data - Boards
const INITIAL_BOARDS: CurriculumBoard[] = [
  {
    id: 'board-cbse',
    sessionId: 'sess-2026-2027',
    name: 'CBSE - Central Board of Secondary Education',
    code: 'CBSE',
    country: 'India',
    status: 'active',
    description: 'National curriculum standard following NCERT syllabus across India.',
    websiteUrl: 'https://cbse.gov.in',
    orderIndex: 1,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'board-icse',
    sessionId: 'sess-2026-2027',
    name: 'ICSE / CISCE - Council for the Indian School Certificate',
    code: 'ICSE',
    country: 'India',
    status: 'active',
    description: 'Comprehensive curriculum with focus on English, Sciences, and Humanities.',
    websiteUrl: 'https://cisce.org',
    orderIndex: 2,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'board-up',
    sessionId: 'sess-2026-2027',
    name: 'UP Board (Madhyamik Shiksha Parishad)',
    code: 'UP Board',
    country: 'India',
    status: 'active',
    description: 'Uttar Pradesh State Board curriculum with dual Hindi/English medium support.',
    websiteUrl: 'https://upmsp.edu.in',
    orderIndex: 3,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'board-bihar',
    sessionId: 'sess-2026-2027',
    name: 'BSEB - Bihar School Examination Board',
    code: 'Bihar Board',
    country: 'India',
    status: 'active',
    description: 'State Board curriculum aligned with SCERT and NCERT pattern.',
    websiteUrl: 'https://biharboardonline.bihar.gov.in',
    orderIndex: 4,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'board-mh',
    sessionId: 'sess-2026-2027',
    name: 'MSBSHSE - Maharashtra State Board',
    code: 'Maharashtra Board',
    country: 'India',
    status: 'active',
    description: 'Maharashtra Secondary and Higher Secondary Education Board.',
    websiteUrl: 'https://mahahsscboard.in',
    orderIndex: 5,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'board-state',
    sessionId: 'sess-2026-2027',
    name: 'State Boards & Other Regional Curricula',
    code: 'State Boards',
    country: 'India',
    status: 'active',
    description: 'Universal state curricula supporting multilingual education and regional syllabi.',
    orderIndex: 6,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
];

// Initial Seed Data - Classes (1 to 12)
const INITIAL_CLASSES: CurriculumClass[] = [
  { id: 'cls-1', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '1', name: 'Class 1', stage: 'Primary', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'cls-2', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '2', name: 'Class 2', stage: 'Primary', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'cls-3', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '3', name: 'Class 3', stage: 'Primary', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'cls-4', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '4', name: 'Class 4', stage: 'Primary', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'cls-5', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '5', name: 'Class 5', stage: 'Primary', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'cls-6', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '6', name: 'Class 6', stage: 'Middle', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'cls-7', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '7', name: 'Class 7', stage: 'Middle', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'cls-8', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '8', name: 'Class 8', stage: 'Middle', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'cls-9', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '9', name: 'Class 9', stage: 'Secondary', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'cls-10', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '10', name: 'Class 10 (Secondary Board)', stage: 'Secondary', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'cls-11', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '11', name: 'Class 11 (Higher Secondary)', stage: 'Senior Secondary', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'cls-12', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '12', name: 'Class 12 (Senior Board)', stage: 'Senior Secondary', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
];

// Initial Seed Data - Mediums
const INITIAL_MEDIUMS: CurriculumMedium[] = [
  { id: 'med-en', name: 'English', code: 'EN', status: 'active', description: 'Standard English medium textbooks and curriculum' },
  { id: 'med-hi', name: 'Hindi', code: 'HI', status: 'active', description: 'Hindi medium (हिंदी माध्यम) syllabus and e-books' },
  { id: 'med-hin', name: 'Hinglish', code: 'HIN', status: 'active', description: 'Bilingual conceptual explanations and study aids' },
  { id: 'med-oth', name: 'Other', code: 'OTH', status: 'active', description: 'Regional language medium extensions' },
];

// Initial Seed Data - Subjects
const INITIAL_SUBJECTS: CurriculumSubject[] = [
  { id: 'subj-10-sci', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '10', medium: 'English', name: 'Science', code: '086', category: 'Core', color: 'indigo', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'subj-10-mat', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '10', medium: 'English', name: 'Mathematics', code: '041', category: 'Core', color: 'emerald', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'subj-10-sst', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '10', medium: 'English', name: 'Social Science', code: '087', category: 'Core', color: 'amber', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'subj-10-eng', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '10', medium: 'English', name: 'English Language & Literature', code: '184', category: 'Language', color: 'rose', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'subj-10-hin', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '10', medium: 'Hindi', name: 'Hindi (हिंदी)', code: '002', category: 'Language', color: 'orange', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'subj-12-phy', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '12', medium: 'English', name: 'Physics', code: '042', category: 'Core', color: 'purple', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'subj-12-che', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '12', medium: 'English', name: 'Chemistry', code: '043', category: 'Core', color: 'teal', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'subj-12-mat', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '12', medium: 'English', name: 'Mathematics', code: '041', category: 'Core', color: 'emerald', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'subj-12-bio', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '12', medium: 'English', name: 'Biology', code: '044', category: 'Core', color: 'emerald', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
  { id: 'subj-12-cs', boardId: 'board-cbse', sessionId: 'sess-2026-2027', classLevel: '12', medium: 'English', name: 'Computer Science', code: '083', category: 'Elective', color: 'blue', status: 'active', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-08-15T00:00:00Z' },
];

// Initial Seed Data - Books with Legal Copyright Authorization
const INITIAL_BOOKS: CurriculumBook[] = [
  {
    id: 'bk-cbse-10-en-science-main',
    sessionId: 'sess-2026-2027',
    boardId: 'board-cbse',
    classLevel: '10',
    medium: 'English',
    subjectId: 'science',
    subjectName: 'Science',
    title: 'NCERT Science (Class 10)',
    author: 'NCERT Textbook Committee',
    publisher: 'National Council of Educational Research and Training',
    editionBadge: '2026 Revised Edition',
    description: 'Official NCERT Class 10 Science textbook covering Chemical Reactions, Life Processes, Light, Electricity and Natural Resources.',
    licenseInfo: 'NCERT Open Educational Resource (OER) - CC BY-NC 4.0 / Public Curriculum',
    isAuthorized: true,
    copyrightDisclaimer: 'Content used strictly in accordance with Open Curriculum and educational Fair Use guidelines for student learning.',
    status: 'published',
    coverGradient: 'from-indigo-600 via-purple-600 to-pink-600',
    totalPages: 280,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
    chapters: [
      {
        id: 'ch-sci-10-1',
        bookId: 'bk-cbse-10-en-science-main',
        number: 1,
        title: 'Chemical Reactions and Equations',
        description: 'Writing chemical equations, balancing reactions, combination, decomposition, displacement, and redox reactions.',
        topics: [
          {
            id: 'tp-sci-10-1-1',
            chapterId: 'ch-sci-10-1',
            title: 'Chemical Equations and Balancing',
            summary: 'Representation of chemical changes using formulas and conserving mass.',
            difficulty: 'Medium',
            masteryLevel: 0,
            lessons: [
              {
                id: 'ls-sci-10-1-1-1',
                topicId: 'tp-sci-10-1-1',
                title: 'Introduction to Chemical Changes',
                contentType: 'text',
                contentMarkdown: '# Chemical Reactions & Equations\n\nWhenever a chemical change occurs, we say that a **chemical reaction** has taken place.\n\n### Characteristics of Chemical Reactions:\n1. Change in state\n2. Change in colour\n3. Evolution of a gas\n4. Change in temperature\n\n$$\\text{Law of Conservation of Mass: Mass of Reactants} = \\text{Mass of Products}$$',
                estimatedMinutes: 8,
                isCompleted: false,
              },
            ],
          },
          {
            id: 'tp-sci-10-1-2',
            chapterId: 'ch-sci-10-1',
            title: 'Types of Chemical Reactions',
            summary: 'Combination, Decomposition, Single Displacement, Double Displacement, Oxidation and Reduction.',
            difficulty: 'Medium',
            masteryLevel: 0,
            lessons: [
              {
                id: 'ls-sci-10-1-1-2',
                topicId: 'tp-sci-10-1-2',
                title: 'Redox and Precipitation Reactions',
                contentType: 'ai-explained',
                contentMarkdown: '### Redox Reactions\n\n- **Oxidation**: Addition of oxygen or removal of hydrogen.\n- **Reduction**: Addition of hydrogen or removal of oxygen.\n\n$$\\text{CuO} + \\text{H}_2 \\xrightarrow{\\Delta} \\text{Cu} + \\text{H}_2\\text{O}$$\n\nHere, $\\text{CuO}$ is reduced to $\\text{Cu}$, and $\\text{H}_2$ is oxidized to $\\text{H}_2\\text{O}$.',
                estimatedMinutes: 10,
                isCompleted: false,
              },
            ],
          },
        ],
      },
      {
        id: 'ch-sci-10-2',
        bookId: 'bk-cbse-10-en-science-main',
        number: 2,
        title: 'Acids, Bases and Salts',
        description: 'Indicators, properties of acids and bases, pH scale, salts and their industrial applications.',
        topics: [
          {
            id: 'tp-sci-10-2-1',
            chapterId: 'ch-sci-10-2',
            title: 'Understanding Acids and Bases',
            summary: 'Chemical properties of acids, bases, and neutralization reactions.',
            difficulty: 'Medium',
            masteryLevel: 0,
            lessons: [],
          },
        ],
      },
      {
        id: 'ch-sci-10-6',
        bookId: 'bk-cbse-10-en-science-main',
        number: 6,
        title: 'Life Processes',
        description: 'Nutrition, respiration, transportation, and excretion in plants and human beings.',
        topics: [
          {
            id: 'tp-sci-10-6-1',
            chapterId: 'ch-sci-10-6',
            title: 'Autotrophic & Heterotrophic Nutrition',
            summary: 'Photosynthesis mechanism and human digestive system organs.',
            difficulty: 'Medium',
            masteryLevel: 0,
            lessons: [],
          },
        ],
      },
      {
        id: 'ch-sci-10-10',
        bookId: 'bk-cbse-10-en-science-main',
        number: 10,
        title: 'Light – Reflection and Refraction',
        description: 'Spherical mirrors, lenses, mirror formula, lens formula, and refractive index calculation.',
        topics: [
          {
            id: 'tp-sci-10-10-1',
            chapterId: 'ch-sci-10-10',
            title: 'Spherical Mirrors and Ray Diagrams',
            summary: 'Concave and convex mirrors ray diagrams, focal length and magnification.',
            difficulty: 'Hard',
            masteryLevel: 0,
            lessons: [],
          },
        ],
      },
      {
        id: 'ch-sci-10-12',
        bookId: 'bk-cbse-10-en-science-main',
        number: 12,
        title: 'Electricity',
        description: 'Ohm’s Law, electric current, potential difference, resistance in series and parallel, electric power.',
        topics: [
          {
            id: 'tp-sci-10-12-1',
            chapterId: 'ch-sci-10-12',
            title: 'Ohm’s Law and Resistance Circuits',
            summary: 'V = I * R relationship, factors affecting resistance, series vs parallel calculations.',
            difficulty: 'Hard',
            masteryLevel: 0,
            lessons: [],
          },
        ],
      },
    ],
  },
  {
    id: 'bk-cbse-10-en-math-main',
    sessionId: 'sess-2026-2027',
    boardId: 'board-cbse',
    classLevel: '10',
    medium: 'English',
    subjectId: 'mathematics',
    subjectName: 'Mathematics',
    title: 'NCERT Mathematics (Class 10)',
    author: 'NCERT Mathematics Faculty',
    publisher: 'National Council of Educational Research and Training',
    editionBadge: '2026 Standard Edition',
    description: 'Class 10 standard Mathematics textbook including Real Numbers, Polynomials, Quadratic Equations, Trigonometry, and Statistics.',
    licenseInfo: 'NCERT Open Educational Resource (OER) - CC BY-NC 4.0',
    isAuthorized: true,
    copyrightDisclaimer: 'Legally authorized NCERT public curriculum distribution.',
    status: 'published',
    coverGradient: 'from-blue-600 via-teal-600 to-emerald-600',
    totalPages: 320,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
    chapters: [
      {
        id: 'ch-mat-10-1',
        bookId: 'bk-cbse-10-en-math-main',
        number: 1,
        title: 'Real Numbers',
        description: 'Fundamental Theorem of Arithmetic, revisiting irrational numbers, and proofs.',
        topics: [
          {
            id: 'tp-mat-10-1-1',
            chapterId: 'ch-mat-10-1',
            title: 'Fundamental Theorem of Arithmetic',
            summary: 'Every composite number can be uniquely expressed as a product of primes.',
            difficulty: 'Easy',
            masteryLevel: 0,
            lessons: [],
          },
        ],
      },
      {
        id: 'ch-mat-10-4',
        bookId: 'bk-cbse-10-en-math-main',
        number: 4,
        title: 'Quadratic Equations',
        description: 'Standard form, factorization method, completing square, quadratic formula, nature of roots.',
        topics: [
          {
            id: 'tp-mat-10-4-1',
            chapterId: 'ch-mat-10-4',
            title: 'Quadratic Formula and Nature of Roots',
            summary: 'Discriminant D = b^2 - 4ac and roots nature classification.',
            difficulty: 'Medium',
            masteryLevel: 0,
            lessons: [],
          },
        ],
      },
      {
        id: 'ch-mat-10-8',
        bookId: 'bk-cbse-10-en-math-main',
        number: 8,
        title: 'Introduction to Trigonometry',
        description: 'Trigonometric ratios, values for specific angles (30, 45, 60), and trigonometric identities.',
        topics: [
          {
            id: 'tp-mat-10-8-1',
            chapterId: 'ch-mat-10-8',
            title: 'Trigonometric Ratios & Standard Identities',
            summary: 'sin^2 θ + cos^2 θ = 1, sec^2 θ - tan^2 θ = 1, cosec^2 θ - cot^2 θ = 1.',
            difficulty: 'Hard',
            masteryLevel: 0,
            lessons: [],
          },
        ],
      },
    ],
  },
];

export class ContentManagementService {
  // -------------------------------------------------------------
  // INITIALIZATION & CACHE
  // -------------------------------------------------------------
  private static getStored<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        this.setStored(key, fallback);
        return fallback;
      }
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private static setStored<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error(`[CMS Storage] Failed to store ${key}:`, err);
    }
  }

  private static checkAuth(actionName: string): boolean {
    const isAuth = AdminService.isAuthenticated();
    if (!isAuth) {
      console.warn(`[CMS Security] Blocked unauthorized attempt for action: ${actionName}`);
    }
    return isAuth;
  }

  // -------------------------------------------------------------
  // SESSIONS CRUD
  // -------------------------------------------------------------
  static getSessions(): AcademicSession[] {
    return this.getStored<AcademicSession[]>(CMS_STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
  }

  static getSessionById(id: string): AcademicSession | undefined {
    return this.getSessions().find((s) => s.id === id);
  }

  static saveSession(session: Partial<AcademicSession>): { success: boolean; session?: AcademicSession; errors?: string[] } {
    if (!this.checkAuth('saveSession')) {
      return { success: false, errors: ['Unauthorized: Admin authentication required'] };
    }

    const validation = this.validateSession(session);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors.map((e) => e.message) };
    }

    const list = this.getSessions();
    const existingIndex = list.findIndex((s) => s.id === session.id);
    const now = new Date().toISOString();

    let saved: AcademicSession;

    if (existingIndex >= 0) {
      saved = {
        ...list[existingIndex],
        ...session,
        updatedAt: now,
      } as AcademicSession;
      list[existingIndex] = saved;
    } else {
      saved = {
        id: session.id || `sess-${Date.now()}`,
        name: session.name || 'New Session',
        academicYear: session.academicYear || '2026-2027',
        startDate: session.startDate || '2026-04-01',
        endDate: session.endDate || '2027-03-31',
        isCurrent: session.isCurrent ?? false,
        status: session.status || 'active',
        description: session.description || '',
        createdAt: now,
        updatedAt: now,
      };
      list.push(saved);
    }

    // If marked current, unset others
    if (saved.isCurrent) {
      list.forEach((s) => {
        if (s.id !== saved.id) s.isCurrent = false;
      });
    }

    this.setStored(CMS_STORAGE_KEYS.SESSIONS, list);
    AdminService.logAudit('Principal Admin', 'Session Saved', 'curriculum', `Saved session: ${saved.name}`);
    return { success: true, session: saved };
  }

  static deleteSession(id: string): { success: boolean; error?: string } {
    if (!this.checkAuth('deleteSession')) return { success: false, error: 'Unauthorized' };
    const list = this.getSessions();
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length === list.length) return { success: false, error: 'Session not found' };
    this.setStored(CMS_STORAGE_KEYS.SESSIONS, filtered);
    AdminService.logAudit('Principal Admin', 'Session Deleted', 'curriculum', `Deleted session ID: ${id}`);
    return { success: true };
  }

  // -------------------------------------------------------------
  // BOARDS CRUD
  // -------------------------------------------------------------
  static getBoards(sessionId?: string): CurriculumBoard[] {
    const list = this.getStored<CurriculumBoard[]>(CMS_STORAGE_KEYS.BOARDS, INITIAL_BOARDS);
    if (sessionId && sessionId !== 'All') {
      return list.filter((b) => !b.sessionId || b.sessionId === sessionId);
    }
    return list;
  }

  static getBoardById(id: string): CurriculumBoard | undefined {
    return this.getBoards().find((b) => b.id === id);
  }

  static saveBoard(board: Partial<CurriculumBoard>): { success: boolean; board?: CurriculumBoard; errors?: string[] } {
    if (!this.checkAuth('saveBoard')) return { success: false, errors: ['Unauthorized'] };
    const validation = this.validateBoard(board);
    if (!validation.isValid) return { success: false, errors: validation.errors.map((e) => e.message) };

    const list = this.getBoards();
    const existingIndex = list.findIndex((b) => b.id === board.id);
    const now = new Date().toISOString();

    let saved: CurriculumBoard;
    if (existingIndex >= 0) {
      saved = { ...list[existingIndex], ...board, updatedAt: now } as CurriculumBoard;
      list[existingIndex] = saved;
    } else {
      saved = {
        id: board.id || `board-${board.code?.toLowerCase().replace(/[^a-z0-9]/g, '') || Date.now()}`,
        sessionId: board.sessionId || 'sess-2026-2027',
        name: board.name || 'New Board',
        code: board.code || 'BOARD',
        country: board.country || 'India',
        status: board.status || 'active',
        description: board.description || '',
        websiteUrl: board.websiteUrl || '',
        orderIndex: board.orderIndex || list.length + 1,
        createdAt: now,
        updatedAt: now,
      };
      list.push(saved);
    }

    this.setStored(CMS_STORAGE_KEYS.BOARDS, list);
    AdminService.logAudit('Principal Admin', 'Board Saved', 'curriculum', `Saved board: ${saved.code}`);
    return { success: true, board: saved };
  }

  static deleteBoard(id: string): { success: boolean; error?: string } {
    if (!this.checkAuth('deleteBoard')) return { success: false, error: 'Unauthorized' };
    const list = this.getBoards();
    const filtered = list.filter((b) => b.id !== id);
    this.setStored(CMS_STORAGE_KEYS.BOARDS, filtered);
    AdminService.logAudit('Principal Admin', 'Board Deleted', 'curriculum', `Deleted board ID: ${id}`);
    return { success: true };
  }

  // -------------------------------------------------------------
  // CLASSES CRUD
  // -------------------------------------------------------------
  static getClasses(boardId?: string, sessionId?: string): CurriculumClass[] {
    let list = this.getStored<CurriculumClass[]>(CMS_STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    if (boardId && boardId !== 'All') {
      list = list.filter((c) => !c.boardId || c.boardId === boardId);
    }
    if (sessionId && sessionId !== 'All') {
      list = list.filter((c) => !c.sessionId || c.sessionId === sessionId);
    }
    return list;
  }

  static getClassById(id: string): CurriculumClass | undefined {
    return this.getClasses().find((c) => c.id === id);
  }

  static saveClass(cls: Partial<CurriculumClass>): { success: boolean; classItem?: CurriculumClass; errors?: string[] } {
    if (!this.checkAuth('saveClass')) return { success: false, errors: ['Unauthorized'] };
    const validation = this.validateClass(cls);
    if (!validation.isValid) return { success: false, errors: validation.errors.map((e) => e.message) };

    const list = this.getClasses();
    const existingIndex = list.findIndex((c) => c.id === cls.id);
    const now = new Date().toISOString();

    let saved: CurriculumClass;
    if (existingIndex >= 0) {
      saved = { ...list[existingIndex], ...cls, updatedAt: now } as CurriculumClass;
      list[existingIndex] = saved;
    } else {
      const lvl = cls.classLevel || '10';
      const numLvl = parseInt(lvl, 10);
      let stage: CurriculumClass['stage'] = 'Secondary';
      if (numLvl <= 5) stage = 'Primary';
      else if (numLvl <= 8) stage = 'Middle';
      else if (numLvl >= 11) stage = 'Senior Secondary';

      saved = {
        id: cls.id || `cls-${lvl}`,
        boardId: cls.boardId || 'board-cbse',
        sessionId: cls.sessionId || 'sess-2026-2027',
        classLevel: lvl,
        name: cls.name || `Class ${lvl}`,
        stage: cls.stage || stage,
        status: cls.status || 'active',
        description: cls.description || '',
        createdAt: now,
        updatedAt: now,
      };
      list.push(saved);
    }

    this.setStored(CMS_STORAGE_KEYS.CLASSES, list);
    AdminService.logAudit('Principal Admin', 'Class Saved', 'curriculum', `Saved class: ${saved.name}`);
    return { success: true, classItem: saved };
  }

  static deleteClass(id: string): { success: boolean; error?: string } {
    if (!this.checkAuth('deleteClass')) return { success: false, error: 'Unauthorized' };
    const list = this.getClasses();
    const filtered = list.filter((c) => c.id !== id);
    this.setStored(CMS_STORAGE_KEYS.CLASSES, filtered);
    AdminService.logAudit('Principal Admin', 'Class Deleted', 'curriculum', `Deleted class ID: ${id}`);
    return { success: true };
  }

  // -------------------------------------------------------------
  // MEDIUMS CRUD
  // -------------------------------------------------------------
  static getMediums(): CurriculumMedium[] {
    return this.getStored<CurriculumMedium[]>(CMS_STORAGE_KEYS.MEDIUMS, INITIAL_MEDIUMS);
  }

  static saveMedium(med: Partial<CurriculumMedium>): { success: boolean; medium?: CurriculumMedium; errors?: string[] } {
    if (!this.checkAuth('saveMedium')) return { success: false, errors: ['Unauthorized'] };
    if (!med.name?.trim()) return { success: false, errors: ['Medium name is required'] };

    const list = this.getMediums();
    const existingIndex = list.findIndex((m) => m.id === med.id);
    let saved: CurriculumMedium;

    if (existingIndex >= 0) {
      saved = { ...list[existingIndex], ...med } as CurriculumMedium;
      list[existingIndex] = saved;
    } else {
      saved = {
        id: med.id || `med-${Date.now()}`,
        name: med.name.trim(),
        code: med.code || med.name.slice(0, 3).toUpperCase(),
        status: med.status || 'active',
        description: med.description || '',
      };
      list.push(saved);
    }

    this.setStored(CMS_STORAGE_KEYS.MEDIUMS, list);
    AdminService.logAudit('Principal Admin', 'Medium Saved', 'curriculum', `Saved medium: ${saved.name}`);
    return { success: true, medium: saved };
  }

  static deleteMedium(id: string): { success: boolean; error?: string } {
    if (!this.checkAuth('deleteMedium')) return { success: false, error: 'Unauthorized' };
    const list = this.getMediums();
    const filtered = list.filter((m) => m.id !== id);
    this.setStored(CMS_STORAGE_KEYS.MEDIUMS, filtered);
    AdminService.logAudit('Principal Admin', 'Medium Deleted', 'curriculum', `Deleted medium ID: ${id}`);
    return { success: true };
  }

  // -------------------------------------------------------------
  // SUBJECTS CRUD
  // -------------------------------------------------------------
  static getSubjects(filters?: { boardId?: string; classLevel?: string; medium?: string; sessionId?: string }): CurriculumSubject[] {
    let list = this.getStored<CurriculumSubject[]>(CMS_STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    if (filters?.boardId && filters.boardId !== 'All') {
      list = list.filter((s) => !s.boardId || s.boardId === filters.boardId);
    }
    if (filters?.classLevel && filters.classLevel !== 'All') {
      list = list.filter((s) => s.classLevel === filters.classLevel);
    }
    if (filters?.medium && filters.medium !== 'All') {
      list = list.filter((s) => s.medium.toLowerCase() === filters.medium?.toLowerCase());
    }
    if (filters?.sessionId && filters.sessionId !== 'All') {
      list = list.filter((s) => !s.sessionId || s.sessionId === filters.sessionId);
    }
    return list;
  }

  static getSubjectById(id: string): CurriculumSubject | undefined {
    return this.getSubjects().find((s) => s.id === id);
  }

  static saveSubject(subj: Partial<CurriculumSubject>): { success: boolean; subject?: CurriculumSubject; errors?: string[] } {
    if (!this.checkAuth('saveSubject')) return { success: false, errors: ['Unauthorized'] };
    const validation = this.validateSubject(subj);
    if (!validation.isValid) return { success: false, errors: validation.errors.map((e) => e.message) };

    const list = this.getSubjects();
    const existingIndex = list.findIndex((s) => s.id === subj.id);
    const now = new Date().toISOString();

    let saved: CurriculumSubject;
    if (existingIndex >= 0) {
      saved = { ...list[existingIndex], ...subj, updatedAt: now } as CurriculumSubject;
      list[existingIndex] = saved;
    } else {
      saved = {
        id: subj.id || `subj-${subj.classLevel || '10'}-${subj.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || Date.now()}`,
        boardId: subj.boardId || 'board-cbse',
        sessionId: subj.sessionId || 'sess-2026-2027',
        classLevel: (subj.classLevel as ClassLevel) || '10',
        medium: subj.medium || 'English',
        name: subj.name || 'New Subject',
        code: subj.code || '001',
        category: subj.category || 'Core',
        description: subj.description || '',
        color: subj.color || 'indigo',
        status: subj.status || 'active',
        createdAt: now,
        updatedAt: now,
      };
      list.push(saved);
    }

    this.setStored(CMS_STORAGE_KEYS.SUBJECTS, list);
    AdminService.logAudit('Principal Admin', 'Subject Saved', 'curriculum', `Saved subject: ${saved.name} (Class ${saved.classLevel})`);
    return { success: true, subject: saved };
  }

  static deleteSubject(id: string): { success: boolean; error?: string } {
    if (!this.checkAuth('deleteSubject')) return { success: false, error: 'Unauthorized' };
    const list = this.getSubjects();
    const filtered = list.filter((s) => s.id !== id);
    this.setStored(CMS_STORAGE_KEYS.SUBJECTS, filtered);
    AdminService.logAudit('Principal Admin', 'Subject Deleted', 'curriculum', `Deleted subject ID: ${id}`);
    return { success: true };
  }

  // -------------------------------------------------------------
  // BOOKS CRUD (with Legal Copyright Authorization Validation)
  // -------------------------------------------------------------
  static getBooks(filters?: {
    boardId?: string;
    classLevel?: string;
    medium?: string;
    subjectId?: string;
    status?: string;
    searchQuery?: string;
  }): CurriculumBook[] {
    let list = this.getStored<CurriculumBook[]>(CMS_STORAGE_KEYS.BOOKS, INITIAL_BOOKS);

    if (filters?.boardId && filters.boardId !== 'All') {
      list = list.filter((b) => !b.boardId || b.boardId === filters.boardId || b.boardId.toLowerCase().includes(filters.boardId.toLowerCase()));
    }
    if (filters?.classLevel && filters.classLevel !== 'All') {
      list = list.filter((b) => b.classLevel === filters.classLevel);
    }
    if (filters?.medium && filters.medium !== 'All') {
      list = list.filter((b) => b.medium.toLowerCase() === filters.medium?.toLowerCase());
    }
    if (filters?.subjectId && filters.subjectId !== 'All') {
      list = list.filter((b) => b.subjectId.toLowerCase() === filters.subjectId?.toLowerCase());
    }
    if (filters?.status && filters.status !== 'All') {
      list = list.filter((b) => b.status === filters.status);
    }
    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.subjectName.toLowerCase().includes(q) ||
          b.licenseInfo.toLowerCase().includes(q)
      );
    }

    return list;
  }

  static getBookById(id: string): CurriculumBook | undefined {
    return this.getBooks().find((b) => b.id === id);
  }

  static saveBook(book: Partial<CurriculumBook>): { success: boolean; book?: CurriculumBook; errors?: string[] } {
    if (!this.checkAuth('saveBook')) return { success: false, errors: ['Unauthorized: Admin access required'] };

    const validation = this.validateBook(book);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors.map((e) => e.message) };
    }

    const list = this.getBooks();
    const existingIndex = list.findIndex((b) => b.id === book.id);
    const now = new Date().toISOString();

    let saved: CurriculumBook;
    if (existingIndex >= 0) {
      saved = {
        ...list[existingIndex],
        ...book,
        updatedAt: now,
      } as CurriculumBook;
      list[existingIndex] = saved;
    } else {
      saved = {
        id: book.id || `bk-custom-${Date.now()}`,
        sessionId: book.sessionId || 'sess-2026-2027',
        boardId: book.boardId || 'board-cbse',
        classLevel: (book.classLevel as ClassLevel) || '10',
        medium: book.medium || 'English',
        subjectId: book.subjectId || 'science',
        subjectName: book.subjectName || 'Science',
        title: book.title || 'Untitled Textbook',
        author: book.author || 'Open Curriculum Author',
        publisher: book.publisher || 'NCERT / Open Educational Resources',
        editionBadge: book.editionBadge || '2026 Edition',
        description: book.description || 'Standard educational textbook.',
        licenseInfo: book.licenseInfo || 'NCERT Open Educational Resource (OER) - CC BY-NC 4.0',
        isAuthorized: book.isAuthorized ?? true,
        copyrightDisclaimer: book.copyrightDisclaimer || 'Authorized educational curriculum content.',
        chapters: book.chapters || [],
        status: book.status || 'published',
        coverGradient: book.coverGradient || 'from-indigo-600 via-purple-600 to-pink-600',
        totalPages: book.totalPages || (book.chapters?.length || 10) * 20,
        createdAt: now,
        updatedAt: now,
      };
      list.push(saved);
    }

    this.setStored(CMS_STORAGE_KEYS.BOOKS, list);
    AdminService.logAudit('Principal Admin', 'Book Saved', 'curriculum', `Saved textbook: ${saved.title} (License: ${saved.licenseInfo})`);
    return { success: true, book: saved };
  }

  static togglePublishBook(id: string): { success: boolean; status?: 'published' | 'draft'; error?: string } {
    if (!this.checkAuth('togglePublishBook')) return { success: false, error: 'Unauthorized' };
    const list = this.getBooks();
    const book = list.find((b) => b.id === id);
    if (!book) return { success: false, error: 'Book not found' };

    book.status = book.status === 'published' ? 'draft' : 'published';
    book.updatedAt = new Date().toISOString();
    this.setStored(CMS_STORAGE_KEYS.BOOKS, list);
    AdminService.logAudit('Principal Admin', 'Book Status Changed', 'curriculum', `Changed status of ${book.title} to ${book.status}`);
    return { success: true, status: book.status };
  }

  static deleteBook(id: string): { success: boolean; error?: string } {
    if (!this.checkAuth('deleteBook')) return { success: false, error: 'Unauthorized' };
    const list = this.getBooks();
    const filtered = list.filter((b) => b.id !== id);
    this.setStored(CMS_STORAGE_KEYS.BOOKS, filtered);
    AdminService.logAudit('Principal Admin', 'Book Deleted', 'curriculum', `Deleted book ID: ${id}`);
    return { success: true };
  }

  // -------------------------------------------------------------
  // CHAPTERS CRUD
  // -------------------------------------------------------------
  static getChapters(bookId?: string): CurriculumChapter[] {
    const books = this.getBooks();
    if (bookId) {
      const book = books.find((b) => b.id === bookId);
      return (book?.chapters || []).map((ch) => ({
        ...ch,
        status: ch.isCompleted ? 'published' : 'published',
      })) as CurriculumChapter[];
    }
    const allChapters: CurriculumChapter[] = [];
    books.forEach((b) => {
      if (b.chapters) {
        b.chapters.forEach((c) => {
          allChapters.push({
            id: c.id,
            bookId: b.id,
            number: c.number,
            title: c.title,
            description: c.description,
            topics: c.topics || [],
            status: 'published',
          });
        });
      }
    });
    return allChapters;
  }

  static saveChapter(bookId: string, chapter: Partial<CurriculumChapter>): { success: boolean; chapter?: CurriculumChapter; errors?: string[] } {
    if (!this.checkAuth('saveChapter')) return { success: false, errors: ['Unauthorized'] };
    const validation = this.validateChapter(chapter);
    if (!validation.isValid) return { success: false, errors: validation.errors.map((e) => e.message) };

    const books = this.getBooks();
    const book = books.find((b) => b.id === bookId);
    if (!book) return { success: false, errors: ['Parent textbook not found'] };

    if (!book.chapters) book.chapters = [];
    const existingIndex = book.chapters.findIndex((c) => c.id === chapter.id);

    let saved: CurriculumChapter;
    if (existingIndex >= 0) {
      book.chapters[existingIndex] = {
        ...book.chapters[existingIndex],
        ...chapter,
        bookId,
      } as any;
      saved = book.chapters[existingIndex] as any;
    } else {
      saved = {
        id: chapter.id || `ch-${bookId}-${book.chapters.length + 1}`,
        bookId,
        number: chapter.number || book.chapters.length + 1,
        title: chapter.title || 'New Chapter',
        description: chapter.description || '',
        topics: chapter.topics || [],
        status: chapter.status || 'published',
      };
      book.chapters.push(saved as any);
    }

    this.setStored(CMS_STORAGE_KEYS.BOOKS, books);
    AdminService.logAudit('Principal Admin', 'Chapter Saved', 'curriculum', `Saved chapter: ${saved.title} in ${book.title}`);
    return { success: true, chapter: saved };
  }

  static deleteChapter(bookId: string, chapterId: string): { success: boolean; error?: string } {
    if (!this.checkAuth('deleteChapter')) return { success: false, error: 'Unauthorized' };
    const books = this.getBooks();
    const book = books.find((b) => b.id === bookId);
    if (!book) return { success: false, error: 'Book not found' };

    book.chapters = (book.chapters || []).filter((c) => c.id !== chapterId);
    this.setStored(CMS_STORAGE_KEYS.BOOKS, books);
    AdminService.logAudit('Principal Admin', 'Chapter Deleted', 'curriculum', `Deleted chapter ${chapterId} from ${book.title}`);
    return { success: true };
  }

  // -------------------------------------------------------------
  // TOPICS CRUD
  // -------------------------------------------------------------
  static saveTopic(bookId: string, chapterId: string, topic: Partial<CurriculumTopic>): { success: boolean; topic?: CurriculumTopic; errors?: string[] } {
    if (!this.checkAuth('saveTopic')) return { success: false, errors: ['Unauthorized'] };
    const validation = this.validateTopic(topic);
    if (!validation.isValid) return { success: false, errors: validation.errors.map((e) => e.message) };

    const books = this.getBooks();
    const book = books.find((b) => b.id === bookId);
    if (!book) return { success: false, errors: ['Parent book not found'] };

    const chapter = (book.chapters || []).find((c) => c.id === chapterId);
    if (!chapter) return { success: false, errors: ['Parent chapter not found'] };

    if (!chapter.topics) chapter.topics = [];
    const existingIndex = chapter.topics.findIndex((t) => t.id === topic.id);

    let saved: CurriculumTopic;
    if (existingIndex >= 0) {
      chapter.topics[existingIndex] = {
        ...chapter.topics[existingIndex],
        ...topic,
        chapterId,
      } as any;
      saved = chapter.topics[existingIndex] as any;
    } else {
      saved = {
        id: topic.id || `tp-${chapterId}-${chapter.topics.length + 1}`,
        chapterId,
        title: topic.title || 'New Topic',
        summary: topic.summary || '',
        difficulty: topic.difficulty || 'Medium',
        keyConcepts: topic.keyConcepts || [],
        lessons: topic.lessons || [],
        masteryLevel: topic.masteryLevel || 0,
        status: topic.status || 'published',
      };
      chapter.topics.push(saved as any);
    }

    this.setStored(CMS_STORAGE_KEYS.BOOKS, books);
    AdminService.logAudit('Principal Admin', 'Topic Saved', 'curriculum', `Saved topic: ${saved.title}`);
    return { success: true, topic: saved };
  }

  static deleteTopic(bookId: string, chapterId: string, topicId: string): { success: boolean; error?: string } {
    if (!this.checkAuth('deleteTopic')) return { success: false, error: 'Unauthorized' };
    const books = this.getBooks();
    const book = books.find((b) => b.id === bookId);
    if (!book) return { success: false, error: 'Book not found' };

    const chapter = (book.chapters || []).find((c) => c.id === chapterId);
    if (!chapter) return { success: false, error: 'Chapter not found' };

    chapter.topics = (chapter.topics || []).filter((t) => t.id !== topicId);
    this.setStored(CMS_STORAGE_KEYS.BOOKS, books);
    AdminService.logAudit('Principal Admin', 'Topic Deleted', 'curriculum', `Deleted topic ${topicId}`);
    return { success: true };
  }

  // -------------------------------------------------------------
  // LESSONS CRUD
  // -------------------------------------------------------------
  static saveLesson(
    bookId: string,
    chapterId: string,
    topicId: string,
    lesson: Partial<CurriculumLesson>
  ): { success: boolean; lesson?: CurriculumLesson; errors?: string[] } {
    if (!this.checkAuth('saveLesson')) return { success: false, errors: ['Unauthorized'] };
    const validation = this.validateLesson(lesson);
    if (!validation.isValid) return { success: false, errors: validation.errors.map((e) => e.message) };

    const books = this.getBooks();
    const book = books.find((b) => b.id === bookId);
    if (!book) return { success: false, errors: ['Book not found'] };

    const chapter = (book.chapters || []).find((c) => c.id === chapterId);
    if (!chapter) return { success: false, errors: ['Chapter not found'] };

    const topic = (chapter.topics || []).find((t) => t.id === topicId);
    if (!topic) return { success: false, errors: ['Topic not found'] };

    if (!topic.lessons) topic.lessons = [];
    const existingIndex = topic.lessons.findIndex((l) => l.id === lesson.id);

    let saved: CurriculumLesson;
    if (existingIndex >= 0) {
      topic.lessons[existingIndex] = {
        ...topic.lessons[existingIndex],
        ...lesson,
        topicId,
      } as any;
      saved = topic.lessons[existingIndex] as any;
    } else {
      saved = {
        id: lesson.id || `ls-${topicId}-${topic.lessons.length + 1}`,
        topicId,
        title: lesson.title || 'New Lesson',
        contentType: lesson.contentType || 'text',
        contentMarkdown: lesson.contentMarkdown || '# New Lesson\n\nContent details here.',
        estimatedMinutes: lesson.estimatedMinutes || 10,
        author: lesson.author || 'EduAI Faculty',
        status: lesson.status || 'published',
      };
      topic.lessons.push({
        ...saved,
        isCompleted: false,
      });
    }

    this.setStored(CMS_STORAGE_KEYS.BOOKS, books);
    AdminService.logAudit('Principal Admin', 'Lesson Saved', 'curriculum', `Saved lesson: ${saved.title}`);
    return { success: true, lesson: saved };
  }

  static deleteLesson(bookId: string, chapterId: string, topicId: string, lessonId: string): { success: boolean; error?: string } {
    if (!this.checkAuth('deleteLesson')) return { success: false, error: 'Unauthorized' };
    const books = this.getBooks();
    const book = books.find((b) => b.id === bookId);
    if (!book) return { success: false, error: 'Book not found' };

    const chapter = (book.chapters || []).find((c) => c.id === chapterId);
    if (!chapter) return { success: false, error: 'Chapter not found' };

    const topic = (chapter.topics || []).find((t) => t.id === topicId);
    if (!topic) return { success: false, error: 'Topic not found' };

    topic.lessons = (topic.lessons || []).filter((l) => l.id !== lessonId);
    this.setStored(CMS_STORAGE_KEYS.BOOKS, books);
    AdminService.logAudit('Principal Admin', 'Lesson Deleted', 'curriculum', `Deleted lesson ${lessonId}`);
    return { success: true };
  }

  // -------------------------------------------------------------
  // VALIDATION ENGINE (Strict validation & copyright check)
  // -------------------------------------------------------------
  static validateSession(session: Partial<AcademicSession>): ContentValidationResult {
    const errors: { field: string; message: string }[] = [];
    if (!session.name || session.name.trim().length < 3) {
      errors.push({ field: 'name', message: 'Session name must be at least 3 characters long.' });
    }
    if (!session.academicYear || !session.academicYear.includes('-')) {
      errors.push({ field: 'academicYear', message: 'Academic year must be formatted like 2026-2027.' });
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateBoard(board: Partial<CurriculumBoard>): ContentValidationResult {
    const errors: { field: string; message: string }[] = [];
    if (!board.name || board.name.trim().length < 3) {
      errors.push({ field: 'name', message: 'Board name must be at least 3 characters.' });
    }
    if (!board.code || board.code.trim().length < 2) {
      errors.push({ field: 'code', message: 'Board code is required (e.g. CBSE, ICSE).' });
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateClass(cls: Partial<CurriculumClass>): ContentValidationResult {
    const errors: { field: string; message: string }[] = [];
    if (!cls.classLevel) {
      errors.push({ field: 'classLevel', message: 'Class level (1–12) is required.' });
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateSubject(subj: Partial<CurriculumSubject>): ContentValidationResult {
    const errors: { field: string; message: string }[] = [];
    if (!subj.name || subj.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Subject title must be at least 2 characters.' });
    }
    if (!subj.code || subj.code.trim().length < 1) {
      errors.push({ field: 'code', message: 'Subject curriculum code is required.' });
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateBook(book: Partial<CurriculumBook>): ContentValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    if (!book.title || book.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Book title must be at least 3 characters long.' });
    }
    if (!book.author || book.author.trim().length < 2) {
      errors.push({ field: 'author', message: 'Author or editorial committee is required.' });
    }
    if (!book.licenseInfo || book.licenseInfo.trim().length < 4) {
      errors.push({
        field: 'licenseInfo',
        message: 'Legal copyright and license declaration is mandatory (e.g. NCERT OER / CC BY-NC 4.0).',
      });
    }
    if (book.isAuthorized === false) {
      errors.push({
        field: 'isAuthorized',
        message: 'Unverified copyright status: The app is legally restricted to distributing authorized/OER content only.',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  static validateChapter(chapter: Partial<CurriculumChapter>): ContentValidationResult {
    const errors: { field: string; message: string }[] = [];
    if (!chapter.title || chapter.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Chapter title must be at least 3 characters.' });
    }
    if (typeof chapter.number !== 'number' || chapter.number < 1) {
      errors.push({ field: 'number', message: 'Chapter number must be a positive integer.' });
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateTopic(topic: Partial<CurriculumTopic>): ContentValidationResult {
    const errors: { field: string; message: string }[] = [];
    if (!topic.title || topic.title.trim().length < 2) {
      errors.push({ field: 'title', message: 'Topic title is required.' });
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateLesson(lesson: Partial<CurriculumLesson>): ContentValidationResult {
    const errors: { field: string; message: string }[] = [];
    if (!lesson.title || lesson.title.trim().length < 2) {
      errors.push({ field: 'title', message: 'Lesson title is required.' });
    }
    if (!lesson.contentMarkdown || lesson.contentMarkdown.trim().length < 10) {
      errors.push({ field: 'contentMarkdown', message: 'Lesson markdown content must have at least 10 characters.' });
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateQuestion(q: Partial<AdminQuestionRecord>): ContentValidationResult {
    const errors: { field: string; message: string }[] = [];
    if (!q.question || q.question.trim().length < 5) {
      errors.push({ field: 'question', message: 'Question text must be at least 5 characters.' });
    }
    if (!q.correctAnswer || q.correctAnswer.trim().length < 1) {
      errors.push({ field: 'correctAnswer', message: 'Correct answer / model solution is required.' });
    }
    if (q.type === 'mcq') {
      if (!q.options || q.options.length < 2) {
        errors.push({ field: 'options', message: 'MCQ questions require at least 2 options.' });
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  // -------------------------------------------------------------
  // IMPORT & EXPORT (Legal & Validated)
  // -------------------------------------------------------------
  static exportAllContent(): ContentExportData {
    return {
      version: '2.0-CMS',
      exportedAt: new Date().toISOString(),
      licenseNotice: 'Exported under NCERT Open Curriculum and Creative Commons BY-NC 4.0 guidelines.',
      sessions: this.getSessions(),
      boards: this.getBoards(),
      classes: this.getClasses(),
      mediums: this.getMediums(),
      subjects: this.getSubjects(),
      books: this.getBooks(),
      questions: AdminService.getQuestionsList(),
      quizzes: AdminService.getAdminQuizzes(),
      exams: AdminService.getAdminExams(),
    };
  }

  static exportAsJson(level: HierarchyLevel = 'book'): string {
    if (level === 'session') return JSON.stringify(this.getSessions(), null, 2);
    if (level === 'board') return JSON.stringify(this.getBoards(), null, 2);
    if (level === 'class') return JSON.stringify(this.getClasses(), null, 2);
    if (level === 'medium') return JSON.stringify(this.getMediums(), null, 2);
    if (level === 'subject') return JSON.stringify(this.getSubjects(), null, 2);
    if (level === 'book') return JSON.stringify(this.getBooks(), null, 2);
    if (level === 'question') return JSON.stringify(AdminService.getQuestionsList(), null, 2);
    if (level === 'quiz') return JSON.stringify(AdminService.getAdminQuizzes(), null, 2);
    if (level === 'exam') return JSON.stringify(AdminService.getAdminExams(), null, 2);
    return JSON.stringify(this.exportAllContent(), null, 2);
  }

  static exportAsCsv(level: HierarchyLevel = 'book'): string {
    if (level === 'book') {
      const books = this.getBooks();
      const headers = ['ID', 'Title', 'Subject', 'Class', 'Board', 'Medium', 'Author', 'License', 'ChaptersCount', 'Status'];
      const rows = books.map((b) => [
        `"${b.id}"`,
        `"${b.title.replace(/"/g, '""')}"`,
        `"${b.subjectName}"`,
        `"${b.classLevel}"`,
        `"${b.boardId}"`,
        `"${b.medium}"`,
        `"${b.author}"`,
        `"${b.licenseInfo}"`,
        b.chapters?.length || 0,
        `"${b.status}"`,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (level === 'question') {
      const questions = AdminService.getQuestionsList();
      const headers = ['ID', 'Question', 'Subject', 'Class', 'Type', 'Difficulty', 'CorrectAnswer', 'Verified'];
      const rows = questions.map((q) => [
        `"${q.id}"`,
        `"${q.question.replace(/"/g, '""')}"`,
        `"${q.subject}"`,
        `"${q.classLevel}"`,
        `"${q.type}"`,
        `"${q.difficulty}"`,
        `"${q.correctAnswer.replace(/"/g, '""')}"`,
        q.verifiedByAdmin ? 'TRUE' : 'FALSE',
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (level === 'subject') {
      const subjects = this.getSubjects();
      const headers = ['ID', 'Name', 'Code', 'Class', 'Board', 'Medium', 'Category', 'Status'];
      const rows = subjects.map((s) => [
        `"${s.id}"`,
        `"${s.name}"`,
        `"${s.code}"`,
        `"${s.classLevel}"`,
        `"${s.boardId}"`,
        `"${s.medium}"`,
        `"${s.category}"`,
        `"${s.status}"`,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    return 'Level not supported for CSV export';
  }

  static importContent(
    jsonString: string,
    mode: 'merge' | 'overwrite' = 'merge'
  ): { success: boolean; importedCount: number; errors?: string[] } {
    if (!this.checkAuth('importContent')) {
      return { success: false, importedCount: 0, errors: ['Unauthorized: Admin login required'] };
    }

    try {
      const data = JSON.parse(jsonString);
      let count = 0;

      // Handle full export object or individual arrays
      if (data.sessions && Array.isArray(data.sessions)) {
        const current = mode === 'overwrite' ? [] : this.getSessions();
        const existingIds = new Set(current.map((s) => s.id));
        data.sessions.forEach((s: AcademicSession) => {
          if (this.validateSession(s).isValid) {
            if (!existingIds.has(s.id)) {
              current.push(s);
              count++;
            }
          }
        });
        this.setStored(CMS_STORAGE_KEYS.SESSIONS, current);
      }

      if (data.books && Array.isArray(data.books)) {
        const current = mode === 'overwrite' ? [] : this.getBooks();
        const existingIds = new Set(current.map((b) => b.id));
        data.books.forEach((b: CurriculumBook) => {
          if (this.validateBook(b).isValid) {
            if (!existingIds.has(b.id)) {
              current.push(b);
              count++;
            }
          }
        });
        this.setStored(CMS_STORAGE_KEYS.BOOKS, current);
      }

      if (data.subjects && Array.isArray(data.subjects)) {
        const current = mode === 'overwrite' ? [] : this.getSubjects();
        const existingIds = new Set(current.map((s) => s.id));
        data.subjects.forEach((s: CurriculumSubject) => {
          if (this.validateSubject(s).isValid) {
            if (!existingIds.has(s.id)) {
              current.push(s);
              count++;
            }
          }
        });
        this.setStored(CMS_STORAGE_KEYS.SUBJECTS, current);
      }

      AdminService.logAudit('Principal Admin', 'Content Imported', 'curriculum', `Imported ${count} content records (Mode: ${mode})`);
      return { success: true, importedCount: count };
    } catch (err: any) {
      return { success: false, importedCount: 0, errors: [err?.message || 'Invalid JSON format'] };
    }
  }

  static getSampleImportTemplate(level: HierarchyLevel): string {
    if (level === 'book') {
      return JSON.stringify(
        [
          {
            id: 'bk-sample-custom-1',
            title: 'Sample NCERT Chemistry (Class 10)',
            subjectId: 'chemistry',
            subjectName: 'Chemistry',
            classLevel: '10',
            boardId: 'board-cbse',
            medium: 'English',
            author: 'NCERT Faculty',
            publisher: 'NCERT Publications',
            licenseInfo: 'NCERT Open Educational Resource (OER) - CC BY-NC 4.0',
            isAuthorized: true,
            status: 'published',
            chapters: [
              {
                id: 'ch-sample-1',
                number: 1,
                title: 'Carbon and its Compounds',
                description: 'Covalent bonding, versatile nature of carbon, homologous series.',
                topics: [
                  {
                    id: 'tp-sample-1-1',
                    title: 'Bonding in Carbon',
                    summary: 'Covalent bonding principles.',
                    difficulty: 'Medium',
                    lessons: [],
                  },
                ],
              },
            ],
          },
        ],
        null,
        2
      );
    }

    if (level === 'question') {
      return JSON.stringify(
        [
          {
            id: 'q-sample-1',
            question: 'What is the chemical formula of rust?',
            subject: 'Science',
            classLevel: '10',
            topic: 'Chemical Reactions and Equations',
            type: 'mcq',
            difficulty: 'Easy',
            options: ['Fe2O3.xH2O', 'Fe3O4', 'FeO', 'Fe(OH)2'],
            correctAnswer: 'Fe2O3.xH2O',
            explanation: 'Rust is hydrated iron(III) oxide with chemical formula Fe2O3.xH2O.',
            verifiedByAdmin: true,
            usageCount: 0,
            createdAt: '2026-08-18T10:00:00Z',
          },
        ],
        null,
        2
      );
    }

    return JSON.stringify(
      [
        {
          name: 'Academic Session 2026–2027',
          academicYear: '2026-2027',
          startDate: '2026-04-01',
          endDate: '2027-03-31',
          isCurrent: true,
          status: 'active',
        },
      ],
      null,
      2
    );
  }
}
