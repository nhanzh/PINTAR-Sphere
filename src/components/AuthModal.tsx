import React, { useState } from 'react';
import { UserProfile, UserRole, SubjectId } from '../types.ts';
import { SUBJECTS } from '../data/mockData.ts';
import { dataService } from '../services/dataService.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { User, Shield, GraduationCap, X, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}) => {
  const { lang, dict } = useLanguage();
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedSet, setSelectedSet] = useState<number>(3);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('chemistry');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const labels = {
    ms: {
      title: 'Tukar Persona Pengguna (Ujian Pantas)',
      subtitle: 'Pilih profil pratetap atau masukkan akaun rasmi UKM anda.',
      customLogin: 'Log Masuk Emel Tersuai',
      emailPlaceholder: 'ap05710@siswa.ukm.edu.my atau dr.nurul@ukm.edu.my',
      namePlaceholder: 'Nama Penuh (Pilihan)',
      studentSet: 'Set Pelajar (Jika Pelajar)',
      lecturerSubject: 'Subjek Pensyarah (Jika Pensyarah)',
      signInBtn: 'Log Masuk Sekarang',
      presetStudents: 'Profil Pelajar Demo',
      presetLecturers: 'Profil Pensyarah Demo',
      emailErr: 'Sila masukkan emel rasmi UKM yang sah (@siswa.ukm.edu.my atau @ukm.edu.my).',
    },
    en: {
      title: 'Switch User Persona (Quick Testing)',
      subtitle: 'Select a preset profile or enter your official UKM credentials.',
      customLogin: 'Custom Institutional Sign In',
      emailPlaceholder: 'ap05710@siswa.ukm.edu.my or dr.nurul@ukm.edu.my',
      namePlaceholder: 'Full Name (Optional)',
      studentSet: 'Student Set (If Student)',
      lecturerSubject: 'Faculty Subject (If Lecturer)',
      signInBtn: 'Sign In Now',
      presetStudents: 'Demo Student Profiles',
      presetLecturers: 'Demo Lecturer Profiles',
      emailErr: 'Please enter a valid UKM institutional email (@siswa.ukm.edu.my or @ukm.edu.my).',
    },
    zh: {
      title: '切换用户身份（快速测试）',
      subtitle: '选择预设测试档案或输入您的官方 UKM 机构邮箱。',
      customLogin: '自定义机构邮箱登录',
      emailPlaceholder: 'ap05710@siswa.ukm.edu.my 或 dr.nurul@ukm.edu.my',
      namePlaceholder: '全名（可选）',
      studentSet: '分配班级 Set (若是学生)',
      lecturerSubject: '任教科目 (若是讲师)',
      signInBtn: '立即登录',
      presetStudents: '学生演示档案',
      presetLecturers: '讲师演示档案',
      emailErr: '请输入有效的 UKM 官方机构邮箱 (@siswa.ukm.edu.my 或 @ukm.edu.my)。',
    },
    ta: {
      title: 'பயனர் சுயவிவரத்தை மாற்றவும் (விரைவு சோதனை)',
      subtitle: 'முன்னமைக்கப்பட்ட சுயவிவரத்தைத் தேர்ந்தெடுக்கவும் அல்லது UKM மின்னஞ்சலை உள்ளிடவும்.',
      customLogin: 'தனிப்பயன் உள்நுழைவு',
      emailPlaceholder: 'ap05710@siswa.ukm.edu.my அல்லது dr.nurul@ukm.edu.my',
      namePlaceholder: 'முழுப் பெயர் (விருப்பமானது)',
      studentSet: 'மாணவர் பிரிவு (மாணவராக இருந்தால்)',
      lecturerSubject: 'கற்பிக்கும் பாடம் (விரிவுரையாளராக இருந்தால்)',
      signInBtn: 'இப்போது உள்நுழைக',
      presetStudents: 'டெமோ மாணவர் சுயவிவரங்கள்',
      presetLecturers: 'டெமோ விரிவுரையாளர் சுயவிவரங்கள்',
      emailErr: 'சரியான UKM மின்னஞ்சலை உள்ளிடவும் (@siswa.ukm.edu.my அல்லது @ukm.edu.my).',
    },
  }[lang] || {
    title: 'Tukar Persona Pengguna (Ujian Pantas)',
    subtitle: 'Pilih profil pratetap atau masukkan akaun rasmi UKM anda.',
    customLogin: 'Log Masuk Emel Tersuai',
    emailPlaceholder: 'ap05710@siswa.ukm.edu.my atau dr.nurul@ukm.edu.my',
    namePlaceholder: 'Nama Penuh (Pilihan)',
    studentSet: 'Set Pelajar (Jika Pelajar)',
    lecturerSubject: 'Subjek Pensyarah (Jika Pensyarah)',
    signInBtn: 'Log Masuk Sekarang',
    presetStudents: 'Profil Pelajar Demo',
    presetLecturers: 'Profil Pensyarah Demo',
    emailErr: 'Sila masukkan emel rasmi UKM yang sah.',
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const email = emailInput.trim().toLowerCase();
    if (!email) {
      setErrorMsg(labels.emailErr);
      return;
    }

    if (email.endsWith('@siswa.ukm.edu.my')) {
      const registered = dataService.findStudentByEmail(email);
      const studentUser: UserProfile = {
        uid: `usr-std-${Date.now()}`,
        name: nameInput.trim() || registered?.name || 'Undergraduate Scholar',
        email: email,
        role: 'student',
        matricNumber: registered?.matricNumber || email.split('@')[0].toUpperCase(),
        setNumber: registered ? registered.setNumber : selectedSet,
        currentCgpa: registered?.cgpa || 3.75,
        targetCgpa: 3.90,
        totalCreditsCompleted: 19,
        kokoMarks: registered?.kokoMarks || 85.0,
        kokoGrade: registered?.kokoGrade || 'A',
        kokoDetails: {
          uniformBody: 27,
          sports: 23,
          club: 25,
          specialProject: 10,
        },
      };
      onSelectUser(studentUser);
      onClose();
    } else if (email.endsWith('@ukm.edu.my')) {
      const subjectConfig = SUBJECTS.find((s) => s.id === selectedSubject) || SUBJECTS[0];
      const lecturerUser: UserProfile = {
        uid: `usr-lec-${Date.now()}`,
        name: nameInput.trim() || subjectConfig.lecturerName,
        email: email,
        role: 'lecturer',
        taughtSubject: selectedSubject,
        taughtSubjectCode: subjectConfig.code,
        taughtSubjectName: subjectConfig.name,
        department: subjectConfig.name,
        currentCgpa: 4.0,
        targetCgpa: 4.0,
        totalCreditsCompleted: 0,
      };
      onSelectUser(lecturerUser);
      onClose();
    } else {
      setErrorMsg(labels.emailErr);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{labels.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{labels.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800">
            {errorMsg}
          </div>
        )}

        {/* Custom Login Form */}
        <form onSubmit={handleCustomLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {labels.customLogin}
            </label>
            <input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={labels.emailPlaceholder}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={labels.namePlaceholder}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {labels.studentSet}
              </label>
              <select
                value={selectedSet}
                onChange={(e) => setSelectedSet(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden"
              >
                {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>
                    Set {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {labels.lecturerSubject}
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as SubjectId)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden"
              >
                {SUBJECTS.map((sb) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{labels.signInBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
