export type LanguageCode = 'en' | 'hi' | 'hinglish' | 'mr' | 'bn' | 'ta' | 'te';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  isAvailable: boolean;
  direction?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', isAvailable: true, direction: 'ltr' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी (Hindi)', flag: '🇮🇳', isAvailable: true, direction: 'ltr' },
  { code: 'hinglish', label: 'Hinglish', nativeLabel: 'Hinglish (Hindi + English)', flag: '🇮🇳', isAvailable: true, direction: 'ltr' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी (Marathi)', flag: '🇮🇳', isAvailable: false, direction: 'ltr' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা (Bengali)', flag: '🇮🇳', isAvailable: false, direction: 'ltr' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ் (Tamil)', flag: '🇮🇳', isAvailable: false, direction: 'ltr' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు (Telugu)', flag: '🇮🇳', isAvailable: false, direction: 'ltr' },
];

export interface TranslationDictionary {
  appName: string;
  tagline: string;

  // Navigation
  navHome: string;
  navLearningCoach: string;
  navPersonalLearning: string;
  navSmartRevision: string;
  navAskAi: string;
  navPhotoSolver: string;
  navNotes: string;
  navBooks: string;
  navQuiz: string;
  navExamMode: string;
  navPaperGenerator: string;
  navStudyPlanner: string;
  navWeakTopics: string;
  navProgress: string;
  navAchievements: string;
  navParentDashboard: string;
  navTeacherDashboard: string;
  navAdminDashboard: string;
  navProfile: string;
  navSettings: string;
  navNotifications: string;
  allModules: string;
  portalsGroup: string;
  toolsGroup: string;
  trackGroup: string;
  userGroup: string;

  // AI Personal Learning System
  personalLearningTitle: string;
  personalLearningSubtitle: string;
  personalizedRecommendations: string;
  todaysFocus: string;
  topicsToRevise: string;
  recommendedPractice: string;
  examPreparation: string;
  dailyGoals: string;
  acceptRecommendation: string;
  dismissRecommendation: string;
  refreshRecommendations: string;
  whyRecommended: string;
  dataTriggerLabel: string;
  recommendedDifficulty: string;
  readinessScore: string;
  acceptedBadge: string;
  dismissedBadge: string;

  // Header & Stats & Roles
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  dailyStreak: string;
  totalXp: string;
  levelTitle: string;
  progressPercentage: string;
  studentMode: string;
  parentMode: string;
  teacherMode: string;
  selectRole: string;
  signIn: string;
  signOut: string;
  loggedInAs: string;
  switchLanguage: string;
  toggleTheme: string;
  activeLanguageLabel: string;

  // Quick Actions & Home Cards
  quickActions: string;
  btnAskAi: string;
  btnSolvePhoto: string;
  btnGenerateNotes: string;
  btnStartQuiz: string;
  btnExamMode: string;
  btnPaperGen: string;
  todayGoal: string;
  continueLearning: string;
  weakTopicsPreview: string;
  recentActivity: string;
  recommendedStudy: string;
  practiceNow: string;
  viewAll: string;
  targetWeakTopics: string;

  // Common UI Actions
  save: string;
  saveChanges: string;
  cancel: string;
  edit: string;
  delete: string;
  submit: string;
  loading: string;
  back: string;
  next: string;
  start: string;
  retry: string;
  close: string;
  searchPlaceholder: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  languageSelect: string;
  filter: string;
  clear: string;
  copy: string;
  copied: string;
  share: string;
  download: string;
  print: string;
  export: string;
  import: string;
  success: string;
  error: string;
  confirm: string;
  selectAll: string;
  deselectAll: string;
  status: string;
  active: string;
  completed: string;
  pending: string;
  inProgress: string;
  highPriority: string;
  mediumPriority: string;
  lowPriority: string;
  easy: string;
  medium: string;
  hard: string;
  mixed: string;

  // Translation Feature Actions
  translate: string;
  translating: string;
  translateToHindi: string;
  translateToEnglish: string;
  translateNote: string;
  translateQuiz: string;
  translatePlan: string;
  translateSolution: string;
  translateAnswer: string;
  translatedSuccess: string;
  originalLanguage: string;
  targetLanguage: string;
  bilingualMode: string;
  autoTranslateAi: string;

  // View Specific: Ask AI
  askAiTitle: string;
  askAiSubtitle: string;
  askAiPlaceholder: string;
  askAiSubjectMode: string;
  voiceAsk: string;
  voiceListening: string;
  clearChat: string;
  makeNotesFromChat: string;
  explainSimpler: string;
  quizMeOnThis: string;

  // View Specific: Photo Solver
  photoSolverTitle: string;
  photoSolverSubtitle: string;
  uploadPhoto: string;
  takePhoto: string;
  dragDropPhoto: string;
  analyzingPhoto: string;
  solvingProblem: string;
  solutionBreakdown: string;
  givenValues: string;
  formulaUsed: string;
  stepByStepSolution: string;
  finalAnswer: string;
  saveToNotes: string;
  practiceSimilar: string;

  // View Specific: Notes
  notesTitle: string;
  notesSubtitle: string;
  newNote: string;
  generateWithAi: string;
  searchNotes: string;
  noNotesFound: string;
  keyPoints: string;
  importantDefinitions: string;
  formulasAndRules: string;
  realWorldExamples: string;
  importantQuestions: string;
  quickRevision: string;

  // View Specific: Books
  booksTitle: string;
  booksSubtitle: string;
  selectBook: string;
  readOnline: string;
  generateNotesFromBook: string;
  generateQuizFromBook: string;

  // View Specific: Quiz
  quizTitle: string;
  quizSubtitle: string;
  startAiQuiz: string;
  questionCount: string;
  quizDifficulty: string;
  questionOf: string;
  timeRemaining: string;
  hint: string;
  showHint: string;
  explanation: string;
  submitQuiz: string;
  quizResults: string;
  yourScore: string;
  accuracy: string;
  xpEarned: string;
  reviewAnswers: string;
  retakeQuiz: string;

