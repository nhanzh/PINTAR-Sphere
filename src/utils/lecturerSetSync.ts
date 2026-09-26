/**
 * Official ASASIpintar UKM Lecturer Set Assignment
 * Direct mapping of lecturers teaching specific sets per course.
 */
export function getLecturerForSetAndSubject(
  setNumber: number,
  courseCode: string,
  courseName?: string
): string {
  const code = (courseCode || '').toUpperCase();
  const name = (courseName || '').toLowerCase();
  const set = Number(setNumber) || 3;

  // Biologi (PNAP0113)
  if (code.includes('0113') || name.includes('bio')) {
    if ([1, 4, 5].includes(set)) return 'Dr. Ikhwan';
    if ([2, 7].includes(set)) return 'Dr. Ee Ling';
    if ([3, 6].includes(set)) return 'Dr. Mona';
    if ([8, 9, 10, 11].includes(set)) return 'Pn. Nisa';
    return 'Dr. Ikhwan';
  }

  // Kimia (PNAP0133)
  if (code.includes('0133') || name.includes('chem') || name.includes('kimia')) {
    if ([1, 2].includes(set)) return 'Dr. Teh';
    if ([3, 4].includes(set)) return 'Dr. Chin';
    if ([5, 8].includes(set)) return 'Dr. Haidah';
    if ([6, 9, 11].includes(set)) return 'Dr. Prema';
    if ([7, 10].includes(set)) return 'Dr. Suganthy';
    return 'Dr. Chin';
  }

  // Fizik (PNAP0123)
  if (code.includes('0123') || name.includes('phys') || name.includes('fizik')) {
    if ([1, 2, 7].includes(set)) return 'Dr. Izzah';
    if ([3, 4, 5, 6].includes(set)) return 'En. Afiq';
    if ([8, 11].includes(set)) return 'Dr. Farhah';
    if ([9, 10].includes(set)) return 'Dr. Azah';
    return 'En. Afiq';
  }

  // Statistik (PNAP0154)
  if (code.includes('0154') || name.includes('stat')) {
    if ([1, 2, 3, 4].includes(set)) return 'Cik Nurul Ain';
    if ([5, 6, 7, 8].includes(set)) return 'Cik Ain Afiqah';
    if ([9, 10, 11].includes(set)) return 'Cik Nadiah';
    return 'Cik Nurul Ain';
  }

  // Logical Reasoning / Penaakulan Mantik (PNAP0143)
  if (
    code.includes('0143') ||
    name.includes('logic') ||
    name.includes('mantik') ||
    name.includes('reason')
  ) {
    if ([1, 2, 3, 4].includes(set)) return 'Cik Shamim';
    if ([5, 6, 7, 8].includes(set)) return 'En. Hafizul';
    if ([9, 10, 11].includes(set)) return 'Dr. Mahirah';
    return 'Cik Shamim';
  }

  // Language & Learning Arts (LLA) / Apresiasi Bahasa dan Kesusasteraan (PNAP0162)
  if (
    code.includes('0162') ||
    name.includes('language') ||
    name.includes('literary') ||
    name.includes('apresiasi') ||
    name.includes('lla')
  ) {
    if ([1, 2, 3, 4, 5, 6].includes(set)) return 'Cik Sofea';
    if ([7, 8, 9, 10, 11].includes(set)) return 'Cik Athirah';
    return 'Cik Sofea';
  }

  // Research Skills / Kemahiran Penyelidikan (PNAP0182)
  if (code.includes('0182') || name.includes('research') || name.includes('penyelidikan')) {
    if ([1, 2, 3, 4, 5, 7, 8, 9].includes(set)) return 'Cik Farah';
    if (set === 6) return 'Dr. Suganthy';
    if ([10, 11].includes(set)) return 'Dr. Prema';
    return 'Cik Farah';
  }

  // Jati Diri (PNAP0172)
  if (code.includes('0172') || name.includes('jati')) {
    return 'Dr. Elmi Azlina & Pn. Suhaina';
  }

  return 'Pensyarah Kursus';
}
