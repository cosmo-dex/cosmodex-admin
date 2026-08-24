'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Bell,
  Plus,
  Search,
  Trash2,
  Pencil,
  Clock,
  ExternalLink,
  Users,
  Megaphone,
  AlertTriangle,
  Flame,
  Swords,
  Info,
  Check,
  X,
  Radio,
  Eye,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  link: string | null;
  target_type: string | null;
  target_role: string | null;
  target_user_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  creator?: { id: string; username: string; email: string } | null;
  target_user?: { id: string; username: string; email: string } | null;
  _count?: { user_notification_states: number };
}

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
    color: string;
    bg: string;
    border: string;
  }
> = {
  info: {
    label: 'Info',
    icon: Info,
    color: '#4ECDC4',
    bg: 'rgba(78, 205, 196, 0.1)',
    border: 'rgba(78, 205, 196, 0.3)',
  },
  announcement: {
    label: 'Announcement',
    icon: Megaphone,
    color: '#E873C3',
    bg: 'rgba(232, 115, 195, 0.12)',
    border: 'rgba(232, 115, 195, 0.35)',
  },
  warning: {
    label: 'Alert / Warning',
    icon: AlertTriangle,
    color: '#F5A623',
    bg: 'rgba(245, 166, 35, 0.12)',
    border: 'rgba(245, 166, 35, 0.35)',
  },
  event: {
    label: 'Event',
    icon: Flame,
    color: '#D95FD1',
    bg: 'rgba(217, 95, 209, 0.12)',
    border: 'rgba(217, 95, 209, 0.35)',
  },
  battle: {
    label: 'Battle Arena',
    icon: Swords,
    color: '#FF6B35',
    bg: 'rgba(255, 107, 53, 0.12)',
    border: 'rgba(255, 107, 53, 0.35)',
  },
  system: {
    label: 'System Update',
    icon: Radio,
    color: '#8D37D6',
    bg: 'rgba(141, 55, 214, 0.12)',
    border: 'rgba(141, 55, 214, 0.35)',
  },
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SuperAdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('announcement');
  const [formLink, setFormLink] = useState('');
  const [formTargetType, setFormTargetType] = useState<'all' | 'role' | 'user'>('all');
  const [formTargetRole, setFormTargetRole] = useState('student');
  const [formTargetUserId, setFormTargetUserId] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchNotifications = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (targetFilter) params.set('target', targetFilter);

      try {
        const res = await fetch(`/api/admin/super/notifications?${params}`);
        const data = await res.json();
        if (data && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch {
        console.error('Failed to load notifications');
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [page, search, typeFilter, targetFilter]
  );

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    if (targetFilter) params.set('target', targetFilter);

    fetch(`/api/admin/super/notifications?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        }
      })
      .catch((err) => {
        console.error('Failed to load notifications', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, search, typeFilter, targetFilter]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/notifications/stream');
      eventSource.addEventListener('notification', () => {
        void fetchNotifications();
      });
    } catch (e) {
      console.warn('Realtime admin notification listener init failed', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchNotifications]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormType('announcement');
    setFormLink('');
    setFormTargetType('all');
    setFormTargetRole('student');
    setFormTargetUserId('');
    setFormIsActive(true);
    setFeedbackMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: NotificationItem) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormType(item.type || 'info');
    setFormLink(item.link || '');
    setFormTargetType((item.target_type as 'all' | 'role' | 'user') || 'all');
    setFormTargetRole(item.target_role || 'student');
    setFormTargetUserId(item.target_user_id || '');
    setFormIsActive(item.is_active ?? true);
    setFeedbackMsg(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Title is required' });
      return;
    }

    setFormSubmitting(true);
    setFeedbackMsg(null);

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      type: formType,
      link: formLink.trim() || null,
      target_type: formTargetType,
      target_role: formTargetType === 'role' ? formTargetRole : null,
      target_user_id: formTargetType === 'user' ? formTargetUserId.trim() || null : null,
      is_active: formIsActive,
    };

    try {
      const url =
        modalMode === 'create'
          ? '/api/admin/super/notifications'
          : `/api/admin/super/notifications/${editingId}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedbackMsg({ type: 'error', text: data.error || 'Operation failed' });
        return;
      }

      setIsModalOpen(false);
      if (modalMode === 'create') {
        setPage(1);
        setSearch('');
        setTypeFilter('');
        setTargetFilter('');
      }
      void fetchNotifications();
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/super/notifications/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchNotifications();
      }
    } catch {
      console.error('Delete failed');
    }
  };

  const handleToggleActive = async (item: NotificationItem) => {
    try {
      const res = await fetch(`/api/admin/super/notifications/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch {
      console.error('Toggle status failed');
    }
  };

  const activeCount = notifications.filter((n) => n.is_active).length;
  const broadcastCount = notifications.filter((n) => n.target_type === 'all').length;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[#E873C3]/15 border border-[#E873C3]/30 flex items-center justify-center">
                <Bell size={18} className="text-[#E873C3]" />
              </div>
              <h1 className="text-2xl font-black text-white">Notifications Hub</h1>
            </div>
            <p className="text-sm text-white/50">
              Broadcast platform announcements, system updates, and send realtime alerts to users.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#E873C3] via-[#D95FD1] to-[#8D37D6] shadow-[0_0_20px_rgba(232,115,195,0.35)] hover:shadow-[0_0_30px_rgba(232,115,195,0.55)] hover:brightness-110 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Notification</span>
          </button>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#E873C3]/15 border border-[#E873C3]/30 flex items-center justify-center shrink-0">
              <Bell size={20} className="text-[#E873C3]" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{total}</div>
              <div className="text-xs text-white/40 font-medium">Total Notifications</div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#3DCB7F]/15 border border-[#3DCB7F]/30 flex items-center justify-center shrink-0">
              <Check size={20} className="text-[#3DCB7F]" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{activeCount}</div>
              <div className="text-xs text-white/40 font-medium">Active (Broadcasting)</div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#8D37D6]/15 border border-[#8D37D6]/30 flex items-center justify-center shrink-0">
              <Users size={20} className="text-[#8D37D6]" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{broadcastCount}</div>
              <div className="text-xs text-white/40 font-medium">Global Broadcasts</div>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search notifications by title or message..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#120824] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#E873C3]/50 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="announcement">Announcement</option>
              <option value="event">Event</option>
              <option value="battle">Battle Arena</option>
              <option value="info">Info</option>
              <option value="warning">Warning / Alert</option>
              <option value="system">System Update</option>
            </select>

            <select
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#120824] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#E873C3]/50 cursor-pointer"
            >
              <option value="">All Audiences</option>
              <option value="all">Global (All Users)</option>
              <option value="role">By Role</option>
              <option value="user">Specific User</option>
            </select>
          </div>
        </div>

        {}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-white/40">
              <div className="w-8 h-8 rounded-full border-2 border-[#E873C3] border-t-transparent animate-spin" />
              <p className="text-xs font-semibold">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <Bell size={24} className="text-white/30" />
              </div>
              <h3 className="text-base font-bold text-white/80">No Notifications Found</h3>
              <p className="text-xs text-white/40 max-w-sm">
                No notifications match your current filter. Create a new notification to broadcast to users.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-2 text-xs font-bold text-[#E873C3] hover:underline cursor-pointer"
              >
                + Create first notification
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {notifications.map((item) => {
                const config = TYPE_CONFIG[item.type || 'info'] || TYPE_CONFIG.info;
                const Icon = config.icon;

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5"
                        style={{ background: config.bg, borderColor: config.border }}
                      >
                        <Icon size={18} style={{ color: config.color }} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                            style={{
                              color: config.color,
                              background: config.bg,
                              borderColor: config.border,
                            }}
                          >
                            {config.label}
                          </span>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60">
                            {item.target_type === 'all'
                              ? '🌐 All Users'
                              : item.target_type === 'role'
                              ? `🛡️ Role: ${item.target_role}`
                              : `👤 User: ${item.target_user?.username || item.target_user_id}`}
                          </span>

                          {!item.is_active && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                              Inactive
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>

                        {item.description && (
                          <p className="mt-1 text-xs text-white/50 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/35">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatRelativeTime(item.created_at)}
                          </span>

                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[#4ECDC4] hover:underline"
                            >
                              <ExternalLink size={11} />
                              {item.link}
                            </a>
                          )}

                          {item.creator && (
                            <span>By: {item.creator.username}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          item.is_active
                            ? 'bg-[#3DCB7F]/10 border-[#3DCB7F]/30 text-[#3DCB7F] hover:bg-[#3DCB7F]/20'
                            : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08]'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Disabled'}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        title="Edit notification"
                        className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:border-[#E873C3]/40 hover:bg-[#E873C3]/10 transition-colors cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item.id)}
                        title="Delete notification"
                        className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/50">
              <div>
                Page {page} of {totalPages} ({total} total)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 disabled:opacity-30 hover:bg-white/[0.08] text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 disabled:opacity-30 hover:bg-white/[0.08] text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0d071a] border border-white/15 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(232,115,195,0.15)] flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">
            {}
            <div className="px-5 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0d071a]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E873C3]/15 border border-[#E873C3]/30 flex items-center justify-center">
                  <Bell size={16} className="text-[#E873C3]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                    {modalMode === 'create' ? 'Create New Notification' : 'Edit Notification'}
                  </h2>
                  <p className="text-[10px] text-white/40">
                    {modalMode === 'create'
                      ? 'Dispatch global broadcasts or targeted role/user alerts'
                      : 'Update notification content and delivery properties'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {}
            <form onSubmit={handleFormSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 flex flex-col gap-3.5 [scrollbar-width:thin] [scrollbar-color:rgba(232,115,195,0.35)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#E873C3]/35 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#E873C3]/60 [&::-webkit-scrollbar-track]:bg-transparent">
                {feedbackMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold shrink-0 ${
                      feedbackMsg.type === 'error'
                        ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                        : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {feedbackMsg.text}
                  </div>
                )}

                {}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                    Title <span className="text-[#E873C3]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Cosmic Battle Season Started!"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]/60 transition-all"
                  />
                </div>

                {}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                    Description / Message
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Join the arena today to climb the leaderboard and unlock exclusive badges."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]/60 transition-all resize-none"
                  />
                </div>

                {}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                    Category / Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      const isSelected = formType === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormType(key)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white/[0.08] shadow-[0_0_12px_rgba(232,115,195,0.25)]'
                              : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.04]'
                          }`}
                          style={{
                            borderColor: isSelected ? cfg.color : undefined,
                            color: isSelected ? '#ffffff' : undefined,
                          }}
                        >
                          <Icon size={13} style={{ color: cfg.color }} />
                          <span className="truncate">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                      Target Audience
                    </label>
                    <select
                      value={formTargetType}
                      onChange={(e) => setFormTargetType(e.target.value as 'all' | 'role' | 'user')}
                      className="bg-[#180d2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E873C3]/60 cursor-pointer"
                    >
                      <option value="all">All Users (Global Broadcast)</option>
                      <option value="role">By User Role</option>
                      <option value="user">Specific User by ID</option>
                    </select>
                  </div>

                  {formTargetType === 'role' ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                        Role
                      </label>
                      <select
                        value={formTargetRole}
                        onChange={(e) => setFormTargetRole(e.target.value)}
                        className="bg-[#180d2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E873C3]/60 cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="arena_admin">Arena Admin</option>
                        <option value="learning_admin">Learning Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  ) : formTargetType === 'user' ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                        Target User UUID
                      </label>
                      <input
                        type="text"
                        placeholder="UUID (e.g. 550e8400-...)"
                        value={formTargetUserId}
                        onChange={(e) => setFormTargetUserId(e.target.value)}
                        className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]/60"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                        Action Link / URL <span className="text-white/30 font-normal lowercase">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /events or /learn/python"
                        value={formLink}
                        onChange={(e) => setFormLink(e.target.value)}
                        className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]/60 transition-all"
                      />
                    </div>
                  )}
                </div>

                {}
                {formTargetType !== 'all' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                      Action Link / URL <span className="text-white/30 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /events or /learn/python or https://..."
                      value={formLink}
                      onChange={(e) => setFormLink(e.target.value)}
                      className="bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]/60 transition-all"
                    />
                  </div>
                )}

                {}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  {}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="pr-2">
                      <div className="text-xs font-bold text-white">Broadcast Immediately</div>
                      <div className="text-[10px] text-white/40 leading-snug">
                        Visible in users’ notification hub in realtime.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormIsActive(!formIsActive)}
                      className={`w-11 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        formIsActive ? 'bg-[#E873C3]' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-[3px] ${
                          formIsActive ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                      <Eye size={11} />
                      <span>Live Dropdown Preview</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#09090d] border border-white/10 flex gap-2 items-start">
                      <div className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-[#E873C3] shadow-[0_0_8px_rgba(232,115,195,0.7)]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-[11px] font-bold text-white truncate">
                            {formTitle || 'Notification Title Preview'}
                          </h4>
                          <span className="text-[7px] font-bold uppercase tracking-wider text-[#E873C3] shrink-0">
                            New
                          </span>
                        </div>
                        {formDescription && (
                          <p className="mt-0.5 text-[10px] text-white/40 leading-tight line-clamp-1">
                            {formDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {}
              <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-white/10 bg-[#090412]/95 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#E873C3] via-[#D95FD1] to-[#8D37D6] shadow-[0_0_20px_rgba(232,115,195,0.35)] hover:shadow-[0_0_30px_rgba(232,115,195,0.55)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : modalMode === 'create'
                    ? 'Broadcast Notification'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e071c] border border-red-500/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Delete Notification?</h3>
              <p className="mt-1 text-xs text-white/50 leading-relaxed">
                This will permanently delete this notification and remove it from all users’ notifications hub in realtime.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
              >
                Delete Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