  // View Specific: Exam Mode
  examModeTitle: string;
  examModeSubtitle: string;
  startMockExam: string;
  examDuration: string;
  totalMarks: string;
  passingMarks: string;
  sectionA: string;
  sectionB: string;
  submitExam: string;
  autoEvaluation: string;
  reportCard: string;
  strengths: string;
  weaknesses: string;
  modelAnswer: string;

  // View Specific: Paper Generator
  paperGenTitle: string;
  paperGenSubtitle: string;
  generatePaper: string;
  paperBlueprint: string;
  printPaper: string;
  exportPdf: string;
  solutionKey: string;
  markingScheme: string;
  takeInExamMode: string;
  regenerateQuestion: string;

  // View Specific: Study Planner
  studyPlannerTitle: string;
  studyPlannerSubtitle: string;
  weeklyTargetHours: string;
  todayTasks: string;
  reOptimizePlan: string;
  addTask: string;
  taskCompleted: string;

  // View Specific: Weak Topics
  weakTopicsTitle: string;
  weakTopicsSubtitle: string;
  criticalTopics: string;
  fixWithAi: string;
  practice5Questions: string;

  // View Specific: Progress & Analytics
  progressTitle: string;
  progressSubtitle: string;
  weeklyStudyHours: string;
  subjectMastery: string;
  accuracyTrends: string;

  // View Specific: Achievements
  achievementsTitle: string;
  achievementsSubtitle: string;
  badgesUnlocked: string;
  levelMilestones: string;
  claimReward: string;

  // View Specific: Parent & Teacher Dashboards
  parentDashboardTitle: string;
  parentDashboardSubtitle: string;
  teacherDashboardTitle: string;
  teacherDashboardSubtitle: string;
  studentOverview: string;
  studyTimeReport: string;

  // View Specific: Profile
  profileTitle: string;
  profileSubtitle: string;
  studentName: string;
  classLevel: string;
  board: string;
  instructionMedium: string;
  preferredLanguage: string;
  learningGoals: string;

  // View Specific: Settings
  settingsTitle: string;
  settingsSubtitle: string;
  appearanceSettings: string;
  languageSettings: string;
  notificationSettings: string;
  backupSettings: string;
  exportBackup: string;
  importBackup: string;
  resetAllData: string;
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    appName: "EduAI Master",
    tagline: "Your Friendly AI Study Companion",

    // Navigation
    navHome: "Home",
    navLearningCoach: "AI Study Coach",
    navPersonalLearning: "What Should I Study?",
    navSmartRevision: "Quick Revision",
    navAskAi: "Ask AI",
    navPhotoSolver: "Photo Solver",
    navNotes: "AI Notes",
    navBooks: "My Books",
    navQuiz: "Practice Quiz",
    navExamMode: "Exam Practice",
    navPaperGenerator: "Make Test Paper",
    navStudyPlanner: "My Study Plan",
    navWeakTopics: "Topics to Fix",
    navProgress: "My Progress",
    navAchievements: "My Badges & XP",
    navParentDashboard: "Parent Portal",
    navTeacherDashboard: "Teacher Portal",
    navAdminDashboard: "Admin",
    navProfile: "My Profile",
    navSettings: "Settings",
    navNotifications: "Alerts & Reminders",
    allModules: "All Study Tools",
    portalsGroup: "Parent & Teacher",
    toolsGroup: "AI Study Tools",
    trackGroup: "Track Progress",
    userGroup: "Account",

    // AI Personal Learning System
    personalLearningTitle: "What Should I Study?",
    personalLearningSubtitle: "Smart study tips picked just for you based on your scores and weak topics",
    personalizedRecommendations: "Study Recommendations",
    todaysFocus: "Today's Main Goal",
    topicsToRevise: "Topics to Revise",
    recommendedPractice: "Recommended Practice",
    examPreparation: "Exam Prep",
    dailyGoals: "Today's Study Goals",
    acceptRecommendation: "Add to My Study Plan",
    dismissRecommendation: "Not Now",
    refreshRecommendations: "Refresh Suggestions",
    whyRecommended: "Why study this:",
    dataTriggerLabel: "Picked because:",
    recommendedDifficulty: "Difficulty Level",
    readinessScore: "Exam Readiness",
    acceptedBadge: "Added to Plan",
    dismissedBadge: "Skipped",

    // Header & Stats
    greetingMorning: "Good Morning",
    greetingAfternoon: "Good Afternoon",
    greetingEvening: "Good Evening",
    dailyStreak: "Day Streak",
    totalXp: "Total XP",
    levelTitle: "Level",
    progressPercentage: "Done",
    studentMode: "Student Mode",
    parentMode: "Parent Mode",
    teacherMode: "Teacher Mode",
    selectRole: "Switch Role",
    signIn: "Log In",
    signOut: "Log Out",
    loggedInAs: "Logged in as",
    switchLanguage: "Language",
    toggleTheme: "Change Theme",
    activeLanguageLabel: "English",

    // Quick Actions & Home
    quickActions: "Quick Study Tools",
    btnAskAi: "Ask AI",
    btnSolvePhoto: "Solve Photo Question",
    btnGenerateNotes: "Make Quick Notes",
    btnStartQuiz: "Start Quiz",
    btnExamMode: "Take Practice Exam",
    btnPaperGen: "Create Test Paper",
    todayGoal: "Today's Study Goal",
    continueLearning: "Continue Learning",
    weakTopicsPreview: "Fix Weak Topics",
    recentActivity: "Recent Activity",
    recommendedStudy: "What to Study Next",
    practiceNow: "Practice Now",
    viewAll: "See All",
    targetWeakTopics: "Improve Weak Topics",

