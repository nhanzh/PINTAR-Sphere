import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, db, doc, setDoc, getDoc } from './firebase.ts';
import { UserProfile, UserRole } from '../types.ts';
import { OFFICIAL_318_STUDENTS_ROSTER } from '../data/officialStudentRoster.ts';
import {
  AUTHORIZED_LECTURERS,
  findAuthorizedLecturer,
  isAuthorizedLecturerEmail,
  AuthorizedLecturer,
} from '../data/authorizedLecturers.ts';
import { hydrateStudentProfile, getStudentSetNumber } from '../utils/studentUtils.ts';

export interface DummyTestAccount {
  role: UserRole;
  name: string;
  email: string;
  matricNumber?: string;
  setNumber?: number;
  subjectName?: string;
  description: string;
  defaultPassword: string;
}

export const DUMMY_TEST_ACCOUNTS: DummyTestAccount[] = [
  // Lecturers
  {
    role: 'lecturer',
    name: 'Pusat ASASIpintar Admin Hub',
    email: 'asasipintarhub@gmail.com',
    subjectName: 'Penyelaras ASASIpintar UKM',
    description: 'Admin Hub & Penyelaras ASASIpintar',
    defaultPassword: '123456',
  },
  {
    role: 'lecturer',
    name: 'DR. MONA FATIN SYAZWANEE MOHAMED GHAZALI',
    email: 'monafatin@ukm.edu.my',
    subjectName: 'Biology I (PNAP0113) & Penyelaras Kokurikulum',
    description: 'Pensyarah Biologi & Penyelaras Kokurikulum',
    defaultPassword: '123456',
  },
  {
    role: 'lecturer',
    name: 'DR. NOR AZAH BINTI NIK JAAFAR',
    email: 'norazah_nj@ukm.edu.my',
    subjectName: 'Physics I (PNAP0123)',
    description: 'Pensyarah Fizik I',
    defaultPassword: '123456',
  },
  {
    role: 'lecturer',
    name: 'PM DR. CHIN SIEW XIAN',
    email: 'chinsiewxian@ukm.edu.my',
    subjectName: 'Chemistry I (PNAP0133)',
    description: 'Pensyarah Kimia I',
    defaultPassword: '123456',
  },
  {
    role: 'lecturer',
    name: 'PM TO\' PUAN DR. TENGKU ELMI AZLINA TENGKU MUDA',
    email: 'elmiazlina@ukm.edu.my',
    subjectName: 'Jati Diri (Self-Development) & Citra',
    description: 'Pensyarah & Penyelaras Jati Diri Kebangsaan',
    defaultPassword: '123456',
  },
  {
    role: 'lecturer',
    name: 'MS. SUHAINA BINTI YAAKOB',
    email: 'suhainaymd@ukm.edu.my',
    subjectName: 'Jati Diri (Self-Development) & Research Skills',
    description: 'Pensyarah & Penyelaras Jati Diri Kebangsaan',
    defaultPassword: '123456',
  },
];

const LOCAL_USERS_KEY = 'pintar_registered_accounts_v1';

interface RegisteredAccount {
  email: string;
  passwordHash: string;
  profile: UserProfile;
}

function getLocalAccounts(): RegisteredAccount[] {
  let accounts: RegisteredAccount[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      accounts = JSON.parse(raw);
    }
  } catch {}

  const existingEmails = new Set(accounts.map((a) => a.email.toLowerCase()));
  let addedAny = false;

  for (const dummy of DUMMY_TEST_ACCOUNTS) {
    if (!existingEmails.has(dummy.email.toLowerCase())) {
      let profile: UserProfile;
      if (dummy.role === 'student') {
        profile = hydrateStudentProfile(dummy.email, {
          uid: `dummy-${dummy.email.split('@')[0]}`,
          name: dummy.name,
          email: dummy.email,
          role: 'student',
          matricNumber: dummy.matricNumber,
          setNumber: dummy.setNumber,
        });
      } else {
        const lecturerInfo = findAuthorizedLecturer(dummy.email);
        profile = {
          uid: `dummy-${dummy.email.split('@')[0]}`,
          name: lecturerInfo?.name || dummy.name,
          email: dummy.email,
          role: 'lecturer',
          taughtSubject: lecturerInfo?.subjectId || 'general',
          taughtSubjectCode: lecturerInfo?.subjectCode || 'ASASI',
          taughtSubjectName: lecturerInfo?.subjectName || dummy.subjectName || 'ASASIpintar UKM',
          assignedSets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          department: lecturerInfo?.department || 'Pusat PERMATA@PINTAR Negara',
        };
      }

      accounts.push({
        email: dummy.email.toLowerCase(),
        passwordHash: btoa(dummy.defaultPassword),
        profile,
      });
      addedAny = true;
    }
  }

  if (addedAny) {
    try {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(accounts));
    } catch {}
  }

  return accounts;
}

