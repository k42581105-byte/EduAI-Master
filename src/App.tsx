import React, { useState, useEffect, Suspense, lazy } from 'react';
import { NavigationSection, StudentProfile, UserRole } from './types';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { FirestoreStorageService } from './services/firestoreStorageService';
import { CloudSyncService } from './services/cloudSyncService';
import { LanguageCode } from './i18n/translations';

// Layout
import { Header } from './components/layout/Header';
import { SidebarNavigation } from './components/layout/SidebarNavigation';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { AuthModal } from './components/auth/AuthModal';
import { LoadingFallback } from './components/common/LoadingFallback';

// Primary Eager View (Instant First Contentful Paint)
import { HomeView } from './components/views/HomeView';

// Optimized Lazy-Loaded Sub-Views (Drastically reduces initial JS bundle size & startup latency)
const AskAiView = lazy(() => import('./components/views/AskAiView').then(m => ({ default: m.AskAiView })));
const PhotoSolverView = lazy(() => import('./components/views/PhotoSolverView').then(m => ({ default: m.PhotoSolverView })));
const NotesView = lazy(() => import('./components/views/NotesView').then(m => ({ default: m.NotesView })));
const BooksView = lazy(() => import('./components/views/BooksView').then(m => ({ default: m.BooksView })));
const QuizView = lazy(() => import('./components/views/QuizView').then(m => ({ default: m.QuizView })));
const ExamModeView = lazy(() => import('./components/views/ExamModeView').then(m => ({ default: m.ExamModeView })));
const StudyPlannerView = lazy(() => import('./components/views/StudyPlannerView').then(m => ({ default: m.StudyPlannerView })));
const WeakTopicsView = lazy(() => import('./components/views/WeakTopicsView').then(m => ({ default: m.WeakTopicsView })));
const ProgressView = lazy(() => import('./components/views/ProgressView').then(m => ({ default: m.ProgressView })));
const AchievementsView = lazy(() => import('./components/views/AchievementsView').then(m => ({ default: m.AchievementsView })));
const ProfileView = lazy(() => import('./components/views/ProfileView').then(m => ({ default: m.ProfileView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const ParentDashboardView = lazy(() => import('./components/views/ParentDashboardView').then(m => ({ default: m.ParentDashboardView })));
const TeacherDashboardView = lazy(() => import('./components/views/TeacherDashboardView').then(m => ({ default: m.TeacherDashboardView })));
const PaperGeneratorView = lazy(() => import('./components/views/PaperGeneratorView').then(m => ({ default: m.PaperGeneratorView })));
const PersonalLearningView = lazy(() => import('./components/views/PersonalLearningView').then(m => ({ default: m.PersonalLearningView })));
const AiCoachView = lazy(() => import('./components/views/AiCoachView').then(m => ({ default: m.AiCoachView })));
const SmartRevisionView = lazy(() => import('./components/views/SmartRevisionView').then(m => ({ default: m.SmartRevisionView })));
const NotificationsView = lazy(() => import('./components/views/NotificationsView').then(m => ({ default: m.NotificationsView })));
const AdminDashboardView = lazy(() => import('./components/views/admin/AdminDashboardView').then(m => ({ default: m.AdminDashboardView })));

import { NotificationService } from './services/notificationService';
import { BackupService } from './services/backupService';
import { SecurityService } from './services/securityService';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { SessionTimeoutModal } from './components/common/SessionTimeoutModal';

import { GamificationNotification } from './components/common/GamificationNotification';

export default function App() {
  const [currentSection, setCurrentSection] = useState<NavigationSection>('home');
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [profile, setProfile] = useState<StudentProfile>(() => StorageService.getProfile());
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('eduai_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [lang, setLang] = useState<LanguageCode>(() => profile.preferredLanguage || 'en');

  // Auth State
  const [authUser, setAuthUser] = useState<{ uid: string; email: string; displayName: string; role: UserRole } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isSessionTimeoutWarningOpen, setIsSessionTimeoutWarningOpen] = useState(false);

  // User activity tracker & zero-trust session auto-lock monitoring
  useEffect(() => {
    let lastRecorded = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastRecorded > 5000) {
        lastRecorded = now;
        SecurityService.recordUserActivity();
      }
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });

    // Periodic check for 25 min inactivity
    const timeoutCheckInterval = setInterval(() => {
      const check = SecurityService.checkSessionTimeout(25);
      if (check.timedOut && !isSessionTimeoutWarningOpen) {
        setIsSessionTimeoutWarningOpen(true);
      }
    }, 30000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(timeoutCheckInterval);
    };
  }, [isSessionTimeoutWarningOpen]);

  // Subscribe to Firebase Auth state change
  useEffect(() => {
    const unsubscribe = AuthService.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await AuthService.getCurrentUserData(firebaseUser);
        if (userData) {
          setAuthUser({
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            role: userData.role,
          });
          setCurrentRole(userData.role);

          // Perform full bi-directional Cloud Sync for user's isolated account
          await CloudSyncService.syncAllData('auth_signin');
          setProfile(StorageService.getProfile());
        }
      } else {
        setAuthUser(null);
        CloudSyncService.broadcastState();
      }
    });

    // Listen for cloud sync completion events to update UI
    const handleCloudDataReloaded = () => {
      setProfile(StorageService.getProfile());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('eduai_cloud_data_reloaded', handleCloudDataReloaded);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('eduai_cloud_data_reloaded', handleCloudDataReloaded);
      }
    };
  }, []);

  // Subscribe to Notification events and sync reminders on mount
  useEffect(() => {
    NotificationService.syncContextualReminders();
    BackupService.initialize();

    const handleLevelUp = (e: any) => {
      const detail = e.detail;
      NotificationService.addNotification({
        type: 'level-up',
        title: `Level Up! Reached Level ${detail?.newLevel || ''} 🎉`,
        message: `Congratulations! You unlocked new mastery perks and +50 XP bonus milestone.`,
        timestamp: 'Just now',
        priority: 'high',
        category: 'gamification',
        actionSection: 'achievements',
        actionLabel: 'View Level Perks',
        metadata: {
          xpReward: 50,
          accentColor: 'purple',
        },
      });
    };

    const handleBadgeUnlocked = (e: any) => {
      const badge = e.detail?.badge;
      if (badge) {
        NotificationService.addNotification({
          type: 'achievement',
          title: `Badge Unlocked: ${badge.title} 🏆`,
          message: `${badge.description} +${badge.rewardXp} XP reward added!`,
          timestamp: 'Just now',
          priority: 'normal',
          category: 'gamification',
          actionSection: 'achievements',
          actionLabel: 'Claim Reward',
          metadata: {
            xpReward: badge.rewardXp,
            accentColor: 'amber',
          },
        });
      }
    };

    const handleTopicImproved = (e: any) => {
      const detail = e.detail;
      if (detail) {
        NotificationService.notifyTopicImproved(
          detail.topicName,
          detail.subjectName,
          detail.accuracyBefore,
          detail.accuracyAfter
        );
      }
    };

    const handleQuizCompleted = (e: any) => {
      const detail = e.detail;
      if (detail && detail.wrongCount > 0) {
        NotificationService.notifyQuizMistakesRevision(
          detail.quizTitle,
          detail.subjectName,
          detail.wrongCount
        );
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('eduai_level_up', handleLevelUp);
      window.addEventListener('eduai_badge_unlocked', handleBadgeUnlocked);
      window.addEventListener('eduai_topic_improved', handleTopicImproved);
      window.addEventListener('eduai_quiz_completed', handleQuizCompleted);
      return () => {
        window.removeEventListener('eduai_level_up', handleLevelUp);
        window.removeEventListener('eduai_badge_unlocked', handleBadgeUnlocked);
        window.removeEventListener('eduai_topic_improved', handleTopicImproved);
        window.removeEventListener('eduai_quiz_completed', handleQuizCompleted);
      };
    }
  }, []);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Apply dark class to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('eduai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('eduai_theme', 'light');
    }
  }, [darkMode]);

  const handleUpdateProfile = (updated: StudentProfile) => {
    StorageService.saveProfile(updated);
    setProfile(updated);
    if (authUser) {
      FirestoreStorageService.syncProfileToFirestore(authUser.uid, updated);
      CloudSyncService.syncAllData('profile_update');
    }
    if (updated.preferredLanguage && updated.preferredLanguage !== lang) {
      setLang(updated.preferredLanguage);
    }
  };

  const handleLanguageChange = (newLang: LanguageCode) => {
    setLang(newLang);
    const updated = { ...profile, preferredLanguage: newLang };
    StorageService.saveProfile(updated);
    setProfile(updated);
    if (authUser) {
      FirestoreStorageService.syncProfileToFirestore(authUser.uid, updated);
      CloudSyncService.syncAllData('language_update');
    }
  };

  const handleResetData = () => {
    StorageService.resetAllData();
    const freshProfile = StorageService.getProfile();
    setProfile(freshProfile);
    setCurrentSection('home');
  };

  const handleSuccessAuth = (role: UserRole, email: string, userName: string) => {
    setCurrentRole(role);
    if (role === 'parent') {
      setCurrentSection('parent-dashboard');
    } else if (role === 'teacher') {
      setCurrentSection('teacher-dashboard');
    } else {
      setCurrentSection('home');
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setAuthUser(null);
    setCurrentRole('student');
    setCurrentSection('home');
  };

  const renderCurrentView = () => {
    switch (currentSection) {
      case 'home':
        return <HomeView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'learning-coach':
        return (
          <AiCoachView
            profile={profile}
            onNavigate={setCurrentSection}
            lang={lang}
            onNavigateToAi={(prompt) => {
              localStorage.setItem('eduai_pending_ask_prompt', prompt);
              setCurrentSection('ask-ai');
            }}
          />
        );
      case 'smart-revision':
        return <SmartRevisionView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'personal-learning':
        return (
          <PersonalLearningView
            profile={profile}
            onNavigate={setCurrentSection}
            lang={lang}
            onNavigateToAi={(prompt) => {
              localStorage.setItem('eduai_pending_ask_prompt', prompt);
              setCurrentSection('ask-ai');
            }}
          />
        );
      case 'parent-dashboard':
        return (
          <ProtectedRoute
            section="parent-dashboard"
            userRole={currentRole}
            userEmail={authUser?.email}
            onNavigate={setCurrentSection}
            onRequestAuth={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            onSwitchRole={setCurrentRole}
          >
            <ParentDashboardView
              profile={profile}
              onNavigate={setCurrentSection}
              lang={lang}
              currentRole={currentRole}
              onRoleChange={setCurrentRole}
            />
          </ProtectedRoute>
        );
      case 'teacher-dashboard':
        return (
          <ProtectedRoute
            section="teacher-dashboard"
            userRole={currentRole}
            userEmail={authUser?.email}
            onNavigate={setCurrentSection}
            onRequestAuth={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            onSwitchRole={setCurrentRole}
          >
            <TeacherDashboardView
              profile={profile}
              onNavigate={setCurrentSection}
              lang={lang}
              currentRole={currentRole}
              onRoleChange={setCurrentRole}
            />
          </ProtectedRoute>
        );
      case 'admin-dashboard':
        return (
          <ProtectedRoute
            section="admin-dashboard"
            userRole={currentRole}
            userEmail={authUser?.email}
            onNavigate={setCurrentSection}
            onRequestAuth={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            onSwitchRole={setCurrentRole}
          >
            <AdminDashboardView
              profile={profile}
              userRole={currentRole}
              onNavigateSection={setCurrentSection}
            />
          </ProtectedRoute>
        );
      case 'ask-ai':
        return <AskAiView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'photo-solver':
        return <PhotoSolverView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'notes':
        return <NotesView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'books':
        return <BooksView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'quiz':
        return <QuizView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'exam-mode':
        return <ExamModeView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'paper-generator':
        return (
          <ProtectedRoute
            section="paper-generator"
            userRole={currentRole}
            userEmail={authUser?.email}
            onNavigate={setCurrentSection}
            onRequestAuth={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            onSwitchRole={setCurrentRole}
          >
            <PaperGeneratorView
              profile={profile}
              lang={lang}
              onNavigate={setCurrentSection}
              showToast={showToast}
            />
          </ProtectedRoute>
        );
      case 'study-planner':
        return <StudyPlannerView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'weak-topics':
        return <WeakTopicsView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'progress':
        return <ProgressView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'achievements':
        return <AchievementsView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
      case 'profile':
        return (
          <ProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onNavigate={setCurrentSection}
            lang={lang}
          />
        );
      case 'settings':
        return (
          <SettingsView
            profile={profile}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            lang={lang}
            onChangeLanguage={handleLanguageChange}
            onResetData={handleResetData}
            authUser={authUser}
            onNavigate={setCurrentSection}
            onAccountDeleted={() => {
              setAuthUser(null);
              setCurrentRole('student');
              handleResetData();
              showToast('Account deleted and all personal data erased.');
            }}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            profile={profile}
            onNavigate={setCurrentSection}
            lang={lang}
          />
        );
      default:
        return <HomeView profile={profile} onNavigate={setCurrentSection} lang={lang} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm rounded-xl border border-indigo-200 bg-white/95 p-4 shadow-xl backdrop-blur-sm transition-all duration-300 dark:border-indigo-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Gamification Level-Up & Badge Unlock Modal Notification */}
      <GamificationNotification />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccessAuth={handleSuccessAuth}
      />

      {/* Session Inactivity Timeout Modal */}
      <SessionTimeoutModal
        isOpen={isSessionTimeoutWarningOpen}
        onExtendSession={() => {
          SecurityService.recordUserActivity();
          setIsSessionTimeoutWarningOpen(false);
          showToast('Session refreshed successfully.');
        }}
        onLogout={() => {
          setIsSessionTimeoutWarningOpen(false);
          handleLogout();
          showToast('Session locked due to inactivity.');
        }}
        onLockSession={() => {
          setIsSessionTimeoutWarningOpen(false);
          handleLogout();
          showToast('Session locked due to inactivity.');
        }}
      />

      {/* Top Fixed Header */}
      <Header
        profile={profile}
        activeLanguage={lang}
        activeTheme={darkMode ? 'dark' : 'light'}
        currentRole={currentRole}
        authUser={authUser}
        onRoleChange={setCurrentRole}
        onLanguageChange={handleLanguageChange}
        onThemeToggle={() => setDarkMode(!darkMode)}
        onNavigate={setCurrentSection}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Container Layout */}
      <div className="mx-auto flex max-w-7xl min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar Rail Navigation */}
        <SidebarNavigation currentSection={currentSection} onNavigate={setCurrentSection} lang={lang} />

        {/* Dynamic View Workspace with Non-blocking Suspense Fallback */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 mb-16 md:mb-0 overflow-y-auto">
          <Suspense fallback={<LoadingFallback label="Loading learning workspace..." />}>
            {renderCurrentView()}
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavigation currentSection={currentSection} onNavigate={setCurrentSection} lang={lang} />
    </div>
  );
}
