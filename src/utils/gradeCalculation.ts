import { StudentCourseGrade } from '../types.ts';
import { GRADE_SCALE } from '../data/mockData.ts';

export interface PngsCalculationResult {
  hasEnoughData: boolean;
  bestScienceCourses: StudentCourseGrade[];
  droppedScienceCourse: StudentCourseGrade | null;
  fixedMathCourse: StudentCourseGrade | null;
  totalQualityPoints: number;
  totalCountedCredits: number;
  pngs: number | null;
  isDeansList: boolean;
  overallGpa: number | null;
  totalAttemptedCredits: number;
  totalAttemptedQualityPoints: number;
}

export function calculateOfficialPngs(courses: StudentCourseGrade[]): PngsCalculationResult {
  // Course codes for Science in Semester 1
  const SCIENCE_CODES = ['PNAP0113', 'PNAP0112', 'PNAP0123', 'PNAP0133'];
  const MATH_CODES = ['PNAP0154'];

  // Filter science courses that have grade points
  const gradedScienceCourses = courses.filter(
    (c) =>
      SCIENCE_CODES.includes(c.courseCode) &&
      c.gradePoint !== null &&
      c.gradePoint !== undefined
  );

  // Filter math course (Statistics)
  const mathCourse = courses.find(
    (c) =>
      MATH_CODES.includes(c.courseCode) &&
      c.gradePoint !== null &&
      c.gradePoint !== undefined
  ) || null;

  // Sort science courses descending by gradePoint (then by totalScore)
  gradedScienceCourses.sort((a, b) => {
    const diff = (b.gradePoint || 0) - (a.gradePoint || 0);
    if (diff !== 0) return diff;
    return (b.totalScore || 0) - (a.totalScore || 0);
  });

  const bestScienceCourses = gradedScienceCourses.slice(0, 2);
  const droppedScienceCourse = gradedScienceCourses.length > 2 ? gradedScienceCourses[2] : null;

  // Overall GPA across all completed courses
  const allGraded = courses.filter(
    (c) => c.gradePoint !== null && c.gradePoint !== undefined
  );

  const totalAttemptedQualityPoints = allGraded.reduce(
    (acc, curr) => acc + (curr.gradePoint || 0) * (curr.creditHours || 3),
    0
  );
  const totalAttemptedCredits = allGraded.reduce(
    (acc, curr) => acc + (curr.creditHours || 3),
    0
  );
  const overallGpa =
    totalAttemptedCredits > 0
      ? Number((totalAttemptedQualityPoints / totalAttemptedCredits).toFixed(2))
      : null;

  // Check if we have the official 3 courses: 2 best science + 1 math
  if (bestScienceCourses.length >= 2 && mathCourse) {
    const science1Points = (bestScienceCourses[0].gradePoint || 0) * (bestScienceCourses[0].creditHours || 3);
    const science2Points = (bestScienceCourses[1].gradePoint || 0) * (bestScienceCourses[1].creditHours || 3);
    const mathPoints = (mathCourse.gradePoint || 0) * (mathCourse.creditHours || 4);

    const totalQualityPoints = Number((science1Points + science2Points + mathPoints).toFixed(2));
    const totalCountedCredits =
      (bestScienceCourses[0].creditHours || 3) +
      (bestScienceCourses[1].creditHours || 3) +
      (mathCourse.creditHours || 4); // Always 10 credits

    const pngs = Number((totalQualityPoints / totalCountedCredits).toFixed(2));

    return {
      hasEnoughData: true,
      bestScienceCourses,
      droppedScienceCourse,
      fixedMathCourse: mathCourse,
      totalQualityPoints,
      totalCountedCredits,
      pngs,
      isDeansList: pngs >= 3.75,
      overallGpa,
      totalAttemptedCredits,
      totalAttemptedQualityPoints,
    };
  }

  // Fallback if partially graded
  return {
    hasEnoughData: false,
    bestScienceCourses,
    droppedScienceCourse,
    fixedMathCourse: mathCourse,
    totalQualityPoints: totalAttemptedQualityPoints,
    totalCountedCredits: totalAttemptedCredits,
    pngs: overallGpa,
    isDeansList: overallGpa !== null && overallGpa >= 3.75,
    overallGpa,
    totalAttemptedCredits,
    totalAttemptedQualityPoints,
  };
}
