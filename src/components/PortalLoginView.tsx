import React, { useState } from 'react';
import { UserProfile, SubjectId } from '../types.ts';
import { SUBJECTS, DEMO_ACCOUNTS } from '../data/mockData.ts';
import { dataService } from '../services/dataService.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { SUPPORTED_LANGUAGES, Language } from '../i18n/translations.ts';
import { ThemeToggle } from './ThemeToggle.tsx';
import {
  GraduationCap,
  Shield,
  ArrowRight,
  Check,
  Globe,
  Building2,
  Lock,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface PortalLoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export const PortalLoginView: React.FC<PortalLoginViewProps> = ({ onLogin }) => {
  const { lang, setLang, dict } = useLanguage();
  const [selectedPortal, setSelectedPortal] = useState<'student' | 'lecturer'>('student');

  // Student form state
  const [studentEmail, setStudentEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentSet, setStudentSet] = useState<number>(3);
  const [studentError, setStudentError] = useState('');

  // Lecturer form state
  const [lecturerEmail, setLecturerEmail] = useState('');
  const [lecturerName, setLecturerName] = useState('');
  const [lecturerSubject, setLecturerSubject] = useState<SubjectId>('chemistry');
  const [lecturerError, setLecturerError] = useState('');

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    const email = studentEmail.trim().toLowerCase();
    if (!email) {
      setStudentError(
        lang === 'ms'
          ? 'Sila masukkan emel siswa rasmi.'
          : 'Please enter a valid @siswa.ukm.edu.my email.'
      );
      return;
    }

    if (!email.endsWith('@siswa.ukm.edu.my')) {
      setStudentError(
        lang === 'ms'
          ? 'Akses Ditolak: Pelajar mesti menggunakan emel rasmi @siswa.ukm.edu.my'
          : 'Access Denied: Students must use @siswa.ukm.edu.my institutional email.'
      );
      return;
    }

    const registered = dataService.findStudentByEmail(email);
    const studentUser: UserProfile = {
      uid: `usr-std-${Date.now()}`,
      name: studentName.trim() || registered?.name || 'ASASIpintar Scholar',
      email: email,
      role: 'student',
      matricNumber: registered?.matricNumber || email.split('@')[0].toUpperCase(),
      setNumber: registered ? registered.setNumber : studentSet,
      currentCgpa: registered?.cgpa || 3.75,
      targetCgpa: 3.90,
      totalCreditsCompleted: 19,
      kokoMarks: registered?.kokoMarks || 86.5,
      kokoGrade: registered?.kokoGrade || 'A',
      kokoDetails: {
        uniformBody: 27.5,
        sports: 23.5,
        club: 25.5,
        specialProject: 10.0,
      },
    };

    onLogin(studentUser);
  };

  const handleLecturerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLecturerError('');

    const email = lecturerEmail.trim().toLowerCase();
    if (!email) {
      setLecturerError(
        lang === 'ms'
          ? 'Sila masukkan emel pensyarah UKM.'
          : 'Please enter a valid @ukm.edu.my faculty email.'
      );
      return;
    }

    if (!email.endsWith('@ukm.edu.my')) {
      setLecturerError(
        lang === 'ms'
          ? 'Akses Ditolak: Pensyarah mesti menggunakan emel rasmi @ukm.edu.my'
          : 'Access Denied: Lecturers must use @ukm.edu.my institutional email.'
      );
      return;
    }

    const subjectConfig = SUBJECTS.find((s) => s.id === lecturerSubject) || SUBJECTS[0];
    const lecturerUser: UserProfile = {
      uid: `usr-lec-${Date.now()}`,
      name: lecturerName.trim() || subjectConfig.lecturerName,
      email: email,
      role: 'lecturer',
      taughtSubject: lecturerSubject,
      taughtSubjectCode: subjectConfig.code,
      taughtSubjectName: subjectConfig.name,
      assignedSets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      department: `Pusat PERMATApintar Negara / ASASIpintar UKM (${subjectConfig.name})`,
    };

    onLogin(lecturerUser);
  };

  const handleSelectDemo = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    if (acc.role === 'student') {
      const registered = dataService.findStudentByEmail(acc.email);
      const studentUser: UserProfile = {
        uid: `usr-${acc.email.replace(/[@.]/g, '-')}`,
        name: acc.name.split(' (')[0],
        email: acc.email,
        role: 'student',
        matricNumber: acc.email.split('@')[0].toUpperCase(),
        setNumber: acc.setNumber || 3,
        currentCgpa: registered?.cgpa || 3.84,
        targetCgpa: 3.90,
        totalCreditsCompleted: 19,
        kokoMarks: registered?.kokoMarks || 88.5,
        kokoGrade: registered?.kokoGrade || 'A',
        kokoDetails: {
          uniformBody: 28.5,
          sports: 24.0,
          club: 26.0,
          specialProject: 10.0,
        },
      };
      onLogin(studentUser);
    } else {
      const subjectConfig = SUBJECTS.find((s) => s.id === acc.subject) || SUBJECTS[0];
      const lecturerUser: UserProfile = {
        uid: `usr-${acc.email.replace(/[@.]/g, '-')}`,
        name: acc.name.split(' (')[0],
        email: acc.email,
        role: 'lecturer',
        taughtSubject: acc.subject,
        taughtSubjectCode: subjectConfig.code,
        taughtSubjectName: subjectConfig.name,
        assignedSets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        department: `Pusat PERMATApintar Negara / ASASIpintar UKM (${subjectConfig.name})`,
      };
      onLogin(lecturerUser);
    }
  };

  const studentDemoAccounts = DEMO_ACCOUNTS.filter((a) => a.role === 'student');
  const lecturerDemoAccounts = DEMO_ACCOUNTS.filter((a) => a.role === 'lecturer');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar with Language Selector */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">
            P
          </div>
          <div>
            <div className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              PINTAR<span className="text-indigo-400">@Sphere</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                UKM
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Pusat PERMATApintar™ Negara • Kolej GENIUS@Pintar
            </div>
          </div>
        </div>

        {/* Right Controls: Theme Toggle & Language Switcher */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle variant="icon" />

          {/* 4-Language Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-inner">
            <Globe className="w-4 h-4 text-indigo-400 ml-1.5 mr-0.5 shrink-0" />
            <div className="flex items-center gap-1">
              {SUPPORTED_LANGUAGES.map((item) => {
                const isActive = lang === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLang(item.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                    title={item.label}
                  >
                    <span>{item.flag}</span>
                    <span className="hidden sm:inline">{item.nativeLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto my-auto py-8">
        {/* Header Notice Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>{dict.exclusiveNotice}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {dict.portalSelection}
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
            {dict.portalSelectionDesc}
          </p>
        </div>

        {/* Portal Switching Cards (Tabbed or 2-Column selection) */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
          {/* Top Switcher Tabs */}
          <div className="grid grid-cols-2 p-2 bg-slate-900/60 border-b border-slate-700/80 gap-2">
            <button
              type="button"
              onClick={() => setSelectedPortal('student')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                selectedPortal === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{dict.studentPortal}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPortal('lecturer')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                selectedPortal === 'lecturer'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{dict.lecturerPortal}</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {selectedPortal === 'student' ? (
              /* STUDENT PORTAL LOGIN */
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <div className="text-xs uppercase font-extrabold text-blue-400 tracking-wider">
                      {dict.studentPortal}
                    </div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {lang === 'ms'
                        ? 'Masuk ke Ruang Akademik Pelajar'
                        : lang === 'zh'
                        ? '进入学生学术控制台'
                        : lang === 'ta'
                        ? 'மாணவர் கல்வி பலகையில் நுழைக'
                        : 'Sign In to Student Academic Portal'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{dict.studentPortalDesc}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>

                {/* Quick Demo Student Profiles */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    {dict.quickProfiles} (ASASIpintar Cohort)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {studentDemoAccounts.map((acc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectDemo(acc)}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700 hover:border-blue-500 hover:bg-blue-950/30 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                            S{acc.setNumber}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-blue-300 truncate">
                              {acc.name.split(' (')[0]}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{acc.email}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Student Email Form */}
                <form
                  onSubmit={handleStudentSubmit}
                  className="space-y-4 pt-4 border-t border-slate-700/60"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {dict.institutionalEmail} (@siswa.ukm.edu.my)
                      </label>
                      <input
                        type="email"
                        placeholder="ap05710@siswa.ukm.edu.my"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {dict.selectSet}
                      </label>
                      <select
                        value={studentSet}
                        onChange={(e) => setStudentSet(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
                          <option key={s} value={s}>
                            Set {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {dict.enterName}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ahmad Danish bin Abdullah"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {studentError && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{studentError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                  >
                    <span>{dict.loginAsStudent}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              /* LECTURER PORTAL LOGIN */
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <div className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                      {dict.lecturerPortal}
                    </div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {lang === 'ms'
                        ? 'Masuk ke Ruang Pengurusan Pensyarah'
                        : lang === 'zh'
                        ? '进入讲师学术管理中枢'
                        : lang === 'ta'
                        ? 'விரிவுரையாளர் கல்வி மேலாண்மை மையத்தில் நுழைக'
                        : 'Sign In to Faculty Lecturer Command Center'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{dict.lecturerPortalDesc}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                </div>

                {/* Quick Demo Lecturer Profiles */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    {dict.quickProfiles} (ASASIpintar Academic Staff)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {lecturerDemoAccounts.map((acc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectDemo(acc)}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-950/30 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                            DR
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
                              {acc.name.split(' (')[0]}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{acc.email}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Lecturer Form */}
                <form
                  onSubmit={handleLecturerSubmit}
                  className="space-y-4 pt-4 border-t border-slate-700/60"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {dict.institutionalEmail} (@ukm.edu.my)
                      </label>
                      <input
                        type="email"
                        placeholder="dr.nurul@ukm.edu.my"
                        value={lecturerEmail}
                        onChange={(e) => setLecturerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {dict.selectSubject}
                      </label>
                      <select
                        value={lecturerSubject}
                        onChange={(e) => setLecturerSubject(e.target.value as SubjectId)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      >
                        {SUBJECTS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {dict.enterName}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Nurul Huda binti Othman"
                      value={lecturerName}
                      onChange={(e) => setLecturerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {lecturerError && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{lecturerError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                  >
                    <span>{dict.loginAsLecturer}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Security / Isolation Reminder */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{dict.switchRoleNotice}</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3 border-t border-slate-800/80">
        <div>
          PINTAR@Sphere © {new Date().getFullYear()} • Universiti Kebangsaan Malaysia (UKM)
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Pusat PERMATApintar™ Negara • Kolej GENIUS@Pintar • ASASIpintar Foundation
        </div>
      </footer>
    </div>
  );
};