    // Common UI
    save: "Save",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    submit: "Submit",
    loading: "Please wait...",
    back: "Back",
    next: "Next",
    start: "Start",
    retry: "Try Again",
    close: "Close",
    searchPlaceholder: "Search topics, chapters, or formulas...",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    themeSystem: "System Default",
    languageSelect: "Language",
    filter: "Filter",
    clear: "Clear",
    copy: "Copy",
    copied: "Copied!",
    share: "Share",
    download: "Download",
    print: "Print",
    export: "Export",
    import: "Import",
    success: "Done!",
    error: "Oops, something went wrong",
    confirm: "Confirm",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    status: "Status",
    active: "Active",
    completed: "Completed",
    pending: "Pending",
    inProgress: "In Progress",
    highPriority: "Important",
    mediumPriority: "Normal",
    lowPriority: "Low",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    mixed: "Mixed",

    // Translation Feature Actions
    translate: "Translate",
    translating: "Translating...",
    translateToHindi: "Translate to Hindi (हिंदी)",
    translateToEnglish: "Translate to English",
    translateNote: "Translate Notes",
    translateQuiz: "Translate Quiz",
    translatePlan: "Translate Plan",
    translateSolution: "Translate Solution",
    translateAnswer: "Translate Answer",
    translatedSuccess: "Translated!",
    originalLanguage: "Original",
    targetLanguage: "Target Language",
    bilingualMode: "Show Hindi & English",
    autoTranslateAi: "AI answers will match your chosen language",

    // Ask AI
    askAiTitle: "Ask AI Tutor",
    askAiSubtitle: "Ask any question or homework doubt and get simple step-by-step help",
    askAiPlaceholder: "Type your question or doubt here...",
    askAiSubjectMode: "Subject",
    voiceAsk: "Speak Question",
    voiceListening: "Listening... Please speak your question",
    clearChat: "Clear Chat",
    makeNotesFromChat: "Make Notes from Chat",
    explainSimpler: "Explain in Simpler Words",
    quizMeOnThis: "Quiz Me on This",

    // Photo Solver
    photoSolverTitle: "Photo Doubt Solver",
    photoSolverSubtitle: "Take a picture of any question from your book and get easy step-by-step answers",
    uploadPhoto: "Upload Photo",
    takePhoto: "Take a Photo",
    dragDropPhoto: "Drop your question photo here, or click to choose a file",
    analyzingPhoto: "Reading your question photo...",
    solvingProblem: "Writing step-by-step answer...",
    solutionBreakdown: "Step-by-Step Answer",
    givenValues: "What is Given",
    formulaUsed: "Formula Used",
    stepByStepSolution: "Steps to Solve",
    finalAnswer: "Final Answer",
    saveToNotes: "Save to My Notes",
    practiceSimilar: "Try Similar Questions",

    // Notes
    notesTitle: "AI Revision Notes",
    notesSubtitle: "Easy chapter summaries, key definitions, and formulas for quick study",
    newNote: "New Note",
    generateWithAi: "Make Notes with AI",
    searchNotes: "Search my notes...",
    noNotesFound: "No notes yet. Click 'Make Notes with AI' to start!",
    keyPoints: "Key Points",
    importantDefinitions: "Important Definitions",
    formulasAndRules: "Formulas & Rules",
    realWorldExamples: "Real-Life Examples",
    importantQuestions: "Important Exam Questions",
    quickRevision: "Quick Revision Points",

    // Books
    booksTitle: "NCERT & School Books",
    booksSubtitle: "Read chapter books online with instant AI explanations and quizzes",
    selectBook: "Select Book",
    readOnline: "Read Book",
    generateNotesFromBook: "Make Notes from Chapter",
    generateQuizFromBook: "Create Chapter Quiz",

    // Quiz
    quizTitle: "Practice Quiz",
    quizSubtitle: "Test what you know with friendly MCQs and fill-in-the-blanks",
    startAiQuiz: "Start Practice Quiz",
    questionCount: "Number of Questions",
    quizDifficulty: "Difficulty",
    questionOf: "Question",
    timeRemaining: "Time Left",
    hint: "Hint",
    showHint: "Show Hint",
    explanation: "Explanation",
    submitQuiz: "Submit Quiz",
    quizResults: "Quiz Results",
    yourScore: "Your Score",
    accuracy: "Accuracy",
    xpEarned: "XP Earned",
    reviewAnswers: "Check Answers",
    retakeQuiz: "Try Quiz Again",

    // Exam Mode
    examModeTitle: "Exam Practice Mode",
    examModeSubtitle: "Timed exam practice to help you prepare with real test questions",
    startMockExam: "Start Exam",
    examDuration: "Time Allowed",
    totalMarks: "Total Marks",
    passingMarks: "Passing Marks",
    sectionA: "Section A (Multiple Choice)",
    sectionB: "Section B (Short & Long Answers)",
    submitExam: "Finish & Submit Exam",
    autoEvaluation: "AI Teacher Checking",
    reportCard: "Your Report Card",
    strengths: "Your Strengths",
    weaknesses: "Where to Improve",
    modelAnswer: "Correct Answer Key",

    // Paper Generator
    paperGenTitle: "Question Paper Maker",
    paperGenSubtitle: "Make custom practice test papers with ready answers and marks",
    generatePaper: "Make Paper",
    paperBlueprint: "Paper Details",
    printPaper: "Print Paper",
    exportPdf: "Save as PDF",
    solutionKey: "Answer Key & Steps",
    markingScheme: "Marking Scheme",
    takeInExamMode: "Take Test Now",
    regenerateQuestion: "New Question",

    // Study Planner
    studyPlannerTitle: "My Study Plan",
    studyPlannerSubtitle: "Your personal 7-day study timetable to stay on track",
    weeklyTargetHours: "Weekly Study Goal",
    todayTasks: "Today's Tasks",
    reOptimizePlan: "Update Plan with AI",
    addTask: "Add New Task",
    taskCompleted: "Task Done!",

    // Weak Topics
    weakTopicsTitle: "Topics to Fix",
    weakTopicsSubtitle: "Find tricky topics and make them easy with AI step-by-step help",
    criticalTopics: "Important Topics to Review",
    fixWithAi: "Help Me Understand",
    practice5Questions: "Practice 5 Questions",

