import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import {
  UserProfile,
  ClassScheduleItem,
} from '../types.ts';
import {
  INITIAL_CALENDAR_EVENTS,
  UKM_ACADEMIC_ACTIVITIES_2026_2027,
  UKM_PUBLIC_HOLIDAYS_2026_2027,
} from '../data/mockData.ts';
import { dataService } from '../services/dataService.ts';
import { getSubjectDisplayName } from '../utils/subjectNames.ts';
import { getLecturerForSetAndSubject } from '../utils/lecturerSetSync.ts';
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
  const { lang, dict } = useLanguage();
  const isStudent = user.role === 'student';
  const studentSet = user.setNumber || 3;

  // Tabs & Views
  const [activeSubTab, setActiveSubTab] = useState<'timetable' | 'academic_dates'>('timetable');
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [takwimTab, setTakwimTab] = useState<'aktiviti' | 'cuti' | 'garis_masa'>('aktiviti');

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

  const getDayName = (day: string) => {
    switch (day) {
      case 'All':
        return dict.allDays;
      case 'Monday':
        return dict.monday;
      case 'Tuesday':
        return dict.tuesday;
      case 'Wednesday':
        return dict.wednesday;
      case 'Thursday':
        return dict.thursday;
      case 'Friday':
        return dict.friday;
      default:
        return day;
    }
  };

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
    { start: '17:00', end: '18:00', label: '5.00 - 6.00' },
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200/60 dark:border-indigo-800">
              {dict.officialScheduleBadge}
            </span>
            {isStudent ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                Set {studentSet}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[11px] font-bold border border-blue-200 dark:border-blue-800">
                <Layers className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                {dict.lecturerAccessAllSets}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight">
            {dict.calendarHeaderTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isStudent
              ? `Jadual kuliah, amali makmal dan tutorial rasmi bagi Set ${studentSet}.`
              : dict.calendarHeaderDescLecturer}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsLegendOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{dict.btnVenueLegend}</span>
          </button>

          {!isStudent && schedules.some((s) => s.isRescheduled) && (
            <button
              onClick={() => {
                dataService.resetSchedulesToOfficial();
                if (onRescheduleSuccess) onRescheduleSuccess();
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              title="Batalkan semua penjadualan semula dan pulihkan jadual kuliah asal UKM"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Pulihkan Jadual Kuliah Asal</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-Specific Security & Access Status Banner */}
      {!isStudent && (
        /* Lecturer Set Switcher Bar */
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">
                {dict.selectSetToDisplay}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {selectedSet === 'all'
                ? dict.allSets
                : `Set ${selectedSet}`}
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
              {dict.allSets}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('timetable')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'timetable'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {dict.weeklyTimetableTab}
          </button>
          <button
            onClick={() => setActiveSubTab('academic_dates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'academic_dates'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {dict.academicCalendarTab}
          </button>
        </div>

        {/* View Mode & Filter Controls */}
        {activeSubTab === 'timetable' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{dict.matrixView}</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{dict.cardListView}</span>
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
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {getDayName(day)}
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
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {(dict.showingSlotsCount || 'Showing {count} class slots').replace('{count}', String(displayedSchedules.length))}
                {isStudent
                  ? ` (Set ${studentSet})`
                  : selectedSet === 'all'
                  ? ` (${dict.allSets})`
                  : ` (Set ${selectedSet})`}
                {selectedDay !== 'All' ? ` • ${getDayName(selectedDay)}` : ''}
              </span>
            </div>

            {/* Subject Filter Pill */}
            <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
              <span className="text-[11px] font-medium text-slate-400">{dict.subjectFilterLabel}</span>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">{dict.allSubjects}</option>
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                      <th className="py-3 px-3 w-28 font-bold border-r border-slate-200 dark:border-slate-700 text-center">
                        {dict.filterDay} / {dict.timeSlot}
                      </th>
                      {timeSlots.map((slot) => (
                        <th
                          key={slot.start}
                          className={`py-3 px-2 font-bold text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${
                            slot.isBreak ? 'bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 w-24' : 'w-32'
                          }`}
                        >
                          <div className="text-[11px]">{slot.label}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                      .filter((d) => selectedDay === 'All' || selectedDay === d)
                      .map((day) => (
                        <tr key={day} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Day column */}
                          <td className="py-4 px-3 font-extrabold text-slate-800 dark:text-slate-200 bg-slate-50/70 dark:bg-slate-800/60 border-r border-slate-200 dark:border-slate-700 text-center">
                            <div>{getDayName(day)}</div>
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
                                  className="py-3 px-2 text-center text-slate-300 dark:text-slate-600 border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                                >
                                  -
                                </td>
                              );
                            }

                            const [startH] = classItem.startTime.split(':').map((v) => parseInt(v, 10));
                            const [endH] = classItem.endTime.split(':').map((v) => parseInt(v, 10));
                            const slotH = parseInt(slot.start.split(':')[0], 10);

                            // If this slot is after the start hour of the class, it's covered by colSpan from the start slot
                            if (slotH > startH && slotH < endH) {
                              return null;
                            }

                            const colSpan = Math.max(1, endH - startH);
                            const colorClasses = getSubjectColor(classItem.subject);

                            return (
                              <td
                                key={slot.start}
                                colSpan={colSpan}
                                className={`p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 align-top`}
                              >
                                <div
                                  className={`rounded-xl p-2.5 border transition-all h-full flex flex-col justify-between shadow-2xs ${colorClasses} ${
                                    classItem.isRescheduled ? 'ring-2 ring-amber-400' : ''
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span
                                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${getSubjectBadge(
                                          classItem.subject
                                        )}`}
                                      >
                                        {classItem.courseCode}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-1 py-0.5 rounded">
                                        {classItem.setNumber === 'all' ? 'Semua (Kuliah)' : `Set ${classItem.setNumber}`}
                                      </span>
                                    </div>
                                    <div className="font-extrabold text-[11px] leading-tight line-clamp-2">
                                      {getSubjectDisplayName(classItem.courseCode || classItem.subject, lang)}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                      <span>{classItem.startTime} - {classItem.endTime}</span>
                                    </div>
                                  </div>

                                  <div className="mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[10px] space-y-0.5">
                                    <div className="flex items-center gap-1 font-semibold truncate">
                                      <MapPin className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                      <span className="truncate">{classItem.venue}</span>
                                    </div>
                                    <div className="text-[9px] opacity-75 truncate">
                                      {getLecturerForSetAndSubject(
                                        classItem.setNumber === 'all'
                                          ? (user.setNumber || 3)
                                          : (Number(classItem.setNumber) || (user.setNumber || 3)),
                                        classItem.courseCode,
                                        classItem.subject
                                      ) || classItem.lecturerName}
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
                        {getSubjectDisplayName(sch.courseCode || sch.subject, lang)}
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
                        {getLecturerForSetAndSubject(
                          sch.setNumber === 'all'
                            ? (user.setNumber || 3)
                            : (Number(sch.setNumber) || (user.setNumber || 3)),
                          sch.courseCode,
                          sch.subject
                        ) || sch.lecturerName}
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
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{dict.noClassesFound}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {dict.subjectFilterLabel} / {dict.filterDay}
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: UKM OFFICIAL ACADEMIC DATES (TAKWIM SESI 2026/2027) */}
      {activeSubTab === 'academic_dates' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200/60 dark:border-indigo-800">
                    Lampiran B - Dokumen Rasmi UKM
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-800">
                    Sesi 2026/2027
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
                  Kalendar Sesi Akademik 2026/2027
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pusat PERMATApintar™ Negara • Program ASASI PINTAR UKM
                </p>
              </div>

              {/* Takwim sub-tabs selector */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTakwimTab('aktiviti')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    takwimTab === 'aktiviti'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Jadual Aktiviti
                </button>
                <button
                  type="button"
                  onClick={() => setTakwimTab('cuti')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    takwimTab === 'cuti'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Cuti Umum
                </button>
                <button
                  type="button"
                  onClick={() => setTakwimTab('garis_masa')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    takwimTab === 'garis_masa'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Garis Masa
                </button>
              </div>
            </div>

            {/* TAB 1: JADUAL AKTIVITI AKADEMIK */}
            {takwimTab === 'aktiviti' && (
              <div className="mt-5 space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <th className="py-3 px-4 font-bold">Aktiviti / Perkara</th>
                        <th className="py-3 px-4 font-bold">
                          Semester 1
                          <span className="block text-[10px] font-normal text-slate-500">22 Jun – 6 Dis 2026</span>
                        </th>
                        <th className="py-3 px-4 font-bold">Tempoh (Sem 1)</th>
                        <th className="py-3 px-4 font-bold">
                          Semester 2
                          <span className="block text-[10px] font-normal text-slate-500">7 Dis 2026 – 16 Mei 2027</span>
                        </th>
                        <th className="py-3 px-4 font-bold">Tempoh (Sem 2)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {UKM_ACADEMIC_ACTIVITIES_2026_2027.map((act) => {
                        const isExam = act.perkara.includes('Peperiksaan');
                        const isBreak = act.perkara.includes('Cuti');
                        return (
                          <tr
                            key={act.id}
                            className={`transition-colors ${
                              isExam
                                ? 'bg-rose-50/40 dark:bg-rose-950/20'
                                : isBreak
                                ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                {isExam && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                )}
                                {isBreak && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                )}
                                <span>{act.perkara}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {act.semester1}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {act.tempohSem1}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {act.semester2}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {act.tempohSem2}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Jadual rasmi diluluskan oleh Senat Universiti Kebangsaan Malaysia (UKM).</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">Tarikh Kuatkuasa: Jun 2026</span>
                </div>
              </div>
            )}

            {/* TAB 2: HARI KELEPASAN AM (CUTI UMUM) */}
            {takwimTab === 'cuti' && (
              <div className="mt-5 space-y-6">
                {/* Semester 1 Public Holidays */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-xs">
                      Semester 1 (Sesi 2026)
                    </span>
                    <span className="text-xs text-slate-500">22 Jun – 6 Disember 2026</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {UKM_PUBLIC_HOLIDAYS_2026_2027.filter((h) => h.semester === 1).map((hol) => (
                      <div
                        key={hol.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {hol.nama}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shrink-0">
                            {hol.hari}
                          </span>
                        </div>
                        <div className="mt-2 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {hol.tarikh}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Semester 2 Public Holidays */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                      Semester 2 (Sesi 2026/2027)
                    </span>
                    <span className="text-xs text-slate-500">7 Disember 2026 – 16 Mei 2027</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {UKM_PUBLIC_HOLIDAYS_2026_2027.filter((h) => h.semester === 2).map((hol) => (
                      <div
                        key={hol.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {hol.nama}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shrink-0">
                            {hol.hari}
                          </span>
                        </div>
                        <div className="mt-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {hol.tarikh}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GARIS MASA & TARIKH PENTING */}
            {takwimTab === 'garis_masa' && (
              <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
                {INITIAL_CALENDAR_EVENTS.map((event) => (
                  <div
                    key={event.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          event.category === 'exam'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : event.category === 'holiday'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{event.title}</span>
                          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {event.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{event.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                      {event.date} {event.endDate ? `→ ${event.endDate}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: KOD KELAS & DIREKTORI PENSYARAH */}
      {isLegendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {dict.legendModalTitle}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pusat PERMATApintar Negara • ASASIpintar UKM
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLegendOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-6 pt-4 pr-1">
              {/* Part 1: Kod Kelas (Venues) */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {dict.venueLegendTitle}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {VENUE_CODES.map((item) => (
                    <div
                      key={item.code}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2"
                    >
                      <span className="font-mono font-extrabold text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 shrink-0 text-[10px]">
                        {item.code}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">{item.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part 2: Direktori Pensyarah & Emel */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {dict.lecturersDirectoryTitle}
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                  {FACULTY_LECTURERS.map((lec) => (
                    <div
                      key={lec.email}
                      className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{lec.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{lec.dept}</div>
                      </div>
                      <a
                        href={`mailto:${lec.email}`}
                        className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline shrink-0"
                      >
                        {lec.email}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsLegendOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 cursor-pointer"
              >
                {dict.cancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LECTURER RESCHEDULE CLASS */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{dict.rescheduleModalTitle}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {dict.liveDispatchDesc}
                </p>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.btnRescheduleClass}
                </label>
                <select
                  required
                  value={selectedScheduleId ?? ''}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- {dict.selectSetToDisplay} --</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject} ({s.courseCode}) • Set {s.setNumber} • {getDayName(s.day)} {s.startTime}-{s.endTime}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {dict.newTime}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tuesday 09:00 - 11:00"
                    value={newTime ?? ''}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {dict.newVenue}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: MF 2 (Makmal Fizik 2)"
                    value={newVenue ?? ''}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.reasonForReschedule}
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={dict.rescheduleReasonPlaceholder}
                  value={rescheduleReason ?? ''}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {dict.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? '...' : dict.confirmRescheduleBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
