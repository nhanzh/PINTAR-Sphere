import React from 'react';
import {
  UserProfile,
  ClassScheduleItem,
  DeadlineItem,
  StudentCourseGrade,
  StudentKokoRecord,
  ActiveTab,
  BroadcastNotice,
} from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { formatBroadcastDateTime, isWithin24Hours } from '../utils/dateUtils.ts';
import { calculateOfficialPngs } from '../utils/gradeCalculation.ts';
import { getLecturerForSetAndSubject } from '../utils/lecturerSetSync.ts';
import { getSubjectDisplayName } from '../utils/subjectNames.ts';
import { SUBJECTS } from '../data/mockData.ts';
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
  Lock,
  TrendingUp,
} from 'lucide-react';

interface StudentDashboardViewProps {
  user: UserProfile;
  schedules: ClassScheduleItem[];
  deadlines: DeadlineItem[];
  grades: StudentCourseGrade[];
  kokoRecords?: StudentKokoRecord[];
  broadcasts?: BroadcastNotice[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAiWithPrompt?: (prompt: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  user,
  schedules,
  deadlines,
  grades,
  kokoRecords = [],
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

  // Check for reschedule alerts (strictly expires after 24 hours)
  const rescheduleAlerts = mySchedules.filter(
    (s) => s.isRescheduled && s.rescheduleNotice && isWithin24Hours(s.rescheduleNotice.announcedAt)
  );

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

  // Filter grades for this student only
  const myGrades = grades.filter((g) => {
    if (!g.isPublished) return false;
    const emailMatch = g.studentEmail.toLowerCase() === user.email.toLowerCase();
    const matricMatch = Boolean(
      user.matricNumber &&
        (g.studentEmail.toLowerCase().includes(user.matricNumber.toLowerCase()) ||
          g.studentId?.toLowerCase().includes(user.matricNumber.toLowerCase()))
    );
    const nameMatch = Boolean(user.name && g.studentName?.toLowerCase() === user.name.toLowerCase());
    return emailMatch || matricMatch || nameMatch;
  });

  // Official UKM PNGS Calculation (Sem 1: 2 Kursus Sains Terbaik + Statistik = 10 Jam Kredit)
  const officialPngsResult = calculateOfficialPngs(myGrades);
  const displayGpa = officialPngsResult.pngs !== null 
    ? officialPngsResult.pngs 
    : (user.currentCgpa !== null && user.currentCgpa !== undefined ? user.currentCgpa : null);

  // Official UKM 10% Kokurikulum & Jati Diri Record
  const myKoko = kokoRecords.find((k) => {
    if (!k.isPublished) return false;
    const emailMatch = k.studentEmail.toLowerCase() === user.email.toLowerCase();
    const matricMatch = Boolean(
      user.matricNumber &&
        (k.studentEmail.toLowerCase().includes(user.matricNumber.toLowerCase()) ||
          k.studentId?.toLowerCase().includes(user.matricNumber.toLowerCase()))
    );
    const nameMatch = Boolean(user.name && k.studentName?.toLowerCase() === user.name.toLowerCase());
    return emailMatch || matricMatch || nameMatch;
  });
  const kokoScore10 = myKoko && myKoko.totalKoko10 !== null && myKoko.totalKoko10 !== undefined
    ? myKoko.totalKoko10
    : (myKoko && myKoko.totalScore !== null && myKoko.totalScore !== undefined
        ? Number((myKoko.totalScore / 10).toFixed(1))
        : (user.kokoMarks !== null && user.kokoMarks !== undefined ? Number((user.kokoMarks / 10).toFixed(1)) : null));
  const kokoBand = myKoko?.band || 'Band 1';
  const kokoGrade = myKoko?.grade || user.kokoGrade || 'A';

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
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[135px]">
              <div className="text-[11px] font-semibold text-indigo-200">
                {officialPngsResult.hasEnoughData ? 'PNGS Rasmi (10 Jam)' : dict.cgpaSemasa}
              </div>
              <div className="text-2xl font-black text-white mt-0.5">
                {displayGpa !== null ? displayGpa.toFixed(2) : '—'}
              </div>
              <div className="text-[10px] font-bold mt-0.5">
                {displayGpa !== null ? (
                  <span className="text-emerald-300">
                    {displayGpa >= 3.75 ? dict.deansList : 'Lulus Cemerlang'}
                  </span>
                ) : (
                  <span className="text-amber-300/90 font-medium">Menunggu Pensyarah</span>
                )}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[135px]">
              <div className="text-[11px] font-semibold text-indigo-200">Kokurikulum (10%)</div>
              <div className="text-2xl font-black text-white mt-0.5">
                {kokoScore10 !== null ? `${kokoScore10}/10` : '—'}
              </div>
              <div className="text-[10px] font-bold mt-0.5">
                {kokoScore10 !== null ? (
                  <span className="text-indigo-200">
                    Gred {kokoGrade} • {kokoBand}
                  </span>
                ) : (
                  <span className="text-amber-300/90 font-medium">Menunggu Pensyarah</span>
                )}
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
            {myBroadcasts.length} {dict.activeBroadcastsCount}
          </span>
        </div>

        {myBroadcasts.length === 0 ? (
          <div className="mt-4 p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Tiada Hebahan Terkini Fakulti
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Sebarang makluman penting, pertukaran dewan kuliah, atau notis penjadualan semula kelas oleh pensyarah akan dipaparkan secara langsung di sini.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {myBroadcasts.map((notice) => {
              const isUrgent = notice.priority === 'urgent';
              const isReschedule = notice.priority === 'reschedule';
              const dateTime = formatBroadcastDateTime(notice.createdAt, lang);

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
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="space-y-1.5 flex-1">
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
                          • {dict.targetSetPrefix}: {notice.targetSet === 'all' ? dict.allSets : `Set ${notice.targetSet}`}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{notice.title}</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{notice.message}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shrink-0 self-start">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{dateTime.fullDisplay}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Grid: Class Timetable & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Classes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Official Course Academic Progress Bars (Read-only for Students) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kemajuan Penilaian Kursus Akademik
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                    <Lock className="w-3 h-3" /> Paparan Sahaja
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('gpa')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center cursor-pointer shrink-0"
              >
                Kira PNGS <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {SUBJECTS.map((subj) => {
                const gradeRecord = myGrades.find((g) => g.courseCode === subj.code);
                const score = gradeRecord?.totalScore !== null && gradeRecord?.totalScore !== undefined ? gradeRecord.totalScore : null;
                const letter = gradeRecord?.letterGrade || null;
                const isEvaluated = score !== null;
                const assignedLecturer = getLecturerForSetAndSubject(studentSet, subj.code, subj.name);
                const displayName = getSubjectDisplayName(subj.code, lang);

                return (
                  <div
                    key={subj.code}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white">{displayName}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {subj.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {subj.creditHours} Jam Kredit
                        </span>
                      </div>
                      <div className="text-right">
                        {isEvaluated ? (
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            {score}% • Gred {letter}
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Sedang Dinilai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar (Non-editable) */}
                    <div className="w-full bg-slate-200/80 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 rounded-full ${
                          isEvaluated
                            ? score >= 80
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : score >= 65
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                        style={{ width: `${isEvaluated ? Math.min(100, Math.max(0, score)) : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {isEvaluated
                          ? `Dinilai oleh pensyarah: ${gradeRecord.updatedBy || assignedLecturer}`
                          : `Pensyarah kursus: ${assignedLecturer}`}
                      </span>
                      <span className="font-semibold">
                        {isEvaluated ? `${score}% / 100% Markah Diperoleh` : '0% / 100%'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kokurikulum & Jati Diri 10% Progress Widget (Read-only for Students) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kemajuan Markah Kokurikulum & Jati Diri (10%)
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pecahan: Pembangunan Jati Diri (7.0%) dan Aktiviti Kokurikulum (3.0%).
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                {kokoScore10 !== null ? `${kokoScore10} / 10.0%` : 'Belum Dinilai'}
              </span>
            </div>

            {/* Master Progress Bar */}
            <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-950 dark:text-amber-200">
                  Jumlah Keseluruhan Markah Kokurikulum
                </span>
                <span className="font-black text-amber-800 dark:text-amber-300">
                  {kokoScore10 !== null ? `${((kokoScore10 / 10) * 100).toFixed(0)}% Selesai` : '0%'}
                </span>
              </div>

              <div className="w-full bg-amber-200/60 dark:bg-amber-950/60 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${kokoScore10 !== null ? (kokoScore10 / 10) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-amber-900/80 dark:text-amber-300/80">
                <span>Tahap: {kokoBand} ({kokoGrade})</span>
                <span>{kokoScore10 !== null ? `${kokoScore10} / 10.0 Markah Penuh` : 'Menunggu input pensyarah'}</span>
              </div>
            </div>

            {/* Sub-Progress Bars: Jati Diri & Koko Components */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Jati Diri 7.0 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Pembangunan Jati Diri</span>
                  <span className="font-extrabold text-teal-600 dark:text-teal-400">
                    {myKoko?.jatiDiriScore !== null && myKoko?.jatiDiriScore !== undefined ? myKoko.jatiDiriScore : '—'} / 7.0
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-700"
                    style={{
                      width: `${
                        myKoko?.jatiDiriScore ? Math.min(100, (myKoko.jatiDiriScore / 7) * 100) : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-slate-400">Modul sahsiah, disiplin & kepimpinan UKM</div>
              </div>

              {/* Aktiviti Kokurikulum 3.0 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Aktiviti Kokurikulum</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {myKoko?.kokoActivitiesTotal !== null && myKoko?.kokoActivitiesTotal !== undefined
                      ? myKoko.kokoActivitiesTotal
                      : '—'} / 3.0
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                    style={{
                      width: `${
                        myKoko?.kokoActivitiesTotal ? Math.min(100, (myKoko.kokoActivitiesTotal / 3) * 100) : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-medium flex flex-wrap items-center justify-between gap-1 mt-1">
                  <span>Penyertaan: {(myKoko?.kokoParticipation ?? 0) >= 1.0 ? '✓ Maksima 1.00' : `Perlu ${(1.0 - (myKoko?.kokoParticipation ?? 0)).toFixed(2)} lagi`}</span>
                  <span>Pencapaian: {(myKoko?.kokoAchievement ?? 0) >= 1.0 ? '✓ Maksima 1.00' : `Perlu ${(1.0 - (myKoko?.kokoAchievement ?? 0)).toFixed(2)} lagi`}</span>
                  <span>Perjawatan: {(myKoko?.kokoPosition ?? 0) >= 1.0 ? '✓ Maksima 1.00' : `Perlu ${(1.0 - (myKoko?.kokoPosition ?? 0)).toFixed(2)} lagi`}</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Markah kokurikulum dan akademik dikunci untuk pelajar dan hanya boleh dikemas kini oleh pensyarah penilai.</span>
            </div>
          </div>

          {/* Today's Schedule for Student Set */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {(dict.todayScheduleOnlySet || 'Timetable (Set {set} Only)').replace('{set}', String(studentSet))}
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
              {mySchedules.length === 0 ? (
                <div className="p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tiada Jadual Kuliah Buat Masa Ini
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Jadual kuliah bagi Set {studentSet} belum dimuat naik oleh pensyarah atau pentadbir.
                  </p>
                </div>
              ) : (
                mySchedules.slice(0, 4).map((sch) => (
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
                              {dict.priorityReschedule}
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
                      {sch.setNumber === 'all' ? 'Kuliah Perdana' : `Set ${sch.setNumber}`}
                    </span>
                  </div>
                ))
              )}
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
                {dict.viewAll}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {myDeadlines.length === 0 ? (
                <div className="p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tiada Tarikh Akhir Ditetapkan
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Belum ada tugasan atau kuiz yang dimuat naik buat masa ini.
                  </p>
                </div>
              ) : (
                myDeadlines.slice(0, 3).map((dl) => {
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
                })
              )}
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
              {dict.aiMentorDesc}
            </p>
            <button
              onClick={() => {
                if (onOpenAiWithPrompt) {
                  onOpenAiWithPrompt('Bantu saya faham konsep Le Chatelier dalam Kimia I.');
                } else {
                  setActiveTab('ai-assistant');
                }
              }}
              className="mt-4 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{dict.askAiMentorNow}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
