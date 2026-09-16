import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  ClassScheduleItem,
} from '../types.ts';
import { INITIAL_CALENDAR_EVENTS } from '../data/mockData.ts';
import { dataService } from '../services/dataService.ts';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlertCircle,
  RefreshCw,
  X,
  Send,
  Lock,
  Layers,
  Info,
  Grid,
  List,
  CheckCircle2,
  Mail,
  Filter,
} from 'lucide-react';

interface CalendarViewProps {
  user: UserProfile;
  schedules: ClassScheduleItem[];
  onRescheduleSuccess?: () => void;
}

// Official Venue Legend from Page 5 of UKM document
const VENUE_CODES = [
  { code: 'BGP', name: 'Bilik Gerakan Pelajar', desc: 'Bilik Gerakan & Aktiviti' },
  { code: 'MB 1', name: 'Makmal Biologi 1', desc: 'Makmal Sains Hayat Aras Bawah' },
  { code: 'MB 2', name: 'Makmal Biologi 2', desc: 'Makmal Sains Hayat Aras 1' },
  { code: 'MK 1', name: 'Makmal Kimia 1', desc: 'Makmal Analitikal Kimia Aras Bawah' },
  { code: 'MK 2', name: 'Makmal Kimia 2', desc: 'Makmal Sintesis Kimia Aras 1' },
  { code: 'MF 1', name: 'Makmal Fizik 1', desc: 'Makmal Mekanik & Instrumentasi 1' },
  { code: 'MF 2', name: 'Makmal Fizik 2', desc: 'Makmal Optik & Laser Fizik 2' },
  { code: 'K1', name: 'Kelas 1 Fasa 2', desc: 'Bilik Kuliah/Tutorial K1' },
  { code: 'K2', name: 'Kelas 2 Fasa 2', desc: 'Bilik Kuliah/Tutorial K2' },
  { code: 'K3', name: 'Kelas 3 Fasa 3', desc: 'Bilik Kuliah/Tutorial K3' },
  { code: 'K4', name: 'Kelas 3 Fasa 4', desc: 'Bilik Kuliah/Tutorial K4' },
  { code: 'AUDITORIUM', name: 'Auditorium Pusat PERMATApintar', desc: 'Dewan Kuliah Perdana (Semua Set)' },
  { code: 'MAKMAL SENI', name: 'Makmal Seni', desc: 'Ruang Kolaborasi & Projek Penyelidikan' },
];

