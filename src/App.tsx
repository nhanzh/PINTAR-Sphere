import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  UserProfile,
  UserRole,
  ResourceItem,
  ClassScheduleItem,
  DeadlineItem,
  SubmissionRecord,
  StudentCourseGrade,
  StudentKokoRecord,
  ForumPost,
  PersonalTimetableNote,
  BroadcastNotice,
} from './types.ts';
import { dataService } from './services/dataService.ts';
import { authService } from './services/authService.ts';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext.tsx';
import { ThemeProvider } from './theme/ThemeContext.tsx';
import { isWithin24Hours } from './utils/dateUtils.ts';

import { PortalHeaderBar } from './components/PortalHeaderBar.tsx';
import { PortalLoginView } from './components/PortalLoginView.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LiveBroadcastBanner } from './components/LiveBroadcastBanner.tsx';
import { BroadcastModal } from './components/BroadcastModal.tsx';
import { StudentDashboardView } from './components/StudentDashboardView.tsx';
import { LecturerDashboardView } from './components/LecturerDashboardView.tsx';
import { ResourcesView } from './components/ResourcesView.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { TimetableDeadlineView } from './components/TimetableDeadlineView.tsx';
import { GpaCalculatorView } from './components/GpaCalculatorView.tsx';
import { KokoMarksView } from './components/KokoMarksView.tsx';
import { StudentRosterView } from './components/StudentRosterView.tsx';
import { CommunityView } from './components/CommunityView.tsx';
import { AiAssistantView } from './components/AiAssistantView.tsx';

import { Sparkles } from 'lucide-react';

function getInitialPortal(): UserRole {
  if (typeof window === 'undefined') return 'student';
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (
    host.includes('lecturer') ||
    host.includes('pensyarah') ||
    host.includes('faculty') ||
    path.includes('lecturer') ||
    path.includes('pensyarah') ||
    search.includes('portal=lecturer') ||
    search.includes('role=lecturer') ||
    hash.includes('lecturer')
  ) {
    return 'lecturer';
  }
  return 'student';
}

function getStoredUser(role: UserRole): UserProfile | null {
  const roleKey = role === 'student' ? 'pintar_active_student' : 'pintar_active_lecturer';
  try {
    const saved = localStorage.getItem(roleKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.role === role) {
        if (role === 'lecturer' && !authService.isAuthorizedLecturer(parsed.email)) {
          localStorage.removeItem(roleKey);
          return null;
        }
        return parsed;
      }
    }
  } catch {}
  return null;
}

