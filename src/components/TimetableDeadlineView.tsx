import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  DeadlineItem,
  SubmissionRecord,
  PersonalTimetableNote,
  ClassScheduleItem,
} from '../types.ts';
import { dataService } from '../services/dataService.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import {
  OFFICIAL_UKM_CALENDAR_EVENTS,
  UKM_PUBLIC_HOLIDAYS_2026_2027,
} from '../data/ukmData2026.ts';
import { SUBJECTS } from '../data/mockData.ts';
import { getSubjectDisplayName } from '../utils/subjectNames.ts';
import { getLecturerForSetAndSubject } from '../utils/lecturerSetSync.ts';
import { openOrDownloadSubmissionFile } from '../utils/fileUtils.ts';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Lock,
  X,
  Send,
  UploadCloud,
  Eye,
  Trash2,
  Users,
  Check,
  Tag,
  BookOpen,
  Sparkles,
  MapPin,
  CalendarDays,
  CalendarRange,
  ListFilter,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';

interface TimetableDeadlineViewProps {
  user: UserProfile;
  deadlines: DeadlineItem[];
  submissions: SubmissionRecord[];
  privateNotes: PersonalTimetableNote[];
  schedules?: ClassScheduleItem[];
  onRefreshData?: () => void;
}

const MONTH_NAMES_MY = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

const DAY_NAMES_MY = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];

