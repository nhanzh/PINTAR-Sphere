import React, { useState, useMemo, useEffect } from 'react';
import {
  UserProfile,
  StudentCourseGrade,
  StudentKokoRecord,
  AssessmentComponent,
  StudentRosterItem,
} from '../types.ts';
import {
  COURSE_ASSESSMENT_SCHEMAS,
  GRADE_SCALE,
  SUBJECTS,
} from '../data/mockData.ts';
import {
  KOKO_PARTICIPATION_LEVELS,
  KOKO_ACHIEVEMENT_OPTIONS,
  KOKO_POSITION_OPTIONS,
  CLASS_REPRESENTATIVE_SCORE,
  calculateKoko10Total,
} from '../data/kokoData.ts';
import { OFFICIAL_318_STUDENTS_ROSTER } from '../data/officialStudentRoster.ts';
import { dataService } from '../services/dataService.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import {
  Calculator,
  Award,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  Sparkles,
  BookOpen,
  Check,
  Clock,
  Shield,
  Trophy,
  Users,
  Compass,
  Lock,
  Star,
  Info,
  Table,
  FileSpreadsheet,
  Download,
  Edit2,
  FileText,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface LecturerGradeManagerProps {
  user: UserProfile;
  grades: StudentCourseGrade[];
  kokoRecords: StudentKokoRecord[];
  onSaveGrade?: (grade: StudentCourseGrade) => Promise<void>;
  onSaveKoko?: (record: StudentKokoRecord) => Promise<void>;
  initialStudentEmail?: string;
  className?: string;
}

const SUBJECT_KEY_TO_CODE: Record<string, string> = {
  chemistry: 'PNAP0133',
  physics: 'PNAP0123',
  biology: 'PNAP0113',
  statistics: 'PNAP0154',
  logical_reasoning: 'PNAP0143',
  language_literary: 'PNAP0162',
  jati_diri: 'PNAP0172',
  research_skills: 'PNAP0182',
};

