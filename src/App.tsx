import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  UserProfile,
  ResourceItem,
  ClassScheduleItem,
  DeadlineItem,
  SubmissionRecord,
  StudentCourseGrade,
  ForumPost,
  PersonalTimetableNote,
  BroadcastNotice,
} from './types.ts';
import { INITIAL_USER } from './data/mockData.ts';
import { dataService } from './services/dataService.ts';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext.tsx';
import { ThemeProvider } from './theme/ThemeContext.tsx';

import { Navbar } from './components/Navbar.tsx';
import { PortalLoginView } from './components/PortalLoginView.tsx';
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

function AppContent() {
  const { lang, dict } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [aiPromptToTrigger, setAiPromptToTrigger] = useState<string>('');

  // Active User Profile (null if logged out)
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('pintar_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_USER;
  });

  // Real-time synced application state
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [grades, setGrades] = useState<StudentCourseGrade[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastNotice[]>([]);
  const [privateNotes, setPrivateNotes] = useState<PersonalTimetableNote[]>([]);

  // Persist user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('pintar_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pintar_active_user');
    }
  }, [user]);

  // Subscribe to real-time data from dataService (Firestore + Local fallback)
  useEffect(() => {
    const unsubResources = dataService.subscribeToResources((data) => setResources(data));
    const unsubSchedules = dataService.subscribeToSchedules((data) => setSchedules(data));
    const unsubDeadlines = dataService.subscribeToDeadlines((data) => setDeadlines(data));
    const unsubSubmissions = dataService.subscribeToSubmissions((data) => setSubmissions(data));
    const unsubGrades = dataService.subscribeToGrades((data) => setGrades(data));
    const unsubPosts = dataService.subscribeToPosts((data) => setPosts(data));
    const unsubBroadcasts = dataService.subscribeToBroadcasts((data) => setBroadcasts(data));

    return () => {
      unsubResources();
      unsubSchedules();
      unsubDeadlines();
      unsubSubmissions();
      unsubGrades();
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

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pintar_active_user');
  };

  // If user is not logged in, render the isolated Portal Gateway
  if (!user) {
    return <PortalLoginView onLogin={(newUser) => setUser(newUser)} />;
  }

  // Count active rescheduled classes for this student's set
  const studentSet = user.setNumber || 3;
  const rescheduleAlertCount = schedules.filter(
    (s) =>
      s.isRescheduled &&
      (user.role === 'lecturer' || s.setNumber === studentSet || s.setNumber === 'all')
  ).length;

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-200">
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
            onRefreshData={refreshPrivateNotes}
          />
        )}

        {activeTab === 'gpa' && (
          <GpaCalculatorView
            user={user}
            grades={grades}
            onGradesUpdated={() => {}}
          />
        )}

        {activeTab === 'koko' && <KokoMarksView user={user} />}

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