    // Progress & Analytics
    progressTitle: "My Progress",
    progressSubtitle: "See your study time, quiz scores, and subject mastery",
    weeklyStudyHours: "Study Time This Week",
    subjectMastery: "Subject Progress",
    accuracyTrends: "Score History",

    // Achievements
    achievementsTitle: "My Badges & XP",
    achievementsSubtitle: "Earn XP points, unlock fun badges, and keep your daily streak alive",
    badgesUnlocked: "Badges Earned",
    levelMilestones: "Levels & Rewards",
    claimReward: "Claim Reward",

    // Parent & Teacher Dashboards
    parentDashboardTitle: "Parent Portal",
    parentDashboardSubtitle: "See daily study time, test scores, and learning progress",
    teacherDashboardTitle: "Teacher Portal",
    teacherDashboardSubtitle: "View student progress, create test papers, and check class scores",
    studentOverview: "Student Overview",
    studyTimeReport: "Study Time Summary",

    // Profile
    profileTitle: "My Profile",
    profileSubtitle: "Manage your name, class, board, and study goals",
    studentName: "Student Name",
    classLevel: "Class / Grade",
    board: "School Board",
    instructionMedium: "Study Medium",
    preferredLanguage: "App Language",
    learningGoals: "My Study Target",

    // Settings
    settingsTitle: "Settings",
    settingsSubtitle: "Change theme, language, reminders, and data backup",
    appearanceSettings: "Theme & Colors",
    languageSettings: "Language",
    notificationSettings: "Study Reminders",
    backupSettings: "Save & Restore Data",
    exportBackup: "Save Backup to File",
    importBackup: "Load Backup from File",
    resetAllData: "Reset All App Data",
  },

  hi: {
    appName: "EduAI मास्टर",
    tagline: "आपका अपना AI पढ़ाई साथी",

    // Navigation
    navHome: "होम",
    navLearningCoach: "AI पढ़ाई कोच",
    navPersonalLearning: "क्या पढ़ना चाहिए?",
    navSmartRevision: "रिवीजन",
    navAskAi: "AI से पूछें",
    navPhotoSolver: "फोटो से पूछें",
    navNotes: "AI नोट्स",
    navBooks: "मेरी किताबें",
    navQuiz: "क्विज अभ्यास",
    navExamMode: "परीक्षा तैयारी",
    navPaperGenerator: "टेस्ट पेपर बनाएं",
    navStudyPlanner: "मेरा स्टडी प्लान",
    navWeakTopics: "कमजोर विषय सुधारें",
    navProgress: "मेरी प्रगति",
    navAchievements: "बैज और XP",
    navParentDashboard: "अभिभावक पोर्टल",
    navTeacherDashboard: "शिक्षक पोर्टल",
    navAdminDashboard: "प्रशासक",
    navProfile: "मेरी प्रोफाइल",
    navSettings: "सेटिंग्स",
    navNotifications: "सूचनाएं और रिमाइंडर",
    allModules: "सभी पढ़ाई टूल्स",
    portalsGroup: "अभिभावक व शिक्षक",
    toolsGroup: "AI पढ़ाई टूल्स",
    trackGroup: "प्रगति देखें",
    userGroup: "खाता",

    // AI Personal Learning System
    personalLearningTitle: "क्या पढ़ना चाहिए?",
    personalLearningSubtitle: "आपके स्कोर और कमजोर विषयों के आधार पर चुनी गई स्मार्ट पढ़ाई टिप्स",
    personalizedRecommendations: "आपके लिए पढ़ाई सुझाव",
    todaysFocus: "आज का मुख्य लक्ष्य",
    topicsToRevise: "दोहराने वाले विषय",
    recommendedPractice: "अभ्यास सुझाव",
    examPreparation: "परीक्षा की तैयारी",
    dailyGoals: "आज के पढ़ाई लक्ष्य",
    acceptRecommendation: "स्टडी प्लान में जोड़ें",
    dismissRecommendation: "अभी नहीं",
    refreshRecommendations: "सुझाव ताज़ा करें",
    whyRecommended: "यह क्यों पढ़ना चाहिए:",
    dataTriggerLabel: "कारण:",
    recommendedDifficulty: "कठिनाई",
    readinessScore: "परीक्षा तैयारी स्कोर",
    acceptedBadge: "प्लान में जोड़ा गया",
    dismissedBadge: "छोड़ा गया",

    // Header & Stats
    greetingMorning: "शुभ प्रभात",
    greetingAfternoon: "शुभ दोपहर",
    greetingEvening: "शुभ संध्या",
    dailyStreak: "दिनों का स्ट्रिक",
    totalXp: "कुल XP",
    levelTitle: "लेवल",
    progressPercentage: "पूर्ण",
    studentMode: "विद्यार्थी मोड",
    parentMode: "अभिभावक मोड",
    teacherMode: "शिक्षक मोड",
    selectRole: "भूमिका बदलें",
    signIn: "लॉग इन करें",
    signOut: "लॉग आउट",
    loggedInAs: "लॉग इन:",
    switchLanguage: "भाषा",
    toggleTheme: "थीम बदलें",
    activeLanguageLabel: "हिंदी",

    // Quick Actions & Home
    quickActions: "त्वरित पढ़ाई टूल्स",
    btnAskAi: "AI से पूछें",
    btnSolvePhoto: "फोटो सवाल हल करें",
    btnGenerateNotes: "रिवीजन नोट्स बनाएं",
    btnStartQuiz: "क्विज शुरू करें",
    btnExamMode: "मॉक परीक्षा दें",
    btnPaperGen: "टेस्ट पेपर बनाएं",
    todayGoal: "आज का पढ़ाई लक्ष्य",
    continueLearning: "पढ़ाई जारी रखें",
    weakTopicsPreview: "कमजोर विषय सुधारें",
    recentActivity: "हाल की पढ़ाई",
    recommendedStudy: "आगे क्या पढ़ें",
    practiceNow: "अभी अभ्यास करें",
    viewAll: "सभी देखें",
    targetWeakTopics: "कमजोर विषय मजबूत करें",

    // Common UI
    save: "सहेजें",
    saveChanges: "बदलाव सहेजें",
    cancel: "रद्द करें",
    edit: "संपादित करें",
    delete: "हटाएं",
    submit: "जमा करें",
    loading: "कृपया प्रतीक्षा करें...",
    back: "पीछे",
    next: "आगे",
    start: "शुरू करें",
    retry: "फिर कोशिश करें",
    close: "बंद करें",
    searchPlaceholder: "पाठ, सूत्र या सवाल खोजें...",
    themeLight: "लाइट मोड",
    themeDark: "डार्क मोड",
    themeSystem: "सिस्टम डिफॉल्ट",
    languageSelect: "भाषा",
    filter: "फ़िल्टर",
    clear: "साफ़ करें",
    copy: "कॉपी करें",
    copied: "कॉपी हो गया!",
    share: "शेयर करें",
    download: "डाउनलोड करें",
    print: "प्रिंट करें",
    export: "एक्सपोर्ट",
    import: "इंपोर्ट",
    success: "हो गया!",
    error: "कुछ गड़बड़ हुई",
    confirm: "पुष्टि करें",
    selectAll: "सभी चुनें",
    deselectAll: "सभी हटाएं",
    status: "स्थिति",
    active: "सक्रिय",
    completed: "पूर्ण",
    pending: "बाकी है",
    inProgress: "जारी है",
    highPriority: "जरूरी",
    mediumPriority: "सामान्य",
    lowPriority: "कम",
    easy: "सरल",
    medium: "मध्यम",
    hard: "कठिन",
    mixed: "मिश्रित",

    // Translation Feature Actions
    translate: "अनुवाद करें",
    translating: "अनुवाद हो रहा है...",
    translateToHindi: "हिंदी में अनुवाद करें",
    translateToEnglish: "अंग्रेज़ी में अनुवाद करें",
    translateNote: "नोट्स अनुवाद करें",
    translateQuiz: "क्विज अनुवाद करें",
    translatePlan: "प्लान अनुवाद करें",
    translateSolution: "समाधान अनुवाद करें",
    translateAnswer: "उत्तर अनुवाद करें",
    translatedSuccess: "अनुवाद हो गया!",
    originalLanguage: "मूल भाषा",
    targetLanguage: "अनुवाद भाषा",
    bilingualMode: "हिंदी और अंग्रेज़ी दोनों देखें",
    autoTranslateAi: "AI उत्तर आपकी चुनी भाषा में मिलेंगे",

    // Ask AI
    askAiTitle: "AI टीचर से पूछें",
    askAiSubtitle: "अपनी किताब या होमवर्क का कोई भी सवाल पूछें और आसान भाषा में समझें",
    askAiPlaceholder: "अपना सवाल या शंका यहाँ लिखें...",
    askAiSubjectMode: "विषय",
    voiceAsk: "बोलकर पूछें",
    voiceListening: "सुन रहा हूँ... अपना सवाल बोलें",
    clearChat: "चैट साफ़ करें",
    makeNotesFromChat: "चैट से नोट्स बनाएं",
    explainSimpler: "और सरल शब्दों में समझाएं",
    quizMeOnThis: "इस पर सवाल पूछें",

    // Photo Solver
    photoSolverTitle: "फोटो से सवाल हल करें",
    photoSolverSubtitle: "किताब के सवाल की फोटो खींचें और आसान स्टेप्स में उत्तर पाएं",
    uploadPhoto: "फोटो अपलोड करें",
    takePhoto: "कैमरे से फोटो लें",
    dragDropPhoto: "फोटो यहाँ खींचें या फाइल चुनें",
    analyzingPhoto: "सवाल पढ़ा जा रहा है...",
    solvingProblem: "उत्तर तैयार हो रहा है...",
    solutionBreakdown: "स्टेप-बाय-स्टेप हल",
    givenValues: "क्या दिया गया है",
    formulaUsed: "प्रयुक्त सूत्र",
    stepByStepSolution: "हल करने के चरण",
    finalAnswer: "अंतिम उत्तर",
    saveToNotes: "नोट्स में सहेजें",
    practiceSimilar: "ऐसे और सवाल हल करें",

    // Notes
    notesTitle: "AI रिवीजन नोट्स",
    notesSubtitle: "परीक्षा के लिए आसान सारांश, परिभाषाएं और सूत्र",
    newNote: "नया नोट बनाएं",
    generateWithAi: "AI से नोट्स बनाएं",
    searchNotes: "नोट्स खोजें...",
    noNotesFound: "अभी कोई नोट नहीं है। 'AI से नोट्स बनाएं' पर क्लिक करें!",
    keyPoints: "मुख्य बातें",
    importantDefinitions: "जरूरी परिभाषाएं",
    formulasAndRules: "सूत्र और नियम",
    realWorldExamples: "रोजमर्रा के उदाहरण",
    importantQuestions: "परीक्षा के जरूरी सवाल",
    quickRevision: "त्वरित रिवीजन बिंदु",

    // Books
    booksTitle: "NCERT और किताबें",
    booksSubtitle: "डिजिटल किताबें पढ़ें और तुरंत AI से समझें व क्विज हल करें",
    selectBook: "किताब चुनें",
    readOnline: "किताब पढ़ें",
    generateNotesFromBook: "पाठ के नोट्स बनाएं",
    generateQuizFromBook: "पाठ की क्विज बनाएं",

    // Quiz
    quizTitle: "अभ्यास क्विज",
    quizSubtitle: "MCQs और रिक्त स्थानों से अपनी तैयारी जांचें",
    startAiQuiz: "क्विज शुरू करें",
    questionCount: "प्रश्नों की संख्या",
    quizDifficulty: "कठिनाई",
    questionOf: "प्रश्न",
    timeRemaining: "बचा समय",
    hint: "संकेत",
    showHint: "संकेत देखें",
    explanation: "विस्तृत समझ",
    submitQuiz: "क्विज जमा करें",
    quizResults: "क्विज परिणाम",
    yourScore: "आपका स्कोर",
    accuracy: "सटीकता",
    xpEarned: "अर्जित XP",
    reviewAnswers: "उत्तर जांचें",
    retakeQuiz: "फिर से क्विज दें",

    // Exam Mode
    examModeTitle: "परीक्षा तैयारी मोड",
    examModeSubtitle: "समय सीमा के साथ असली परीक्षा जैसा अभ्यास करें",
    startMockExam: "परीक्षा शुरू करें",
    examDuration: "परीक्षा समय",
    totalMarks: "कुल अंक",
    passingMarks: "उत्तीर्ण अंक",
    sectionA: "खंड अ (बहुविकल्पीय प्रश्न)",
    sectionB: "खंड ब (लघु व दीर्घ उत्तरीय प्रश्न)",
    submitExam: "परीक्षा पूरी करके जमा करें",
    autoEvaluation: "AI टीचर द्वारा जांच",
    reportCard: "आपका रिपोर्ट कार्ड",
    strengths: "आपकी ताकत",
    weaknesses: "यहाँ सुधार करें",
    modelAnswer: "सही उत्तर कुंजी",

    // Paper Generator
    paperGenTitle: "टेस्ट पेपर मेकर",
    paperGenSubtitle: "उत्तर कुंजी और अंकों के साथ कस्टम टेस्ट पेपर बनाएं",
    generatePaper: "पेपर बनाएं",
    paperBlueprint: "पेपर विवरण",
    printPaper: "पेपर प्रिंट करें",
    exportPdf: "PDF सहेजें",
    solutionKey: "उत्तर कुंजी और चरण",
    markingScheme: "अंकन योजना",
    takeInExamMode: "अभी टेस्ट दें",
    regenerateQuestion: "नया सवाल लाएं",

    // Study Planner
    studyPlannerTitle: "मेरा स्टडी प्लान",
    studyPlannerSubtitle: "आपकी पढ़ाई को आसान बनाने वाला 7-दिवसीय टाइमटेबल",
    weeklyTargetHours: "साप्ताहिक पढ़ाई लक्ष्य",
    todayTasks: "आज के कार्य",
    reOptimizePlan: "AI से प्लान अपडेट करें",
    addTask: "नया कार्य जोड़ें",
    taskCompleted: "कार्य पूरा हुआ!",

    // Weak Topics
    weakTopicsTitle: "कमजोर विषय सुधारें",
    weakTopicsSubtitle: "मुश्किल विषयों को पहचानें और AI की मदद से आसान बनाएं",
    criticalTopics: "खास ध्यान देने वाले विषय",
    fixWithAi: "समझने में मदद लें",
    practice5Questions: "5 सवाल हल करें",

    // Progress & Analytics
    progressTitle: "मेरी प्रगति",
    progressSubtitle: "अपने पढ़ाई के घंटे, टेस्ट स्कोर और विषय की तैयारी देखें",
    weeklyStudyHours: "इस हफ्ते की पढ़ाई",
    subjectMastery: "विषयवार तैयारी",
    accuracyTrends: "स्कोर का इतिहास",

    // Achievements
    achievementsTitle: "मेरे बैज और XP",
    achievementsSubtitle: "XP पॉइंट्स कमाएं, मजेदार बैज अनलॉक करें और डेली स्ट्रिक बनाएं",
    badgesUnlocked: "अर्जित बैज",
    levelMilestones: "लेवल और इनाम",
    claimReward: "इनाम प्राप्त करें",

    // Parent & Teacher Dashboards
    parentDashboardTitle: "अभिभावक पोर्टल",
    parentDashboardSubtitle: "दैनिक पढ़ाई का समय, टेस्ट स्कोर और प्रगति देखें",
    teacherDashboardTitle: "शिक्षक पोर्टल",
    teacherDashboardSubtitle: "छात्रों की प्रगति देखें, टेस्ट बनाएं और कक्षा स्कोर जांचें",
    studentOverview: "छात्र अवलोकन",
    studyTimeReport: "पढ़ाई समय रिपोर्ट",

    // Profile
    profileTitle: "मेरी प्रोफाइल",
    profileSubtitle: "अपना नाम, कक्षा, बोर्ड और पढ़ाई के लक्ष्य संभालें",
    studentName: "विद्यार्थी का नाम",
    classLevel: "कक्षा",
    board: "बोर्ड",
    instructionMedium: "माध्यम",
    preferredLanguage: "ऐप की भाषा",
    learningGoals: "पढ़ाई का लक्ष्य",

    // Settings
    settingsTitle: "सेटिंग्स",
    settingsSubtitle: "थीम, भाषा, रिमाइंडर और डेटा बैकअप बदलें",
    appearanceSettings: "थीम और रंग",
    languageSettings: "भाषा",
    notificationSettings: "पढ़ाई रिमाइंडर",
    backupSettings: "डेटा सहेजें व रीस्टोर करें",
    exportBackup: "बैकअप फाइल डाउनलोड करें",
    importBackup: "बैकअप फाइल लोड करें",
    resetAllData: "सभी ऐप डेटा रीसेट करें",
  },

  hinglish: {
    appName: "EduAI Master",
    tagline: "Aapka Apna AI Study Buddy",

    navHome: "Home",
    navLearningCoach: "AI Study Coach",
    navPersonalLearning: "Kya Padhna Chahiye?",
    navSmartRevision: "Quick Revision",
    navAskAi: "Ask AI",
    navPhotoSolver: "Photo Solver",
    navNotes: "AI Notes",
    navBooks: "Meri Books",
    navQuiz: "Practice Quiz",
    navExamMode: "Exam Practice",
    navPaperGenerator: "Test Paper Banao",
    navStudyPlanner: "Mera Study Plan",
    navWeakTopics: "Weak Topics Fix Karein",
    navProgress: "Meri Progress",
    navAchievements: "Badges & XP",
    navParentDashboard: "Parent Portal",
    navTeacherDashboard: "Teacher Portal",
    navAdminDashboard: "Admin",
    navProfile: "Meri Profile",
    navSettings: "Settings",
    navNotifications: "Alerts & Reminders",
    allModules: "Saare Study Tools",
    portalsGroup: "Parent & Teacher",
    toolsGroup: "AI Study Tools",
    trackGroup: "Track Progress",
    userGroup: "Account",

    // AI Personal Learning System
    personalLearningTitle: "Kya Padhna Chahiye?",
    personalLearningSubtitle: "Aapke test scores aur weak topics ke mutabiq smart study suggestions",
    personalizedRecommendations: "Study Recommendations",
    todaysFocus: "Aaj Ka Main Goal",
    topicsToRevise: "Revise Karne Wale Topics",
    recommendedPractice: "Recommended Practice",
    examPreparation: "Exam Ki Taiyari",
    dailyGoals: "Aaj Ke Study Goals",
    acceptRecommendation: "Study Plan Me Add Karein",
    dismissRecommendation: "Abhi Nahi",
    refreshRecommendations: "Suggestions Refresh Karein",
    whyRecommended: "Yeh Kyu Padhna Hai:",
    dataTriggerLabel: "Wajah:",
    recommendedDifficulty: "Difficulty",
    readinessScore: "Exam Readiness Score",
    acceptedBadge: "Plan Me Added",
    dismissedBadge: "Skipped",

    greetingMorning: "Good Morning",
    greetingAfternoon: "Good Afternoon",
    greetingEvening: "Good Evening",
    dailyStreak: "Day Streak",
    totalXp: "Total XP",
    levelTitle: "Level",
    progressPercentage: "Done",
    studentMode: "Student Mode",
    parentMode: "Parent Mode",
    teacherMode: "Teacher Mode",
    selectRole: "Role Switch Karein",
    signIn: "Log In",
    signOut: "Log Out",
    loggedInAs: "Logged in as",
    switchLanguage: "Language",
    toggleTheme: "Theme Change Karein",
    activeLanguageLabel: "Hinglish",

    quickActions: "Quick Study Tools",
    btnAskAi: "Ask AI",
    btnSolvePhoto: "Photo Doubt Solve Karein",
    btnGenerateNotes: "Quick Notes Banao",
    btnStartQuiz: "Quiz Shuru Karein",
    btnExamMode: "Practice Exam Do",
    btnPaperGen: "Test Paper Banao",
    todayGoal: "Aaj Ka Study Goal",
    continueLearning: "Padhai Continue Karein",
    weakTopicsPreview: "Weak Topics Fix Karein",
    recentActivity: "Recent Activity",
    recommendedStudy: "Aage Kya Padhein",
    practiceNow: "Abhi Practice Karein",
    viewAll: "Sab Dekhein",
    targetWeakTopics: "Weak Topics Improve Karein",

    save: "Save Karein",
    saveChanges: "Changes Save Karein",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    submit: "Submit",
    loading: "Please wait...",
    back: "Back",
    next: "Next",
    start: "Start",
    retry: "Try Again",
    close: "Close",
    searchPlaceholder: "Topic, chapter ya formula search karein...",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    themeSystem: "System Default",
    languageSelect: "Language",
    filter: "Filter",
    clear: "Clear",
    copy: "Copy",
    copied: "Copied!",
    share: "Share",
    download: "Download",
    print: "Print",
    export: "Export",
    import: "Import",
    success: "Done!",
    error: "Oops, kuch problem hui",
    confirm: "Confirm",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    status: "Status",
    active: "Active",
    completed: "Completed",
    pending: "Pending",
    inProgress: "In Progress",
    highPriority: "Important",
    mediumPriority: "Normal",
    lowPriority: "Low",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    mixed: "Mixed",

    translate: "Translate",
    translating: "Translating...",
    translateToHindi: "Hindi Me Translate Karein",
    translateToEnglish: "English Me Translate Karein",
    translateNote: "Note Translate Karein",
    translateQuiz: "Quiz Translate Karein",
    translatePlan: "Plan Translate Karein",
    translateSolution: "Solution Translate Karein",
    translateAnswer: "Answer Translate Karein",
    translatedSuccess: "Successfully Translated!",
    originalLanguage: "Original",
    targetLanguage: "Target Language",
    bilingualMode: "Hindi & English Dono Dekhein",
    autoTranslateAi: "AI answers chosen language ko follow karenge",

    askAiTitle: "Ask AI Tutor",
    askAiSubtitle: "Apne syllabus ka koi bhi doubt poochiye simple step-by-step help ke saath",
    askAiPlaceholder: "Apna question ya doubt type karein...",
    askAiSubjectMode: "Subject",
    voiceAsk: "Bolkar Poocho",
    voiceListening: "Listening... Apna question clearly boleiye",
    clearChat: "Chat Clear Karein",
    makeNotesFromChat: "Chat Se Notes Banao",
    explainSimpler: "Aur Simple Language Me Samjhao",
    quizMeOnThis: "Ispe Quiz Lo",

    photoSolverTitle: "Photo Doubt Solver",
    photoSolverSubtitle: "Book ke question ki photo click karein aur step-by-step answers paayein",
    uploadPhoto: "Photo Upload Karein",
    takePhoto: "Camera Se Photo Lein",
    dragDropPhoto: "Question image yahan drop karein ya browse karein",
    analyzingPhoto: "Question photo read ho raha hai...",
    solvingProblem: "Step-by-step solution prepare ho raha hai...",
    solutionBreakdown: "Step-by-Step Answer",
    givenValues: "Given Data",
    formulaUsed: "Formulas & Rules",
    stepByStepSolution: "Steps to Solve",
    finalAnswer: "Final Answer",
    saveToNotes: "Notes Me Save Karein",
    practiceSimilar: "Similar Questions Practice Karein",

    notesTitle: "AI Revision Notes",
    notesSubtitle: "Easy chapter summaries, key definitions aur formulas",
    newNote: "New Note",
    generateWithAi: "AI Se Notes Banao",
    searchNotes: "Notes search karein...",
    noNotesFound: "Koi note nahi mila. 'AI Se Notes Banao' click karein!",
    keyPoints: "Key Points",
    importantDefinitions: "Important Definitions",
    formulasAndRules: "Formulas & Rules",
    realWorldExamples: "Real-Life Examples",
    importantQuestions: "Important Exam Questions",
    quickRevision: "Quick Revision Points",

    booksTitle: "NCERT & School Books",
    booksSubtitle: "Textbooks padhein aur instant AI explanations aur quiz paayein",
    selectBook: "Book Select Karein",
    readOnline: "Online Padhein",
    generateNotesFromBook: "Chapter Notes Banao",
    generateQuizFromBook: "Chapter Quiz Banao",

    quizTitle: "Practice Quiz",
    quizSubtitle: "MCQs aur true/false ke saath apni preparation test karein",
    startAiQuiz: "Quiz Start Karein",
    questionCount: "Number of Questions",
    quizDifficulty: "Difficulty",
    questionOf: "Question",
    timeRemaining: "Time Bacha Hai",
    hint: "Hint",
    showHint: "Hint Dekhein",
    explanation: "Explanation",
    submitQuiz: "Quiz Submit Karein",
    quizResults: "Quiz Results",
    yourScore: "Aapka Score",
    accuracy: "Accuracy",
    xpEarned: "Earned XP",
    reviewAnswers: "Answers Check Karein",
    retakeQuiz: "Quiz Dobara Dein",

    examModeTitle: "Exam Practice Mode",
    examModeSubtitle: "Timed board exam practice to help you prepare",
    startMockExam: "Exam Start Karein",
    examDuration: "Exam Time",
    totalMarks: "Total Marks",
    passingMarks: "Passing Marks",
    sectionA: "Section A (Objective & MCQs)",
    sectionB: "Section B (Short & Long Answers)",
    submitExam: "Exam Submit Karein",
    autoEvaluation: "AI Teacher Auto-Grading",
    reportCard: "Aapka Report Card",
    strengths: "Aapki Strengths",
    weaknesses: "Improvement Areas",
    modelAnswer: "Correct Answer Key",

    paperGenTitle: "Question Paper Maker",
    paperGenSubtitle: "Custom test papers, step-by-step answer keys aur marks banayein",
    generatePaper: "Paper Banao",
    paperBlueprint: "Paper Details",
    printPaper: "Paper Print Karein",
    exportPdf: "Save as PDF",
    solutionKey: "Answer Key & Steps",
    markingScheme: "Marking Scheme",
    takeInExamMode: "Abhi Test Do",
    regenerateQuestion: "Naya Question Banao",

    studyPlannerTitle: "Mera Study Plan",
    studyPlannerSubtitle: "7-day study timetable aapki padhai ko aasan banane ke liye",
    weeklyTargetHours: "Weekly Study Goal",
    todayTasks: "Aaj Ke Tasks",
    reOptimizePlan: "AI Se Plan Update Karein",
    addTask: "New Task Add Karein",
    taskCompleted: "Task Done!",

    weakTopicsTitle: "Weak Topics Fix Karein",
    weakTopicsSubtitle: "Tricky topics ko pehchanein aur AI ki madad se aasan banayein",
    criticalTopics: "Important Topics to Review",
    fixWithAi: "AI Se Help Lein",
    practice5Questions: "5 Questions Practice Karein",

    progressTitle: "Meri Progress",
    progressSubtitle: "Study hours, quiz scores aur subject progress dekhein",
    weeklyStudyHours: "Is Week Ki Padhai",
    subjectMastery: "Subject Progress",
    accuracyTrends: "Score History",

    achievementsTitle: "Badges & XP",
    achievementsSubtitle: "XP points earn karein, fun badges unlock karein aur study streak maintain karein",
    badgesUnlocked: "Earned Badges",
    levelMilestones: "Levels & Rewards",
    claimReward: "Reward Claim Karein",

    parentDashboardTitle: "Parent Portal",
    parentDashboardSubtitle: "Daily study time, test scores aur progress dekhein",
    teacherDashboardTitle: "Teacher Portal",
    teacherDashboardSubtitle: "Student progress monitor karein aur test papers banayein",
    studentOverview: "Student Overview",
    studyTimeReport: "Study Time Report",

    profileTitle: "Meri Profile",
    profileSubtitle: "Name, class, board aur targets manage karein",
    studentName: "Student Name",
    classLevel: "Class",
    board: "Board",
    instructionMedium: "Medium",
    preferredLanguage: "Language",
    learningGoals: "Study Target",

    settingsTitle: "Settings",
    settingsSubtitle: "Theme, language, reminders aur data backup",
    appearanceSettings: "Theme & Colors",
    languageSettings: "Language",
    notificationSettings: "Study Reminders",
    backupSettings: "Save & Restore Data",
    exportBackup: "Backup File Save Karein",
    importBackup: "Backup File Load Karein",
    resetAllData: "App Data Reset Karein",
  },

  mr: {} as any,
  bn: {} as any,
  ta: {} as any,
  te: {} as any,
};

// Fallback for non-complete language dictionaries
['mr', 'bn', 'ta', 'te'].forEach((code) => {
  translations[code as LanguageCode] = { ...translations.en };
});

export function getTranslation(
  lang: LanguageCode | string,
  key: keyof TranslationDictionary,
  params?: Record<string, string | number>
): string {
  const currentLang = (lang as LanguageCode) || 'en';
  const dict = translations[currentLang] || translations.en;
  let text = dict[key] || translations.en[key] || String(key);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }

  return text;
}

export const t = getTranslation;
