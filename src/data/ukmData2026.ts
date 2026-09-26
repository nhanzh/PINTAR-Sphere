import { ClassScheduleItem, CalendarEvent } from '../types.ts';

/**
 * KALENDAR SESI AKADEMIK 2026/2027
 * Fakulti / Institut / Pusat: Pusat PERMATApintar Negara
 * Program: ASASI PINTAR, Universiti Kebangsaan Malaysia (UKM)
 * Dokumen Asal: LAMPIRAN B - UKM
 */

export interface AcademicActivityScheduleItem {
  id: string;
  perkara: string;
  semester1: string;
  semester2: string;
  tempohSem1: string;
  tempohSem2: string;
}

export interface PublicHolidayDetail {
  id: string;
  nama: string;
  tarikh: string;
  hari: string;
  semester: 1 | 2;
}

export const UKM_ACADEMIC_ACTIVITIES_2026_2027: AcademicActivityScheduleItem[] = [
  {
    id: 'act-1',
    perkara: 'Lapor Diri Pelajar Baru dan MMP',
    semester1: '22 – 24 Jun 2026',
    semester2: '-',
    tempohSem1: '3 hari',
    tempohSem2: '-',
  },
  {
    id: 'act-2',
    perkara: 'Sesi Pembelajaran',
    semester1: '29 Jun – 16 Ogos 2026',
    semester2: '7 Dis. 2026 – 7 Feb. 2027',
    tempohSem1: '7 minggu',
    tempohSem2: '8 minggu',
  },
  {
    id: 'act-3',
    perkara: 'Cuti Pertengahan Semester',
    semester1: '17 – 23 Ogos 2026',
    semester2: '8 – 14 Feb. 2027',
    tempohSem1: '1 minggu',
    tempohSem2: '1 minggu',
  },
  {
    id: 'act-4',
    perkara: 'Peperiksaan Pertengahan Semester',
    semester1: '24 – 30 Ogos 2026',
    semester2: '15 – 21 Feb. 2027',
    tempohSem1: '1 minggu',
    tempohSem2: '1 minggu',
  },
  {
    id: 'act-5',
    perkara: 'Sesi Pembelajaran (Sambungan)',
    semester1: '31 Ogos – 8 Nov. 2026',
    semester2: '22 Feb. – 25 Apr. 2027',
    tempohSem1: '10 minggu',
    tempohSem2: '9 minggu',
  },
  {
    id: 'act-6',
    perkara: 'Minggu Ulangkaji',
    semester1: '9 Nov. – 15 Nov. 2026',
    semester2: '26 Apr. – 9 Mei 2027',
    tempohSem1: '1 minggu',
    tempohSem2: '2 minggu',
  },
  {
    id: 'act-7',
    perkara: 'Peperiksaan Akhir',
    semester1: '16 – 22 Nov. 2026',
    semester2: '10 – 16 Mei 2027',
    tempohSem1: '1 minggu',
    tempohSem2: '1 minggu',
  },
  {
    id: 'act-8',
    perkara: 'Cuti Semester',
    semester1: '23 Nov. – 6 Dis. 2026',
    semester2: '-',
    tempohSem1: '2 minggu',
    tempohSem2: '-',
  },
];

export const UKM_PUBLIC_HOLIDAYS_2026_2027: PublicHolidayDetail[] = [
  // Semester 1
  {
    id: 'hol-1',
    nama: 'Maulidur Rasul',
    tarikh: '25 Ogos 2026',
    hari: 'Selasa',
    semester: 1,
  },
  {
    id: 'hol-2',
    nama: 'Hari Kebangsaan',
    tarikh: '31 Ogos 2026',
    hari: 'Isnin',
    semester: 1,
  },
  {
    id: 'hol-3',
    nama: 'Hari Malaysia',
    tarikh: '16 Sep. 2026',
    hari: 'Rabu',
    semester: 1,
  },
  {
    id: 'hol-4',
    nama: 'Hari Deepavali',
    tarikh: '8 Nov. 2026',
    hari: 'Ahad',
    semester: 1,
  },
  {
    id: 'hol-5',
    nama: 'Cuti Perayaan Deepavali',
    tarikh: '9 Nov. 2026',
    hari: 'Isnin',
    semester: 1,
  },
  // Semester 2
  {
    id: 'hol-6',
    nama: 'Keputeraan Sultan Selangor',
    tarikh: '11 Dis. 2026',
    hari: 'Jumaat',
    semester: 2,
  },
  {
    id: 'hol-7',
    nama: 'Hari Krismas',
    tarikh: '25 Dis. 2026',
    hari: 'Jumaat',
    semester: 2,
  },
  {
    id: 'hol-8',
    nama: 'Tahun Baharu',
    tarikh: '1 Jan. 2027',
    hari: 'Jumaat',
    semester: 2,
  },
  {
    id: 'hol-9',
    nama: 'Hari Thaipusam',
    tarikh: '22 Jan. 2027',
    hari: 'Jumaat',
    semester: 2,
  },
  {
    id: 'hol-10',
    nama: 'Tahun Baru Cina',
    tarikh: '6 & 7 Feb. 2027',
    hari: 'Sabtu / Ahad',
    semester: 2,
  },
  {
    id: 'hol-11',
    nama: 'Cuti Perayaan Tahun Baru Cina',
    tarikh: '8 Feb. 2027',
    hari: 'Isnin',
    semester: 2,
  },
  {
    id: 'hol-12',
    nama: 'Nuzul Quran',
    tarikh: '24 Feb. 2027',
    hari: 'Rabu',
    semester: 2,
  },
  {
    id: 'hol-13',
    nama: 'Hari Raya Aidil Fitri',
    tarikh: '10 & 11 Mac 2027',
    hari: 'Rabu / Khamis',
    semester: 2,
  },
  {
    id: 'hol-14',
    nama: 'Hari Pekerja',
    tarikh: '1 Mei 2027',
    hari: 'Sabtu',
    semester: 2,
  },
  {
    id: 'hol-15',
    nama: 'Hari Raya Aidil Adha',
    tarikh: '17 Mei 2027',
    hari: 'Isnin',
    semester: 2,
  },
  {
    id: 'hol-16',
    nama: 'Hari Wesak',
    tarikh: '20 Mei 2027',
    hari: 'Khamis',
    semester: 2,
  },
];

