import {
  SubjectConfig,
  UserProfile,
  StudentRosterItem,
  ResourceItem,
  ClassScheduleItem,
  CalendarEvent,
  DeadlineItem,
  SubmissionRecord,
  PersonalTimetableNote,
  StudentCourseGrade,
  GradeScaleItem,
  ForumPost,
  BroadcastNotice,
} from '../types.ts';
import { OFFICIAL_ASASIPINTAR_SCHEDULES } from './officialTimetable.ts';
import { OFFICIAL_318_STUDENTS_ROSTER } from './officialStudentRoster.ts';
import {
  OFFICIAL_UKM_CLASS_SCHEDULES,
  OFFICIAL_UKM_CALENDAR_EVENTS,
  UKM_ACADEMIC_ACTIVITIES_2026_2027,
  UKM_PUBLIC_HOLIDAYS_2026_2027,
} from './ukmData2026.ts';

export {
  UKM_ACADEMIC_ACTIVITIES_2026_2027,
  UKM_PUBLIC_HOLIDAYS_2026_2027,
};

// 8 Subjects of Foundation / ASASIpintar Curriculum
export const SUBJECTS: SubjectConfig[] = [
  {
    id: 'chemistry',
    code: 'PNAP0133',
    name: 'Chemistry I',
    creditHours: 3,
    isScience: true,
    lecturerName: 'Dr. Nurul Huda binti Othman',
    lecturerEmail: 'dr.nurul@ukm.edu.my',
    color: 'from-blue-500 to-cyan-600',
    assessmentStructure: [
      { name: 'Assignment (1)', weightPercentage: 5 },
      { name: 'Laboratory Report (3)', weightPercentage: 15 },
      { name: 'Quiz (4)', weightPercentage: 20 },
      { name: 'Mid Sem Examination', weightPercentage: 20 },
      { name: 'Final Sem Examination', weightPercentage: 40 },
    ],
  },
  {
    id: 'physics',
    code: 'PNAP0123',
    name: 'Physics I',
    creditHours: 3,
    isScience: true,
    lecturerName: 'Dr. Farhan Azim bin Zakaria',
    lecturerEmail: 'dr.farhan@ukm.edu.my',
    color: 'from-amber-500 to-orange-600',
    assessmentStructure: [
      { name: 'Topical Tests', weightPercentage: 15 },
      { name: 'Physics Lab Report', weightPercentage: 15 },
      { name: 'Online Assignment', weightPercentage: 10 },
      { name: 'Mid Sem Examination', weightPercentage: 20 },
      { name: 'Final Examination', weightPercentage: 40 },
    ],
  },
  {
    id: 'biology',
    code: 'PNAP0113',
    name: 'Biology I',
    creditHours: 3,
    isScience: true,
    lecturerName: 'Prof. Madya Dr. Salmah binti Ismail',
    lecturerEmail: 'dr.salmah@ukm.edu.my',
    color: 'from-emerald-500 to-green-600',
    assessmentStructure: [
      { name: 'Presentation (1)', weightPercentage: 10 },
      { name: 'Assignments (1 or 2)', weightPercentage: 10 },
      { name: 'Quizzes', weightPercentage: 10 },
      { name: 'Lab Reports', weightPercentage: 10 },
      { name: 'Mid Sem Examination', weightPercentage: 20 },
      { name: 'Final Sem Examination', weightPercentage: 40 },
    ],
  },
  {
    id: 'statistics',
    code: 'PNAP0154',
    name: 'Statistics',
    creditHours: 4,
    isScience: false,
    lecturerName: 'Dr. Tan Wei Hong',
    lecturerEmail: 'dr.tan@ukm.edu.my',
    color: 'from-indigo-500 to-purple-600',
    assessmentStructure: [
      { name: 'Assignment (2)', weightPercentage: 20 },
      { name: 'Quizzes', weightPercentage: 20 },
      { name: 'Mini Project', weightPercentage: 10 },
      { name: 'Mid Sem Examination', weightPercentage: 20 },
      { name: 'Final Sem Examination', weightPercentage: 30 },
    ],
  },
  {
    id: 'logical_reasoning',
    code: 'PNAP0143',
    name: 'Logical Reasoning',
    creditHours: 3,
    isScience: false,
    lecturerName: 'Dr. Aminah binti Kassim',
    lecturerEmail: 'dr.aminah@ukm.edu.my',
    color: 'from-rose-500 to-pink-600',
    assessmentStructure: [
      { name: 'Quizzes (2)', weightPercentage: 10 },
      { name: 'Assignment(s)', weightPercentage: 30 },
      { name: 'Mid Sem Examination', weightPercentage: 10 },
      { name: 'Final Sem Examination', weightPercentage: 50 },
    ],
  },
  {
    id: 'language_literary',
    code: 'PNAP0162',
    name: 'Language and Literary Appreciation',
    creditHours: 3,
    isScience: false,
    lecturerName: 'Pn. Eleanor Vance',
    lecturerEmail: 'e.vance@ukm.edu.my',
    color: 'from-violet-500 to-purple-600',
    assessmentStructure: [
      { name: 'Quiz', weightPercentage: 15 },
      { name: "Readers' Theatre", weightPercentage: 35 },
      { name: 'Final Examination', weightPercentage: 50 },
    ],
  },
  {
    id: 'jati_diri',
    code: 'PNAP0172',
    name: 'Pembangunan Jati Diri Kebangsaan',
    creditHours: 3,
    isScience: false,
    lecturerName: 'Ustaz Dr. Khairul Anwar',
    lecturerEmail: 'dr.khairul@ukm.edu.my',
    color: 'from-teal-500 to-emerald-600',
    assessmentStructure: [
      { name: 'Modul & Tugasan Jati Diri', weightPercentage: 40 },
      { name: 'Penglibatan Sahsiah', weightPercentage: 20 },
      { name: 'Projek Khidmat Komuniti', weightPercentage: 40 },
    ],
  },
  {
    id: 'research_skills',
    code: 'PNAP0182',
    name: 'Research Skills',
    creditHours: 4,
    isScience: false,
    lecturerName: 'Prof. Dr. Azman bin Hassan',
    lecturerEmail: 'prof.azman@ukm.edu.my',
    color: 'from-sky-500 to-blue-700',
    assessmentStructure: [
      { name: 'Proposal Penyelidikan', weightPercentage: 20 },
      { name: 'Laporan Kemajuan & Pembentangan', weightPercentage: 30 },
      { name: 'Laporan Akhir Penyelidikan', weightPercentage: 50 },
    ],
  },
];

