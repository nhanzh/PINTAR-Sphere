import React, { useState } from 'react';
import { UserProfile, StudentRosterItem } from '../types.ts';
import { STUDENTS_ROSTER } from '../data/mockData.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Award,
  Mail,
  Download,
  ChevronRight,
} from 'lucide-react';

interface StudentRosterViewProps {
  user: UserProfile;
}

export const StudentRosterView: React.FC<StudentRosterViewProps> = ({ user }) => {
  const { lang, dict } = useLanguage();
  const [selectedSet, setSelectedSet] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = STUDENTS_ROSTER.filter((st) => {
    if (selectedSet !== 'all' && st.setNumber !== Number(selectedSet)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = st.name.toLowerCase().includes(q);
      const matchMatric = st.matricNumber.toLowerCase().includes(q);
      const matchEmail = st.email.toLowerCase().includes(q);
      if (!matchName && !matchMatric && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-800">
              {dict.roleLecturer}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Cohort 2024/2025 (~300 Students across 11 Sets)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            {dict.cohortRosterTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.cohortRosterDesc}
          </p>
        </div>

        <button
          onClick={() => alert('Exporting full 300 student cohort roster (CSV format)...')}
          className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400 dark:text-white" />
          <span>{dict.exportCohortCsv}</span>
        </button>
      </div>

      {/* 11 Sets Filter Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          {dict.filterBySet}
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedSet('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedSet === 'all'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {dict.allSetsTotal}
          </button>
          {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSet(String(s))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSet === String(s)
                  ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Set {s}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={dict.searchRosterPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {(dict.showingStudentsCount || 'Showing {count} students').replace('{count}', String(filteredStudents.length))}{' '}
            {selectedSet !== 'all' ? `in Set ${selectedSet}` : 'across all sets'}
          </span>
          <span className="text-slate-400 dark:text-slate-500">Institutional Domain: @siswa.ukm.edu.my</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <th className="py-3 px-4">{dict.thStudentNameEmail}</th>
                <th className="py-3 px-4">{dict.thSet}</th>
                <th className="py-3 px-4">{dict.thInstitutionalEmail}</th>
                <th className="py-3 px-4">{dict.thCurrentCgpa}</th>
                <th className="py-3 px-4">{dict.thKokoScore}</th>
                <th className="py-3 px-4">{dict.thAcademicStatus}</th>
                <th className="py-3 px-4 text-right">{dict.thAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{st.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{st.matricNumber}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 font-mono">
                      Set {st.setNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    {st.email}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {st.cgpa !== null && st.cgpa !== undefined ? (
                      <>
                        <span
                          className={`${
                            st.cgpa >= 3.67
                              ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {Number(st.cgpa).toFixed(2)}
                        </span>
                        {st.cgpa >= 3.67 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1 font-semibold">
                            ({dict.deansList || 'Anugerah Dekan'})
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 font-normal text-xs">— (Sem 1)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {st.kokoMarks !== null && st.kokoMarks !== undefined ? (
                      <>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{st.kokoMarks}</span>
                        {st.kokoGrade && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                            ({st.kokoGrade})
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs">— / 10%</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      {st.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={`mailto:${st.email}`}
                      className="p-1.5 inline-block rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                      title="Send email"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
