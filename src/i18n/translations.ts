import React, { createContext, useContext, ReactNode } from 'react';

export type SupportedLanguage = 'en';

export const enDict = {
  // Navigation & Tabs
  tabDashboard: 'Dashboard',
  tabResources: 'Resources',
  tabCalendar: 'Calendar',
  tabTimetable: 'Timetable & Deadlines',
  tabGpa: 'GPA Calculator',
  tabKoko: 'Co-Curricular',
  tabJatiDiri: 'National Identity (Auditorium)',
  tabStudentsRoster: 'Student Roster',
  tabCommunity: 'Community Forum',
  tabAiAssistant: 'AI Academic Mentor',

  // Roles & Badges
  roleStudent: 'Student Scholar',
  roleLecturer: 'Faculty Lecturer',
  academicPortalTitle: 'ASASIpintar Academic Portal',
  officialUkmbadge: 'Universiti Kebangsaan Malaysia',
  exclusiveNotice: 'Official Academic Management System • Pusat PERMATApintar Negara UKM',

  // Dashboard & Common
  studentDashboardTitle: 'Scholar Workspace',
  lecturerDashboardTitle: 'Faculty Management Console',
  welcomeBack: 'Welcome back',
  matricNumber: 'Matric No.',
  studentSet: 'Academic Set',
  currentGpa: 'Current GPA',
  targetGpa: 'Target CGPA',
  creditsCompleted: 'Credits Completed',
  recentBroadcasts: 'Faculty Broadcast Notices',
  upcomingDeadlines: 'Pending Assignments & Deadlines',
  todaysClasses: 'Today’s Academic Schedule',
  noBroadcasts: 'No active broadcast announcements at this time.',
  noDeadlines: 'All assessments up to date.',
  noClassesToday: 'No classes scheduled for today.',

  // Live Broadcasts
  urgentNotice: 'Urgent Faculty Notice',
  rescheduleNotice: 'Class Rescheduled',
  infoNotice: 'General Announcement',
  dismissBanner: 'Dismiss',

  // Resources View
  resourcesTitle: 'Academic Course Materials',
  resourcesSubtitle: 'Official lecture slide decks, tutorial problem sets, and lab manuals.',
  uploadResourceBtn: 'Upload New Material',
  searchResources: 'Search lecture notes or topics...',
  allCategories: 'All Categories',
  downloadBtn: 'Download',

  // Timetable & Calendar
  calendarTitle: 'Academic Timetable & Schedule',
  calendarSubtitle: 'Official Set timetable schedule and class venue allocations.',
  rescheduleClassBtn: 'Reschedule Class Session',
  rescheduledBadge: 'Rescheduled',

  // Community View
  communityFeedTitle: 'Scholarly Community Forum',
  communityFeedDesc: 'Interactive peer discussion platform, collaborative problem-solving, and study tips.',
  startDiscussionBtn: 'Create Discussion Thread',
  allDiscussions: 'All Threads',

  // AI Assistant View
  aiAssistantTitle: 'PINTAR AI Academic Mentor',
  aiAssistantDesc: 'Real-time step-by-step guidance tailored for the official UKM ASASIpintar curriculum.',
  aiAssistantBadge: 'ASASIpintar AI Mentor',
  askAiPlaceholder: 'Ask a question regarding Chemistry, Physics, Biology, Statistics, or Logic...',
  sendAiPrompt: 'Send',
  aiThinkingText: 'PINTAR AI is deriving step-by-step academic solution...',

  // Modals & Action Controls
  signOut: 'Sign Out',
  confirm: 'Confirm',
  cancel: 'Cancel',
  saveChanges: 'Save Changes',
  delete: 'Delete',
  edit: 'Edit',
};

export type DictionaryType = typeof enDict;

interface LanguageContextType {
  lang: SupportedLanguage;
  dict: DictionaryType;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  dict: enDict,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <LanguageContext.Provider value={{ lang: 'en', dict: enDict }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
