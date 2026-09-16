import React, { useState } from 'react';
import { UserProfile, ActiveTab } from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { SUPPORTED_LANGUAGES, Language } from '../i18n/translations.ts';
import { ThemeToggle } from './ThemeToggle.tsx';
import {
  BookOpen,
  Calendar,
  Clock,
  Calculator,
  Award,
  Users,
  MessageSquare,
  Sparkles,
  Bell,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Globe,
  Lock,
  Building2,
  GraduationCap,
  Shield,
} from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  onOpenBroadcastModal?: () => void;
  rescheduleAlertCount: number;
  broadcastAlertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenBroadcastModal,
  rescheduleAlertCount,
  broadcastAlertCount = 0,
}) => {
  const { lang, setLang, dict } = useLanguage();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const isStudent = user.role === 'student';

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Institution Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                P
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    PINTAR<span className="text-indigo-600 dark:text-indigo-400">@Sphere</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    ASASIpintar
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {dict.brandSubtitle}
                </div>
              </div>
            </button>
          </div>

          {/* Right Controls: Broadcast, Theme Toggle, Language Switcher, User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Lecturer Broadcast Button (Vendor Dispatcher) */}
            {!isStudent && onOpenBroadcastModal && (
              <button
                type="button"
                onClick={onOpenBroadcastModal}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-xs hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer"
                title={dict.broadcastNotice}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{dict.broadcastNotice}</span>
              </button>
            )}

            {/* Schedule Alert Pill for Students */}
            {rescheduleAlertCount > 0 && (
              <button
                onClick={() => setActiveTab('calendar')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors animate-pulse cursor-pointer"
                title="Schedule update alert"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{rescheduleAlertCount} {dict.rescheduleAlert}</span>
              </button>
            )}

            {/* Dark/Light Theme Toggle */}
            <ThemeToggle variant="icon" />

            {/* 4-Language Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Change language"
              >
                <span className="text-sm">{currentLangObj.flag}</span>
                <span className="hidden sm:inline">{currentLangObj.nativeLabel}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsLangDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                      Pilih Bahasa / Language
                    </div>
                    {SUPPORTED_LANGUAGES.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setLang(item.code);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                          lang === item.code
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.flag}</span>
                          <span>{item.nativeLabel}</span>
                        </div>
                        {lang === item.code && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Role-Locked User Profile Chip with Logout Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all text-left cursor-pointer"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isStudent
                      ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                      : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {isStudent ? `S${user.setNumber || '?'}` : 'DR'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {user.name.split(' ')[0]} {user.name.split(' ')[1] || ''}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        isStudent ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                    />
                    {isStudent
                      ? `${dict.studentPortal} • Set ${user.setNumber}`
                      : `${dict.lecturerPortal} • ${user.taughtSubjectName || 'Faculty'}`}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                    {/* User Card */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${
                            isStudent ? 'bg-blue-600' : 'bg-emerald-600'
                          }`}
                        >
                          {isStudent ? (
                            <GraduationCap className="w-5 h-5" />
                          ) : (
                            <Shield className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                        {isStudent ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400 dark:text-slate-400">{dict.matricNumber}:</span>
                              <span className="font-bold text-slate-900 dark:text-white">{user.matricNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 dark:text-slate-400">{dict.assignedSet}:</span>
                              <span className="font-bold text-blue-700 dark:text-blue-400">Set {user.setNumber}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400 dark:text-slate-400">{dict.subject}:</span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                {user.taughtSubjectName} ({user.taughtSubjectCode})
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 dark:text-slate-400">{dict.assignedSet}:</span>
                              <span className="font-bold text-slate-900 dark:text-white">{dict.allSets}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Theme Mode Option in Profile */}
                    <div className="pt-1">
                      <ThemeToggle variant="expanded" />
                    </div>

                    {/* Role Lock Notice */}
                    <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 leading-snug flex items-start gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>{dict.switchRoleNotice}</span>
                    </div>

                    {/* Strict Logout Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{dict.logout}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Main Navigation Bar (Student & Lecturer Controls) */}
      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 overflow-x-auto scrollbar-none transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 py-1.5 text-xs font-semibold whitespace-nowrap">
            {/* Dashboard Overview */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{dict.tabOverview}</span>
            </button>

            {/* Learning Resources */}
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'resources'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{dict.tabResources}</span>
            </button>

            {/* Academic Calendar */}
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{dict.tabCalendar}</span>
              {rescheduleAlertCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping" />
              )}
            </button>

            {/* Timetable & Deadlines */}
            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'timetable'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{dict.tabTimetable}</span>
            </button>

            {/* GPA Calculator / Grade Entry */}
            <button
              onClick={() => setActiveTab('gpa')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'gpa'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{dict.tabGpa}</span>
            </button>

            {/* Koko Marks (for Student) */}
            {isStudent && (
              <button
                onClick={() => setActiveTab('koko')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'koko'
                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{dict.tabKoko}</span>
              </button>
            )}

            {/* Student Roster (for Lecturer) */}
            {!isStudent && (
              <button
                onClick={() => setActiveTab('students-roster')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'students-roster'
                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{dict.tabRoster}</span>
              </button>
            )}

            {/* Community Portal */}
            <button
              onClick={() => setActiveTab('community')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'community'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{dict.tabCommunity}</span>
            </button>

            {/* AI Assistant */}
            <button
              onClick={() => setActiveTab('ai-assistant')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'ai-assistant'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs font-bold'
                  : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/60 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{dict.tabAiMentor}</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
