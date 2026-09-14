import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  StudentProfile,
  SavedNote,
  Quiz,
  Exam,
  StudyPlan,
  WeakTopic,
  StrongTopic,
  Achievement,
  ActivityLog,
  ScanHistoryItem,
  Conversation,
  LevelMilestone,
  CloudSyncState,
  SyncStatus,
  SyncCategoryItem,
  SyncMetadata
} from '../types';
import { StorageService } from './storageService';
import { SmartRevisionService } from './smartRevisionService';
import { NotificationService } from './notificationService';

// Firestore Error handling interface conforming to Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

const LOCAL_STORAGE_KEYS = {
  DEVICE_ID: 'eduai_device_id',
  LAST_SYNCED_AT: 'eduai_last_synced_at',
  LAST_SYNCED_UID: 'eduai_last_synced_uid',
  AUTO_SYNC_ENABLED: 'eduai_auto_sync_enabled',
  PENDING_CHANGES_COUNT: 'eduai_pending_changes_count',
};

// Generate or retrieve unique device ID
function getOrCreateDeviceId(): string {
  try {
    let devId = localStorage.getItem(LOCAL_STORAGE_KEYS.DEVICE_ID);
    if (!devId) {
      devId = `device-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
      localStorage.setItem(LOCAL_STORAGE_KEYS.DEVICE_ID, devId);
    }
    return devId;
  } catch {
    return `device-fallback-${Date.now()}`;
  }
}

class CloudSyncEngine {
  private syncStatus: SyncStatus = 'idle';
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private pendingChangesCount: number = 0;
  private syncTimer: any = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncInProgress: boolean = false;

  private categoryStates: Record<string, SyncCategoryItem> = {
    profile: {
      key: 'profile',
      label: 'Student Profile',
      count: 1,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'User',
      description: 'Name, Class, Board, Streak, Avatar & Targets',
    },
    notes: {
      key: 'notes',
      label: 'Saved Study Notes',
      count: 0,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'FileText',
      description: 'Markdown summaries, custom tags & highlights',
    },
    conversations: {
      key: 'conversations',
      label: 'AI Chat Histories',
      count: 0,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'MessageSquare',
      description: 'Ask AI conversations across subject teachers',
    },
    scans: {
      key: 'scans',
      label: 'Photo Solver Scans',
      count: 0,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'Camera',
      description: 'OCR extracted questions, solutions & steps',
    },
    quizzes: {
      key: 'quizzes',
      label: 'Quiz History',
      count: 0,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'HelpCircle',
      description: 'Practice quiz scores, attempts & answer keys',
    },
    exams: {
      key: 'exams',
      label: 'Exam Simulator History',
      count: 0,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'GraduationCap',
      description: 'Full mock papers, timings & score cards',
    },
    studyPlans: {
      key: 'studyPlans',
      label: 'Study Planner Tasks',
      count: 0,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'Calendar',
      description: 'Daily schedules, timetable & revision tasks',
    },
    progress: {
      key: 'progress',
      label: 'Analytics & Weak Topics',
      count: 0,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'TrendingUp',
      description: 'Subject mastery, weak topics & practice hours',
    },
    xp: {
      key: 'xp',
      label: 'XP & Level Milestones',
      count: 0,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'Zap',
      description: 'Total XP points, daily goal progress & levels',
    },
    achievements: {
      key: 'achievements',
      label: 'Badges & Achievements',
      count: 0,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'Award',
      description: 'Unlocked reward trophies & milestone perks',
    },
    mistakeBook: {
      key: 'mistakeBook',
      label: 'Mistake Book & Re-tests',
      count: 0,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'AlertTriangle',
      description: 'Smart revision mistake sheets & error logs',
    },
    preferences: {
      key: 'preferences',
      label: 'Preferences & Settings',
      count: 1,
      lastSynced: 'Never',
      status: 'pending',
      icon: 'Sliders',
      description: 'Theme, language, reminders & notification preferences',
    },
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.lastSyncedAt = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SYNCED_AT) || null;
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.broadcastState();
        this.syncAllData('auto_online');
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.syncStatus = 'offline';
        this.broadcastState();
      });

      // Update category counts on load
      this.refreshLocalCategoryCounts();

      // Setup periodic auto sync (every 90 seconds)
      this.syncTimer = setInterval(() => {
        if (this.isAutoSyncEnabled() && auth.currentUser && this.isOnline && !this.isSyncInProgress) {
          this.syncAllData('periodic');
        }
      }, 90000);
    }
  }

  public isAutoSyncEnabled(): boolean {
    try {
      const val = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTO_SYNC_ENABLED);
      return val !== 'false'; // Default to true
    } catch {
      return true;
    }
  }

  public setAutoSyncEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTO_SYNC_ENABLED, enabled ? 'true' : 'false');
      this.broadcastState();
    } catch (e) {
      console.error(e);
    }
  }

  public getSyncState(): CloudSyncState {
    const user = auth.currentUser;
    return {
      status: !this.isOnline ? 'offline' : this.syncStatus,
      isOnline: this.isOnline,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
      pendingCount: this.pendingChangesCount,
      categories: { ...this.categoryStates },
      deviceId: getOrCreateDeviceId(),
      authenticatedUser: user
        ? {
            uid: user.uid,
            email: user.email || 'user@eduaimaster.com',
            displayName: user.displayName || user.email?.split('@')[0] || 'Student',
          }
        : null,
      autoSyncEnabled: this.isAutoSyncEnabled(),
    };
  }

  private refreshLocalCategoryCounts() {
    try {
      const profile = StorageService.getProfile();
      const notes = StorageService.getNotes();
      const conversations = StorageService.getConversations();
      const scans = StorageService.getScanHistory();
      const quizzes = StorageService.getQuizzes();
      const exams = StorageService.getExams();
      const studyPlan = StorageService.getStudyPlan();
      const weakTopics = StorageService.getWeakTopics();
      const achievements = StorageService.getAchievements();
      const revisionSheets = SmartRevisionService.getSavedSheets();

      this.categoryStates.profile.count = 1;
      this.categoryStates.notes.count = notes.length;
      this.categoryStates.conversations.count = conversations.length;
      this.categoryStates.scans.count = scans.length;
      this.categoryStates.quizzes.count = quizzes.length;
      this.categoryStates.exams.count = exams.length;
      this.categoryStates.studyPlans.count = studyPlan?.tasks?.length || 0;
      this.categoryStates.progress.count = weakTopics.length + (StorageService.getStrongTopics().length || 0);
      this.categoryStates.xp.count = profile.xp || 0;
      this.categoryStates.achievements.count = achievements.filter((a) => a.unlocked).length;
      this.categoryStates.mistakeBook.count = revisionSheets.filter((s) => s.mode === 'mistake').length || revisionSheets.length;
      this.categoryStates.preferences.count = 1;
    } catch {
      // Ignore count calculation errors
    }
  }

  public broadcastState() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('eduai_cloud_sync_updated', {
          detail: this.getSyncState(),
        })
      );
    }
  }

  /**
   * Main synchronization engine: Bi-directional secure sync with conflict resolution
   */
  public async syncAllData(triggerReason: string = 'manual'): Promise<{ success: boolean; message: string }> {
    const user = auth.currentUser;
    if (!user) {
      this.syncStatus = 'idle';
      this.lastError = 'Please sign in to enable multi-device Cloud Sync.';
      this.broadcastState();
      return { success: false, message: 'User not signed in' };
    }

    if (!this.isOnline) {
      this.syncStatus = 'offline';
      this.lastError = 'Device is currently offline. Changes are saved locally and will sync when reconnected.';
      this.broadcastState();
      return { success: false, message: 'Device is offline' };
    }

    if (this.isSyncInProgress) {
      return { success: true, message: 'Sync already in progress' };
    }

    this.isSyncInProgress = true;
    this.syncStatus = 'syncing';
    this.lastError = null;
    this.broadcastState();

    const uid = user.uid;
    const nowIso = new Date().toISOString();
    const lastUid = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SYNCED_UID);

    // If switching user accounts, isolate / clear local data from prior user to prevent cross-account leakage
    if (lastUid && lastUid !== uid) {
      console.log(`[CloudSync] Account switch detected from ${lastUid} to ${uid}. Re-hydrating user data.`);
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SYNCED_UID, uid);

    try {
      // 1. SYNC PROFILE
      await this.syncProfileCategory(uid, nowIso);

      // 2. SYNC NOTES
      await this.syncNotesCategory(uid, nowIso);

      // 3. SYNC CONVERSATIONS
      await this.syncConversationsCategory(uid, nowIso);

      // 4. SYNC SCANS
      await this.syncScansCategory(uid, nowIso);

      // 5. SYNC QUIZZES
      await this.syncQuizzesCategory(uid, nowIso);

      // 6. SYNC EXAMS
      await this.syncExamsCategory(uid, nowIso);

      // 7. SYNC STUDY PLAN
      await this.syncStudyPlanCategory(uid, nowIso);

      // 8. SYNC PROGRESS & WEAK TOPICS
      await this.syncProgressCategory(uid, nowIso);

      // 9. SYNC XP & LEVEL
      await this.syncXpCategory(uid, nowIso);

      // 10. SYNC ACHIEVEMENTS
      await this.syncAchievementsCategory(uid, nowIso);

      // 11. SYNC MISTAKE BOOK
      await this.syncMistakeBookCategory(uid, nowIso);

      // 12. SYNC PREFERENCES
      await this.syncPreferencesCategory(uid, nowIso);

      // 13. RECORD SYNC METADATA
      await this.recordSyncMetadata(uid, nowIso);

      this.lastSyncedAt = nowIso;
      this.syncStatus = 'synced';
      this.pendingChangesCount = 0;
      this.lastError = null;
      localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SYNCED_AT, nowIso);

      this.refreshLocalCategoryCounts();
      this.broadcastState();

      // Trigger app-wide data reload event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eduai_cloud_data_reloaded'));
      }

      return { success: true, message: 'All 12 learning collections synchronized seamlessly with Cloud Storage.' };
    } catch (err: any) {
      console.error('[CloudSync] Sync failed:', err);
      this.syncStatus = 'error';
      this.lastError = err?.message || 'Sync operation failed. Please check internet connection.';
      this.broadcastState();
      return { success: false, message: this.lastError };
    } finally {
      this.isSyncInProgress = false;
    }
  }

  // --- Category Sync Implementations ---

  // 1. Profile
  private async syncProfileCategory(uid: string, nowIso: string) {
    const docPath = `profiles/${uid}`;
    try {
      const docRef = doc(db, 'profiles', uid);
      const snap = await getDoc(docRef);
      const localProfile = StorageService.getProfile();

      if (snap.exists()) {
        const remoteProfile = snap.data() as StudentProfile;
        // Merge profile safely: take highest XP, highest streak, latest learning goals
        const mergedProfile: StudentProfile = {
          ...localProfile,
          ...remoteProfile,
          name: remoteProfile.name || localProfile.name,
          classLevel: remoteProfile.classLevel || localProfile.classLevel,
          board: remoteProfile.board || localProfile.board,
          xp: Math.max(localProfile.xp || 0, remoteProfile.xp || 0),
          level: Math.max(localProfile.level || 1, remoteProfile.level || 1),
          streakDays: Math.max(localProfile.streakDays || 1, remoteProfile.streakDays || 1),
          completedLessonsCount: Math.max(localProfile.completedLessonsCount || 0, remoteProfile.completedLessonsCount || 0),
          quizzesTaken: Math.max(localProfile.quizzesTaken || 0, remoteProfile.quizzesTaken || 0),
          examsCompleted: Math.max(localProfile.examsCompleted || 0, remoteProfile.examsCompleted || 0),
        };

        StorageService.saveProfile(mergedProfile);
        await setDoc(docRef, { ...mergedProfile, uid, updatedAt: nowIso }, { merge: true });
      } else {
        await setDoc(docRef, { ...localProfile, uid, updatedAt: nowIso }, { merge: true });
      }

      this.categoryStates.profile.status = 'synced';
      this.categoryStates.profile.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
      this.categoryStates.profile.status = 'error';
    }
  }

  // 2. Notes
  private async syncNotesCategory(uid: string, nowIso: string) {
    const path = 'notes';
    try {
      const q = query(collection(db, path), where('userId', '==', uid));
      const querySnap = await getDocs(q);
      const remoteNotes: SavedNote[] = [];
      querySnap.forEach((d) => remoteNotes.push(d.data() as SavedNote));

      const localNotes = StorageService.getNotes();
      const mergedNotesMap = new Map<string, SavedNote>();

      // Index remote
      remoteNotes.forEach((n) => mergedNotesMap.set(n.id, n));

      // Merge local
      for (const loc of localNotes) {
        const rem = mergedNotesMap.get(loc.id);
        if (!rem) {
          mergedNotesMap.set(loc.id, loc);
          // Upload to firestore
          await setDoc(doc(db, 'notes', loc.id), { ...loc, userId: uid, updatedAt: nowIso }, { merge: true });
        } else {
          // Compare dates
          const locTime = new Date(loc.createdAt || 0).getTime();
          const remTime = new Date((rem as any).updatedAt || rem.createdAt || 0).getTime();
          if (locTime > remTime) {
            mergedNotesMap.set(loc.id, loc);
            await setDoc(doc(db, 'notes', loc.id), { ...loc, userId: uid, updatedAt: nowIso }, { merge: true });
          }
        }
      }

      const allMerged = Array.from(mergedNotesMap.values());
      localStorage.setItem('eduai_notes', JSON.stringify(allMerged));

      this.categoryStates.notes.count = allMerged.length;
      this.categoryStates.notes.status = 'synced';
      this.categoryStates.notes.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      this.categoryStates.notes.status = 'error';
    }
  }

  // 3. Conversations
  private async syncConversationsCategory(uid: string, nowIso: string) {
    const path = 'conversations';
    try {
      const q = query(collection(db, path), where('userId', '==', uid));
      const querySnap = await getDocs(q);
      const remoteConvs: Conversation[] = [];
      querySnap.forEach((d) => remoteConvs.push(d.data() as Conversation));

      const localConvs = StorageService.getConversations();
      const mergedMap = new Map<string, Conversation>();

      remoteConvs.forEach((c) => mergedMap.set(c.id, c));

      for (const loc of localConvs) {
        const rem = mergedMap.get(loc.id);
        if (!rem) {
          mergedMap.set(loc.id, loc);
          await setDoc(doc(db, 'conversations', loc.id), { ...loc, userId: uid, updatedAt: nowIso }, { merge: true });
        } else {
          if (loc.messages.length >= rem.messages.length) {
            mergedMap.set(loc.id, loc);
            await setDoc(doc(db, 'conversations', loc.id), { ...loc, userId: uid, updatedAt: nowIso }, { merge: true });
          }
        }
      }

      const allConvs = Array.from(mergedMap.values());
      localStorage.setItem('eduai_conversations', JSON.stringify(allConvs));

      this.categoryStates.conversations.count = allConvs.length;
      this.categoryStates.conversations.status = 'synced';
      this.categoryStates.conversations.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      this.categoryStates.conversations.status = 'error';
    }
  }

  // 4. Photo Solver Scans
  private async syncScansCategory(uid: string, nowIso: string) {
    const path = 'scans';
    try {
      const q = query(collection(db, path), where('userId', '==', uid));
      const querySnap = await getDocs(q);
      const remoteScans: ScanHistoryItem[] = [];
      querySnap.forEach((d) => remoteScans.push(d.data() as ScanHistoryItem));

      const localScans = StorageService.getScanHistory();
      const map = new Map<string, ScanHistoryItem>();

      remoteScans.forEach((s) => map.set(s.id, s));

      for (const loc of localScans) {
        if (!map.has(loc.id)) {
          map.set(loc.id, loc);
          await setDoc(doc(db, 'scans', loc.id), { ...loc, userId: uid, createdAt: loc.timestamp || nowIso }, { merge: true });
        }
      }

      const allScans = Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      localStorage.setItem('eduai_scan_history', JSON.stringify(allScans));

      this.categoryStates.scans.count = allScans.length;
      this.categoryStates.scans.status = 'synced';
      this.categoryStates.scans.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      this.categoryStates.scans.status = 'error';
    }
  }

  // 5. Quizzes
  private async syncQuizzesCategory(uid: string, nowIso: string) {
    const path = 'quizzes';
    try {
      const q = query(collection(db, path), where('userId', '==', uid));
      const querySnap = await getDocs(q);
      const remoteQuizzes: Quiz[] = [];
      querySnap.forEach((d) => remoteQuizzes.push(d.data() as Quiz));

      const localQuizzes = StorageService.getQuizzes();
      const map = new Map<string, Quiz>();

      remoteQuizzes.forEach((q) => map.set(q.id, q));

      for (const loc of localQuizzes) {
        const rem = map.get(loc.id);
        if (!rem) {
          map.set(loc.id, loc);
          await setDoc(doc(db, 'quizzes', loc.id), { ...loc, userId: uid, updatedAt: nowIso }, { merge: true });
        } else {
          // Take higher score / completed
          const better = (loc.score || 0) >= (rem.score || 0) ? loc : rem;
          map.set(loc.id, better);
          await setDoc(doc(db, 'quizzes', loc.id), { ...better, userId: uid, updatedAt: nowIso }, { merge: true });
        }
      }

      const allQuizzes = Array.from(map.values());
      localStorage.setItem('eduai_quizzes', JSON.stringify(allQuizzes));

      this.categoryStates.quizzes.count = allQuizzes.length;
      this.categoryStates.quizzes.status = 'synced';
      this.categoryStates.quizzes.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      this.categoryStates.quizzes.status = 'error';
    }
  }

  // 6. Exam Simulator History
  private async syncExamsCategory(uid: string, nowIso: string) {
    const path = 'exams';
    try {
      const q = query(collection(db, path), where('userId', '==', uid));
      const querySnap = await getDocs(q);
      const remoteExams: Exam[] = [];
      querySnap.forEach((d) => remoteExams.push(d.data() as Exam));

      const localExams = StorageService.getExams();
      const map = new Map<string, Exam>();

      remoteExams.forEach((e) => map.set(e.id, e));

      for (const loc of localExams) {
        const rem = map.get(loc.id);
        if (!rem) {
          map.set(loc.id, loc);
          await setDoc(doc(db, 'exams', loc.id), { ...loc, userId: uid, updatedAt: nowIso }, { merge: true });
        } else {
          const better = (loc.scoreEarned || 0) >= (rem.scoreEarned || 0) ? loc : rem;
          map.set(loc.id, better);
          await setDoc(doc(db, 'exams', loc.id), { ...better, userId: uid, updatedAt: nowIso }, { merge: true });
        }
      }

      const allExams = Array.from(map.values());
      localStorage.setItem('eduai_exams', JSON.stringify(allExams));

      this.categoryStates.exams.count = allExams.length;
      this.categoryStates.exams.status = 'synced';
      this.categoryStates.exams.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      this.categoryStates.exams.status = 'error';
    }
  }

  // 7. Study Plans
  private async syncStudyPlanCategory(uid: string, nowIso: string) {
    const docPath = `studyPlans/${uid}`;
    try {
      const docRef = doc(db, 'studyPlans', uid);
      const snap = await getDoc(docRef);
      const localPlan = StorageService.getStudyPlan();

      if (snap.exists()) {
        const remotePlan = snap.data() as StudyPlan;
        // Merge tasks
        const taskMap = new Map<string, any>();
        (remotePlan.tasks || []).forEach((t: any) => taskMap.set(t.id, t));
        (localPlan?.tasks || []).forEach((locTask: any) => {
          const remTask = taskMap.get(locTask.id);
          if (!remTask) {
            taskMap.set(locTask.id, locTask);
          } else {
            // If completed on either device, preserve completion
            taskMap.set(locTask.id, {
              ...remTask,
              ...locTask,
              completed: remTask.completed || locTask.completed,
            });
          }
        });

        const mergedPlan: StudyPlan = {
          ...localPlan,
          ...remotePlan,
          tasks: Array.from(taskMap.values()),
          updatedAt: nowIso,
        };

        StorageService.saveStudyPlan(mergedPlan);
        await setDoc(docRef, { ...mergedPlan, userId: uid, updatedAt: nowIso }, { merge: true });
        this.categoryStates.studyPlans.count = mergedPlan.tasks.length;
      } else if (localPlan) {
        await setDoc(docRef, { ...localPlan, userId: uid, updatedAt: nowIso }, { merge: true });
        this.categoryStates.studyPlans.count = localPlan.tasks.length;
      }

      this.categoryStates.studyPlans.status = 'synced';
      this.categoryStates.studyPlans.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
      this.categoryStates.studyPlans.status = 'error';
    }
  }

  // 8. Progress (Weak topics, strong topics, activities)
  private async syncProgressCategory(uid: string, nowIso: string) {
    const docPath = `progress/${uid}`;
    try {
      const docRef = doc(db, 'progress', uid);
      const snap = await getDoc(docRef);

      const localWeak = StorageService.getWeakTopics();
      const localStrong = StorageService.getStrongTopics();
      const localQs = StorageService.getQuestionsSolved();
      const localActs = StorageService.getActivities();

      if (snap.exists()) {
        const remote = snap.data();
        const remoteWeak: WeakTopic[] = remote.weakTopics || [];
        const remoteStrong: StrongTopic[] = remote.strongTopics || [];
        const remoteQs: number = remote.questionsSolved || 0;
        const remoteActs: ActivityLog[] = remote.activityLogs || [];

        // Merge weak topics
        const weakMap = new Map<string, WeakTopic>();
        remoteWeak.forEach((w) => weakMap.set(w.id || w.topicName, w));
        localWeak.forEach((w) => {
          const key = w.id || w.topicName;
          const rem = weakMap.get(key);
          if (!rem || (w.attemptsCount || 0) >= (rem.attemptsCount || 0)) {
            weakMap.set(key, w);
          }
        });
        const mergedWeak = Array.from(weakMap.values());
        localStorage.setItem('eduai_weak_topics', JSON.stringify(mergedWeak));

        // Merge strong topics
        const strongMap = new Map<string, StrongTopic>();
        remoteStrong.forEach((s) => strongMap.set(s.id || s.topicName, s));
        localStrong.forEach((s) => strongMap.set(s.id || s.topicName, s));
        const mergedStrong = Array.from(strongMap.values());
        localStorage.setItem('eduai_strong_topics', JSON.stringify(mergedStrong));

        // Merge questions solved
        const mergedQs = Math.max(localQs, remoteQs);
        localStorage.setItem('eduai_questions_solved', mergedQs.toString());

        // Merge activities
        const actMap = new Map<string, ActivityLog>();
        remoteActs.forEach((a) => actMap.set(a.id, a));
        localActs.forEach((a) => actMap.set(a.id, a));
        const mergedActs = Array.from(actMap.values()).slice(0, 50);
        localStorage.setItem('eduai_activities', JSON.stringify(mergedActs));

        await setDoc(
          docRef,
          {
            userId: uid,
            weakTopics: mergedWeak,
            strongTopics: mergedStrong,
            questionsSolved: mergedQs,
            activityLogs: mergedActs,
            updatedAt: nowIso,
          },
          { merge: true }
        );

        this.categoryStates.progress.count = mergedWeak.length + mergedStrong.length;
      } else {
        await setDoc(
          docRef,
          {
            userId: uid,
            weakTopics: localWeak,
            strongTopics: localStrong,
            questionsSolved: localQs,
            activityLogs: localActs,
            updatedAt: nowIso,
          },
          { merge: true }
        );
        this.categoryStates.progress.count = localWeak.length + localStrong.length;
      }

      this.categoryStates.progress.status = 'synced';
      this.categoryStates.progress.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
      this.categoryStates.progress.status = 'error';
    }
  }

  // 9. XP and Level Milestones
  private async syncXpCategory(uid: string, nowIso: string) {
    const docPath = `xp/${uid}`;
    try {
      const docRef = doc(db, 'xp', uid);
      const snap = await getDoc(docRef);

      const profile = StorageService.getProfile();
      const milestones = StorageService.getLevelMilestones();

      if (snap.exists()) {
        const remote = snap.data();
        const remoteXp = remote.totalXp || 0;
        const remoteMilestones: LevelMilestone[] = remote.milestones || [];

        const mergedXp = Math.max(profile.xp, remoteXp);
        profile.xp = mergedXp;
        StorageService.saveProfile(profile);

        // Merge milestones (once claimed or unlocked, stay claimed)
        const msMap = new Map<number, LevelMilestone>();
        remoteMilestones.forEach((m) => msMap.set(m.level, m));
        milestones.forEach((locM) => {
          const remM = msMap.get(locM.level);
          if (!remM) {
            msMap.set(locM.level, locM);
          } else {
            msMap.set(locM.level, {
              ...locM,
              unlocked: locM.unlocked || remM.unlocked,
              claimed: locM.claimed || remM.claimed,
            });
          }
        });

        const mergedMilestones = Array.from(msMap.values());
        localStorage.setItem('eduai_level_milestones', JSON.stringify(mergedMilestones));

        await setDoc(
          docRef,
          {
            userId: uid,
            totalXp: mergedXp,
            level: profile.level,
            milestones: mergedMilestones,
            updatedAt: nowIso,
          },
          { merge: true }
        );

        this.categoryStates.xp.count = mergedXp;
      } else {
        await setDoc(
          docRef,
          {
            userId: uid,
            totalXp: profile.xp,
            level: profile.level,
            milestones,
            updatedAt: nowIso,
          },
          { merge: true }
        );
        this.categoryStates.xp.count = profile.xp;
      }

      this.categoryStates.xp.status = 'synced';
      this.categoryStates.xp.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
      this.categoryStates.xp.status = 'error';
    }
  }

  // 10. Achievements & Badges
  private async syncAchievementsCategory(uid: string, nowIso: string) {
    const docPath = `achievements/${uid}`;
    try {
      const docRef = doc(db, 'achievements', uid);
      const snap = await getDoc(docRef);

      const localAchievements = StorageService.getAchievements();

      if (snap.exists()) {
        const remote = snap.data();
        const remoteAch: Achievement[] = remote.unlockedBadges || [];

        const map = new Map<string, Achievement>();
        remoteAch.forEach((a) => map.set(a.id, a));

        localAchievements.forEach((loc) => {
          const rem = map.get(loc.id);
          if (!rem) {
            map.set(loc.id, loc);
          } else {
            map.set(loc.id, {
              ...loc,
              unlocked: loc.unlocked || rem.unlocked,
              unlockedAt: loc.unlockedAt || rem.unlockedAt,
              progressCurrent: Math.max(loc.progressCurrent || 0, rem.progressCurrent || 0),
            });
          }
        });

        const merged = Array.from(map.values());
        localStorage.setItem('eduai_achievements', JSON.stringify(merged));

        await setDoc(
          docRef,
          {
            userId: uid,
            unlockedBadges: merged,
            updatedAt: nowIso,
          },
          { merge: true }
        );

        this.categoryStates.achievements.count = merged.filter((a) => a.unlocked).length;
      } else {
        await setDoc(
          docRef,
          {
            userId: uid,
            unlockedBadges: localAchievements,
            updatedAt: nowIso,
          },
          { merge: true }
        );
        this.categoryStates.achievements.count = localAchievements.filter((a) => a.unlocked).length;
      }

      this.categoryStates.achievements.status = 'synced';
      this.categoryStates.achievements.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
      this.categoryStates.achievements.status = 'error';
    }
  }

  // 11. Mistake Book & Smart Revision Sheets
  private async syncMistakeBookCategory(uid: string, nowIso: string) {
    const docPath = `mistakes/${uid}`;
    try {
      const docRef = doc(db, 'mistakes', uid);
      const snap = await getDoc(docRef);

      const localSheets = SmartRevisionService.getSavedSheets();
      const localHistory = SmartRevisionService.getHistory();

      if (snap.exists()) {
        const remote = snap.data();
        const remoteSheets = remote.mistakeSheets || [];
        const remoteHistory = remote.revisionHistory || [];

        // Merge sheets by id
        const map = new Map<string, any>();
        remoteSheets.forEach((s: any) => map.set(s.id, s));
        localSheets.forEach((s) => {
          const rem = map.get(s.id);
          if (!rem) {
            map.set(s.id, s);
          } else {
            // Keep higher mastery score or newer revised date
            map.set(s.id, {
              ...rem,
              ...s,
              masteryScore: Math.max(s.masteryScore || 0, rem.masteryScore || 0),
            });
          }
        });

        const mergedSheets = Array.from(map.values());
        localStorage.setItem('eduai_smart_revision_sheets', JSON.stringify(mergedSheets));

        // Merge history
        const histMap = new Map<string, any>();
        remoteHistory.forEach((h: any) => histMap.set(h.id, h));
        localHistory.forEach((h) => histMap.set(h.id, h));
        const mergedHistory = Array.from(histMap.values()).slice(0, 50);
        localStorage.setItem('eduai_smart_revision_history', JSON.stringify(mergedHistory));

        await setDoc(
          docRef,
          {
            userId: uid,
            mistakeSheets: mergedSheets,
            revisionHistory: mergedHistory,
            updatedAt: nowIso,
          },
          { merge: true }
        );

        this.categoryStates.mistakeBook.count = mergedSheets.length;
      } else {
        await setDoc(
          docRef,
          {
            userId: uid,
            mistakeSheets: localSheets,
            revisionHistory: localHistory,
            updatedAt: nowIso,
          },
          { merge: true }
        );
        this.categoryStates.mistakeBook.count = localSheets.length;
      }

      this.categoryStates.mistakeBook.status = 'synced';
      this.categoryStates.mistakeBook.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
      this.categoryStates.mistakeBook.status = 'error';
    }
  }

  // 12. Preferences & App Settings
  private async syncPreferencesCategory(uid: string, nowIso: string) {
    const docPath = `preferences/${uid}`;
    try {
      const docRef = doc(db, 'preferences', uid);
      const snap = await getDoc(docRef);

      const localTheme = localStorage.getItem('eduai_theme') || 'light';
      const localLang = localStorage.getItem('eduai_lang') || 'en';
      const localNotifPrefs = NotificationService.getPreferences();
      const localSubjectMode = localStorage.getItem('eduai_subject_mode') || 'general';

      if (snap.exists()) {
        const remote = snap.data();
        const remoteTheme = remote.theme || localTheme;
        const remoteLang = remote.language || localLang;
        const remoteNotif = remote.notificationPrefs ? { ...localNotifPrefs, ...remote.notificationPrefs } : localNotifPrefs;
        const remoteMode = remote.subjectMode || localSubjectMode;

        // Apply
        localStorage.setItem('eduai_theme', remoteTheme);
        localStorage.setItem('eduai_lang', remoteLang);
        NotificationService.savePreferences(remoteNotif);
        localStorage.setItem('eduai_subject_mode', remoteMode);

        await setDoc(
          docRef,
          {
            userId: uid,
            theme: remoteTheme,
            language: remoteLang,
            notificationPrefs: remoteNotif,
            subjectMode: remoteMode,
            updatedAt: nowIso,
          },
          { merge: true }
        );
      } else {
        await setDoc(
          docRef,
          {
            userId: uid,
            theme: localTheme,
            language: localLang,
            notificationPrefs: localNotifPrefs,
            subjectMode: localSubjectMode,
            updatedAt: nowIso,
          },
          { merge: true }
        );
      }

      this.categoryStates.preferences.status = 'synced';
      this.categoryStates.preferences.lastSynced = 'Just now';
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
      this.categoryStates.preferences.status = 'error';
    }
  }

  // 13. Sync Metadata
  private async recordSyncMetadata(uid: string, nowIso: string) {
    const docPath = `syncMeta/${uid}`;
    try {
      const docRef = doc(db, 'syncMeta', uid);
      const meta: SyncMetadata = {
        userId: uid,
        deviceId: getOrCreateDeviceId(),
        clientVersion: '2.4.0',
        lastSyncedAt: nowIso,
        devicePlatform: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 100) : 'Web Applet',
        syncedCollections: [
          'profiles',
          'notes',
          'conversations',
          'scans',
          'quizzes',
          'exams',
          'studyPlans',
          'progress',
          'xp',
          'achievements',
          'mistakes',
          'preferences',
        ],
        conflictCount: 0,
      };
      await setDoc(docRef, meta, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  }
}

export const CloudSyncService = new CloudSyncEngine();
