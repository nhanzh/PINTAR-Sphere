import { OFFICIAL_318_STUDENTS_ROSTER } from '../data/officialStudentRoster.ts';
import { AUTHORIZED_LECTURERS } from '../data/authorizedLecturers.ts';
import { UserProfile, StudentRosterItem } from '../types.ts';

/**
 * Universal safe resolver for a student's Set Number (1 - 11).
 * Guarantees that "undefined" is NEVER returned or displayed for any student.
 */
export function getStudentSetNumber(
  identifier?:
    | {
        setNumber?: number | string;
        email?: string;
        studentEmail?: string;
        matricNumber?: string;
        studentId?: string;
        name?: string;
        studentName?: string;
      }
    | string
    | number
    | null
): number {
  if (typeof identifier === 'number' && !isNaN(identifier) && identifier >= 1 && identifier <= 11) {
    return Math.floor(identifier);
  }

  if (!identifier) return 1;

  if (typeof identifier === 'string') {
    const clean = identifier.trim().toLowerCase();
    // Check if it's already a numeric string or "Set X"
    const parsedNum = parseInt(clean.replace(/\D/g, ''), 10);
    if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 11 && (clean.startsWith('set') || clean.length <= 2)) {
      return parsedNum;
    }

    const matric = clean.split('@')[0].toUpperCase();
    const matched = OFFICIAL_318_STUDENTS_ROSTER.find(
      (s) =>
        s.email.toLowerCase() === clean ||
        s.matricNumber.toUpperCase() === matric ||
        s.name.toLowerCase() === clean
    );
    return matched?.setNumber || 1;
  }

  if (typeof identifier === 'object') {
    if (typeof identifier.setNumber === 'number' && !isNaN(identifier.setNumber) && identifier.setNumber >= 1 && identifier.setNumber <= 11) {
      return Math.floor(identifier.setNumber);
    }
    if (typeof identifier.setNumber === 'string') {
      const parsed = parseInt(identifier.setNumber.replace(/\D/g, ''), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 11) {
        return parsed;
      }
    }

    const email = (identifier.email || identifier.studentEmail || '').trim().toLowerCase();
    const matric = (identifier.matricNumber || email.split('@')[0] || '').trim().toUpperCase();
    const name = (identifier.name || identifier.studentName || '').trim().toLowerCase();

    if (email || matric || name) {
      const matched = OFFICIAL_318_STUDENTS_ROSTER.find(
        (s) =>
          (email && s.email.toLowerCase() === email) ||
          (matric && s.matricNumber.toUpperCase() === matric) ||
          (name && s.name.toLowerCase() === name) ||
          (name && s.name.toLowerCase().includes(name))
      );
      if (matched?.setNumber) return matched.setNumber;
    }
  }

  return 1;
}

/**
 * Returns formatted "Set X" guarantee (e.g. "Set 3"), never "Set undefined"
 */
export function formatStudentSet(identifier?: any): string {
  const setNumber = getStudentSetNumber(identifier);
  return `Set ${setNumber}`;
}

/**
 * Checks if the user is Penyelaras ASASIpintar / Admin Hub (overall program coordinator)
 * Penyelaras ASASIpintar has full administrative access to both koko applications and jati diri marks.
 */
export function isProgramCoordinator(email?: string, name?: string): boolean {
  if (!email && !name) return false;
  const cleanEmail = (email || '').toLowerCase().trim();
  const cleanName = (name || '').toLowerCase().trim();

  return (
    cleanEmail === 'asasipintarhub@gmail.com' ||
    cleanEmail.includes('admin') ||
    cleanEmail.includes('nurulhaidah') ||
    cleanEmail.includes('penyelaras') ||
    cleanName.includes('nurulhaidah') ||
    cleanName.includes('penyelaras asasi') ||
    cleanName.includes('admin hub') ||
    cleanName.includes('pusat asasipintar') ||
    cleanName.includes('admin')
  );
}

/**
 * Checks if the lecturer is Dr. Mona (Penyelaras Kokurikulum)
 * Dr. Mona can access and review Koko applications/activities (Penyertaan, Pencapaian, Perjawatan),
 * BUT CANNOT access Jati Diri marks.
 */
