import React, { useState } from 'react';
import { AppNotification, UserProfile, ActiveTab } from '../types.ts';
import { dataService } from '../services/dataService.ts';
import {
  Bell,
  Mail,
  CheckCheck,
  X,
  ExternalLink,
  BookOpen,
  Calculator,
  Award,
  Clock,
  MessageSquare,
  Sparkles,
  Megaphone,
  Trash2,
} from 'lucide-react';

interface NotificationCenterModalProps {
  user: UserProfile;
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  user,
  notifications,
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'in_app' | 'email'>('in_app');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    await dataService.markAllNotificationsRead(user.email);
  };

  const handleClearAll = async () => {
    await dataService.clearAllNotifications(user.email);
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    await dataService.deleteNotification(notifId);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await dataService.markNotificationRead(notif.id);
    }
    if (notif.linkTab) {
      onNavigateTab(notif.linkTab);
      onClose();
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'resource_uploaded':
        return <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'grade_published':
        return <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'koko_reviewed':
      case 'koko_submitted':
        return <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'deadline_assigned':
      case 'assignment_submitted':
        return <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'community_reply':
      case 'community_like':
      case 'community_reaction':
        return <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'broadcast':
        return <Megaphone className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Pusat Notifikasi UKM</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                    {unreadCount} Baharu
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Makluman In-App & Penghantaran Emel Akaun UKM ({user.email})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs & Controls */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSubTab('in_app')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'in_app'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifikasi In-App ({notifications.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'email'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>Makluman Emel ({notifications.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && activeSubTab === 'in_app' && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tanda Dibaca</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer ml-2"
                title="Padam semua notifikasi"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Padam Semua</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-500">Tiada notifikasi setakat ini.</div>
            </div>
          ) : activeSubTab === 'in_app' ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  !notif.isRead
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 shadow-2xs'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/60'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                  {getIconForType(notif.type)}
                </div>
                <div className="min-w-0 flex-1 space-y-1 pr-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      {notif.title}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {notif.message}
                  </p>
                  {notif.linkTab && (
                    <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      <span>Buka Paparan {notif.linkTab.toUpperCase()}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(e, notif.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Padam Notifikasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-slate-500 border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5 text-[11px]">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    Dihantar ke: {notif.recipientEmail === 'all' ? user.email : notif.recipientEmail}
                  </span>
                  <span>{new Date(notif.createdAt).toLocaleDateString('ms-MY')} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">{notif.title}</div>
                  <div className="text-slate-600 dark:text-slate-300 mt-1">{notif.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
