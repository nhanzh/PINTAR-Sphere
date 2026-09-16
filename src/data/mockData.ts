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
} from '../types.ts';
import { OFFICIAL_ASASIPINTAR_SCHEDULES } from './officialTimetable.ts';
import { OFFICIAL_318_STUDENTS_ROSTER } from './officialStudentRoster.ts';

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
    creditHours: 2,
    isScience: false,
    lecturerName: 'Pn. Eleanor Vance',
    lecturerEmail: 'e.vance@ukm.edu.my',
    color: 'from-violet-500 to-purple-600',
    assessmentStructure: [
      { name: 'Critical Essay', weightPercentage: 30 },
      { name: 'Oral Presentation', weightPercentage: 20 },
      { name: 'Portfolio & Continuous Assessment', weightPercentage: 50 },
    ],
  },
  {
    id: 'jati_diri',
    code: 'PNAP0172',
    name: 'Jati Diri (Self-Identity & Leadership)',
    creditHours: 2,
    isScience: false,
    lecturerName: 'Ustaz Dr. Khairul Anwar',
    lecturerEmail: 'dr.khairul@ukm.edu.my',
    color: 'from-teal-500 to-emerald-600',
    assessmentStructure: [
      { name: 'Community Engagement Log', weightPercentage: 40 },
      { name: 'Reflective Journal', weightPercentage: 30 },
      { name: 'Team Project', weightPercentage: 30 },
    ],
  },
  {
    id: 'research_skills',
    code: 'PNAP0182',
    name: 'Research Skills',
    creditHours: 2,
    isScience: false,
    lecturerName: 'Prof. Dr. Azman bin Hassan',
    lecturerEmail: 'prof.azman@ukm.edu.my',
    color: 'from-sky-500 to-blue-700',
    assessmentStructure: [
      { name: 'Research Proposal', weightPercentage: 40 },
      { name: 'Literature Review Matrix', weightPercentage: 30 },
      { name: 'Data Analysis Lab', weightPercentage: 30 },
    ],
  },
];

// UKM Official Grade Scale
export const GRADE_SCALE: GradeScaleItem[] = [
  { letter: 'A', point: 4.00, minMark: 80, maxMark: 100, description: 'High Distinction' },
  { letter: 'A-', point: 3.67, minMark: 75, maxMark: 79, description: 'Distinction' },
  { letter: 'B+', point: 3.33, minMark: 70, maxMark: 74, description: 'Credit' },
  { letter: 'B', point: 3.00, minMark: 65, maxMark: 69, description: 'Credit' },
  { letter: 'B-', point: 2.67, minMark: 60, maxMark: 64, description: 'Pass' },
  { letter: 'C+', point: 2.33, minMark: 55, maxMark: 59, description: 'Pass' },
  { letter: 'C', point: 2.00, minMark: 50, maxMark: 54, description: 'Marginal Pass' },
  { letter: 'C-', point: 1.67, minMark: 45, maxMark: 49, description: 'Conditional Pass' },
  { letter: 'D', point: 1.00, minMark: 40, maxMark: 44, description: 'Weak Pass' },
  { letter: 'E', point: 0.00, minMark: 0, maxMark: 39, description: 'Fail' },
];

export function calculateGrade(totalMark: number): { letter: string; point: number } {
  const mark = Math.round(totalMark);
  for (const scale of GRADE_SCALE) {
    if (mark >= scale.minMark && mark <= scale.maxMark) {
      return { letter: scale.letter, point: scale.point };
    }
  }
  return { letter: 'E', point: 0.00 };
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
        cgpa: cgpa,
        kokoMarks: koko,
        kokoGrade: koko >= 85 ? 'A' : koko >= 80 ? 'A-' : koko >= 75 ? 'B+' : 'B',
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
  currentCgpa: 3.88,
  targetCgpa: 3.95,
  totalCreditsCompleted: 19,
  kokoMarks: 91.0,
  kokoGrade: 'A',
  kokoDetails: {
    uniformBody: 29.0,   // Max 30 (KOR Suksis / Pengakap)
    sports: 24.5,        // Max 25 (Badminton / Futsal Inter-Set)
    club: 27.5,          // Max 30 (STEM & Robotic Innovators)
    specialProject: 10.0 // Max 15 (National Science Challenge Facilitator)
  },
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
];