export const OFFICIAL_UKM_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-mmp',
    title: 'Lapor Diri Pelajar Baru dan MMP',
    date: '2026-06-22',
    endDate: '2026-06-24',
    category: 'academic',
    description: 'Minggu Mesra Pelajar (MMP) dan pendaftaran rasmi kohort ASASIpintar Sesi 2026/2027.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-sem1-cycle1',
    title: 'Sesi Pembelajaran Semester 1 (7 Minggu)',
    date: '2026-06-29',
    endDate: '2026-08-16',
    category: 'academic',
    description: 'Kuliah perdana dan tutorial makmal fasa pertama.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-cuti-mid-sem1',
    title: 'Cuti Pertengahan Semester 1 (1 Minggu)',
    date: '2026-08-17',
    endDate: '2026-08-23',
    category: 'holiday',
    description: 'Cuti rehat pertengahan semester UKM.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-exam-mid-sem1',
    title: 'Peperiksaan Pertengahan Semester 1 (1 Minggu)',
    date: '2026-08-24',
    endDate: '2026-08-30',
    category: 'exam',
    description: 'Ujian pertengahan semester bagi semua kursus teras sains dan statistik.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-hol-maulidur',
    title: 'Cuti Umum: Maulidur Rasul',
    date: '2026-08-25',
    category: 'holiday',
    description: 'Hari Kelepasan Am Persekutuan.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-hol-kebangsaan',
    title: 'Cuti Umum: Hari Kebangsaan Malaysia Ke-69',
    date: '2026-08-31',
    category: 'holiday',
    description: 'Hari Kemerdekaan Malaysia.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-sem1-cycle2',
    title: 'Sesi Pembelajaran Sambungan Semester 1 (10 Minggu)',
    date: '2026-08-31',
    endDate: '2026-11-08',
    category: 'academic',
    description: 'Sesi kuliah dan amali makmal fasa lanjutan Semester 1.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-hol-malaysia',
    title: 'Cuti Umum: Hari Malaysia',
    date: '2026-09-16',
    category: 'holiday',
    description: 'Hari Kelepasan Am Pembentukan Persekutuan Malaysia.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-hol-deepavali',
    title: 'Cuti Umum: Hari Deepavali & Perayaan',
    date: '2026-11-08',
    endDate: '2026-11-09',
    category: 'holiday',
    description: 'Cuti Umum Deepavali.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-ulang-sem1',
    title: 'Minggu Ulangkaji Semester 1 (1 Minggu)',
    date: '2026-11-09',
    endDate: '2026-11-15',
    category: 'academic',
    description: 'Minggu persediaan dan ulangkaji intensif peperiksaan akhir semester.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-exam-final-sem1',
    title: 'Peperiksaan Akhir Semester 1 (1 Minggu)',
    date: '2026-11-16',
    endDate: '2026-11-22',
    category: 'exam',
    description: 'Peperiksaan Akhir Semester 1 Program ASASIpintar UKM.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-cuti-sem1',
    title: 'Cuti Semester 1 (2 Minggu)',
    date: '2026-11-23',
    endDate: '2026-12-06',
    category: 'holiday',
    description: 'Cuti akhir Semester 1 bagi semua pelajar ASASIpintar.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-sem2-start',
    title: 'Sesi Pembelajaran Semester 2 Bermula (8 Minggu)',
    date: '2026-12-07',
    endDate: '2027-02-07',
    category: 'academic',
    description: 'Permulaan sesi pembelajaran Semester 2.',
    targetSets: ['all'],
    isOfficial: true,
  },
  {
    id: 'cal-exam-final-sem2',
    title: 'Peperiksaan Akhir Semester 2 (1 Minggu)',
    date: '2027-05-10',
    endDate: '2027-05-16',
    category: 'exam',
    description: 'Peperiksaan Akhir Semester 2 Penentu Kelayakan Ijazah Sarjana Muda UKM.',
    targetSets: ['all'],
    isOfficial: true,
  },
];

/**
 * JADUAL KULIAH SEMESTER 1 SESI AKADEMIK 2026/2027
 * Program ASASIpintar UKM | Kemaskini: 20 Ogos 2026
 * Dieksport secara modular dari ukmTimetable2026.ts
 */
export { OFFICIAL_UKM_CLASS_SCHEDULES } from './ukmTimetable2026.ts';
