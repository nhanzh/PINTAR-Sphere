import React, { useState } from 'react';
import { UserProfile, BroadcastNotice } from '../types.ts';
import { dataService } from '../services/dataService.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import {
  Bell,
  AlertTriangle,
  Calendar,
  Info,
  X,
  Send,
  CheckCircle2,
  Users,
  Radio,
  Sparkles,
  Eye,
  Megaphone,
} from 'lucide-react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecturer: UserProfile;
  onBroadcastSent?: (notice: BroadcastNotice) => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  lecturer,
  onBroadcastSent,
}) => {
  const { lang, dict } = useLanguage();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetSet, setTargetSet] = useState<string>('all');
  const [priority, setPriority] = useState<'urgent' | 'info' | 'reschedule'>('urgent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const subjectName = lecturer.taughtSubjectName || 'Chemistry I';
  const subjectCode = lecturer.taughtSubjectCode || 'PNAP0133';

  // Quick message template generator
  const applyTemplate = (tplType: 'venue' | 'deadline' | 'reschedule' | 'lab') => {
    if (tplType === 'venue') {
      setTitle(lang === 'ms' ? `Pertukaran Dewan Kuliah (${subjectCode})` : `Class Hall Relocation (${subjectCode})`);
      setMessage(
        lang === 'ms'
          ? `Perhatian pelajar, kuliah ${subjectName} dipindahkan ke Dewan Kuliah Utama (DKU 1) berkuat kuasa serta-merta.`
          : `Attention students, ${subjectName} lecture has been relocated to Main Lecture Hall (DKU 1) effective immediately.`
      );
    } else if (tplType === 'deadline') {
      setTitle(lang === 'ms' ? `Lanjutan Tarikh Akhir Tugasan (${subjectCode})` : `Assignment Deadline Extension (${subjectCode})`);
      setMessage(
        lang === 'ms'
          ? `Tarikh akhir penghantaran bagi ${subjectName} telah dilanjutkan sehingga Ahad ini, jam 11:59 malam.`
          : `The submission deadline for ${subjectName} coursework has been extended until this Sunday, 11:59 PM.`
      );
    } else if (tplType === 'reschedule') {
      setPriority('reschedule');
      setTitle(lang === 'ms' ? `Notis Penjadualan Semula Kelas (${subjectCode})` : `Class Rescheduling Notice (${subjectCode})`);
      setMessage(
        lang === 'ms'
          ? `Kelas ${subjectName} pada hari ini digantikan ke sesi dalam talian / tarikh ganti yang akan dimaklumkan.`
          : `Today's ${subjectName} class will be rescheduled or conducted online. Further details to follow.`
      );
    } else if (tplType === 'lab') {
      setTitle(lang === 'ms' ? `Peringatan Sesi Makmal / Amali (${subjectCode})` : `Laboratory Practical Session Reminder (${subjectCode})`);
      setMessage(
        lang === 'ms'
          ? `Sila bawa kot makmal, gogal keselamatan, dan manual amali untuk sesi makmal ${subjectName}.`
          : `Please bring your lab coat, safety goggles, and practical manual for the ${subjectName} lab session.`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const newNotice = await dataService.addBroadcast({
        title: title.trim(),
        message: message.trim(),
        senderName: lecturer.name,
        senderEmail: lecturer.email,
        subjectCode,
        subjectName,
        targetSet,
        priority,
      });

      setSuccessMsg(dict.broadcastSentSuccess || 'Hebahan berjaya dihantar secara langsung ke portal pelajar!');
      if (onBroadcastSent) {
        onBroadcastSent(newNotice);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg('');
        setTitle('');
        setMessage('');
        onClose();
      }, 1300);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-slate-800 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {dict.broadcastNotice || 'Hantar Hebahan Segera ke Pelajar'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                  LIVE BROADCAST
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subjectName} ({subjectCode}) • {lecturer.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Broadcast Description Badge */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-950 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-3">
          <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Peringatan Pensyarah:</strong> Hebahan yang dihantar akan muncul secara langsung (*real-time banner & alert*) pada skrin portal semua pelajar yang dipilih sertamerta.
          </div>
        </div>

        {successMsg ? (
          <div className="my-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white">{successMsg}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Notis hebahan sedang dipaparkan di portal pelajar secara masa nyata.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Template Selector Chips */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Template Pantas (Tekan untuk isi borang automatik)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTemplate('venue')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  🏛️ Tukar Dewan Kuliah
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('reschedule')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  ⏰ Penjadualan Semula
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('deadline')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  📅 Lanjutan Masa
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('lab')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  🧪 Sesi Makmal
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Target Set Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{dict.broadcastTo || 'Sasaran Kumpulan Pelajar'}</span>
                </label>
                <select
                  value={targetSet}
                  onChange={(e) => setTargetSet(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                >
                  <option value="all">🌟 Semua Pelajar (Set 1 - Set 11)</option>
                  {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={String(s)}>
                      🎯 Set {s} Sahaja
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>{dict.priority || 'Tahap Keutamaan'}</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      priority === 'urgent'
                        ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 dark:border-rose-700 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/50 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🚨</span>
                    <span>Kecemasan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('reschedule')}
                    className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      priority === 'reschedule'
                        ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/50 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🔄</span>
                    <span>Jadual Semula</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('info')}
                    className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      priority === 'info'
                        ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/50 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>ℹ️</span>
                    <span>Makluman</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tajuk Hebahan / Notice Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth: Pertukaran Dewang Kuliah bagi Kuliah Kimia I"
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kandungan Mesej / Message Content
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Masukkan maklumat terperinci untuk perhatian pelajar..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none shadow-xs leading-relaxed"
              />
            </div>

            {/* Live Student View Simulation Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Eye className="w-3 h-3" />
                  <span>Simulasi Paparan Pelajar (Student Live Preview)</span>
                </span>
                <span className="text-amber-400">
                  {targetSet === 'all' ? 'Semua Set' : `Set ${targetSet}`}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs leading-snug transition-all ${
                  priority === 'urgent'
                    ? 'bg-rose-950/80 border-rose-600/80 text-rose-100'
                    : priority === 'reschedule'
                    ? 'bg-amber-950/80 border-amber-600/80 text-amber-100'
                    : 'bg-indigo-950/80 border-indigo-600/80 text-indigo-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                      priority === 'urgent'
                        ? 'bg-rose-500 text-white'
                        : priority === 'reschedule'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-indigo-500 text-white'
                    }`}
                  >
                    {priority === 'urgent'
                      ? '🚨 Kecemasan'
                      : priority === 'reschedule'
                      ? '🔄 Penjadualan Semula'
                      : 'ℹ️ Makluman'}
                  </span>
                  <span className="font-bold text-[11px]">
                    {lecturer.name} ({subjectName})
                  </span>
                </div>
                <div>
                  <strong>{title || 'Tajuk Hebahan Pelajar'}</strong>: {message || 'Kandungan mesej hebahan akan muncul di sini secara masa nyata...'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {dict.cancelBtn || 'Batal'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !message.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-50 text-white text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Penghantaran...' : 'Hantar Hebahan Masa Nyata'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

