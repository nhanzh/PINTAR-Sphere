import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types.ts';
import { authService, DUMMY_TEST_ACCOUNTS, DummyTestAccount } from '../services/authService.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { SUPPORTED_LANGUAGES } from '../i18n/translations.ts';
import { ThemeToggle } from './ThemeToggle.tsx';
import {
  GraduationCap,
  Shield,
  ArrowRight,
  Globe,
  Building2,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  Sparkles,
} from 'lucide-react';

interface PortalLoginViewProps {
  onLogin: (user: UserProfile) => void;
  initialPortal?: 'student' | 'lecturer';
  lockedPortal?: 'student' | 'lecturer';
}

export const PortalLoginView: React.FC<PortalLoginViewProps> = ({
  onLogin,
  initialPortal = 'student',
  lockedPortal,
}) => {
  const { lang, setLang, dict } = useLanguage();
  const [portalChoice, setPortalChoice] = useState<'student' | 'lecturer'>(initialPortal || 'student');
  const activePortal = lockedPortal || portalChoice;
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleQuickDemoLogin = async (acc: DummyTestAccount) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    if (acc.role === 'student') {
      setStudentEmail(acc.email);
      setStudentPassword(acc.defaultPassword);
    } else {
      setLecturerEmail(acc.email);
      setLecturerPassword(acc.defaultPassword);
    }

    try {
      const user = await authService.logIn(acc.email, acc.defaultPassword, acc.role);
      setSuccessMessage(
        lang === 'ms'
          ? `Log masuk berjaya sebagai ${acc.name}!`
          : `Signed in successfully as ${acc.name}!`
      );
      setTimeout(() => {
        onLogin(user);
      }, 400);
    } catch (err: any) {
      try {
        const newUser = await authService.signUp(acc.email, acc.defaultPassword, acc.role);
        setSuccessMessage(
          lang === 'ms'
            ? `Log masuk berjaya sebagai ${acc.name}!`
            : `Signed in successfully as ${acc.name}!`
        );
        setTimeout(() => {
          onLogin(newUser);
        }, 400);
      } catch (signupErr: any) {
        setErrorMessage(signupErr?.message || err?.message || 'Ralat log masuk akaun dummy.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Student auth states (Strictly email + password, NO manual name or set entry)
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentConfirmPassword, setStudentConfirmPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Lecturer auth states
  const [lecturerEmail, setLecturerEmail] = useState('');
  const [lecturerPassword, setLecturerPassword] = useState('');
  const [lecturerConfirmPassword, setLecturerConfirmPassword] = useState('');
  const [showLecturerPassword, setShowLecturerPassword] = useState(false);

  // Common UI states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const email = studentEmail.trim().toLowerCase();
    if (!email) {
      setErrorMessage(
        lang === 'ms'
          ? 'Sila masukkan emel rasmi siswa UKM anda.'
          : 'Please enter your official UKM siswa email address.'
      );
      return;
    }

    if (!email.endsWith('@siswa.ukm.edu.my')) {
      setErrorMessage(dict.studentEmailRequirement);
      return;
    }

    const rosterStudent = authService.findStudentByEmail(email);
    if (!rosterStudent) {
      setErrorMessage(
        lang === 'ms'
          ? 'Akses Ditolak: Emel tidak ditemui dalam senarai rasmi 318 pelajar ASASIpintar UKM.'
          : 'Access Denied: Email not found in official 318 ASASIpintar student roster.'
      );
      return;
    }

    if (!studentPassword) {
      setErrorMessage(
        lang === 'ms'
          ? 'Sila masukkan kata laluan anda.'
          : 'Please enter your password.'
      );
      return;
    }

    if (authMode === 'signup') {
      if (studentPassword.length < 6) {
        setErrorMessage(dict.passwordTooShort);
        return;
      }
      if (studentPassword !== studentConfirmPassword) {
        setErrorMessage(dict.passwordsDoNotMatch);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (authMode === 'signup') {
        const newUser = await authService.signUp(email, studentPassword, 'student');
        setSuccessMessage(dict.signUpSuccessMessage);
        setTimeout(() => {
          onLogin(newUser);
        }, 800);
      } else {
        const user = await authService.logIn(email, studentPassword, 'student');
        setSuccessMessage(dict.loginSuccessMessage);
        setTimeout(() => {
          onLogin(user);
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ralat pengesahan. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLecturerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const email = lecturerEmail.trim().toLowerCase();
    if (!email) {
      setErrorMessage(
        lang === 'ms'
          ? 'Sila masukkan emel rasmi pensyarah yang dibenarkan.'
          : 'Please enter your official authorized faculty email.'
      );
      return;
    }

    if (!authService.isAuthorizedLecturer(email)) {
      setErrorMessage(
        lang === 'ms'
          ? 'Akses Ditolak: Emel ini tidak tersenarai dalam senarai pensyarah rasmi ASASIpintar yang dibenarkan.'
          : 'Access Denied: This email is not in the authorized ASASIpintar faculty list.'
      );
      return;
    }

    if (!lecturerPassword) {
      setErrorMessage(
        lang === 'ms'
          ? 'Sila masukkan kata laluan anda.'
          : 'Please enter your password.'
      );
      return;
    }

    if (authMode === 'signup') {
      if (lecturerPassword.length < 6) {
        setErrorMessage(dict.passwordTooShort);
        return;
      }
      if (lecturerPassword !== lecturerConfirmPassword) {
        setErrorMessage(dict.passwordsDoNotMatch);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (authMode === 'signup') {
        const newUser = await authService.signUp(email, lecturerPassword, 'lecturer');
        setSuccessMessage(dict.signUpSuccessMessage);
        setTimeout(() => {
          onLogin(newUser);
        }, 800);
      } else {
        const user = await authService.logIn(email, lecturerPassword, 'lecturer');
        setSuccessMessage(dict.loginSuccessMessage);
        setTimeout(() => {
          onLogin(user);
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ralat pengesahan. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-indigo-50/40 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      {/* Top Bar with Brand & Language Selector */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          {/* Dual Official Logos: UKM Crest & ASASIpintar */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800/90 p-1.5 px-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80">
            <img
              src="/ukm.jpeg"
              alt="Universiti Kebangsaan Malaysia Crest"
              className="h-9 sm:h-11 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="h-7 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
            <img
              src="/asasi_pintar.jpeg"
              alt="ASASIpintar Logo"
              className="h-8 sm:h-9 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
              <span className="text-black bg-slate-200 dark:bg-white dark:text-black px-1.5 py-0.5 rounded font-black">PINTAR</span>
              <span className="text-red-600 dark:text-red-500 font-extrabold">@Sphere</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-400/30">
                UKM
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Program ASASIpintar • Universiti Kebangsaan Malaysia (UKM)
            </div>
          </div>
        </div>

        {/* Right Controls: Theme Toggle & Language Switcher */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle variant="icon" />

          {/* 4-Language Switcher */}
          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <Globe className="w-4 h-4 text-indigo-500 dark:text-indigo-400 ml-1.5 mr-0.5 shrink-0" />
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
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
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
      <div className="max-w-3xl w-full mx-auto my-auto py-8">
        {/* Dedicated Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>
              {activePortal === 'student'
                ? 'Universiti Kebangsaan Malaysia • Program ASASIpintar'
                : 'Universiti Kebangsaan Malaysia • Pusat PERMATA@PINTAR Negara'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {activePortal === 'student' ? dict.studentPortal : dict.lecturerPortal}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
            {activePortal === 'student'
              ? (lang === 'ms'
                  ? 'Laman Pengesahan Rasmi Pelajar Pra-Universiti ASASIpintar UKM (@siswa.ukm.edu.my)'
                  : 'Official Authentication Gateway for Enrolled ASASIpintar Students (@siswa.ukm.edu.my)')
              : (lang === 'ms'
                  ? 'Laman Log Masuk Pensyarah & Pentadbir ASASIpintar UKM'
                  : 'ASASIpintar Faculty & Admin Portal Access')}
          </p>
        </div>

        {/* Portal Selection Switcher Cards */}
        {!lockedPortal && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => {
                setPortalChoice('student');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                activePortal === 'student'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white border-blue-600 shadow-lg ring-2 ring-blue-500/30'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activePortal === 'student' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black">{dict.studentPortal}</div>
                <div className={`text-[11px] ${activePortal === 'student' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                  Student Portal Gateway
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setPortalChoice('lecturer');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                activePortal === 'lecturer'
                  ? 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white border-emerald-600 shadow-lg ring-2 ring-emerald-500/30'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activePortal === 'lecturer' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black">{dict.lecturerPortal}</div>
                <div className={`text-[11px] ${activePortal === 'lecturer' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                  Lecturer Portal Gateway
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Dedicated Portal Authentication Card */}
        <div className="bg-white dark:bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden transition-colors">
          {/* Dedicated Portal Banner Header */}
          <div className={`p-4 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 ${
            activePortal === 'student'
              ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white'
              : 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold ${
                activePortal === 'student'
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {activePortal === 'student' ? (
                  <GraduationCap className="w-5 h-5" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-sm font-extrabold text-white">
                  {activePortal === 'student' ? dict.studentPortal : dict.lecturerPortal}
                </div>
                <div className="text-[11px] text-white/80">
                  {activePortal === 'student'
                    ? (lang === 'ms' ? 'Laman Pengesahan Rasmi Pelajar' : 'Official Student Portal')
                    : (lang === 'ms' ? 'Laman Pengesahan Rasmi Pensyarah' : 'Official Lecturer Portal')}
                </div>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/20 text-white border border-white/30 font-mono">
              {activePortal === 'student' ? '/student' : '/lecturer'}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Sub-Tabs: Sign In vs Sign Up */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'login'
                      ? activePortal === 'student'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {dict.tabLogin}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? activePortal === 'student'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {dict.tabSignUp}
                </button>
              </div>
            </div>

            {/* Error or Success notification */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {activePortal === 'student' ? (
              /* STUDENT PORTAL (Strictly Email & Password - Auto Identity Linking) */
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700/60 pb-4">
                  <div>
                    <div className="text-xs uppercase font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
                      {dict.studentPortal} • {authMode === 'signup' ? dict.tabSignUp : dict.tabLogin}
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {authMode === 'signup'
                        ? lang === 'ms'
                          ? 'Daftar Akaun Pelajar Baharu'
                          : 'Create Student Account'
                        : lang === 'ms'
                        ? 'Masuk ke Ruang Akademik Pelajar'
                        : 'Sign In to Student Academic Portal'}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {dict.studentPortalDesc}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>

                {/* Student Email & Password Form */}
                <form onSubmit={handleStudentAuth} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {dict.institutionalEmail} (@siswa.ukm.edu.my)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                        Format: apXXXXX@siswa.ukm.edu.my
                      </span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter Your Email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {dict.password}
                      </span>
                      {authMode === 'signup' && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          Min. 6 aksara
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showStudentPassword ? 'text' : 'password'}
                        required
                        placeholder={dict.passwordPlaceholder}
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field (Sign Up Mode only) */}
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {dict.confirmPassword}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder={dict.confirmPasswordPlaceholder}
                        value={studentConfirmPassword}
                        onChange={(e) => setStudentConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    <span>
                      {isLoading
                        ? 'Memproses...'
                        : authMode === 'signup'
                        ? dict.signUpAsStudent
                        : dict.loginAsStudent}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Toggle between Login and Sign Up text */}
                  <div className="text-center pt-2">
                    {authMode === 'login' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setErrorMessage('');
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                      >
                        {lang === 'ms'
                          ? 'Belum mempunyai kata laluan? Klik di sini untuk Daftar Akaun'
                          : 'No password yet? Click here to Sign Up'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setErrorMessage('');
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                      >
                        {lang === 'ms'
                          ? 'Sudah mendaftar akaun? Klik di sini untuk Log Masuk'
                          : 'Already registered? Click here to Sign In'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              /* LECTURER PORTAL (Email & Password - Auto Faculty Directory Matching) */
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700/60 pb-4">
                  <div>
                    <div className="text-xs uppercase font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider">
                      {dict.lecturerPortal} • {authMode === 'signup' ? dict.tabSignUp : dict.tabLogin}
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {authMode === 'signup'
                        ? lang === 'ms'
                          ? 'Daftar Akaun Pensyarah Baharu'
                          : 'Register Faculty Account'
                        : lang === 'ms'
                        ? 'Masuk ke Ruang Pengurusan Pensyarah'
                        : 'Sign In to Faculty Lecturer Command Center'}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{dict.lecturerPortalDesc}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                </div>

                {/* Lecturer Email & Password Form */}
                <form onSubmit={handleLecturerAuth} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {dict.institutionalEmail}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                        Emel Pensyarah Sah
                      </span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter Your Email"
                      value={lecturerEmail}
                      onChange={(e) => setLecturerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {dict.password}
                      </span>
                      {authMode === 'signup' && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          Min. 6 aksara
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showLecturerPassword ? 'text' : 'password'}
                        required
                        placeholder={dict.passwordPlaceholder}
                        value={lecturerPassword}
                        onChange={(e) => setLecturerPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLecturerPassword(!showLecturerPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        {showLecturerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field (Sign Up Mode only) */}
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {dict.confirmPassword}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder={dict.confirmPasswordPlaceholder}
                        value={lecturerConfirmPassword}
                        onChange={(e) => setLecturerConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <span>
                      {isLoading
                        ? 'Memproses...'
                        : authMode === 'signup'
                        ? dict.signUpAsLecturer
                        : dict.loginAsLecturer}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Toggle between Login and Sign Up text */}
                  <div className="text-center pt-2">
                    {authMode === 'login' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setErrorMessage('');
                        }}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                      >
                        {lang === 'ms'
                          ? 'Belum mempunyai kata laluan? Klik di sini untuk Daftar Akaun'
                          : 'No password yet? Click here to Register'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setErrorMessage('');
                        }}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                      >
                        {lang === 'ms'
                          ? 'Sudah mendaftar akaun? Klik di sini untuk Log Masuk'
                          : 'Already registered? Click here to Sign In'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Official UKM Security Notice */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {activePortal === 'student'
              ? (lang === 'ms'
                  ? 'Laman portal pelajar disahkan khusus untuk 318 pelajar kohort rasmi ASASIpintar UKM.'
                  : 'Student portal gateway restricted to official 318 ASASIpintar cohort students.')
              : (lang === 'ms'
                  ? 'Akses portal pensyarah rasmi ASASIpintar UKM.'
                  : 'Official ASASIpintar faculty portal access.')}
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 dark:text-slate-400 py-3 border-t border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-center gap-1">
          <span className="text-black bg-slate-200 dark:bg-white px-1 rounded font-bold text-[10px]">PINTAR</span>
          <span className="text-red-600 dark:text-red-500 font-bold text-[10px]">@Sphere</span>
          <span>© {new Date().getFullYear()} • Universiti Kebangsaan Malaysia (UKM)</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Program ASASIpintar • Universiti Kebangsaan Malaysia (UKM)
        </div>
      </footer>
    </div>
  );
};
