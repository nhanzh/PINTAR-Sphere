import React from 'react';
import {
  UserProfile,
  ClassScheduleItem,
  DeadlineItem,
  StudentCourseGrade,
  ActiveTab,
  BroadcastNotice,
} from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import {
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  ChevronRight,
  Calculator,
  CheckCircle2,
  FileText,
  HelpCircle,
  Flame,
  Bell,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface StudentDashboardViewProps {
  user: UserProfile;
  schedules: ClassScheduleItem[];
  deadlines: DeadlineItem[];
  grades: StudentCourseGrade[];
  broadcasts?: BroadcastNotice[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAiWithPrompt?: (prompt: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  user,
  schedules,
  deadlines,
  grades,
  broadcasts = [],
  setActiveTab,
  onOpenAiWithPrompt,
}) => {
  const { lang, dict } = useLanguage();
  const studentSet = user.setNumber || 3;

  // Filter schedules for this student's set
  const mySchedules = schedules.filter(
    (s) => s.setNumber === studentSet || s.setNumber === 'all'
  );

  // Check for reschedule alerts
  const rescheduleAlerts = mySchedules.filter((s) => s.isRescheduled && s.rescheduleNotice);

  // Filter broadcasts directed to this set or all sets
  const myBroadcasts = broadcasts.filter((b) => {
    return b.targetSet === 'all' || b.targetSet === String(studentSet);
  });

  // Filter deadlines targeted to this set
  const myDeadlines = deadlines.filter((d) => {
    return (
      d.targetSets.includes('all') ||
      d.targetSets.includes(`Set ${studentSet}`) ||
      d.targetSets.some((ts) => ts.toLowerCase().includes(String(studentSet)))
    );
  });

  // Calculate Sem 1 Rule: 2 best sciences + statistics
  const sciences = grades.filter((g) => g.isScience);
  const statistics = grades.find((g) => g.courseCode === 'PNAP0154');
  const sortedSciences = [...sciences].sort(
    (a, b) => b.gradePoint - a.gradePoint || b.totalScore - a.totalScore
  );
  const top2Sciences = sortedSciences.slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Reschedule Alert Banner (If Lecturer has changed any class time/venue) */}
      {rescheduleAlerts.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                  {dict.rescheduleAlert}
                </span>
                <span className="text-xs text-amber-700 font-semibold">
                  Set {studentSet}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-amber-950 mt-1">
                {rescheduleAlerts[0].subject} - Penjadualan Semula Kelas
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 mt-1">
                {rescheduleAlerts[0].rescheduleNotice?.reason}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-semibold text-amber-900 bg-amber-100/70 p-2.5 rounded-xl border border-amber-200">
                <span>
                  ⏰ <strong>Waktu Baru:</strong> {rescheduleAlerts[0].rescheduleNotice?.newTime}
                </span>
                <span className="text-amber-400">•</span>
                <span>
                  📍 <strong>Bilik/Dewan Baru:</strong> {rescheduleAlerts[0].rescheduleNotice?.newVenue}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 underline shrink-0 whitespace-nowrap"
            >
              {dict.tabCalendar}
            </button>
          </div>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-wide">
                {dict.studentPortal} • SET {studentSet}
              </span>
              <span className="text-xs text-slate-400">
                {dict.matricNumber}: {user.matricNumber || 'AP05710'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
              {dict.welcomeBack}, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {dict.exclusiveNotice}. Semua jadual waktu, tarikh akhir tugasan, dan bahan kuliah diselaraskan terus daripada pensyarah anda untuk <strong>Set {studentSet}</strong>.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                onClick={() => setActiveTab('timetable')}
                className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                {dict.tabTimetable}
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/10"
              >
                <BookOpen className="w-3.5 h-3.5" />
                {dict.tabResources}
              </button>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <div className="text-[11px] font-semibold text-indigo-200">CGPA Semasa</div>
              <div className="text-2xl font-black text-white mt-0.5">
                {(user.currentCgpa || 3.84).toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-400 font-bold mt-0.5">{dict.deansList}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <div className="text-[11px] font-semibold text-indigo-200">{dict.tabKoko}</div>
              <div className="text-2xl font-black text-white mt-0.5">
                {user.kokoMarks || 88.5}
              </div>
              <div className="text-[10px] text-indigo-300 font-bold mt-0.5">
                Gred {user.kokoGrade || 'A'} (Band 1)
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Live Lecturer Broadcast Dispatches Section (Vendor-Customer connection) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{dict.recentBroadcasts}</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{dict.liveDispatchDesc}</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/50">
            {myBroadcasts.length} Hebahan Aktif
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {myBroadcasts.slice(0, 3).map((notice) => {
            const isUrgent = notice.priority === 'urgent';
            const isReschedule = notice.priority === 'reschedule';
            const timeAgo = new Date(notice.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={notice.id}
                className={`p-4 rounded-xl border transition-all ${
                  isUrgent
                    ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 hover:border-rose-300 dark:hover:border-rose-800'
                    : isReschedule
                    ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 hover:border-amber-300 dark:hover:border-amber-800'
                    : 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-200 dark:hover:border-indigo-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isUrgent
                            ? 'bg-rose-500 text-white'
                            : isReschedule
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-indigo-500 text-white'
                        }`}
                      >
                        {isUrgent
                          ? dict.priorityUrgent
                          : isReschedule
                          ? dict.priorityReschedule
                          : dict.priorityInfo}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {notice.senderName} ({notice.subjectName})
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-400">
                        • Sasaran: {notice.targetSet === 'all' ? dict.allSets : `Set ${notice.targetSet}`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{notice.title}</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{notice.message}</p>
                  </div>

                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono shrink-0 whitespace-nowrap">
                    {timeAgo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Class Timetable & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Classes & GPA Rule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule for Student Set */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {dict.tabTimetable} (Set {studentSet} Sahaja)
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('calendar')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center cursor-pointer"
              >
                {dict.tabCalendar} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {mySchedules.slice(0, 4).map((sch) => (
                <div
                  key={sch.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    sch.isRescheduled
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        sch.isRescheduled
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {sch.day.substring(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{sch.subject}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                          {sch.courseCode}
                        </span>
                        {sch.isRescheduled && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white">
                            Dijadual Semula
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>
                          {sch.startTime} - {sch.endTime}
                        </span>
                        <span>•</span>
                        <span>{sch.venue}</span>
                        <span>•</span>
                        <span>{sch.lecturerName}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Set {sch.setNumber}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Regulations Notice (ASASIpintar Foundation Rules) */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 dark:from-indigo-950/50 dark:to-blue-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-5 shadow-xs transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                  Syarat Rasmi Pengiraan PNGS Semester I (ASASIpintar)
                </h3>
                <p className="text-xs text-indigo-900 dark:text-indigo-300 mt-1 leading-relaxed">
                  Bagi Semester I, pengiraan PNGS Sains teras hanya mengambil kira <strong>2 subjek Sains terbaik</strong> (antara Biologi, Kimia, Fizik) bersama <strong>Statistik</strong> dan kursus wajib lain. Subjek sains ketiga yang terendah tidak merendahkan purata kelayakan perubatan/kejuruteraan anda.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('gpa')}
                    className="text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Buka Kalkulator PNGS Pintar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Deadlines & Quick AI Prompt */}
        <div className="space-y-6">
          {/* Deadlines Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{dict.tabTimetable}</h2>
              </div>
              <button
                onClick={() => setActiveTab('timetable')}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {myDeadlines.slice(0, 3).map((dl) => {
                const dueDate = new Date(dl.dueDate);
                return (
                  <div
                    key={dl.id}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 uppercase">
                        {dl.type}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                        {dueDate.toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{dl.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{dl.subject}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Academic Mentor Quick Action */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold tracking-wide text-indigo-200 uppercase">
                {dict.tabAiMentor}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Ada kekeliruan dengan formula Kimia I atau Fizik I? Dapatkan bimbingan segera berpandukan sukatan ASASIpintar UKM.
            </p>
            <button
              onClick={() => {
                if (onOpenAiWithPrompt) {
                  onOpenAiWithPrompt('Bantu saya faham konsep Le Chatelier dalam Kimia I.');
                } else {
                  setActiveTab('ai-assistant');
                }
              }}
              className="mt-4 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tanya AI Mentor Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