// Initial Learning Resources Hub Materials
export const INITIAL_RESOURCES: ResourceItem[] = [
  {
    id: 'res-1',
    title: 'Chemistry I: Reaction Kinetics & Equilibrium Complete Lecture Slides',
    subject: 'Chemistry',
    courseCode: 'PNAP0133',
    category: 'lecture_notes',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    fileSize: '6.4 MB',
    fileType: 'PDF',
    downloadsCount: 184,
    uploadedBy: 'Dr. Nurul Huda binti Othman',
    uploaderEmail: 'dr.nurul@ukm.edu.my',
    uploadedDate: '2025-05-12',
    description: 'Comprehensive slides covering collision theory, rate laws, Arrhenius equation, and Le Chatelier equilibrium constant derivations.',
    targetSets: ['all'],
    tags: ['PNAP0133', 'Chemistry', 'ReactionKinetics', 'Equilibrium'],
  },
  {
    id: 'res-2',
    title: 'Chemistry I: Set 3 & 4 Analytical Qualitative Lab Tutorial Worksheet',
    subject: 'Chemistry',
    courseCode: 'PNAP0133',
    category: 'lab_manual',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    fileSize: '3.1 MB',
    fileType: 'PDF',
    downloadsCount: 52,
    uploadedBy: 'Dr. Nurul Huda binti Othman',
    uploaderEmail: 'dr.nurul@ukm.edu.my',
    uploadedDate: '2025-05-18',
    description: 'Special practice questions for titration curves and cation/anion flame test analysis specifically prepared for Set 3 & Set 4.',
    targetSets: ['Set 3', 'Set 4'],
    tags: ['PNAP0133', 'LabManual', 'Set3Special'],
  },
  {
    id: 'res-3',
    title: 'Physics I: Rotational Dynamics & Newton Laws Master Problem Set',
    subject: 'Physics',
    courseCode: 'PNAP0123',
    category: 'exercises',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    fileSize: '4.8 MB',
    fileType: 'PDF',
    downloadsCount: 142,
    uploadedBy: 'Dr. Farhan Azim bin Zakaria',
    uploaderEmail: 'dr.farhan@ukm.edu.my',
    uploadedDate: '2025-05-14',
    description: '35 challenging past exam questions with step-by-step vector mechanics diagrams and torque problem solutions.',
    targetSets: ['all'],
    tags: ['PNAP0123', 'Physics', 'Mechanics', 'Torque'],
  },
  {
    id: 'res-4',
    title: 'Biology I: Cellular Respiration, Glycolysis & Krebs Cycle High-Yield Cheatsheet',
    subject: 'Biology',
    courseCode: 'PNAP0113',
    category: 'cheatsheet',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    fileSize: '2.9 MB',
    fileType: 'PDF',
    downloadsCount: 220,
    uploadedBy: 'Prof. Madya Dr. Salmah binti Ismail',
    uploaderEmail: 'dr.salmah@ukm.edu.my',
    uploadedDate: '2025-05-10',
    description: 'Visual pathway chart illustrating ATP yields, oxidative phosphorylation, and mitochondrial membrane transport systems.',
    targetSets: ['all'],
    tags: ['PNAP0113', 'Biology', 'KrebsCycle', 'CellularRespiration'],
  },
  {
    id: 'res-5',
    title: 'Statistics: Probability Distributions & Hypothesis Testing R Guide',
    subject: 'Statistics',
    courseCode: 'PNAP0154',
    category: 'lecture_notes',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    fileSize: '5.2 MB',
    fileType: 'PDF',
    downloadsCount: 168,
    uploadedBy: 'Dr. Tan Wei Hong',
    uploaderEmail: 'dr.tan@ukm.edu.my',
    uploadedDate: '2025-05-20',
    description: 'Covers Normal, Poisson, and Binomial distribution tables, confidence intervals, and mini project sample data.',
    targetSets: ['all'],
    tags: ['PNAP0154', 'Statistics', 'NormalDistribution', 'HypothesisTesting'],
  },
  {
    id: 'res-6',
    title: 'Logical Reasoning: Formal Truth Tables & Predicate Logic Past Papers',
    subject: 'Logical Reasoning',
    courseCode: 'PNAP0143',
    category: 'past_year',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    fileSize: '3.8 MB',
    fileType: 'PDF',
    downloadsCount: 110,
    uploadedBy: 'Dr. Aminah binti Kassim',
    uploaderEmail: 'dr.aminah@ukm.edu.my',
    uploadedDate: '2025-05-08',
    description: 'Five years of mid-semester and final examination papers with complete logic proof solutions.',
    targetSets: ['all'],
    tags: ['PNAP0143', 'Logic', 'TruthTables', 'PastYear'],
  },
  {
    id: 'res-7',
    title: 'Language & Literary: Academic Writing & Critical Discourse Handbook',
    subject: 'Language and Literary Appreciation',
    courseCode: 'PNAP0162',
    category: 'lecture_notes',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    fileSize: '2.1 MB',
    fileType: 'PDF',
    downloadsCount: 79,
    uploadedBy: 'Pn. Eleanor Vance',
    uploaderEmail: 'e.vance@ukm.edu.my',
    uploadedDate: '2025-05-02',
    description: 'Formatting guide for literary critique, rhetoric analysis, and MLA/APA citation standards.',
    targetSets: ['all'],
    tags: ['PNAP0162', 'Language', 'Literary', 'EssayWriting'],
  },
  {
    id: 'res-8',
    title: 'Research Skills: IEEE Citation Format & Qualitative Methodology Guide',
    subject: 'Research Skills',
    courseCode: 'PNAP0182',
    category: 'exercises',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    fileSize: '1.9 MB',
    fileType: 'PDF',
    downloadsCount: 88,
    uploadedBy: 'Prof. Dr. Azman bin Hassan',
    uploaderEmail: 'prof.azman@ukm.edu.my',
    uploadedDate: '2025-05-15',
    description: 'Template for submitting your Semester 1 research proposal and literature review matrix.',
    targetSets: ['all'],
    tags: ['PNAP0182', 'ResearchSkills', 'Proposal', 'Methodology'],
  },
];

