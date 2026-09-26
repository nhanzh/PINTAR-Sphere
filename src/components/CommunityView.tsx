import React, { useState } from 'react';
import { UserProfile, ForumPost, ForumReaction } from '../types.ts';
import { dataService } from '../services/dataService.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import {
  MessageSquare,
  Heart,
  Send,
  Plus,
  Tag,
  ShieldCheck,
  GraduationCap,
  MessageCircle,
  X,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Edit3,
  Smile,
  Check,
  Users,
} from 'lucide-react';

interface CommunityViewProps {
  user: UserProfile;
  posts: ForumPost[];
  onRefreshData?: () => void;
}

const EMOJI_OPTIONS = [
  { emoji: '👍', label: 'Setuju / Bermanfaat' },
  { emoji: '❤️', label: 'Suka' },
  { emoji: '💡', label: 'Idea Bernas' },
  { emoji: '👏', label: 'Tahniah' },
  { emoji: '🔥', label: 'Hebat' },
  { emoji: '🎯', label: 'Tepat & Jelas' },
];

export const CommunityView: React.FC<CommunityViewProps> = ({
  user,
  posts,
  onRefreshData,
}) => {
  const { lang, dict } = useLanguage();
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('General, StudyTips');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; dataUrl: string; type: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Thread state
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Reply state
  const [activeReplyPostId, setActiveReplyPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState<{ name: string; size: string; dataUrl: string; type: string } | null>(null);

  // Edit Reply state
  const [editingReplyInfo, setEditingReplyInfo] = useState<{ postId: string; replyId: string; text: string } | null>(null);

  // Reaction picker open state
  const [activeReactionPickerPostId, setActiveReactionPickerPostId] = useState<string | null>(null);

  const tagsList = ['all', 'StudyTips', 'Chemistry', 'Physics', 'Biology', 'General', 'Schedule', 'Koko'];

  const filteredPosts = posts.filter((p) => {
    if (selectedTag !== 'all' && !p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>, isReply = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
    const isImage = file.type.startsWith('image/');

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fileData = {
        name: file.name,
        size: sizeStr,
        dataUrl,
        type: isImage ? 'image' : 'document',
      };
      if (isReply) {
        setReplyFile(fileData);
      } else {
        setAttachedFile(fileData);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    const splitTags = newTagsStr
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    await dataService.createPost({
      title: newTitle.trim(),
      content: newContent.trim(),
      authorName: user.name,
      authorEmail: user.email,
      authorRole: user.role,
      setNumber: user.role === 'student' ? user.setNumber : undefined,
      subjectCode: user.role === 'lecturer' ? user.taughtSubjectCode : undefined,
      tags: splitTags.length > 0 ? splitTags : ['General'],
      imageUrl: attachedFile?.type === 'image' ? attachedFile.dataUrl : undefined,
      fileName: attachedFile ? attachedFile.name : undefined,
      fileUrl: attachedFile ? attachedFile.dataUrl : undefined,
    });

    setIsSubmitting(false);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewContent('');
    setAttachedFile(null);
    if (onRefreshData) onRefreshData();
  };

  const handleSaveEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editTitle.trim() || !editContent.trim()) return;

    setIsEditing(true);
    await dataService.updatePost(editingPost.id, editTitle.trim(), editContent.trim());
    setIsEditing(false);
    setEditingPost(null);
    if (onRefreshData) onRefreshData();
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Adakah anda pasti mahu memadam topik perbincangan ini?')) {
      await dataService.deletePost(postId);
      if (onRefreshData) onRefreshData();
    }
  };

  const handleDeleteReply = async (postId: string, replyId: string) => {
    if (window.confirm('Adakah anda pasti mahu memadam balasan ini?')) {
      await dataService.deleteReplyFromPost(postId, replyId);
      if (onRefreshData) onRefreshData();
    }
  };

  const handleSaveEditReply = async (postId: string, replyId: string) => {
    if (!editingReplyInfo || !editingReplyInfo.text.trim()) return;
    await dataService.updateReplyInPost(postId, replyId, editingReplyInfo.text.trim());
    setEditingReplyInfo(null);
    if (onRefreshData) onRefreshData();
  };

  const handleReact = async (postId: string, emoji: string) => {
    const userDisplay = `${user.name} (${user.role === 'student' ? `Set ${user.setNumber || '?'}` : 'Pensyarah'})`;
    await dataService.togglePostReaction(postId, emoji, {
      name: userDisplay,
      email: user.email,
    });
    setActiveReactionPickerPostId(null);
    if (onRefreshData) onRefreshData();
  };

  const handleSendReply = async (postId: string) => {
    if (!replyText.trim() && !replyFile) return;

    await dataService.addReplyToPost(postId, {
      authorName: user.name,
      authorEmail: user.email,
      authorRole: user.role,
      authorSet: user.role === 'student' ? `Set ${user.setNumber || 3}` : user.department || 'Pensyarah',
      content: replyText.trim(),
      imageUrl: replyFile?.type === 'image' ? replyFile.dataUrl : undefined,
      fileName: replyFile ? replyFile.name : undefined,
      fileUrl: replyFile ? replyFile.dataUrl : undefined,
    });

    setReplyText('');
    setReplyFile(null);
    setActiveReplyPostId(null);
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200/60 dark:border-indigo-800">
              {dict.tabCommunity}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {dict.communityFeedTitle}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            {dict.communityFeedTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.communityFeedDesc}
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-indigo-400 dark:text-white" />
          <span>{dict.startDiscussionBtn}</span>
        </button>
      </div>

      {/* Tags Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tagsList.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              selectedTag === tag
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {tag === 'all' ? dict.allDiscussions : `#${tag}`}
          </button>
        ))}
      </div>

      {/* Posts Stream */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Komuniti ASASIpintar Masih Kosong
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Belum ada perbincangan atau topik buat masa ini. Anda boleh menjadi orang pertama yang memulakan perbincangan akademik atau perkongsian tips di sini!
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{dict.startDiscussionBtn}</span>
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isLecturer = post.authorRole === 'lecturer';
            const postDate = new Date(post.createdAt);
            const isMyPost = user.email.toLowerCase() === post.authorEmail.toLowerCase();
            const reactions = post.reactions || [];

            return (
              <div
                key={post.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3.5 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isLecturer
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {isLecturer ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <GraduationCap className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{post.authorName}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isLecturer
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {isLecturer
                            ? `${dict.roleLecturer} • ${post.subjectCode || 'UKM'}`
                            : `${dict.roleStudent} • Set ${post.setNumber || '?'}`}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {post.authorEmail} • {postDate.toLocaleDateString('ms-MY')} {postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Author (Edit & Delete) / Lecturer Deletion + Tags */}
                  <div className="flex items-center gap-2">
                    {(isMyPost || user.role === 'lecturer') && (
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        {isMyPost && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPost(post);
                              setEditTitle(post.title);
                              setEditContent(post.content);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Edit Thread"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title={isMyPost ? "Padam Thread" : "Padam Thread Pelajar (Pensyarah)"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="hidden sm:flex items-center gap-1">
                      {post.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Title & Body */}
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">{post.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Attached Image or File in Post */}
                {post.imageUrl && (
                  <div className="mt-2.5">
                    <img
                      src={post.imageUrl}
                      alt="Lampiran Gambar"
                      className="max-h-72 max-w-full rounded-xl border border-slate-200 dark:border-slate-700 object-cover shadow-2xs"
                    />
                  </div>
                )}

                {post.fileName && !post.imageUrl && (
                  <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="truncate max-w-xs">{post.fileName}</span>
                  </div>
                )}

                {/* Reactions Bar with Non-Anonymous Names */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                  {/* Reaction Buttons */}
                  {reactions.map((r, idx) => {
                    const hasMyReaction = r.users.some(
                      (u) => u.email.toLowerCase() === user.email.toLowerCase()
                    );
                    const userNamesList = r.users.map((u) => u.name).join(', ');

                    return (
                      <div key={idx} className="relative group">
                        <button
                          type="button"
                          onClick={() => handleReact(post.id, r.emoji)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                            hasMyReaction
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                          title={`Reaksi oleh: ${userNamesList}`}
                        >
                          <span>{r.emoji}</span>
                          <span>{r.users.length}</span>
                        </button>

                        {/* Tooltip showing names to prevent inappropriate reactions */}
                        <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-30 w-56 p-2 rounded-xl bg-slate-900 text-white text-[10px] shadow-xl pointer-events-none animate-in fade-in">
                          <div className="font-bold border-b border-slate-800 pb-1 mb-1 text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Reaksi {r.emoji} ({r.users.length}):</span>
                          </div>
                          <div className="leading-tight">{userNamesList}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Reaction Picker Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveReactionPickerPostId(
                          activeReactionPickerPostId === post.id ? null : post.id
                        )
                      }
                      className="px-2.5 py-1 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Tambah Reaksi Emoji"
                    >
                      <Smile className="w-3.5 h-3.5" />
                      <span>+ Reaksi</span>
                    </button>

                    {activeReactionPickerPostId === post.id && (
                      <div className="absolute left-0 mt-1.5 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 z-40 animate-in fade-in zoom-in-95">
                        {EMOJI_OPTIONS.map((opt) => (
                          <button
                            key={opt.emoji}
                            type="button"
                            onClick={() => handleReact(post.id, opt.emoji)}
                            className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-base transition-transform hover:scale-110 cursor-pointer"
                            title={opt.label}
                          >
                            {opt.emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reply Counter / Toggle */}
                  <button
                    onClick={() =>
                      setActiveReplyPostId(activeReplyPostId === post.id ? null : post.id)
                    }
                    className="ml-auto flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments?.length || post.replies?.length || 0} Balasan</span>
                  </button>
                </div>

                {/* Threaded Replies List */}
                {((post.comments && post.comments.length > 0) || (post.replies && post.replies.length > 0)) && (
                  <div className="mt-3 pl-4 border-l-2 border-indigo-100 dark:border-slate-800 space-y-2.5 pt-2">
                    {(post.comments || post.replies || []).map((reply) => {
                      const isReplyLec = reply.authorRole === 'lecturer';
                      const replySetDisplay = isReplyLec
                        ? 'Pensyarah'
                        : reply.authorSet || (reply.setNumber ? `Set ${reply.setNumber}` : (user.role === 'student' ? `Set ${user.setNumber || 3}` : 'Pelajar'));
                      const isMyReply = reply.authorEmail && user.email.toLowerCase() === reply.authorEmail.toLowerCase();
                      const canDeleteReply = isMyReply || user.role === 'lecturer';
                      const isEditingThisReply = editingReplyInfo?.postId === post.id && editingReplyInfo?.replyId === reply.id;

                      return (
                        <div
                          key={reply.id}
                          className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl text-xs space-y-2 border border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">{reply.authorName}</span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                                  isReplyLec
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                }`}
                              >
                                {replySetDisplay}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {new Date(reply.createdAt).toLocaleDateString('ms-MY')} {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>

                              {/* Edit / Delete Reply Buttons */}
                              {canDeleteReply && (
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-700/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                                  {isMyReply && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isEditingThisReply) {
                                          setEditingReplyInfo(null);
                                        } else {
                                          setEditingReplyInfo({
                                            postId: post.id,
                                            replyId: reply.id,
                                            text: reply.content,
                                          });
                                        }
                                      }}
                                      className="p-1 rounded text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                      title="Edit Balasan"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReply(post.id, reply.id)}
                                    className="p-1 rounded text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                    title={isMyReply ? "Padam Balasan" : "Padam Balasan (Pensyarah)"}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Editing Box or Display Content */}
                          {isEditingThisReply ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                rows={2}
                                value={editingReplyInfo.text}
                                onChange={(e) =>
                                  setEditingReplyInfo({ ...editingReplyInfo, text: e.target.value })
                                }
                                className="w-full p-2 text-xs rounded-xl border border-indigo-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                              />
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingReplyInfo(null)}
                                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditReply(post.id, reply.id)}
                                  className="px-2.5 py-1 text-[11px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-line">{reply.content}</p>
                          )}

                          {reply.imageUrl && (
                            <div className="mt-2">
                              <img
                                src={reply.imageUrl}
                                alt="Imej Balasan"
                                className="max-h-48 rounded-lg border border-slate-200 dark:border-slate-700 object-cover"
                              />
                            </div>
                          )}

                          {reply.fileName && !reply.imageUrl && (
                            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>{reply.fileName}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply Input Box */}
                {activeReplyPostId === post.id && (
                  <div className="pt-2 space-y-2">
                    {replyFile && (
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          {replyFile.name} ({replyFile.size})
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyFile(null)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`${dict.replyPlaceholder || 'Tulis jawapan atau komen'} (dari ${user.name} - ${user.role === 'student' ? `Set ${user.setNumber}` : 'Pensyarah'})...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendReply(post.id);
                        }}
                        className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />

                      <label
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors"
                        title="Muat naik fail / imej"
                      >
                        <Paperclip className="w-4 h-4" />
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFilePicked(e, true)}
                        />
                      </label>

                      <button
                        onClick={() => handleSendReply(post.id)}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Hantar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Create Discussion Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{dict.startDiscussionBtn}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pengarang: <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span> ({user.role === 'student' ? `Set ${user.setNumber}` : 'Pensyarah'})
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.discussionTitleLabel || 'Tajuk Perbincangan'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Perbincangan Ulangkaji Kimia Larutan Penampan Set 3"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.tagsLabel || 'Tag Subjek / Topik'}
                </label>
                <input
                  type="text"
                  placeholder="Chemistry, StudyTips, Set3"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.discussionContentLabel || 'Kandungan / Soalan'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Kongsi persoalan akademik, tips belajar, nota atau pengumuman..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Upload Image / Document File */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lampiran Imej atau Fail (Pilihan):
                </label>
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-center bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
                  <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Klik untuk muat naik gambar / fail dokumen
                  </span>
                  <span className="text-[10px] text-slate-400">Menyokong gambar PNG/JPG atau fail PDF</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFilePicked(e, false)}
                  />
                </label>

                {attachedFile && (
                  <div className="mt-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 truncate">
                      <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                      {attachedFile.name} ({attachedFile.size})
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {dict.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Menerbitkan...' : dict.publishThreadBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Discussion Modal (Author Only) */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Topik Perbincangan</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kemas kini tajuk dan kandungan topik anda
                </p>
              </div>
              <button
                onClick={() => setEditingPost(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPost} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tajuk Perbincangan:
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kandungan:
                </label>
                <textarea
                  rows={4}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isEditing ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