// Official Faculty Lecturers Directory from Page 15 & 25 of UKM document
const FACULTY_LECTURERS = [
  { name: 'PM Dr. Chin Siew Xian', email: 'chinsiewxian@ukm.edu.my', dept: 'Chemistry' },
  { name: 'Dr. Teh Chin Hoong', email: 'chteh@ukm.edu.my', dept: 'Chemistry' },
  { name: 'Dr. Nurulhaidah Daud', email: 'nurulhaidah@ukm.edu.my', dept: 'Chemistry' },
  { name: 'Dr. Premanarayani Menon A/P Narayanan Nair', email: 'premamenon@ukm.edu.my', dept: 'Chemistry / Research' },
  { name: 'Dr. Suganthy A/P Kanapathy', email: 'sugantyk@ukm.edu.my', dept: 'Chemistry / Research' },
  { name: 'Dr. Ikhwan bin Zakaria', email: 'ikhwanz@ukm.edu.my', dept: 'Biology' },
  { name: 'Dr. Siew Ee Ling', email: 'sieweeling@ukm.edu.my', dept: 'Biology' },
  { name: 'Dr. Mona Fatin Syazwanee Mohamed Ghazali', email: 'monafatin@ukm.edu.my', dept: 'Biology' },
  { name: 'Ms. Nurulnisa binti Nor Azman', email: 'nurulnisa@ukm.edu.my', dept: 'Biology' },
  { name: 'Dr. Nor Azah binti Nik Jaafar', email: 'norazah_nj@ukm.edu.my', dept: 'Physics' },
  { name: 'Dr. Nor Farhah binti Razak', email: 'nfarhah@ukm.edu.my', dept: 'Physics' },
  { name: 'Dr. Nurul Izzah binti Mukri', email: 'nurulmukri@ukm.edu.my', dept: 'Physics' },
  { name: 'Mr. Muhammad Afiq Dzuan Mohd Azhar', email: 'afiqdzuan@ukm.edu.my', dept: 'Physics' },
  { name: 'Dr. Normahirah binti Nek Abdul Rahman', email: 'normahirah@ukm.edu.my', dept: 'Logical Reasoning' },
  { name: 'Mr. Mohd Hafizul Azrie Othman', email: 'mhao@ukm.edu.my', dept: 'Logical Reasoning' },
  { name: 'Ms. Nur Shamim binti Hamzah', email: 'nurshamim@ukm.edu.my', dept: 'Logical Reasoning' },
  { name: 'Ms. Nur Nadiah binti Lani', email: 'nadiah_lani@ukm.edu.my', dept: 'Statistics' },
  { name: 'Ms. Ain Afiqah Aminuddin', email: 'ainafiqah@ukm.edu.my', dept: 'Statistics' },
  { name: 'Ms. Nurul Ain Salehuddin Haqe', email: 'ainhaqe@ukm.edu.my', dept: 'Statistics' },
  { name: 'Ms. Siti Nurathirah Nazirah Salikin', email: 'athirahnazirah@ukm.edu.my', dept: 'Language & Literary Appreciation' },
  { name: 'Ms. Erdani Sofea binti Ahmad Syar’e', email: 'sofeasyare@ukm.edu.my', dept: 'Language & Literary Appreciation' },
  { name: 'Ms. Farah Fardillah binti Ariff', email: 'farahfariff@ukm.edu.my', dept: 'Research Skills' },
  { name: "PM To' Puan Dr. Tengku Elmi Azlina Tengku Muda", email: 'elmiazlina@ukm.edu.my', dept: 'Jati Diri' },
  { name: 'Ms. Suhaina binti Yaakob', email: 'suhainaymd@ukm.edu.my', dept: 'Jati Diri / Research Skills' },
];

// Color mapping matching UKM timetable document
function getSubjectColor(subject: string) {
  const s = subject.toLowerCase();
  if (s.includes('chem')) {
    return 'bg-purple-50 text-purple-950 border-purple-300 ring-purple-200/50';
  }
  if (s.includes('bio')) {
    return 'bg-pink-50 text-pink-950 border-pink-300 ring-pink-200/50';
  }
  if (s.includes('phys')) {
    return 'bg-sky-50 text-sky-950 border-sky-300 ring-sky-200/50';
  }
  if (s.includes('stat')) {
    return 'bg-amber-50 text-amber-950 border-amber-300 ring-amber-200/50';
  }
  if (s.includes('logic') || s.includes('mantik') || s.includes('reason')) {
    return 'bg-rose-50 text-rose-950 border-rose-300 ring-rose-200/50';
  }
  if (s.includes('literary') || s.includes('appreciation') || s.includes('lla')) {
    return 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-emerald-200/50';
  }
  if (s.includes('research')) {
    return 'bg-fuchsia-50 text-fuchsia-950 border-fuchsia-300 ring-fuchsia-200/50';
  }
  if (s.includes('jati')) {
    return 'bg-lime-50 text-lime-950 border-lime-300 ring-lime-200/50';
  }
  return 'bg-slate-50 text-slate-900 border-slate-200 ring-slate-100';
}

