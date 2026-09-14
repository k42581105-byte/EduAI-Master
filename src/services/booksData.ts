import { Book, Chapter, Topic, ClassLevel, BoardType, MediumType } from '../types';
import { ContentManagementService } from './contentManagementService';

export const ALL_BOARDS_LIST = [
  'CBSE',
  'State Boards',
  'UP Board',
  'Bihar Board',
  'Maharashtra Board',
  'Tamil Nadu Board',
  'Rajasthan Board',
  'MP Board',
  'West Bengal Board',
  'Karnataka Board',
  'ICSE',
  'Other',
];

export const ALL_MEDIUMS_LIST = [
  'English',
  'Hindi',
  'Hinglish',
  'Other',
];

export const ALL_CLASSES_LIST: ClassLevel[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export interface BookFilterParams {
  board: string;
  classLevel: ClassLevel;
  medium: string;
  subjectFilter?: string;
  searchQuery?: string;
  favoriteIds?: string[];
  onlyFavorites?: boolean;
}

// Color palettes for book covers
const COVER_GRADIENTS = [
  'from-indigo-600 via-purple-600 to-pink-600',
  'from-blue-600 via-teal-600 to-emerald-600',
  'from-amber-600 via-orange-600 to-red-600',
  'from-emerald-600 via-teal-700 to-cyan-800',
  'from-purple-700 via-violet-800 to-indigo-900',
  'from-rose-600 via-pink-700 to-purple-800',
  'from-cyan-600 via-blue-700 to-indigo-800',
];

// Helper to pick cover gradient deterministically
function getCoverGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COVER_GRADIENTS.length;
  return COVER_GRADIENTS[index];
}

/**
 * Returns subjects applicable for a given class level
 */
export function getAvailableSubjectsForClass(classLevel: ClassLevel): string[] {
  const level = parseInt(classLevel, 10);
  if (level <= 5) {
    return ['Mathematics', 'EVS (Environmental Studies)', 'English', 'Hindi (हिंदी)', 'General Knowledge'];
  }
  if (level <= 10) {
    return [
      'Science',
      'Mathematics',
      'Social Science',
      'English',
      'Hindi (हिंदी)',
      'Sanskrit (संस्कृत)',
      'Computer Science',
    ];
  }
  return [
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology',
    'Computer Science / IP',
    'English Core',
    'Hindi Core',
    'Accountancy',
    'Business Studies',
    'Economics',
    'History',
    'Political Science',
  ];
}

/**
 * Generates open educational textbook data dynamically based on Board, Class, Medium, and Subject filters.
 */
