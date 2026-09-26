import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile } from '../types.ts';
import { authService } from '../services/authService.ts';
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
} from 'lucide-react';

interface PortalLoginViewProps {
  onLogin: (user: UserProfile) => void;
  initialPortal?: 'student' | 'lecturer';
}

export const PortalLoginView: React.FC<PortalLoginViewProps> = ({
  onLogin,
  initialPortal = 'student',
}) => {
  const { lang, setLang, dict } = useLanguage();
  const [selectedPortal, setSelectedPortal] = useState<'student' | 'lecturer'>(initialPortal);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (initialPortal) {
      setSelectedPortal(initialPortal);
    }
  }, [initialPortal]);

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
          ? 'Akses Ditolak: Emel ini tidak tersenarai dalam senarai pensyarah rasmi ASASIpintar yang dibenarkan. Hanya 25 emel pensyarah berdaftar sahaja yang dibenarkan mengakses portal ini.'
          : 'Access Denied: This email is not in the authorized ASASIpintar faculty list. Only the 25 official registered emails are allowed.'
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar with Brand & Language Selector */}
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
      <div className="max-w-3xl w-full mx-auto my-auto py-8">
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

        {/* Portal Switching Cards */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
          {/* Dedicated Portal Banner Header */}
          <div className={`p-4 border-b border-slate-700/80 flex items-center justify-between gap-3 ${
            selectedPortal === 'student'
              ? 'bg-gradient-to-r from-blue-900/60 to-slate-900/80'
              : 'bg-gradient-to-r from-emerald-900/60 to-slate-900/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold ${
                selectedPortal === 'student'
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {selectedPortal === 'student' ? (
                  <GraduationCap className="w-5 h-5" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-sm font-extrabold text-white">
                  {selectedPortal === 'student' ? dict.studentPortal : dict.lecturerPortal}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedPortal === 'student' ? 'Laman Pengesahan Rasmi Pelajar' : 'Laman Pengesahan Rasmi Pensyarah'}
                </div>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
              selectedPortal === 'student'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {selectedPortal === 'student' ? '/student' : '/lecturer'}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Sub-Tabs: Sign In vs Sign Up */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex p-1 rounded-xl bg-slate-900/80 border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'login'
                      ? selectedPortal === 'student'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
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
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'signup'
                      ? selectedPortal === 'student'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {dict.tabSignUp}
                </button>
              </div>
            </div>

            {/* Error or Success notification */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {selectedPortal === 'student' ? (
              /* STUDENT PORTAL (Strictly Email & Password - Auto Identity Linking) */
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <div className="text-xs uppercase font-extrabold text-blue-400 tracking-wider">
                      {dict.studentPortal} • {authMode === 'signup' ? dict.tabSignUp : dict.tabLogin}
                    </div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {authMode === 'signup'
                        ? lang === 'ms'
                          ? 'Daftar Akaun Pelajar Baharu'
                          : 'Create Student Account'
                        : lang === 'ms'
                        ? 'Masuk ke Ruang Akademik Pelajar'
                        : 'Sign In to Student Academic Portal'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {dict.studentPortalDesc}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>

                {/* Student Email & Password Form */}
                <form onSubmit={handleStudentAuth} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-400" />
                        {dict.institutionalEmail} (@siswa.ukm.edu.my)
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Format: apXXXXX@siswa.ukm.edu.my
                      </span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter Your Email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                        {dict.password}
                      </span>
                      {authMode === 'signup' && (
                        <span className="text-[11px] text-slate-400 font-normal">
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
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field (Sign Up Mode only) */}
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        {dict.confirmPassword}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder={dict.confirmPasswordPlaceholder}
                        value={studentConfirmPassword}
                        onChange={(e) => setStudentConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                        className="text-xs text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
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
                        className="text-xs text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
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
                <div className="flex items-start justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <div className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                      {dict.lecturerPortal} • {authMode === 'signup' ? dict.tabSignUp : dict.tabLogin}
                    </div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {authMode === 'signup'
                        ? lang === 'ms'
                          ? 'Daftar Akaun Pensyarah Baharu'
                          : 'Register Faculty Account'
                        : lang === 'ms'
                        ? 'Masuk ke Ruang Pengurusan Pensyarah'
                        : 'Sign In to Faculty Lecturer Command Center'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{dict.lecturerPortalDesc}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                </div>

                {/* Notice on password registration requirement */}
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <span className="font-semibold">
                      {lang === 'ms' ? 'Keperluan Kata Laluan Pensyarah:' : 'Faculty Password Requirement:'}
                    </span>{' '}
                    {lang === 'ms'
                      ? 'Sama seperti dashboard pelajar, pensyarah perlu mendaftar masuk bersama kata laluan terlebih dahulu (tab "Daftar Akaun") sebelum boleh log masuk.'
                      : 'Similar to student portal, faculty must register with a secure password first (via "Register" tab) before logging in.'}
                  </div>
                </div>

                {/* Lecturer Email & Password Form */}
                <form onSubmit={handleLecturerAuth} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        {dict.institutionalEmail}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        25 Emel Pensyarah Sah
                      </span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter Your Email"
                      value={lecturerEmail}
                      onChange={(e) => setLecturerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                        {dict.password}
                      </span>
                      {authMode === 'signup' && (
                        <span className="text-[11px] text-slate-400 font-normal">
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
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLecturerPassword(!showLecturerPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showLecturerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field (Sign Up Mode only) */}
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        {dict.confirmPassword}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder={dict.confirmPasswordPlaceholder}
                        value={lecturerConfirmPassword}
                        onChange={(e) => setLecturerConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
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
                        className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
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
                        className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
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

        {/* Security Notice */}
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
