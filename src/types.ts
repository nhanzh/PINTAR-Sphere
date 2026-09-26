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
  | 'research_skills'
  | 'general';

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
  currentCgpa?: number | null;
  targetCgpa?: number;
  totalCreditsCompleted?: number;
  kokoMarks?: number | null;
  kokoGrade?: string | null;
  kokoDetails?: KokoBreakdown | null;
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
  cgpa?: number | null;
  kokoMarks?: number | null;
  kokoGrade?: string | null;
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
  fileSize?: string;
  fileType: 'PDF' | 'ZIP' | 'DOCX' | 'PPTX' | 'IMAGE' | 'DRIVE' | 'LINK' | string;
  sourceType?: 'file' | 'drive' | 'photo' | 'link';
  externalUrl?: string;
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
  fileUrl?: string;
  note?: string;
}

export interface PersonalTimetableNote {
  id: string;
  studentEmail: string;
  title: string; // Task Name
  subject?: string; // Subject Name or Course
  date: string; // Due Date
  time?: string;
  priority: 'high' | 'medium' | 'low'; // Priority level (high, medium, low)
  isDone?: boolean; // Mark as done status
  content?: string;
  color?: string;
  createdAt: string;
}

export interface AssessmentComponent {
  name: string;
  weight: number;
  score?: number | null;
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
  totalScore?: number | null; // 0 to 100 or null if pending
  letterGrade?: string | null;
  gradePoint?: number | null;
  isPublished?: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface StudentKokoRecord {
  id: string;
  studentEmail: string;
  studentName: string;
  matricNumber?: string;
  setNumber?: number;
  // Official UKM 10% Kokurikulum Structure
  jatiDiriScore?: number | null;        // Max 7.0 marks
  kokoParticipation?: number | null;    // Kategori A: Penyertaan/Penglibatan (Max 1.0)
  kokoAchievement?: number | null;      // Kategori B: Pencapaian (Max 1.0)
  kokoPosition?: number | null;         // Kategori C: Perjawatan (Max 1.0)
  kokoActivitiesTotal?: number | null;  // Max 3.0 marks (Kat A + Kat B + Kat C)
  totalKoko10?: number | null;          // Max 10.0% (Jati Diri 7% + Koko 3%)
  // Legacy / fallback fields
  uniformBody?: number | null;          // Max 30
  sports?: number | null;               // Max 25
  club?: number | null;                 // Max 30
  specialProject?: number | null;       // Max 15
  totalScore?: number | null;           // Max 100
  grade?: string | null;                // A, A-, B+, etc.
  band?: string | null;                 // Band 1, Band 2, etc.
  isPublished: boolean;
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

export interface ForumReaction {
  emoji: string;
  users: { name: string; email: string }[];
}

export interface ForumComment {
  id: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  authorSet?: string;
  content: string;
  imageUrl?: string;
  fileName?: string;
  fileUrl?: string;
  reactions?: ForumReaction[];
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
  imageUrl?: string;
  fileName?: string;
  fileUrl?: string;
  reactions?: ForumReaction[];
  createdAt: string;
  likes: number;
  comments: ForumComment[];
  replies?: ForumComment[];
  tags: string[];
}

export type KokoCategory = 'A' | 'B' | 'C';
export type KokoLevel = 'pusat' | 'universiti' | 'kebangsaan' | 'antarabangsa';

export interface KokoSubmissionItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  matricNumber: string;
  setNumber: number;
  category: KokoCategory;
  categoryName: string;
  subCategory?: string; // e.g. emas, perak, gangsa, presiden, ajk, etc.
  activityName: string;
  startDateTime: string;
  endDateTime: string;
  level: KokoLevel;
  levelName: string;
  venue: string;
  organizer?: string;
  certificateFileName?: string;
  certificateFileUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  awardedScore?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  submittedAt: string;
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
