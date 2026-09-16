import React, { useState } from 'react';
import { UserProfile, StudentRosterItem } from '../types.ts';
import { STUDENTS_ROSTER } from '../data/mockData.ts';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60">
              Lecturer Administration
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Cohort 2024/2025 (~300 Students across 11 Sets)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Comprehensive Student Roster & Cohort Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full enrollment registry allowing course lecturers to inspect student assignments, sets, matriculation records, and GPA standing.
          </p>
        </div>

        <button
          onClick={() => alert('Exporting full 300 student cohort roster (CSV format)...')}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Cohort CSV</span>
        </button>
      </div>

      {/* 11 Sets Filter Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Filter by Set
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedSet('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedSet === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Sets (Total ~300)
          </button>
          {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSet(String(s))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedSet === String(s)
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Set {s}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, matric number (e.g. AP05710), or @siswa.ukm.edu.my email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            Showing {filteredStudents.length} Students{' '}
            {selectedSet !== 'all' ? `in Set ${selectedSet}` : 'across all sets'}
          </span>
          <span className="text-slate-400">Institutional Domain: @siswa.ukm.edu.my</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-3 px-4">Student Name & Matric</th>
                <th className="py-3 px-4">Set</th>
                <th className="py-3 px-4">Institutional Email</th>
                <th className="py-3 px-4">Current CGPA</th>
                <th className="py-3 px-4">Koko Marks</th>
                <th className="py-3 px-4">Academic Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{st.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{st.matricNumber}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                      Set {st.setNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    {st.email}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span
                      className={`${
                        st.cgpa >= 3.67 ? 'text-emerald-700 font-extrabold' : 'text-slate-800'
                      }`}
                    >
                      {st.cgpa.toFixed(2)}
                    </span>
                    {st.cgpa >= 3.67 && (
                      <span className="text-[10px] text-emerald-600 ml-1 font-semibold">
                        (Dean's)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">{st.kokoMarks}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({st.kokoGrade})</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {st.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={`mailto:${st.email}`}
                      className="p-1.5 inline-block rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Send institutional email"
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