function getSubjectBadge(subject: string) {
  const s = subject.toLowerCase();
  if (s.includes('chem')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (s.includes('bio')) return 'bg-pink-100 text-pink-800 border-pink-200';
  if (s.includes('phys')) return 'bg-sky-100 text-sky-800 border-sky-200';
  if (s.includes('stat')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (s.includes('logic') || s.includes('mantik')) return 'bg-rose-100 text-rose-800 border-rose-200';
  if (s.includes('lla') || s.includes('literary')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (s.includes('research')) return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200';
  if (s.includes('jati')) return 'bg-lime-100 text-lime-800 border-lime-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  user,
  schedules,
  onRescheduleSuccess,
}) => {
  const isStudent = user.role === 'student';
  const studentSet = user.setNumber || 3;

  // Tabs & Views
  const [activeSubTab, setActiveSubTab] = useState<'timetable' | 'academic_dates'>('timetable');
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');

  // Lecturer Set Selector: if student, strictly locked to studentSet (Set 3)
  // If lecturer: can pick 'all' or any Set 1 through 11
  const [selectedSet, setSelectedSet] = useState<number | 'all'>(isStudent ? studentSet : 'all');
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');

  // Legend & Directory Modal
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Reschedule Modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [newTime, setNewTime] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Days of week
  const daysOfWeek = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // All 11 Sets for Lecturer Toolbar
  const allSets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // Time slots for Matrix View
  const timeSlots = [
    { start: '08:00', end: '09:00', label: '8.00 - 9.00' },
    { start: '09:00', end: '10:00', label: '9.00 - 10.00' },
    { start: '10:00', end: '11:00', label: '10.00 - 11.00' },
    { start: '11:00', end: '12:00', label: '11.00 - 12.00' },
    { start: '12:00', end: '13:00', label: '12.00 - 1.00' },
    { start: '13:00', end: '14:00', label: '1.00 - 2.00 (REHAT)', isBreak: true },
    { start: '14:00', end: '15:00', label: '2.00 - 3.00' },
    { start: '15:00', end: '16:00', label: '3.00 - 4.00' },
    { start: '16:00', end: '17:00', label: '4.00 - 5.00' },
  ];

  // Filter schedules strictly by Role & Selection
  const displayedSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      // RULE: If student is Set 3 (or user's set), strictly only see their set or common auditorium lectures
      if (isStudent) {
        if (sch.setNumber !== 'all' && sch.setNumber !== studentSet) {
          return false;
        }
      } else {
        // Lecturer viewing:
        if (selectedSet !== 'all') {
          if (sch.setNumber !== 'all' && sch.setNumber !== selectedSet) {
            return false;
          }
        }
      }

      // Day filter
      if (selectedDay !== 'All' && sch.day !== selectedDay) {
        return false;
      }

      // Subject filter
      if (selectedSubjectFilter !== 'All') {
        if (!sch.subject.toLowerCase().includes(selectedSubjectFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [schedules, isStudent, studentSet, selectedSet, selectedDay, selectedSubjectFilter]);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId || !newTime.trim() || !newVenue.trim()) return;

    setIsSubmitting(true);
    await dataService.rescheduleClass(
      selectedScheduleId,
      newTime.trim(),
      newVenue.trim(),
      rescheduleReason.trim() || 'Official faculty class rescheduling notice.'
    );

    setIsSubmitting(false);
    setRescheduleModalOpen(false);
    setSelectedScheduleId('');
    setNewTime('');
    setNewVenue('');
    setRescheduleReason('');
    if (onRescheduleSuccess) onRescheduleSuccess();
  };

  // Matrix lookup: find schedule item active on a given day & hour
  const findClassAtSlot = (day: string, slotStart: string) => {
    const slotHour = parseInt(slotStart.split(':')[0], 10);
    return displayedSchedules.find((sch) => {
      if (sch.day !== day) return false;
      const [startH] = sch.startTime.split(':').map((v) => parseInt(v, 10));
      const [endH] = sch.endTime.split(':').map((v) => parseInt(v, 10));
      return slotHour >= startH && slotHour < endH;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60">
              Jadual Rasmi ASASIpintar UKM Sesi 2026/2027
            </span>
            {isStudent ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-600" />
                Akses Pelajar: Set {studentSet} Sahaja
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                <Layers className="w-3 h-3 text-blue-600" />
                Akses Pensyarah: Kawalan Penuh Semua Set (1 - 11)
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
            Jadual Waktu Kuliah & Takwim Akademik
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isStudent
              ? `Jadual kuliah, makmal, dan tutorial yang dikhaskan secara automatik untuk Set ${studentSet}.`
              : 'Pantau dan urus jadual kuliah, makmal serta penjadualan semula untuk kesemua 11 Set ASASIpintar.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsLegendOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Kod Bilik & Direktori</span>
          </button>

          {!isStudent && (
            <button
              onClick={() => setRescheduleModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Jadual Semula Kelas</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-Specific Security & Access Status Banner */}
      {isStudent ? (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950">
                Penyelarasan Hak Akses: Set {studentSet} Ditetapkan
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Berdasarkan nombor matrik anda, jadual dipaparkan secara khusus untuk{' '}
                <strong>Set {studentSet}</strong> berserta kuliah perdana auditorium (Semua Set). Anda tidak boleh mengakses set lain.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center px-2.5 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-[10px] font-black uppercase tracking-wider border border-emerald-300">
            Akses Terkunci Set {studentSet}
          </span>
        </div>
      ) : (
        /* Lecturer Set Switcher Bar */
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">
                Pilih Set Kuliah untuk Dipaparkan (Pensyarah):
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {selectedSet === 'all'
                ? 'Memaparkan jadual kuliah semua set serentak'
                : `Menapis paparan jadual bagi Set ${selectedSet} sahaja`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedSet('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSet === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Semua Set (1 - 11)
            </button>
            {allSets.map((num) => (
              <button
                key={num}
                onClick={() => setSelectedSet(num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedSet === num
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Set {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Tabs (Weekly Timetable vs Academic Calendar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('timetable')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'timetable'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Jadual Waktu Kuliah Mingguan
          </button>
          <button
            onClick={() => setActiveSubTab('academic_dates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'academic_dates'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Takwim Akademik ASASIpintar 2026/2027
          </button>
        </div>

        {/* View Mode & Filter Controls */}
        {activeSubTab === 'timetable' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Matriks Jadual</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Senarai Kad</span>
              </button>
            </div>

            {/* Day Selector */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedDay === day
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {day === 'All' ? 'Semua Hari' : day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: WEEKLY CLASS TIMETABLE */}
      {activeSubTab === 'timetable' && (
        <div className="space-y-4">
          {/* Quick Filter Info Strip */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Menunjukkan <strong>{displayedSchedules.length}</strong> slot kuliah/makmal
                {isStudent
                  ? ` (Set ${studentSet})`
                  : selectedSet === 'all'
                  ? ' (Semua Set 1 - 11)'
                  : ` (Set ${selectedSet})`}
                {selectedDay !== 'All' ? ` • Hari ${selectedDay}` : ''}
              </span>
            </div>

            {/* Subject Filter Pill */}
            <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
              <span className="text-[11px] font-medium text-slate-400">Subjek:</span>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">Semua Subjek</option>
                <option value="Chemistry">Kimia (Chemistry)</option>
                <option value="Physics">Fizik (Physics)</option>
                <option value="Biology">Biologi (Biology)</option>
                <option value="Statistics">Statistik (Statistics)</option>
                <option value="Logical">Penaakulan Mantik</option>
                <option value="Language">LLA (Apresiasi Sastera)</option>
                <option value="Research">Research Skills</option>
                <option value="Jati Diri">Jati Diri</option>
              </select>
            </div>
          </div>

          {/* MODE A: MATRIX TIMETABLE VIEW (Matches UKM PDF!) */}
          {viewMode === 'matrix' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                      <th className="py-3 px-3 w-28 font-bold border-r border-slate-200 text-center">
                        Hari / Masa
                      </th>
                      {timeSlots.map((slot) => (
                        <th
                          key={slot.start}
                          className={`py-3 px-2 font-bold text-center border-r border-slate-200 last:border-r-0 ${
                            slot.isBreak ? 'bg-amber-50/60 text-amber-900 w-24' : 'w-32'
                          }`}
                        >
                          <div className="text-[11px]">{slot.label}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                      .filter((d) => selectedDay === 'All' || selectedDay === d)
                      .map((day) => (
                        <tr key={day} className="hover:bg-slate-50/40 transition-colors">
                          {/* Day column */}
                          <td className="py-4 px-3 font-extrabold text-slate-800 bg-slate-50/70 border-r border-slate-200 text-center">
                            <div>{day}</div>
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {day === 'Monday' && 'Isnin'}
                              {day === 'Tuesday' && 'Selasa'}
                              {day === 'Wednesday' && 'Rabu'}
                              {day === 'Thursday' && 'Khamis'}
                              {day === 'Friday' && 'Jumaat'}
                            </div>
                          </td>

                          {/* Time slots */}
                          {timeSlots.map((slot) => {
                            if (slot.isBreak) {
                              return (
                                <td
                                  key={slot.start}
                                  className="py-3 px-2 bg-amber-50/40 text-center border-r border-slate-200"
                                >
                                  <span className="text-[10px] font-black text-amber-800 tracking-wider">
                                    REHAT
                                  </span>
                                </td>
                              );
                            }

                            const classItem = findClassAtSlot(day, slot.start);

                            if (!classItem) {
                              return (
                                <td
                                  key={slot.start}
                                  className="py-3 px-2 text-center text-slate-300 border-r border-slate-200 last:border-r-0"
                                >
                                  -
                                </td>
                              );
                            }

                            const colorClasses = getSubjectColor(classItem.subject);

                            return (
                              <td
                                key={slot.start}
                                className={`p-2 border-r border-slate-200 last:border-r-0 align-top`}
                              >
                                <div
                                  className={`rounded-xl p-2.5 border transition-all h-full flex flex-col justify-between shadow-2xs ${colorClasses} ${
                                    classItem.isRescheduled ? 'ring-2 ring-amber-400' : ''
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span
                                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${getSubjectBadge(
                                          classItem.subject
                                        )}`}
                                      >
                                        {classItem.courseCode}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-600 bg-white/80 px-1 py-0.2 rounded">
                                        Set {classItem.setNumber}
                                      </span>
                                    </div>
                                    <div className="font-extrabold text-[11px] leading-tight line-clamp-2">
                                      {classItem.subject}
                                    </div>
                                  </div>

                                  <div className="mt-2 pt-1 border-t border-black/5 text-[10px] space-y-0.5">
                                    <div className="flex items-center gap-1 font-semibold truncate">
                                      <MapPin className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                      <span className="truncate">{classItem.venue}</span>
                                    </div>
                                    <div className="text-[9px] opacity-75 truncate">
                                      {classItem.lecturerName}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODE B: CARDS LIST VIEW */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedSchedules.map((sch) => {
                const colorClasses = getSubjectColor(sch.subject);
                return (
                  <div
                    key={sch.id}
                    className={`rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                      sch.isRescheduled
                        ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/40 shadow-xs'
                        : `${colorClasses} bg-white shadow-xs hover:shadow-sm`
                    }`}
                  >
                    {/* Rescheduled Notice */}
                    {sch.isRescheduled && (
                      <div className="mb-3 p-2.5 rounded-xl bg-amber-100 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-extrabold uppercase text-[10px] tracking-wider text-amber-800">
                            Jadual Semula oleh Pensyarah
                          </div>
                          <div className="text-[11px] font-medium mt-0.5">
                            {sch.rescheduleNotice?.reason}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${getSubjectBadge(
                            sch.subject
                          )}`}
                        >
                          {sch.courseCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {sch.day}
                          </span>
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
                            Set {sch.setNumber}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-2.5">
                        {sch.subject}
                      </h3>

                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-semibold">
                            {sch.isRescheduled ? (
                              <span>
                                <span className="line-through text-slate-400 mr-1.5">
                                  {sch.startTime} - {sch.endTime}
                                </span>
                                <strong className="text-amber-800">
                                  {sch.rescheduleNotice?.newTime}
                                </strong>
                              </span>
                            ) : (
                              `${sch.startTime} - ${sch.endTime}`
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-medium">
                            {sch.isRescheduled ? (
                              <span>
                                <span className="line-through text-slate-400 mr-1.5">
                                  {sch.venue}
                                </span>
                                <strong className="text-amber-800">
                                  {sch.rescheduleNotice?.newVenue}
                                </strong>
                              </span>
                            ) : (
                              sch.venue
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="truncate max-w-[200px] font-medium text-slate-600">
                        {sch.lecturerName}
                      </span>
                      {sch.lecturerEmail && (
                        <a
                          href={`mailto:${sch.lecturerEmail}`}
                          className="text-indigo-600 hover:text-indigo-800"
                          title={sch.lecturerEmail}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {displayedSchedules.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Tiada kelas ditemui</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sila pilih hari atau tetapkan semula penapis anda.
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: UKM OFFICIAL ACADEMIC DATES */}
      {activeSubTab === 'academic_dates' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Takwim Akademik ASASIpintar UKM 2026/2027
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Minggu perkuliahan, cuti pertengahan semester, dan sesi peperiksaan rasmi UKM
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
              Semester I
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {INITIAL_CALENDAR_EVENTS.map((event) => (
              <div
                key={event.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      event.category === 'exam'
                        ? 'bg-rose-100 text-rose-700'
                        : event.category === 'holiday'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{event.title}</span>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {event.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 text-xs font-mono font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  {event.date} {event.endDate ? `hingga ${event.endDate}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: KOD KELAS & DIREKTORI PENSYARAH */}
      {isLegendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Kod Kelas & Direktori Pensyarah
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Berdasarkan Dokumen Rasmi Jadual Waktu ASASIpintar UKM 2026/2027
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLegendOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-6 pt-4 pr-1">
              {/* Part 1: Kod Kelas (Venues) */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Senarai Kod Bilik & Makmal (Page 5)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {VENUE_CODES.map((item) => (
                    <div
                      key={item.code}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2"
                    >
                      <span className="font-mono font-extrabold text-indigo-700 px-1.5 py-0.5 rounded bg-indigo-100 shrink-0 text-[10px]">
                        {item.code}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 leading-tight">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part 2: Direktori Pensyarah & Emel */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Direktori Pensyarah & Emel Rasmi (Page 15 & 25)
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {FACULTY_LECTURERS.map((lec) => (
                    <div
                      key={lec.email}
                      className="p-2.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{lec.name}</div>
                        <div className="text-[10px] text-slate-500">{lec.dept}</div>
                      </div>
                      <a
                        href={`mailto:${lec.email}`}
                        className="font-mono text-[11px] text-indigo-600 hover:text-indigo-800 underline shrink-0"
                      >
                        {lec.email}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsLegendOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LECTURER RESCHEDULE CLASS */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Jadual Semula Kelas Kuliah/Makmal</h2>
                <p className="text-xs text-slate-500">
                  Notis pertukaran waktu dan bilik akan dihantar secara langsung ke papan pemuka pelajar
                </p>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Kelas untuk Dijadual Semula
                </label>
                <select
                  required
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="">-- Pilih Sesi Kelas --</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject} ({s.courseCode}) • Set {s.setNumber} • {s.day} {s.startTime}-{s.endTime}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waktu & Hari Baru
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tuesday 09:00 - 11:00"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bilik / Makmal / Dewan Baru
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: MF 2 (Makmal Fizik 2)"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sebab & Kenyataan Rasmi kepada Pelajar
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Nyatakan sebab pertukaran (contoh: Penentukuran alat makmal, penyertaan simposium penyelidikan)..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Mengemaskini...' : 'Siarkan Notis Jadual Semula'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