// Timetable / Class Schedules - Program ASASIpintar UKM 2026/2027 (Sets 1 to 11)
export const INITIAL_SCHEDULES: ClassScheduleItem[] = OFFICIAL_ASASIPINTAR_SCHEDULES;

// Academic Calendar Events
export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Lecture Period: Weeks 1 - 7',
    date: '2025-03-10',
    endDate: '2025-04-27',
    category: 'academic',
    description: 'Initial 7-week lecture and laboratory cycle for Semester 1.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-2',
    title: 'Mid-Semester Break (Cuti Pertengahan Semester)',
    date: '2025-04-28',
    endDate: '2025-05-04',
    category: 'holiday',
    description: 'Mid-semester recess across all UKM residential colleges and faculties.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-3',
    title: 'Mid-Semester Examinations (DECT & Examination Halls)',
    date: '2025-05-05',
    endDate: '2025-05-16',
    category: 'exam',
    description: 'Mid-sem evaluation tests for Chemistry I, Physics I, Biology I, and Statistics.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-4',
    title: 'Set 3 Physics I Makeup Lab Session',
    date: '2025-05-27',
    category: 'reschedule',
    description: 'Rescheduled mechanics experiment for Set 3 in Lab 3 at 2:00 PM.',
    targetSets: ['Set 3'],
    isOfficial: false,
  },
  {
    id: 'cal-5',
    title: 'Study & Revision Week (Minggu Ulang Kaji)',
    date: '2025-06-16',
    endDate: '2025-06-22',
    category: 'academic',
    description: 'Revision week prior to Final Semester Examinations.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-6',
    title: 'Final Semester 1 Examination Session',
    date: '2025-06-23',
    endDate: '2025-07-11',
    category: 'exam',
    description: 'Official final exams at Dewan Canselor Tun Abdul Razak (DECT).',
    targetSets: ['all'],
    isOfficial: true,
  },
];

