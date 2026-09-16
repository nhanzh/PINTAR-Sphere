import React, { useState } from 'react';
import {
  UserProfile,
  ClassScheduleItem,
  DeadlineItem,
  SubmissionRecord,
  ActiveTab,
  BroadcastNotice,
} from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Upload,
  PlusCircle,
  Calculator,
  ChevronRight,
  ShieldCheck,
  Send,
  FileCheck,
  Bell,
  Radio,
  Building2,
} from 'lucide-react';

interface LecturerDashboardViewProps {
  user: UserProfile;
  schedules: ClassScheduleItem[];
  deadlines: DeadlineItem[];
  submissions: SubmissionRecord[];
  broadcasts?: BroadcastNotice[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenRescheduleModal?: () => void;
  onOpenUploadModal?: () => void;
  onOpenBroadcastModal?: () => void;
}

export const LecturerDashboardView: React.FC<LecturerDashboardViewProps> = ({
  user,
  schedules,
  deadlines,
  submissions,
  broadcasts = [],
  setActiveTab,
  onOpenRescheduleModal,
  onOpenUploadModal,
  onOpenBroadcastModal,
}) => {
  const { lang, dict } = useLanguage();
  const subjectName = user.taughtSubjectName || 'Chemistry I';
  const subjectCode = user.taughtSubjectCode || 'PNAP0133';

  // Filter deadlines created for this subject
  const myDeadlines = deadlines.filter(
    (d) =>
      d.subject.toLowerCase().includes(subjectName.toLowerCase()) ||
      d.courseCode === subjectCode
  );

  // Submissions count
  const totalSubmissions = submissions.length;
  const lateSubmissions = submissions.filter((s) => s.status === 'Late').length;

  return (
    <div className="space-y-6">
      {/* Lecturer Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-teal-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {dict.lecturerPortal}
              </span>
              <span className="text-xs text-slate-300">
                Pusat PERMATApintar Negara • ASASIpintar UKM
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
              {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
              Penyelaras Kursus <strong>{subjectName} ({subjectCode})</strong>. Mengurus bahan pengajaran, siaran hebahan terus, penjadualan kelas, dan kemasukan markah untuk kesemua 11 Set (~300 pelajar).
            </p>

            {/* Quick Actions Bar */}
            <div className="mt-5 flex flex-wrap gap-2.5">
              {/* Broadcast Dispatch Button (Like food delivery vendor sending order status) */}
              <button
                onClick={onOpenBroadcastModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/30"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{dict.broadcastNotice}</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenUploadModal) onOpenUploadModal();
                  else setActiveTab('resources');
                }}
                className="px-4 py-2 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-700" />
                Muat Naik Bahan Kuliah
              </button>

              <button
                onClick={() => {
                  if (onOpenRescheduleModal) onOpenRescheduleModal();
                  else setActiveTab('calendar');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 font-bold text-xs border border-emerald-400/30 transition-all flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                Jadual Semula Kelas
              </button>

              <button
                onClick={() => setActiveTab('gpa')}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 font-bold text-xs border border-emerald-400/30 transition-all flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-300" />
                Kemasukan Gred Pelajar
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <div className="text-[11px] font-semibold text-emerald-200">Jumlah Pelajar</div>
              <div className="text-2xl font-black text-white mt-0.5">300</div>
              <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">Merangkumi 11 Set</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <div className="text-[11px] font-semibold text-emerald-200">Tugasan Diterima</div>
              <div className="text-2xl font-black text-white mt-0.5">{totalSubmissions}</div>
              <div className="text-[10px] text-amber-300 font-semibold mt-0.5">
                {lateSubmissions} Lewat Dihantar
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Live Broadcast Dispatches Monitor */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{dict.recentBroadcasts}</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{dict.liveDispatchDesc}</p>
            </div>
          </div>
          <button
            onClick={onOpenBroadcastModal}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>+ Siarkan Hebahan Baru</span>
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {broadcasts.slice(0, 3).map((b) => (
            <div
              key={b.id}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      b.priority === 'urgent'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        : b.priority === 'reschedule'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {b.priority === 'urgent'
                      ? dict.priorityUrgent
                      : b.priority === 'reschedule'
                      ? dict.priorityReschedule
                      : dict.priorityInfo}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{b.title}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    • Sasaran: <strong>{b.targetSet === 'all' ? dict.allSets : `Set ${b.targetSet}`}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{b.message}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-400">
                  {new Date(b.createdAt).toLocaleDateString('en-GB')}{' '}
                  {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Disiarkan ke Pelajar</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Management Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Deadlines Tracking & Submissions Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assessments Created by Lecturer */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Penilaian & Tarikh Akhir ({subjectName})
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('timetable')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center cursor-pointer"
              >
                Audit Tugasan <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {myDeadlines.map((dl) => {
                const subCount = submissions.filter((s) => s.deadlineId === dl.id).length;
                const dueDate = new Date(dl.dueDate);
                return (
                  <div
                    key={dl.id}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            {dl.type}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{dl.title}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{dl.description}</p>
                        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                          <span>
                            Sasaran: <strong>{dl.targetSets.join(', ')}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Tarikh Akhir:{' '}
                            <strong>
                              {dueDate.toLocaleDateString('en-GB')}{' '}
                              {dueDate.toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          {subCount} Pelajar Hantar
                        </div>
                        <button
                          onClick={() => setActiveTab('timetable')}
                          className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 underline font-medium cursor-pointer"
                        >
                          Semak Fail
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Submissions Real-Time Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Log Penerimaan Tugasan Pelajar (Segerak Nyata)
                </h2>
              </div>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Penyelarasan Langsung
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-semibold">
                    <th className="pb-2">Nama & Emel Pelajar</th>
                    <th className="pb-2">Set</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Masa Dihantar</th>
                    <th className="pb-2">Fail / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {submissions.slice(0, 5).map((sub) => {
                    const subTime = new Date(sub.submittedAt);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                          <div>{sub.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {sub.studentEmail}
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-700 dark:text-slate-300 font-semibold">Set {sub.setNumber}</td>
                        <td className="py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.status === 'Submitted'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {subTime.toLocaleDateString('en-GB')}{' '}
                          {subTime.toLocaleTimeString('en-GB')}
                        </td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {sub.fileName || sub.note || 'Fail Disertakan'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Links & Roster */}
        <div className="space-y-6">
          {/* Quick Sets Navigation */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {dict.tabRoster} (11 Set)
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('students-roster')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer"
              >
                Buka Direktori
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Klik mana-mana set untuk melihat senarai penuh 300 pelajar ASASIpintar UKM:
            </p>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveTab('students-roster')}
                  className="py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Set {s}
                </button>
              ))}
            </div>
          </div>

          {/* Academic Governance Box */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase">
              <Building2 className="w-4 h-4" />
              <span>{dict.exclusiveNotice}</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Portal ini menghubungkan pensyarah dan pelajar kohort ASASIpintar UKM secara terus. Segala pengumuman, bahan kuliah, dan markah disegerakkan dalam pangkalan data masa nyata Firestore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