export const TimetableDeadlineView: React.FC<TimetableDeadlineViewProps> = ({
  user,
  deadlines,
  submissions,
  privateNotes,
  schedules = [],
  onRefreshData,
}) => {
  const { lang, dict } = useLanguage();
  const isStudent = user.role === 'student';
  const studentSet = user.setNumber || 3;

  // Active view: 'month' | 'week' | 'list'
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

  // Calendar anchor date (defaults to current date, or September 2026 academic semester)
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    // Default to Sept 2026 if in prototype/future academic calendar range
    if (now.getFullYear() < 2026) {
      return new Date(2026, 8, 24); // 24 Sept 2026
    }
    return now;
  });

  // Filter category (no classes - classes belong to Academic Calendar)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'all' | 'deadlines' | 'academic' | 'holidays' | 'notes'
  >('all');

  // Day detail popover/modal
  const [selectedDateDetails, setSelectedDateDetails] = useState<string | null>(null);

  // Student Submission Modal State
  const [selectedDeadline, setSelectedDeadline] = useState<DeadlineItem | null>(null);
  const [submissionFileName, setSubmissionFileName] = useState('');
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionFileObj, setSubmissionFileObj] = useState<{ name: string; size: string; dataUrl?: string } | null>(null);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Delete Deadline Modal State
  const [deadlineToDelete, setDeadlineToDelete] = useState<DeadlineItem | null>(null);

  // Student Private Note Modal State
  // Flow: Add personal note -> task name -> subject -> due date -> priority (low/med/high) -> save note
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteTaskName, setNoteTaskName] = useState('');
  const [noteSubject, setNoteSubject] = useState('Chemistry I (PNAP0133)');
  const [noteDueDate, setNoteDueDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [notePriority, setNotePriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Lecturer Create Deadline Modal State
  const [isCreateDeadlineOpen, setIsCreateDeadlineOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'assignment' | 'quiz' | 'presentation'>('assignment');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [targetSetMode, setTargetSetMode] = useState<'all' | 'specific'>('all');
  const [selectedTargetSets, setSelectedTargetSets] = useState<string[]>(['Set 3']);
  const [isCreatingDeadline, setIsCreatingDeadline] = useState(false);

  // Filter deadlines for student
  const filteredDeadlines = useMemo(() => {
    return deadlines.filter((d) => {
      if (isStudent) {
        return (
          d.targetSets.includes('all') ||
          d.targetSets.includes(`Set ${studentSet}`) ||
          d.targetSets.some((s) => s.toLowerCase().includes(String(studentSet)))
        );
      }
      return true;
    });
  }, [deadlines, isStudent, studentSet]);

  // Filter student's class schedules (Set 3 or all)
  const studentSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (isStudent) {
        return s.setNumber === studentSet || s.setNumber === 'all';
      }
      return true;
    });
  }, [schedules, isStudent, studentSet]);

  // Helper date formatting: YYYY-MM-DD
  const formatYMD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Convert weekday name to 0-6 index (Monday=0 ... Sunday=6)
  const getDayOfWeekIdx = (dayName: string): number => {
    const map: Record<string, number> = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
      Saturday: 5,
      Sunday: 6,
      Isnin: 0,
      Selasa: 1,
      Rabu: 2,
      Khamis: 3,
      Jumaat: 4,
      Sabtu: 5,
      Ahad: 6,
    };
    return map[dayName] ?? -1;
  };

  // Date Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      const nextD = new Date(currentDate);
      nextD.setDate(currentDate.getDate() - 7);
      setCurrentDate(nextD);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      const nextD = new Date(currentDate);
      nextD.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextD);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 24));
  };

  // Student Work Submission & Auto-Mark As Done
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeadline || !submissionFileName.trim()) return;

    setIsSubmittingWork(true);
    await dataService.submitWork(
      selectedDeadline.id,
      user.matricNumber || 'AP05710',
      user.name,
      user.email,
      studentSet,
      selectedDeadline.dueDate,
      submissionFileName.trim(),
      submissionNote.trim(),
      submissionFileObj?.dataUrl
    );

    setIsSubmittingWork(false);
    setSelectedDeadline(null);
    setSubmissionFileName('');
    setSubmissionNote('');
    setSubmissionFileObj(null);
    if (onRefreshData) onRefreshData();
  };

  // Student Delete Submission (To Re-upload & Clear Marked As Done status)
  const handleDeleteSubmission = async (submissionId: string, deadlineId?: string) => {
    if (window.confirm('Adakah anda pasti mahu memadam fail tugasan ini untuk memuat naik semula? Status Selesai (Marked as Done) akan dibatalkan.')) {
      await dataService.deleteSubmission(submissionId, deadlineId || selectedDeadline?.id, user.email);
      setSubmissionFileName('');
      setSubmissionNote('');
      setSubmissionFileObj(null);
      if (onRefreshData) onRefreshData();
    }
  };

  // Lecturer Delete Entire Deadline
  const handleConfirmDeleteDeadline = async (dlItem: DeadlineItem) => {
    await dataService.deleteDeadline(dlItem.id);
    setDeadlineToDelete(null);
    if (selectedDeadline?.id === dlItem.id) {
      setSelectedDeadline(null);
    }
    if (onRefreshData) onRefreshData();
  };

  const handleOpenStudentFile = (sub: SubmissionRecord) => {
    openOrDownloadSubmissionFile(sub);
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const sizeStr = f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`;
      const reader = new FileReader();
      reader.onload = () => {
        setSubmissionFileObj({ name: f.name, size: sizeStr, dataUrl: reader.result as string });
        setSubmissionFileName(f.name);
      };
      reader.readAsDataURL(f);
    }
  };

  // Add Private Note
  const handleAddPrivateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTaskName.trim()) return;

    dataService.addPrivateNote({
      studentEmail: user.email,
      title: noteTaskName.trim(),
      subject: noteSubject,
      date: noteDueDate,
      time: '23:59',
      priority: notePriority,
      isDone: false,
      content: `${noteSubject} • Prioriti: ${notePriority.toUpperCase()}`,
      color: notePriority === 'high' ? '#E11D48' : notePriority === 'medium' ? '#F59E0B' : '#10B981',
    });

    setIsNoteModalOpen(false);
    setNoteTaskName('');
    setNotePriority('medium');
    if (onRefreshData) onRefreshData();
  };

  const handleToggleNoteDone = (id: string) => {
    dataService.toggleNoteDone(id);
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteNote = (id: string) => {
    dataService.deletePrivateNote(id);
    if (onRefreshData) onRefreshData();
  };

  // Lecturer Create Deadline
  const handleCreateDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    setIsCreatingDeadline(true);
    const targetSets = targetSetMode === 'all' ? ['all'] : selectedTargetSets;

    await dataService.addDeadline({
      title: newTitle.trim(),
      subject: user.taughtSubjectName || 'Chemistry I',
      courseCode: user.taughtSubjectCode || 'PNAP0133',
      type: newType,
      targetSets,
      dueDate: newDueDate,
      description: newDesc.trim() || 'Tugasan rasmi yang ditetapkan oleh pensyarah kursus.',
      lecturerName: user.name,
      lecturerEmail: user.email,
      maxScore: 100,
    });

    setIsCreatingDeadline(false);
    setIsCreateDeadlineOpen(false);
    setNewTitle('');
    setNewDueDate('');
    setNewDesc('');
    if (onRefreshData) onRefreshData();
  };

  const toggleTargetSet = (setStr: string) => {
    if (selectedTargetSets.includes(setStr)) {
      setSelectedTargetSets(selectedTargetSets.filter((s) => s !== setStr));
    } else {
      setSelectedTargetSets([...selectedTargetSets, setStr]);
    }
  };

  // Helper: Retrieve all items for a given YYYY-MM-DD
  const getDayItems = (dateStr: string, dayOfWeekIndex: number) => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDayName = dayNames[dayOfWeekIndex];

    // Deadlines
    const dayDeadlines = filteredDeadlines.filter((d) => d.dueDate.startsWith(dateStr));

    // UKM Academic Events
    const dayEvents = OFFICIAL_UKM_CALENDAR_EVENTS.filter((ev) => {
      if (ev.endDate) {
        return dateStr >= ev.date && dateStr <= ev.endDate;
      }
      return ev.date === dateStr;
    });

    // Public Holidays (from list or calendar)
    const holidays = dayEvents.filter((e) => e.category === 'holiday');
    const academicEvents = dayEvents.filter((e) => e.category !== 'holiday');

    // Personal Notes
    const dayNotes = privateNotes.filter((p) => p.date === dateStr);

    // Classes scheduled on this weekday (Monday to Friday)
    const dayClasses =
      dayOfWeekIndex < 5
        ? studentSchedules.filter((s) => s.day === currentDayName)
        : [];

    return {
      deadlines: dayDeadlines,
      holidays,
      academicEvents,
      notes: dayNotes,
      classes: [],
      totalCount:
        dayDeadlines.length +
        holidays.length +
        academicEvents.length +
        dayNotes.length,
    };
  };

  // Month grid calculations
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    // Convert Sunday=0 to Monday=0: (day + 6) % 7
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      dayOfWeekIndex: number;
    }[] = [];

    // Prev month padding
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const date = new Date(year, month - 1, d);
      days.push({
        date,
        dateStr: formatYMD(date),
        isCurrentMonth: false,
        dayOfWeekIndex: (date.getDay() + 6) % 7,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        dateStr: formatYMD(date),
        isCurrentMonth: true,
        dayOfWeekIndex: (date.getDay() + 6) % 7,
      });
    }

    // Next month padding to reach 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        dateStr: formatYMD(date),
        isCurrentMonth: false,
        dayOfWeekIndex: (date.getDay() + 6) % 7,
      });
    }

    return days;
  }, [currentDate]);

  // Week days calculation
  const weekDays = useMemo(() => {
    const dayOfWeek = (currentDate.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - dayOfWeek);

    const days: {
      date: Date;
      dateStr: string;
      dayName: string;
      dayOfWeekIndex: number;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        date: d,
        dateStr: formatYMD(d),
        dayName: DAY_NAMES_MY[i],
        dayOfWeekIndex: i,
      });
    }

    return days;
  }, [currentDate]);

  // All upcoming items for agenda / list view
  const agendaItems = useMemo(() => {
    const list: {
      type: 'deadline' | 'holiday' | 'academic' | 'note';
      dateStr: string;
      title: string;
      subtitle: string;
      time?: string;
      priority?: 'low' | 'medium' | 'high';
      isDone?: boolean;
      id: string;
      originalItem: any;
    }[] = [];

    filteredDeadlines.forEach((d) => {
      list.push({
        type: 'deadline',
        dateStr: d.dueDate.split('T')[0],
        title: d.title,
        subtitle: `${d.subject} • ${d.type.toUpperCase()}`,
        time: d.dueDate.includes('T') ? d.dueDate.split('T')[1].slice(0, 5) : '23:59',
        id: d.id,
        originalItem: d,
      });
    });

    OFFICIAL_UKM_CALENDAR_EVENTS.forEach((ev) => {
      list.push({
        type: ev.category === 'holiday' ? 'holiday' : 'academic',
        dateStr: ev.date,
        title: ev.title,
        subtitle: ev.description || 'Acara Takwim UKM ASASIpintar',
        id: ev.id,
        originalItem: ev,
      });
    });

    privateNotes.forEach((p) => {
      list.push({
        type: 'note',
        dateStr: p.date,
        title: p.title,
        subtitle: p.subject,
        time: p.time,
        priority: p.priority,
        isDone: p.isDone,
        id: p.id,
        originalItem: p,
      });
    });

    return list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [filteredDeadlines, privateNotes]);

  // Selected date details data
  const selectedDayData = useMemo(() => {
    if (!selectedDateDetails) return null;
    const [y, m, d] = selectedDateDetails.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeekIndex = (dateObj.getDay() + 6) % 7;
    return {
      dateStr: selectedDateDetails,
      dateObj,
      ...getDayItems(selectedDateDetails, dayOfWeekIndex),
    };
  }, [selectedDateDetails, filteredDeadlines, privateNotes, studentSchedules]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-200/60 dark:border-indigo-800 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Tarikh Akhir Tugasan &amp; Kalendar Akademik
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isStudent ? `Set Pelajar: Set ${studentSet}` : 'Akses Pensyarah'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
              {MONTH_NAMES_MY[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isStudent && (
              <button
                onClick={() => {
                  setNoteDueDate(formatYMD(currentDate));
                  setIsNoteModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Nota Peribadi</span>
              </button>
            )}

            {!isStudent && (
              <button
                onClick={() => setIsCreateDeadlineOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>+ Cipta Tugasan / Tarikh Akhir</span>
              </button>
            )}
          </div>
        </div>

        {/* Toolbar: Navigation, View Mode Selector, and Filters */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Navigation Controls: Prev, Today, Next */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Seterusnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Switcher: Bulan / Minggu / Senarai */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Bulan (Month)</span>
            </button>

            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Minggu (Week)</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Senarai / Agenda</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Penapis:
          </span>
          {[
            { id: 'all', label: 'Semua Kategori' },
            { id: 'deadlines', label: 'Tarikh Akhir Tugasan' },
            { id: 'academic', label: 'Takwim Akademik' },
            { id: 'holidays', label: 'Cuti Umum' },
            { id: 'notes', label: 'Nota Peribadi' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id as any)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeCategoryFilter === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: MONTH CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          {/* Weekday headers: Mon - Sun */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-center text-xs font-bold text-slate-700 dark:text-slate-300 py-3">
            {DAY_NAMES_MY.map((dayName, idx) => (
              <div key={dayName} className={idx >= 5 ? 'text-rose-600 dark:text-rose-400' : ''}>
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {monthGridDays.map((dayItem, index) => {
              const { deadlines, holidays, academicEvents, notes, classes, totalCount } = getDayItems(
                dayItem.dateStr,
                dayItem.dayOfWeekIndex
              );

              const isToday = dayItem.dateStr === formatYMD(new Date());

              // Filter out items based on activeCategoryFilter
              const showDeadlines =
                activeCategoryFilter === 'all' || activeCategoryFilter === 'deadlines';
              const showHolidays =
                activeCategoryFilter === 'all' || activeCategoryFilter === 'holidays';
              const showAcademic =
                activeCategoryFilter === 'all' || activeCategoryFilter === 'academic';
              const showNotes =
                activeCategoryFilter === 'all' || activeCategoryFilter === 'notes';
              const showClasses =
                activeCategoryFilter === 'all' || activeCategoryFilter === 'classes';

              return (
                <div
                  key={`${dayItem.dateStr}-${index}`}
                  onClick={() => setSelectedDateDetails(dayItem.dateStr)}
                  className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                    dayItem.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20'
                      : 'bg-slate-50/40 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                  } ${isToday ? 'ring-2 ring-indigo-500/80 ring-inset bg-indigo-50/20 dark:bg-indigo-950/30' : ''}`}
                >
                  {/* Top Bar: Date number + Quick Add / Indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : dayItem.isCurrentMonth
                          ? 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </span>

                    {totalCount > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                        {totalCount}
                      </span>
                    )}
                  </div>

                  {/* Day Content Badges */}
                  <div className="mt-1 space-y-1 overflow-hidden flex-1">
                    {/* Public Holiday Tag */}
                    {showHolidays &&
                      holidays.slice(0, 1).map((hol) => (
                        <div
                          key={hol.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 truncate border border-rose-200 dark:border-rose-900/60"
                          title={hol.title}
                        >
                          🎉 {hol.title}
                        </div>
                      ))}

                    {/* Academic Event Tag */}
                    {showAcademic &&
                      academicEvents.slice(0, 1).map((ev) => (
                        <div
                          key={ev.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 truncate border border-purple-200 dark:border-purple-900/60"
                          title={ev.title}
                        >
                          📅 {ev.title}
                        </div>
                      ))}

                    {/* Deadlines Tag */}
                    {showDeadlines &&
                      deadlines.slice(0, 2).map((dl) => {
                        const isSubmitted = submissions.some(
                          (s) =>
                            s.deadlineId === dl.id &&
                            (s.studentEmail?.toLowerCase() === user.email.toLowerCase() ||
                              s.studentId?.toLowerCase() === (user.matricNumber || '').toLowerCase())
                        );

                        return (
                          <div
                            key={dl.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDeadline(dl);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate border transition-all flex items-center justify-between gap-1 ${
                              isSubmitted
                                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                                : dl.type === 'assignment'
                                ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800 hover:ring-1 hover:ring-blue-400'
                                : dl.type === 'quiz'
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800 hover:ring-1 hover:ring-amber-400'
                                : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 hover:ring-1 hover:ring-emerald-400'
                            }`}
                            title={`Tarikh Akhir: ${dl.title} (${getSubjectDisplayName(dl.subject, lang)}) ${isSubmitted ? '✓ Selesai' : ''}`}
                          >
                            <div className="flex items-center gap-1 min-w-0 truncate">
                              {isSubmitted ? (
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Clock className="w-2.5 h-2.5 shrink-0" />
                              )}
                              <span className={`truncate ${isSubmitted ? 'line-through opacity-80' : ''}`}>{dl.title}</span>
                            </div>
                            {isSubmitted && (
                              <span className="text-[8px] bg-emerald-600 text-white font-extrabold px-1 rounded shrink-0">
                                Selesai
                              </span>
                            )}
                          </div>
                        );
                      })}

                    {/* Personal Notes Tag */}
                    {showNotes &&
                      notes.slice(0, 2).map((note) => (
                        <div
                          key={note.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border flex items-center gap-1 ${
                            note.isDone
                              ? 'line-through opacity-60 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200'
                              : note.priority === 'high'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                              : note.priority === 'medium'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                          }`}
                          title={`Nota: ${note.title}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: note.color || '#F59E0B' }}
                          />
                          <span className="truncate">{note.title}</span>
                        </div>
                      ))}

                    {/* More count */}
                    {totalCount > 3 && (
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold pl-1">
                        +{totalCount - 3} lagi...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEK CALENDAR VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                Minggu:{' '}
                {weekDays[0].date.toLocaleDateString('ms-MY', {
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                –{' '}
                {weekDays[6].date.toLocaleDateString('ms-MY', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Jadual &amp; Tugasan Set {studentSet}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((wDay) => {
              const { deadlines, holidays, academicEvents, notes, classes } = getDayItems(
                wDay.dateStr,
                wDay.dayOfWeekIndex
              );
              const isToday = wDay.dateStr === formatYMD(new Date());

              return (
                <div
                  key={wDay.dateStr}
                  className={`rounded-2xl p-3 border transition-all flex flex-col justify-between space-y-3 ${
                    isToday
                      ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  {/* Day Header */}
                  <div className="pb-2 border-b border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {wDay.dayName}
                      </div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {wDay.date.getDate()}{' '}
                        <span className="text-xs font-normal text-slate-400">
                          {MONTH_NAMES_MY[wDay.date.getMonth()].slice(0, 3)}
                        </span>
                      </div>
                    </div>

                    {isStudent && (
                      <button
                        onClick={() => {
                          setNoteDueDate(wDay.dateStr);
                          setIsNoteModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        title="Tambah nota untuk hari ini"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Day Content Stack */}
                  <div className="space-y-2 flex-1">
                    {/* Holiday */}
                    {holidays.map((h) => (
                      <div
                        key={h.id}
                        className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs font-bold"
                      >
                        🎉 {h.title}
                      </div>
                    ))}

                    {/* Academic Event */}
                    {academicEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200 text-xs font-bold"
                      >
                        📅 {ev.title}
                      </div>
                    ))}

                    {/* Deadlines */}
                    {deadlines.map((dl) => {
                      const isSubmitted = submissions.some(
                        (s) =>
                          s.deadlineId === dl.id &&
                          (s.studentEmail?.toLowerCase() === user.email.toLowerCase() ||
                            s.studentId?.toLowerCase() === (user.matricNumber || '').toLowerCase())
                      );

                      return (
                        <div
                          key={dl.id}
                          onClick={() => setSelectedDeadline(dl)}
                          className={`p-2.5 rounded-xl border text-xs space-y-1.5 cursor-pointer transition-all shadow-2xs ${
                            isSubmitted
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                              : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 hover:bg-amber-100/70'
                          }`}
                        >
                          <div className="flex items-center justify-between font-extrabold text-[10px] uppercase">
                            <span className={isSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-300'}>
                              {dl.type}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-extrabold text-[9px] ${
                                isSubmitted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                              }`}
                            >
                              {isSubmitted ? '✓ Selesai' : 'Belum Hantar'}
                            </span>
                          </div>
                          <div className={`font-bold text-slate-900 dark:text-white line-clamp-1 ${isSubmitted ? 'line-through opacity-80' : ''}`}>
                            {dl.title}
                          </div>
                          <div className="text-[10px] flex items-center justify-between font-semibold pt-0.5 text-slate-500 dark:text-slate-400">
                            <span>{getSubjectDisplayName(dl.subject, lang)}</span>
                            <span>{new Date(dl.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Personal Notes */}
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-2 rounded-xl border text-xs space-y-1 transition-all ${
                          note.isDone
                            ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 line-through opacity-70'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded"
                            style={{
                              backgroundColor: `${note.color || '#F59E0B'}20`,
                              color: note.color || '#F59E0B',
                            }}
                          >
                            {note.priority}
                          </span>
                          <button
                            onClick={() => handleToggleNoteDone(note.id)}
                            className="text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            {note.isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Square className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {note.title}
                        </div>
                      </div>
                    ))}

                    {deadlines.length === 0 &&
                      holidays.length === 0 &&
                      academicEvents.length === 0 &&
                      notes.length === 0 &&
                      classes.length === 0 && (
                        <div className="text-center py-4 text-[11px] text-slate-400">
                          Tiada jadual
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: LIST / AGENDA VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Garis Masa Keseluruhan (Agenda &amp; Tarikh Akhir)</span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {agendaItems.length} Perkara Dijadualkan
            </span>
          </div>

          <div className="space-y-3">
            {agendaItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase">
                      {MONTH_NAMES_MY[new Date(item.dateStr).getMonth()]?.slice(0, 3)}
                    </span>
                    <span className="text-sm text-slate-900 dark:text-white">
                      {new Date(item.dateStr).getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                          item.type === 'deadline'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : item.type === 'holiday'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : item.type === 'academic'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {item.type}
                      </span>
                      <h4
                        className={`text-xs sm:text-sm font-bold text-slate-900 dark:text-white ${
                          item.isDone ? 'line-through opacity-60' : ''
                        }`}
                      >
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.type === 'deadline' && (
                    <>
                      {isStudent ? (
                        <button
                          onClick={() => setSelectedDeadline(item.originalItem)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Hantar Kerja
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedDeadline(item.originalItem)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Semak Penyerahan</span>
                          </button>
                          <button
                            onClick={() => setDeadlineToDelete(item.originalItem)}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                            title="Padam Tugasan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {item.type === 'note' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleNoteDone(item.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                      >
                        {item.isDone ? 'Selesai ✓' : 'Tanda Selesai'}
                      </button>
                      <button
                        onClick={() => handleDeleteNote(item.id)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL / DRAWER: DAY DETAILS POPUP */}
      {selectedDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Maklumat Terperinci Tarikh
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {selectedDayData.dateObj.toLocaleDateString('ms-MY', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDateDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of items on this day */}
            <div className="space-y-3">
              {/* Holidays */}
              {selectedDayData.holidays.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200"
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                    Cuti Umum Kelepasan Am
                  </div>
                  <div className="font-extrabold text-sm mt-0.5">{h.title}</div>
                  <div className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-1">
                    {h.description}
                  </div>
                </div>
              ))}

              {/* Academic Events */}
              {selectedDayData.academicEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-purple-950 dark:text-purple-200"
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-purple-700 dark:text-purple-300">
                    Takwim Akademik UKM
                  </div>
                  <div className="font-extrabold text-sm mt-0.5">{ev.title}</div>
                  <div className="text-xs text-purple-800/80 dark:text-purple-300/80 mt-1">
                    {ev.description}
                  </div>
                </div>
              ))}

              {/* Deadlines */}
              {selectedDayData.deadlines.map((dl) => {
                const isSubmitted = submissions.some(
                  (s) =>
                    s.deadlineId === dl.id &&
                    (s.studentEmail?.toLowerCase() === user.email.toLowerCase() ||
                      s.studentId?.toLowerCase() === (user.matricNumber || '').toLowerCase())
                );

                return (
                  <div
                    key={dl.id}
                    className={`p-3.5 rounded-2xl border space-y-2 ${
                      isSubmitted
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                          Tarikh Akhir {dl.type}
                        </span>
                        {isSubmitted && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                            ✓ Telah Dihantar (Selesai)
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold">
                        {new Date(dl.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`font-extrabold text-sm ${isSubmitted ? 'line-through opacity-85' : ''}`}>{dl.title}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Kursus: {getSubjectDisplayName(dl.subject, lang)} • Pensyarah: {dl.lecturerName}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDateDetails(null);
                        setSelectedDeadline(dl);
                      }}
                      className={`w-full py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                        isSubmitted
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      }`}
                    >
                      {isSubmitted ? 'Lihat / Kemaskini Penghantaran Tugasan' : 'Buka Borang Penghantaran Kerja'}
                    </button>
                  </div>
                );
              })}

              {/* Personal Notes */}
              {selectedDayData.notes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nota Peribadi Pelajar:</span>
                  </div>
                  {selectedDayData.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleNoteDone(note.id)}
                          className="text-slate-400 hover:text-emerald-600"
                        >
                          {note.isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <span className={note.isDone ? 'line-through opacity-60' : 'font-bold'}>
                          {note.title}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedDayData.totalCount === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  Tiada sebarang kelas, tugasan, atau cuti direkodkan pada tarikh ini.
                </div>
              )}
            </div>

            {/* Quick Action in Modal */}
            {isStudent && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setNoteDueDate(selectedDayData.dateStr);
                    setIsNoteModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Nota Peribadi Untuk Tarikh Ini</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD PERSONAL NOTE (Preserved exactly as requested) */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {dict.addPersonalNoteBtn || 'Tambah Nota Peribadi'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Hanya anda (pelajar) yang dapat melihat nota ini pada kalendar.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPrivateNote} className="mt-4 space-y-3.5">
              {/* Task Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Tugasan / Peringatan:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ulangkaji Bab 3 Larutan Penampan"
                  value={noteTaskName}
                  onChange={(e) => setNoteTaskName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subjek / Kursus Terlibat:
                </label>
                <select
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="Chemistry I (PNAP0133)">Chemistry I (PNAP0133)</option>
                  <option value="Biology I (PNAP0113)">Biology I (PNAP0113)</option>
                  <option value="Physics I (PNAP0123)">Physics I (PNAP0123)</option>
                  <option value="Statistics (PNAP0154)">Statistics (PNAP0154)</option>
                  <option value="Logical Reasoning (PNAP0143)">Logical Reasoning (PNAP0143)</option>
                  <option value="Language and Literary Appreciation (PNAP0162)">
                    Language and Literary Appreciation (PNAP0162)
                  </option>
                  <option value="Jati Diri (PNAP0172)">Jati Diri (PNAP0172)</option>
                  <option value="Research Skills (PNAP0182)">Research Skills (PNAP0182)</option>
                  <option value="Aktiviti Kokurikulum">Aktiviti Kokurikulum</option>
                  <option value="Peringatan Am">Peringatan Am</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tarikh Akhir / Tarikh Tugasan:
                </label>
                <input
                  type="date"
                  required
                  value={noteDueDate}
                  onChange={(e) => setNoteDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tahap Keutamaan (Priority):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNotePriority('low')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      notePriority === 'low'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Rendah (Low)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotePriority('medium')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      notePriority === 'medium'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Sederhana (Med)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotePriority('high')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      notePriority === 'high'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Tinggi (High)
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Simpan Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DEADLINE DETAILS - SUBMISSIONS REVIEW FOR LECTURER / SUBMIT WORK FOR STUDENT */}
      {selectedDeadline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    selectedDeadline.type === 'assignment'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : selectedDeadline.type === 'quiz'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {selectedDeadline.type}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {selectedDeadline.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDeadline(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
                <div className="text-slate-600 dark:text-slate-300 font-medium">
                  {selectedDeadline.description}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span>Kursus: <strong>{selectedDeadline.subject}</strong> ({selectedDeadline.courseCode})</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    Tarikh Akhir: {new Date(selectedDeadline.dueDate).toLocaleDateString('ms-MY')}{' '}
                    {new Date(selectedDeadline.dueDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* LECTURER VIEW: SUBMISSIONS REVIEW & DELETE DEADLINE */}
              {!isStudent ? (
                <div className="space-y-4">
                  {(() => {
                    const dlSubs = submissions.filter((s) => s.deadlineId === selectedDeadline.id);
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              Senarai Penyerahan Pelajar ({dlSubs.length} Telah Hantar)
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDeadlineToDelete(selectedDeadline)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Padam Tugasan Ini</span>
                          </button>
                        </div>

                        {dlSubs.length > 0 ? (
                          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                            {dlSubs.map((sub, idx) => (
                              <div
                                key={sub.id}
                                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white truncate">
                                      {sub.studentName}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                                      Set {sub.setNumber}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                        sub.status === 'Submitted'
                                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                      }`}
                                    >
                                      {sub.status}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                    {sub.studentEmail} • Dihantar pada {new Date(sub.submittedAt).toLocaleDateString('ms-MY')} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  {sub.note && (
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                                      Nota: "{sub.note}"
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenStudentFile(sub)}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Buka / Muat Turun Fail</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                            Belum ada pelajar yang menghantar tugasan ini lagi.
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedDeadline(null)}
                            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Tutup
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                /* STUDENT VIEW: SUBMIT WORK & MARK AS DONE / RE-UPLOAD */
                <>
                  {(() => {
                    const mySub = submissions.find(
                      (s) =>
                        s.deadlineId === selectedDeadline.id &&
                        (s.studentEmail?.toLowerCase() === user.email.toLowerCase() ||
                          s.studentId?.toLowerCase() === (user.matricNumber || '').toLowerCase())
                    );

                    if (mySub) {
                      return (
                        <div className="space-y-3">
                          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-400 dark:border-emerald-800 text-xs space-y-2.5">
                            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              <span>Tugasan Telah Berjaya Dihantar (Marked as Done)</span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                  {mySub.fileName || 'Dokumen Tugasan Pelajar'}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                                  {mySub.status || 'Submitted'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>
                                  Dihantar pada: {new Date(mySub.submittedAt).toLocaleDateString('ms-MY')}{' '}
                                  {new Date(mySub.submittedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {mySub.note && (
                                <div className="text-[11px] text-slate-600 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-700">
                                  Nota: "{mySub.note}"
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-800">
                              <span className="text-[11px] text-slate-500">
                                Perlu memuat naik semula fail baru?
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubmission(mySub.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Padam Fail &amp; Muat Naik Semula</span>
                              </button>
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedDeadline(null)}
                              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Tutup
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // If not yet submitted, render upload form
                    return (
                      <form onSubmit={handleStudentSubmit} className="space-y-3 pt-1">
                        {/* Device file upload dropzone */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Pilih Fail Tugasan (PDF / DOCX / Gambar / Zip):
                          </label>
                          <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-center bg-slate-50/50 dark:bg-slate-800/30">
                            <UploadCloud className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              Klik untuk pilih fail dari peranti
                            </div>
                            <span className="text-[10px] text-slate-400">Sokongan dokumen PDF, Word, PowerPoint, Imej &amp; Arkib Zip</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleFilePicked}
                            />
                          </label>
                          {submissionFileObj && (
                            <div className="mt-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                              <span className="font-bold text-indigo-900 dark:text-indigo-200 truncate flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                {submissionFileObj.name} ({submissionFileObj.size})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSubmissionFileObj(null);
                                  setSubmissionFileName('');
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Nama Fail / Pautan Google Drive (Jika guna link):
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: AP05710_LabReport_Chem1.pdf atau pautan Google Drive"
                            value={submissionFileName}
                            onChange={(e) => setSubmissionFileName(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Nota Tambahan kepada Pensyarah (Pilihan):
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Tulis sebarang catatan atau penerangan ringkas..."
                            value={submissionNote}
                            onChange={(e) => setSubmissionNote(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDeadline(null)}
                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingWork || !submissionFileName.trim()}
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isSubmittingWork ? 'Menghantar...' : 'Hantar & Tandakan Selesai'}</span>
                          </button>
                        </div>
                      </form>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LECTURER CREATE DEADLINE */}
      {isCreateDeadlineOpen && !isStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {dict.btnCreateDeadline || 'Cipta Tugasan / Tarikh Akhir Baru'}
              </h3>
              <button
                onClick={() => setIsCreateDeadlineOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeadline} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tajuk Tugasan / Kuiz:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Laboratory Report 1 - Acid Base Titration"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis:
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="assignment">Assignment / Laporan</option>
                    <option value="quiz">Kuiz</option>
                    <option value="presentation">Pembentangan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tarikh &amp; Masa Akhir:
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Penerangan / Arahan Tugasan:
                </label>
                <textarea
                  rows={2}
                  placeholder="Arahan bagi pelajar kohort ASASIpintar..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sasaran Set Pelajar:
                </label>
                <div className="flex items-center gap-3 mb-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="calTargetSetMode"
                      checked={targetSetMode === 'all'}
                      onChange={() => setTargetSetMode('all')}
                      className="text-emerald-600"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Semua 11 Set</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="calTargetSetMode"
                      checked={targetSetMode === 'specific'}
                      onChange={() => setTargetSetMode('specific')}
                      className="text-emerald-600"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Set Khusus</span>
                  </label>
                </div>

                {targetSetMode === 'specific' && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {Array.from({ length: 11 }, (_, i) => `Set ${i + 1}`).map((s) => {
                      const isChecked = selectedTargetSets.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleTargetSet(s)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateDeadlineOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDeadline}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  {isCreatingDeadline ? 'Menetapkan...' : 'Tetapkan Tugasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM DELETE DEADLINE */}
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
                onClick={() => handleConfirmDeleteDeadline(deadlineToDelete)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Ya, Padam Tugasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
