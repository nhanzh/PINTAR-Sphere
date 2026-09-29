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
  Bookmark,
  Shield
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { canAccessKokoModule, canAccessJatiDiriMarks } from '../utils/studentUtils.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';

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
  const { lang, dict } = useLanguage();

  const handleTabClick = (tabId: string) => {
    const target = tabId === 'lecture_exam' ? 'lectures' : tabId === 'ai_assistant' ? 'ai-assistant' : tabId;
    if (setActiveTab) setActiveTab(target);
    else if (onSelectTab) onSelectTab(target);
  };

  const navLabels = {
    ms: {
      dashboard: { label: 'Papan Pemuka', sub: 'Ringkasan Akademik' },
      resources: { label: 'Bahan Pembelajaran', sub: 'Pusat Sumber & Nota', badge: 'Bahan Baru' },
      calendar: { label: 'Kalendar Akademik', sub: 'Takwim & Tarikh Penting' },
      lectures: { label: 'Jadual & Tarikh Akhir', sub: 'Silibus & Jadual DECT', badge: 'DECT' },
      gpa: { label: 'Kalkulator GPA', sub: 'Pengiraan Gred & Dekan' },
      koko: { label: 'Markah Kokurikulum', sub: 'Pengesahan Koko (10%)', badge: '10%' },
      community: { label: 'Komuniti ASASIpintar', sub: 'Forum Rakan & Soal Jawab' },
      ai: { label: 'PINTAR AI Mentor', sub: 'Tutor Akademik Pintar', badge: 'Gemini' },
      cgpaTitle: 'Purata Nilai Gred Kumulatif',
      deansList: 'Dekan',
      targetLabel: 'Sasaran',
      creditsCompleted: 'Kredit Selesai',
      calculateGpa: 'Kira GPA',
      savedResources: 'Bahan Disimpan',
      hours: 'jam',
    },
    en: {
      dashboard: { label: 'Dashboard', sub: 'Academic Overview' },
      resources: { label: 'Learning Resources', sub: 'Study Hub & Notes', badge: 'New Files' },
      calendar: { label: 'Academic Calendar', sub: 'Dates & Milestones' },
      lectures: { label: 'Timetable & Deadlines', sub: 'Syllabus & DECT Schedule', badge: 'DECT' },
      gpa: { label: 'GPA & CGPA Calculator', sub: 'Grade & Dean Projections' },
      koko: { label: 'Co-Curricular Marks', sub: 'Koko Validation (10%)', badge: '10%' },
      community: { label: 'ASASIpintar Community', sub: 'Peer Forum & Q&A' },
      ai: { label: 'PINTAR AI Mentor', sub: 'Academic Smart Tutor', badge: 'Gemini' },
      cgpaTitle: 'Cumulative Grade Point Average',
      deansList: "Dean's List",
      targetLabel: 'Target',
      creditsCompleted: 'Credits Completed',
      calculateGpa: 'Calculate GPA',
      savedResources: 'Saved Resources',
      hours: 'hrs',
    },
    zh: {
      dashboard: { label: '仪表盘概览', sub: '学业进度总览' },
      resources: { label: '教学与学习资源', sub: '课程讲义与资料库', badge: '最新' },
      calendar: { label: '学术日历与校历', sub: '重要学术时间节点' },
      lectures: { label: '课表与作业截止', sub: '教学大纲与DECT考程', badge: 'DECT' },
      gpa: { label: 'GPA 与 CGPA 测算器', sub: '等级预测与院长荣誉' },
      koko: { label: '课外活动与品格评定', sub: '课外活动审核 (10%)', badge: '10%' },
      community: { label: 'ASASIpintar 学术社区', sub: '同学互动论坛与问答' },
      ai: { label: 'PINTAR AI 智能导师', sub: '专属学术智能答疑', badge: 'Gemini' },
      cgpaTitle: '累计平均绩点 (CGPA)',
      deansList: '院长嘉奖',
      targetLabel: '目标',
      creditsCompleted: '已修学分',
      calculateGpa: '计算 GPA',
      savedResources: '已收藏资料',
      hours: '学分',
    },
    ta: {
      dashboard: { label: 'டாஷ்போர்டு', sub: 'கல்வி மேலோட்டம்' },
      resources: { label: 'கற்றல் வளங்கள்', sub: 'ஆய்வு மையம் மற்றும் குறிப்புகள்', badge: 'புதியது' },
      calendar: { label: 'கல்வி நாள்காட்டி', sub: 'முக்கிய தேதிகள் மற்றும் நிகழ்வுகள்' },
      lectures: { label: 'அட்டவணை மற்றும் காலக்கெடு', sub: 'பாடத்திட்டம் மற்றும் DECT அட்டவணை', badge: 'DECT' },
      gpa: { label: 'GPA மற்றும் CGPA கால்குலேட்டர்', sub: 'மதிப்பெண் மற்றும் டீன் கணிப்பு' },
      koko: { label: 'இணைப் பாடத்திட்டம்', sub: 'செயல்பாட்டு சரிபார்ப்பு (10%)', badge: '10%' },
      community: { label: 'ASASIpintar சமூகம்', sub: 'மன்றம் மற்றும் கேள்வி பதில்கள்' },
      ai: { label: 'PINTAR AI வழிகாட்டி', sub: 'கல்வி வழிகாட்டி', badge: 'Gemini' },
      cgpaTitle: 'மொத்த தர புள்ளி சராசரி (CGPA)',
      deansList: 'டீன் விருது',
      targetLabel: 'இலக்கு',
      creditsCompleted: 'முடிக்கப்பட்ட வரவுகள்',
      calculateGpa: 'GPA கணக்கிடுக',
      savedResources: 'சேமிக்கப்பட்டவை',
      hours: 'மணிகள்',
    },
  }[lang] || {
    dashboard: { label: dict.tabOverview, sub: 'Ringkasan Akademik' },
    resources: { label: dict.tabResources, sub: 'Pusat Sumber & Nota', badge: 'Bahan Baru' },
    calendar: { label: dict.tabCalendar, sub: 'Takwim & Tarikh Penting' },
    lectures: { label: dict.tabTimetable, sub: 'Silibus & Jadual DECT', badge: 'DECT' },
    gpa: { label: dict.tabGpa, sub: 'Pengiraan Gred & Dekan' },
    koko: { label: dict.tabKoko, sub: 'Pengesahan Koko (10%)', badge: '10%' },
    community: { label: dict.tabCommunity, sub: 'Forum Rakan & Soal Jawab' },
    ai: { label: dict.tabAiMentor, sub: 'Tutor Akademik Pintar', badge: 'Gemini' },
    cgpaTitle: 'Purata Nilai Gred Kumulatif',
    deansList: 'Dekan',
    targetLabel: 'Sasaran',
    creditsCompleted: 'Kredit Selesai',
    calculateGpa: 'Kira GPA',
    savedResources: 'Bahan Disimpan',
    hours: 'jam',
  };

  const navItems = [
    {
      id: 'dashboard',
      label: navLabels.dashboard.label,
      sublabel: navLabels.dashboard.sub,
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'resources',
      label: navLabels.resources.label,
      sublabel: navLabels.resources.sub,
      icon: BookOpen,
      badge: navLabels.resources.badge,
    },
    {
      id: 'calendar',
      label: navLabels.calendar.label,
      sublabel: navLabels.calendar.sub,
      icon: Calendar,
      badge: undefined,
    },
    {
      id: 'lectures',
      label: navLabels.lectures.label,
      sublabel: navLabels.lectures.sub,
      icon: FileSpreadsheet,
      badge: navLabels.lectures.badge,
    },
    {
      id: 'gpa',
      label: navLabels.gpa.label,
      sublabel: navLabels.gpa.sub,
      icon: Calculator,
      badge: undefined,
    },
    {
      id: 'koko',
      label: navLabels.koko.label,
      sublabel: navLabels.koko.sub,
      icon: Award,
      badge: navLabels.koko.badge,
    },
    {
      id: 'jati_diri',
      label: lang === 'ms' ? 'Markah Jati Diri' : 'Jati Diri Marks',
      sublabel: lang === 'ms' ? 'Pengurusan Gred Jati Diri (7%)' : 'Jati Diri Assessment (7%)',
      icon: Shield,
      badge: '7%',
      highlight: true,
    },
    {
      id: 'community',
      label: navLabels.community.label,
      sublabel: navLabels.community.sub,
      icon: Users,
      badge: undefined,
    },
    {
      id: 'ai-assistant',
      label: navLabels.ai.label,
      sublabel: navLabels.ai.sub,
      icon: Sparkles,
      badge: navLabels.ai.badge,
      highlight: true,
    },
  ];

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-3 sticky top-20 transition-colors">
        {/* Navigation Items */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {(navItems || [])
            .filter((item) => {
              if (item.id === 'koko' && user.role === 'lecturer' && !canAccessKokoModule(user.email, user.name, user.role)) {
                return false;
              }
              if (item.id === 'jati_diri' && (!canAccessJatiDiriMarks(user.email, user.name, user.role) || user.role !== 'lecturer')) {
                return false;
              }
              return true;
            })
            .map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'lectures' && activeTab === 'lecture_exam') ||
              (item.id === 'ai-assistant' && activeTab === 'ai_assistant') ||
              (item.id === 'jati_diri' && activeTab === 'jati_diri');
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : item.highlight
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-800/60'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.highlight
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-900 dark:group-hover:text-white'
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
                        isActive ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
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
                        : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50'
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
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl p-3.5 text-white shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-medium text-slate-300">
                {navLabels.cgpaTitle}
              </div>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30">
                <Award className="w-3 h-3" />
                {navLabels.deansList}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-extrabold tracking-tight">
                {(user.currentCgpa || 3.75).toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">/ 4.00 CGPA</span>
              <span className="ml-auto text-[11px] text-emerald-400 flex items-center font-semibold">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                {navLabels.targetLabel}: {(user.targetCgpa || 3.90).toFixed(2)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-1.5 rounded-full"
                style={{ width: `${((user.currentCgpa || 3.75) / 4.0) * 100}%` }}
              ></div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300">
              <span>{navLabels.creditsCompleted}: {user.totalCreditsCompleted || 19} {navLabels.hours}</span>
              <button
                onClick={() => handleTabClick('gpa')}
                className="text-indigo-300 hover:text-white font-medium inline-flex items-center text-[10px] cursor-pointer"
              >
                {navLabels.calculateGpa} <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bookmarks Quick Link */}
        <div className="mt-3 flex items-center justify-between px-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{navLabels.savedResources}</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
            {bookmarkedCount}
          </span>
        </div>
      </div>
    </aside>
  );
};