// UKM Official Grade Scale (Berdasarkan Dokumen Rasmi Nilai Gred Bagi Akademik ASASIpintar)
export const GRADE_SCALE: GradeScaleItem[] = [
  { letter: 'A', point: 4.00, minMark: 80, maxMark: 100, description: 'Cemerlang' },
  { letter: 'A-', point: 3.67, minMark: 75, maxMark: 79, description: 'Cemerlang' },
  { letter: 'B+', point: 3.33, minMark: 70, maxMark: 74, description: 'Kepujian' },
  { letter: 'B', point: 3.00, minMark: 65, maxMark: 69, description: 'Kepujian' },
  { letter: 'B-', point: 2.67, minMark: 60, maxMark: 64, description: 'Kepujian' },
  { letter: 'C+', point: 2.33, minMark: 55, maxMark: 59, description: 'Lulus' },
  { letter: 'C', point: 2.00, minMark: 50, maxMark: 54, description: 'Lulus' },
  { letter: 'C-', point: 1.67, minMark: 45, maxMark: 49, description: 'Lulus' },
  { letter: 'D+', point: 1.33, minMark: 40, maxMark: 44, description: 'Lulus' },
  { letter: 'D', point: 1.00, minMark: 35, maxMark: 39, description: 'Lulus' },
  { letter: 'E', point: 0.00, minMark: 0, maxMark: 34, description: 'Gagal' },
];

