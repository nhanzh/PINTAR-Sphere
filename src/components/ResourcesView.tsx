import React, { useState, useMemo } from 'react';
import { UserProfile, ResourceItem } from '../types.ts';
import { SUBJECTS } from '../data/mockData.ts';
import { getSubjectDisplayName } from '../utils/subjectNames.ts';
import { dataService } from '../services/dataService.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { MaterialUploadModal } from './MaterialUploadModal.tsx';
import {
  BookOpen,
  Download,
  Search,
  Plus,
  Upload,
  Lock,
  ExternalLink,
  Trash2,
  HardDrive,
  Image as ImageIcon,
  FileText,
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
  const { dict } = useLanguage();
  const isStudent = user.role === 'student';
  const studentSet = user.setNumber || 3;

  // Default to lecturer's taught subject or first subject (Kimia I)
  const defaultSubjectId = useMemo(() => {
    if (user.role === 'lecturer') {
      const match = SUBJECTS.find((s) => s.id === user.taughtSubject || s.code === user.taughtSubjectCode);
      if (match) return match.id;
    }
    return SUBJECTS[0].id;
  }, [user.role, user.taughtSubject, user.taughtSubjectCode]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(defaultSubjectId);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

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

    // Filter strictly by active subject
    const subject = SUBJECTS.find((s) => s.id === selectedSubjectId);
    if (subject && res.courseCode !== subject.code) {
      return false;
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

  const confirmDeleteResource = async () => {
    if (!deleteTarget) return;
    await dataService.deleteResource(deleteTarget.id);
    setDeleteTarget(null);
    if (onUploadSuccess) {
      onUploadSuccess();
    }
  };

  const handleOpenResource = (res: ResourceItem) => {
    if (res.fileUrl && res.fileUrl !== '#' && (res.fileUrl.startsWith('http://') || res.fileUrl.startsWith('https://'))) {
      window.open(res.fileUrl, '_blank', 'noopener,noreferrer');
    } else if (res.fileUrl && res.fileUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = res.fileUrl;
      a.download = res.title || 'bahan-pembelajaran';
      a.click();
    } else {
      alert(`Membuka bahan pembelajaran: "${res.title}"`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200/60 dark:border-indigo-800">
              8 Core Subjects Repository
            </span>
            {isStudent && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {dict.targetSetPrefix}: <strong>Set {studentSet}</strong>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            {dict.resourcesTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.resourcesDesc}
          </p>
        </div>

        {/* Lecturer Upload Action Button */}
        {!isStudent ? (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400 dark:text-white" />
            <span>+ Tambah Bahan / Add File</span>
          </button>
        ) : (
          <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2 shrink-0">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>{dict.accessLabel}: Set {studentSet} ({dict.exclusiveNotice})</span>
          </div>
        )}
      </div>

      {/* 8 Subjects Horizontal Filter Bar */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          {dict.subjectFilterLabel || dict.filterSubject}
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SUBJECTS.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedSubjectId === sub.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{getSubjectDisplayName(sub.code, dict.lang || 'ms')}</span>
              <span
                className={`text-[10px] px-1 rounded ${
                  selectedSubjectId === sub.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {sub.code}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={dict.searchResourcesPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{dict.allCategories}</option>
            <option value="lecture_notes">{dict.lectureNotes}</option>
            <option value="exercises">{dict.assignmentsTutorials}</option>
            <option value="lab_manual">{dict.labManuals}</option>
            <option value="cheatsheet">Formula Sheets</option>
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
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
                      {res.courseCode}
                    </span>
                    {res.sourceType === 'drive' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        Google Drive
                      </span>
                    )}
                    {res.sourceType === 'photo' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Foto
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {isTargetAll ? dict.allSets : res.targetSets.join(', ')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2.5 line-clamp-2 leading-snug">
                  {res.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                  {res.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {res.tags?.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{dict.uploadedByLabel}</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                    {res.uploadedBy}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenResource(res)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-400 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {res.sourceType === 'drive' ? (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Drive</span>
                      </>
                    ) : res.sourceType === 'photo' ? (
                      <>
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Lihat Foto</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Buka Fail</span>
                      </>
                    )}
                  </button>

                  {/* Delete button: strictly ONLY FOR LECTURERS */}
                  {!isStudent && (
                    <button
                      onClick={() => setDeleteTarget({ id: res.id, title: res.title })}
                      className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                      title="Padam Bahan Pembelajaran"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {resources.length === 0
                ? 'Tiada Bahan Pembelajaran Dimuat Naik Buat Masa Ini'
                : dict.noResourcesFound}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {resources.length === 0
                ? 'Repositori bahan pembelajaran masih kosong buat masa ini.'
                : dict.searchResourcesPlaceholder}
            </p>
          </div>
          {!isStudent && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Bahan / Add File</span>
            </button>
          )}
        </div>
      )}

      {/* Confirmation Modal for Deleting Material */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Padamkan Bahan?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Adakah anda pasti mahu memadamkan "{deleteTarget.title}"?
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteResource}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Ya, Padamkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lecturer Upload Modal */}
      <MaterialUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        user={user}
        onSuccess={(uploadedSubjectId) => {
          if (uploadedSubjectId) {
            setSelectedSubjectId(uploadedSubjectId);
          }
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        }}
      />
    </div>
  );
};
