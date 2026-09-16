import React, { useState } from 'react';
import { UserProfile, ForumPost } from '../types.ts';
import { dataService } from '../services/dataService.ts';
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
} from 'lucide-react';

interface CommunityViewProps {
  user: UserProfile;
  posts: ForumPost[];
  onRefreshData?: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  user,
  posts,
  onRefreshData,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('General, StudyTips');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply state: active post ID and reply text
  const [activeReplyPostId, setActiveReplyPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const tagsList = ['all', 'StudyTips', 'Chemistry', 'Physics', 'Biology', 'General', 'Schedule', 'Koko'];

  const filteredPosts = posts.filter((p) => {
    if (selectedTag !== 'all' && !p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
      return false;
    }
    return true;
  });

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
    });

    setIsSubmitting(false);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewContent('');
    if (onRefreshData) onRefreshData();
  };

  const handleLike = async (postId: string) => {
    await dataService.likePost(postId);
    if (onRefreshData) onRefreshData();
  };

  const handleSendReply = async (postId: string) => {
    if (!replyText.trim()) return;

    await dataService.addReplyToPost(postId, {
      authorName: user.name,
      authorEmail: user.email,
      authorRole: user.role,
      authorSet: user.role === 'student' ? `Set ${user.setNumber}` : user.department || 'Faculty',
      content: replyText.trim(),
    });

    setReplyText('');
    setActiveReplyPostId(null);
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60">
              Pre-U Community Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Verified Academic Discussions
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Academic Community & Peer Exchange
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Transparent, non-anonymous academic exchange between UKM students across 11 sets and faculty lecturers.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>New Discussion Thread</span>
        </button>
      </div>

      {/* Tags Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tagsList.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              selectedTag === tag
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tag === 'all' ? 'All Discussions' : `#${tag}`}
          </button>
        ))}
      </div>

      {/* Posts Stream */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const isLecturer = post.authorRole === 'lecturer';
          const postDate = new Date(post.createdAt);

          return (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5 hover:border-indigo-200 transition-all"
            >
              {/* Post Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isLecturer ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
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
                      <span className="text-xs font-bold text-slate-900">{post.authorName}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isLecturer
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isLecturer
                          ? `Faculty Lecturer • ${post.subjectCode || 'UKM'}`
                          : `Student • Set ${post.setNumber || '?'}`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {post.authorEmail} • {postDate.toLocaleDateString('en-GB')} {postDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {post.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Title & Body */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{post.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>

              {/* Action Buttons: Likes & Replies */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-4 text-xs font-semibold text-slate-500">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-rose-600 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  <span>{post.likes} Likes</span>
                </button>

                <button
                  onClick={() =>
                    setActiveReplyPostId(activeReplyPostId === post.id ? null : post.id)
                  }
                  className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.replies?.length || 0} Replies</span>
                </button>
              </div>

              {/* Threaded Replies List */}
              {post.replies && post.replies.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-slate-100 space-y-2 pt-2">
                  {post.replies.map((reply) => {
                    const isReplyLec = reply.authorRole === 'lecturer';
                    return (
                      <div
                        key={reply.id}
                        className="bg-slate-50 p-3 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{reply.authorName}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                isReplyLec
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isReplyLec ? 'Faculty Lecturer' : `Set ${reply.setNumber || '?'}`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(reply.createdAt).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed">{reply.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reply Input Box */}
              {activeReplyPostId === post.id && (
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Reply as ${user.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleSendReply(post.id)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Discussion Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Start a Discussion</h2>
                <p className="text-xs text-slate-500">
                  Author: <span className="font-semibold">{user.name}</span> ({user.role})
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discussion Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Set 3 Study Group for Biology Midterms"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Biology, StudyTips, Set3"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Content
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share your academic question, discussion point, or announcement..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
