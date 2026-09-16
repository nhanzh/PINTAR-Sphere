import React, { useState } from 'react';
import { UserProfile, ResourceItem, SubjectId, ResourceCategory } from '../types.ts';
import { SUBJECTS } from '../data/mockData.ts';
import { dataService } from '../services/dataService.ts';
import {
  BookOpen,
  Download,
  Search,
  Filter,
  Plus,
  FileText,
  FileCode,
  Tag,
  Check,
  X,
  Upload,
  Lock,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface ResourcesViewProps {
  user: UserProfile;
  resources: ResourceItem[];
  onUploadSuccess?: () => void;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  user,
  resources,
  onUploadSuccess,
}) => {
  const isStudent = user.role === 'student';
  const studentSet = user.setNumber || 3;

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Lecturer Upload Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ResourceCategory>('lecture_notes');
  const [newDescription, setNewDescription] = useState('');
  const [newFileSize, setNewFileSize] = useState('3.5 MB');
  const [targetSetMode, setTargetSetMode] = useState<'all' | 'specific'>('all');
  const [selectedTargetSets, setSelectedTargetSets] = useState<string[]>(['Set 1', 'Set 3']);
  const [isUploading, setIsUploading] = useState(false);

  // Filter resources
  const filteredResources = resources.filter((res) => {
    // If student, only show resources targeted to 'all' or this student's set
    if (isStudent) {
      const isTargeted =
        res.targetSets.includes('all') ||
        res.targetSets.includes(`Set ${studentSet}`) ||
        res.targetSets.some((s) => s.toLowerCase().includes(String(studentSet)));
      if (!isTargeted) return false;
    }

    // Filter by subject
    if (selectedSubjectId !== 'all') {
      const subject = SUBJECTS.find((s) => s.id === selectedSubjectId);
      if (subject && res.courseCode !== subject.code) {
        return false;
      }
    }

    // Filter by category
    if (selectedCategory !== 'all' && res.category !== selectedCategory) {
      return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = res.title.toLowerCase().includes(q);
      const matchDesc = res.description.toLowerCase().includes(q);
      const matchTags = res.tags?.some((t) => t.toLowerCase().includes(q));
      const matchCode = res.courseCode.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTags && !matchCode) return false;
    }

    return true;
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsUploading(true);
    const taughtSubject = SUBJECTS.find((s) => s.id === user.taughtSubject) || SUBJECTS[0];

    const targetSets = targetSetMode === 'all' ? ['all'] : selectedTargetSets;

    await dataService.addResource({
      title: newTitle.trim(),
      subject: taughtSubject.name,
      courseCode: taughtSubject.code,
      category: newCategory,
      academicYear: '2024/2025',
      semester: 'Semester 1',
      fileSize: newFileSize || '2.4 MB',
      fileType: 'PDF',
      downloadsCount: 0,
      uploadedBy: user.name,
      uploaderEmail: user.email,
      uploadedDate: new Date().toISOString().split('T')[0],
      description: newDescription.trim() || 'Official lecture course material prepared for student download.',
      targetSets,
      tags: [taughtSubject.code, taughtSubject.name.replace(/\s+/g, ''), 'Semester1'],
    });

    setIsUploading(false);
    setIsUploadModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    if (onUploadSuccess) onUploadSuccess();
  };

  const toggleSetSelection = (setStr: string) => {
    if (selectedTargetSets.includes(setStr)) {
      setSelectedTargetSets(selectedTargetSets.filter((s) => s !== setStr));
    } else {
      setSelectedTargetSets([...selectedTargetSets, setStr]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60">
              8 Core Subjects Repository
            </span>
            {isStudent && (
              <span className="text-xs text-slate-500 font-medium">
                Filtered for: <strong>Set {studentSet}</strong>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Learning Resources Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Access slides, tutorial exercises, past examination papers, and lab manuals across Biology, Chemistry, Physics, Statistics, and Humanities.
          </p>
        </div>

        {/* Lecturer Upload Action Button */}
        {!isStudent ? (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs shrink-0"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Upload Material ({user.taughtSubjectName || 'My Subject'})</span>
          </button>
        ) : (
          <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs flex items-center gap-2 shrink-0">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Students cannot upload files (Lecturer authorized only)</span>
          </div>
        )}
      </div>

      {/* 8 Subjects Horizontal Filter Bar */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Filter by Subject
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedSubjectId === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All 8 Subjects
          </button>
          {SUBJECTS.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedSubjectId === sub.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{sub.name}</span>
              <span
                className={`text-[10px] px-1 rounded ${
                  selectedSubjectId === sub.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {sub.code}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources by title, topic, reaction kinetics, vectors, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Material Types</option>
            <option value="lecture_notes">Lecture Slides</option>
            <option value="exercises">Exercises & Problem Sets</option>
            <option value="lab_manual">Lab Manuals & Reports</option>
            <option value="past_year">Past Year Examination Papers</option>
            <option value="cheatsheet">Formula Sheets & Cheatsheets</option>
          </select>
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((res) => {
          const isTargetAll = res.targetSets.includes('all');
          return (
            <div
              key={res.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    {res.courseCode}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {isTargetAll ? 'All Sets' : res.targetSets.join(', ')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2.5 line-clamp-2 leading-snug">
                  {res.title}
                </h3>

                <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                  {res.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {res.tags?.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Uploaded by</div>
                  <div className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                    {res.uploadedBy}
                  </div>
                </div>

                <button
                  onClick={() => {
                    alert(`Downloading "${res.title}" (${res.fileSize})...`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{res.fileSize}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No resources found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search keywords, category filter, or subject selection.
          </p>
        </div>
      )}

      {/* Lecturer Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Upload Learning Material</h2>
                <p className="text-xs text-slate-500">
                  Author: <span className="font-semibold text-emerald-700">{user.name}</span> ({user.taughtSubjectName || 'Chemistry I'})
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject (Locked to your taught curriculum)
                </label>
                <input
                  type="text"
                  disabled
                  value={`${user.taughtSubjectName || 'Chemistry I'} (${user.taughtSubjectCode || 'PNAP0133'})`}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-semibold"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Lecturers may only upload resources for their assigned subject.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4: Chemical Kinetics & Rate Laws Slide Deck"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resource Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ResourceCategory)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="lecture_notes">Lecture Slides</option>
                    <option value="exercises">Exercises & Problem Set</option>
                    <option value="lab_manual">Lab Manual</option>
                    <option value="past_year">Past Year Paper</option>
                    <option value="cheatsheet">Cheatsheet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Simulated File Size
                  </label>
                  <input
                    type="text"
                    value={newFileSize}
                    onChange={(e) => setNewFileSize(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description & Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide study instructions or formula reminders for students..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Target Sets Selector (All Sets vs Specific Sets) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target Audience (Deliver to Student Dashboard)
                </label>
                <div className="flex items-center gap-3 mb-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetSetMode === 'all'}
                      onChange={() => setTargetSetMode('all')}
                      className="text-indigo-600"
                    />
                    <span className="font-semibold text-slate-800">All Sets (1 to 11)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetSetMode === 'specific'}
                      onChange={() => setTargetSetMode('specific')}
                      className="text-indigo-600"
                    />
                    <span className="font-semibold text-slate-800">Specific Sets Only</span>
                  </label>
                </div>

                {targetSetMode === 'specific' && (
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <span className="text-[11px] text-slate-500 block">
                      Choose which Sets will receive this document:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: 11 }, (_, i) => `Set ${i + 1}`).map((s) => {
                        const isChecked = selectedTargetSets.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSetSelection(s)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              isChecked
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Publishing...' : 'Publish to Target Sets'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
