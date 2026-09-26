import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  StudentKokoRecord,
  KokoSubmissionItem,
  KokoCategory,
  KokoLevel,
} from '../types.ts';
import { dataService } from '../services/dataService.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import {
  JATI_DIRI_SCALE,
  KOKO_ACHIEVEMENT_OPTIONS,
  KOKO_POSITION_OPTIONS,
  KokoAchievementLevel,
  KokoPositionRole,
  calculateSuggestedKokoScore,
} from '../utils/kokoScoring.ts';
import {
  Award,
  Shield,
  Trophy,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  X,
  UploadCloud,
  FileText,
  ExternalLink,
  Check,
  AlertCircle,
  Calendar,
  MapPin,
  Building,
  RotateCcw,
  Trash2,
  Eye,
  XCircle,
  Filter,
} from 'lucide-react';

interface KokoMarksViewProps {
  user: UserProfile;
  kokoRecords?: StudentKokoRecord[];
  onOpenGradeManager?: () => void;
  onRefreshData?: () => void;
}

export const KokoMarksView: React.FC<KokoMarksViewProps> = ({
  user,
  kokoRecords = [],
  onOpenGradeManager,
  onRefreshData,
}) => {
  const { lang } = useLanguage();
  const isStudent = user.role === 'student';

  // Submissions state
  const [submissions, setSubmissions] = useState<KokoSubmissionItem[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'rejected' | 'review' | 'jati_diri'>(
    isStudent ? 'approved' : 'review'
  );
  const [lecturerSetFilter, setLecturerSetFilter] = useState<string>('all');

  // Form State for Student
  const [category, setCategory] = useState<KokoCategory>('A');
  const [activityName, setActivityName] = useState('');
  const [achievementLevel, setAchievementLevel] = useState<KokoAchievementLevel>('emas');
  const [positionRole, setPositionRole] = useState<KokoPositionRole>('presiden');
  const [organizationName, setOrganizationName] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [level, setLevel] = useState<KokoLevel>('pusat');
  const [venue, setVenue] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [certificateFile, setCertificateFile] = useState<{ name: string; size: string; dataUrl: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Review state for Lecturer
  const [reviewScoreInputs, setReviewScoreInputs] = useState<Record<string, number>>({});
  const [isReviewing, setIsReviewing] = useState<string | null>(null);

  // Rejection Reason Modal
  const [rejectingSub, setRejectingSub] = useState<KokoSubmissionItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Certificate Viewer Modal
  const [viewingCertificate, setViewingCertificate] = useState<{ dataUrl: string; fileName: string } | null>(null);

  // Jati Diri management state for Lecturer
  const [selectedJatiDiriGradeMap, setSelectedJatiDiriGradeMap] = useState<Record<string, string>>({});
  const [isSavingJatiDiri, setIsSavingJatiDiri] = useState(false);

  // Confirmation Modals State (Replacing window.confirm for iframe stability)
  const [subToDelete, setSubToDelete] = useState<KokoSubmissionItem | null>(null);
  const [jatiDiriToReset, setJatiDiriToReset] = useState<{ email: string; name: string } | null>(null);
  const [isResetAllJatiDiriOpen, setIsResetAllJatiDiriOpen] = useState(false);

  // Subscribe to real-time Koko submissions
  useEffect(() => {
    const unsub = dataService.subscribeKokoSubmissions((items) => {
      setSubmissions(items);
    });
    return () => unsub();
  }, []);

  // Find student's published koko record
  const myKoko = kokoRecords.find(
    (k) => k.studentEmail.toLowerCase() === user.email.toLowerCase() && k.isPublished
  );

  const hasScore10 = myKoko && myKoko.totalKoko10 !== null && myKoko.totalKoko10 !== undefined;
  const kokoScore10 = hasScore10
    ? myKoko.totalKoko10
    : myKoko && myKoko.totalScore !== null && myKoko.totalScore !== undefined
    ? Number((myKoko.totalScore / 10).toFixed(2))
    : user.kokoMarks !== null && user.kokoMarks !== undefined
    ? Number((user.kokoMarks / 10).toFixed(2))
    : null;

  const kokoGrade = myKoko?.grade || user.kokoGrade || (kokoScore10 && kokoScore10 >= 8.0 ? 'A' : 'A-');
  const kokoBand = myKoko?.band || (kokoScore10 && kokoScore10 >= 8.0 ? 'Band 1' : 'Band 2');

  const jatiDiri = myKoko?.jatiDiriScore ?? null;
  const kokoActivitiesTotal =
    myKoko?.kokoActivitiesTotal ??
    (hasScore10 ? Number(Math.max(0, (kokoScore10 || 0) - (jatiDiri || 0)).toFixed(2)) : null);

  // Filtered submissions for student
  const studentApprovedSubmissions = submissions.filter(
    (s) => s.studentEmail.toLowerCase() === user.email.toLowerCase() && s.status === 'approved'
  );

  const studentPendingSubmissions = submissions.filter(
    (s) => s.studentEmail.toLowerCase() === user.email.toLowerCase() && s.status === 'pending'
  );

  const studentRejectedSubmissions = submissions.filter(
    (s) => s.studentEmail.toLowerCase() === user.email.toLowerCase() && s.status === 'rejected'
  );

  // Calculate student category scores (max 1.00 each)
  const catAScore = Math.min(
    1.0,
    Math.round(
      studentApprovedSubmissions
        .filter((s) => s.category === 'A')
        .reduce((sum, s) => sum + (s.awardedScore || 0), 0) * 1000
    ) / 1000
  );

  const catBScore = Math.min(
    1.0,
    Math.round(
      studentApprovedSubmissions
        .filter((s) => s.category === 'B')
        .reduce((sum, s) => sum + (s.awardedScore || 0), 0) * 1000
    ) / 1000
  );

  const catCScore = Math.min(
    1.0,
    Math.round(
      studentApprovedSubmissions
        .filter((s) => s.category === 'C')
        .reduce((sum, s) => sum + (s.awardedScore || 0), 0) * 1000
    ) / 1000
  );

  // Filtered roster for lecturer
  const studentRoster = dataService.getStudentRoster();
  const filteredStudentRoster = studentRoster.filter(
    (st) => lecturerSetFilter === 'all' || st.setNumber === Number(lecturerSetFilter)
  );

  // Filtered submissions for lecturer review
  const lecturerPendingSubmissions = submissions.filter((s) => {
    if (s.status !== 'pending') return false;
    if (lecturerSetFilter !== 'all' && s.setNumber !== Number(lecturerSetFilter)) return false;
    return true;
  });

  const lecturerApprovedSubmissions = submissions.filter((s) => {
    if (s.status !== 'approved') return false;
    if (lecturerSetFilter !== 'all' && s.setNumber !== Number(lecturerSetFilter)) return false;
    return true;
  });

  // Calculate dynamic suggested score for student submission form preview
  const currentFormSuggestedScore = calculateSuggestedKokoScore(
    category,
    level,
    category === 'B' ? achievementLevel : category === 'C' ? positionRole : undefined
  );

  // Certificate Helper: Converts base64 to Blob URL for clean opening in new tab without about:blank
  const openCertificateInNewWindow = (dataUrl?: string, fileName?: string) => {
    if (!dataUrl) return;

    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('blob:')) {
      window.open(dataUrl, '_blank');
      return;
    }

    try {
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);

      const newWin = window.open(blobUrl, '_blank');
      if (!newWin) {
        setViewingCertificate({ dataUrl: blobUrl, fileName: fileName || 'sijil_lampiran' });
      }
    } catch (err) {
      console.error('Failed to convert certificate data URL:', err);
      setViewingCertificate({ dataUrl, fileName: fileName || 'sijil_lampiran' });
    }
  };

  const handleCertificatePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
    const reader = new FileReader();
    reader.onload = () => {
      setCertificateFile({
        name: file.name,
        size: sizeStr,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleStudentSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalActivityName = activityName.trim();
    if (category === 'C') {
      const posObj = KOKO_POSITION_OPTIONS.find((p) => p.id === positionRole);
      const posLabel = posObj ? posObj.short : positionRole;
      finalActivityName = organizationName.trim()
        ? `${posLabel} - ${organizationName.trim()}`
        : `${posLabel} (${level.toUpperCase()})`;
    }

    if (!finalActivityName || !startDateTime || !endDateTime || !venue.trim()) {
      setStatusNotice({ type: 'error', message: 'Sila lengkapkan semua maklumat aktiviti yang wajib.' });
      return;
    }

    setIsSubmitting(true);
    const categoryName =
      category === 'A'
        ? 'Kategori A: Penyertaan'
        : category === 'B'
        ? 'Kategori B: Pencapaian'
        : 'Kategori C: Perjawatan';

    const levelNameMap: Record<KokoLevel, string> = {
      pusat: 'Pusat PERMATApintar / Kolej',
      universiti: 'Universiti (UKM)',
      kebangsaan: 'Kebangsaan (National)',
      antarabangsa: 'Antarabangsa (International)',
    };

    const subCategory = category === 'B' ? achievementLevel : category === 'C' ? positionRole : undefined;

    await dataService.submitKokoActivity({
      studentId: user.matricNumber || 'AP05710',
      studentName: user.name,
      studentEmail: user.email,
      matricNumber: user.matricNumber || 'AP05710',
      setNumber: user.setNumber || 3,
      category,
      categoryName,
      subCategory,
      activityName: finalActivityName,
      startDateTime,
      endDateTime,
      level,
      levelName: levelNameMap[level],
      venue: venue.trim(),
      organizer: organizer.trim() || undefined,
      certificateFileName: certificateFile?.name,
      certificateFileUrl: certificateFile?.dataUrl,
    });

    setIsSubmitting(false);
    setIsSubmitModalOpen(false);
    setActivityName('');
    setOrganizationName('');
    setStartDateTime('');
    setEndDateTime('');
    setVenue('');
    setOrganizer('');
    setCertificateFile(null);
    setActiveTab('pending');
    setStatusNotice({
      type: 'success',
      message: 'Penyertaan kokurikulum berjaya dihantar untuk semakan pensyarah penilai!',
    });

    setTimeout(() => setStatusNotice(null), 6000);
    if (onRefreshData) onRefreshData();
  };

  const handleLecturerApprove = async (sub: KokoSubmissionItem) => {
    const suggestedScore = calculateSuggestedKokoScore(sub.category, sub.level, sub.subCategory);

    const awardedScore = reviewScoreInputs[sub.id] !== undefined ? reviewScoreInputs[sub.id] : suggestedScore;

    setIsReviewing(sub.id);
    await dataService.reviewKokoSubmission(sub.id, 'approved', awardedScore, user.name, sub.subCategory);
    setIsReviewing(null);

    setStatusNotice({
      type: 'success',
      message: `Aktiviti "${sub.activityName}" bagi ${sub.studentName} (Set ${sub.setNumber}) berjaya diluluskan (+${awardedScore.toFixed(3)} markah disegerak ke profil pelajar)!`,
    });
    setTimeout(() => setStatusNotice(null), 5000);
    if (onRefreshData) onRefreshData();
  };

  const handleOpenRejectModal = (sub: KokoSubmissionItem) => {
    setRejectingSub(sub);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingSub) return;
    const finalReason = rejectionReasonInput.trim() || 'Maklumat atau sijil lampiran tidak memenuhi kriteria.';

    setIsReviewing(rejectingSub.id);
    await dataService.reviewKokoSubmission(
      rejectingSub.id,
      'rejected',
      0,
      user.name,
      rejectingSub.subCategory,
      finalReason
    );
    setIsReviewing(null);
    setRejectingSub(null);
    setRejectionReasonInput('');

    setStatusNotice({
      type: 'error',
      message: `Permohonan "${rejectingSub.activityName}" telah ditolak dengan sebab: "${finalReason}"`,
    });
    setTimeout(() => setStatusNotice(null), 5000);
    if (onRefreshData) onRefreshData();
  };

  const confirmDeleteStudentSubmission = async () => {
    if (!subToDelete) return;
    await dataService.deleteKokoSubmission(subToDelete.id);
    setStatusNotice({ type: 'success', message: 'Permohonan aktiviti berjaya dipadam secara kekal!' });
    setSubToDelete(null);
    setTimeout(() => setStatusNotice(null), 4000);
    if (onRefreshData) onRefreshData();
  };

  const handleSaveJatiDiriSingle = async (studentEmail: string, studentName: string) => {
    const targetGrade = selectedJatiDiriGradeMap[studentEmail];
    if (!targetGrade || targetGrade === '-') {
      setStatusNotice({ type: 'error', message: `Sila pilih gred bagi ${studentName} terlebih dahulu sebelum menyimpan.` });
      return;
    }
    const gradeObj = JATI_DIRI_SCALE.find((g) => g.grade === targetGrade) || JATI_DIRI_SCALE[0];
    setIsSavingJatiDiri(true);

    const existing = kokoRecords.find((k) => k.studentEmail.toLowerCase() === studentEmail.toLowerCase());
    const st = studentRoster.find((s) => s.email.toLowerCase() === studentEmail.toLowerCase());

    const part = existing?.kokoParticipation ?? 0;
    const ach = existing?.kokoAchievement ?? 0;
    const pos = existing?.kokoPosition ?? 0;
    const kokoActivitiesTotal = Math.min(3.0, Math.round((part + ach + pos) * 1000) / 1000);
    const totalKoko10 = Math.min(10.0, Math.round((gradeObj.score + kokoActivitiesTotal) * 1000) / 1000);

    const newRec: StudentKokoRecord = {
      id: existing ? existing.id : `koko-${Date.now()}-${(st?.matricNumber || 'ap').toLowerCase()}`,
      studentEmail,
      studentName: st?.name || existing?.studentName || studentName,
      matricNumber: st?.matricNumber || existing?.matricNumber || 'AP05710',
      setNumber: st?.setNumber || existing?.setNumber || 3,
      jatiDiriScore: gradeObj.score,
      kokoParticipation: part,
      kokoAchievement: ach,
      kokoPosition: pos,
      kokoActivitiesTotal,
      totalKoko10,
      totalScore: Number((totalKoko10 * 10).toFixed(1)),
      grade: totalKoko10 >= 8.0 ? 'A' : totalKoko10 >= 7.0 ? 'A-' : totalKoko10 >= 6.0 ? 'B+' : 'B',
      band: totalKoko10 >= 8.0 ? 'Band 1' : 'Band 2',
      isPublished: true,
      updatedBy: user.name,
      updatedAt: new Date().toISOString(),
    };

    await dataService.saveStudentKoko(newRec);
    setIsSavingJatiDiri(false);
    setStatusNotice({
      type: 'success',
      message: `Markah Pembangunan Jati Diri (${gradeObj.grade} - ${gradeObj.score.toFixed(2)} / 7.00%) bagi ${studentName} berjaya disimpan!`,
    });
    setTimeout(() => setStatusNotice(null), 4000);
    if (onRefreshData) onRefreshData();
  };

  const confirmResetIndividualJatiDiri = async () => {
    if (!jatiDiriToReset) return;
    const { email, name } = jatiDiriToReset;
    setIsSavingJatiDiri(true);
    await dataService.resetJatiDiriScore(email, user.name);
    setIsSavingJatiDiri(false);
    setStatusNotice({
      type: 'success',
      message: `Markah Jati Diri bagi ${name} telah berjaya di-reset!`,
    });
    setJatiDiriToReset(null);
    setTimeout(() => setStatusNotice(null), 4000);
    if (onRefreshData) onRefreshData();
  };

  const confirmResetAllJatiDiri = async () => {
    const setLabel = lecturerSetFilter === 'all' ? 'semua set (1 - 11)' : `Set ${lecturerSetFilter}`;
    setIsSavingJatiDiri(true);
    const targetSet = lecturerSetFilter === 'all' ? undefined : Number(lecturerSetFilter);
    await dataService.resetAllJatiDiriScores(user.name, targetSet);
    setIsSavingJatiDiri(false);
    setStatusNotice({
      type: 'success',
      message: `Markah Jati Diri bagi semua pelajar (${setLabel}) telah berjaya di-reset sepenuhnya!`,
    });
    setIsResetAllJatiDiriOpen(false);
    setTimeout(() => setStatusNotice(null), 4000);
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {statusNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-sm animate-in fade-in slide-in-from-top-2 ${
            statusNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-semibold">{statusNotice.message}</p>
          </div>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-xs font-bold underline ml-3 shrink-0 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-200/60 dark:border-amber-800">
              Format Rasmi 10% Kokurikulum &amp; Jati Diri
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isStudent
                ? `Pelajar: ${user.name} (Set ${user.setNumber})`
                : 'Portal Pensyarah Penilai Kokurikulum'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            Markah Kokurikulum &amp; Pembangunan Jati Diri
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Komponen markah 10% merangkumi Bahagian 1: Pembangunan Jati Diri (7%) dan Bahagian 2: Aktiviti Kokurikulum (3%).
          </p>
        </div>

        {/* Action Button for Student */}
        {isStudent && (
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Tambah Koko / Hantar Penyertaan</span>
          </button>
        )}

        {/* Total Score Badge (For Student) */}
        {isStudent && (
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                Jumlah Markah Koko (10%)
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                {kokoScore10 !== null ? `${kokoScore10} / 10.0%` : '—'}
              </div>
            </div>
            <div className="pl-3 border-l border-slate-100 dark:border-slate-800 text-right">
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {kokoScore10 !== null ? `Gred ${kokoGrade}` : 'Belum Dinilai'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                {kokoScore10 !== null ? kokoBand : 'Menunggu Penilaian'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2-Part Breakdown: PROGRESS BARS FOR STUDENTS / DETAILED SCORING FOR LECTURER */}
      {isStudent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Part 1: Pembangunan Jati Diri & Kebangsaan (Progress Bar Only) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Bahagian 1: Pembangunan Jati Diri &amp; Kebangsaan
                  </h3>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    Penilaian Sahsiah, Disiplin &amp; Nilai Kebangsaan
                  </span>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                  jatiDiri !== null
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
              >
                {jatiDiri !== null ? '✓ Selesai Dinilai' : '⏳ Dalam Proses Penilaian'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Kemajuan Penilaian Jati Diri</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {jatiDiri !== null ? '100% Lengkap' : 'Menunggu Semakan Pensyarah'}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    jatiDiri !== null
                      ? 'bg-gradient-to-r from-indigo-500 to-emerald-500 w-full'
                      : 'bg-gradient-to-r from-amber-400 to-amber-500 w-1/4 animate-pulse'
                  }`}
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Komponen jati diri dinilai terus oleh pensyarah penilai merangkumi penglibatan program kolej, adab, kehadiran serta jati diri warga ASASIpintar.
            </p>
          </div>

          {/* Part 2: Aktiviti Kokurikulum (Progress Bars for Categories A, B, C) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Trophy className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Bahagian 2: Aktiviti Kokurikulum
                  </h3>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    Penyertaan • Pencapaian • Perjawatan (Maks 1.00 setiap kategori)
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {studentApprovedSubmissions.length} Aktiviti Diluluskan
              </span>
            </div>

            {/* Category Progress Bars showing how much needed to reach 1.00 max mark */}
            <div className="space-y-3">
              {/* Category A: Penyertaan */}
              <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-900 dark:text-amber-300">
                    Kategori A: Penyertaan / Penglibatan (Maks 1.00)
                  </span>
                  <span className="text-amber-700 dark:text-amber-400 font-extrabold">
                    {catAScore >= 1.0 ? '✓ Capai Maksima 1.00' : `Telah Capai ${catAScore.toFixed(2)} / 1.00`}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                    style={{ width: `${(catAScore / 1.0) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  {catAScore >= 1.0
                    ? '✓ Tahniah! Markah maksima 1.00 telah dicapai sepenuhnya.'
                    : `Perlu ${(1.0 - catAScore).toFixed(2)} mata lagi untuk mencapai maksima 1.00.`}
                </div>
              </div>

              {/* Category B: Pencapaian */}
              <div className="space-y-1.5 p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-orange-900 dark:text-orange-300">
                    Kategori B: Pencapaian &amp; Anugerah (Maks 1.00)
                  </span>
                  <span className="text-orange-700 dark:text-orange-400 font-extrabold">
                    {catBScore >= 1.0 ? '✓ Capai Maksima 1.00' : `Telah Capai ${catBScore.toFixed(2)} / 1.00`}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-orange-200/60 dark:bg-orange-900/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                    style={{ width: `${(catBScore / 1.0) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] font-semibold text-orange-800 dark:text-orange-300">
                  {catBScore >= 1.0
                    ? '✓ Tahniah! Markah maksima 1.00 telah dicapai sepenuhnya.'
                    : `Perlu ${(1.0 - catBScore).toFixed(2)} mata lagi untuk mencapai maksima 1.00.`}
                </div>
              </div>

              {/* Category C: Perjawatan */}
              <div className="space-y-1.5 p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-rose-900 dark:text-rose-300">
                    Kategori C: Perjawatan &amp; Kepimpinan (Maks 1.00)
                  </span>
                  <span className="text-rose-700 dark:text-rose-400 font-extrabold">
                    {catCScore >= 1.0 ? '✓ Capai Maksima 1.00' : `Telah Capai ${catCScore.toFixed(2)} / 1.00`}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-rose-200/60 dark:bg-rose-900/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500"
                    style={{ width: `${(catCScore / 1.0) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                  {catCScore >= 1.0
                    ? '✓ Tahniah! Markah maksima 1.00 telah dicapai sepenuhnya.'
                    : `Perlu ${(1.0 - catCScore).toFixed(2)} mata lagi untuk mencapai maksima 1.00.`}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Part 1: Pembangunan Jati Diri (7%) - Lecturer Detail */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Bahagian 1: Pembangunan Jati Diri &amp; Kebangsaan
                  </h3>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                    Wajaran: 7.00%
                  </span>
                </div>
              </div>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {jatiDiri !== null ? `${jatiDiri.toFixed(2)} / 7.00%` : '7.00% Maks'}
              </span>
            </div>
            <div className="text-xs text-slate-500 leading-relaxed">
              Dinilai oleh pensyarah penilai berasaskan skala rasmi UKM:
              <div className="grid grid-cols-5 gap-1.5 mt-2 font-mono text-[11px] text-center font-bold">
                {JATI_DIRI_SCALE.slice(0, 5).map((g) => (
                  <div
                    key={g.grade}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-indigo-600 dark:text-indigo-400">{g.grade}</span>: {g.score.toFixed(2)}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1.5 mt-1 font-mono text-[11px] text-center font-bold">
                {JATI_DIRI_SCALE.slice(5).map((g) => (
                  <div
                    key={g.grade}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-slate-600 dark:text-slate-300">{g.grade}</span>: {g.score.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Part 2: Aktiviti Kokurikulum (3%) - Lecturer Detail */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Bahagian 2: Aktiviti Kokurikulum
                  </h3>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                    Wajaran: 3.00% (Kat A + Kat B + Kat C)
                  </span>
                </div>
              </div>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                {kokoActivitiesTotal !== null ? `${kokoActivitiesTotal.toFixed(2)} / 3.00%` : '3.00% Maks'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-center font-semibold">
              <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                <span className="text-[10px] uppercase text-amber-800 dark:text-amber-300 font-bold block">
                  Kat A: Penyertaan
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {(myKoko?.kokoParticipation ?? 0).toFixed(2)} / 1.0
                </span>
              </div>
              <div className="p-2 rounded-xl bg-orange-50/60 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900">
                <span className="text-[10px] uppercase text-orange-800 dark:text-orange-300 font-bold block">
                  Kat B: Pencapaian
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {(myKoko?.kokoAchievement ?? 0).toFixed(2)} / 1.0
                </span>
              </div>
              <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                <span className="text-[10px] uppercase text-rose-800 dark:text-rose-300 font-bold block">
                  Kat C: Perjawatan
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {(myKoko?.kokoPosition ?? 0).toFixed(2)} / 1.0
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {isStudent ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('approved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                Aktiviti Diluluskan ({studentApprovedSubmissions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <span>Dalam Semakan (Pending)</span>
                {studentPendingSubmissions.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 font-black text-[10px]">
                    {studentPendingSubmissions.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rejected')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <span>Permohonan Ditolak</span>
                {studentRejectedSubmissions.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-950 font-black text-[10px]">
                    {studentRejectedSubmissions.length}
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'review'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Semakan Permohonan Pelajar</span>
                {lecturerPendingSubmissions.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 font-black text-[10px]">
                    {lecturerPendingSubmissions.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('approved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                Senarai Aktiviti Diluluskan ({lecturerApprovedSubmissions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('jati_diri')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'jati_diri'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                Gred Jati Diri (7%)
              </button>
            </>
          )}
        </div>

        {/* Set Filter for Lecturer - Displays names for selected set only */}
        {!isStudent && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Tapis Set:</span>
            <select
              value={lecturerSetFilter}
              onChange={(e) => setLecturerSetFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            >
              <option value="all">Semua Set (1 - 11)</option>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
                <option key={s} value={String(s)}>
                  Set {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* STUDENT VIEW - APPROVED SUBMISSIONS */}
      {isStudent && activeTab === 'approved' && (
        <div className="space-y-3">
          {studentApprovedSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
              <Trophy className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Belum Ada Aktiviti Diluluskan
              </h4>
              <p className="text-xs text-slate-500">
                Tekan butang "+ Tambah Koko" di atas untuk menghantar permohonan pengesahan aktiviti.
              </p>
            </div>
          ) : (
            studentApprovedSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/70 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                      {sub.categoryName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                      {sub.levelName}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Diluluskan
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {sub.activityName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(sub.startDateTime).toLocaleDateString('ms-MY')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {sub.venue}
                    </span>
                    {sub.organizer && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {sub.organizer}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {sub.certificateFileUrl && (
                    <button
                      type="button"
                      onClick={() => openCertificateInNewWindow(sub.certificateFileUrl, sub.certificateFileName)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>Lihat Sijil</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteStudentSubmission(sub)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Padam Permohonan Ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* STUDENT VIEW - PENDING SUBMISSIONS */}
      {isStudent && activeTab === 'pending' && (
        <div className="space-y-3">
          {studentPendingSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Tiada Permohonan Dalam Semakan
              </h4>
              <p className="text-xs text-slate-500">
                Semua penyertaan anda telah disemak atau belum ada permohonan baru dihantar.
              </p>
            </div>
          ) : (
            studentPendingSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/70 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300">
                      {sub.categoryName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                      {sub.levelName}
                    </span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ⏳ Menunggu Semakan Pensyarah
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {sub.activityName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(sub.startDateTime).toLocaleDateString('ms-MY')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {sub.venue}
                    </span>
                    {sub.organizer && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {sub.organizer}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {sub.certificateFileUrl && (
                    <button
                      type="button"
                      onClick={() => openCertificateInNewWindow(sub.certificateFileUrl, sub.certificateFileName)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>Lihat Sijil</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSubToDelete(sub)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Padam / Tarik Balik Permohonan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* STUDENT VIEW - REJECTED SUBMISSIONS */}
      {isStudent && activeTab === 'rejected' && (
        <div className="space-y-3">
          {studentRejectedSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Tiada Permohonan Ditolak
              </h4>
              <p className="text-xs text-slate-500">
                Semua permohonan anda diproses dengan baik.
              </p>
            </div>
          ) : (
            studentRejectedSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300">
                        {sub.categoryName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                        {sub.levelName}
                      </span>
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Ditolak
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {sub.activityName}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSubToDelete(sub)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 border border-rose-200 dark:border-rose-800 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Padam Rekod Ini</span>
                    </button>
                  </div>
                </div>

                {/* Highlighted Reason for Rejection */}
                <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/80 text-xs space-y-1">
                  <div className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Sebab Penolakan Oleh Pensyarah:</span>
                  </div>
                  <p className="text-rose-800 dark:text-rose-200 font-medium pl-5">
                    "{sub.rejectionReason || 'Maklumat atau lampiran tidak memenuhi kriteria rasmi.'}"
                  </p>
                  <div className="text-[10px] text-slate-400 pl-5 pt-0.5">
                    Disemak oleh: {sub.reviewedBy || 'Pensyarah Penilai'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* LECTURER VIEW - REVIEW PENDING SUBMISSIONS */}
      {!isStudent && activeTab === 'review' && (
        <div className="space-y-4">
          {lecturerPendingSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Semua Permohonan Kokurikulum Telah Selesai Disemak
              </h4>
              <p className="text-xs text-slate-500">
                {lecturerSetFilter === 'all'
                  ? 'Tiada permohonan tertunggak daripada pelajar mana-mana set.'
                  : `Tiada permohonan tertunggak daripada pelajar Set ${lecturerSetFilter}.`}
              </p>
            </div>
          ) : (
            lecturerPendingSubmissions.map((sub) => {
              const matrixScore = calculateSuggestedKokoScore(sub.category, sub.level, sub.subCategory);

              const currentScore =
                reviewScoreInputs[sub.id] !== undefined ? reviewScoreInputs[sub.id] : matrixScore;

              return (
                <div
                  key={sub.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-300 dark:border-amber-800/80 p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {sub.studentName}
                        </span>
                        <span className="font-mono text-xs text-slate-500">({sub.matricNumber})</span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                          Set {sub.setNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Dihantar pada:{' '}
                        {new Date(sub.submittedAt).toLocaleDateString('ms-MY')}{' '}
                        {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold">
                        {sub.categoryName}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold capitalize">
                        {sub.levelName}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Nama Aktiviti / Jawatan:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {sub.activityName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Tempat Aktiviti:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {sub.venue} {sub.organizer ? `(Anjuran: ${sub.organizer})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Tarikh &amp; Masa:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {new Date(sub.startDateTime).toLocaleDateString('ms-MY')} -{' '}
                        {new Date(sub.endDateTime).toLocaleDateString('ms-MY')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Sijil Lampiran:</span>
                      {sub.certificateFileUrl ? (
                        <button
                          type="button"
                          onClick={() => openCertificateInNewWindow(sub.certificateFileUrl, sub.certificateFileName)}
                          className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold underline hover:text-indigo-800 cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{sub.certificateFileName || 'Buka Sijil Penyertaan'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Tiada sijil dilampirkan</span>
                      )}
                    </div>
                  </div>

                  {/* Lecturer Marking Control Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Markah Matriks Rasmi:
                      </span>
                      <button
                        type="button"
                        onClick={() => setReviewScoreInputs((prev) => ({ ...prev, [sub.id]: matrixScore }))}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold cursor-pointer transition-all border ${
                          currentScore === matrixScore
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-amber-300 text-amber-900 dark:text-amber-300'
                        }`}
                      >
                        +{matrixScore.toFixed(3)} (Syor Matriks)
                      </button>

                      {/* Quick alternative scores */}
                      {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 1.0]
                        .filter((s) => Math.abs(s - matrixScore) > 0.01)
                        .slice(0, 4)
                        .map((sc) => (
                          <button
                            key={sc}
                            type="button"
                            onClick={() => setReviewScoreInputs((prev) => ({ ...prev, [sub.id]: sc }))}
                            className={`px-2 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-colors ${
                              currentScore === sc
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            +{sc.toFixed(2)}
                          </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal(sub)}
                        disabled={isReviewing === sub.id}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-50 cursor-pointer"
                      >
                        Tolak
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLecturerApprove(sub)}
                        disabled={isReviewing === sub.id}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Luluskan &amp; Sahkan (+{currentScore.toFixed(3)})</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* LECTURER VIEW - APPROVED ACTIVITIES */}
      {!isStudent && activeTab === 'approved' && (
        <div className="space-y-3">
          {lecturerApprovedSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
              Belum ada aktiviti yang diluluskan bagi set ini.
            </div>
          ) : (
            lecturerApprovedSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{sub.studentName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({sub.matricNumber})</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 rounded font-bold">
                      Set {sub.setNumber}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {sub.activityName} • <span className="text-xs text-slate-500 capitalize">{sub.levelName}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
                    +{sub.awardedScore} Markah
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Diluluskan oleh: {sub.reviewedBy}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* LECTURER VIEW - JATI DIRI MANAGEMENT (7%) */}
      {!isStudent && activeTab === 'jati_diri' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pengurusan Gred Pembangunan Jati Diri &amp; Kebangsaan (7%)
                </h3>
                <p className="text-xs text-slate-500">
                  Paparan senarai pelajar mengikut tapis set. Tetapkan gred rasmi atau reset secara individu / pukal.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold">
                Paparan: {lecturerSetFilter === 'all' ? 'Semua Pelajar (1 - 11)' : `Set ${lecturerSetFilter}`} ({filteredStudentRoster.length} Pelajar)
              </span>
              <button
                type="button"
                onClick={() => setIsResetAllJatiDiriOpen(true)}
                disabled={isSavingJatiDiri}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset Markah Jati Diri Semua Pelajar Dalam Set Ini"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Pelajar</span>
              </button>
            </div>
          </div>

          {/* Table / Roster List for Jati Diri Management */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-3">Pelajar ASASIpintar</th>
                  <th className="p-3 text-center">Set</th>
                  <th className="p-3 text-center">Gred Semasa</th>
                  <th className="p-3">Pilih Gred Baru (Wajaran 7.00%)</th>
                  <th className="p-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudentRoster.map((st) => {
                  const currentRec = kokoRecords.find(
                    (k) => k.studentEmail.toLowerCase() === st.email.toLowerCase()
                  );
                  const currentScore = currentRec?.jatiDiriScore;
                  const hasScore = currentScore !== undefined && currentScore !== null;
                  const matchedScale = hasScore ? JATI_DIRI_SCALE.find((s) => Math.abs(s.score - currentScore) < 0.05) : null;
                  const currentGradeText = hasScore
                    ? matchedScale
                      ? `${matchedScale.grade} (${matchedScale.score.toFixed(2)})`
                      : `${currentScore.toFixed(2)}`
                    : '-';

                  const selectedGrade = selectedJatiDiriGradeMap[st.email] || matchedScale?.grade || '-';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{st.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{st.matricNumber} • {st.email}</div>
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Set {st.setNumber}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span className={`px-2.5 py-1 rounded-lg text-xs ${hasScore ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold'}`}>
                          {currentGradeText}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={selectedGrade}
                          onChange={(e) =>
                            setSelectedJatiDiriGradeMap((prev) => ({ ...prev, [st.email]: e.target.value }))
                          }
                          className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold w-full max-w-xs"
                        >
                          <option value="-">- (Sila Pilih Gred)</option>
                          {JATI_DIRI_SCALE.map((g) => (
                            <option key={g.grade} value={g.grade}>
                              Gred {g.grade} = {g.score.toFixed(2)} / 7.00%
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setJatiDiriToReset({ email: st.email, name: st.name })}
                            disabled={isSavingJatiDiri}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                            title="Reset Markah Pelajar Ini"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveJatiDiriSingle(st.email, st.name)}
                            disabled={isSavingJatiDiri}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Simpan</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: REJECTION REASON FOR LECTURER */}
      {rejectingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-base">
                <AlertCircle className="w-5 h-5" />
                <span>Tolak Permohonan Kokurikulum</span>
              </div>
              <button
                onClick={() => setRejectingSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white">{rejectingSub.activityName}</div>
                <div className="text-[11px] text-slate-500">
                  Pelajar: {rejectingSub.studentName} ({rejectingSub.matricNumber}) • Set {rejectingSub.setNumber}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Nyatakan Sebab Penolakan (Akan dipaparkan kepada pelajar):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="cth: Sijil lampiran tidak jelas atau nama pelajar tidak tertera pada sijil pengesahan."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Quick Preset Reason Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pilih Sebab Pantas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Sijil lampiran tidak jelas / tidak sah',
                    'Butiran masa/tempat tidak mencukupi',
                    'Tahp peringkat aktiviti tidak betul',
                    'Bukan dalam tempoh pengajian ASASIpintar',
                  ].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRejectionReasonInput(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRejectingSub(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Sahkan Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CERTIFICATE PREVIEWER / VIEWER */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
                  Paparan Sijil Lampiran: {viewingCertificate.fileName}
                </h3>
              </div>
              <button
                onClick={() => setViewingCertificate(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 flex-1 overflow-auto flex items-center justify-center min-h-[300px] bg-slate-100 dark:bg-slate-950 rounded-2xl p-2">
              {viewingCertificate.dataUrl.includes('image/') || viewingCertificate.dataUrl.startsWith('data:image') ? (
                <img
                  src={viewingCertificate.dataUrl}
                  alt={viewingCertificate.fileName}
                  className="max-h-[65vh] object-contain rounded-xl shadow-md"
                />
              ) : (
                <iframe
                  src={viewingCertificate.dataUrl}
                  title={viewingCertificate.fileName}
                  className="w-full h-[60vh] rounded-xl border border-slate-200 dark:border-slate-800"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <a
                href={viewingCertificate.dataUrl}
                download={viewingCertificate.fileName || 'sijil_lampiran'}
                className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 text-xs font-bold flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4 rotate-180" />
                <span>Muat Turun Fail</span>
              </a>

              <button
                type="button"
                onClick={() => setViewingCertificate(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT SUBMIT CO-CURRICULAR ACTIVITY */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tambah &amp; Hantar Aktiviti Kokurikulum
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pelajar: {user.name} (Set {user.setNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmitActivity} className="mt-4 space-y-3.5">
              {/* Kategori (A/B/C) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Pilih Kategori Kokurikulum:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'A', name: 'A. Penyertaan', desc: 'Maks 1.00' },
                    { id: 'B', name: 'B. Pencapaian', desc: 'Maks 1.00' },
                    { id: 'C', name: 'C. Perjawatan', desc: 'Maks 1.00' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as KokoCategory)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        category === cat.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div>{cat.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Category Inputs */}
              {category !== 'C' ? (
                /* For A & B: Input Nama Aktiviti / Program */
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. Nama Aktiviti / Program:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth: Pertandingan Debat Perdana Belia Antarabangsa"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              ) : (
                /* For C: Dropdown Jawatan */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      2. Pilih Jawatan Disandang:
                    </label>
                    <select
                      value={positionRole}
                      onChange={(e) => setPositionRole(e.target.value as KokoPositionRole)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500"
                    >
                      {KOKO_POSITION_OPTIONS.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Badan / Kelab / Persatuan (Pilihan):
                    </label>
                    <input
                      type="text"
                      placeholder="cth: Kelab Robotik & AI UKM / Majlis Perwakilan Pelajar"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* If Category B: Dropdown Tahap Pencapaian */}
              {category === 'B' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tahap Pencapaian:
                  </label>
                  <select
                    value={achievementLevel}
                    onChange={(e) => setAchievementLevel(e.target.value as KokoAchievementLevel)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500"
                  >
                    {KOKO_ACHIEVEMENT_OPTIONS.map((ach) => (
                      <option key={ach.id} value={ach.id}>
                        {ach.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Peringkat Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  3. Peringkat Aktiviti / Perjawatan:
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as KokoLevel)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="pusat">Pusat PERMATApintar / Kolej</option>
                  <option value="universiti">Universiti (UKM)</option>
                  <option value="kebangsaan">Kebangsaan (National)</option>
                  <option value="antarabangsa">Antarabangsa (International)</option>
                </select>
              </div>

              {/* Dynamic Estimated Score Badge */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Kadar Markah Matriks Rasmi:
                </span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  +{currentFormSuggestedScore.toFixed(3)} Markah
                </span>
              </div>

              {/* Tarikh & Masa Mula dan Tamat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4. Tarikh &amp; Masa Mula:
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    5. Tarikh &amp; Masa Tamat:
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Tempat Aktiviti & Anjuran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    6. Tempat Aktiviti:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth: Dewan Canselor Tun Abdul Razak (DECTAR)"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    7. Anjuran (Pilihan):
                  </label>
                  <input
                    type="text"
                    placeholder="cth: Kementerian Belia dan Sukan / UKM"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Upload Sijil */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  8. Muat Naik Fail Sijil Penyertaan / Pengesahan:
                </label>
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-center bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
                  <UploadCloud className="w-6 h-6 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Klik untuk pilih fail sijil dari peranti
                  </span>
                  <span className="text-[10px] text-slate-400">Sokongan format PDF atau Imej PNG/JPG</span>
                  <input type="file" className="hidden" onChange={handleCertificatePicked} />
                </label>

                {certificateFile && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 truncate">
                      <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                      {certificateFile.name} ({certificateFile.size})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCertificateFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Menghantar...' : 'Hantar Untuk Semakan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Koko Submission */}
      {subToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Padam Permohonan Kokurikulum?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  "{subToDelete.activityName}"
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Adakah anda pasti mahu memadam permohonan ini secara kekal?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSubToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudentSubmission}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                Ya, Padam Permohonan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Individual Jati Diri */}
      {jatiDiriToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reset Markah Jati Diri?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {jatiDiriToReset.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Adakah anda pasti mahu mereset markah Jati Diri bagi pelajar ini? Markah akan dikosongkan.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setJatiDiriToReset(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmResetIndividualJatiDiri}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                Ya, Reset Markah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset All Jati Diri */}
      {isResetAllJatiDiriOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Reset Markah Jati Diri Keseluruhan Pelajar?
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                  Set: {lecturerSetFilter === 'all' ? 'Semua Set (1 - 11)' : `Set ${lecturerSetFilter}`}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Adakah anda pasti mahu mereset markah Jati Diri bagi semua pelajar dalam set ini? Gred Jati Diri akan kembali kepada status belum dikey-in (-).
            </p>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsResetAllJatiDiriOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmResetAllJatiDiri}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                Ya, Reset Semua Jati Diri
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