// Deadlines for Assignments / Quizzes / Presentations
export const INITIAL_DEADLINES: DeadlineItem[] = [
  {
    id: 'dl-1',
    title: 'Chemistry I: Laboratory Report 3 (Chemical Equilibrium & Titration)',
    subject: 'Chemistry',
    courseCode: 'PNAP0133',
    type: 'assignment',
    targetSets: ['all'],
    dueDate: '2025-06-18T23:59',
    description: 'Submit formal PDF report including raw titration curves, Henderson-Hasselbalch calculation tables, and error analysis.',
    lecturerName: 'Dr. Nurul Huda binti Othman',
    lecturerEmail: 'dr.nurul@ukm.edu.my',
    maxScore: 100,
    createdAt: '2025-05-20',
  },
  {
    id: 'dl-2',
    title: 'Physics I: Online Quiz 3 (Harmonic Motion & Wave Optics)',
    subject: 'Physics',
    courseCode: 'PNAP0123',
    type: 'quiz',
    targetSets: ['Set 3', 'Set 4', 'Set 7'],
    dueDate: '2025-06-20T21:00',
    description: '25 multiple-choice questions on simple harmonic oscillators and wave interference. 45-minute timed attempt.',
    lecturerName: 'Dr. Farhan Azim bin Zakaria',
    lecturerEmail: 'dr.farhan@ukm.edu.my',
    maxScore: 25,
    createdAt: '2025-05-22',
  },
  {
    id: 'dl-3',
    title: 'Biology I: Genetic Mutation & CRISPR Presentation Slide Deck',
    subject: 'Biology',
    courseCode: 'PNAP0113',
    type: 'presentation',
    targetSets: ['all'],
    dueDate: '2025-06-24T17:00',
    description: 'Upload group presentation slides (max 15 slides) on gene editing ethics or hereditary chromosomal abnormalities.',
    lecturerName: 'Prof. Madya Dr. Salmah binti Ismail',
    lecturerEmail: 'dr.salmah@ukm.edu.my',
    maxScore: 50,
    createdAt: '2025-05-25',
  },
  {
    id: 'dl-4',
    title: 'Statistics: Mini Project Dataset Analysis & Regression Report',
    subject: 'Statistics',
    courseCode: 'PNAP0154',
    type: 'assignment',
    targetSets: ['all'],
    dueDate: '2025-06-27T23:59',
    description: 'Conduct multivariate regression and chi-square independence tests on the provided UKM campus survey dataset.',
    lecturerName: 'Dr. Tan Wei Hong',
    lecturerEmail: 'dr.tan@ukm.edu.my',
    maxScore: 100,
    createdAt: '2025-05-26',
  },
  {
    id: 'dl-5',
    title: 'Logical Reasoning: Propositional Logic Proof Assignment 2',
    subject: 'Logical Reasoning',
    courseCode: 'PNAP0143',
    type: 'assignment',
    targetSets: ['Set 1', 'Set 2', 'Set 3'],
    dueDate: '2025-06-29T23:59',
    description: 'Formal natural deduction proofs using Modus Ponens, De Morgan Laws, and Reductio Ad Absurdum rules.',
    lecturerName: 'Dr. Aminah binti Kassim',
    lecturerEmail: 'dr.aminah@ukm.edu.my',
    maxScore: 50,
    createdAt: '2025-05-28',
  },
];

// Student Submissions Tracking
export const INITIAL_SUBMISSIONS: SubmissionRecord[] = [
  {
    id: 'sub-bio-1',
    deadlineId: 'dl-3',
    studentId: 's3-13',
    studentName: 'NUR HANNAN ZAHIRAH BINTI MOHD SOPIAN',
    studentEmail: 'ap05710@siswa.ukm.edu.my',
    setNumber: 3,
    submittedAt: '2025-06-23T15:20:00',
    status: 'Submitted',
    fileName: 'CRISPR_Cas9_GeneTherapy_Set3_GroupB.pdf',
    note: 'Group presentation slides on somatic gene editing in sickle cell anemia.',
  },
  {
    id: 'sub-bio-2',
    deadlineId: 'dl-3',
    studentId: 's1-1',
    studentName: 'AIMI AISYAH BINTI IMRAN',
    studentEmail: 'ap05466@siswa.ukm.edu.my',
    setNumber: 1,
    submittedAt: '2025-06-24T11:05:00',
    status: 'Submitted',
    fileName: 'Set1_CRISPR_Ethics_AimiAisyah.pdf',
    note: 'Slides with video links for presentation next Tuesday in MB 1.',
  },
  {
    id: 'sub-bio-3',
    deadlineId: 'dl-3',
    studentId: 's5-15',
    studentName: 'TAN SHI MAN',
    studentEmail: 'ap05560@siswa.ukm.edu.my',
    setNumber: 5,
    submittedAt: '2025-06-24T16:50:00',
    status: 'Submitted',
    fileName: 'Set5_Gene_Mutation_TanShiMan.pdf',
    note: 'Final draft deck verified with Dr. Siew Ee Ling.',
  },
  {
    id: 'sub-1',
    deadlineId: 'dl-1',
    studentId: 's3-13',
    studentName: 'NUR HANNAN ZAHIRAH BINTI MOHD SOPIAN',
    studentEmail: 'ap05710@siswa.ukm.edu.my',
    setNumber: 3,
    submittedAt: '2025-06-17T18:42:10',
    status: 'Submitted',
    fileName: 'Chemistry_LabReport3_NurHannan_AP05710.pdf',
    note: 'All calculations checked with Dr. Nurul sample titration graph.',
  },
  {
    id: 'sub-2',
    deadlineId: 'dl-1',
    studentId: 's1-1',
    studentName: 'AIMI AISYAH BINTI IMRAN',
    studentEmail: 'ap05466@siswa.ukm.edu.my',
    setNumber: 1,
    submittedAt: '2025-06-18T14:15:00',
    status: 'Submitted',
    fileName: 'AimiAisyah_Lab3_PNAP0133.pdf',
  },
  {
    id: 'sub-3',
    deadlineId: 'dl-1',
    studentId: 's7-20',
    studentName: 'ILYAS HUSEIN BIN ABDULLAH',
    studentEmail: 'ap05465@siswa.ukm.edu.my',
    setNumber: 7,
    submittedAt: '2025-06-19T02:10:00',
    status: 'Late',
    fileName: 'Ilyas_Lab3_Equilibrium.pdf',
    note: 'Late submission due to power outage in Kolej Aminuddin Baki.',
  },
];