export function getBooksForFilter(params: BookFilterParams): Book[] {
  const { board, classLevel, medium, subjectFilter = 'All', searchQuery = '', favoriteIds = [], onlyFavorites = false } = params;
  const isHindi = medium.toLowerCase().includes('hindi') || medium === 'हिंदी';
  const subjects = subjectFilter === 'All' ? getAvailableSubjectsForClass(classLevel) : [subjectFilter];

  const booksList: Book[] = [];

  subjects.forEach((subj) => {
    // Generate 2 to 3 open textbooks per subject for richness
    const baseId = `bk-${board.toLowerCase().replace(/[^a-z0-9]/g, '')}-${classLevel}-${medium.toLowerCase().slice(0, 2)}-${subj.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    let mainTitle = '';
    let exemplarTitle = '';
    let authorName = 'NCERT Publications (Open Educational Resource)';
    let publisherName = 'National Council of Educational Research & Training';
    let license = 'Open Curriculum Framework & CC BY-NC 4.0';

    if (board.includes('State')) {
      authorName = 'SCERT Board Textbooks Authority';
      publisherName = 'State Educational Research & Training Council';
    } else if (board.includes('ICSE')) {
      authorName = 'Council for Indian School Certificate Examinations (OER)';
      publisherName = 'CISCE Open Syllabus Guide';
    }

    if (isHindi) {
      mainTitle = `${board} ${subj} पुस्तक (कक्षा ${classLevel})`;
      exemplarTitle = `${subj} अभ्यास एवं प्रश्न संग्रह (कक्षा ${classLevel})`;
    } else {
      mainTitle = `${board} ${subj} Textbook (Class ${classLevel})`;
      exemplarTitle = `${subj} Exemplar & Revision Guide (Class ${classLevel})`;
    }

    // Custom titles for standard NCERT books
    if (subj === 'Science') {
      mainTitle = isHindi ? `NCERT विज्ञान (कक्षा ${classLevel})` : `NCERT Science Class ${classLevel}`;
    } else if (subj === 'Mathematics' || subj === 'Maths') {
      mainTitle = isHindi ? `NCERT गणित (कक्षा ${classLevel})` : `NCERT Mathematics Class ${classLevel}`;
    } else if (subj === 'Physics') {
      mainTitle = isHindi ? `NCERT भौतिक विज्ञान भाग 1 (कक्षा ${classLevel})` : `NCERT Physics Part I Class ${classLevel}`;
    } else if (subj === 'Chemistry') {
      mainTitle = isHindi ? `NCERT रसायन विज्ञान भाग 1 (कक्षा ${classLevel})` : `NCERT Chemistry Part I Class ${classLevel}`;
    } else if (subj === 'Biology') {
      mainTitle = isHindi ? `NCERT जीव विज्ञान (कक्षा ${classLevel})` : `NCERT Biology Class ${classLevel}`;
    } else if (subj === 'English') {
      mainTitle = parseInt(classLevel, 10) >= 9 ? `NCERT First Flight Class ${classLevel}` : `NCERT Honeycomb Class ${classLevel}`;
    } else if (subj === 'Hindi (हिंदी)' || subj === 'Hindi Core' || subj === 'Hindi') {
      mainTitle = `NCERT स्पर्श भाग 2 (कक्षा ${classLevel})`;
    } else if (subj === 'Social Science') {
      mainTitle = isHindi ? `NCERT सामाजिक विज्ञान (कक्षा ${classLevel})` : `NCERT Social Science Class ${classLevel}`;
    } else if (subj === 'EVS (Environmental Studies)') {
      mainTitle = `NCERT Looking Around EVS Class ${classLevel}`;
    }

    // Chapters Generator
    const chapters1 = generateChaptersForSubject(subj, classLevel, baseId + '-1', isHindi);
    const book1: Book = {
      id: baseId + '-main',
      title: mainTitle,
      subjectId: subj.toLowerCase().replace(/[^a-z0-9]/g, ''),
      subjectName: subj,
      board: board,
      classLevel: classLevel,
      medium: medium,
      author: authorName,
      publisher: publisherName,
      academicYear: '2025-2026 Academic Edition',
      coverColor: getCoverGradient(mainTitle),
      description: `Official open syllabus textbook for Class ${classLevel} ${subj} under ${board} framework in ${medium} medium. Includes chapter summaries, core definitions, solved examples, and practice questions.`,
      editionBadge: '2025-26 Edition',
      licenseInfo: license,
      chapters: chapters1,
      isFavorite: favoriteIds.includes(baseId + '-main'),
    };

    const chapters2 = generateExemplarChapters(subj, classLevel, baseId + '-2', isHindi);
    const book2: Book = {
      id: baseId + '-exemplar',
      title: exemplarTitle,
      subjectId: subj.toLowerCase().replace(/[^a-z0-9]/g, ''),
      subjectName: subj,
      board: board,
      classLevel: classLevel,
      medium: medium,
      author: 'Academic Council Editorial Board',
      publisher: 'OER National Repository',
      academicYear: '2025-2026 Edition',
      coverColor: getCoverGradient(exemplarTitle),
      description: `Comprehensive question bank, high-yield numericals, and board exam model answers for Class ${classLevel} ${subj}.`,
      editionBadge: 'Question Bank',
      licenseInfo: license,
      chapters: chapters2,
      isFavorite: favoriteIds.includes(baseId + '-exemplar'),
    };

    booksList.push(book1, book2);
  });

  // Merge dynamic books from Content Management System (CMS)
  try {
    const cmsBooks = ContentManagementService.getBooks({
      boardId: board,
      classLevel,
      medium,
      subjectId: subjectFilter === 'All' ? undefined : subjectFilter.toLowerCase(),
      status: 'published',
    });

    cmsBooks.forEach((cb) => {
      // Avoid duplicate IDs if already present
      if (!booksList.some((b) => b.id === cb.id)) {
        booksList.unshift({
          id: cb.id,
          title: cb.title,
          subjectId: cb.subjectId,
          subjectName: cb.subjectName,
          board: cb.boardId || board,
          classLevel: cb.classLevel,
          medium: cb.medium,
          author: cb.author,
          publisher: cb.publisher,
          academicYear: '2026-2027 Academic Edition',
          coverColor: cb.coverGradient || getCoverGradient(cb.title),
          description: cb.description || 'Dynamic syllabus textbook managed by Admin Console.',
          editionBadge: cb.editionBadge || 'CMS Verified',
          licenseInfo: cb.licenseInfo,
          chapters: cb.chapters || [],
          isFavorite: favoriteIds.includes(cb.id),
        });
      }
    });
  } catch (err) {
    console.warn('Could not load CMS books:', err);
  }

  // Filter by Search Query & Favorites
  return booksList.filter((b) => {
    if (onlyFavorites && !b.isFavorite) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const matchesBook =
      b.title.toLowerCase().includes(query) ||
      (b.subjectName && b.subjectName.toLowerCase().includes(query)) ||
      (b.author && b.author.toLowerCase().includes(query)) ||
      (b.publisher && b.publisher.toLowerCase().includes(query)) ||
      (b.board && b.board.toLowerCase().includes(query));

    if (matchesBook) return true;

    // Search inside chapters or topics
    const matchesChapter = b.chapters.some(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.topics.some((t) => t.title.toLowerCase().includes(query) || t.summary.toLowerCase().includes(query))
    );

    return matchesChapter;
  });
}

/**
 * Generate Chapters for Main Textbook
 */
function generateChaptersForSubject(subj: string, classLevel: ClassLevel, bookId: string, isHindi: boolean): Chapter[] {
  const lvl = parseInt(classLevel, 10);

  if (subj === 'Science' || subj === 'Physics' || subj === 'Chemistry' || subj === 'Biology') {
    if (lvl === 10) {
      return [
        {
          id: `${bookId}-ch1`,
          bookId,
          number: 1,
          title: isHindi ? 'रासायनिक अभिक्रियाएं एवं समीकरण' : 'Chemical Reactions and Equations',
          description: isHindi
            ? 'संतुलित समीकरण, संयोजन, वियोजन, विस्थापन एवं रेडॉक्स अभिक्रियाएं।'
            : 'Balanced chemical equations, combination, decomposition, displacement and redox reactions.',
          topics: [
            {
              id: `${bookId}-ch1-t1`,
              chapterId: `${bookId}-ch1`,
              title: isHindi ? 'रासायनिक समीकरणों का संतुलन' : 'Balancing Chemical Equations',
              summary: 'Law of Conservation of Mass: Total mass of reactants = Total mass of products.',
              masteryLevel: 85,
              lessons: [
                {
                  id: `${bookId}-ch1-t1-l1`,
                  topicId: `${bookId}-ch1-t1`,
                  title: 'Step-by-Step Balancing Rules',
                  contentType: 'text',
                  contentMarkdown: '### Balancing Equations\nUse hit-and-trial method or algebraic balancing.\nExample: `Fe + H2O -> Fe3O4 + H2` balance as `3Fe + 4H2O -> Fe3O4 + 4H2`.',
                  estimatedMinutes: 10,
                  isCompleted: true,
                },
              ],
            },
            {
              id: `${bookId}-ch1-t2`,
              chapterId: `${bookId}-ch1`,
              title: isHindi ? 'अभिक्रियाओं के प्रकार एवं रेडॉक्स' : 'Types of Reactions & Redox',
              summary: 'Exothermic vs Endothermic reactions, Oxidation and Reduction principles.',
              masteryLevel: 75,
              lessons: [],
            },
          ],
        },
        {
          id: `${bookId}-ch2`,
          bookId,
          number: 2,
          title: isHindi ? 'अम्ल, क्षारक एवं लवण' : 'Acids, Bases and Salts',
          description: isHindi ? 'pH पैमाना, सूचक, उदासीनीकरण अभिक्रिया एवं महत्वपूर्ण लवण।' : 'pH scale, indicators, neutralization reactions and common salts.',
          topics: [
            {
              id: `${bookId}-ch2-t1`,
              chapterId: `${bookId}-ch2`,
              title: isHindi ? 'pH मान एवं सूचक' : 'pH Scale & Everyday Importance',
              summary: 'pH scale ranges 0 to 14. Neutral is 7. Human body works in pH 7.0 to 7.8.',
              masteryLevel: 80,
              lessons: [],
            },
          ],
        },
        {
          id: `${bookId}-ch3`,
          bookId,
          number: 3,
          title: isHindi ? 'धातु एवं अधातु' : 'Metals and Non-Metals',
          description: isHindi ? 'भौतिक एवं रासायनिक गुणधर्म, सक्रियता श्रेणी एवं निष्कर्षण।' : 'Physical/chemical properties, reactivity series, ionic bonding and metallurgy.',
          topics: [
            {
              id: `${bookId}-ch3-t1`,
              chapterId: `${bookId}-ch3`,
              title: isHindi ? 'सक्रियता श्रेणी एवं आयनिक यौगिक' : 'Reactivity Series & Ionic Bonds',
              summary: 'High reactivity metals (K, Na, Ca), medium (Zn, Fe, Pb), low (Cu, Ag, Au).',
              masteryLevel: 70,
              lessons: [],
            },
          ],
        },
        {
          id: `${bookId}-ch4`,
          bookId,
          number: 4,
          title: isHindi ? 'कार्बन एवं उसके यौगिक' : 'Carbon and Its Compounds',
          description: isHindi ? 'सहसंयोजी आबंध, समजातीय श्रेणी, प्रकार्यात्मक समूह एवं साबुन।' : 'Covalent bonding, homologous series, functional groups and soaps/detergents.',
          topics: [
            {
              id: `${bookId}-ch4-t1`,
              chapterId: `${bookId}-ch4`,
              title: isHindi ? 'प्रकार्यात्मक समूह एवं नामकरण' : 'Functional Groups & IUPAC Naming',
              summary: 'Alcohol (-OH), Aldehyde (-CHO), Ketone (>C=O), Carboxylic Acid (-COOH).',
              masteryLevel: 65,
              lessons: [],
            },
          ],
        },
        {
          id: `${bookId}-ch5`,
          bookId,
          number: 5,
          title: isHindi ? 'जैव प्रक्रम' : 'Life Processes',
          description: isHindi ? 'पोषण, श्वसन, वहन एवं उत्सर्जन की विस्तृत कार्यप्रणाली।' : 'Detailed study of nutrition, respiration, transportation and excretion.',
          topics: [
            {
              id: `${bookId}-ch5-t1`,
              chapterId: `${bookId}-ch5`,
              title: isHindi ? 'मानव हृदय एवं परिसंचरण तंत्र' : 'Human Heart & Double Circulation',
              summary: 'Four chambers of human heart: Right/Left Atrium and Ventricle.',
              masteryLevel: 90,
              lessons: [],
            },
          ],
        },
        {
          id: `${bookId}-ch6`,
          bookId,
          number: 6,
          title: isHindi ? 'प्रकाश - परावर्तन तथा अपवर्तन' : 'Light: Reflection and Refraction',
          description: isHindi ? 'दर्पण सूत्र, लेंस सूत्र, आवर्धन एवं अपवर्तनांक।' : 'Mirror formula, lens formula, refractive index and ray diagrams.',
          topics: [
            {
              id: `${bookId}-ch6-t1`,
              chapterId: `${bookId}-ch6`,
              title: isHindi ? 'गोलीय दर्पण एवं चिन्ह परिपाटी' : 'Spherical Mirrors & Sign Convention',
              summary: '1/f = 1/v + 1/u. Concave focal length is negative, Convex is positive.',
              masteryLevel: 60,
              lessons: [],
            },
          ],
        },
      ];
    } else if (lvl >= 11) {
      return [
        {
          id: `${bookId}-ch1`,
          bookId,
          number: 1,
          title: isHindi ? 'मात्रक और मापन' : 'Units and Measurements',
          description: 'SI base units, dimensional formulae and error analysis.',
          topics: [
            {
              id: `${bookId}-ch1-t1`,
              chapterId: `${bookId}-ch1`,
              title: 'Dimensions of Physical Quantities',
              summary: 'Checking equation correctness using dimensional homogeneity.',
              masteryLevel: 80,
              lessons: [],
            },
          ],
        },
        {
          id: `${bookId}-ch2`,
          bookId,
          number: 2,
          title: isHindi ? 'सरल रेखा में गति' : 'Motion in a Straight Line',
          description: 'Position-time graphs, instant velocity, acceleration and kinematics.',
          topics: [
            {
              id: `${bookId}-ch2-t1`,
              chapterId: `${bookId}-ch2`,
              title: 'Kinematic Equations of Motion',
              summary: 'v = u + at, s = ut + 0.5at^2, v^2 = u^2 + 2as.',
              masteryLevel: 75,
              lessons: [],
            },
          ],
        },
        {
          id: `${bookId}-ch3`,
          bookId,
          number: 3,
          title: isHindi ? 'गति के नियम' : 'Laws of Motion',
          description: 'Newton’s three laws, momentum, friction and circular motion dynamics.',
          topics: [
            {
              id: `${bookId}-ch3-t1`,
              chapterId: `${bookId}-ch3`,
              title: 'Conservation of Linear Momentum',
              summary: 'Total momentum before collision equals total momentum after collision.',
              masteryLevel: 70,
              lessons: [],
            },
          ],
        },
      ];
    }
  }

  // Default Chapter Structure for Mathematics, Social Science, or other subjects
  return [
    {
      id: `${bookId}-ch1`,
      bookId,
      number: 1,
      title: isHindi ? `${subj} - अध्याय 1: मूलभूत सिद्धांत` : `${subj} - Chapter 1: Fundamental Concepts`,
      description: isHindi ? 'पाठ्यक्रम के आधारभूत सिद्धांत एवं अवधारणाएं।' : 'Core concepts, definitions, and foundational principles.',
      topics: [
        {
          id: `${bookId}-ch1-t1`,
          chapterId: `${bookId}-ch1`,
          title: isHindi ? 'अवधारणा 1.1: मुख्य नियम' : 'Concept 1.1: Core Rules & Proofs',
          summary: 'Step-by-step mathematical or logical rules for problem solving.',
          masteryLevel: 85,
          lessons: [],
        },
      ],
    },
    {
      id: `${bookId}-ch2`,
      bookId,
      number: 2,
      title: isHindi ? `${subj} - अध्याय 2: अनुप्रयोग एवं उदाहरण` : `${subj} - Chapter 2: Applications & Problem Solving`,
      description: isHindi ? 'व्यावहारिक उदाहरण एवं बोर्ड परीक्षा प्रश्न।' : 'Practical applications and step-by-step worked examples.',
      topics: [
        {
          id: `${bookId}-ch2-t1`,
          chapterId: `${bookId}-ch2`,
          title: isHindi ? 'अवधारणा 2.1: महत्वपूर्ण सूत्र' : 'Concept 2.1: High-Yield Formulas',
          summary: 'Formula reference sheet and exam shortcuts.',
          masteryLevel: 75,
          lessons: [],
        },
      ],
    },
    {
      id: `${bookId}-ch3`,
      bookId,
      number: 3,
      title: isHindi ? `${subj} - अध्याय 3: उन्नत अभ्यास` : `${subj} - Chapter 3: Advanced Practice Questions`,
      description: isHindi ? 'विगत वर्षों के बोर्ड प्रश्न एवं मॉडल उत्तर।' : 'Past board examination questions and step-by-step model answers.',
      topics: [
        {
          id: `${bookId}-ch3-t1`,
          chapterId: `${bookId}-ch3`,
          title: isHindi ? 'अवधारणा 3.1: मॉडल प्रश्न उत्तर' : 'Concept 3.1: Board Exam Model Solutions',
          summary: 'Top 5 repeated board questions explained.',
          masteryLevel: 90,
          lessons: [],
        },
      ],
    },
  ];
}

/**
 * Generate Chapters for Exemplar/Question Bank Book
 */
function generateExemplarChapters(subj: string, classLevel: ClassLevel, bookId: string, isHindi: boolean): Chapter[] {
  return [
    {
      id: `${bookId}-ex1`,
      bookId,
      number: 1,
      title: isHindi ? `इकाई 1: बहुविकल्पीय एवं लघु उत्तरीय प्रश्न` : `Unit 1: MCQs & Short Answer Practice`,
      description: isHindi ? '1 अंक और 2 अंकों के अति महत्वपूर्ण प्रश्न।' : '1-Mark and 2-Mark essential practice questions with solutions.',
      topics: [
        {
          id: `${bookId}-ex1-t1`,
          chapterId: `${bookId}-ex1`,
          title: 'Top 20 Board MCQ Set',
          summary: 'Fast-paced multiple choice question practice with immediate explanations.',
          masteryLevel: 80,
          lessons: [],
        },
      ],
    },
    {
      id: `${bookId}-ex2`,
      bookId,
      number: 2,
      title: isHindi ? `इकाई 2: दीर्घ उत्तरीय एवं आंकिक प्रश्न` : `Unit 2: Long Answer & High-Yield Numericals`,
      description: isHindi ? '5 अंकों के प्रश्न और आंकिक प्रश्नों का हल।' : '5-Mark detailed questions and step-by-step numerical derivations.',
      topics: [
        {
          id: `${bookId}-ex2-t1`,
          chapterId: `${bookId}-ex2`,
          title: 'Step-by-Step Derivation Guide',
          summary: 'Diagram-based step-by-step board paper writing tips.',
          masteryLevel: 70,
          lessons: [],
        },
      ],
    },
  ];
}

/**
 * Global search across chapters across all generated books
 */
export function searchChaptersCatalog(params: {
  searchQuery: string;
  board: string;
  classLevel: ClassLevel;
  medium: string;
}): { book: Book; chapter: Chapter }[] {
  const { searchQuery, board, classLevel, medium } = params;
  if (!searchQuery.trim()) return [];

  const allBooks = getBooksForFilter({
    board,
    classLevel,
    medium,
    searchQuery: '',
  });

  const query = searchQuery.toLowerCase().trim();
  const results: { book: Book; chapter: Chapter }[] = [];

  allBooks.forEach((book) => {
    book.chapters.forEach((chapter) => {
      const matchChapter =
        chapter.title.toLowerCase().includes(query) ||
        chapter.description.toLowerCase().includes(query) ||
        chapter.topics.some((t) => t.title.toLowerCase().includes(query) || t.summary.toLowerCase().includes(query));

      if (matchChapter) {
        results.push({ book, chapter });
      }
    });
  });

  return results;
}
