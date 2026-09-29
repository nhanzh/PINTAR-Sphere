import React, { useState } from 'react';
import { AppNotification, UserProfile, ActiveTab } from '../types.ts';
import { dataService } from '../services/dataService.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
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
  const { lang, dict } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'in_app' | 'email'>('in_app');

  if (!isOpen) return null;

  const labels = {
    ms: {
      title: 'Pusat Notifikasi UKM',
      inAppTab: 'Notifikasi In-App',
      emailTab: 'Makluman Emel',
      markRead: 'Tanda Dibaca',
      clearAll: 'Padam Semua',
      empty: 'Tiada notifikasi setakat ini.',
      newBadge: 'Baharu',
      openView: 'Buka Paparan',
      deleteTip: 'Padam Notifikasi',
      sentTo: 'Dihantar ke',
    },
    en: {
      title: 'UKM Notification Center',
      inAppTab: 'In-App Alerts',
      emailTab: 'Email Notifications',
      markRead: 'Mark Read',
      clearAll: 'Clear All',
      empty: 'No notifications at this time.',
      newBadge: 'New',
      openView: 'Open View',
      deleteTip: 'Delete Notification',
      sentTo: 'Sent to',
    },
    zh: {
      title: 'UKM 通知与消息中心',
      inAppTab: '应用内通知',
      emailTab: '邮箱同步提醒',
      markRead: '全部标为已读',
      clearAll: '清空全部通知',
      empty: '暂无任何通知。',
      newBadge: '新',
      openView: '前往查看',
      deleteTip: '删除通知',
      sentTo: '接收方',
    },
    ta: {
      title: 'UKM அறிவிப்பு மையம்',
      inAppTab: 'பயன்பாட்டு அறிவிப்புகள்',
      emailTab: 'மின்னஞ்சல் விழிப்பூட்டல்கள்',
      markRead: 'படித்ததாகக் குறிக்கவும்',
      clearAll: 'அனைத்தையும் அழி',
      empty: 'தற்போது எந்த அறிவிப்பும் இல்லை.',
      newBadge: 'புதியது',
      openView: 'பார்வையைத் திறக்கவும்',
      deleteTip: 'அறிவிப்பை நீக்கு',
      sentTo: 'அனுப்பப்பட்டது',
    },
  }[lang] || {
    title: 'Pusat Notifikasi UKM',
    inAppTab: 'Notifikasi In-App',
    emailTab: 'Makluman Emel',
    markRead: 'Tanda Dibaca',
    clearAll: 'Padam Semua',
    empty: 'Tiada notifikasi setakat ini.',
    newBadge: 'Baharu',
    openView: 'Buka Paparan',
    deleteTip: 'Padam Notifikasi',
    sentTo: 'Dihantar ke',
  };

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
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{labels.title}</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                    {unreadCount} {labels.newBadge}
                  </span>
                )}
              </div>
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
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{labels.inAppTab} ({notifications.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'email'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>{labels.emailTab} ({notifications.length})</span>
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
                <span>{labels.markRead}</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer ml-2"
                title={labels.clearAll}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{labels.clearAll}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{labels.empty}</div>
            </div>
          ) : activeSubTab === 'in_app' ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  !notif.isRead
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 shadow-2xs'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
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
                      <span>{labels.openView} {notif.linkTab.toUpperCase()}</span>
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
                    title={labels.deleteTip}
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
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5 text-[11px]">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {labels.sentTo}: {notif.recipientEmail === 'all' ? user.email : notif.recipientEmail}
                  </span>
                  <span>{new Date(notif.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang === 'ta' ? 'ta-IN' : lang === 'en' ? 'en-US' : 'ms-MY')} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
