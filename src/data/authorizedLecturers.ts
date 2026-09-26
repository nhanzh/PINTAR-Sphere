import { SubjectId } from '../types.ts';

export interface AuthorizedLecturer {
  name: string;
  email: string;
  subjectId: SubjectId;
  subjectCode: string;
  subjectName: string;
  department: string;
}

/**
 * Senarai Rasmi Emel Pensyarah & Pentadbir ASASIpintar UKM yang Dibenarkan
 * Hanya emel-emel dalam senarai ini sahaja yang mempunyai akses untuk mendaftar & log masuk ke Portal Pensyarah.
 */
export const AUTHORIZED_LECTURERS: AuthorizedLecturer[] = [
  {
    name: 'Pusat ASASIpintar Admin Hub',
    email: 'asasipintarhub@gmail.com',
    subjectId: 'general',
    subjectCode: 'ASASI-HUB',
    subjectName: 'Penyelaras ASASIpintar UKM',
    department: 'Pusat PERMATApintar™ Negara / Pengurusan ASASIpintar',
  },
  {
    name: 'DR. IKHWAN BIN ZAKARIA',
    email: 'ikhwanz@ukm.edu.my',
    subjectId: 'biology',
    subjectCode: 'PNAP0113',
    subjectName: 'Biology I',
    department: 'Jabatan Sains Hayat & Bioteknologi',
  },
  {
    name: 'DR. SIEW EE LING',
    email: 'sieweeling@ukm.edu.my',
    subjectId: 'biology',
    subjectCode: 'PNAP0113',
    subjectName: 'Biology I',
    department: 'Jabatan Sains Hayat & Bioteknologi',
  },
  {
    name: 'DR. MONA FATIN SYAZWANEE MOHAMED GHAZALI',
    email: 'monafatin@ukm.edu.my',
    subjectId: 'biology',
    subjectCode: 'PNAP0113',
    subjectName: 'Biology I',
    department: 'Jabatan Sains Hayat & Bioteknologi',
  },
  {
    name: 'MS. NURULNISA BINTI NOR AZMAN',
    email: 'nurulnisa@ukm.edu.my',
    subjectId: 'biology',
    subjectCode: 'PNAP0113',
    subjectName: 'Biology I',
    department: 'Jabatan Sains Hayat & Bioteknologi',
  },
  {
    name: 'DR. NOR AZAH BINTI NIK JAAFAR',
    email: 'norazah_nj@ukm.edu.my',
    subjectId: 'physics',
    subjectCode: 'PNAP0123',
    subjectName: 'Physics I',
    department: 'Jabatan Sains Fizik & Bahan',
  },
  {
    name: 'DR. NOR FARHAH BINTI RAZAK',
    email: 'nfarhah@ukm.edu.my',
    subjectId: 'physics',
    subjectCode: 'PNAP0123',
    subjectName: 'Physics I',
    department: 'Jabatan Sains Fizik & Bahan',
  },
  {
    name: 'DR. NURUL IZZAH BINTI MUKRI',
    email: 'nurulmukri@gmail.com',
    subjectId: 'physics',
    subjectCode: 'PNAP0123',
    subjectName: 'Physics I',
    department: 'Jabatan Sains Fizik & Bahan',
  },
  {
    name: 'MR. MUHAMMAD AFIQ DZUAN MOHD AZHAR',
    email: 'afiqdzuan@ukm.edu.my',
    subjectId: 'physics',
    subjectCode: 'PNAP0123',
    subjectName: 'Physics I',
    department: 'Jabatan Sains Fizik & Bahan',
  },
  {
    name: 'PROF. MADYA TS. CHM. DR. CHIN SIEW XIAN',
    email: 'chinsiewxian@ukm.edu.my',
    subjectId: 'chemistry',
    subjectCode: 'PNAP0133',
    subjectName: 'Chemistry I',
    department: 'Jabatan Sains Kimia',
  },
  {
    name: 'DR. TEH CHIN HOONG',
    email: 'chteh@ukm.edu.my',
    subjectId: 'chemistry',
    subjectCode: 'PNAP0133',
    subjectName: 'Chemistry I',
    department: 'Jabatan Sains Kimia',
  },
  {
    name: 'DR. NURULHAIDAH DAUD',
    email: 'nurulhaidah@ukm.edu.my',
    subjectId: 'chemistry',
    subjectCode: 'PNAP0133',
    subjectName: 'Chemistry I',
    department: 'Jabatan Sains Kimia',
  },
  {
    name: 'DR. PREMANARAYANI MENON A/P NARAYANAN NAIR',
    email: 'premamenon@ukm.edu.my',
    subjectId: 'chemistry',
    subjectCode: 'PNAP0133',
    subjectName: 'Chemistry / Research',
    department: 'Jabatan Sains Kimia & Kemahiran Penyelidikan',
  },
  {
    name: 'DR. SUGANTHY A/P KANAPATHY',
    email: 'sugantyk@ukm.edu.my',
    subjectId: 'chemistry',
    subjectCode: 'PNAP0133',
    subjectName: 'Chemistry / Research',
    department: 'Jabatan Sains Kimia & Kemahiran Penyelidikan',
  },
  {
    name: 'DR NORMAHIRAH BINTI NEK ABDUL RAHMAN',
    email: 'normahirah@ukm.edu.my',
    subjectId: 'logical_reasoning',
    subjectCode: 'PNAP0143',
    subjectName: 'Logical Reasoning',
    department: 'Unit Penaakulan Logik',
  },
  {
    name: 'MR MOHD HAFIZUL AZRIE OTHMAN',
    email: 'mhao@ukm.edu.my',
    subjectId: 'logical_reasoning',
    subjectCode: 'PNAP0143',
    subjectName: 'Logical Reasoning',
    department: 'Unit Penaakulan Logik',
  },
  {
    name: 'MS NUR SHAMIM BINTI HAMZAH',
    email: 'nurshamim@ukm.edu.my',
    subjectId: 'logical_reasoning',
    subjectCode: 'PNAP0143',
    subjectName: 'Logical Reasoning',
    department: 'Unit Penaakulan Logik',
  },
  {
    name: 'MS NUR NADIAH BINTI LANI',
    email: 'nadiah_lani@ukm.edu.my',
    subjectId: 'statistics',
    subjectCode: 'PNAP0154',
    subjectName: 'Statistics',
    department: 'Pusat Pengajian Sains Matematik & Statistik',
  },
  {
    name: 'MS AIN AFIQAH AMINUDDIN',
    email: 'ainafiqah@ukm.edu.my',
    subjectId: 'statistics',
    subjectCode: 'PNAP0154',
    subjectName: 'Statistics',
    department: 'Pusat Pengajian Sains Matematik & Statistik',
  },
  {
    name: 'MS NURUL AIN SALEHUDDIN HAQE',
    email: 'ainhaqe@ukm.edu.my',
    subjectId: 'statistics',
    subjectCode: 'PNAP0154',
    subjectName: 'Statistics',
    department: 'Pusat Pengajian Sains Matematik & Statistik',
  },
  {
    name: 'MS SITI NURATHIRAH NAZIRAH SALIKIN',
    email: 'athirahnazirah@ukm.edu.my',
    subjectId: 'language_literary',
    subjectCode: 'PNAP0162',
    subjectName: 'Language and Literary Appreciation',
    department: 'Pusat Pengajian Bahasa & Literasi',
  },
  {
    name: 'MS ERDANI SOFEA BINTI AHMAD SYAR’E',
    email: 'sofeasyare@ukm.edu.my',
    subjectId: 'language_literary',
    subjectCode: 'PNAP0162',
    subjectName: 'Language and Literary Appreciation',
    department: 'Pusat Pengajian Bahasa & Literasi',
  },
  {
    name: 'MS FARAH FARDILLAH BINTI ARIFF',
    email: 'farahfariff@ukm.edu.my',
    subjectId: 'research_skills',
    subjectCode: 'PNAP0182',
    subjectName: 'Research Skills',
    department: 'Unit Kemahiran Penyelidikan',
  },
  {
    name: 'PROF. MADYA TO’ PUAN DR. TENGKU ELMI AZLINA TENGKU MUDA',
    email: 'elmiazlina@ukm.edu.my',
    subjectId: 'jati_diri',
    subjectCode: 'PNAP0172',
    subjectName: 'Jati Diri',
    department: 'Unit Pembangunan Sahsiah & Jati Diri',
  },
  {
    name: 'MS SUHAINA BINTI YAAKOB',
    email: 'suhainaymd@ukm.edu.my',
    subjectId: 'jati_diri',
    subjectCode: 'PNAP0172',
    subjectName: 'Jati Diri',
    department: 'Unit Pembangunan Sahsiah & Jati Diri',
  },
];

export function findAuthorizedLecturer(email: string): AuthorizedLecturer | null {
  const clean = email.trim().toLowerCase();
  return AUTHORIZED_LECTURERS.find((l) => l.email.toLowerCase() === clean) || null;
}

export function isAuthorizedLecturerEmail(email: string): boolean {
  return findAuthorizedLecturer(email) !== null;
}
