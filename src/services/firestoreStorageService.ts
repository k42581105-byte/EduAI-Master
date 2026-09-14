import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  Conversation
} from '../types';

export const FirestoreStorageService = {
  // Sync Profile
  async syncProfileToFirestore(uid: string, profile: StudentProfile): Promise<void> {
    try {
      const docRef = doc(db, 'profiles', uid);
      await setDoc(docRef, { ...profile, uid, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Firestore syncProfile error:', e);
    }
  },

  async loadProfileFromFirestore(uid: string): Promise<StudentProfile | null> {
    try {
      const docRef = doc(db, 'profiles', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as StudentProfile;
      }
      return null;
    } catch (e) {
      console.error('Firestore loadProfile error:', e);
      return null;
    }
  },

  // Notes Collection
  async saveNoteToFirestore(userId: string, note: SavedNote): Promise<void> {
    try {
      const docRef = doc(db, 'notes', note.id);
      await setDoc(docRef, { ...note, userId, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Firestore saveNote error:', e);
    }
  },

  async loadNotesFromFirestore(userId: string): Promise<SavedNote[]> {
    try {
      const q = query(collection(db, 'notes'), where('userId', '==', userId));
      const querySnap = await getDocs(q);
      const notes: SavedNote[] = [];
      querySnap.forEach((docSnap) => {
        notes.push(docSnap.data() as SavedNote);
      });
      return notes;
    } catch (e) {
      console.error('Firestore loadNotes error:', e);
      return [];
    }
  },

  async deleteNoteFromFirestore(noteId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (e) {
      console.error('Firestore deleteNote error:', e);
    }
  },

  // Quizzes Collection
  async saveQuizToFirestore(userId: string, quiz: Quiz): Promise<void> {
    try {
      const docRef = doc(db, 'quizzes', quiz.id);
      await setDoc(docRef, { ...quiz, userId, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Firestore saveQuiz error:', e);
    }
  },

  async loadQuizzesFromFirestore(userId: string): Promise<Quiz[]> {
    try {
      const q = query(collection(db, 'quizzes'), where('userId', '==', userId));
      const querySnap = await getDocs(q);
      const quizzes: Quiz[] = [];
      querySnap.forEach((docSnap) => {
        quizzes.push(docSnap.data() as Quiz);
      });
      return quizzes;
    } catch (e) {
      console.error('Firestore loadQuizzes error:', e);
      return [];
    }
  },

  // Exams Collection
  async saveExamToFirestore(userId: string, exam: Exam): Promise<void> {
    try {
      const docRef = doc(db, 'exams', exam.id);
      await setDoc(docRef, { ...exam, userId, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Firestore saveExam error:', e);
    }
  },

  async loadExamsFromFirestore(userId: string): Promise<Exam[]> {
    try {
      const q = query(collection(db, 'exams'), where('userId', '==', userId));
      const querySnap = await getDocs(q);
      const exams: Exam[] = [];
      querySnap.forEach((docSnap) => {
        exams.push(docSnap.data() as Exam);
      });
      return exams;
    } catch (e) {
      console.error('Firestore loadExams error:', e);
      return [];
    }
  },

  // Study Plans Collection
  async saveStudyPlanToFirestore(userId: string, plan: StudyPlan): Promise<void> {
    try {
      const docRef = doc(db, 'studyPlans', userId);
      await setDoc(docRef, { ...plan, userId, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Firestore saveStudyPlan error:', e);
    }
  },

  async loadStudyPlanFromFirestore(userId: string): Promise<StudyPlan | null> {
    try {
      const docRef = doc(db, 'studyPlans', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as StudyPlan;
      }
      return null;
    } catch (e) {
      console.error('Firestore loadStudyPlan error:', e);
      return null;
    }
  },

  // Progress, Weak Topics & Strong Topics
  async saveProgressToFirestore(userId: string, weakTopics: WeakTopic[], strongTopics: StrongTopic[]): Promise<void> {
    try {
      const docRef = doc(db, 'progress', userId);
      await setDoc(docRef, { userId, weakTopics, strongTopics, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Firestore saveProgress error:', e);
    }
  },

  async loadProgressFromFirestore(userId: string): Promise<{ weakTopics?: WeakTopic[]; strongTopics?: StrongTopic[] } | null> {
    try {
      const docRef = doc(db, 'progress', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (e) {
      console.error('Firestore loadProgress error:', e);
      return null;
    }
  },

  // Achievements Collection
  async saveAchievementsToFirestore(userId: string, achievements: Achievement[]): Promise<void> {
    try {
      const docRef = doc(db, 'achievements', userId);
      await setDoc(docRef, { userId, unlockedBadges: achievements, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Firestore saveAchievements error:', e);
    }
  },

  // Photo Scans Collection
  async saveScanToFirestore(userId: string, scan: ScanHistoryItem): Promise<void> {
    try {
      const docRef = doc(db, 'scans', scan.id);
      await setDoc(docRef, { ...scan, userId, createdAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Firestore saveScan error:', e);
    }
  },

  async loadScansFromFirestore(userId: string): Promise<ScanHistoryItem[]> {
    try {
      const q = query(collection(db, 'scans'), where('userId', '==', userId));
      const querySnap = await getDocs(q);
      const scans: ScanHistoryItem[] = [];
      querySnap.forEach((docSnap) => {
        scans.push(docSnap.data() as ScanHistoryItem);
      });
      return scans;
    } catch (e) {
      console.error('Firestore loadScans error:', e);
      return [];
    }
  },

  // Conversations Collection
  async saveConversationToFirestore(userId: string, conv: Conversation): Promise<void> {
    try {
      const docRef = doc(db, 'conversations', conv.id);
      await setDoc(docRef, { ...conv, userId, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Firestore saveConversation error:', e);
    }
  },

  async loadConversationsFromFirestore(userId: string): Promise<Conversation[]> {
    try {
      const q = query(collection(db, 'conversations'), where('userId', '==', userId));
      const querySnap = await getDocs(q);
      const convs: Conversation[] = [];
      querySnap.forEach((docSnap) => {
        convs.push(docSnap.data() as Conversation);
      });
      return convs;
    } catch (e) {
      console.error('Firestore loadConversations error:', e);
      return [];
    }
  }
};