function AppContent() {
  const { lang, dict } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [aiPromptToTrigger, setAiPromptToTrigger] = useState<string>('');

  // Active Portal Role and User Profile directly determined by URL
  const [portalRole, setPortalRole] = useState<UserRole>(getInitialPortal);
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser(getInitialPortal()));

  // Real-time synced application state
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [grades, setGrades] = useState<StudentCourseGrade[]>([]);
  const [kokoRecords, setKokoRecords] = useState<StudentKokoRecord[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastNotice[]>([]);
  const [privateNotes, setPrivateNotes] = useState<PersonalTimetableNote[]>([]);

  // Synchronize URL and Portal state on navigation / popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const detected = getInitialPortal();
      setPortalRole(detected);
      setUser(getStoredUser(detected));
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Normalize browser address path to /student or /lecturer
    if (typeof window !== 'undefined') {
      const targetPath = `/${portalRole}`;
      if (!window.location.pathname.includes(portalRole)) {
        window.history.replaceState(null, '', targetPath);
      }
    }

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [portalRole]);

  // Persist active user profile changes
  useEffect(() => {
    if (user) {
      const roleKey = user.role === 'student' ? 'pintar_active_student' : 'pintar_active_lecturer';
      localStorage.setItem(roleKey, JSON.stringify(user));
      localStorage.setItem('pintar_active_user', JSON.stringify(user));
    }
  }, [user]);

  const handleLogout = () => {
    if (user) {
      const roleKey = user.role === 'student' ? 'pintar_active_student' : 'pintar_active_lecturer';
      localStorage.removeItem(roleKey);
      localStorage.removeItem('pintar_active_user');
    }
    authService.logOut();
    setUser(null);
  };

  // Subscribe to real-time data from dataService (Firestore + Multi-tab sync + Local storage)
  useEffect(() => {
    const unsubResources = dataService.subscribeToResources((data) => setResources(data));
    const unsubSchedules = dataService.subscribeToSchedules((data) => setSchedules(data));
    const unsubDeadlines = dataService.subscribeToDeadlines((data) => setDeadlines(data));
    const unsubSubmissions = dataService.subscribeToSubmissions((data) => setSubmissions(data));
    const unsubGrades = dataService.subscribeToGrades((data) => setGrades(data));
    const unsubKoko = dataService.subscribeKokoRecords((data) => setKokoRecords(data));
    const unsubPosts = dataService.subscribeToPosts((data) => setPosts(data));
    const unsubBroadcasts = dataService.subscribeToBroadcasts((data) => setBroadcasts(data));

    return () => {
      unsubResources();
      unsubSchedules();
      unsubDeadlines();
      unsubSubmissions();
      unsubGrades();
      unsubKoko();
      unsubPosts();
      unsubBroadcasts();
    };
  }, []);

  // Update private notes when user changes
  useEffect(() => {
    if (user?.email) {
      setPrivateNotes(dataService.getPrivateNotes(user.email));
    }
  }, [user?.email]);

  const refreshPrivateNotes = () => {
    if (user?.email) {
      setPrivateNotes(dataService.getPrivateNotes(user.email));
    }
  };

  const handleOpenAiWithPrompt = (prompt: string) => {
    setAiPromptToTrigger(prompt);
    setActiveTab('ai-assistant');
  };

  // If no user is authenticated, render the PortalLoginView for strict authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans antialiased">
        <PortalHeaderBar
          currentPortal={portalRole}
        />
        <div className="flex-1 flex flex-col justify-center">
          <PortalLoginView
            initialPortal={portalRole}
            onLogin={(loggedInUser) => {
              setUser(loggedInUser);
              setPortalRole(loggedInUser.role);
              const roleKey =
                loggedInUser.role === 'student'
                  ? 'pintar_active_student'
                  : 'pintar_active_lecturer';
              localStorage.setItem(roleKey, JSON.stringify(loggedInUser));
              localStorage.setItem('pintar_active_user', JSON.stringify(loggedInUser));
              if (typeof window !== 'undefined') {
                const targetPath = `/${loggedInUser.role}`;
                if (!window.location.pathname.includes(loggedInUser.role)) {
                  window.history.pushState(null, '', targetPath);
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Count active rescheduled classes for this student's set (only if recent valid announcement exists)
  const studentSet = user.setNumber || 3;
  const rescheduleAlertCount = schedules.filter(
    (s) =>
      s.isRescheduled &&
      s.rescheduleNotice &&
      s.rescheduleNotice.announcedAt &&
      isWithin24Hours(s.rescheduleNotice.announcedAt) &&
      (user.role === 'lecturer' || s.setNumber === studentSet || s.setNumber === 'all')
  ).length;

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-200">
      {/* Top Header Bar */}
      <PortalHeaderBar
        currentPortal={portalRole}
      />

      {/* Top Main Navigation Header */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
        rescheduleAlertCount={rescheduleAlertCount}
        broadcastAlertCount={broadcasts.length}
      />

      {/* Real-Time Live Broadcast Banner (Notice from Lecturer to Student) */}
      <LiveBroadcastBanner broadcasts={broadcasts} user={user} />

      {/* Lecturer Broadcast Dispatcher Modal */}
      {user.role === 'lecturer' && (
        <BroadcastModal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
          lecturer={user}
        />
      )}

      {/* Main Dynamic Workspace Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {activeTab === 'dashboard' &&
          (user.role === 'student' ? (
            <StudentDashboardView
              user={user}
              schedules={schedules}
              deadlines={deadlines}
              grades={grades}
              kokoRecords={kokoRecords}
              broadcasts={broadcasts}
              setActiveTab={setActiveTab}
              onOpenAiWithPrompt={handleOpenAiWithPrompt}
            />
          ) : (
            <LecturerDashboardView
              user={user}
              schedules={schedules}
              deadlines={deadlines}
              submissions={submissions}
              broadcasts={broadcasts}
              resources={resources}
              grades={grades}
              kokoRecords={kokoRecords}
              onSaveGrade={async (g) => {
                await dataService.updateGrade(g);
              }}
              onSaveKoko={async (k) => {
                await dataService.saveKokoRecord(k);
              }}
              setActiveTab={setActiveTab}
              onOpenRescheduleModal={() => setActiveTab('calendar')}
              onOpenUploadModal={() => setActiveTab('resources')}
              onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
            />
          ))}

        {activeTab === 'resources' && (
          <ResourcesView
            user={user}
            resources={resources}
            onUploadSuccess={() => {}}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            user={user}
            schedules={schedules}
            onRescheduleSuccess={() => {}}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableDeadlineView
            user={user}
            deadlines={deadlines}
            submissions={submissions}
            privateNotes={privateNotes}
            schedules={schedules}
            onRefreshData={refreshPrivateNotes}
          />
        )}

        {activeTab === 'gpa' && (
          <GpaCalculatorView
            user={user}
            grades={grades}
            kokoRecords={kokoRecords}
            onGradesUpdated={() => {}}
          />
        )}

        {activeTab === 'koko' && (
          <KokoMarksView
            user={user}
            kokoRecords={kokoRecords}
            onOpenGradeManager={() => setActiveTab('gpa')}
          />
        )}

        {activeTab === 'students-roster' && <StudentRosterView user={user} />}

        {activeTab === 'community' && (
          <CommunityView user={user} posts={posts} />
        )}

        {activeTab === 'ai-assistant' && (
          <AiAssistantView
            user={user}
            initialPrompt={aiPromptToTrigger}
          />
        )}
      </main>

      {/* Floating AI Study Mentor Trigger */}
      {activeTab !== 'ai-assistant' && (
        <aside aria-label="Floating AI Assistant Launcher" className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => setActiveTab('ai-assistant')}
            className="group px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 text-white font-bold text-xs shadow-lg hover:shadow-xl flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </div>
            <span>PINTAR AI</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono">
              {dict.tabAiMentor}
            </span>
          </button>
        </aside>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs py-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="font-extrabold text-indigo-700 dark:text-indigo-400">PINTAR@Sphere</span>
            <span>— Universiti Kebangsaan Malaysia (UKM) • ASASIpintar Kolej GENIUS@Pintar</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {dict.exclusiveNotice}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
