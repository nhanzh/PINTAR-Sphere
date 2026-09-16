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
        subjectCode: lecturer.taughtSubjectCode || 'PNAP0133',
        subjectName: lecturer.taughtSubjectName || 'Chemistry I',
        targetSet,
        priority,
      });

      setSuccessMsg(dict.broadcastSentSuccess);
      if (onBroadcastSent) {
        onBroadcastSent(newNotice);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg('');
        setTitle('');
        setMessage('');
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{dict.broadcastNotice}</h2>
              <p className="text-xs text-slate-500">
                {lecturer.taughtSubjectName} • {lecturer.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vendor - Customer Connection Notice */}
        <div className="mt-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>{dict.liveDispatchDesc}</div>
        </div>

        {successMsg ? (
          <div className="my-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-900">{successMsg}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {dict.broadcastTo}
                </label>
                <select
                  value={targetSet}
                  onChange={(e) => setTargetSet(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">{dict.allSets}</option>
                  {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={String(s)}>
                      Set {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {dict.priority}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border ${
                      priority === 'urgent'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 ring-1 ring-rose-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🚨 {dict.priorityUrgent}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('reschedule')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border ${
                      priority === 'reschedule'
                        ? 'bg-amber-50 border-amber-300 text-amber-800 ring-1 ring-amber-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🔄 {dict.priorityReschedule}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('info')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border ${
                      priority === 'info'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ℹ️ {dict.priorityInfo}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {dict.noticeTitle}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  priority === 'reschedule'
                    ? 'cth: Kuliah Kimia Set 3 Dipindahkan ke DK2'
                    : 'cth: Peringatan Penghantaran Laporan Makmal'
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {dict.noticeMessage}
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan makluman lengkap untuk pelajar yang berkenaan..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {dict.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !message.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Menghantar...' : dict.sendBroadcast}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