export function isKokoCoordinator(email?: string, name?: string): boolean {
  if (!email && !name) return false;
  const cleanEmail = (email || '').toLowerCase().trim();
  const cleanName = (name || '').toLowerCase().trim();

  return (
    cleanEmail === 'monafatin@ukm.edu.my' ||
    cleanEmail.includes('monafatin') ||
    cleanName.includes('mona fatin') ||
    cleanName.includes('dr. mona') ||
    cleanName.includes('dr mona')
  );
}

/**
 * Checks if the lecturer is Dr. Elmi or Puan Suhaina (Penyelaras Jati Diri Kebangsaan)
 * Dr. Elmi and Puan Suhaina can access Jati Diri marks ONLY,
 * and have NO access to Koko applications/review.
 */
export function isJatiDiriCoordinator(email?: string, name?: string): boolean {
  if (!email && !name) return false;
  const cleanEmail = (email || '').toLowerCase().trim();
  const cleanName = (name || '').toLowerCase().trim();

  return (
    cleanEmail === 'elmiazlina@ukm.edu.my' ||
    cleanEmail.includes('elmiazlina') ||
    cleanEmail === 'suhainaymd@ukm.edu.my' ||
    cleanEmail.includes('suhainaymd') ||
    cleanName.includes('elmi') ||
    cleanName.includes('tengku elmi') ||
    cleanName.includes('suhaina')
  );
}

/**
 * Who can access Koko Applications (Permohonan / Semakan Aktiviti Koko):
 * - Students (to submit & view own)
 * - All lecturers (to receive, view, and process student applications)
 */
export function canAccessKokoApplications(email?: string, name?: string, role?: string): boolean {
  // All lecturers can access and review koko applications submitted by students
  if (role === 'lecturer' || role === 'student') return true;
  return isProgramCoordinator(email, name) || isKokoCoordinator(email, name);
}

/**
 * Who can access Jati Diri Marks (Markah Jati Diri):
 * - Students (view own published result)
 * - All lecturers (can view and evaluate Jati Diri)
 */
export function canAccessJatiDiriMarks(email?: string, name?: string, role?: string): boolean {
  if (role === 'student' || role === 'lecturer') return true;
  return isProgramCoordinator(email, name) || isJatiDiriCoordinator(email, name);
}

/**
 * Who can see the Koko & Jati Diri Tab in Navigation / Sidebar:
 * - Students
 * - All lecturers (can view koko and process claims)
 */
export function canAccessKokoModule(email?: string, name?: string, role?: string): boolean {
  return true;
}

/**
 * Hydrates or generates complete UserProfile for any official student
 */
export function hydrateStudentProfile(email: string, partial?: Partial<UserProfile>): UserProfile {
  const cleanEmail = email.trim().toLowerCase();
  const matricFromEmail = cleanEmail.split('@')[0].toUpperCase();
  const official = OFFICIAL_318_STUDENTS_ROSTER.find(
    (s) => s.email.toLowerCase() === cleanEmail || s.matricNumber.toUpperCase() === matricFromEmail
  );

  const matricNumber = official?.matricNumber || partial?.matricNumber || matricFromEmail;
  const setNumber = official?.setNumber || getStudentSetNumber(partial) || getStudentSetNumber(cleanEmail);
  const name = official?.name || partial?.name || `ASASIpintar Scholar (${matricNumber})`;

  return {
    uid: partial?.uid || `usr-student-${matricNumber.toLowerCase()}`,
    name,
    email: cleanEmail,
    role: 'student',
    matricNumber,
    setNumber,
    currentCgpa: partial?.currentCgpa ?? null,
    targetCgpa: partial?.targetCgpa ?? 3.90,
    totalCreditsCompleted: partial?.totalCreditsCompleted ?? 19,
    kokoMarks: partial?.kokoMarks ?? null,
    kokoGrade: partial?.kokoGrade ?? null,
    kokoDetails: partial?.kokoDetails ?? null,
    avatarUrl: partial?.avatarUrl,
  };
}
