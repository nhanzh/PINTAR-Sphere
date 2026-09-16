/**
 * Domain types for PINTAR@Sphere UKM Pre-University / ASASIpintar Foundation Portal
 */

export type UserRole = 'student' | 'lecturer';

export type ActiveTab =
  | 'dashboard'
  | 'resources'
  | 'calendar'
  | 'timetable'
  | 'gpa'
  | 'koko'
  | 'students-roster'
  | 'community'
  | 'ai-assistant';

export type SubjectId =
  | 'biology'
  | 'chemistry'
  | 'physics'
  | 'logical_reasoning'
  | 'statistics'
  | 'language'
  | 'language_literary'
  | 'jati_diri'
  | 'research_skills';

export interface SubjectAssessmentRule {
  name: string;
  weightPercentage: number;
}

export interface SubjectConfig {
  id: SubjectId;
  code: string;
  name: string;
  creditHours: number;
  isScience: boolean;
  lecturerName: string;
  lecturerEmail: string;
  color: string;
  assessmentStructure: SubjectAssessmentRule[];
}

export interface KokoBreakdown {
  uniformBody: number; // Max 30% (Badan Beruniform)
  sports: number;      // Max 25% (Sukan & Permainan)
  club: number;        // Max 30% (Kelab & Persatuan)
  specialProject: number; // Max 15% (Khidmat Komuniti / Projek Khas)
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string; // student: @siswa.ukm.edu.my; lecturer: @ukm.edu.my
  role: UserRole;
  matricNumber?: string;
  setNumber?: number; // 1 to 11 for students
  currentCgpa?: number;
  targetCgpa?: number;
  totalCreditsCompleted?: number;
  kokoMarks?: number;
  kokoGrade?: string;
  kokoDetails?: KokoBreakdown;
  taughtSubject?: SubjectId; // for lecturers
  taughtSubjectCode?: string;
  taughtSubjectName?: string;
  assignedSets?: number[]; // sets taught by lecturer (1 to 11)
  department?: string;
  avatarUrl?: string;
}

export interface StudentRosterItem {
  id: string;
  matricNumber: string;
  name: string;
  email: string;
  setNumber: number; // 1 to 11
  cgpa: number;
  kokoMarks: number;
  kokoGrade: string;
  status: 'Active' | 'On Leave' | 'Graduated';
}

export type ResourceCategory =
  | 'lecture_notes'
  | 'exercises'
  | 'past_year'
  | 'lab_manual'
  | 'cheatsheet';

export interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  courseCode: string;
  category: ResourceCategory;
  academicYear: string;
  semester: string;
  fileSize: string;
  fileType: 'PDF' | 'ZIP' | 'DOCX' | 'PPTX';
  downloadsCount: number;
  uploadedBy: string;
  uploaderEmail: string;
  uploadedDate: string;
  description: string;
  targetSets: string[]; // e.g. ['all'] or ['Set 1', 'Set 3']
  tags: string[];
  fileUrl?: string;
}

export interface ClassScheduleItem {
  id: string;
  subject: string;
  courseCode: string;
  setNumber: number | 'all'; // Set 1 to 11 or 'all'
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "10:00"
  venue: string;     // e.g. "DK 1, Kompleks Tun Abdullah Mohd Salleh"
  lecturerName: string;
  lecturerEmail: string;
  isRescheduled?: boolean;
  rescheduleNotice?: {
    originalTime: string;
    originalVenue: string;
    newTime: string;
    newVenue: string;
    reason: string;
    announcedAt: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  category: 'academic' | 'exam' | 'holiday' | 'event' | 'reschedule';
  description: string;
  targetSets: string[]; // e.g. ['all'] or ['Set 3']
  isOfficial?: boolean;
}

export interface DeadlineItem {
  id: string;
  title: string;
  subject: string;
  courseCode: string;
  type: 'assignment' | 'quiz' | 'presentation';
  targetSets: string[]; // e.g. ['all'] or ['Set 1', 'Set 3']
  dueDate: string; // ISO string e.g. "2025-06-25T23:59"
  description: string;
  lecturerName: string;
  lecturerEmail: string;
  maxScore: number;
  createdAt: string;
}

export interface SubmissionRecord {
  id: string;
  deadlineId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  setNumber: number;
  submittedAt: string; // ISO string
  status: 'Submitted' | 'Late';
  fileName?: string;
  note?: string;
}

export interface PersonalTimetableNote {
  id: string;
  studentEmail: string;
  title: string;
  date: string;
  time?: string;
  content: string;
  color?: string;
  createdAt: string;
}

export interface AssessmentComponent {
  name: string;
  weight: number;
  score: number;
}

export interface StudentCourseGrade {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  setNumber: number;
  courseCode: string;
  courseName: string;
  creditHours: number;
  isScience: boolean;
  components: AssessmentComponent[];
  breakdown?: Record<string, number>;
  totalScore: number; // 0 to 100
  letterGrade: string;
  gradePoint: number;
  updatedBy: string;
  updatedAt: string;
}

export interface GradeScaleItem {
  letter: string;
  point: number;
  minMark: number;
  maxMark: number;
  description: string;
}

export interface ForumComment {
  id: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  authorSet?: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  authorSet?: string;
  setNumber?: number;
  subjectCode?: string;
  subject?: string;
  createdAt: string;
  likes: number;
  comments: ForumComment[];
  replies?: ForumComment[];
  tags: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  contextSubject?: string;
}

export type Language = 'ms' | 'en' | 'zh' | 'ta';

export interface BroadcastNotice {
  id: string;
  title: string;
  message: string;
  senderName: string;
  senderEmail: string;
  subjectCode: string;
  subjectName: string;
  targetSet: string; // 'all' or '1'..'11'
  priority: 'urgent' | 'info' | 'reschedule';
  createdAt: string; // ISO string
}