// Student Private Notes (Only visible to the individual student)
export const INITIAL_PRIVATE_NOTES: PersonalTimetableNote[] = [
  {
    id: 'pnote-1',
    studentEmail: 'ap05710@siswa.ukm.edu.my',
    title: 'Chemistry Lab Preparation',
    date: '2025-06-17',
    time: '20:00',
    content: 'Review buffer solution formulas and calibrate glass pipette before tomorrow experiment.',
    color: '#3B82F6',
    createdAt: '2025-06-16',
  },
  {
    id: 'pnote-2',
    studentEmail: 'ap05710@siswa.ukm.edu.my',
    title: 'Biology Group Presentation Meeting',
    date: '2025-06-19',
    time: '16:30',
    content: 'Meet group mates at Perpustakaan Tun Seri Lanang (PTSL) Discussion Room 4 for CRISPR slide rehearsal.',
    color: '#10B981',
    createdAt: '2025-06-17',
  },
];

// Official Student Course Marks Entered by Lecturers (For Semester 1)
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
      { name: 'Assignment (1)', weight: 5, score: 96 },
      { name: 'Laboratory Report (3)', weight: 15, score: 95 },
      { name: 'Quiz (4)', weight: 20, score: 92.5 },
      { name: 'Mid Sem Examination', weight: 20, score: 90 },
      { name: 'Final Sem Examination', weight: 40, score: 90 },
    ],
    breakdown: {
      'Assignment (1)': 4.8,          // Max 5%
      'Laboratory Report (3)': 14.2,  // Max 15%
      'Quiz (4)': 18.5,               // Max 20%
      'Mid Sem Examination': 18.0,    // Max 20%
      'Final Sem Examination': 36.0,  // Max 40%
    },
    totalScore: 91.5,
    letterGrade: 'A',
    gradePoint: 4.00,
    updatedBy: 'Dr. Nurul Huda binti Othman',
    updatedAt: '2025-06-10',
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
      { name: 'Topical Tests', weight: 15, score: 90 },
      { name: 'Physics Lab Report', weight: 15, score: 93.3 },
      { name: 'Online Assignment', weight: 10, score: 95 },
      { name: 'Mid Sem Examination', weight: 20, score: 87.5 },
      { name: 'Final Examination', weight: 40, score: 85 },
    ],
    breakdown: {
      'Topical Tests': 13.5,          // Max 15%
      'Physics Lab Report': 14.0,     // Max 15%
      'Online Assignment': 9.5,       // Max 10%
      'Mid Sem Examination': 17.5,    // Max 20%
      'Final Examination': 34.0,      // Max 40%
    },
    totalScore: 88.5,
    letterGrade: 'A',
    gradePoint: 4.00,
    updatedBy: 'Dr. Farhan Azim bin Zakaria',
    updatedAt: '2025-06-11',
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
      { name: 'Presentation (1)', weight: 10, score: 90 },
      { name: 'Assignments (1 or 2)', weight: 10, score: 88 },
      { name: 'Quizzes', weight: 10, score: 92 },
      { name: 'Lab Reports', weight: 10, score: 90 },
      { name: 'Mid Sem Examination', weight: 20, score: 82.5 },
      { name: 'Final Sem Examination', weight: 40, score: 78.8 },
    ],
    breakdown: {
      'Presentation (1)': 9.0,        // Max 10%
      'Assignments (1 or 2)': 8.8,    // Max 10%
      'Quizzes': 9.2,                 // Max 10%
      'Lab Reports': 9.0,             // Max 10%
      'Mid Sem Examination': 16.5,    // Max 20%
      'Final Sem Examination': 31.5,  // Max 40%
    },
    totalScore: 84.0,
    letterGrade: 'A',
    gradePoint: 4.00,
    updatedBy: 'Prof. Madya Dr. Salmah binti Ismail',
    updatedAt: '2025-06-12',
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
      { name: 'Assignment (2)', weight: 20, score: 90 },
      { name: 'Quizzes', weight: 20, score: 92.5 },
      { name: 'Mini Project', weight: 10, score: 95 },
      { name: 'Mid Sem Examination', weight: 20, score: 85 },
      { name: 'Final Sem Examination', weight: 30, score: 86.7 },
    ],
    breakdown: {
      'Assignment (2)': 18.0,         // Max 20%
      'Quizzes': 18.5,                // Max 20%
      'Mini Project': 9.5,            // Max 10%
      'Mid Sem Examination': 17.0,    // Max 20%
      'Final Sem Examination': 26.0,  // Max 30%
    },
    totalScore: 89.0,
    letterGrade: 'A',
    gradePoint: 4.00,
    updatedBy: 'Dr. Tan Wei Hong',
    updatedAt: '2025-06-12',
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
      { name: 'Quizzes (2)', weight: 10, score: 90 },
      { name: 'Assignment(s)', weight: 30, score: 90 },
      { name: 'Mid Sem Examination', weight: 10, score: 85 },
      { name: 'Final Sem Examination', weight: 50, score: 82 },
    ],
    breakdown: {
      'Quizzes (2)': 9.0,             // Max 10%
      'Assignment(s)': 27.0,          // Max 30%
      'Mid Sem Examination': 8.5,     // Max 10%
      'Final Sem Examination': 41.0,  // Max 50%
    },
    totalScore: 85.5,
    letterGrade: 'A',
    gradePoint: 4.00,
    updatedBy: 'Dr. Aminah binti Kassim',
    updatedAt: '2025-06-13',
  },
];