export function calculateGrade(totalMark: number): { letter: string; point: number; description: string } {
  const mark = Math.round(totalMark * 100) / 100;
  for (const scale of GRADE_SCALE) {
    if (mark >= scale.minMark && mark <= scale.maxMark) {
      return { letter: scale.letter, point: scale.point, description: scale.description };
    }
  }
  return { letter: 'E', point: 0.00, description: 'Gagal' };
}

// Generate the 300 student roster across 11 sets
const FIRST_NAMES = [
  'Ahmad', 'Muhammad', 'Nurul', 'Siti', 'Farhan', 'Ain', 'Harith', 'Amira',
  'Irfan', 'Aisyah', 'Danish', 'Khaled', 'Nadia', 'Zarif', 'Haziq', 'Fatihah',
  'Luqman', 'Hana', 'Syazwan', 'Nabilah', 'Aiman', 'Syafiqah', 'Hakim', 'Zara',
  'Kevin', 'Tan', 'Lee', 'Priya', 'Darren', 'Ananya'
];

const LAST_NAMES = [
  'bin Abdullah', 'binti Razak', 'bin Zakaria', 'binti Othman', 'bin Mansor',
  'binti Khalid', 'bin Fauzi', 'binti Ibrahim', 'bin Kamaruddin', 'binti Alias',
  'bin Ramli', 'binti Ismail', 'bin Osman', 'binti Salleh', 'Wei Hong', 'Jia Ying',
  'Subramaniam', 'Kumar', 'bin Johari', 'binti Hamzah'
];

export function generateStudentRoster(): StudentRosterItem[] {
  const students: StudentRosterItem[] = [];
  let studentCounter = 1;

  // Ensure first student is Ahmad Danish (AP05710) in Set 3
  students.push({
    id: 'std-1',
    matricNumber: 'AP05710',
    name: 'Ahmad Danish bin Abdullah',
    email: 'ap05710@siswa.ukm.edu.my',
    setNumber: 3,
    cgpa: 3.84,
    kokoMarks: 88.5,
    kokoGrade: 'A',
    status: 'Active',
  });

  // Ensure second student is Sarah Khalid in Set 1
  students.push({
    id: 'std-2',
    matricNumber: 'AP05812',
    name: 'Siti Sarah binti Khalid',
    email: 'ap05812@siswa.ukm.edu.my',
    setNumber: 1,
    cgpa: 3.76,
    kokoMarks: 91.0,
    kokoGrade: 'A',
    status: 'Active',
  });

  // Ensure third student is Muhammad Harith in Set 7
  students.push({
    id: 'std-3',
    matricNumber: 'AP05940',
    name: 'Muhammad Harith bin Mansor',
    email: 'ap05940@siswa.ukm.edu.my',
    setNumber: 7,
    cgpa: 3.65,
    kokoMarks: 82.0,
    kokoGrade: 'A-',
    status: 'Active',
  });

  studentCounter = 4;

  // Generate remaining ~297 students evenly distributed across Set 1 to 11
  for (let setIdx = 1; setIdx <= 11; setIdx++) {
    const studentsInSet = setIdx === 3 || setIdx === 1 || setIdx === 7 ? 26 : 27;
    for (let i = 0; i < studentsInSet; i++) {
      const fName = FIRST_NAMES[(studentCounter * 7 + i) % FIRST_NAMES.length];
      const lName = LAST_NAMES[(studentCounter * 11 + i) % LAST_NAMES.length];
      const matricNum = `AP0${5700 + studentCounter}`;
      const email = `${matricNum.toLowerCase()}@siswa.ukm.edu.my`;
      const cgpa = Number((3.10 + ((studentCounter * 17) % 85) / 100).toFixed(2));
      const koko = Number((72 + ((studentCounter * 13) % 26)).toFixed(1));

      students.push({
        id: `std-${studentCounter}`,
        matricNumber: matricNum,
        name: `${fName} ${lName}`,
        email: email,
        setNumber: setIdx,
        cgpa: null,
        kokoMarks: null,
        kokoGrade: null,
        status: 'Active',
      });
      studentCounter++;
    }
  }

  return students;
}