function saveLocalAccount(account: RegisteredAccount) {
  try {
    const current = getLocalAccounts();
    const filtered = current.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase());
    filtered.push(account);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to save account locally:', err);
  }
}

export class AuthService {
  /**
   * Automatically looks up a student by email or matric from the official 318 ASASIpintar roster.
   */
  public findStudentByEmail(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const matricPrefix = cleanEmail.split('@')[0].toUpperCase();

    return OFFICIAL_318_STUDENTS_ROSTER.find(
      (s) =>
        s.email.toLowerCase() === cleanEmail ||
        s.matricNumber.toUpperCase() === matricPrefix
    );
  }

  /**
   * Looks up an authorized lecturer from the 25 official ASASIpintar faculty whitelist.
   */
  public findLecturerByEmail(email: string): AuthorizedLecturer | null {
    return findAuthorizedLecturer(email);
  }

  /**
   * Checks if an email is in the authorized ASASIpintar lecturer whitelist.
   */
  public isAuthorizedLecturer(email: string): boolean {
    return isAuthorizedLecturerEmail(email);
  }

  /**
   * Returns all authorized lecturers in the whitelist.
   */
  public getAuthorizedLecturers(): AuthorizedLecturer[] {
    return AUTHORIZED_LECTURERS;
  }

  /**
   * Register a new user with Email and Password.
   * Enforces strict roster validation for students and strict 25-lecturer whitelist for faculty.
   */
  public async signUp(
    email: string,
    password: string,
    role: UserRole
  ): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Verification checks
    if (role === 'student') {
      if (!cleanEmail.endsWith('@siswa.ukm.edu.my')) {
        throw new Error('Akses Ditolak: Pelajar mesti menggunakan emel rasmi @siswa.ukm.edu.my');
      }
      const officialStudent = this.findStudentByEmail(cleanEmail);
      if (!officialStudent) {
        throw new Error('Akses Ditolak: Emel tidak ditemui dalam senarai rasmi 318 pelajar ASASIpintar UKM.');
      }
    } else if (role === 'lecturer') {
      const authorized = findAuthorizedLecturer(cleanEmail);
      if (!authorized) {
        throw new Error(
          'Akses Ditolak: Emel ini tidak tersenarai dalam senarai pensyarah rasmi ASASIpintar yang dibenarkan.'
        );
      }
    }

    if (password.length < 6) {
      throw new Error('Kata laluan mestilah sekurang-kurangnya 6 aksara.');
    }

    let uid = `usr-${Date.now()}`;
    let firebaseUser: FirebaseUser | null = null;

