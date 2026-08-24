'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Users, Search, ChevronLeft, ChevronRight, Shield, BookOpen, Swords, RefreshCw, Ban, CheckCircle, GraduationCap } from 'lucide-react';

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string | null;
  is_active: boolean | null;
  xp_total: number | null;
  level: number | null;
  created_at: string | null;
  last_login_at: string | null;
}

interface UsersResponse {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
}

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'student', label: 'Student' },
  { value: 'learning_admin', label: 'Learning Admin' },
  { value: 'arena_admin', label: 'Arena Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
];

const ROLE_BADGES: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number }> }> = {
  student: { label: 'Student', color: '#A9A8BE', icon: GraduationCap },
  learning_admin: { label: 'Learning Admin', color: '#4ECDC4', icon: BookOpen },
  arena_admin: { label: 'Arena Admin', color: '#FF6B35', icon: Swords },
  super_admin: { label: 'Super Admin', color: '#E873C3', icon: Shield },
};

type ModalType = 'role' | 'ban' | 'unban' | null;

interface ModalState {
  type: ModalType;
  user: UserRow | null;
  newRole?: string;
}

export default function SuperAdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: null, user: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/super/users?${params}`);
      if (res.ok) setData(await res.json());
    } catch {  }
    finally { setLoading(false); }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);

    fetch(`/api/admin/super/users?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json) setData(json);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, search, roleFilter, statusFilter]);

  const openModal = (type: ModalType, user: UserRow, newRole?: string) => {
    setModal({ type, user, newRole });
    setActionError('');
    setActionSuccess('');
  };

  const closeModal = () => setModal({ type: null, user: null });

  const handleAction = async () => {
    if (!modal.user || !modal.type) return;
    setActionLoading(true);
    setActionError('');

    const body: Record<string, unknown> = { userId: modal.user.id, action: modal.type === 'role' ? 'set_role' : modal.type };
    if (modal.type === 'role') body.role = modal.newRole;

    try {
      const res = await fetch('/api/admin/super/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? 'Action failed');
      } else {
        setActionSuccess('Action completed successfully.');
        setTimeout(() => { closeModal(); fetchUsers(); }, 800);
      }
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Users size={20} className="text-[#E873C3]" />
              <h1 className="text-2xl font-black text-white">User Management</h1>
            </div>
            <p className="text-sm text-white/40">Search, filter, change roles, and ban/unban platform users.</p>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/70 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by username or email…"
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D95FD1] transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-[#D95FD1] transition-all cursor-pointer"
          >
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#0c0818]">{o.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-[#D95FD1] transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#0c0818]">{o.label}</option>)}
          </select>
        </div>

        {}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {['User', 'Role', 'Status', 'Level / XP', 'Joined', 'Last Login', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-white/30 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-white/[0.05] rounded animate-pulse" style={{ width: `${60 + (j * 10) % 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data?.users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-white/30 text-sm">
                      No users found matching your filters.
                    </td>
                  </tr>
                ) : (
                  data?.users.map((user) => {
                    const rb = ROLE_BADGES[user.role ?? 'student'] ?? ROLE_BADGES.student;
                    const RoleIcon = rb.icon;
                    return (
                      <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E873C3] to-[#8D37D6] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                              {user.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{user.username}</p>
                              <p className="text-[11px] text-white/40 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                            style={{ background: `${rb.color}18`, color: rb.color }}
                          >
                            <RoleIcon size={11} />
                            {rb.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${user.is_active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            {user.is_active ? <CheckCircle size={11} /> : <Ban size={11} />}
                            {user.is_active ? 'Active' : 'Banned'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-white/60">
                          Lv.{user.level} · {(user.xp_total ?? 0).toLocaleString()} XP
                        </td>
                        <td className="px-5 py-4 text-white/40 whitespace-nowrap">{formatDate(user.created_at)}</td>
                        <td className="px-5 py-4 text-white/40 whitespace-nowrap">{formatDate(user.last_login_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {}
                            <select
                              defaultValue=""
                              onChange={(e) => { if (e.target.value) { openModal('role', user, e.target.value); e.target.value = ''; } }}
                              className="px-2.5 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-xs text-white/70 focus:outline-none focus:border-[#D95FD1] transition-all cursor-pointer"
                            >
                              <option value="" className="bg-[#0c0818]">Set Role</option>
                              {['student', 'learning_admin', 'arena_admin', 'super_admin'].map((r) => (
                                <option key={r} value={r} className="bg-[#0c0818]">{r}</option>
                              ))}
                            </select>
                            {}
                            {user.is_active ? (
                              <button
                                onClick={() => openModal('ban', user)}
                                className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                              >
                                Ban
                              </button>
                            ) : (
                              <button
                                onClick={() => openModal('unban', user)}
                                className="px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-all cursor-pointer"
                              >
                                Unban
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.07]">
              <span className="text-xs text-white/40">
                Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total} users
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg bg-white/[0.05] text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-white/60 px-2">Page {page} of {data.totalPages}</span>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg bg-white/[0.05] text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {}
      {modal.type && modal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="bg-[#0c0818] border border-white/[0.12] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              {modal.type === 'role' ? `Set Role to "${modal.newRole}"` : modal.type === 'ban' ? 'Ban User' : 'Unban User'}
            </h3>
            <p className="text-sm text-white/50 mb-5">
              {modal.type === 'role'
                ? `Are you sure you want to change ${modal.user.username}'s role to "${modal.newRole}"?`
                : modal.type === 'ban'
                ? `This will suspend ${modal.user.username}'s access to the platform immediately.`
                : `This will restore ${modal.user.username}'s access to the platform.`}
            </p>

            {actionError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{actionError}</div>}
            {actionSuccess && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400">{actionSuccess}</div>}

            <div className="flex gap-3">
              <button onClick={closeModal} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/70 hover:text-white transition-all disabled:opacity-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 cursor-pointer ${
                  modal.type === 'ban' ? 'bg-red-600 hover:bg-red-500' : 'bg-gradient-to-r from-[#E873C3] to-[#8D37D6]'
                }`}
              >
                {actionLoading ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
