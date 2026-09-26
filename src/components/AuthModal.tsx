import React, { useState } from 'react';
import { UserProfile, UserRole, SubjectId } from '../types.ts';
import { SUBJECTS } from '../data/mockData.ts';
import { dataService } from '../services/dataService.ts';
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
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedSet, setSelectedSet] = useState<number>(3);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('chemistry');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const email = emailInput.trim().toLowerCase();
    if (!email) {
      setErrorMsg('Please enter a valid UKM institutional email.');
      return;
    }

    if (email.endsWith('@siswa.ukm.edu.my')) {
      // Check if student is in roster
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
        assignedSets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        department: `Department of ${subjectConfig.name} & Pre-University Studies`,
      };
      onSelectUser(lecturerUser);
      onClose();
    } else {
      setErrorMsg(
        'Invalid domain! Students must use @siswa.ukm.edu.my and Lecturers must use @ukm.edu.my.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Switch Account & Role</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Current user:{' '}
              <span className="font-semibold text-indigo-600">
                {currentUser.name} ({currentUser.role === 'student' ? `Set ${currentUser.setNumber}` : currentUser.taughtSubjectName})
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Login Form */}
        <div className="mt-5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
            Sign In With UKM Institutional Email
          </label>

          <form onSubmit={handleCustomLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                placeholder="Enter Your Email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Use <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">@siswa.ukm.edu.my</code> for Student,{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">@ukm.edu.my</code> for Lecturer.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ahmad Danish"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {emailInput.toLowerCase().endsWith('@ukm.edu.my') ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Taught Subject (Lecturer)
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value as SubjectId)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Class Set (1 to 11)
                  </label>
                  <select
                    value={selectedSet}
                    onChange={(e) => setSelectedSet(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>
                        Set {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              Sign In to Portal <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
