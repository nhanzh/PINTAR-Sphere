import { SubjectId } from '../types.ts';

export interface FacultyLecturer {
  name: string;
  email: string;
  subjectName: string;
  subjectCode: string;
  subjectId: SubjectId;
  department: string;
  title: string;
}

export const OFFICIAL_FACULTY_LECTURERS: FacultyLecturer[] = [
  // BIOLOGY
  {
    name: 'Dr. Ikhwan bin Zakaria',
    email: 'ikhwanz@ukm.edu.my',
    subjectName: 'Biology I',
    subjectCode: 'PNAP0113',
    subjectId: 'biology',
    department: 'Department of Biological Sciences & Biotechnology',
    title: 'Senior Lecturer / Course Coordinator',
  },
  {
    name: 'Dr. Siew Ee Ling',
    email: 'sieweeling@ukm.edu.my',
    subjectName: 'Biology I',
    subjectCode: 'PNAP0113',
    subjectId: 'biology',
    department: 'Department of Biological Sciences & Biotechnology',
    title: 'Senior Lecturer',
  },
  {
    name: 'Dr. Mona Fatin Syazwanee Mohamed Ghazali',
    email: 'monafatin@ukm.edu.my',
    subjectName: 'Biology I',
    subjectCode: 'PNAP0113',
    subjectId: 'biology',
    department: 'Department of Biological Sciences & Biotechnology',
    title: 'Senior Lecturer',
  },
  {
    name: 'Ms. Nurulnisa binti Nor Azman',
    email: 'nurulnisa@ukm.edu.my',
    subjectName: 'Biology I',
    subjectCode: 'PNAP0113',
    subjectId: 'biology',
    department: 'Department of Biological Sciences & Biotechnology',
    title: 'Lecturer',
  },

  // PHYSICS
  {
    name: 'Dr. Nor Azah binti Nik Jaafar',
    email: 'norazah_nj@ukm.edu.my',
    subjectName: 'Physics I',
    subjectCode: 'PNAP0123',
    subjectId: 'physics',
    department: 'Department of Applied Physics',
    title: 'Senior Lecturer / Physics Coordinator',
  },
  {
    name: 'Dr. Nor Farhah binti Razak',
    email: 'nfarhah@ukm.edu.my',
    subjectName: 'Physics I',
    subjectCode: 'PNAP0123',
    subjectId: 'physics',
    department: 'Department of Applied Physics',
    title: 'Senior Lecturer',
  },
  {
    name: 'Dr. Nurul Izzah binti Mukri',
    email: 'nurulmukri@ukm.edu.my',
    subjectName: 'Physics I',
    subjectCode: 'PNAP0123',
    subjectId: 'physics',
    department: 'Department of Applied Physics',
    title: 'Senior Lecturer',
  },
  {
    name: 'Mr. Muhammad Afiq Dzuan Mohd Azhar',
    email: 'afiqdzuan@ukm.edu.my',
    subjectName: 'Physics I',
    subjectCode: 'PNAP0123',
    subjectId: 'physics',
    department: 'Department of Applied Physics',
    title: 'Lecturer',
  },

  // CHEMISTRY
  {
    name: 'PM Dr. Chin Siew Xian',
    email: 'chinsiewxian@ukm.edu.my',
    subjectName: 'Chemistry I',
    subjectCode: 'PNAP0133',
    subjectId: 'chemistry',
    department: 'Department of Chemical Sciences',
    title: 'Associate Professor / Chemistry Coordinator',
  },
  {
    name: 'Dr. Teh Chin Hoong',
    email: 'chteh@ukm.edu.my',
    subjectName: 'Chemistry I',
    subjectCode: 'PNAP0133',
    subjectId: 'chemistry',
    department: 'Department of Chemical Sciences',
    title: 'Senior Lecturer',
  },
  {
    name: 'Dr. Nurulhaidah Daud',
    email: 'nurulhaidah@ukm.edu.my',
    subjectName: 'Chemistry I',
    subjectCode: 'PNAP0133',
    subjectId: 'chemistry',
    department: 'Department of Chemical Sciences',
    title: 'Senior Lecturer',
  },
  {
    name: 'Dr. Premanarayani Menon A/P Narayanan Nair',
    email: 'premamenon@ukm.edu.my',
    subjectName: 'Chemistry I',
    subjectCode: 'PNAP0133',
    subjectId: 'chemistry',
    department: 'Department of Chemical Sciences & Research',
    title: 'Senior Lecturer',
  },
  {
    name: 'Dr. Suganthy A/P Kanapathy',
    email: 'sugantyk@ukm.edu.my',
    subjectName: 'Chemistry I',
    subjectCode: 'PNAP0133',
    subjectId: 'chemistry',
    department: 'Department of Chemical Sciences & Research',
    title: 'Senior Lecturer',
  },

  // LOGICAL REASONING
  {
    name: 'Dr. Normahirah binti Nek Abdul Rahman',
    email: 'normahirah@ukm.edu.my',
    subjectName: 'Logical Reasoning',
    subjectCode: 'PNAP0143',
    subjectId: 'logical_reasoning',
    department: 'Department of Mathematical Sciences & Philosophy',
    title: 'Senior Lecturer',
  },
  {
    name: 'Mr. Mohd Hafizul Azrie Othman',
    email: 'mhao@ukm.edu.my',
    subjectName: 'Logical Reasoning',
    subjectCode: 'PNAP0143',
    subjectId: 'logical_reasoning',
    department: 'Department of Mathematical Sciences & Philosophy',
    title: 'Lecturer',
  },
  {
    name: 'Ms. Nur Shamim binti Hamzah',
    email: 'nurshamim@ukm.edu.my',
    subjectName: 'Logical Reasoning',
    subjectCode: 'PNAP0143',
    subjectId: 'logical_reasoning',
    department: 'Department of Mathematical Sciences & Philosophy',
    title: 'Lecturer',
  },

  // STATISTICS
  {
    name: 'Ms. Nur Nadiah binti Lani',
    email: 'nadiah_lani@ukm.edu.my',
    subjectName: 'Statistics',
    subjectCode: 'PNAP0154',
    subjectId: 'statistics',
    department: 'Department of Mathematical Sciences (Statistics)',
    title: 'Lecturer / Course Coordinator',
  },
  {
    name: 'Ms. Ain Afiqah Aminuddin',
    email: 'ainafiqah@ukm.edu.my',
    subjectName: 'Statistics',
    subjectCode: 'PNAP0154',
    subjectId: 'statistics',
    department: 'Department of Mathematical Sciences (Statistics)',
    title: 'Lecturer',
  },
  {
    name: 'Ms. Nurul Ain Salehuddin Haqe',
    email: 'ainhaqe@ukm.edu.my',
    subjectName: 'Statistics',
    subjectCode: 'PNAP0154',
    subjectId: 'statistics',
    department: 'Department of Mathematical Sciences (Statistics)',
    title: 'Lecturer',
  },

  // LANGUAGE AND LITERARY APPRECIATION
  {
    name: 'Ms. Siti Nurathirah Nazirah Salikin',
    email: 'athirahnazirah@ukm.edu.my',
    subjectName: 'Language and Literary Appreciation',
    subjectCode: 'PNAP0162',
    subjectId: 'language_literary',
    department: 'Department of Languages & Linguistics',
    title: 'Senior Language Teacher',
  },
  {
    name: 'Ms. Erdani Sofea binti Ahmad Syar’e',
    email: 'sofeasyare@ukm.edu.my',
    subjectName: 'Language and Literary Appreciation',
    subjectCode: 'PNAP0162',
    subjectId: 'language_literary',
    department: 'Department of Languages & Linguistics',
    title: 'Language Teacher',
  },

  // RESEARCH SKILLS
  {
    name: 'Ms. Farah Fardillah binti Ariff',
    email: 'farahfariff@ukm.edu.my',
    subjectName: 'Research Skills',
    subjectCode: 'PNAP0182',
    subjectId: 'research_skills',
    department: 'Center for Pre-University Research Excellence',
    title: 'Lecturer / Research Mentor',
  },

  // JATI DIRI
  {
    name: "PM To' Puan Dr. Tengku Elmi Azlina Tengku Muda",
    email: 'elmiazlina@ukm.edu.my',
    subjectName: 'Jati Diri (Self-Identity & Leadership)',
    subjectCode: 'PNAP0172',
    subjectId: 'jati_diri',
    department: 'Pusat PERMATApintar Negara (Citra & Jati Diri)',
    title: 'Associate Professor / Head of Character Development',
  },
  {
    name: 'Ms. Suhaina binti Yaakob',
    email: 'suhainaymd@ukm.edu.my',
    subjectName: 'Jati Diri (Self-Identity & Leadership)',
    subjectCode: 'PNAP0172',
    subjectId: 'jati_diri',
    department: 'Pusat PERMATApintar Negara (Citra & Jati Diri)',
    title: 'Senior Officer / Lecturer',
  },
];

export function findLecturerByEmail(email: string): FacultyLecturer | undefined {
  const clean = email.trim().toLowerCase();
  return OFFICIAL_FACULTY_LECTURERS.find((l) => l.email.toLowerCase() === clean);
}
