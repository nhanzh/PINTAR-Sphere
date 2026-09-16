import React, { useState } from 'react';
import {
  UserProfile,
  DeadlineItem,
  SubmissionRecord,
  PersonalTimetableNote,
} from '../types.ts';
import { dataService } from '../services/dataService.ts';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Lock,
  Calendar,
  X,
  Send,
  UploadCloud,
  Eye,
  Trash2,
  Users,
} from 'lucide-react';

interface TimetableDeadlineViewProps {
  user: UserProfile;
  deadlines: DeadlineItem[];
  submissions: SubmissionRecord[];
  privateNotes: PersonalTimetableNote[];
  onRefreshData?: () => void;
}

export const TimetableDeadlineView: React.FC<TimetableDeadlineViewProps> = ({
  user,
  deadlines,
  submissions,
  privateNotes,
  onRefreshData,
}) => {
  const isStudent = user.role === 'student';
  const studentSet = user.setNumber || 3;

  // Filter deadlines for student
  const filteredDeadlines = deadlines.filter((d) => {
    if (isStudent) {
      return (
        d.targetSets.includes('all') ||
        d.targetSets.includes(`Set ${studentSet}`) ||
        d.targetSets.some((s) => s.toLowerCase().includes(String(studentSet)))
      );
    }
    return true; // Lecturer sees all or their subject
  });

  // Student Submission Modal State
  const [selectedDeadline, setSelectedDeadline] = useState<DeadlineItem | null>(null);
  const [submissionFileName, setSubmissionFileName] = useState('');
  const [submissionNote, setSubmissionNote] = useState('');
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Student Private Note Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteTime, setNoteTime] = useState('14:00');
  const [noteContent, setNoteContent] = useState('');

  // Lecturer Create Deadline Modal State
  const [isCreateDeadlineOpen, setIsCreateDeadlineOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'assignment' | 'quiz' | 'presentation'>('assignment');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [targetSetMode, setTargetSetMode] = useState<'all' | 'specific'>('all');
  const [selectedTargetSets, setSelectedTargetSets] = useState<string[]>(['Set 3']);
  const [isCreatingDeadline, setIsCreatingDeadline] = useState(false);

  // Lecturer Submission Viewer State
  const [activeDeadlineForAudit, setActiveDeadlineForAudit] = useState<DeadlineItem | null>(
    filteredDeadlines[0] || null
  );

  // Handle Student Submit Work
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeadline || !submissionFileName.trim()) return;

    setIsSubmittingWork(true);
    await dataService.submitWork(
      selectedDeadline.id,
      user.matricNumber || 'AP05710',
      user.name,
      user.email,
      studentSet,
      selectedDeadline.dueDate,
      submissionFileName.trim(),
      submissionNote.trim()
    );

    setIsSubmittingWork(false);
    setSelectedDeadline(null);
    setSubmissionFileName('');
    setSubmissionNote('');
    if (onRefreshData) onRefreshData();
  };

  // Handle Add Private Note
  const handleAddPrivateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    dataService.addPrivateNote({
      studentEmail: user.email,
      title: noteTitle.trim(),
      date: noteDate,
      time: noteTime,
      content: noteContent.trim(),
      color: '#4F46E5',
    });

    setIsNoteModalOpen(false);
    setNoteTitle('');
    setNoteContent('');
    if (onRefreshData) onRefreshData();
  };

  // Handle Delete Private Note
  const handleDeleteNote = (id: string) => {
    dataService.deletePrivateNote(id);
    if (onRefreshData) onRefreshData();
  };

  // Handle Lecturer Create Deadline
  const handleCreateDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    setIsCreatingDeadline(true);
    const targetSets = targetSetMode === 'all' ? ['all'] : selectedTargetSets;

    await dataService.addDeadline({
      title: newTitle.trim(),
      subject: user.taughtSubjectName || 'Chemistry I',
      courseCode: user.taughtSubjectCode || 'PNAP0133',
      type: newType,
      targetSets,
      dueDate: newDueDate,
      description: newDesc.trim() || 'Submission task assigned by lecturer.',
      lecturerName: user.name,
      lecturerEmail: user.email,
      maxScore: 100,
    });

    setIsCreatingDeadline(false);
    setIsCreateDeadlineOpen(false);
    setNewTitle('');
    setNewDueDate('');
    setNewDesc('');
    if (onRefreshData) onRefreshData();
  };

  const toggleTargetSet = (setStr: string) => {
    if (selectedTargetSets.includes(setStr)) {
      setSelectedTargetSets(selectedTargetSets.filter((s) => s !== setStr));
    } else {
      setSelectedTargetSets([...selectedTargetSets, setStr]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60">
              Timetable & Due Date Tracker
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {isStudent ? `Set ${studentSet} Deadlines` : 'Coursework & Assessment Administration'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Assignments, Quizzes & Presentation Deadlines
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time due dates set by faculty lecturers with timestamped submission auditing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isStudent && (
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>+ Add Private Timetable Note</span>
            </button>
          )}

          {!isStudent && (
            <button
              onClick={() => setIsCreateDeadlineOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Create New Due Date</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Deadlines Board */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Active Assessments for {isStudent ? `Set ${studentSet}` : 'All Sets'}
          </h2>

          <div className="space-y-3.5">
            {filteredDeadlines.map((dl) => {
              const mySubmission = submissions.find(
                (s) => s.deadlineId === dl.id && s.studentEmail === user.email
              );
              const dueDateObj = new Date(dl.dueDate);
              const isPastDue = new Date() > dueDateObj;

              return (
                <div
                  key={dl.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-200 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          dl.type === 'assignment'
                            ? 'bg-blue-100 text-blue-800'
                            : dl.type === 'quiz'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {dl.type}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">{dl.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        Due: {dueDateObj.toLocaleDateString('en-GB')} {dueDateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{dl.description}</p>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500 text-[11px]">
                      Target: <strong className="text-slate-700">{dl.targetSets.join(', ')}</strong> • Lecturer:{' '}
                      <strong className="text-slate-700">{dl.lecturerName}</strong>
                    </div>

                    {/* Student Action: Submit or view status */}
                    {isStudent && (
                      <div>
                        {mySubmission ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                mySubmission.status === 'Submitted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {mySubmission.status === 'Submitted' ? 'Submitted On-Time' : 'Submitted Late'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({new Date(mySubmission.submittedAt).toLocaleDateString('en-GB')} {new Date(mySubmission.submittedAt).toLocaleTimeString('en-GB')})
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedDeadline(dl)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Submit Work</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Lecturer Action: Inspect Submissions */}
                    {!isStudent && (
                      <button
                        onClick={() => setActiveDeadlineForAudit(dl)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                      >
                        Inspect Submission Roster
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Column: Student Private Notes OR Lecturer Submission Audit */}
        <div className="space-y-6">
          {/* If Student: Private Timetable Notes */}
          {isStudent && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Personal Private Notes</h2>
                    <p className="text-[10px] text-slate-400">Strictly confidential to you</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNoteModalOpen(true)}
                  className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50"
                  title="Add Note"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {privateNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs space-y-1 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950">{note.title}</span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[10px] font-semibold text-indigo-700">
                      📅 {note.date} {note.time ? `• ${note.time}` : ''}
                    </div>
                    <p className="text-slate-700 text-[11px] leading-snug">{note.content}</p>
                  </div>
                ))}

                {privateNotes.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No personal notes added yet. Click "+ Add Private Timetable Note" to record private reminders invisible to lecturers.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* If Lecturer: Detailed Submission Tracking Breakdown */}
          {!isStudent && activeDeadlineForAudit && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Submission Log
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeDeadlineForAudit.title}
                </h3>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Due: {new Date(activeDeadlineForAudit.dueDate).toLocaleDateString('en-GB')} {new Date(activeDeadlineForAudit.dueDate).toLocaleTimeString('en-GB')}
                </div>
              </div>

              <div className="overflow-y-auto max-h-96 space-y-2">
                {submissions
                  .filter((s) => s.deadlineId === activeDeadlineForAudit.id)
                  .map((sub) => {
                    const subDate = new Date(sub.submittedAt);
                    return (
                      <div
                        key={sub.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{sub.studentName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.status === 'Submitted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Set {sub.setNumber} • Matric: {sub.studentId}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600">
                          🕒 {subDate.toLocaleDateString('en-GB')} {subDate.toLocaleTimeString('en-GB')}
                        </div>
                        {sub.fileName && (
                          <div className="text-[11px] text-indigo-600 font-medium truncate">
                            📎 {sub.fileName}
                          </div>
                        )}
                        {sub.note && (
                          <div className="text-[11px] text-slate-500 italic">
                            "{sub.note}"
                          </div>
                        )}
                      </div>
                    );
                  })}

                {submissions.filter((s) => s.deadlineId === activeDeadlineForAudit.id).length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No submissions recorded yet for this assessment.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Submit Work Modal */}
      {selectedDeadline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Submit Assessment</h2>
                <p className="text-xs text-slate-500 line-clamp-1">{selectedDeadline.title}</p>
              </div>
              <button
                onClick={() => setSelectedDeadline(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document / File Name (PDF, DOCX, ZIP)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AhmadDanish_AP05710_LabReport3.pdf"
                  value={submissionFileName}
                  onChange={(e) => setSubmissionFileName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Submission Notes for Lecturer (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add any trial details or group members if applicable..."
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
                Your submission will be timestamped with the current date & time and synced to the lecturer's grade audit sheet.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDeadline(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWork}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingWork ? 'Recording...' : 'Confirm Submission'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Add Private Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Add Private Timetable Note</h2>
              </div>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPrivateNote} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Study with Set 3 teammates at PTSL"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={noteTime}
                    onChange={(e) => setNoteTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Personal Details & Action Items
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write your private note here (only you can see this; lecturers and other students have zero access)..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Save Private Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lecturer Create Due Date Modal */}
      {isCreateDeadlineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Create Assessment Due Date</h2>
                <p className="text-xs text-slate-500">
                  {user.name} • {user.taughtSubjectName || 'Chemistry I'}
                </p>
              </div>
              <button
                onClick={() => setIsCreateDeadlineOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeadline} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab Report 4: Le Chatelier Chemical Equilibrium"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assessment Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                    <option value="presentation">Presentation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description & Rubric Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Instructions for students..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Target Sets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target Sets
                </label>
                <div className="flex items-center gap-3 mb-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="deadlineSetMode"
                      checked={targetSetMode === 'all'}
                      onChange={() => setTargetSetMode('all')}
                      className="text-emerald-600"
                    />
                    <span className="font-semibold text-slate-800">All Sets (1 to 11)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="deadlineSetMode"
                      checked={targetSetMode === 'specific'}
                      onChange={() => setTargetSetMode('specific')}
                      className="text-emerald-600"
                    />
                    <span className="font-semibold text-slate-800">Specific Sets Only</span>
                  </label>
                </div>

                {targetSetMode === 'specific' && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50">
                    {Array.from({ length: 11 }, (_, i) => `Set ${i + 1}`).map((s) => {
                      const isChecked = selectedTargetSets.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleTargetSet(s)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            isChecked
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateDeadlineOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDeadline}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  {isCreatingDeadline ? 'Creating...' : 'Publish Due Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
