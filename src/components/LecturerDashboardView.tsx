import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  ClassScheduleItem,
  DeadlineItem,
  SubmissionRecord,
  ActiveTab,
  BroadcastNotice,
  StudentCourseGrade,
  StudentKokoRecord,
  KokoSubmissionItem,
} from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { LecturerGradeManager } from './LecturerGradeManager.tsx';
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
  Trash2,
  HardDrive,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Download,
  Award,
  Trophy,
  Check,
  FileText,
  MapPin,
} from 'lucide-react';
import { ResourceItem } from '../types.ts';
import { dataService } from '../services/dataService.ts';
import { MaterialUploadModal } from './MaterialUploadModal.tsx';
import { calculateSuggestedKokoScore } from '../utils/kokoScoring.ts';
import { openOrDownloadSubmissionFile } from '../utils/fileUtils.ts';

interface LecturerDashboardViewProps {
  user: UserProfile;
  schedules: ClassScheduleItem[];
  deadlines: DeadlineItem[];
  submissions: SubmissionRecord[];
  broadcasts?: BroadcastNotice[];
  grades?: StudentCourseGrade[];
  kokoRecords?: StudentKokoRecord[];
  resources?: ResourceItem[];
  onSaveGrade?: (grade: StudentCourseGrade) => Promise<void>;
  onSaveKoko?: (record: StudentKokoRecord) => Promise<void>;
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
  grades = [],
  kokoRecords = [],
  resources = [],
  onSaveGrade,
  onSaveKoko,
  setActiveTab,
  onOpenRescheduleModal,
  onOpenUploadModal,
  onOpenBroadcastModal,
}) => {
  const { lang, dict } = useLanguage();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<{ id: string; title: string } | null>(null);
  const [kokoSubmissions, setKokoSubmissions] = useState<KokoSubmissionItem[]>([]);
  const [kokoSetFilter, setKokoSetFilter] = useState<string>('all');
  const [reviewScoreInputs, setReviewScoreInputs] = useState<Record<string, number>>({});
  const [isReviewingKoko, setIsReviewingKoko] = useState<string | null>(null);
  const [kokoActionToast, setKokoActionToast] = useState<string | null>(null);
  const [deadlineToDelete, setDeadlineToDelete] = useState<DeadlineItem | null>(null);
  const [submissionToDelete, setSubmissionToDelete] = useState<SubmissionRecord | null>(null);

  const subjectName = user.taughtSubjectName || 'Chemistry I';
  const subjectCode = user.taughtSubjectCode || 'PNAP0133';

  // Real-time subscribe to Koko Submissions
  useEffect(() => {
    const unsub = dataService.subscribeKokoSubmissions((items) => {
      setKokoSubmissions(items);
    });
    return () => unsub();
  }, []);

  const pendingKokoList = kokoSubmissions.filter((s) => {
    if (s.status !== 'pending') return false;
    if (kokoSetFilter !== 'all' && s.setNumber !== Number(kokoSetFilter)) return false;
    return true;
  });

  const handleApproveKoko = async (sub: KokoSubmissionItem) => {
    const matrixScore = calculateSuggestedKokoScore(sub.category, sub.level, sub.subCategory);
    const scoreToAward = reviewScoreInputs[sub.id] !== undefined ? reviewScoreInputs[sub.id] : matrixScore;

    setIsReviewingKoko(sub.id);
    await dataService.reviewKokoSubmission(sub.id, 'approved', scoreToAward, user.name, sub.subCategory);
    setIsReviewingKoko(null);

    setKokoActionToast(`Permohonan "${sub.activityName}" bagi ${sub.studentName} berjaya diluluskan (+${scoreToAward.toFixed(3)} markah)!`);
    setTimeout(() => setKokoActionToast(null), 5000);
  };

  const handleRejectKoko = async (sub: KokoSubmissionItem) => {
    if (window.confirm(`Adakah anda pasti mahu menolak permohonan kokurikulum bagi ${sub.studentName}?`)) {
      setIsReviewingKoko(sub.id);
      await dataService.reviewKokoSubmission(sub.id, 'rejected', 0, user.name);
      setIsReviewingKoko(null);
    }
  };

  // Filter resources uploaded by this lecturer or for their subject
  const myResources = resources.filter(
    (r) =>
      r.courseCode === subjectCode ||
      r.subject.toLowerCase().includes(subjectName.toLowerCase()) ||
      r.uploaderEmail === user.email ||
      user.email === 'asasipintarhub@gmail.com'
  );

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    await dataService.deleteResource(materialToDelete.id);
    setMaterialToDelete(null);
  };

  const handleOpenMaterial = (res: ResourceItem) => {
    if (res.fileUrl && res.fileUrl !== '#' && (res.fileUrl.startsWith('http://') || res.fileUrl.startsWith('https://'))) {
      window.open(res.fileUrl, '_blank', 'noopener,noreferrer');
    } else if (res.fileUrl && res.fileUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = res.fileUrl;
      a.download = res.title || 'bahan-pembelajaran';
      a.click();
    } else {
      alert(`Membuka bahan pembelajaran: "${res.title}"`);
    }
  };

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
              {(dict.lecturerWelcomeDesc || 'Lecturer portal for {subject}.').replace('{subject}', `${subjectName} (${subjectCode})`)}
            </p>

            {/* Quick Actions Bar */}
            <div className="mt-5 flex flex-wrap gap-2.5">
              {/* Broadcast Dispatch Button (Lecturer can dispatch alerts or rescheduling announcements directly to students) */}
              <button
                onClick={onOpenBroadcastModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/30 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{dict.broadcastNotice}</span>
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                <span>+ Tambah Bahan / Add File</span>
              </button>

              <button
                onClick={() => setActiveTab('gpa')}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 font-bold text-xs border border-emerald-400/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-300" />
                <span>Kemas Kini Markah Pelajar</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="shrink-0">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[140px]">
              <div className="text-[11px] font-semibold text-emerald-200">{dict.recentSubmissions}</div>
              <div className="text-2xl font-black text-white mt-0.5">{totalSubmissions}</div>
              <div className="text-[10px] text-amber-300 font-semibold mt-0.5">
                {lateSubmissions} {dict.lateStatus}
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
            <span>{dict.newBroadcastBtnText}</span>
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {broadcasts.slice(0, 5).map((b) => (
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
                    • {dict.targetSetPrefix}: <strong>{b.targetSet === 'all' ? dict.allSets : `Set ${b.targetSet}`}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{b.message}</p>
              </div>

              <div className="text-right shrink-0 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-400 block">
                  {new Date(b.createdAt).toLocaleDateString('en-GB')}{' '}
                  {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex items-center justify-end gap-2">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{dict.dispatchedToStudents}</div>
                  <button
                    onClick={async () => {
                      if (window.confirm('Adakah anda pasti untuk membatalkan hebahan ini?')) {
                        await dataService.cancelBroadcast(b.id);
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-[10px] font-bold transition-colors cursor-pointer"
                    title="Batal Hebahan Ini"
                  >
                    Batal Siaran
                  </button>
                </div>
              </div>
            </div>
          ))}
          {broadcasts.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              Tiada siaran hebahan aktif buat masa ini. Hebahan akan luput secara automatik selepas 24 jam.
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Management Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Deadlines Tracking & Submissions Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-Time Student Co-Curricular Verification Cards (Lecturer Review) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-300/80 dark:border-amber-800/80 p-5 shadow-xs transition-colors space-y-4">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Award className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Permohonan Semakan Aktiviti Kokurikulum Pelajar</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-[11px] font-extrabold">
                      {pendingKokoList.length} Menunggu
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Semak butiran penyertaan/jawatan yang dihantar oleh pelajar dan berikan markah pengesahan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={kokoSetFilter}
                  onChange={(e) => setKokoSetFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Semua Set (1-11)</option>
                  {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={String(s)}>Set {s}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setActiveTab('koko')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>Portal Koko Penuh</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Toast Feedback */}
            {kokoActionToast && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{kokoActionToast}</span>
                </div>
                <button onClick={() => setKokoActionToast(null)} className="underline cursor-pointer">Tutup</button>
              </div>
            )}

            {/* List of Pending Koko Submissions */}
            {pendingKokoList.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5 bg-slate-50/50 dark:bg-slate-800/30">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tiada Permohonan Semakan Kokurikulum Tertunggak
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Semua permohonan penyertaan/jawatan kokurikulum daripada pelajar telah disemak.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingKokoList.map((sub) => {
                  const matrixScore = calculateSuggestedKokoScore(sub.category, sub.level, sub.subCategory);
                  const currentScore = reviewScoreInputs[sub.id] !== undefined ? reviewScoreInputs[sub.id] : matrixScore;

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-white dark:hover:bg-slate-800 transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-100 dark:border-amber-900/40">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">{sub.studentName}</span>
                          <span className="font-mono text-[11px] text-slate-500">({sub.matricNumber})</span>
                          <span className="px-2 py-0.2 rounded bg-blue-100 text-blue-900 text-[10px] font-bold">Set {sub.setNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-950">{sub.categoryName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 capitalize">{sub.levelName}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold block">Aktiviti / Jawatan:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{sub.activityName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold block">Masa &amp; Tempat:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {new Date(sub.startDateTime).toLocaleDateString('ms-MY')} @ {sub.venue}
                          </span>
                        </div>
                        {sub.certificateFileUrl && (
                          <div className="sm:col-span-2">
                            <a
                              href={sub.certificateFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{sub.certificateFileName || 'Buka Sijil Penyertaan Pelajar'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Approval & Score Selector */}
                      <div className="pt-2 border-t border-amber-100 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Syor Markah:</span>
                          <button
                            type="button"
                            onClick={() => setReviewScoreInputs((prev) => ({ ...prev, [sub.id]: matrixScore }))}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                              currentScore === matrixScore
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border border-amber-300 text-amber-900'
                            }`}
                          >
                            +{matrixScore.toFixed(3)}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            disabled={isReviewingKoko === sub.id}
                            onClick={() => handleRejectKoko(sub)}
                            className="px-3 py-1 rounded-xl border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-50 cursor-pointer"
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            disabled={isReviewingKoko === sub.id}
                            onClick={() => handleApproveKoko(sub)}
                            className="px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Luluskan (+{currentScore.toFixed(3)})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Course Learning Materials & Files Manager (Lecturer Dashboard) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Bahan Pembelajaran &amp; Dokumen Kursus</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                      {myResources.length} Bahan
                    </span>
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Bahan / Add File</span>
              </button>
            </div>

            {/* List of learning materials */}
            {myResources.length > 0 ? (
              <div className="mt-4 space-y-3">
                {myResources.map((res) => {
                  const isTargetAll = res.targetSets.includes('all');
                  return (
                    <div
                      key={res.id}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            {res.courseCode}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {res.category.replace('_', ' ')}
                          </span>
                          {res.sourceType === 'drive' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              Google Drive
                            </span>
                          )}
                          {res.sourceType === 'photo' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Foto
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            • Sasaran: {isTargetAll ? 'Semua 11 Set' : res.targetSets.join(', ')}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {res.title}
                        </h3>
                        {res.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {res.description}
                          </p>
                        )}
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          Dimuat naik pada {res.uploadedDate} oleh {res.uploadedBy}
                        </div>
                      </div>

                      {/* Action buttons: Buka & Padam */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenMaterial(res)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-400 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          {res.sourceType === 'drive' ? (
                            <>
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Drive</span>
                            </>
                          ) : res.sourceType === 'photo' ? (
                            <>
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Lihat Foto</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Buka Fail</span>
                            </>
                          )}
                        </button>

                        {/* Delete button: strictly ONLY FOR LECTURER DASHBOARD */}
                        <button
                          onClick={() => setMaterialToDelete({ id: res.id, title: res.title })}
                          className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                          title="Hapus Bahan Pembelajaran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada bahan pembelajaran yang dimuat naik untuk kursus ini.
                </p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Bahan / Add File Sekarang</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Assessments Created by Lecturer */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {dict.assessmentsTitle} ({subjectName})
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('timetable')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center cursor-pointer"
              >
                {dict.auditCoursework} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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
                            {dict.targetSetPrefix}: <strong>{dl.targetSets.join(', ')}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            {dict.thDate}:{' '}
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

                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          {(dict.studentsSubmittedCount || '{count} Students Submitted').replace('{count}', String(subCount))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveTab('timetable')}
                            className="text-[11px] text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 underline font-medium cursor-pointer"
                          >
                            {dict.inspectFiles}
                          </button>
                          <button
                            onClick={() => setDeadlineToDelete(dl)}
                            className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                            title="Padam Tugasan Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                  {dict.submissionsLogTitle}
                </h2>
              </div>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {dict.liveSyncBadge}
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-semibold">
                    <th className="pb-2">{dict.thStudentNameEmail}</th>
                    <th className="pb-2">{dict.thSet}</th>
                    <th className="pb-2">{dict.thStatus}</th>
                    <th className="pb-2">{dict.thDate}</th>
                    <th className="pb-2">{dict.thFileNote}</th>
                    <th className="pb-2 text-right">Fail / Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 dark:text-slate-500 italic">
                        Tiada penyerahan tugasan pelajar buat masa ini.
                      </td>
                    </tr>
                  ) : (
                    submissions.slice(0, 10).map((sub) => {
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
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openOrDownloadSubmissionFile(sub)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200/80 dark:border-indigo-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                <span>Buka / Muat Turun</span>
                              </button>
                              <button
                                onClick={() => setSubmissionToDelete(sub)}
                                className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                                title="Padam Log Penyerahan Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
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
                {dict.openDirectoryBtn}
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {dict.clickAnySetDesc}
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

      {/* Lecturer Upload Modal */}
      <MaterialUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        user={user}
      />

      {/* Confirmation Modal for Deleting Material (No window.confirm, safe in iframe) */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Padamkan Bahan?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Adakah anda pasti mahu memadamkan "{materialToDelete.title}"?
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteMaterial}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Ya, Padamkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Deadline */}
      {deadlineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Padam Tugasan Ini?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Adakah anda pasti mahu memadam tugasan "{deadlineToDelete.title}"? Rekod tugasan akan dipadam daripada kalendar semua pelajar.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeadlineToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await dataService.deleteDeadline(deadlineToDelete.id);
                  setDeadlineToDelete(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Ya, Padam Tugasan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Student Submission Log */}
      {submissionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Padam Rekod Penyerahan?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Adakah anda pasti mahu memadam rekod penyerahan daripada {submissionToDelete.studentName} ({submissionToDelete.studentEmail})?
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSubmissionToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await dataService.deleteSubmission(
                    submissionToDelete.id,
                    submissionToDelete.deadlineId,
                    submissionToDelete.studentEmail
                  );
                  setSubmissionToDelete(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Ya, Padam Penyerahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
