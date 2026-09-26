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

const LOCAL_USERS_KEY = 'pintar_registered_accounts_v1';

interface RegisteredAccount {
  email: string;
  passwordHash: string;
  profile: UserProfile;
}

function getLocalAccounts(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
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
          'Akses Ditolak: Emel ini tidak tersenarai dalam senarai pensyarah rasmi ASASIpintar yang dibenarkan. Hanya 25 emel pensyarah berdaftar sahaja yang dibenarkan.'
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
      const officialStudent = this.findStudentByEmail(cleanEmail);
      const matricNumber = officialStudent?.matricNumber || cleanEmail.split('@')[0].toUpperCase();
      const studentName = officialStudent?.name || `ASASIpintar Scholar (${matricNumber})`;
      const setNumber = officialStudent?.setNumber || 1;

      userProfile = {
        uid,
        name: studentName,
        email: cleanEmail,
        role: 'student',
        matricNumber,
        setNumber,
        currentCgpa: null,
        targetCgpa: 3.90,
        totalCreditsCompleted: 19,
        kokoMarks: null,
        kokoGrade: null,
        kokoDetails: null,
      };
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
   * Enforces that users must register their account with a password first.
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
          'Akses Ditolak: Emel ini tidak tersenarai dalam senarai pensyarah rasmi ASASIpintar yang dibenarkan. Hanya 25 emel pensyarah berdaftar sahaja yang dibenarkan.'
        );
      }
    }

    // 2. Check local accounts
    const localAccounts = getLocalAccounts();
    const matchedLocal = localAccounts.find(
      (a) => a.email.toLowerCase() === cleanEmail
    );

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
        if (matchedLocal.passwordHash !== btoa(password)) {
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
      return loggedInProfile;
    }

    if (matchedLocal) {
      if (matchedLocal.passwordHash !== btoa(password)) {
        throw new Error('Kata laluan tidak tepat. Sila semak semula kata laluan anda.');
      }
      return matchedLocal.profile;
    }

    throw new Error(
      'Akaun belum didaftarkan. Sila klik tab "Daftar Akaun" untuk mendaftar masuk bersama kata laluan anda terlebih dahulu.'
    );
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
