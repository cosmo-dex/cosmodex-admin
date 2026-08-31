'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import {
  CalendarDays,
  Plus,
  Search,
  Trophy,
  Users,
  Zap,
  Trash2,
  ChevronRight,
  Clock,
  Globe,
  Pencil,
  Lock,
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  event_type: string;
  status: string;
  registration_open: boolean | null;
  max_participants: number | null;
  prize_pool: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  submission_config?: {
    private_access?: {
      is_private?: boolean;
      secret_id?: string;
    };
  } | null;
  _count: { event_registrations: number };
}

const STATUS_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  draft: { text: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)' },
  published: { text: '#3DCB7F', bg: 'rgba(61,203,127,0.1)', border: 'rgba(61,203,127,0.3)' },
  ongoing: { text: '#E873C3', bg: 'rgba(232,115,195,0.1)', border: 'rgba(232,115,195,0.3)' },
  ended: { text: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)' },
  archived: { text: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' },
};

const TYPE_LABELS: Record<string, string> = {
  hackathon: '🚀 Hackathon',
  coding_contest: '⌨️ Coding Contest',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SuperAdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const res = await fetch(`/api/admin/super/events?${params}`);
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    void (async () => {
      await fetchEvents();
    })();
  }, [fetchEvents]);

  const handleStatusChange = async (id: string, status: string, extraData: Record<string, unknown> = {}) => {
    setActionLoading(id + status);
    await fetch(`/api/admin/super/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extraData }),
    });
    setActionLoading(null);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id + 'delete');
    try {
      await fetch(`/api/admin/super/events/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchEvents();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <CalendarDays size={24} className="text-[#E873C3]" /> Events Management
            </h1>
            <p className="text-sm text-white/50 mt-1">Manage hackathons, coding contests, and events</p>
          </div>
          <Link
            href="/super-admin/events/create"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black bg-[#E873C3] hover:bg-[#E873C3]/90 transition-all shadow-[0_0_20px_rgba(232,115,195,0.3)] hover:shadow-[0_0_25px_rgba(232,115,195,0.5)] shrink-0 cursor-pointer"
          >
            <Plus size={16} /> Create Event
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <CalendarDays size={18} className="text-purple-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{total}</div>
              <div className="text-xs text-white/40">Total Events</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
              <Zap size={18} className="text-pink-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{events.filter(e => e.status === 'ongoing').length}</div>
              <div className="text-xs text-white/40">Live Events</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Globe size={18} className="text-green-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{events.filter(e => e.status === 'published').length}</div>
              <div className="text-xs text-white/40">Published</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Users size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">
                {events.reduce((acc, e) => acc + (e._count?.event_registrations ?? 0), 0)}
              </div>
              <div className="text-xs text-white/40">Total Registrations</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search events..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-[#0e0a1c] border border-white/[0.12] rounded-xl text-sm text-white focus:outline-none focus:border-[#E873C3] [color-scheme:dark] cursor-pointer"
          >
            <option value="" className="bg-[#0c0818] text-white">All Statuses</option>
            <option value="draft" className="bg-[#0c0818] text-white">Draft</option>
            <option value="published" className="bg-[#0c0818] text-white">Published</option>
            <option value="ongoing" className="bg-[#0c0818] text-white">Ongoing</option>
            <option value="ended" className="bg-[#0c0818] text-white">Ended</option>
            <option value="archived" className="bg-[#0c0818] text-white">Archived</option>
          </select>
        </div>

        {/* Events Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <CalendarDays size={40} className="text-white/10" />
              <p className="text-white/30 text-sm font-medium">No events found</p>
              <Link href="/super-admin/events/create" className="text-[#E873C3] text-sm font-bold hover:underline">
                Create your first event →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {events.map((event) => {
                const sc = STATUS_COLORS[event.status] ?? STATUS_COLORS.draft;
                const isPrivate = Boolean(event.submission_config?.private_access?.is_private);
                return (
                  <div key={event.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">{event.title}</span>
                        {isPrivate && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                            <Lock size={10} /> Private
                          </span>
                        )}
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}
                        >
                          {event.status}
                        </span>
                        <span className="text-[11px] text-white/40">{TYPE_LABELS[event.event_type] ?? event.event_type}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap">
                        <span className="flex items-center gap-1"><Users size={11} />{event._count.event_registrations} registrations</span>
                        <span className="flex items-center gap-1"><Clock size={11} />Starts {formatDate(event.starts_at)}</span>
                        {event.prize_pool && <span className="flex items-center gap-1"><Trophy size={11} />{event.prize_pool}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <select
                        value={event.status}
                        onChange={(e) => handleStatusChange(event.id, e.target.value)}
                        disabled={actionLoading === event.id + event.status}
                        className="bg-[#0e0a1c] text-white border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#E873C3] cursor-pointer"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="ongoing">Ongoing (LIVE)</option>
                        <option value="ended">Ended</option>
                        <option value="archived">Archived</option>
                      </select>

                      <Link
                        href={`/super-admin/events/${event.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.12] transition-all cursor-pointer"
                      >
                        <Pencil size={12} /> Manage
                        <ChevronRight size={12} />
                      </Link>

                      {deleteConfirm === event.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(event.id)}
                            disabled={actionLoading === event.id + 'delete'}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1.5 rounded-lg text-xs text-white/50 hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(event.id)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-white/40">
            <div>Page {page} of {totalPages} ({total} events)</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white disabled:opacity-30 hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white disabled:opacity-30 hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
