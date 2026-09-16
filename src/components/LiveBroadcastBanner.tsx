import React, { useState, useEffect } from 'react';
import { BroadcastNotice, UserProfile } from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import {
  Bell,
  AlertTriangle,
  Info,
  Calendar,
  X,
  Volume2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface LiveBroadcastBannerProps {
  broadcasts: BroadcastNotice[];
  user: UserProfile;
  onOpenNotice?: (notice: BroadcastNotice) => void;
}

export const LiveBroadcastBanner: React.FC<LiveBroadcastBannerProps> = ({
  broadcasts,
  user,
  onOpenNotice,
}) => {
  const { lang, dict } = useLanguage();
  const [activeNotice, setActiveNotice] = useState<BroadcastNotice | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pintar_dismissed_broadcasts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter notices for this user
  const relevantNotices = broadcasts.filter((b) => {
    if (user.role === 'lecturer') return true;
    const studentSet = String(user.setNumber || '3');
    return b.targetSet === 'all' || b.targetSet === studentSet;
  });

  // When a new notice arrives that hasn't been dismissed, display banner
  useEffect(() => {
    if (relevantNotices.length > 0) {
      const latest = relevantNotices[0];
      if (!dismissedIds.includes(latest.id)) {
        setActiveNotice(latest);
      }
    }
  }, [relevantNotices, dismissedIds]);

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('pintar_dismissed_broadcasts', JSON.stringify(updated));
    setActiveNotice(null);
  };

  if (!activeNotice) return null;

  const isUrgent = activeNotice.priority === 'urgent';
  const isReschedule = activeNotice.priority === 'reschedule';

  return (
    <div
      className={`relative z-30 transition-all duration-300 ${
        isUrgent
          ? 'bg-gradient-to-r from-rose-900 via-rose-800 to-red-900 text-white border-b-2 border-rose-500'
          : isReschedule
          ? 'bg-gradient-to-r from-amber-900 via-amber-800 to-yellow-900 text-amber-50 border-b-2 border-amber-500'
          : 'bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-indigo-50 border-b-2 border-indigo-500'
      } shadow-md`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Pulsing indicator */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isUrgent
                  ? 'bg-rose-600/40 text-rose-200 animate-pulse'
                  : isReschedule
                  ? 'bg-amber-600/40 text-amber-200 animate-bounce'
                  : 'bg-indigo-600/40 text-indigo-200'
              }`}
            >
              {isUrgent ? (
                <AlertTriangle className="w-4 h-4" />
              ) : isReschedule ? (
                <Calendar className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isUrgent
                      ? 'bg-rose-500 text-white'
                      : isReschedule
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-indigo-500 text-white'
                  }`}
                >
                  {isUrgent
                    ? dict.priorityUrgent
                    : isReschedule
                    ? dict.priorityReschedule
                    : dict.priorityInfo}
                </span>

                <span className="text-xs font-bold text-white/90">
                  {activeNotice.senderName} ({activeNotice.subjectName})
                </span>

                <span className="text-[11px] text-white/70">
                  • {dict.broadcastTo}: {activeNotice.targetSet === 'all' ? dict.allSets : `Set ${activeNotice.targetSet}`}
                </span>
              </div>

              <div className="text-xs font-medium text-white/95 truncate mt-0.5">
                <strong className="font-bold">{activeNotice.title}:</strong> {activeNotice.message}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleDismiss(activeNotice.id)}
              className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/40 text-xs font-semibold text-white/90 transition-colors flex items-center gap-1"
            >
              <span>{dict.dismiss}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
