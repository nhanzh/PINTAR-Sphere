import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  Calculator,
  Users,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Bookmark
} from 'lucide-react';
import { UserProfile } from '../types.ts';

interface SidebarProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
  setActiveTab?: (tab: any) => void;
  user: UserProfile;
  bookmarkedCount?: number;
  upcomingExamCount?: number;
  newResourceCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  setActiveTab,
  user,
  bookmarkedCount = 2,
}) => {
  const handleTabClick = (tabId: string) => {
    const target = tabId === 'lecture_exam' ? 'lectures' : tabId === 'ai_assistant' ? 'ai-assistant' : tabId;
    if (setActiveTab) setActiveTab(target);
    else if (onSelectTab) onSelectTab(target);
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      sublabel: 'Papan Pemuka',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'resources',
      label: 'Learning Resources',
      sublabel: 'Pusat Sumber & Nota',
      icon: BookOpen,
      badge: 'Bahan Baru',
    },
    {
      id: 'calendar',
      label: 'Academic Calendar',
      sublabel: 'Takwim & Tarikh Penting',
      icon: Calendar,
      badge: undefined,
    },
    {
      id: 'lectures',
      label: 'Notes & Exam Schedule',
      sublabel: 'Silibus & Jadual DECT',
      icon: FileSpreadsheet,
      badge: 'DECT',
    },
    {
      id: 'gpa',
      label: 'GPA & CGPA Calculator',
      sublabel: 'Pengiraan Gred & Dekan',
      icon: Calculator,
      badge: undefined,
    },
    {
      id: 'koko',
      label: 'Co-Curricular & Jati Diri',
      sublabel: 'Pengesahan Kokurikulum (10%)',
      icon: Award,
      badge: '10%',
    },
    {
      id: 'community',
      label: 'Community Portal',
      sublabel: 'Forum Rakan & Soal Jawab',
      icon: Users,
      badge: undefined,
    },
    {
      id: 'ai-assistant',
      label: 'PINTAR AI Assistant',
      sublabel: 'Tutor Akademik Gemini',
      icon: Sparkles,
      badge: 'AI v3.8',
      highlight: true,
    },
  ];

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 sticky top-20">
        {/* Navigation Items */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {(navItems || []).map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'lectures' && activeTab === 'lecture_exam') ||
              (item.id === 'ai-assistant' && activeTab === 'ai_assistant');
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : item.highlight
                    ? 'bg-indigo-50/70 text-indigo-900 hover:bg-indigo-100/70 border border-indigo-100'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.highlight
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-tight truncate">
                      {item.label}
                    </div>
                    <div
                      className={`text-[10px] leading-tight truncate ${
                        isActive ? 'text-indigo-100' : 'text-slate-500'
                      }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : item.highlight
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Academic Profile Snapshot Box */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl p-3.5 text-white shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-medium text-slate-300">
                Purata Nilai Gred Kumulatif
              </div>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30">
                <Award className="w-3 h-3" />
                Dekan
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-extrabold tracking-tight">
                {user.currentCgpa.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">/ 4.00 CGPA</span>
              <span className="ml-auto text-[11px] text-emerald-400 flex items-center font-semibold">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                Sasaran: {user.targetCgpa.toFixed(2)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-1.5 rounded-full"
                style={{ width: `${(user.currentCgpa / 4.0) * 100}%` }}
              ></div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300">
              <span>Kredit Selesai: {user.totalCreditsCompleted} jam</span>
              <button
                onClick={() => handleTabClick('gpa')}
                className="text-indigo-300 hover:text-white font-medium inline-flex items-center text-[10px]"
              >
                Kira GPA <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bookmarks Quick Link */}
        <div className="mt-3 flex items-center justify-between px-2 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bahan Disimpan</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
            {bookmarkedCount}
          </span>
        </div>
      </div>
    </aside>
  );
};
