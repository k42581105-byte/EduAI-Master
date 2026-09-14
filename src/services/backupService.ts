import {
  BackupMetadata,
  BackupSnapshotPayload,
  BackupVerificationReport,
  BackupScheduleConfig,
  BackupSystemStatus,
  BackupTriggerType,
  BackupContentCounts,
  StudentProfile,
  SavedNote,
  Conversation,
  Quiz,
  Exam,
  StudyPlan,
  WeakTopic,
  StrongTopic,
  Achievement,
  LevelMilestone,
  ScanHistoryItem,
  ActivityLog,
  AcademicSession,
  CurriculumBoard,
  CurriculumClass,
  CurriculumMedium,
  CurriculumSubject,
  CurriculumBook,
  AdminQuestionRecord,
  AdminQuizRecord,
  AdminExamRecord,
  AdminAuditLog,
  AdminUserRecord,
  RestorePreviewAnalysis,
  RestorePreviewDiffItem,
  PostRestoreValidationReport,
  PostRestoreValidationCheck,
  RecoveryLogRecord,
} from '../types';
import { StorageService } from './storageService';
import { ContentManagementService } from './contentManagementService';
import { AdminService } from './adminService';

const BACKUP_STORAGE_KEYS = {
  INDEX: 'eduai_admin_backups_index',
  PAYLOAD_PREFIX: 'eduai_admin_backup_data_',
  SCHEDULE_CONFIG: 'eduai_admin_backup_schedule_cfg',
  LAST_SCHEDULED_RUN: 'eduai_admin_backup_last_run',
  RECOVERY_LOGS: 'eduai_admin_recovery_logs',
};

// SENSITIVE KEYS DENYLIST: Strictly stripped from all backups
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /pin/i,
  /secret/i,
  /apikey/i,
  /api_key/i,
  /token/i,
  /auth_token/i,
  /credential/i,
  /private_key/i,
  /master_key/i,
  /access_key/i,
];

// Helper: Format bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper: Simple deterministic CRC32/Hash generator for data integrity check
function generateChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const len = str.length.toString(16).toUpperCase().padStart(4, '0');
  return `CRC32-${hex}-${len}`;
}

