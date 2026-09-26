import React from 'react';
import {
  UserProfile,
  StudentCourseGrade,
  StudentKokoRecord,
} from '../types.ts';
import { GRADE_SCALE, SUBJECTS } from '../data/mockData.ts';
import { calculateOfficialPngs } from '../utils/gradeCalculation.ts';
import { getLecturerForSetAndSubject } from '../utils/lecturerSetSync.ts';
import { getSubjectDisplayName } from '../utils/subjectNames.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { dataService } from '../services/dataService.ts';
import { LecturerGradeManager } from './LecturerGradeManager.tsx';
import {
  Calculator,
  Award,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Sliders,
  Check,
  Clock,
  BookOpen,
  Lock,
  FileText,
  Info,
} from 'lucide-react';

interface GpaCalculatorViewProps {
  user: UserProfile;
  grades: StudentCourseGrade[];
  kokoRecords?: StudentKokoRecord[];
  onGradesUpdated?: () => void;
}

export const GpaCalculatorView: React.FC<GpaCalculatorViewProps> = ({
  user,
  grades,
  kokoRecords = [],
  onGradesUpdated,
}) => {
  const { lang, dict } = useLanguage();
  const isStudent = user.role === 'student';

  // If Lecturer, render the Lecturer Grade & Koko Manager directly
  if (!isStudent) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-800">
              Portal Pensyarah UKM ASASIpintar
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            Pusat Pengurusan Markah & Gred Kursus
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kemas kini markah kerja kursus (assignment, kuiz, makmal, mid-term, peperiksaan akhir) dan markah kokurikulum 318 pelajar ASASIpintar.
          </p>
        </div>

        <LecturerGradeManager
          user={user}
          grades={grades}
          kokoRecords={kokoRecords}
          onSaveGrade={async (g) => {
            await dataService.updateGrade(g);
            onGradesUpdated?.();
          }}
          onSaveKoko={async (k) => {
            await dataService.saveKokoRecord(k);
            onGradesUpdated?.();
          }}
        />
      </div>
    );
  }

  // STUDENT VIEW (Read-only, Official ASASIpintar PDF Formula & Progress Bars)
  const studentGrades = grades.filter((g) => {
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

  // Official UKM ASASIpintar PNGS Calculation
  const pngsResult = calculateOfficialPngs(studentGrades);

  const displayPngs = pngsResult.pngs !== null 
    ? pngsResult.pngs 
    : (user.currentCgpa !== null && user.currentCgpa !== undefined ? user.currentCgpa : null);

  const isDeansList = displayPngs !== null && displayPngs >= 3.75;
  const hasOfficialGrades = studentGrades.some((g) => g.totalScore !== null && g.totalScore !== undefined);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200/60 dark:border-indigo-800">
              ASASIpintar UKM
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Pelajar: <strong>{user.name}</strong> ({user.matricNumber || 'AP05710'})
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            Slip Keputusan & Pengiraan PNGS Rasmi
          </h1>
        </div>

        {/* GPA Summary Pill */}
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
              {pngsResult.hasEnoughData ? 'PNGS Rasmi (10 Jam)' : dict.cgpaSemasa}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {displayPngs !== null ? displayPngs.toFixed(2) : '—'}
            </div>
          </div>
          <div className="pl-3 border-l border-slate-100 dark:border-slate-800 text-right">
            <div
              className={`text-xs font-bold ${
                isDeansList
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : displayPngs !== null
                  ? 'text-slate-600 dark:text-slate-400'
                  : 'text-amber-500'
              }`}
            >
              {displayPngs !== null
                ? isDeansList
                  ? dict.deansList
                  : 'Lulus Cemerlang'
                : 'Belum Dinilai'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">
              {displayPngs !== null ? 'Ambang Anugerah Dekan: 3.75' : 'Menunggu Pensyarah'}
            </div>
          </div>
        </div>
      </div>

      {/* Official Status Banner if marks not yet entered */}
      {!hasOfficialGrades && (
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/40 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <h3 className="font-extrabold text-amber-900 dark:text-amber-200">
              Markah Rasmi Belum Dimasukkan Oleh Pensyarah Kursus
            </h3>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
              Markah tugasan, kuiz, amali makmal, dan peperiksaan akhir anda belum dimuat naik oleh pensyarah ke portal.
            </p>
          </div>
        </div>
      )}

      {/* Official ASASIpintar Formula Explanation Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Formula Kiraan PNGS Semester 1 (Buku Panduan Akademik UKM ASASIpintar)
          </h2>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>PNGS = (Nilai Mata Sains 1 × 3 + Nilai Mata Sains 2 × 3 + Nilai Mata Statistik × 4) / 10</span>
          <span className="font-sans font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
            Jumlah Jam Kredit PNGS: 10
          </span>
        </div>
      </div>

      {/* Breakdown of 2 Best Science Subjects & Dropped Science Subject */}
      {pngsResult.hasEnoughData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>2 Kursus Sains Terbaik Dipilih Untuk PNGS:</span>
            </div>
            <div className="space-y-1.5">
              {pngsResult.bestScienceCourses.map((c) => (
                <div key={c.courseCode} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{c.courseName}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({c.courseCode})</span>
                  </div>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                    Gred {c.letterGrade} ({c.gradePoint?.toFixed(2)} Mata) • {c.creditHours} Jam
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Kursus Sains Digugurkan Daripada Kiraan PNGS:</span>
            </div>
            {pngsResult.droppedScienceCourse ? (
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{pngsResult.droppedScienceCourse.courseName}</span>
                  <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({pngsResult.droppedScienceCourse.courseCode})</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Gred {pngsResult.droppedScienceCourse.letterGrade} ({pngsResult.droppedScienceCourse.gradePoint?.toFixed(2)}) • Digugurkan
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Tiada kursus sains digugurkan (menunggu kemasukan markah ketiga-tiga sains).
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              *Kursus sains dengan nilai mata terendah tidak dimasukkan dalam formula PNGS, namun gred tetap direkodkan dalam transkrip rasmi.
            </p>
          </div>
        </div>
      )}

      {/* Slip Keputusan Rasmi Peperiksaan Semester 1 Table (With Progress Bars) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Slip Keputusan Peperiksaan Semester 1
              </h2>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <Lock className="w-3 h-3" /> Paparan Pelajar (Tidak Boleh Diedit)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[10px] uppercase font-bold">
                <th className="pb-2">Kod Kursus</th>
                <th className="pb-2">Nama Kursus</th>
                <th className="pb-2 text-center">Kredit</th>
                <th className="pb-2">Kemajuan Penilaian</th>
                <th className="pb-2 text-center">Gred / Mata</th>
                <th className="pb-2 text-right">Status Kiraan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {SUBJECTS.map((sub) => {
                const gradeRecord = studentGrades.find((g) => g.courseCode === sub.code);
                const score = gradeRecord?.totalScore !== null && gradeRecord?.totalScore !== undefined ? gradeRecord.totalScore : null;
                const letter = gradeRecord?.letterGrade || null;
                const point = gradeRecord?.gradePoint !== null && gradeRecord?.gradePoint !== undefined ? gradeRecord.gradePoint : null;
                const isEvaluated = score !== null;
                const assignedLecturer = getLecturerForSetAndSubject(user.setNumber || 3, sub.code, sub.name);
                const displayName = getSubjectDisplayName(sub.code, lang);

                const isCountedInPngs =
                  sub.code === 'PNAP0154' ||
                  (pngsResult.bestScienceCourses.some((c) => c.courseCode === sub.code));

                const isDroppedScience =
                  pngsResult.droppedScienceCourse?.courseCode === sub.code;

                return (
                  <tr key={sub.code} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {sub.code}
                    </td>
                    <td className="py-3 font-medium text-slate-900 dark:text-white">
                      <div>{displayName}</div>
                      <div className="text-[10px] text-slate-400">Pensyarah: {assignedLecturer}</div>
                    </td>
                    <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                      {sub.creditHours}
                    </td>
                    <td className="py-3 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isEvaluated
                                ? score >= 80
                                  ? 'bg-emerald-500'
                                  : 'bg-indigo-500'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                            style={{ width: `${isEvaluated ? Math.min(100, Math.max(0, score)) : 0}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isEvaluated ? `${score}% Selesai` : 'Menunggu Pensyarah'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      {isEvaluated ? (
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {letter} ({point?.toFixed(2)})
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {isCountedInPngs ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          PNGS (10 Jam)
                        </span>
                      ) : isDroppedScience ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          Sains Digugurkan
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Kredit Ambil
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
