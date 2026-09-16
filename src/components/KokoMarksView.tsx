import React from 'react';
import { UserProfile } from '../types.ts';
import {
  Award,
  Shield,
  Trophy,
  Users,
  Compass,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface KokoMarksViewProps {
  user: UserProfile;
}

export const KokoMarksView: React.FC<KokoMarksViewProps> = ({ user }) => {
  const kokoMarks = user.kokoMarks || 88.5;
  const kokoGrade = user.kokoGrade || 'A';
  const details = user.kokoDetails || {
    uniformBody: 28.5,
    sports: 24.0,
    club: 26.0,
    specialProject: 10.0,
  };

  const activities = [
    {
      category: 'Badan Beruniform',
      name: 'Kor Siswa Kor Sukarelawan Polis Siswa (SUKSIS) UKM',
      role: 'Squad Leader',
      points: 28.5,
      maxPoints: 30,
      verifiedBy: 'Pusat Pembangunan Mahasiswa',
    },
    {
      category: 'Sukan & Permainan',
      name: 'PINTAR Inter-Set Badminton Tournament 2024',
      role: 'Gold Medalist (Men Doubles)',
      points: 24.0,
      maxPoints: 25,
      verifiedBy: 'Unit Sukan ASASIpintar',
    },
    {
      category: 'Kelab & Persatuan',
      name: 'Kelab STEM & Inovasi Sains Tulen',
      role: 'Head of Technical Committee',
      points: 26.0,
      maxPoints: 30,
      verifiedBy: 'Faculty Advisor',
    },
    {
      category: 'Khidmat Komuniti / Projek Khas',
      name: 'Bangi Community Science Outreach Program',
      role: 'Lead Mentor',
      points: 10.0,
      maxPoints: 15,
      verifiedBy: 'HEPA UKM',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60">
              HEPA Verified Co-Curricular
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Student: <strong>{user.name}</strong> ({user.matricNumber || 'AP05710'})
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Co-Curricular (Koko) Marks & Transcripts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Official 10% co-curricular appraisal contributing towards national university admission matrices.
          </p>
        </div>

        {/* Total Badge */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Koko Score</div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {kokoMarks.toFixed(1)} / 100
            </div>
          </div>
          <div className="pl-3 border-l border-slate-100 text-right">
            <div className="text-xs font-bold text-amber-600">Grade {kokoGrade}</div>
            <div className="text-[10px] text-slate-400">Band 1 (Excellent)</div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Uniform Body */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-500">Uniform Body (30%)</div>
          <div className="text-2xl font-black text-slate-900">{details.uniformBody} / 30</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> SUKSIS Active Cadet
          </div>
        </div>

        {/* Sports */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-500">Sports & Games (25%)</div>
          <div className="text-2xl font-black text-slate-900">{details.sports} / 25</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Inter-Set Badminton Gold
          </div>
        </div>

        {/* Clubs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-500">Clubs & Societies (30%)</div>
          <div className="text-2xl font-black text-slate-900">{details.club} / 30</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> STEM Club Exco
          </div>
        </div>

        {/* Special Project */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-500">Special Community (15%)</div>
          <div className="text-2xl font-black text-slate-900">{details.specialProject} / 15</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Outreach Mentor
          </div>
        </div>
      </div>

      {/* Verified Activities Log */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Verified Extracurricular Activity Records
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-2">Activity / Organization</th>
                <th className="pb-2">Domain</th>
                <th className="pb-2">Position / Role</th>
                <th className="pb-2">Score Awarded</th>
                <th className="pb-2">Verification Authority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((act, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 font-bold text-slate-900">{act.name}</td>
                  <td className="py-3 text-slate-600">{act.category}</td>
                  <td className="py-3 text-indigo-700 font-semibold">{act.role}</td>
                  <td className="py-3 font-mono font-bold text-slate-900">
                    {act.points} / {act.maxPoints}
                  </td>
                  <td className="py-3 text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{act.verifiedBy}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