export const INITIAL_USER = DEFAULT_STUDENT;

// Community Forum Posts (Non-Anonymous Public Discussions)
export const INITIAL_FORUM_POSTS: ForumPost[] = [
  {
    id: 'post-1',
    title: 'Tips for Le Chatelier Equilibrium calculation in Chemistry I Lab 3',
    content: 'Hi everyone! When calculating the equilibrium constant Kc for reaction 2 in Lab 3, make sure to convert volumes from mL to dm³ before computing molar concentrations. Otherwise, the equilibrium quotients will diverge significantly.',
    authorName: 'Dr. Nurul Huda binti Othman',
    authorEmail: 'dr.nurul@ukm.edu.my',
    authorRole: 'lecturer',
    authorSet: 'Lecturer • Chemistry I',
    subject: 'Chemistry',
    createdAt: '2 days ago',
    likes: 38,
    tags: ['PNAP0133', 'Chemistry', 'LabReport3', 'StudyTips'],
    comments: [
      {
        id: 'comm-1',
        authorName: 'Ahmad Danish bin Abdullah',
        authorEmail: 'ap05710@siswa.ukm.edu.my',
        authorRole: 'student',
        authorSet: 'Set 3',
        content: 'Thank you so much Dr. Nurul! That resolved the discrepancy in our trial 2 graph data.',
        createdAt: '1 day ago',
        likes: 7,
      },
      {
        id: 'comm-2',
        authorName: 'Siti Sarah binti Khalid',
        authorEmail: 'ap05812@siswa.ukm.edu.my',
        authorRole: 'student',
        authorSet: 'Set 1',
        content: 'Will this specific titration calculation be tested in the final examination as well?',
        createdAt: '18 hours ago',
        likes: 3,
      },
    ],
  },
  {
    id: 'post-2',
    title: 'Statistics Mini Project: Group Dataset Consultation Hours',
    content: 'Reminder to all sets: Consultation slots for your multivariate regression mini project are open this Thursday from 2.00 PM to 5.00 PM at Makmal Komputer Al-Khawarizmi. Bring your clean CSV datasets.',
    authorName: 'Dr. Tan Wei Hong',
    authorEmail: 'dr.tan@ukm.edu.my',
    authorRole: 'lecturer',
    authorSet: 'Lecturer • Statistics',
    subject: 'Statistics',
    createdAt: '3 days ago',
    likes: 29,
    tags: ['PNAP0154', 'Statistics', 'MiniProject', 'Consultation'],
    comments: [
      {
        id: 'comm-3',
        authorName: 'Muhammad Harith bin Mansor',
        authorEmail: 'ap05940@siswa.ukm.edu.my',
        authorRole: 'student',
        authorSet: 'Set 7',
        content: 'Dr. Tan, can we use Python pandas/statsmodels instead of R studio for the p-value calculations?',
        createdAt: '2 days ago',
        likes: 5,
      },
    ],
  },
  {
    id: 'post-3',
    title: 'Looking for Physics I study group at PTSL Library (Sets 1 - 5)',
    content: 'We are organizing an evening study circle focusing on rotational dynamics, moment of inertia, and angular momentum past-year problems. Meeting at PTSL Level 3 discussion pods tomorrow at 8.00 PM.',
    authorName: 'Ahmad Danish bin Abdullah',
    authorEmail: 'ap05710@siswa.ukm.edu.my',
    authorRole: 'student',
    authorSet: 'Set 3',
    subject: 'Physics',
    createdAt: 'Yesterday',
    likes: 22,
    tags: ['PNAP0123', 'Physics', 'StudyGroup', 'PTSL'],
    comments: [
      {
        id: 'comm-4',
        authorName: 'Ainul Mardhiah',
        authorEmail: 'ap05742@siswa.ukm.edu.my',
        authorRole: 'student',
        authorSet: 'Set 3',
        content: 'Count me in! I will bring the 2023 final examination paper worked solutions.',
        createdAt: '12 hours ago',
        likes: 4,
      },
    ],
  },
];