export const STUDENT_ROSTER = OFFICIAL_318_STUDENTS_ROSTER;
export const STUDENTS_ROSTER = OFFICIAL_318_STUDENTS_ROSTER;

// Demo Student User (Nur Hannan Zahirah - Set 3 - AP05710)
export const DEFAULT_STUDENT: UserProfile = {
  uid: 'usr-student-ap05710',
  name: 'NUR HANNAN ZAHIRAH BINTI MOHD SOPIAN',
  email: 'ap05710@siswa.ukm.edu.my',
  role: 'student',
  matricNumber: 'AP05710',
  setNumber: 3,
  currentCgpa: null,
  targetCgpa: 3.95,
  totalCreditsCompleted: 19,
  kokoMarks: null,
  kokoGrade: null,
  kokoDetails: null,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

// Demo Lecturer User (Biology - Dr. Ikhwan bin Zakaria)
export const DEFAULT_LECTURER: UserProfile = {
  uid: 'usr-lecturer-ikhwan',
  name: 'Dr. Ikhwan bin Zakaria',
  email: 'ikhwanz@ukm.edu.my',
  role: 'lecturer',
  taughtSubject: 'biology',
  taughtSubjectCode: 'PNAP0113',
  taughtSubjectName: 'Biology I',
  assignedSets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  department: 'Department of Biological Sciences & Biotechnology',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
};

// Preset Demo Accounts for testing (Real Students from Cohort & Faculty Lecturers from Directory)
export const DEMO_ACCOUNTS = [
  {
    role: 'student' as const,
    name: 'NUR HANNAN ZAHIRAH (Set 3)',
    email: 'ap05710@siswa.ukm.edu.my',
    setNumber: 3,
    label: 'Student • Set 3 (Nur Hannan Zahirah)',
    subject: undefined,
  },
  {
    role: 'student' as const,
    name: 'AIMI AISYAH (Set 1)',
    email: 'ap05466@siswa.ukm.edu.my',
    setNumber: 1,
    label: 'Student • Set 1 (Aimi Aisyah)',
    subject: undefined,
  },
  {
    role: 'student' as const,
    name: 'TAN SHI MAN (Set 5)',
    email: 'ap05560@siswa.ukm.edu.my',
    setNumber: 5,
    label: 'Student • Set 5 (Tan Shi Man)',
    subject: undefined,
  },
  {
    role: 'student' as const,
    name: 'ILYAS HUSEIN (Set 7)',
    email: 'ap05465@siswa.ukm.edu.my',
    setNumber: 7,
    label: 'Student • Set 7 (Ilyas Husein)',
    subject: undefined,
  },
  {
    role: 'lecturer' as const,
    name: 'Dr. Ikhwan bin Zakaria (Biology)',
    email: 'ikhwanz@ukm.edu.my',
    setNumber: undefined,
    label: 'Lecturer • Biology I (Dr. Ikhwan bin Zakaria)',
    subject: 'biology' as const,
  },
  {
    role: 'lecturer' as const,
    name: 'Dr. Siew Ee Ling (Biology)',
    email: 'sieweeling@ukm.edu.my',
    setNumber: undefined,
    label: 'Lecturer • Biology I (Dr. Siew Ee Ling)',
    subject: 'biology' as const,
  },
  {
    role: 'lecturer' as const,
    name: 'Dr. Nor Azah binti Nik Jaafar (Physics)',
    email: 'norazah_nj@ukm.edu.my',
    setNumber: undefined,
    label: 'Lecturer • Physics I (Dr. Nor Azah)',
    subject: 'physics' as const,
  },
  {
    role: 'lecturer' as const,
    name: 'PM Dr. Chin Siew Xian (Chemistry)',
    email: 'chinsiewxian@ukm.edu.my',
    setNumber: undefined,
    label: 'Lecturer • Chemistry I (PM Dr. Chin Siew Xian)',
    subject: 'chemistry' as const,
  },
  {
    role: 'lecturer' as const,
    name: 'Penyelaras ASASIpintar Hub (Pusat PERMATApintar)',
    email: 'asasipintarhub@gmail.com',
    setNumber: undefined,
    label: 'Hub Admin • Pusat PERMATApintar™ Negara (asasipintarhub@gmail.com)',
    subject: 'general' as const,
  },
  {
    role: 'lecturer' as const,
    name: 'Dr. Nurul Izzah binti Mukri (Physics)',
    email: 'nurulmukri@gmail.com',
    setNumber: undefined,
    label: 'Lecturer • Physics (Dr. Nurul Izzah binti Mukri)',
    subject: 'physics' as const,
  },
];

// Initial Learning Resources Hub Materials (Empty initially as portal is newly launched)
export const INITIAL_RESOURCES: ResourceItem[] = [];

// Timetable / Class Schedules - Program ASASIpintar UKM 2026/2027 (Sets 1 to 11)
// Official UKM schedule data with common auditorium lectures & Set 1-11 tutorials/labs
export const INITIAL_SCHEDULES: ClassScheduleItem[] = OFFICIAL_UKM_CLASS_SCHEDULES;

// Academic Calendar Events - Takwim Sesi 2026/2027 Pusat PERMATApintar Negara / ASASIpintar UKM
export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = OFFICIAL_UKM_CALENDAR_EVENTS;

// Deadlines for Assignments / Quizzes / Presentations (Empty initially as portal is new)
export const INITIAL_DEADLINES: DeadlineItem[] = [];

// Student Submissions Tracking
export const INITIAL_SUBMISSIONS: SubmissionRecord[] = [];

// Student Private Notes (Only visible to the individual student)
export const INITIAL_PRIVATE_NOTES: PersonalTimetableNote[] = [
  {
    id: 'pnote-1',
    studentEmail: 'ap05710@siswa.ukm.edu.my',
    title: 'Ulang Kaji Eksperimen Larutan Penampan',
    subject: 'Chemistry I (PNAP0133)',
    date: '2026-09-24',
    time: '20:00',
    priority: 'high',
    isDone: false,
    content: 'Review buffer solution formulas and calibrate glass pipette before tomorrow experiment.',
    color: '#EF4444',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pnote-2',
    studentEmail: 'ap05710@siswa.ukm.edu.my',
    title: 'Perbincangan Slaid Pembentangan Kumpulan',
    subject: 'Biology I (PNAP0113)',
    date: '2026-09-26',
    time: '16:30',
    priority: 'medium',
    isDone: false,
    content: 'Meet group mates at Perpustakaan Tun Seri Lanang (PTSL) Discussion Room 4 for slide rehearsal.',
    color: '#F59E0B',
    createdAt: new Date().toISOString(),
  },
];

// Course assessment schemas for UKM ASASIpintar subjects
export const COURSE_ASSESSMENT_SCHEMAS: Record<
  string,
  {
    courseName: string;
    creditHours: number;
    isScience: boolean;
    components: { name: string; weight: number }[];
  }
> = {
  PNAP0133: {
    courseName: 'Chemistry I',
    creditHours: 3,
    isScience: true,
    components: [
      { name: 'Assignment (1)', weight: 5 },
      { name: 'Laboratory Report (3)', weight: 15 },
      { name: 'Quiz (4)', weight: 20 },
      { name: 'Mid Sem Examination', weight: 20 },
      { name: 'Final Sem Examination', weight: 40 },
    ],
  },
  PNAP0123: {
    courseName: 'Physics I',
    creditHours: 3,
    isScience: true,
    components: [
      { name: 'Topical Tests', weight: 15 },
      { name: 'Physics Lab Report', weight: 15 },
      { name: 'Online Assignment', weight: 10 },
      { name: 'Mid Sem Examination', weight: 20 },
      { name: 'Final Examination', weight: 40 },
    ],
  },
  PNAP0113: {
    courseName: 'Biology I',
    creditHours: 3,
    isScience: true,
    components: [
      { name: 'Presentation (1)', weight: 10 },
      { name: 'Assignments (1 or 2)', weight: 10 },
      { name: 'Quizzes', weight: 10 },
      { name: 'Lab Reports', weight: 10 },
      { name: 'Mid Sem Examination', weight: 20 },
      { name: 'Final Sem Examination', weight: 40 },
    ],
  },
  PNAP0154: {
    courseName: 'Statistics',
    creditHours: 4,
    isScience: false,
    components: [
      { name: 'Assignment (2)', weight: 20 },
      { name: 'Quizzes', weight: 20 },
      { name: 'Mini Project', weight: 10 },
      { name: 'Mid Sem Examination', weight: 20 },
      { name: 'Final Sem Examination', weight: 30 },
    ],
  },
  PNAP0143: {
    courseName: 'Logical Reasoning',
    creditHours: 3,
    isScience: false,
    components: [
      { name: 'Quizzes (2)', weight: 10 },
      { name: 'Assignment(s)', weight: 30 },
      { name: 'Mid Sem Examination', weight: 10 },
      { name: 'Final Sem Examination', weight: 50 },
    ],
  },
  PNAP0162: {
    courseName: 'Language and Literary Appreciation',
    creditHours: 3,
    isScience: false,
    components: [
      { name: 'Quiz', weight: 15 },
      { name: "Readers' Theatre", weight: 35 },
      { name: 'Final Examination', weight: 50 },
    ],
  },
  PNAP0172: {
    courseName: 'Pembangunan Jati Diri Kebangsaan',
    creditHours: 3,
    isScience: false,
    components: [
      { name: 'Modul & Tugasan Jati Diri', weight: 40 },
      { name: 'Penglibatan Sahsiah', weight: 20 },
      { name: 'Projek Khidmat Komuniti', weight: 40 },
    ],
  },
  PNAP0182: {
    courseName: 'Research Skills',
    creditHours: 4,
    isScience: false,
    components: [
      { name: 'Proposal Penyelidikan', weight: 20 },
      { name: 'Laporan Kemajuan & Pembentangan', weight: 30 },
      { name: 'Laporan Akhir Penyelidikan', weight: 50 },
    ],
  },
  KOKO: {
    courseName: 'Kokurikulum & Pembangunan Jati Diri (10%)',
    creditHours: 1,
    isScience: false,
    components: [
      { name: 'Pembangunan Jati Diri (7%)', weight: 70 },
      { name: 'Kat A: Penyertaan (1%)', weight: 10 },
      { name: 'Kat B: Pencapaian (1%)', weight: 10 },
      { name: 'Kat C: Perjawatan (1%)', weight: 10 },
    ],
  },
};

// Official Student Course Marks - Default state is PENDING / NOT YET ENTERED
// Lecturers enter marks in their Lecturer Dashboard without touching code.
export const INITIAL_STUDENT_GRADES: StudentCourseGrade[] = [
  {
    id: 'grd-1',
    studentId: 'std-1',
    studentName: 'Ahmad Danish bin Abdullah',
    studentEmail: 'ap05710@siswa.ukm.edu.my',
    setNumber: 3,
    courseCode: 'PNAP0133',
    courseName: 'Chemistry I',
    creditHours: 3,
    isScience: true,
    components: [
      { name: 'Assignment (1)', weight: 5, score: null },
      { name: 'Laboratory Report (3)', weight: 15, score: null },
      { name: 'Quiz (4)', weight: 20, score: null },
      { name: 'Mid Sem Examination', weight: 20, score: null },
      { name: 'Final Sem Examination', weight: 40, score: null },
    ],
    totalScore: null,
    letterGrade: null,
    gradePoint: null,
    isPublished: false,
    updatedBy: 'Belum Dinilai',
    updatedAt: '',
  },
  {
    id: 'grd-2',
    studentId: 'std-1',
    studentName: 'Ahmad Danish bin Abdullah',
    studentEmail: 'ap05710@siswa.ukm.edu.my',
    setNumber: 3,
    courseCode: 'PNAP0123',
    courseName: 'Physics I',
    creditHours: 3,
    isScience: true,
    components: [
      { name: 'Topical Tests', weight: 15, score: null },
      { name: 'Physics Lab Report', weight: 15, score: null },
      { name: 'Online Assignment', weight: 10, score: null },
      { name: 'Mid Sem Examination', weight: 20, score: null },
      { name: 'Final Examination', weight: 40, score: null },
    ],
    totalScore: null,
    letterGrade: null,
    gradePoint: null,
    isPublished: false,
    updatedBy: 'Belum Dinilai',
    updatedAt: '',
  },
  {
    id: 'grd-3',
    studentId: 'std-1',
    studentName: 'Ahmad Danish bin Abdullah',
    studentEmail: 'ap05710@siswa.ukm.edu.my',
    setNumber: 3,
    courseCode: 'PNAP0113',
    courseName: 'Biology I',
    creditHours: 3,
    isScience: true,
    components: [
      { name: 'Presentation (1)', weight: 10, score: null },
      { name: 'Assignments (1 or 2)', weight: 10, score: null },
      { name: 'Quizzes', weight: 10, score: null },
      { name: 'Lab Reports', weight: 10, score: null },
      { name: 'Mid Sem Examination', weight: 20, score: null },
      { name: 'Final Sem Examination', weight: 40, score: null },
    ],
    totalScore: null,
    letterGrade: null,
    gradePoint: null,
    isPublished: false,
    updatedBy: 'Belum Dinilai',
    updatedAt: '',
  },
  {
    id: 'grd-4',
    studentId: 'std-1',
    studentName: 'Ahmad Danish bin Abdullah',
    studentEmail: 'ap05710@siswa.ukm.edu.my',
    setNumber: 3,
    courseCode: 'PNAP0154',
    courseName: 'Statistics',
    creditHours: 4,
    isScience: false,
    components: [
      { name: 'Assignment (2)', weight: 20, score: null },
      { name: 'Quizzes', weight: 20, score: null },
      { name: 'Mini Project', weight: 10, score: null },
      { name: 'Mid Sem Examination', weight: 20, score: null },
      { name: 'Final Sem Examination', weight: 30, score: null },
    ],
    totalScore: null,
    letterGrade: null,
    gradePoint: null,
    isPublished: false,
    updatedBy: 'Belum Dinilai',
    updatedAt: '',
  },
  {
    id: 'grd-5',
    studentId: 'std-1',
    studentName: 'Ahmad Danish bin Abdullah',
    studentEmail: 'ap05710@siswa.ukm.edu.my',
    setNumber: 3,
    courseCode: 'PNAP0143',
    courseName: 'Logical Reasoning',
    creditHours: 3,
    isScience: false,
    components: [
      { name: 'Quizzes (2)', weight: 10, score: null },
      { name: 'Assignment(s)', weight: 30, score: null },
      { name: 'Mid Sem Examination', weight: 10, score: null },
      { name: 'Final Sem Examination', weight: 50, score: null },
    ],
    totalScore: null,
    letterGrade: null,
    gradePoint: null,
    isPublished: false,
    updatedBy: 'Belum Dinilai',
    updatedAt: '',
  },
];

export const INITIAL_USER = DEFAULT_STUDENT;

// Community Forum Posts (Empty initially as portal is newly launched)
export const INITIAL_FORUM_POSTS: ForumPost[] = [];

// Live Broadcast Dispatches (Empty initially as portal is newly launched - connects real-time when lecturers send alerts)
export const INITIAL_BROADCASTS: BroadcastNotice[] = [];
