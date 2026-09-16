import React, { useState } from 'react';
import {
  UserProfile,
  StudentCourseGrade,
  AssessmentComponent,
} from '../types.ts';
import { GRADE_SCALE, SUBJECTS } from '../data/mockData.ts';
import { dataService } from '../services/dataService.ts';
import {
  Calculator,
  Award,
  Sparkles,
  Save,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Sliders,
  Check,
  UserCheck,
} from 'lucide-react';

interface GpaCalculatorViewProps {
  user: UserProfile;
  grades: StudentCourseGrade[];
  onGradesUpdated?: () => void;
}

export const GpaCalculatorView: React.FC<GpaCalculatorViewProps> = ({
  user,
  grades,
  onGradesUpdated,
}) => {
  const isStudent = user.role === 'student';
  const studentSet = user.setNumber || 3;

  // Local state for what-if simulation (courseCode -> simulated final exam score)
  const [simulatedFinalScores, setSimulatedFinalScores] = useState<Record<string, number>>({});
  const [targetGpa, setTargetGpa] = useState<number>(3.80);

  // Lecturer Grade Entry State
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>('ap05710@siswa.ukm.edu.my');
  const [lecturerSelectedCourse, setLecturerSelectedCourse] = useState<string>(
    user.taughtSubjectCode || 'PNAP0133'
  );
  const [lecturerComponentScores, setLecturerComponentScores] = useState<Record<string, number>>({
    assignment: 95,
    lab_report: 92,
    quiz: 88,
    mid_sem: 90,
    final_sem: 86,
  });
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Helper to get grade point from percentage score
  const getGradePoint = (score: number) => {
    const matched = GRADE_SCALE.find((g) => score >= g.minMark && score <= g.maxMark);
    return matched ? matched.point : 0.0;
  };

  const getLetterGrade = (score: number) => {
    const matched = GRADE_SCALE.find((g) => score >= g.minMark && score <= g.maxMark);
    return matched ? matched.letter : 'F';
  };

  // Calculate Course Total Score with Simulation
  const calculateCourseScore = (course: StudentCourseGrade) => {
    let total = 0;
    const comps = course.components || [];
    comps.forEach((comp) => {
      const isFinal = comp.name.toLowerCase().includes('final');
      const score = isFinal && simulatedFinalScores[course.courseCode] !== undefined
        ? simulatedFinalScores[course.courseCode]
        : comp.score;
      total += (score * comp.weight) / 100;
    });
    return Math.round(total * 10) / 10;
  };

  // Compute Semester 1 Official GPA
  // Rule: 2 best science subjects + Statistics
  const processedCourses = grades.map((c) => {
    const totalScore = calculateCourseScore(c);
    const letterGrade = getLetterGrade(totalScore);
    const gradePoint = getGradePoint(totalScore);
    return {
      ...c,
      calculatedScore: totalScore,
      calculatedLetter: letterGrade,
      calculatedPoint: gradePoint,
    };
  });

  const sciences = processedCourses.filter((c) => c.isScience);
  const statistics = processedCourses.find((c) => c.courseCode === 'PNAP0154');

  // Sort science subjects by grade point descending, then score descending
  const sortedSciences = [...sciences].sort(
    (a, b) => b.calculatedPoint - a.calculatedPoint || b.calculatedScore - a.calculatedScore
  );

  const best2Sciences = sortedSciences.slice(0, 2);
  const countingCourses = [...best2Sciences];
  if (statistics) countingCourses.push(statistics);

  // Total quality points / total credits
  const totalQualityPoints = countingCourses.reduce(
    (acc, curr) => acc + curr.calculatedPoint * curr.creditHours,
    0
  );
  const totalCountedCredits = countingCourses.reduce((acc, curr) => acc + curr.creditHours, 0);
  const calculatedGpa =
    totalCountedCredits > 0 ? totalQualityPoints / totalCountedCredits : 0;

  const isDeansList = calculatedGpa >= 3.67;

  // Handle Lecturer Save Marks
  const handleLecturerSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGrade(true);
    setSaveSuccessMsg('');

    // Find student in roster
    const student = dataService.findStudentByEmail(selectedStudentEmail);
    const studentName = student ? student.name : 'Ahmad Danish';

    // Calculate total
    const course = grades.find((g) => g.courseCode === lecturerSelectedCourse) || grades[0];
    const newComponents: AssessmentComponent[] = course.components.map((c) => {
      const key = c.name.toLowerCase().replace(/\s+/g, '_');
      const entered = lecturerComponentScores[key] ?? c.score;
      return {
        ...c,
        score: entered,
      };
    });

    const total = newComponents.reduce((acc, curr) => acc + (curr.score * curr.weight) / 100, 0);

    const updatedGrade: StudentCourseGrade = {
      ...course,
      studentEmail: selectedStudentEmail,
      studentName,
      components: newComponents,
      totalScore: Math.round(total * 10) / 10,
      letterGrade: getLetterGrade(total),
      gradePoint: getGradePoint(total),
    };

    await dataService.saveStudentGrade(updatedGrade);
    setIsSavingGrade(false);
    setSaveSuccessMsg(`Marks successfully saved for ${studentName}! Instant sync delivered.`);
    if (onGradesUpdated) onGradesUpdated();

    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60">
              UKM ASASIpintar Official Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Semester 1 Policy: 2 Best Sciences + Statistics
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            GPA Calculator & Marks Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full component weightings for Chemistry, Physics, Biology, Statistics, and Logical Reasoning with Dean's List simulator.
          </p>
        </div>

        {/* GPA Summary Pill */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Calculated GPA</div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {calculatedGpa.toFixed(2)}
            </div>
          </div>
          <div className="pl-3 border-l border-slate-100 text-right">
            <div
              className={`text-xs font-bold ${
                isDeansList ? 'text-emerald-600' : 'text-slate-600'
              }`}
            >
              {isDeansList ? "Dean's List" : 'Good Standing'}
            </div>
            <div className="text-[10px] text-slate-400">Threshold: 3.67</div>
          </div>
        </div>
      </div>

      {/* Special Semester 1 Rules Notice */}
      <div className="bg-indigo-50/70 border border-indigo-200/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <Award className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-indigo-950 space-y-1">
          <div className="font-extrabold text-indigo-900">
            Official ASASIpintar Semester 1 GPA Policy
          </div>
          <p className="text-indigo-800/90 leading-relaxed">
            Only the <strong>top 2 science subjects</strong> (among Chemistry, Physics, and Biology) are factored into your official GPA, alongside compulsory <strong>Statistics</strong>. The lowest science subject is excluded from the GPA, protecting your academic standing.
          </p>
        </div>
      </div>

      {/* Mode Switch: If Lecturer, Show Grade Entry Console First */}
      {!isStudent && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Lecturer Grade Input Console ({user.name})
                </h2>
                <p className="text-xs text-slate-500">
                  Enter component marks directly into student's portal
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Live Real-Time Sync
            </span>
          </div>

          <form onSubmit={handleLecturerSaveGrade} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Student
                </label>
                <select
                  value={selectedStudentEmail}
                  onChange={(e) => setSelectedStudentEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="ap05710@siswa.ukm.edu.my">Ahmad Danish (AP05710) - Set 3</option>
                  <option value="ap05701@siswa.ukm.edu.my">Siti Sarah (AP05701) - Set 1</option>
                  <option value="ap05725@siswa.ukm.edu.my">Nurul Izzah (AP05725) - Set 2</option>
                  <option value="ap05739@siswa.ukm.edu.my">Muhammad Faris (AP05739) - Set 3</option>
                  <option value="ap05850@siswa.ukm.edu.my">Nur Amira (AP05850) - Set 7</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject (Locked to your taught course)
                </label>
                <input
                  type="text"
                  disabled
                  value={`${user.taughtSubjectName || 'Chemistry I'} (${user.taughtSubjectCode || 'PNAP0133'})`}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-semibold"
                />
              </div>
            </div>

            {/* Component Inputs based on Subject Breakdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Assessment Components Marks (%)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block">Assignment (5%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={lecturerComponentScores['assignment'] || 95}
                    onChange={(e) =>
                      setLecturerComponentScores({
                        ...lecturerComponentScores,
                        assignment: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block">Lab Report (15%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={lecturerComponentScores['lab_report'] || 92}
                    onChange={(e) =>
                      setLecturerComponentScores({
                        ...lecturerComponentScores,
                        lab_report: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block">Quiz (20%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={lecturerComponentScores['quiz'] || 88}
                    onChange={(e) =>
                      setLecturerComponentScores({
                        ...lecturerComponentScores,
                        quiz: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block">Mid Sem (20%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={lecturerComponentScores['mid_sem'] || 90}
                    onChange={(e) =>
                      setLecturerComponentScores({
                        ...lecturerComponentScores,
                        mid_sem: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block">Final Sem (40%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={lecturerComponentScores['final_sem'] || 86}
                    onChange={(e) =>
                      setLecturerComponentScores({
                        ...lecturerComponentScores,
                        final_sem: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingGrade}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingGrade ? 'Saving...' : 'Save & Publish to Student Dashboard'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Student View: Coursework Breakdown & Final Exam Simulator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Course Performance & Final Exam Simulator
          </h2>
          <span className="text-xs text-slate-500">
            Drag the Final Exam slider on any course to simulate your GPA
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedCourses.map((c) => {
            const isCountedInSem1 = countingCourses.some((cc) => cc.courseCode === c.courseCode);
            const isLowestScience = c.isScience && !isCountedInSem1;

            return (
              <div
                key={c.courseCode}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all relative ${
                  isCountedInSem1
                    ? 'border-indigo-200 ring-1 ring-indigo-200/50'
                    : isLowestScience
                    ? 'border-slate-200 opacity-80'
                    : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {c.courseCode}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">{c.courseName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Credit Hours: {c.creditHours}
                    </div>
                  </div>

                  {/* Calculated Grade Badge */}
                  <div className="text-right">
                    <div className="text-xl font-black text-slate-900">
                      {c.calculatedScore}%
                    </div>
                    <div className="text-xs font-bold text-indigo-600">
                      Grade: {c.calculatedLetter} ({c.calculatedPoint.toFixed(2)})
                    </div>
                  </div>
                </div>

                {/* Status chip for Sem 1 rule */}
                <div className="mt-2.5">
                  {isCountedInSem1 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-3 h-3" />
                      Counted in Semester 1 GPA
                    </span>
                  ) : isLowestScience ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Excluded (Lowest science mark replaced)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Elective / Humanities
                    </span>
                  )}
                </div>

                {/* Component Breakdown Table */}
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">
                    Component Breakdown
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {c.components.map((comp, idx) => {
                      const isFinal = comp.name.toLowerCase().includes('final');
                      const currentScore =
                        isFinal && simulatedFinalScores[c.courseCode] !== undefined
                          ? simulatedFinalScores[c.courseCode]
                          : comp.score;

                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl border ${
                            isFinal
                              ? 'col-span-2 bg-indigo-50/60 border-indigo-200'
                              : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700">
                              {comp.name} ({comp.weight}%)
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {currentScore} / 100
                            </span>
                          </div>

                          {/* Interactive Slider for Final Exam Simulation */}
                          {isFinal && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-indigo-700 font-bold">
                                <span>Simulate Final Score:</span>
                                <span>{currentScore}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={currentScore}
                                onChange={(e) =>
                                  setSimulatedFinalScores({
                                    ...simulatedFinalScores,
                                    [c.courseCode]: Number(e.target.value),
                                  })
                                }
                                className="w-full accent-indigo-600 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
