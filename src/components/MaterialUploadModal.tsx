import React, { useState } from 'react';
import { UserProfile, ResourceCategory } from '../types.ts';
import { SUBJECTS } from '../data/mockData.ts';
import { dataService } from '../services/dataService.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  AlertCircle,
  HardDrive,
  Plus,
  ExternalLink,
} from 'lucide-react';

interface MaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSuccess?: (subjectId?: string) => void;
}

export const MaterialUploadModal: React.FC<MaterialUploadModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { dict } = useLanguage();

  // Source options: 'file' (local upload / photo), 'drive' (Google Drive), 'photo' (Google Photos / image URL), 'link' (web link)
  const [sourceType, setSourceType] = useState<'file' | 'drive' | 'photo' | 'link'>('file');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('lecture_notes');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [targetSetMode, setTargetSetMode] = useState<'all' | 'specific'>('all');
  const [selectedTargetSets, setSelectedTargetSets] = useState<string[]>(['Set 1', 'Set 3']);
  const [selectedFile, setSelectedFile] = useState<{ name: string; dataUrl?: string; type: string } | null>(null);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    user.taughtSubjectCode || 'PNAP0133'
  );

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Determine selected subject
  const chosenSubject =
    SUBJECTS.find((s) => s.code === selectedSubjectCode) ||
    SUBJECTS.find((s) => s.id === user.taughtSubject) ||
    SUBJECTS.find((s) => s.code === user.taughtSubjectCode) ||
    SUBJECTS[0];

  const subjectName = chosenSubject.name;
  const subjectCode = chosenSubject.code;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect file type
    let inferredType = 'PDF';
    if (file.type.includes('image')) {
      inferredType = 'IMAGE';
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      inferredType = 'DOCX';
    } else if (file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) {
      inferredType = 'PPTX';
    } else if (file.name.endsWith('.zip')) {
      inferredType = 'ZIP';
    }

    // Read small files or images for direct preview/dataUrl
    if (file.size < 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedFile({
          name: file.name,
          dataUrl: reader.result as string,
          type: inferredType,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile({
        name: file.name,
        type: inferredType,
      });
    }

    if (!title.trim()) {
      // Auto-populate title from file name without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const toggleSetSelection = (setStr: string) => {
    if (selectedTargetSets.includes(setStr)) {
      setSelectedTargetSets(selectedTargetSets.filter((s) => s !== setStr));
    } else {
      setSelectedTargetSets([...selectedTargetSets, setStr]);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setExternalUrl('');
    setSelectedFile(null);
    setSourceType('file');
    setCategory('lecture_notes');
    setTargetSetMode('all');
    setSelectedTargetSets(['Set 1', 'Set 3']);
    setErrorMsg('');
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Sila masukkan tajuk bahan pembelajaran.');
      return;
    }

    if (sourceType === 'drive' && !externalUrl.trim()) {
      setErrorMsg('Sila masukkan pautan (link) Google Drive.');
      return;
    }

    if (sourceType === 'photo' && !externalUrl.trim() && !selectedFile) {
      setErrorMsg('Sila masukkan pautan foto atau muat naik fail foto.');
      return;
    }

    if (sourceType === 'link' && !externalUrl.trim()) {
      setErrorMsg('Sila masukkan alamat URL pautan bahan.');
      return;
    }

    setIsUploading(true);

    try {
      const targetSets = targetSetMode === 'all' ? ['all'] : selectedTargetSets;

      let fileType = 'PDF';
      let fileUrl = '#';

      if (sourceType === 'drive') {
        fileType = 'DRIVE';
        fileUrl = externalUrl.trim();
      } else if (sourceType === 'photo') {
        fileType = 'IMAGE';
        fileUrl = selectedFile?.dataUrl || externalUrl.trim();
      } else if (sourceType === 'link') {
        fileType = 'LINK';
        fileUrl = externalUrl.trim();
      } else if (selectedFile) {
        fileType = selectedFile.type;
        fileUrl = selectedFile.dataUrl || '#';
      }

      await dataService.addResource({
        title: title.trim(),
        subject: subjectName,
        courseCode: subjectCode,
        category,
        description: description.trim() || 'Bahan pembelajaran rasmi ASASIpintar UKM.',
        academicYear: '2024/2025',
        semester: 'Semester 1',
        fileUrl,
        fileType,
        sourceType,
        externalUrl: externalUrl.trim() || undefined,
        uploadedBy: user.name,
        uploaderEmail: user.email,
        uploadedDate: new Date().toISOString().split('T')[0],
        targetSets,
        tags: [subjectName, category.replace('_', ' ')],
        downloadsCount: 0,
      });

      resetForm();
      onClose();

      if (onSuccess) {
        onSuccess(chosenSubject.id);
      }
    } catch (err: any) {
      console.error('Error adding resource:', err);
      setErrorMsg('Ralat semasa memuat naik bahan. Sila cuba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                {subjectCode}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Muat Naik Bahan Pembelajaran
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pensyarah: <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Respective Subject Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Subjek / Kursus Bahan:
            </label>
            <select
              value={selectedSubjectCode}
              onChange={(e) => setSelectedSubjectCode(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {SUBJECTS.map((sub) => (
                <option key={sub.code} value={sub.code}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          {/* Source Selection Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Punca / Sumber Bahan (Source)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSourceType('file')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  sourceType === 'file'
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Fail / Dokumen</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('drive')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  sourceType === 'drive'
                    ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>Google Drive</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('photo')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  sourceType === 'photo'
                    ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Foto / Gambar</span>
              </button>
            </div>
          </div>

          {/* Source Specific Input */}
          {sourceType === 'file' && (
            <div className="p-3.5 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/30 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Fail dari Komputer / Telefon
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
              {selectedFile && (
                <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-semibold pt-1">
                  <span className="truncate max-w-[280px]">✓ Fail dipilih: {selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Menyokong PDF, Word (.docx), PowerPoint (.pptx), gambar foto (.png/.jpg) & fail ZIP.
              </p>
            </div>
          )}

          {sourceType === 'drive' && (
            <div className="space-y-1.5 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/30">
              <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300">
                Pautan Kongsi Google Drive (Share Link)
              </label>
              <div className="relative">
                <HardDrive className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pastikan kebenaran pautan Google Drive ditetapkan kepada &quot;Anyone with the link can view&quot;.
              </p>
            </div>
          )}

          {sourceType === 'photo' && (
            <div className="space-y-2 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/30">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300">
                Pautan Foto Google Photos atau Muat Naik Foto
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" />
                <input
                  type="url"
                  placeholder="https://photos.google.com/... atau URL gambar terus"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="text-center text-[10px] text-slate-400 font-semibold uppercase">— atau pilih foto dari peranti —</div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
              />
              {selectedFile?.dataUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={selectedFile.dataUrl}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Foto sedia dimuat naik</span>
                </div>
              )}
            </div>
          )}

          {/* Material Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tajuk Bahan Pembelajaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="cth. Chapter 4: Chemical Kinetics & Rate Laws Slides"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kategori Bahan
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ResourceCategory)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="lecture_notes">Slaid Kuliah &amp; Nota (Lecture Notes)</option>
              <option value="exercises">Latihan &amp; Tutorial (Exercises)</option>
              <option value="lab_manual">Manual Makmal (Lab Manual)</option>
              <option value="past_year">Kertas Peperiksaan Lepas (Past Years)</option>
              <option value="cheatsheet">Lembaran Formula (Formula Sheet)</option>
            </select>
          </div>

          {/* Description / Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Penerangan / Arahan Pelajar (Pilihan)
            </label>
            <textarea
              rows={2}
              placeholder="Berikan arahan ringkas atau topik persediaan untuk rujukan pelajar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Target Sets Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Sasaran Pelajar (Target Sets)
            </label>
            <div className="flex items-center gap-4 mb-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="targetModeModal"
                  checked={targetSetMode === 'all'}
                  onChange={() => setTargetSetMode('all')}
                  className="text-indigo-600"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Semua 11 Set Pelajar (318 Pelajar)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="targetModeModal"
                  checked={targetSetMode === 'specific'}
                  onChange={() => setTargetSetMode('specific')}
                  className="text-indigo-600"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Set Tertentu Sahaja</span>
              </label>
            </div>

            {targetSetMode === 'specific' && (
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 11 }, (_, i) => `Set ${i + 1}`).map((s) => {
                    const isChecked = selectedTargetSets.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSetSelection(s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Memuat Naik...' : 'Terbitkan Bahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