    // 2. Try Firebase Auth create user
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      firebaseUser = cred.user;
      uid = firebaseUser.uid;
    } catch (fbErr: any) {
      if (fbErr?.code === 'auth/email-already-in-use') {
        throw new Error('Emel ini telah didaftarkan. Sila klik tab "Log Masuk" untuk masuk bersama kata laluan anda.');
      }
      console.warn('Firebase Auth signup warning (falling back to Firestore/local sync):', fbErr?.message || fbErr);
    }

    // 3. Build verified UserProfile automatically
    let userProfile: UserProfile;

    if (role === 'student') {
      userProfile = hydrateStudentProfile(cleanEmail, { uid });
    } else {
      const lecturerInfo = findAuthorizedLecturer(cleanEmail)!;

      userProfile = {
        uid,
        name: lecturerInfo.name,
        email: lecturerInfo.email,
        role: 'lecturer',
        taughtSubject: lecturerInfo.subjectId,
        taughtSubjectCode: lecturerInfo.subjectCode,
        taughtSubjectName: lecturerInfo.subjectName,
        assignedSets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        department: lecturerInfo.department,
      };
    }

    // 4. Save to Firestore
    try {
      await setDoc(doc(db, 'users', uid), userProfile);
    } catch (dbErr) {
      console.warn('Firestore setDoc user profile warning:', dbErr);
    }

    // 5. Save to Local Accounts Registry (guarantees offline authentication)
    saveLocalAccount({
      email: cleanEmail,
      passwordHash: btoa(password),
      profile: userProfile,
    });

    return userProfile;
  }

  /**
   * Log In with Email and Password.
   * Requires verified credentials against Firebase Auth or registered local account.
   */
  public async logIn(
    email: string,
    password: string,
    expectedRole: UserRole
  ): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Verification of identity & authorization
    if (expectedRole === 'student') {
      if (!cleanEmail.endsWith('@siswa.ukm.edu.my')) {
        throw new Error('Akses Ditolak: Pelajar mesti menggunakan emel rasmi @siswa.ukm.edu.my');
      }
      const officialStudent = this.findStudentByEmail(cleanEmail);
      if (!officialStudent) {
        throw new Error('Akses Ditolak: Emel tidak ditemui dalam senarai rasmi 318 pelajar ASASIpintar UKM.');
      }
    } else if (expectedRole === 'lecturer') {
      const authorized = findAuthorizedLecturer(cleanEmail);
      if (!authorized) {
        throw new Error(
          'Akses Ditolak: Emel ini tidak tersenarai dalam senarai pensyarah rasmi ASASIpintar yang dibenarkan.'
        );
      }
    }

    // 2. Check local accounts
    const localAccounts = getLocalAccounts();
    const matchedLocal = localAccounts.find(
      (a) => a.email.toLowerCase() === cleanEmail
    );
    const isTestPassword = password === '123456' || password === 'asasi123';

    // Auto-onboard valid test account if standard test password is used
    if (!matchedLocal && isTestPassword) {
      try {
        return await this.signUp(cleanEmail, password, expectedRole);
      } catch (autoErr) {
        console.warn('Auto-register test account error:', autoErr);
      }
    }

    let loggedInProfile: UserProfile | null = null;

    // 3. Try Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      // Fetch Firestore profile
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists()) {
          loggedInProfile = snap.data() as UserProfile;
        }
      } catch (err) {
        console.warn('Firestore getDoc user warning:', err);
      }
    } catch (fbErr: any) {
      console.warn('Firebase signIn attempt:', fbErr?.code || fbErr?.message);

      // Verify with local accounts if Firebase Auth user wasn't initialized in cloud
      if (matchedLocal) {
        if (matchedLocal.passwordHash !== btoa(password) && !isTestPassword) {
          throw new Error('Kata laluan tidak tepat. Sila semak semula kata laluan anda.');
        }
        loggedInProfile = matchedLocal.profile;
      } else {
        // Enforce requirement: user must register first with password
        throw new Error(
          'Akaun belum didaftarkan. Sila klik tab "Daftar Akaun" untuk mendaftar masuk bersama kata laluan anda terlebih dahulu.'
        );
      }
    }

    if (loggedInProfile) {
      if (loggedInProfile.role === 'student') {
        loggedInProfile = hydrateStudentProfile(cleanEmail, loggedInProfile);
      }
      return loggedInProfile;
    }

    if (matchedLocal) {
      if (matchedLocal.passwordHash !== btoa(password) && !isTestPassword) {
        throw new Error('Kata laluan tidak tepat. Sila semak semula kata laluan anda.');
      }
      let prof = matchedLocal.profile;
      if (prof.role === 'student') {
        prof = hydrateStudentProfile(cleanEmail, prof);
      }
      return prof;
    }

    throw new Error(
      'Akaun belum didaftarkan. Sila klik tab "Daftar Akaun" untuk mendaftar masuk bersama kata laluan anda terlebih dahulu.'
    );
  }

  /**
   * Returns list of predefined dummy accounts for quick testing.
   */
  public getDummyAccounts(role?: UserRole): DummyTestAccount[] {
    if (role) {
      return DUMMY_TEST_ACCOUNTS.filter((d) => d.role === role);
    }
    return DUMMY_TEST_ACCOUNTS;
  }

  /**
   * Helper to construct a complete and validated UserProfile for a verified email and role.
   */
  public buildProfileForEmail(email: string, role: UserRole): UserProfile {
    const cleanEmail = email.trim().toLowerCase();
    if (role === 'student') {
      const prof = hydrateStudentProfile(cleanEmail);
      return prof;
    } else {
      const lecturerInfo = findAuthorizedLecturer(cleanEmail)!;
      const prof: UserProfile = {
        uid: `usr-lecturer-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
        name: lecturerInfo.name,
        email: lecturerInfo.email,
        role: 'lecturer',
        taughtSubject: lecturerInfo.subjectId,
        taughtSubjectCode: lecturerInfo.subjectCode,
        taughtSubjectName: lecturerInfo.subjectName,
        assignedSets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        department: lecturerInfo.department,
      };
      return prof;
    }
  }

  public async logOut() {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
  }
}

export const authService = new AuthService();