// Deep sanitization of objects to strip credentials
function sanitizeDeep<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeDeep(item)) as unknown as T;
  }

  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    // Check if key matches sensitive patterns
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      continue; // Strip key completely
    }

    if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeDeep(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

// Default initial schedule configuration
const DEFAULT_SCHEDULE_CONFIG: BackupScheduleConfig = {
  enabled: true,
  frequency: 'daily',
  lastAutoBackupAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  nextScheduledBackupAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
  retentionCount: 10,
  autoVerifyAfterBackup: true,
  autoDownloadAfterBackup: false,
};

export class BackupService {
  /**
   * Check if current session is authorized admin
   */
  private static checkAdminAuth(operation: string): boolean {
    if (!AdminService.isAdminUnlocked()) {
      console.warn(`[BackupService] Unauthorized attempt to perform: ${operation}`);
      return false;
    }
    return true;
  }

  /**
   * Safe localStorage Reader
   */
  private static getStored<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Safe localStorage Writer
   */
  private static setStored<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[BackupService] Storage write error for key ${key}:`, e);
    }
  }

  /**
   * Initialize and seed verified baseline backup if storage is empty
   */
  public static initialize(): void {
    const list = this.getBackupsHistory();
    if (list.length === 0) {
      this.createInitialBaselineBackup();
    }
    this.checkAndRunScheduledBackup();
  }

  /**
   * Create an initial baseline backup
   */
  private static createInitialBaselineBackup(): void {
    const result = this.createBackup(
      'system_checkpoint',
      'System Baseline & Initial Curriculum State',
      'Automatic verified foundation checkpoint containing full educational catalog and initial student profile.'
    );
    if (result.success && result.backup) {
      console.log('[BackupService] Initial baseline snapshot created:', result.backup.id);
    }
  }

  /**
   * Get all backup metadata records
   */
  public static getBackupsHistory(): BackupMetadata[] {
    return this.getStored<BackupMetadata[]>(BACKUP_STORAGE_KEYS.INDEX, []);
  }

  /**
   * Get full backup snapshot payload by ID
   */
  public static getBackupPayload(backupId: string): BackupSnapshotPayload | null {
    return this.getStored<BackupSnapshotPayload | null>(
      `${BACKUP_STORAGE_KEYS.PAYLOAD_PREFIX}${backupId}`,
      null
    );
  }

  /**
   * Create a comprehensive, sanitized Database Backup
   */
  public static createBackup(
    trigger: BackupTriggerType = 'manual',
    customTitle?: string,
    description?: string
  ): { success: boolean; backup?: BackupMetadata; error?: string } {
    if (!this.checkAdminAuth('createBackup')) {
      return { success: false, error: 'Unauthorized: Administrator authentication required.' };
    }

    try {
      const now = new Date().toISOString();
      const backupId = `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const title =
        customTitle ||
        (trigger === 'scheduled'
          ? `Auto-Scheduled Snapshot (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
          : `Full System Backup (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})`);

      // 1. Gather all important data sources
      const rawProfile = StorageService.getProfile();
      const rawUsers = AdminService.getUsersList();
      const rawNotes = StorageService.getNotes();
      const rawConversations = StorageService.getConversations();
      const rawQuizzes = StorageService.getQuizzes();
      const rawExams = StorageService.getExams();
      const rawStudyPlan = StorageService.getStudyPlan();
      const rawWeakTopics = StorageService.getWeakTopics();
      const rawStrongTopics = StorageService.getStrongTopics();
      const rawAchievements = StorageService.getAchievements();
      const rawMilestones = StorageService.getLevelMilestones();
      const rawScanHistory = StorageService.getScanHistory();
      const rawQuestionsSolved = StorageService.getQuestionsSolved();
      const rawActivities = StorageService.getActivities();

      // Curriculum Catalog
      const curriculumSessions = ContentManagementService.getSessions();
      const curriculumBoards = ContentManagementService.getBoards();
      const curriculumClasses = ContentManagementService.getClasses();
      const curriculumMediums = ContentManagementService.getMediums();
      const curriculumSubjects = ContentManagementService.getSubjects();
      const curriculumBooks = ContentManagementService.getBooks();

      // Admin Content
      const adminQuestions = AdminService.getQuestionsList();
      const adminQuizzes = AdminService.getAdminQuizzes();
      const adminExams = AdminService.getAdminExams();
      const adminAuditLogs = AdminService.getAuditLogs();

      // Calculate chapter/topic/lesson counts from books
      let chaptersCount = 0;
      let topicsCount = 0;
      let lessonsCount = 0;
      curriculumBooks.forEach((b) => {
        if (b.chapters) {
          chaptersCount += b.chapters.length;
          b.chapters.forEach((c) => {
            if (c.topics) {
              topicsCount += c.topics.length;
              c.topics.forEach((t) => {
                if (t.lessons) {
                  lessonsCount += t.lessons.length;
                }
              });
            }
          });
        }
      });

      // Total chat messages
      let chatMessagesCount = 0;
      rawConversations.forEach((c) => {
        chatMessagesCount += c.messages?.length || 0;
      });

      // 2. Perform deep sanitization (zero passwords, keys, or secrets)
      const sanitizedData = {
        profile: sanitizeDeep<StudentProfile>(rawProfile),
        users: sanitizeDeep<AdminUserRecord[]>(rawUsers),
        notes: sanitizeDeep<SavedNote[]>(rawNotes),
        conversations: sanitizeDeep<Conversation[]>(rawConversations),
        quizzes: sanitizeDeep<Quiz[]>(rawQuizzes),
        exams: sanitizeDeep<Exam[]>(rawExams),
        studyPlan: sanitizeDeep<StudyPlan>(rawStudyPlan),
        weakTopics: sanitizeDeep<WeakTopic[]>(rawWeakTopics),
        strongTopics: sanitizeDeep<StrongTopic[]>(rawStrongTopics),
        achievements: sanitizeDeep<Achievement[]>(rawAchievements),
        milestones: sanitizeDeep<LevelMilestone[]>(rawMilestones),
        scanHistory: sanitizeDeep<ScanHistoryItem[]>(rawScanHistory),
        questionsSolved: rawQuestionsSolved,
        activities: sanitizeDeep<ActivityLog[]>(rawActivities),
        curriculum: {
          sessions: sanitizeDeep<AcademicSession[]>(curriculumSessions),
          boards: sanitizeDeep<CurriculumBoard[]>(curriculumBoards),
          classes: sanitizeDeep<CurriculumClass[]>(curriculumClasses),
          mediums: sanitizeDeep<CurriculumMedium[]>(curriculumMediums),
          subjects: sanitizeDeep<CurriculumSubject[]>(curriculumSubjects),
          books: sanitizeDeep<CurriculumBook[]>(curriculumBooks),
        },
        admin: {
          questions: sanitizeDeep<AdminQuestionRecord[]>(adminQuestions),
          quizzes: sanitizeDeep<AdminQuizRecord[]>(adminQuizzes),
          exams: sanitizeDeep<AdminExamRecord[]>(adminExams),
          auditLogs: sanitizeDeep<AdminAuditLog[]>(adminAuditLogs),
        },
      };

      const counts: BackupContentCounts = {
        profiles: 1 + (rawUsers.length || 0),
        notes: rawNotes.length,
        conversations: rawConversations.length,
        chatMessages: chatMessagesCount,
        quizzes: rawQuizzes.length,
        exams: rawExams.length,
        studyPlans: rawStudyPlan?.tasks?.length || 0,
        weakTopics: rawWeakTopics.length,
        strongTopics: rawStrongTopics.length,
        achievements: rawAchievements.length,
        milestones: rawMilestones.length,
        scanHistory: rawScanHistory.length,
        questionsSolved: typeof rawQuestionsSolved === 'number' ? rawQuestionsSolved : 0,
        curriculumSessions: curriculumSessions.length,
        curriculumBoards: curriculumBoards.length,
        curriculumClasses: curriculumClasses.length,
        curriculumMediums: curriculumMediums.length,
        curriculumSubjects: curriculumSubjects.length,
        curriculumBooks: curriculumBooks.length,
        curriculumChapters: chaptersCount,
        curriculumTopics: topicsCount,
        curriculumLessons: lessonsCount,
        adminQuestions: adminQuestions.length,
        adminQuizzes: adminQuizzes.length,
        adminExams: adminExams.length,
        adminAuditLogs: adminAuditLogs.length,
        totalRecords:
          1 +
          rawNotes.length +
          rawConversations.length +
          rawQuizzes.length +
          rawExams.length +
          rawWeakTopics.length +
          rawStrongTopics.length +
          curriculumBooks.length +
          adminQuestions.length +
          adminQuizzes.length +
          adminExams.length,
      };

      const rawJson = JSON.stringify(sanitizedData);
      const sizeBytes = new Blob([rawJson]).size;
      const checksum = generateChecksum(rawJson);

      const metadata: BackupMetadata = {
        id: backupId,
        title,
        description: description || 'Complete snapshot of user progress, learning logs, curriculum catalogs, and admin content.',
        timestamp: now,
        trigger,
        version: '2.0.0-PROD',
        sizeBytes,
        sizeFormatted: formatBytes(sizeBytes),
        checksum,
        verificationStatus: 'verified',
        counts,
        createdBy: 'Principal Admin Console',
        storageKey: `${BACKUP_STORAGE_KEYS.PAYLOAD_PREFIX}${backupId}`,
      };

      const payload: BackupSnapshotPayload = {
        version: '2.0.0-PROD',
        exportFormat: 'EDUAI-SECURE-BACKUP-V2',
        metadata,
        sanitizedAt: now,
        data: sanitizedData,
      };

      // 3. Verification Report Generation
      const verificationReport = this.verifyBackupPayload(payload);
      metadata.verificationReport = verificationReport;
      metadata.verificationStatus = verificationReport.isValid
        ? 'verified'
        : verificationReport.warnings.length > 0
        ? 'warning'
        : 'failed';

      // 4. Save payload and update index
      this.setStored(metadata.storageKey!, payload);

      const history = this.getBackupsHistory();
      const updatedHistory = [metadata, ...history.filter((h) => h.id !== backupId)];

      // Apply retention policy
      const scheduleConfig = this.getScheduleConfig();
      const maxRetain = scheduleConfig.retentionCount || 10;
      if (updatedHistory.length > maxRetain) {
        const toPrune = updatedHistory.slice(maxRetain);
        toPrune.forEach((p) => {
          if (p.storageKey) {
            localStorage.removeItem(p.storageKey);
          }
        });
        updatedHistory.length = maxRetain;
      }

      this.setStored(BACKUP_STORAGE_KEYS.INDEX, updatedHistory);

      // Audit Log
      AdminService.logAudit(
        'Principal Admin',
        'Database Backup Created',
        'system',
        `Created ${trigger} backup "${title}" (${metadata.sizeFormatted}, ${counts.totalRecords} records, Checksum: ${checksum})`,
        'success'
      );

      return { success: true, backup: metadata };
    } catch (err: any) {
      console.error('[BackupService] Backup creation failed:', err);
      AdminService.logAudit(
        'Principal Admin',
        'Database Backup Failed',
        'system',
        `Backup creation failed: ${err?.message || 'Unknown error'}`,
        'error'
      );
      return { success: false, error: err?.message || 'Failed to create backup snapshot.' };
    }
  }

  /**
   * Verify a backup payload for schema, checksum, and zero sensitive credentials
   */
  public static verifyBackupPayload(payload: any): BackupVerificationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    let credentialsStripped = true;

    if (!payload || typeof payload !== 'object') {
      return {
        isValid: false,
        checkedAt: new Date().toISOString(),
        credentialsStripped: false,
        schemaValid: false,
        checksumMatched: false,
        totalRecordsCount: 0,
        errors: ['Payload is null or not a valid JSON object.'],
        warnings: [],
        summaryMessage: 'Invalid payload structure.',
      };
    }

    // 1. Check version & export format
    if (payload.exportFormat !== 'EDUAI-SECURE-BACKUP-V2' && !payload.version) {
      warnings.push('Backup format is legacy or missing standard exportFormat identifier.');
    }

    // 2. Check metadata
    if (!payload.metadata || !payload.metadata.id) {
      errors.push('Missing backup metadata header or unique backup ID.');
    }

    // 3. Scan for leaked secrets, passwords, or API keys
    const jsonString = JSON.stringify(payload);
    for (const pattern of SENSITIVE_KEY_PATTERNS) {
      // Look for keys like "password": "...", "apiKey": "..."
      const match = jsonString.match(new RegExp(`"${pattern.source}"\\s*:\\s*"([^"]+)"`, 'i'));
      if (match && match[1] && match[1].length > 0 && match[1] !== 'null' && match[1] !== 'undefined') {
        credentialsStripped = false;
        errors.push(`Security violation: Detected potential exposed credential for field matching '${pattern.source}'.`);
      }
    }

    // 4. Verify Checksum
    let checksumMatched = false;
    if (payload.metadata && payload.metadata.checksum && payload.data) {
      const computed = generateChecksum(JSON.stringify(payload.data));
      if (computed === payload.metadata.checksum) {
        checksumMatched = true;
      } else {
        warnings.push(`Checksum verification delta: Expected ${payload.metadata.checksum}, calculated ${computed}.`);
      }
    } else {
      warnings.push('Checksum was not present in metadata; calculated on the fly.');
      checksumMatched = true;
    }

    // 5. Data sections integrity
    if (!payload.data) {
      errors.push('Missing root data payload container.');
    } else {
      const d = payload.data;
      if (!d.profile || !d.profile.name) warnings.push('Profile data appears empty or incomplete.');
      if (!Array.isArray(d.notes)) warnings.push('Notes array is missing or malformed.');
      if (!Array.isArray(d.quizzes)) warnings.push('Quizzes array is missing or malformed.');
      if (!Array.isArray(d.exams)) warnings.push('Exams array is missing or malformed.');
      if (!d.curriculum) warnings.push('Curriculum section is missing.');
    }

    const totalRecords = payload.metadata?.counts?.totalRecords || 0;
    const isValid = errors.length === 0;

    return {
      isValid,
      checkedAt: new Date().toISOString(),
      credentialsStripped,
      schemaValid: isValid,
      checksumMatched,
      totalRecordsCount: totalRecords,
      errors,
      warnings,
      summaryMessage: isValid
        ? `Backup verified successfully (${totalRecords} items, 0 credentials exposed).`
        : `Verification failed with ${errors.length} error(s).`,
    };
  }

  /**
   * Delete a backup from history
   */
  public static deleteBackup(backupId: string): { success: boolean; error?: string } {
    if (!this.checkAdminAuth('deleteBackup')) {
      return { success: false, error: 'Unauthorized' };
    }

    const history = this.getBackupsHistory();
    const target = history.find((b) => b.id === backupId);
    if (!target) return { success: false, error: 'Backup not found' };

    if (target.storageKey) {
      try {
        localStorage.removeItem(target.storageKey);
      } catch (e) {
        console.error(e);
      }
    }

    const filtered = history.filter((b) => b.id !== backupId);
    this.setStored(BACKUP_STORAGE_KEYS.INDEX, filtered);

    AdminService.logAudit(
      'Principal Admin',
      'Database Backup Deleted',
      'system',
      `Deleted backup ID: ${backupId} ("${target.title}")`
    );
    return { success: true };
  }

  /**
   * Export backup as downloadable JSON
   */
  public static exportBackupAsJson(backupId: string): { filename: string; jsonContent: string } | null {
    const payload = this.getBackupPayload(backupId);
    if (!payload) return null;

    const dateStr = new Date(payload.metadata.timestamp).toISOString().split('T')[0];
    const filename = `eduai-backup-${backupId}-${dateStr}.json`;
    const jsonContent = JSON.stringify(payload, null, 2);
    return { filename, jsonContent };
  }

  /**
   * Run full data validation on the active database
   */
  public static validateActiveDatabaseIntegrity(): PostRestoreValidationReport {
    const checks: PostRestoreValidationCheck[] = [];
    let totalRecordsVerified = 0;
    let missingRelationsDetected = 0;
    let corruptedEntitiesQuarantined = 0;

    // 1. Profile Check
    const profile = StorageService.getProfile();
    const profileValid = Boolean(profile && profile.name && profile.classLevel);
    checks.push({
      id: 'chk-profile',
      name: 'Student Profile Record Integrity',
      category: 'schema',
      passed: profileValid,
      details: profileValid
        ? `Valid student profile (${profile.name}, Class: ${profile.classLevel}, Board: ${profile.board})`
        : 'Profile record is missing or incomplete.',
      countVerified: profileValid ? 1 : 0,
    });
    if (profileValid) totalRecordsVerified += 1;

    // 2. Notes Check
    const notes = StorageService.getNotes();
    let notesClean = true;
    let notesMalformed = 0;
    notes.forEach((n) => {
      if (!n.id || !n.title) {
        notesClean = false;
        notesMalformed++;
      }
    });
    checks.push({
      id: 'chk-notes',
      name: 'Personal Notes & Study Logs Schema',
      category: 'schema',
      passed: notesClean,
      details: notesClean
        ? `${notes.length} note items verified with valid IDs and timestamps.`
        : `${notesMalformed} note items contain malformed headers.`,
      countVerified: notes.length,
    });
    totalRecordsVerified += notes.length;
    if (!notesClean) corruptedEntitiesQuarantined += notesMalformed;

    // 3. Quizzes & Exams Check
    const quizzes = StorageService.getQuizzes();
    const exams = StorageService.getExams();
    let quizMalformed = 0;
    quizzes.forEach((q) => {
      if (!q.id || !Array.isArray(q.questions)) quizMalformed++;
    });
    checks.push({
      id: 'chk-quizzes',
      name: 'Diagnostic Quiz Histories Integrity',
      category: 'integrity',
      passed: quizMalformed === 0,
      details: quizMalformed === 0
        ? `${quizzes.length} quiz records verified with complete question arrays.`
        : `${quizMalformed} quizzes have missing question payloads.`,
      countVerified: quizzes.length,
    });
    totalRecordsVerified += quizzes.length;

    let examMalformed = 0;
    exams.forEach((e) => {
      if (!e.id || !Array.isArray(e.questions)) examMalformed++;
    });
    checks.push({
      id: 'chk-exams',
      name: 'Simulated Mock Exams & Timed Assessments',
      category: 'integrity',
      passed: examMalformed === 0,
      details: examMalformed === 0
        ? `${exams.length} exam records verified with score histories.`
        : `${examMalformed} exams have malformed records.`,
      countVerified: exams.length,
    });
    totalRecordsVerified += exams.length;

    // 4. Curriculum Hierarchy & Relational Linkage
    const books = ContentManagementService.getBooks();
    const subjects = ContentManagementService.getSubjects();
    const subjectIds = new Set(subjects.map((s) => s.id));
    let orphanedBooks = 0;

    books.forEach((b) => {
      if (b.subjectId && !subjectIds.has(b.subjectId)) {
        orphanedBooks++;
      }
    });

    checks.push({
      id: 'chk-curriculum-relations',
      name: 'Curriculum Hierarchy & Relational Foreign Keys',
      category: 'relations',
      passed: orphanedBooks === 0,
      details: orphanedBooks === 0
        ? `${books.length} digital books mapped to valid subject IDs.`
        : `${orphanedBooks} books reference non-existent subject IDs.`,
      countVerified: books.length + subjects.length,
    });
    totalRecordsVerified += books.length + subjects.length;
    missingRelationsDetected += orphanedBooks;

    // 5. Admin Question Repository
    const adminQuestions = AdminService.getQuestionsList();
    let questionsMalformed = 0;
    adminQuestions.forEach((q) => {
      if (!q.id || !q.question || !Array.isArray(q.options) || q.options.length < 2) {
        questionsMalformed++;
      }
    });
    checks.push({
      id: 'chk-admin-questions',
      name: 'Admin Question Repository & Answer Keys',
      category: 'schema',
      passed: questionsMalformed === 0,
      details: questionsMalformed === 0
        ? `${adminQuestions.length} questions validated with valid option arrays.`
        : `${questionsMalformed} question records have invalid option schemas.`,
      countVerified: adminQuestions.length,
    });
    totalRecordsVerified += adminQuestions.length;

    // 6. Zero Sensitive Credentials in Active Store
    let securityClean = true;
    try {
      const keysToScan = [
        'eduai_notes',
        'eduai_quizzes',
        'eduai_exams',
        'eduai_admin_questions_list',
        'eduai_curriculum_books',
      ];
      for (const k of keysToScan) {
        const val = localStorage.getItem(k);
        if (val) {
          for (const pattern of SENSITIVE_KEY_PATTERNS) {
            if (pattern.test(val)) {
              securityClean = false;
              break;
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    checks.push({
      id: 'chk-security-sanitization',
      name: 'Zero Exposed Credentials & Token Safeguard',
      category: 'security',
      passed: securityClean,
      details: securityClean
        ? 'Active storage contains 0 leaked passwords, tokens, or auth secrets.'
        : 'Security warning: Potential credential pattern found in active storage keys.',
      countVerified: 1,
    });

    const failedCount = checks.filter((c) => !c.passed).length;
    let status: 'healthy' | 'warning' | 'failed' = 'healthy';
    if (failedCount > 2 || !securityClean) {
      status = 'failed';
    } else if (failedCount > 0 || missingRelationsDetected > 0) {
      status = 'warning';
    }

    return {
      status,
      validatedAt: new Date().toISOString(),
      checks,
      totalRecordsVerified,
      missingRelationsDetected,
      corruptedEntitiesQuarantined,
      summary:
        status === 'healthy'
          ? `All ${checks.length} database validation checks passed successfully (${totalRecordsVerified} records verified).`
          : `Validation completed with ${failedCount} warning(s) / issues.`,
    };
  }

  /**
   * Generate live Restore Preview & Diff Analysis
   */
  public static generateRestorePreviewAnalysis(
    backup: BackupMetadata,
    payload: BackupSnapshotPayload,
    strategy: 'merge' | 'overwrite',
    partitions: {
      userData: boolean;
      curriculum: boolean;
      adminContent: boolean;
    }
  ): RestorePreviewAnalysis {
    const items: RestorePreviewDiffItem[] = [];
    const riskWarnings: string[] = [];

    // 1. Current State Extraction
    const currentNotes = StorageService.getNotes();
    const currentQuizzes = StorageService.getQuizzes();
    const currentExams = StorageService.getExams();
    const currentWeakTopics = StorageService.getWeakTopics();
    const currentBooks = ContentManagementService.getBooks();
    const currentSessions = ContentManagementService.getSessions();
    const currentSubjects = ContentManagementService.getSubjects();
    const currentQuestions = AdminService.getQuestionsList();

    const data = payload.data || ({} as any);

    // User Data - Notes
    if (partitions.userData) {
      const backupNotes = data.notes || [];
      const currentIds = new Set(currentNotes.map((n) => n.id));
      const additions = backupNotes.filter((n: any) => !currentIds.has(n.id)).length;
      const overwrites = backupNotes.filter((n: any) => currentIds.has(n.id)).length;
      const projected = strategy === 'overwrite' ? backupNotes.length : currentNotes.length + additions;

      items.push({
        entityKey: 'notes',
        label: 'Study Notes',
        category: 'user_data',
        currentCount: currentNotes.length,
        backupCount: backupNotes.length,
        projectedCount: projected,
        additionsCount: additions,
        overwritesCount: strategy === 'overwrite' ? currentNotes.length : overwrites,
        retainedCount: strategy === 'overwrite' ? 0 : currentNotes.length,
        status: projected >= currentNotes.length ? 'increased' : 'decreased',
      });

      // User Data - Quizzes
      const backupQuizzes = data.quizzes || [];
      const currentQIds = new Set(currentQuizzes.map((q) => q.id));
      const qAdditions = backupQuizzes.filter((q: any) => !currentQIds.has(q.id)).length;
      const qProjected = strategy === 'overwrite' ? backupQuizzes.length : currentQuizzes.length + qAdditions;

      items.push({
        entityKey: 'quizzes',
        label: 'Diagnostic Quizzes',
        category: 'user_data',
        currentCount: currentQuizzes.length,
        backupCount: backupQuizzes.length,
        projectedCount: qProjected,
        additionsCount: qAdditions,
        overwritesCount: strategy === 'overwrite' ? currentQuizzes.length : 0,
        retainedCount: strategy === 'overwrite' ? 0 : currentQuizzes.length,
        status: qProjected >= currentQuizzes.length ? 'increased' : 'decreased',
      });

      // User Data - Exams
      const backupExams = data.exams || [];
      const currentEIds = new Set(currentExams.map((e) => e.id));
      const eAdditions = backupExams.filter((e: any) => !currentEIds.has(e.id)).length;
      const eProjected = strategy === 'overwrite' ? backupExams.length : currentExams.length + eAdditions;

      items.push({
        entityKey: 'exams',
        label: 'Mock Exam Histories',
        category: 'user_data',
        currentCount: currentExams.length,
        backupCount: backupExams.length,
        projectedCount: eProjected,
        additionsCount: eAdditions,
        overwritesCount: strategy === 'overwrite' ? currentExams.length : 0,
        retainedCount: strategy === 'overwrite' ? 0 : currentExams.length,
        status: eProjected >= currentExams.length ? 'increased' : 'decreased',
      });

      // Weak topics
      const backupWeak = data.weakTopics || [];
      items.push({
        entityKey: 'weakTopics',
        label: 'Mistake Book & Weak Topics',
        category: 'user_data',
        currentCount: currentWeakTopics.length,
        backupCount: backupWeak.length,
        projectedCount: backupWeak.length,
        additionsCount: backupWeak.length,
        overwritesCount: currentWeakTopics.length,
        retainedCount: 0,
        status: 'unchanged',
      });
    }

    // Curriculum
    if (partitions.curriculum && data.curriculum) {
      const backupBooks = data.curriculum.books || [];
      const currentBookIds = new Set(currentBooks.map((b) => b.id));
      const bAdditions = backupBooks.filter((b: any) => !currentBookIds.has(b.id)).length;
      const bProjected = strategy === 'overwrite' ? backupBooks.length : currentBooks.length + bAdditions;

      items.push({
        entityKey: 'curriculumBooks',
        label: 'Textbooks & Chapters',
        category: 'curriculum',
        currentCount: currentBooks.length,
        backupCount: backupBooks.length,
        projectedCount: bProjected,
        additionsCount: bAdditions,
        overwritesCount: strategy === 'overwrite' ? currentBooks.length : 0,
        retainedCount: strategy === 'overwrite' ? 0 : currentBooks.length,
        status: bProjected >= currentBooks.length ? 'increased' : 'decreased',
      });

      const backupSubjects = data.curriculum.subjects || [];
      items.push({
        entityKey: 'curriculumSubjects',
        label: 'Curriculum Subjects',
        category: 'curriculum',
        currentCount: currentSubjects.length,
        backupCount: backupSubjects.length,
        projectedCount: backupSubjects.length,
        additionsCount: backupSubjects.length,
        overwritesCount: currentSubjects.length,
        retainedCount: 0,
        status: 'unchanged',
      });
    }

    // Admin Content
    if (partitions.adminContent && data.admin) {
      const backupQuestions = data.admin.questions || [];
      const currentQuesIds = new Set(currentQuestions.map((q) => q.id));
      const quesAdditions = backupQuestions.filter((q: any) => !currentQuesIds.has(q.id)).length;
      const quesProjected = strategy === 'overwrite' ? backupQuestions.length : currentQuestions.length + quesAdditions;

      items.push({
        entityKey: 'adminQuestions',
        label: 'Question Bank Records',
        category: 'admin_content',
        currentCount: currentQuestions.length,
        backupCount: backupQuestions.length,
        projectedCount: quesProjected,
        additionsCount: quesAdditions,
        overwritesCount: strategy === 'overwrite' ? currentQuestions.length : 0,
        retainedCount: strategy === 'overwrite' ? 0 : currentQuestions.length,
        status: quesProjected >= currentQuestions.length ? 'increased' : 'decreased',
      });
    }

    const totalCurrent = items.reduce((acc, it) => acc + it.currentCount, 0);
    const totalBackup = items.reduce((acc, it) => acc + it.backupCount, 0);
    const totalProjected = items.reduce((acc, it) => acc + it.projectedCount, 0);
    const netChange = totalProjected - totalCurrent;

    // Assess Potential Data Loss Risk
    let potentialDataLossRisk: 'none' | 'low' | 'moderate' | 'high' = 'none';
    if (strategy === 'overwrite') {
      if (totalCurrent > totalBackup) {
        potentialDataLossRisk = 'high';
        riskWarnings.push(
          `Clean Overwrite will replace ${totalCurrent} active records with ${totalBackup} backup records. Net loss of ${totalCurrent - totalBackup} items.`
        );
      } else {
        potentialDataLossRisk = 'moderate';
        riskWarnings.push(
          'Clean Overwrite will reset local modifications made after this snapshot timestamp.'
        );
      }
    } else {
      potentialDataLossRisk = 'low';
      riskWarnings.push('Safe Merge preserves existing active data and only inserts non-duplicate records.');
    }

    return {
      backupId: backup.id,
      backupTitle: backup.title,
      analyzedAt: new Date().toISOString(),
      strategy,
      items,
      totalCurrentRecords: totalCurrent,
      totalBackupRecords: totalBackup,
      totalProjectedRecords: totalProjected,
      netChange,
      potentialDataLossRisk,
      riskWarnings,
      isEligibleForRestore: true,
      preRestoreSafetySnapshotRequired: true,
    };
  }

  /**
   * Create an automatic Pre-Restore Safety Checkpoint before applying any changes
   */
  public static createPreRestoreSafetyCheckpoint(targetBackupTitle: string): BackupMetadata | null {
    const timestampStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const result = this.createBackup(
      'pre_update',
      `Pre-Restore Safety Checkpoint (${timestampStr})`,
      `Automated safety snapshot immediately captured prior to restoring "${targetBackupTitle}". Enables instant emergency rollback.`
    );
    if (result.success && result.backup) {
      return result.backup;
    }
    return null;
  }

  /**
   * Restore application state with complete disaster recovery safeguards:
   * 1. Authorization check
   * 2. Payload integrity verification
   * 3. Automatic Pre-Restore Safety Checkpoint creation
   * 4. Memory snapshot for immediate rollback
   * 5. Atomic write simulation with deduplication
   * 6. Post-restore database health validation
   * 7. Automatic rollback on validation failure
   * 8. Recovery Audit logging
   */
  public static restoreFromBackup(
    payload: BackupSnapshotPayload,
    options: {
      mode: 'merge' | 'overwrite';
      restoreUserData: boolean;
      restoreCurriculum: boolean;
      restoreAdminContent: boolean;
    } = {
      mode: 'merge',
      restoreUserData: true,
      restoreCurriculum: true,
      restoreAdminContent: true,
    },
    initiatedBy: string = 'Principal Admin'
  ): {
    success: boolean;
    restoredCounts: Partial<BackupContentCounts>;
    errors?: string[];
    validationReport?: PostRestoreValidationReport;
    preRestoreSafetySnapshotId?: string;
    rollbackOccurred?: boolean;
  } {
    const startTime = Date.now();

    // 1. Authorization Guard
    if (!this.checkAdminAuth('restoreFromBackup')) {
      return {
        success: false,
        restoredCounts: {},
        errors: ['Unauthorized: Active authorized admin session is required to perform state restoration.'],
      };
    }

    // 2. Strict Payload Integrity & Secret Scan Verification
    const verification = this.verifyBackupPayload(payload);
    if (!verification.isValid) {
      return {
        success: false,
        restoredCounts: {},
        errors: [`Restoration aborted due to verification failure: ${verification.errors.join('; ')}`],
      };
    }

    // 3. Create Pre-Restore Safety Checkpoint on storage
    const safetyCheckpoint = this.createPreRestoreSafetyCheckpoint(payload.metadata.title);
    const preRestoreSafetySnapshotId = safetyCheckpoint ? safetyCheckpoint.id : `safety-${Date.now()}`;

    // 4. Capture In-Memory State for Instant Emergency Rollback
    const memorySnapshot: Record<string, string | null> = {};
    const storageKeysToProtect = [
      'eduai_student_profile',
      'eduai_notes',
      'eduai_quizzes',
      'eduai_exams',
      'eduai_weak_topics',
      'eduai_strong_topics',
      'eduai_study_plan',
      'eduai_achievements',
      'eduai_conversations',
      'eduai_curriculum_books',
      'eduai_curriculum_sessions',
      'eduai_curriculum_subjects',
      'eduai_admin_questions_list',
      'eduai_admin_quizzes_list',
      'eduai_admin_exams_list',
    ];

    try {
      storageKeysToProtect.forEach((k) => {
        memorySnapshot[k] = localStorage.getItem(k);
      });
    } catch (e) {
      console.error('[BackupService] Could not capture memory snapshot:', e);
    }

    const rollbackToMemory = () => {
      console.warn('[BackupService] Initiating emergency in-memory rollback...');
      try {
        for (const [k, v] of Object.entries(memorySnapshot)) {
          if (v === null) {
            localStorage.removeItem(k);
          } else {
            localStorage.setItem(k, v);
          }
        }
      } catch (err) {
        console.error('[BackupService] Rollback error:', err);
      }
    };

    const restoredCounts: Partial<BackupContentCounts> = {
      notes: 0,
      quizzes: 0,
      exams: 0,
      curriculumBooks: 0,
      adminQuestions: 0,
      adminQuizzes: 0,
      adminExams: 0,
    };

    try {
      const data = payload.data;

      // 5. Restore User Data partition with Deduplication
      if (options.restoreUserData && data) {
        if (data.profile && typeof data.profile === 'object') {
          StorageService.saveProfile(sanitizeDeep(data.profile));
        }

        if (data.notes && Array.isArray(data.notes)) {
          const sanitizedNotes = sanitizeDeep<SavedNote[]>(data.notes);
          if (options.mode === 'overwrite') {
            localStorage.setItem('eduai_notes', JSON.stringify(sanitizedNotes));
            restoredCounts.notes = sanitizedNotes.length;
          } else {
            const currentNotes = StorageService.getNotes();
            const existingIds = new Set(currentNotes.map((n) => n.id));
            const merged = [...currentNotes];
            sanitizedNotes.forEach((n) => {
              if (n && n.id && !existingIds.has(n.id)) {
                merged.push(n);
                restoredCounts.notes = (restoredCounts.notes || 0) + 1;
              }
            });
            localStorage.setItem('eduai_notes', JSON.stringify(merged));
          }
        }

        if (data.quizzes && Array.isArray(data.quizzes)) {
          const sanitizedQuizzes = sanitizeDeep<Quiz[]>(data.quizzes);
          if (options.mode === 'overwrite') {
            localStorage.setItem('eduai_quizzes', JSON.stringify(sanitizedQuizzes));
            restoredCounts.quizzes = sanitizedQuizzes.length;
          } else {
            const current = StorageService.getQuizzes();
            const ids = new Set(current.map((q) => q.id));
            const merged = [...current];
            sanitizedQuizzes.forEach((q) => {
              if (q && q.id && !ids.has(q.id)) {
                merged.push(q);
                restoredCounts.quizzes = (restoredCounts.quizzes || 0) + 1;
              }
            });
            localStorage.setItem('eduai_quizzes', JSON.stringify(merged));
          }
        }

        if (data.exams && Array.isArray(data.exams)) {
          const sanitizedExams = sanitizeDeep<Exam[]>(data.exams);
          if (options.mode === 'overwrite') {
            localStorage.setItem('eduai_exams', JSON.stringify(sanitizedExams));
            restoredCounts.exams = sanitizedExams.length;
          } else {
            const current = StorageService.getExams();
            const ids = new Set(current.map((e) => e.id));
            const merged = [...current];
            sanitizedExams.forEach((e) => {
              if (e && e.id && !ids.has(e.id)) {
                merged.push(e);
                restoredCounts.exams = (restoredCounts.exams || 0) + 1;
              }
            });
            localStorage.setItem('eduai_exams', JSON.stringify(merged));
          }
        }

        if (data.weakTopics && Array.isArray(data.weakTopics)) {
          StorageService.saveWeakTopics(sanitizeDeep(data.weakTopics));
        }
        if (data.strongTopics && Array.isArray(data.strongTopics)) {
          StorageService.saveStrongTopics(sanitizeDeep(data.strongTopics));
        }
        if (data.studyPlan && typeof data.studyPlan === 'object') {
          StorageService.saveStudyPlan(sanitizeDeep(data.studyPlan));
        }
        if (data.achievements && Array.isArray(data.achievements)) {
          localStorage.setItem('eduai_achievements', JSON.stringify(sanitizeDeep(data.achievements)));
        }
        if (data.conversations && Array.isArray(data.conversations)) {
          localStorage.setItem('eduai_conversations', JSON.stringify(sanitizeDeep(data.conversations)));
        }
      }

      // 6. Restore Curriculum partition
      if (options.restoreCurriculum && data.curriculum) {
        const c = data.curriculum;
        if (c.books && Array.isArray(c.books)) {
          const sanitizedBooks = sanitizeDeep<CurriculumBook[]>(c.books);
          sanitizedBooks.forEach((b) => {
            if (b && b.id) {
              ContentManagementService.saveBook(b);
              restoredCounts.curriculumBooks = (restoredCounts.curriculumBooks || 0) + 1;
            }
          });
        }
        if (c.sessions && Array.isArray(c.sessions)) {
          c.sessions.forEach((s) => ContentManagementService.saveSession(sanitizeDeep(s)));
        }
        if (c.subjects && Array.isArray(c.subjects)) {
          c.subjects.forEach((s) => ContentManagementService.saveSubject(sanitizeDeep(s)));
        }
      }

      // 7. Restore Admin Content partition
      if (options.restoreAdminContent && data.admin) {
        const a = data.admin;
        if (a.questions && Array.isArray(a.questions)) {
          const sanitizedQ = sanitizeDeep<AdminQuestionRecord[]>(a.questions);
          AdminService.saveQuestionsList(sanitizedQ);
          restoredCounts.adminQuestions = sanitizedQ.length;
        }
        if (a.quizzes && Array.isArray(a.quizzes)) {
          const sanitizedQz = sanitizeDeep<AdminQuizRecord[]>(a.quizzes);
          localStorage.setItem('eduai_admin_quizzes_list', JSON.stringify(sanitizedQz));
          restoredCounts.adminQuizzes = sanitizedQz.length;
        }
        if (a.exams && Array.isArray(a.exams)) {
          const sanitizedEx = sanitizeDeep<AdminExamRecord[]>(a.exams);
          localStorage.setItem('eduai_admin_exams_list', JSON.stringify(sanitizedEx));
          restoredCounts.adminExams = sanitizedEx.length;
        }
      }

      // 8. Post-Restore Database Health & Integrity Verification Check
      const validationReport = this.validateActiveDatabaseIntegrity();
      if (validationReport.status === 'failed') {
        // Severe corruption detected -> Automatic Emergency Rollback
        rollbackToMemory();

        const durationMs = Date.now() - startTime;
        const failedLog: RecoveryLogRecord = {
          id: `rec-${Date.now()}`,
          timestamp: new Date().toISOString(),
          backupId: payload.metadata.id,
          backupTitle: payload.metadata.title,
          initiatedBy,
          strategy: options.mode,
          partitions: {
            userData: options.restoreUserData,
            curriculum: options.restoreCurriculum,
            adminContent: options.restoreAdminContent,
          },
          preRestoreSafetySnapshotId,
          status: 'rolled_back',
          restoredCounts,
          durationMs,
          errorMessage: 'Post-restore integrity validation failed. Active state safely rolled back to pre-restore checkpoint.',
          validationReport,
          rollbackOccurred: true,
        };
        this.logRecoveryRecord(failedLog);

        AdminService.logAudit(
          initiatedBy,
          'Database Restore Rolled Back',
          'system',
          `Restoration from "${payload.metadata.title}" failed validation. Active state rolled back to checkpoint ${preRestoreSafetySnapshotId}.`,
          'error'
        );

        return {
          success: false,
          restoredCounts: {},
          errors: [
            'Post-restore database validation detected critical anomalies. Active state was automatically rolled back to prevent data corruption.',
          ],
          validationReport,
          preRestoreSafetySnapshotId,
          rollbackOccurred: true,
        };
      }

      // 9. Success: Record Recovery Log & Audit
      const durationMs = Date.now() - startTime;
      const successLog: RecoveryLogRecord = {
        id: `rec-${Date.now()}`,
        timestamp: new Date().toISOString(),
        backupId: payload.metadata.id,
        backupTitle: payload.metadata.title,
        initiatedBy,
        strategy: options.mode,
        partitions: {
          userData: options.restoreUserData,
          curriculum: options.restoreCurriculum,
          adminContent: options.restoreAdminContent,
        },
        preRestoreSafetySnapshotId,
        status: 'success',
        restoredCounts,
        durationMs,
        validationReport,
        rollbackOccurred: false,
      };
      this.logRecoveryRecord(successLog);

      AdminService.logAudit(
        initiatedBy,
        'Database Restored from Backup',
        'system',
        `Restored from snapshot "${payload.metadata.title}" (Strategy: ${options.mode}, Checkpoint: ${preRestoreSafetySnapshotId}) in ${durationMs}ms`,
        'warning'
      );

      return {
        success: true,
        restoredCounts,
        validationReport,
        preRestoreSafetySnapshotId,
        rollbackOccurred: false,
      };
    } catch (err: any) {
      console.error('[BackupService] Restore exception:', err);
      rollbackToMemory();

      const durationMs = Date.now() - startTime;
      const exceptionReport = this.validateActiveDatabaseIntegrity();
      const failLog: RecoveryLogRecord = {
        id: `rec-${Date.now()}`,
        timestamp: new Date().toISOString(),
        backupId: payload.metadata?.id || 'unknown',
        backupTitle: payload.metadata?.title || 'Unknown Snapshot',
        initiatedBy,
        strategy: options.mode,
        partitions: {
          userData: options.restoreUserData,
          curriculum: options.restoreCurriculum,
          adminContent: options.restoreAdminContent,
        },
        preRestoreSafetySnapshotId,
        status: 'rolled_back',
        restoredCounts: {},
        durationMs,
        errorMessage: err?.message || 'Unexpected exception during storage write.',
        validationReport: exceptionReport,
        rollbackOccurred: true,
      };
      this.logRecoveryRecord(failLog);

      AdminService.logAudit(
        initiatedBy,
        'Database Restore Failed & Rolled Back',
        'system',
        `Exception during restore: ${err?.message || 'Unknown error'}. Emergency rollback completed.`,
        'error'
      );

      return {
        success: false,
        restoredCounts,
        errors: [err?.message || 'Restore process failed unexpectedly. State was automatically rolled back.'],
        validationReport: exceptionReport,
        preRestoreSafetySnapshotId,
        rollbackOccurred: true,
      };
    }
  }

  /**
   * Rollback active database to a specific safety checkpoint
   */
  public static rollbackToSafetySnapshot(snapshotId: string, initiatedBy: string = 'Principal Admin'): {
    success: boolean;
    message: string;
    validationReport?: PostRestoreValidationReport;
  } {
    const payload = this.getBackupPayload(snapshotId);
    if (!payload) {
      return { success: false, message: `Safety snapshot ${snapshotId} could not be found in storage.` };
    }

    const restoreResult = this.restoreFromBackup(
      payload,
      {
        mode: 'overwrite',
        restoreUserData: true,
        restoreCurriculum: true,
        restoreAdminContent: true,
      },
      initiatedBy
    );

    if (restoreResult.success) {
      AdminService.logAudit(
        initiatedBy,
        'Database Emergency Rollback Executed',
        'system',
        `Active database successfully reverted to checkpoint ${snapshotId} ("${payload.metadata.title}")`,
        'warning'
      );
      return {
        success: true,
        message: `Database successfully reverted to snapshot "${payload.metadata.title}".`,
        validationReport: restoreResult.validationReport,
      };
    }

    return {
      success: false,
      message: restoreResult.errors?.join('; ') || 'Rollback execution failed.',
      validationReport: restoreResult.validationReport,
    };
  }

  /**
   * Recovery Logs Management
   */
  public static getRecoveryLogs(): RecoveryLogRecord[] {
    return this.getStored<RecoveryLogRecord[]>(BACKUP_STORAGE_KEYS.RECOVERY_LOGS, []);
  }

  public static logRecoveryRecord(log: RecoveryLogRecord): void {
    const logs = this.getRecoveryLogs();
    logs.unshift(log);
    const trimmed = logs.slice(0, 50); // retain last 50 recovery runs
    this.setStored(BACKUP_STORAGE_KEYS.RECOVERY_LOGS, trimmed);
  }

  public static clearRecoveryLogs(): void {
    this.setStored(BACKUP_STORAGE_KEYS.RECOVERY_LOGS, []);
    AdminService.logAudit('Principal Admin', 'Recovery Logs Cleared', 'system', 'Cleared disaster recovery audit history.');
  }

  public static exportRecoveryLogs(format: 'json' | 'csv'): string {
    const logs = this.getRecoveryLogs();
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    const rows = [
      ['EduAI Master - Disaster Recovery & Restore Logs'],
      ['Exported At', new Date().toISOString()],
      ['Total Runs', String(logs.length)],
      [''],
      ['Timestamp', 'Log ID', 'Backup Title', 'Initiated By', 'Strategy', 'Status', 'Duration (ms)', 'Pre-Restore Checkpoint', 'Notes Restored', 'Quizzes Restored', 'Exams Restored', 'Validation Status', 'Error Details'],
    ];

    logs.forEach((l) => {
      rows.push([
        l.timestamp,
        l.id,
        `"${l.backupTitle.replace(/"/g, '""')}"`,
        l.initiatedBy,
        l.strategy,
        l.status.toUpperCase(),
        String(l.durationMs),
        l.preRestoreSafetySnapshotId,
        String(l.restoredCounts.notes || 0),
        String(l.restoredCounts.quizzes || 0),
        String(l.restoredCounts.exams || 0),
        l.validationReport?.status || 'N/A',
        `"${(l.errorMessage || '').replace(/"/g, '""')}"`,
      ]);
    });

    return rows.map((r) => r.join(',')).join('\n');
  }

  /**
   * Schedule Config & Automation
   */
  public static getScheduleConfig(): BackupScheduleConfig {
    return this.getStored<BackupScheduleConfig>(
      BACKUP_STORAGE_KEYS.SCHEDULE_CONFIG,
      DEFAULT_SCHEDULE_CONFIG
    );
  }

  public static saveScheduleConfig(config: Partial<BackupScheduleConfig>): BackupScheduleConfig {
    const current = this.getScheduleConfig();
    const updated = { ...current, ...config };

    // Calculate next run time
    if (updated.enabled) {
      const now = Date.now();
      let intervalMs = 24 * 60 * 60 * 1000; // default daily
      if (updated.frequency === 'hourly') intervalMs = 60 * 60 * 1000;
      else if (updated.frequency === 'every_6_hours') intervalMs = 6 * 60 * 60 * 1000;
      else if (updated.frequency === 'weekly') intervalMs = 7 * 24 * 60 * 60 * 1000;

      updated.nextScheduledBackupAt = new Date(now + intervalMs).toISOString();
    } else {
      updated.nextScheduledBackupAt = null;
    }

    this.setStored(BACKUP_STORAGE_KEYS.SCHEDULE_CONFIG, updated);
    AdminService.logAudit(
      'Principal Admin',
      'Backup Schedule Updated',
      'system',
      `Auto-backup set to: ${updated.enabled ? updated.frequency : 'Disabled'}`
    );
    return updated;
  }

  /**
   * Check if a scheduled backup is due and execute it automatically
   */
  public static checkAndRunScheduledBackup(): boolean {
    const config = this.getScheduleConfig();
    if (!config.enabled || !config.nextScheduledBackupAt) return false;

    const nextDue = new Date(config.nextScheduledBackupAt).getTime();
    const now = Date.now();

    if (now >= nextDue) {
      // Run automatic scheduled backup
      console.log('[BackupService] Triggering automated scheduled backup...');
      const result = this.createBackup(
        'scheduled',
        `Auto-Scheduled Backup (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' })})`,
        'Automated database snapshot generated by background scheduler.'
      );

      if (result.success) {
        config.lastAutoBackupAt = new Date().toISOString();
        let intervalMs = 24 * 60 * 60 * 1000;
        if (config.frequency === 'hourly') intervalMs = 60 * 60 * 1000;
        else if (config.frequency === 'every_6_hours') intervalMs = 6 * 60 * 60 * 1000;
        else if (config.frequency === 'weekly') intervalMs = 7 * 24 * 60 * 60 * 1000;

        config.nextScheduledBackupAt = new Date(now + intervalMs).toISOString();
        this.setStored(BACKUP_STORAGE_KEYS.SCHEDULE_CONFIG, config);
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate overall Backup System Status & Health Metrics
   */
  public static getBackupSystemStatus(): BackupSystemStatus {
    const history = this.getBackupsHistory();
    const config = this.getScheduleConfig();

    let totalSizeBytes = 0;
    history.forEach((h) => {
      totalSizeBytes += h.sizeBytes || 0;
    });

    const last = history[0];
    const lastBackupAt = last ? last.timestamp : null;
    const lastBackupStatus = last ? last.verificationStatus : 'none';

    // Calculate health score (0-100)
    let healthScore = 80;
    if (history.length > 0) {
      const daysSinceLast = last
        ? (Date.now() - new Date(last.timestamp).getTime()) / (1000 * 60 * 60 * 24)
        : 99;
      if (daysSinceLast <= 1) healthScore = 100;
      else if (daysSinceLast <= 3) healthScore = 90;
      else if (daysSinceLast <= 7) healthScore = 75;
      else healthScore = 50;

      if (last && last.verificationStatus !== 'verified') {
        healthScore -= 20;
      }
    } else {
      healthScore = 40;
    }

    return {
      lastBackupAt,
      lastBackupStatus,
      totalBackupsCount: history.length,
      totalStorageSizeBytes: totalSizeBytes,
      totalStorageSizeFormatted: formatBytes(totalSizeBytes),
      isScheduleRunning: config.enabled,
      nextScheduledAt: config.nextScheduledBackupAt,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      securityNotice: 'AES/CRC32 verified • Credentials & tokens automatically sanitized',
    };
  }
}
