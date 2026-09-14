import { Subject, ClassLevel, BoardType } from '../types';

export const ALL_CLASSES: ClassLevel[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
export const ALL_BOARDS: BoardType[] = ['CBSE', 'ICSE', 'State Boards', 'Other'];

export function getSeedSubjects(classLevel: ClassLevel): Subject[] {
  const levelNum = parseInt(classLevel, 10);

  if (levelNum >= 11) {
    return [
      {
        id: 'phy-11',
        name: 'Physics',
        code: 'PHY',
        iconName: 'Zap',
        color: 'from-amber-500 to-orange-600',
        classLevels: ['11', '12'],
        books: [
          {
            id: 'bk-phy-1',
            title: 'NCERT Physics Part I',
            subjectId: 'phy-11',
            chapters: [
              {
                id: 'ch-phy-1',
                bookId: 'bk-phy-1',
                number: 1,
                title: 'Units and Measurements',
                description: 'SI units, dimensional analysis, and error calculations',
                topics: [
                  {
                    id: 'tp-phy-1-1',
                    chapterId: 'ch-phy-1',
                    title: 'System of Units & Dimensional Formulae',
                    summary: 'Learn base units, derived units, and checking physical equations via dimensions.',
                    masteryLevel: 75,
                    lessons: [
                      {
                        id: 'les-1',
                        topicId: 'tp-phy-1-1',
                        title: 'SI Base Units and Dimensions',
                        contentType: 'text',
                        contentMarkdown: '### SI Units & Dimensional Analysis\n\nThe International System of Units (SI) defines seven base units: meter (m), kilogram (kg), second (s), ampere (A), kelvin (K), mole (mol), and candela (cd).\n\n**Dimensional Analysis Principle:**\nAn equation is dimensionally correct if dimensions on the left hand side equal dimensions on the right hand side.\nExample: `[Velocity] = L T^-1`, `[Force] = M L T^-2`.',
                        estimatedMinutes: 12,
                        isCompleted: true,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'ch-phy-2',
                bookId: 'bk-phy-1',
                number: 2,
                title: 'Motion in a Straight Line',
                description: 'Kinematics, speed, velocity, acceleration, and position-time graphs.',
                topics: [
                  {
                    id: 'tp-phy-2-1',
                    chapterId: 'ch-phy-2',
                    title: 'Equations of Motion under Constant Acceleration',
                    summary: 'Derivation and application of v = u + at, s = ut + 0.5at^2, and v^2 = u^2 + 2as.',
                    masteryLevel: 60,
                    lessons: [
                      {
                        id: 'les-2',
                        topicId: 'tp-phy-2-1',
                        title: 'Deriving the 3 Kinematic Formulas',
                        contentType: 'ai-explained',
                        contentMarkdown: '### Kinematics Formulas\n1. `v = u + a t`\n2. `s = u t + 0.5 a t^2`\n3. `v^2 = u^2 + 2 a s`',
                        estimatedMinutes: 15,
                        isCompleted: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'chem-11',
        name: 'Chemistry',
        code: 'CHEM',
        iconName: 'FlaskConical',
        color: 'from-emerald-500 to-teal-600',
        classLevels: ['11', '12'],
        books: [
          {
            id: 'bk-chem-1',
            title: 'NCERT Chemistry Part I',
            subjectId: 'chem-11',
            chapters: [
              {
                id: 'ch-chem-1',
                bookId: 'bk-chem-1',
                number: 1,
                title: 'Some Basic Concepts of Chemistry',
                description: 'Mole concept, stoichiometry, and atomic mass units.',
                topics: [
                  {
                    id: 'tp-chem-1-1',
                    chapterId: 'ch-chem-1',
                    title: 'Mole Concept & Molar Mass',
                    summary: '1 mole = 6.022 x 10^23 particles. Calculating molarity and molality.',
                    masteryLevel: 80,
                    lessons: [
                      {
                        id: 'les-chem-1',
                        topicId: 'tp-chem-1-1',
                        title: 'Mole Calculations Made Easy',
                        contentType: 'text',
                        contentMarkdown: '### The Mole Concept\n1 Mole contains Avogadro number of entities (`6.022 × 10^23`).\n`Molarity (M) = Moles of solute / Liters of solution`.',
                        estimatedMinutes: 10,
                        isCompleted: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'math-11',
        name: 'Mathematics',
        code: 'MATH',
        iconName: 'Calculator',
        color: 'from-blue-500 to-indigo-600',
        classLevels: ['11', '12'],
        books: [
          {
            id: 'bk-math-1',
            title: 'NCERT Mathematics Class 11',
            subjectId: 'math-11',
            chapters: [
              {
                id: 'ch-math-1',
                bookId: 'bk-math-1',
                number: 1,
                title: 'Sets & Functions',
                description: 'Venn diagrams, unions, intersections, domain and range.',
                topics: [
                  {
                    id: 'tp-math-1-1',
                    chapterId: 'ch-math-1',
                    title: 'Set Operations & Relations',
                    summary: 'Union, intersection, subset, and power sets.',
                    masteryLevel: 90,
                    lessons: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-11',
        name: 'Biology',
        code: 'BIO',
        iconName: 'Dna',
        color: 'from-pink-500 to-rose-600',
        classLevels: ['11', '12'],
        books: [
          {
            id: 'bk-bio-1',
            title: 'NCERT Biology Class 11',
            subjectId: 'bio-11',
            chapters: [
              {
                id: 'ch-bio-1',
                bookId: 'bk-bio-1',
                number: 1,
                title: 'Cell: The Unit of Life',
                description: 'Prokaryotic vs Eukaryotic cells, organelles, and cell membrane structure.',
                topics: [
                  {
                    id: 'tp-bio-1-1',
                    chapterId: 'ch-bio-1',
                    title: 'Organelles & Functions',
                    summary: 'Mitochondria, Golgi apparatus, Endoplasmic Reticulum, and Nucleus.',
                    masteryLevel: 70,
                    lessons: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
  }

  // Classes 6 to 10
  if (levelNum >= 6 && levelNum <= 10) {
    return [
      {
        id: `sci-${classLevel}`,
        name: 'Science',
        code: 'SCI',
        iconName: 'Atom',
        color: 'from-purple-500 to-indigo-600',
        classLevels: [classLevel],
        books: [
          {
            id: `bk-sci-${classLevel}`,
            title: `NCERT Science Class ${classLevel}`,
            subjectId: `sci-${classLevel}`,
            chapters: [
              {
                id: `ch-sci-1-${classLevel}`,
                bookId: `bk-sci-${classLevel}`,
                number: 1,
                title: levelNum === 10 ? 'Chemical Reactions and Equations' : 'Matter in Our Surroundings',
                description: 'Fundamental principles of chemical changes, balancing equations, and states of matter.',
                topics: [
                  {
                    id: `tp-sci-1-1-${classLevel}`,
                    chapterId: `ch-sci-1-${classLevel}`,
                    title: 'Types of Chemical Reactions',
                    summary: 'Combination, Decomposition, Displacement, and Double Displacement reactions.',
                    masteryLevel: 85,
                    lessons: [
                      {
                        id: 'les-sci-1',
                        topicId: `tp-sci-1-1-${classLevel}`,
                        title: 'Balancing Chemical Equations',
                        contentType: 'text',
                        contentMarkdown: '### Balancing Equations\nRule of Law of Conservation of Mass: Total mass of reactants = Total mass of products.\nExample: `2 H2 + O2 -> 2 H2O`.',
                        estimatedMinutes: 10,
                        isCompleted: true,
                      },
                    ],
                  },
                ],
              },
              {
                id: `ch-sci-2-${classLevel}`,
                bookId: `bk-sci-${classLevel}`,
                number: 2,
                title: levelNum === 10 ? 'Light: Reflection and Refraction' : 'Acids, Bases, and Salts',
                description: 'Mirrors, lenses, refraction index, pH scale, and neutralization reactions.',
                topics: [
                  {
                    id: `tp-sci-2-1-${classLevel}`,
                    chapterId: `ch-sci-2-${classLevel}`,
                    title: 'Spherical Mirrors & Mirror Formula',
                    summary: 'Concave and Convex mirrors, focal length, ray diagrams, and 1/f = 1/v + 1/u.',
                    masteryLevel: 45, // Weak topic candidate
                    lessons: [
                      {
                        id: 'les-sci-2',
                        topicId: `tp-sci-2-1-${classLevel}`,
                        title: 'Mirror Formula & Sign Convention',
                        contentType: 'ai-explained',
                        contentMarkdown: '### Mirror Formula\n`1/f = 1/v + 1/u`\nWhere `f` is focal length, `v` is image distance, `u` is object distance.',
                        estimatedMinutes: 15,
                        isCompleted: false,
                      },
                    ],
                  },
                ],
              },
              {
                id: `ch-sci-3-${classLevel}`,
                bookId: `bk-sci-${classLevel}`,
                number: 3,
                title: levelNum === 10 ? 'Life Processes' : 'Structure of Atom',
                description: 'Nutrition, respiration, circulation, excretion in human beings and plants.',
                topics: [
                  {
                    id: `tp-sci-3-1-${classLevel}`,
                    chapterId: `ch-sci-3-${classLevel}`,
                    title: 'Human Circulatory System & Heart',
                    summary: 'Double circulation, chambers of heart, arteries, veins, and capillaries.',
                    masteryLevel: 90,
                    lessons: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: `mth-${classLevel}`,
        name: 'Mathematics',
        code: 'MATH',
        iconName: 'Calculator',
        color: 'from-blue-500 to-cyan-600',
        classLevels: [classLevel],
        books: [
          {
            id: `bk-mth-${classLevel}`,
            title: `NCERT Mathematics Class ${classLevel}`,
            subjectId: `mth-${classLevel}`,
            chapters: [
              {
                id: `ch-mth-1-${classLevel}`,
                bookId: `bk-mth-${classLevel}`,
                number: 1,
                title: levelNum === 10 ? 'Real Numbers & Polynomials' : 'Rational Numbers',
                description: "Euclid's division lemma, fundamental theorem of arithmetic, irrational numbers.",
                topics: [
                  {
                    id: `tp-mth-1-1-${classLevel}`,
                    chapterId: `ch-mth-1-${classLevel}`,
                    title: 'Finding HCF & LCM via Prime Factorization',
                    summary: 'HCF x LCM = Product of two numbers.',
                    masteryLevel: 95,
                    lessons: [],
                  },
                ],
              },
              {
                id: `ch-mth-2-${classLevel}`,
                bookId: `bk-mth-${classLevel}`,
                number: 2,
                title: levelNum === 10 ? 'Quadratic Equations' : 'Linear Equations in One Variable',
                description: 'Standard form ax^2 + bx + c = 0, discriminant, quadratic formula.',
                topics: [
                  {
                    id: `tp-mth-2-1-${classLevel}`,
                    chapterId: `ch-mth-2-${classLevel}`,
                    title: 'Discriminant & Nature of Roots',
                    summary: 'D = b^2 - 4ac. D > 0 (2 distinct real roots), D = 0 (equal roots), D < 0 (no real roots).',
                    masteryLevel: 35, // Weak topic
                    lessons: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: `sst-${classLevel}`,
        name: 'Social Science',
        code: 'SST',
        iconName: 'Globe',
        color: 'from-amber-500 to-yellow-600',
        classLevels: [classLevel],
        books: [
          {
            id: `bk-sst-${classLevel}`,
            title: `NCERT Social Science Class ${classLevel}`,
            subjectId: `sst-${classLevel}`,
            chapters: [
              {
                id: `ch-sst-1-${classLevel}`,
                bookId: `bk-sst-${classLevel}`,
                number: 1,
                title: 'The Rise of Nationalism / Geography Resources',
                description: 'History, political movements, democratic rights, and economic development.',
                topics: [
                  {
                    id: `tp-sst-1-1-${classLevel}`,
                    chapterId: `ch-sst-1-${classLevel}`,
                    title: 'Resource Planning & Conservation',
                    summary: 'Renewable vs non-renewable resources, soil erosion, and sustainable development.',
                    masteryLevel: 70,
                    lessons: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: `eng-${classLevel}`,
        name: 'English',
        code: 'ENG',
        iconName: 'BookOpen',
        color: 'from-emerald-500 to-teal-600',
        classLevels: [classLevel],
        books: [
          {
            id: `bk-eng-${classLevel}`,
            title: `First Flight Class ${classLevel}`,
            subjectId: `eng-${classLevel}`,
            chapters: [
              {
                id: `ch-eng-1-${classLevel}`,
                bookId: `bk-eng-${classLevel}`,
                number: 1,
                title: 'A Letter to God & Grammar',
                description: 'Prose, poetry, grammar, active/passive voice, and formal letter writing.',
                topics: [
                  {
                    id: `tp-eng-1-1-${classLevel}`,
                    chapterId: `ch-eng-1-${classLevel}`,
                    title: 'Theme & Character Analysis of Lencho',
                    summary: 'Faith in God, irony of the post office employees.',
                    masteryLevel: 85,
                    lessons: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: `hin-${classLevel}`,
        name: 'Hindi (हिंदी)',
        code: 'HIN',
        iconName: 'Languages',
        color: 'from-rose-500 to-red-600',
        classLevels: [classLevel],
        books: [
          {
            id: `bk-hin-${classLevel}`,
            title: `स्पर्श भाग 2 कक्षा ${classLevel}`,
            subjectId: `hin-${classLevel}`,
            chapters: [
              {
                id: `ch-hin-1-${classLevel}`,
                bookId: `bk-hin-${classLevel}`,
                number: 1,
                title: 'साखी एवं पद / व्याकरण',
                description: 'कबीर की साखियां, अलंकार, समास एवं पत्र लेखन।',
                topics: [
                  {
                    id: `tp-hin-1-1-${classLevel}`,
                    chapterId: `ch-hin-1-${classLevel}`,
                    title: 'कबीर की साखी का भावार्थ',
                    summary: 'मीठी वाणी, अहंकार का त्याग और ईश्वर प्रेम।',
                    masteryLevel: 90,
                    lessons: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
  }

  // Primary Classes (1 to 5)
  return [
    {
      id: `mth-elem-${classLevel}`,
      name: 'Elementary Math',
      code: 'MATH',
      iconName: 'Calculator',
      color: 'from-blue-500 to-cyan-600',
      classLevels: [classLevel],
      books: [
        {
          id: `bk-mth-elem-${classLevel}`,
          title: `Math Magic Class ${classLevel}`,
          subjectId: `mth-elem-${classLevel}`,
          chapters: [
            {
              id: `ch-mth-elem-1`,
              bookId: `bk-mth-elem-${classLevel}`,
              number: 1,
              title: 'Numbers, Shapes and Counting',
              description: 'Addition, subtraction, basic multiplication, shapes, and patterns.',
              topics: [
                {
                  id: `tp-mth-elem-1-1`,
                  chapterId: `ch-mth-elem-1`,
                  title: 'Addition & Subtraction Tables',
                  summary: 'Fun visual mental math exercises.',
                  masteryLevel: 90,
                  lessons: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: `evs-${classLevel}`,
      name: 'EVS / Environmental Studies',
      code: 'EVS',
      iconName: 'Leaf',
      color: 'from-emerald-500 to-green-600',
      classLevels: [classLevel],
      books: [
        {
          id: `bk-evs-${classLevel}`,
          title: `Looking Around Class ${classLevel}`,
          subjectId: `evs-${classLevel}`,
          chapters: [
            {
              id: `ch-evs-1`,
              bookId: `bk-evs-${classLevel}`,
              number: 1,
              title: 'Our Family, Animals & Plants',
              description: 'Understanding nature, animals, food habits, and environmental care.',
              topics: [
                {
                  id: `tp-evs-1-1`,
                  chapterId: `ch-evs-1`,
                  title: 'Types of Plants and Trees',
                  summary: 'Herbs, shrubs, trees, climbers, and creepers.',
                  masteryLevel: 85,
                  lessons: [],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}