// Live Broadcast Dispatches (Lecturer to Student real-time communication)
export const INITIAL_BROADCASTS = [
  {
    id: 'bc-1',
    title: 'Pertukaran Dewan Kuliah Kimia I (PNAP0133) - Set 1 hingga 5',
    message: 'Perhatian kepada semua pelajar Set 1, 2, 3, 4, dan 5: Kuliah Kimia esok (Rabu) jam 8.00 pagi dipindahkan ke Dewan Kuliah 2 (DK2) kerana Dewan Kuliah 1 sedang dinaik taraf sistem audio.',
    senderName: 'Dr. Nurul Huda binti Othman',
    senderEmail: 'dr.nurul@ukm.edu.my',
    subjectCode: 'PNAP0133',
    subjectName: 'Chemistry I',
    targetSet: 'all',
    priority: 'reschedule' as const,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'bc-2',
    title: 'Peringatan Penghantaran Laporan Makmal Fizik I - Set 3 Sahaja',
    message: 'Pelajar Set 3 diingatkan bahawa tarikh akhir penghantaran Laporan Makmal Eksperimen 2 (Inersia Putaran) adalah sebelum jam 5.00 petang ini di bilik pensyarah atau melalui portal ini.',
    senderName: 'Dr. Zulkifli bin Hashim',
    senderEmail: 'dr.zulkifli@ukm.edu.my',
    subjectCode: 'PNAP0123',
    subjectName: 'Physics I',
    targetSet: '3',
    priority: 'urgent' as const,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'bc-3',
    title: 'Bahan Tambahan & Soalan Latih Tubi Statistik (PNAP0154)',
    message: 'Slaid kuliah Probability Distributions & Taburan Normal telah dimuat naik ke tab Bahan Pembelajaran. Sila cetak atau muat turun sebelum sesi tutorial esok.',
    senderName: 'Dr. Tan Wei Hong',
    senderEmail: 'dr.tan@ukm.edu.my',
    subjectCode: 'PNAP0154',
    subjectName: 'Statistics',
    targetSet: 'all',
    priority: 'info' as const,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];
