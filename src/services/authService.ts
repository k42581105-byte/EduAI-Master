import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRole } from '../types';
import { SecurityService } from './securityService';

export interface UserAccountData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  linkedStudentEmail?: string;
  classGrade?: string;
  sessionToken?: string;
}

// Brute-force protection tracker: max 5 failed attempts within 5 minutes
interface FailedAttemptTracker {
  count: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, FailedAttemptTracker>();

function checkBruteForceLock(email: string): { locked: boolean; waitSeconds?: number } {
  const normEmail = email.toLowerCase().trim();
  const tracker = loginAttempts.get(normEmail);
  if (!tracker) return { locked: false };

  if (tracker.lockedUntil && Date.now() < tracker.lockedUntil) {
    const waitSeconds = Math.ceil((tracker.lockedUntil - Date.now()) / 1000);
    return { locked: true, waitSeconds };
  }

  // If lockout expired, reset
  if (tracker.lockedUntil && Date.now() >= tracker.lockedUntil) {
    loginAttempts.delete(normEmail);
  }
  return { locked: false };
}

function recordFailedLoginAttempt(email: string): number {
  const normEmail = email.toLowerCase().trim();
  const current = loginAttempts.get(normEmail) || { count: 0, lockedUntil: null };
  current.count += 1;

  if (current.count >= 5) {
    current.lockedUntil = Date.now() + 5 * 60 * 1000; // 5 minute lock
    SecurityService.logAuditEvent({
      category: 'auth',
      severity: 'critical',
      action: 'Account Temporarily Locked (Brute Force Detected)',
      userEmail: email,
      details: `5 consecutive failed login attempts detected for ${email}. Account throttled for 5 minutes.`,
      blocked: true,
    });
  } else {
    SecurityService.logAuditEvent({
      category: 'auth',
      severity: 'warning',
      action: 'Failed Login Attempt',
      userEmail: email,
      details: `Failed credentials attempt #${current.count} for ${email}.`,
      blocked: true,
    });
  }

  loginAttempts.set(normEmail, current);
  return current.count;
}

function clearFailedLoginAttempts(email: string): void {
  loginAttempts.delete(email.toLowerCase().trim());
}

// Convert Firebase Auth error codes to helpful user-friendly messages
export function formatAuthError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please login instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 8 characters long with uppercase, lowercase, numbers & symbols.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Security lock engaged. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    default:
      return 'Authentication failed. Please check credentials and try again.';
  }
}

export const AuthService = {
  // Sign up new user with strict password complexity check
  async signUp(
    email: string,
    pass: string,
    displayName: string,
    role: UserRole,
    linkedStudentEmail?: string,
    classGrade?: string
  ): Promise<UserAccountData> {
    if (!email || !pass) {
      throw new Error('Email and password are required');
    }

    // Strict Password Complexity Check
    const pwdStrength = SecurityService.validatePasswordStrength(pass);
    if (!pwdStrength.valid) {
      throw new Error(`Password too weak: ${pwdStrength.feedback.join(', ')}`);
    }

    const sanitizedDisplayName = SecurityService.sanitizeInput(displayName, 100);
    const sanitizedEmail = email.trim().toLowerCase();

    const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, pass);
    const user = userCredential.user;
    const sessionToken = SecurityService.getOrGenerateSessionToken();

    const userData: UserAccountData = {
      uid: user.uid,
      email: user.email || sanitizedEmail,
      displayName: sanitizedDisplayName || sanitizedEmail.split('@')[0],
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessionToken,
      ...(linkedStudentEmail ? { linkedStudentEmail: linkedStudentEmail.trim() } : {}),
      ...(classGrade ? { classGrade: classGrade.trim() } : {})
    };

    // Save user record to Firestore users collection
    await setDoc(doc(db, 'users', user.uid), userData);

    // Initialize initial profile record for students
    if (role === 'student') {
      await setDoc(doc(db, 'profiles', user.uid), {
        uid: user.uid,
        name: userData.displayName,
        classLevel: classGrade || '10',
        board: 'CBSE',
        medium: 'English',
        preferredLanguage: 'en',
        selectedSubjects: ['Science', 'Mathematics', 'Social Science', 'English'],
        learningGoals: ['Board Exam Prep', 'Daily Homework', 'Concepts Mastery'],
        xp: 120,
        level: 1,
        streakDays: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        completedLessonsCount: 0,
        quizzesTaken: 0,
        examsCompleted: 0,
        avgScorePercentage: 0,
        dailyXpGoal: 100,
        avatarUrl: ''
      });
    }

    SecurityService.logAuditEvent({
      category: 'auth',
      severity: 'info',
      action: 'User Account Created',
      userRole: role,
      userEmail: sanitizedEmail,
      details: `New account registered as ${role} for ${sanitizedEmail}.`,
      blocked: false,
    });

    return userData;
  },

  // Login existing user with brute-force rate-limiting
  async login(email: string, pass: string): Promise<UserAccountData> {
    if (!email || !pass) {
      throw new Error('Email and password are required');
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Check brute-force lockout status
    const lockCheck = checkBruteForceLock(sanitizedEmail);
    if (lockCheck.locked) {
      throw new Error(`Account temporarily locked for security. Please try again in ${lockCheck.waitSeconds} seconds.`);
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, pass);
      const user = userCredential.user;

      // Successful login -> clear failed attempts
      clearFailedLoginAttempts(sanitizedEmail);
      SecurityService.refreshSession();

      // Retrieve user metadata from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      let accountData: UserAccountData;
      if (userSnap.exists()) {
        accountData = userSnap.data() as UserAccountData;
      } else {
        // Fallback user record
        accountData = {
          uid: user.uid,
          email: user.email || sanitizedEmail,
          displayName: user.displayName || sanitizedEmail.split('@')[0],
          role: 'student',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, accountData);
      }

      SecurityService.logAuditEvent({
        category: 'auth',
        severity: 'info',
        action: 'User Authenticated',
        userRole: accountData.role,
        userEmail: sanitizedEmail,
        details: `Successful authenticated session for ${sanitizedEmail} (${accountData.role}).`,
        blocked: false,
      });

      return accountData;
    } catch (err: any) {
      recordFailedLoginAttempt(sanitizedEmail);
      throw err;
    }
  },

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    const sanitized = email.trim().toLowerCase();
    await sendPasswordResetEmail(auth, sanitized);
    SecurityService.logAuditEvent({
      category: 'auth',
      severity: 'info',
      action: 'Password Reset Initiated',
      userEmail: sanitized,
      details: `Password reset request dispatched to ${sanitized}.`,
      blocked: false,
    });
  },

  // Logout current user
  async logout(): Promise<void> {
    SecurityService.logAuditEvent({
      category: 'auth',
      severity: 'info',
      action: 'User Signed Out',
      details: 'Active session terminated securely.',
      blocked: false,
    });
    await signOut(auth);
  },

  // Get current user document
  async getCurrentUserData(user: FirebaseUser): Promise<UserAccountData | null> {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        return userSnap.data() as UserAccountData;
      }
      return null;
    } catch (e) {
      console.error('Failed to fetch user data', e);
      return null;
    }
  },

  // Update user role or profile info
  async updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      role: newRole,
      updatedAt: new Date().toISOString()
    });
    SecurityService.logAuditEvent({
      category: 'rbac',
      severity: 'warning',
      action: 'User Role Modified',
      details: `User UID ${uid} assigned new role "${newRole}".`,
      blocked: false,
    });
  },

  // Auth observer
  onAuthChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};