export const LecturerGradeManager: React.FC<LecturerGradeManagerProps> = ({
  user,
  grades,
  kokoRecords,
  onSaveGrade,
  onSaveKoko,
  initialStudentEmail,
  className = '',
}) => {
  const { lang, dict } = useLanguage();

  // Mode: 'excel' (Spreadsheet View - default as requested) or 'form' (Detailed Individual Form)
  const [viewLayout, setViewLayout] = useState<'excel' | 'form'>('excel');
  const [entryMode, setEntryMode] = useState<'academic' | 'koko'>('academic');

  // Student selection state
  const [selectedSet, setSelectedSet] = useState<string>('3');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>(
    initialStudentEmail || 'ap05710@siswa.ukm.edu.my'
  );

  // Allowed courses for this lecturer (Includes taught subject, other subjects & Kokurikulum)
  const allowedCourseCodes = useMemo(() => {
    const all = Object.keys(COURSE_ASSESSMENT_SCHEMAS);
    if (user.taughtSubjectCode && all.includes(user.taughtSubjectCode)) {
      return [user.taughtSubjectCode, ...all.filter((c) => c !== user.taughtSubjectCode)];
    }
    return all;
  }, [user.taughtSubjectCode]);

  const defaultCourseCode = allowedCourseCodes[0] || 'PNAP0133';
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(defaultCourseCode);

  useEffect(() => {
    if (!allowedCourseCodes.includes(selectedCourseCode)) {
      setSelectedCourseCode(allowedCourseCodes[0] || 'PNAP0133');
    }
  }, [allowedCourseCodes, selectedCourseCode]);

  // Current course schema
  const courseSchema = COURSE_ASSESSMENT_SCHEMAS[selectedCourseCode] || COURSE_ASSESSMENT_SCHEMAS.PNAP0133;

  // Component scores for detailed form
  const [componentScores, setComponentScores] = useState<Record<string, number | ''>>(() => {
    const initial: Record<string, number | ''> = {};
    courseSchema.components.forEach((c) => {
      initial[c.name] = '';
    });
    return initial;
  });

  // Inline Excel Scores State: Record<studentEmail, Record<componentName, number | ''>>
  const [excelScores, setExcelScores] = useState<Record<string, Record<string, number | ''>>>({});

  // Koko form state
  const [jatiDiriInput, setJatiDiriInput] = useState<number | ''>('');
  const [kokoParticipationVal, setKokoParticipationVal] = useState<number>(0);
  const [kokoAchievementVal, setKokoAchievementVal] = useState<number>(0);
  const [kokoPositionVal, setKokoPositionVal] = useState<number>(0);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modal states for resetting marks (Replacing window.confirm for iframe stability)
  const [isResetAllModalOpen, setIsResetAllModalOpen] = useState(false);
  const [studentToReset, setStudentToReset] = useState<StudentRosterItem | null>(null);

  // Filter roster by Set & Search
  const filteredStudents = useMemo(() => {
    return OFFICIAL_318_STUDENTS_ROSTER.filter((s) => {
      const matchesSet = selectedSet === 'all' || s.setNumber === Number(selectedSet);
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesSet;
      const matchesQuery =
        s.name.toLowerCase().includes(query) ||
        s.matricNumber.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query);
      return matchesSet && matchesQuery;
    });
  }, [selectedSet, searchQuery]);

  // Prepopulate excelScores from grades data
  useEffect(() => {
    const map: Record<string, Record<string, number | ''>> = {};
    grades.forEach((g) => {
      if (g.courseCode === selectedCourseCode && g.components) {
        map[g.studentEmail.toLowerCase()] = {};
        g.components.forEach((c) => {
          map[g.studentEmail.toLowerCase()][c.name] = c.score !== null ? c.score : '';
        });
      }
    });
    setExcelScores(map);
  }, [grades, selectedCourseCode]);

  // Selected student object for form
  const currentStudent = useMemo(() => {
    return (
      OFFICIAL_318_STUDENTS_ROSTER.find(
        (s) => s.email.toLowerCase() === selectedStudentEmail.toLowerCase()
      ) || OFFICIAL_318_STUDENTS_ROSTER[0]
    );
  }, [selectedStudentEmail]);

  // Find existing academic grade for selected student
  const existingGrade = useMemo(() => {
    return grades.find(
      (g) =>
        g.studentEmail.toLowerCase() === selectedStudentEmail.toLowerCase() &&
        g.courseCode === selectedCourseCode
    );
  }, [grades, selectedStudentEmail, selectedCourseCode]);

  // Load scores into form
  useEffect(() => {
    if (existingGrade && existingGrade.components && existingGrade.components.length > 0) {
      const initial: Record<string, number | ''> = {};
      existingGrade.components.forEach((c) => {
        initial[c.name] = c.score !== null && c.score !== undefined ? c.score : '';
      });
      setComponentScores(initial);
    } else {
      const initial: Record<string, number | ''> = {};
      courseSchema.components.forEach((c) => {
        initial[c.name] = '';
      });
      setComponentScores(initial);
    }
  }, [selectedStudentEmail, selectedCourseCode, existingGrade, courseSchema]);

  const getGradeInfo = (score: number) => {
    const matched = GRADE_SCALE.find((g) => score >= g.minMark && score <= g.maxMark);
    return matched || { letter: 'E', point: 0.0, description: 'Gagal' };
  };

  // Calculate live score for form
  const calculatedAcademic = useMemo(() => {
    let totalWeightedScore = 0;
    let hasAnyScore = false;

    courseSchema.components.forEach((comp) => {
      const val = componentScores[comp.name];
      if (typeof val === 'number' && !isNaN(val)) {
        totalWeightedScore += (val * comp.weight) / 100;
        hasAnyScore = true;
      }
    });

    const finalScore = hasAnyScore ? Number(totalWeightedScore.toFixed(2)) : null;
    const gradeInfo = finalScore !== null ? getGradeInfo(finalScore) : null;

    return {
      hasAnyScore,
      finalScore,
      letterGrade: gradeInfo?.letter || null,
      gradePoint: gradeInfo?.point ?? null,
      description: gradeInfo?.description || null,
    };
  }, [courseSchema, componentScores]);

  // Helper for computing student row grade in Excel view
  const computeStudentRowGrade = (studentEmail: string) => {
    const userScores = excelScores[studentEmail.toLowerCase()] || {};
    let totalWeighted = 0;
    let hasAny = false;

    courseSchema.components.forEach((comp) => {
      const val = userScores[comp.name];
      if (typeof val === 'number' && !isNaN(val)) {
        totalWeighted += (val * comp.weight) / 100;
        hasAny = true;
      }
    });

    if (!hasAny) {
      const existing = grades.find(
        (g) =>
          g.studentEmail.toLowerCase() === studentEmail.toLowerCase() &&
          g.courseCode === selectedCourseCode
      );
      if (existing && existing.totalScore !== null) {
        return {
          totalScore: existing.totalScore,
          letterGrade: existing.letterGrade,
          gradePoint: existing.gradePoint,
          isSaved: true,
        };
      }
      return { totalScore: null, letterGrade: '—', gradePoint: null, isSaved: false };
    }

    const finalScore = Number(totalWeighted.toFixed(2));
    const info = getGradeInfo(finalScore);
    return {
      totalScore: finalScore,
      letterGrade: info.letter,
      gradePoint: info.point,
      isSaved: true,
    };
  };

  // Handle saving an individual student from Excel row
  const handleSaveStudentExcelRow = async (st: StudentRosterItem) => {
    const rowCalc = computeStudentRowGrade(st.email);
    if (rowCalc.totalScore === null) return;

    const userScores = excelScores[st.email.toLowerCase()] || {};
    const components: AssessmentComponent[] = courseSchema.components.map((c) => ({
      name: c.name,
      weight: c.weight,
      score: typeof userScores[c.name] === 'number' ? (userScores[c.name] as number) : 0,
    }));

    const gradeData: StudentCourseGrade = {
      id: `grade-${st.matricNumber.toLowerCase()}-${selectedCourseCode.toLowerCase()}`,
      studentId: st.id,
      studentName: st.name,
      studentEmail: st.email,
      courseCode: selectedCourseCode,
      courseName: courseSchema.courseName,
      creditHours: courseSchema.creditHours,
      isScience: ['PNAP0133', 'PNAP0123', 'PNAP0113'].includes(selectedCourseCode),
      components,
      totalScore: rowCalc.totalScore,
      letterGrade: rowCalc.letterGrade || 'A',
      gradePoint: rowCalc.gradePoint ?? 4.0,
      setNumber: st.setNumber,
      isPublished: true,
      updatedAt: new Date().toISOString(),
      updatedBy: user.name,
    };

    try {
      if (onSaveGrade) {
        await onSaveGrade(gradeData);
      } else {
        await dataService.saveStudentGrade(gradeData);
      }
      setStatusMessage({
        type: 'success',
        text: `Markah bagi ${st.name} (${st.matricNumber}) berjaya disimpan: ${rowCalc.totalScore}% (Gred ${rowCalc.letterGrade})`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Error saving grade:', err);
      setStatusMessage({ type: 'error', text: 'Ralat menyimpan markah pelajar.' });
    }
  };

  // Reset Individual Student Mark
  const confirmResetStudentMark = async () => {
    if (!studentToReset) return;
    const st = studentToReset;
    setExcelScores((prev) => {
      const next = { ...prev };
      delete next[st.email.toLowerCase()];
      return next;
    });

    if (selectedCourseCode === 'KOKO') {
      await dataService.resetStudentKoko(st.email);
    } else {
      await dataService.resetStudentCourseGrade(st.email, selectedCourseCode);
    }

    setStatusMessage({
      type: 'success',
      text: `Markah ${st.name} bagi ${selectedCourseCode} telah berjaya diset semula (tiada markah).`,
    });
    setStudentToReset(null);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Reset All Students Marks for this Course
  const confirmResetAllStudents = async () => {
    setExcelScores({});

    if (selectedCourseCode === 'KOKO') {
      await dataService.resetAllKokoRecords();
    } else {
      await dataService.resetAllCourseGrades(selectedCourseCode);
    }

    setStatusMessage({
      type: 'success',
      text: `Markah semua pelajar bagi kursus ${selectedCourseCode} telah berjaya diset semula (tiada markah).`,
    });
    setIsResetAllModalOpen(false);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Export to CSV Function
  const handleExportCsv = () => {
    const headers = [
      'No',
      'No Matrik',
      'Nama Pelajar',
      'Set',
      'Kursus',
      ...courseSchema.components.map((c) => `${c.name} (${c.weight}%)`),
      'Jumlah (%)',
      'Gred Huruf',
      'Nilai Mata (PNGS)',
    ];

    const rows = filteredStudents.map((st, idx) => {
      const calc = computeStudentRowGrade(st.email);
      const userScores = excelScores[st.email.toLowerCase()] || {};
      const compVals = courseSchema.components.map((c) =>
        userScores[c.name] !== undefined && userScores[c.name] !== '' ? userScores[c.name] : ''
      );

      return [
        idx + 1,
        st.matricNumber,
        `"${st.name}"`,
        st.setNumber,
        selectedCourseCode,
        ...compVals,
        calc.totalScore !== null ? calc.totalScore : '',
        calc.letterGrade !== '—' ? calc.letterGrade : '',
        calc.gradePoint !== null ? calc.gradePoint.toFixed(2) : '',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gred_ASASIpintar_${selectedCourseCode}_Set${selectedSet}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toast Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-sm animate-in fade-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-semibold">{statusMessage.text}</p>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold underline ml-3 shrink-0 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Header & Layout Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-800">
              {user.name} ({user.taughtSubjectName || 'Pensyarah ASASIpintar'})
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Kemasukan Markah &amp; Gred Rasmi
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            Pengurusan Gred Kursus &amp; Kokurikulum
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Sistem pengurusan markah akademik dan kokurikulum 318 pelajar ASASIpintar UKM.
          </p>
        </div>

        {/* View Toggle (Excel vs Form) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setViewLayout('excel')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewLayout === 'excel'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Paparan Excel (Spreadsheet)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewLayout('form')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewLayout === 'form'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            <span>Borang Individu</span>
          </button>
        </div>
      </div>

      {/* EXCEL SPREADSHEET VIEW */}
      {viewLayout === 'excel' ? (
        <div className="space-y-4">
          {/* Excel Ribbon Toolbar */}
          <div className="bg-emerald-800 text-white rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-200">
                    Buku Gred Kursus &amp; Kokurikulum Pelajar (Excel Grid)
                  </div>
                  <div className="text-sm font-bold text-white">
                    {courseSchema.courseName} ({selectedCourseCode})
                  </div>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Subject Selector */}
                <select
                  value={selectedCourseCode}
                  onChange={(e) => setSelectedCourseCode(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white text-slate-900 font-bold border-none cursor-pointer"
                >
                  {allowedCourseCodes.map((code) => (
                    <option key={code} value={code}>
                      {code} - {COURSE_ASSESSMENT_SCHEMAS[code]?.courseName}
                    </option>
                  ))}
                </select>

                {/* Set Filter */}
                <select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white text-slate-900 font-bold border-none cursor-pointer"
                >
                  <option value="all">Semua Set (1 - 11)</option>
                  {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={String(s)}>
                      Set {s}
                    </option>
                  ))}
                </select>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Eksport CSV</span>
                </button>

                {/* Reset Whole Cohort Marks Button */}
                <button
                  type="button"
                  onClick={() => setIsResetAllModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  title="Tetapkan semula semua markah pelajar bagi kursus ini"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Semua Pelajar</span>
                </button>
              </div>
            </div>

            {/* Formula Bar & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-emerald-700/60 text-xs">
              <div className="flex items-center gap-2 bg-emerald-900/60 px-3 py-1.5 rounded-xl text-emerald-200 font-mono text-[11px] w-full sm:w-auto">
                <span className="font-bold text-emerald-400">fx:</span>
                <span>
                  =SUM({courseSchema.components.map((c) => `${c.name}*${c.weight}%`).join(' + ')})
                </span>
              </div>

              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama pelajar atau no matrik dalam senarai..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            </div>
          </div>

          {/* Excel Spreadsheet Table Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  {/* Excel Column Letters */}
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-mono text-[10px] text-center border-b border-slate-300 dark:border-slate-700">
                    <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-10">A</th>
                    <th className="py-1 px-3 border-r border-slate-200 dark:border-slate-700">B</th>
                    <th className="py-1 px-4 border-r border-slate-200 dark:border-slate-700 text-left">C</th>
                    <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">D</th>
                    {courseSchema.components.map((comp, idx) => (
                      <th key={comp.name} className="py-1 px-3 border-r border-slate-200 dark:border-slate-700">
                        {String.fromCharCode(69 + idx)}
                      </th>
                    ))}
                    <th className="py-1 px-3 border-r border-slate-200 dark:border-slate-700">
                      {String.fromCharCode(69 + courseSchema.components.length)}
                    </th>
                    <th className="py-1 px-3 border-r border-slate-200 dark:border-slate-700">
                      {String.fromCharCode(70 + courseSchema.components.length)}
                    </th>
                    <th className="py-1 px-3 border-r border-slate-200 dark:border-slate-700">
                      {String.fromCharCode(71 + courseSchema.components.length)}
                    </th>
                    <th className="py-1 px-3 text-center">Tindakan</th>
                  </tr>

                  {/* Real Column Headers */}
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700 text-[11px]">
                    <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">No. Matrik</th>
                    <th className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700">Nama Pelajar</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">Set</th>
                    {courseSchema.components.map((comp) => (
                      <th key={comp.name} className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center min-w-[120px]">
                        <div>{comp.name}</div>
                        <div className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">({comp.weight}%)</div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-extrabold text-indigo-700 dark:text-indigo-400">
                      Jumlah (%)
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center">Gred</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center">Nilai Mata</th>
                    <th className="py-2.5 px-3 text-center min-w-[130px]">Tindakan</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredStudents.map((st, idx) => {
                    const rowCalc = computeStudentRowGrade(st.email);
                    const userScores = excelScores[st.email.toLowerCase()] || {};

                    return (
                      <tr
                        key={st.id}
                        className={`hover:bg-amber-50/50 dark:hover:bg-slate-800/60 transition-colors ${
                          idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-850'
                        }`}
                      >
                        {/* Row Number */}
                        <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Matric Number */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-400 text-xs font-bold">
                          {st.matricNumber}
                        </td>

                        {/* Student Name */}
                        <td className="py-2 px-4 border-r border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                          <div className="truncate max-w-xs">{st.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{st.email}</div>
                        </td>

                        {/* Set */}
                        <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-center font-mono font-bold text-blue-700 dark:text-blue-400">
                          S{st.setNumber}
                        </td>

                        {/* Component Inputs Grid Cells */}
                        {courseSchema.components.map((comp) => {
                          const val = userScores[comp.name] !== undefined ? userScores[comp.name] : '';

                          return (
                            <td
                              key={comp.name}
                              className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center"
                            >
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                placeholder="—"
                                value={val}
                                onChange={(e) => {
                                  const num =
                                    e.target.value === ''
                                      ? ''
                                      : Math.min(100, Math.max(0, Number(e.target.value)));
                                  setExcelScores((prev) => ({
                                    ...prev,
                                    [st.email.toLowerCase()]: {
                                      ...(prev[st.email.toLowerCase()] || {}),
                                      [comp.name]: num,
                                    },
                                  }));
                                }}
                                className="w-20 px-2 py-1 text-center font-mono font-bold text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                              />
                            </td>
                          );
                        })}

                        {/* Live Computed Total % */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-mono font-black text-xs text-indigo-700 dark:text-indigo-400">
                          {rowCalc.totalScore !== null ? `${rowCalc.totalScore}%` : '—'}
                        </td>

                        {/* Letter Grade */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-center">
                          {rowCalc.totalScore !== null ? (
                            <span
                              className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
                                ['A', 'A-'].includes(rowCalc.letterGrade)
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : ['B+', 'B', 'B-'].includes(rowCalc.letterGrade)
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {rowCalc.letterGrade}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Grade Point */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                          {rowCalc.gradePoint !== null ? rowCalc.gradePoint.toFixed(2) : '—'}
                        </td>

                        {/* Action Buttons: Simpan & Reset Individu */}
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveStudentExcelRow(st)}
                              disabled={rowCalc.totalScore === null}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                rowCalc.totalScore !== null
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentToReset(st)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              title="Reset markah pelajar ini"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Spreadsheet Status Bar */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <div className="flex items-center gap-4">
                <span>Jumlah Pelajar Dipaparkan: <strong>{filteredStudents.length}</strong></span>
                <span>Set: <strong>{selectedSet === 'all' ? 'Semua (1-11)' : `Set ${selectedSet}`}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Diselaraskan dengan Pangkalan Data UKM
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DETAILED FORM VIEW (INDIVIDUAL SELECTION) */
        <div className="space-y-6">
          {/* Step 1: Select Student from 318 Official Roster */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  1. Pilih Pelajar (318 Pelajar Rasmi ASASIpintar)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tapis mengikut Set 1 hingga Set 11 atau cari nama/matrik.
                </p>
              </div>

              {/* Set Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedSet('all')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedSet === 'all'
                      ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Semua
                </button>
                {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSet(String(s))}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedSet === String(s)
                        ? 'bg-emerald-700 dark:bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Set {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Student Dropdown Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Pelajar:
                </label>
                <select
                  value={selectedStudentEmail}
                  onChange={(e) => setSelectedStudentEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  {filteredStudents.map((st) => (
                    <option key={st.id} value={st.email}>
                      {st.name} ({st.matricNumber}) - Set {st.setNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Student Summary Box */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {currentStudent.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Matrik: {currentStudent.matricNumber} • Set {currentStudent.setNumber}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Set {currentStudent.setNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Individual Component Mark Form */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>2. Subjek Pengajaran &amp; Markah Komponen:</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Masukkan markah komponen untuk {currentStudent.name} ({selectedCourseCode}).
                </p>
              </div>

              <select
                value={selectedCourseCode}
                onChange={(e) => setSelectedCourseCode(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                {allowedCourseCodes.map((code) => (
                  <option key={code} value={code}>
                    {code} - {COURSE_ASSESSMENT_SCHEMAS[code]?.courseName}
                  </option>
                ))}
              </select>
            </div>

            {/* Component Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {courseSchema.components.map((comp) => {
                const currentVal = componentScores[comp.name];
                return (
                  <div
                    key={comp.name}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{comp.name}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                        Wajaran: {comp.weight}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="0 - 100"
                        value={currentVal ?? ''}
                        onChange={(e) => {
                          const val =
                            e.target.value === ''
                              ? ''
                              : Math.min(100, Math.max(0, Number(e.target.value)));
                          setComponentScores((prev) => ({
                            ...prev,
                            [comp.name]: val,
                          }));
                        }}
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Summary & Save */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200/80 dark:border-emerald-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Jumlah Skor:</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {calculatedAcademic.finalScore !== null ? `${calculatedAcademic.finalScore}%` : '—'}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Gred Huruf:</div>
                  <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                    {calculatedAcademic.letterGrade ? (
                      <span>
                        Gred {calculatedAcademic.letterGrade} ({calculatedAcademic.gradePoint?.toFixed(2)} mata)
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">Menunggu kemasukan</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStudentToReset(currentStudent)}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Set Semula Markah</span>
                </button>
                <button
                  type="button"
                  disabled={calculatedAcademic.finalScore === null}
                  onClick={async () => {
                    if (calculatedAcademic.finalScore === null) return;
                    const components: AssessmentComponent[] = courseSchema.components.map((c) => ({
                      name: c.name,
                      weight: c.weight,
                      score: typeof componentScores[c.name] === 'number' ? (componentScores[c.name] as number) : 0,
                    }));

                    const gradeData: StudentCourseGrade = {
                      id: `grade-${currentStudent.matricNumber.toLowerCase()}-${selectedCourseCode.toLowerCase()}`,
                      studentId: currentStudent.id,
                      studentName: currentStudent.name,
                      studentEmail: currentStudent.email,
                      courseCode: selectedCourseCode,
                      courseName: courseSchema.courseName,
                      creditHours: courseSchema.creditHours,
                      isScience: ['PNAP0133', 'PNAP0123', 'PNAP0113'].includes(selectedCourseCode),
                      components,
                      totalScore: calculatedAcademic.finalScore,
                      letterGrade: calculatedAcademic.letterGrade || 'A',
                      gradePoint: calculatedAcademic.gradePoint ?? 4.0,
                      setNumber: currentStudent.setNumber,
                      isPublished: true,
                      updatedAt: new Date().toISOString(),
                      updatedBy: user.name,
                    };

                    if (onSaveGrade) {
                      await onSaveGrade(gradeData);
                    } else {
                      await dataService.saveStudentGrade(gradeData);
                    }
                    setStatusMessage({
                      type: 'success',
                      text: `Markah bagi ${currentStudent.name} berjaya disimpan!`,
                    });
                    setTimeout(() => setStatusMessage(null), 4000);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan &amp; Terbitkan Gred Pelajar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset All Students */}
      {isResetAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Reset Markah Keseluruhan Pelajar?
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                  Kursus: {courseSchema.courseName} ({selectedCourseCode})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Adakah anda pasti mahu menetapkan semula (RESET) markah SEMUA pelajar bagi kursus ini? Semua markah komponen bagi semua pelajar akan dikosongkan secara langsung.
            </p>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsResetAllModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmResetAllStudents}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                Ya, Reset Semua Markah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Individual Student */}
      {studentToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reset Markah Pelajar?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {studentToReset.name} ({studentToReset.matricNumber})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Adakah anda pasti mahu menetapkan semula markah bagi subjek <strong>{selectedCourseCode}</strong>? Markah pelajar ini akan dikosongkan.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStudentToReset(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmResetStudentMark}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                Ya, Reset Markah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
