'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import {
  Users,
  Swords,
  UserPlus,
  TrendingUp,
  Shield,
  Activity,
  Ban,
  ChevronRight,
  CalendarDays,
  Bell,
} from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  adminUsers: number;
  totalMatches: number;
  activeMatches: number;
  totalProblems: number;
  totalSubmissions: number;
  dailyActiveUsers: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  glow,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  glow: string;
}) {
  return (
    <div
      className="relative bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 overflow-hidden group hover:border-white/[0.14] hover:-translate-y-0.5 transition-all duration-300"
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-xl pointer-events-none"
        style={{ background: glow }}
      />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${glow}`, border: `1px solid ${color}30` }}
        >
          <Icon size={15} />
        </div>
      </div>
      <div className="text-3xl font-black text-white" style={{ textShadow: `0 0 20px ${glow}` }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  { label: 'Manage Users', desc: 'Search, role changes, ban/unban', href: '/super-admin/users', icon: Users, color: '#E873C3' },
  { label: 'Notifications', desc: 'Broadcast announcements & real-time alerts', href: '/super-admin/notifications', icon: Bell, color: '#E873C3' },
  { label: 'Events', desc: 'Create and manage hackathons, contests & more', href: '/super-admin/events', icon: CalendarDays, color: '#8D37D6' },
  { label: 'Create Admin', desc: 'Provision learning or arena admin accounts', href: '/super-admin/create-admin', icon: UserPlus, color: '#4ECDC4' },
];

export default function SuperAdminPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/super/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) setStats(data);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingStats(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Shield size={22} className="text-[#E873C3]" />
            <h1 className="text-2xl font-black text-white">Super Admin Overview</h1>
          </div>
          <p className="text-sm text-white/40">Full platform control and administrative management.</p>
        </div>

        {}
        <div>
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Platform Stats</h2>
          {loadingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="#E873C3" glow="rgba(232,115,195,0.4)" />
              <StatCard label="Active Users" value={stats.activeUsers} icon={Activity} color="#3DCB7F" glow="rgba(61,203,127,0.4)" />
              <StatCard label="Banned Users" value={stats.bannedUsers} icon={Ban} color="#E85D5D" glow="rgba(232,93,93,0.4)" />
              <StatCard label="Admin Accounts" value={stats.adminUsers} icon={Shield} color="#F5A623" glow="rgba(245,166,35,0.4)" />
              <StatCard label="Total Matches" value={stats.totalMatches} icon={Swords} color="#4ECDC4" glow="rgba(78,205,196,0.4)" />
              <StatCard label="Live Matches" value={stats.activeMatches} icon={TrendingUp} color="#8D37D6" glow="rgba(141,55,214,0.4)" />
              <StatCard label="Battle Problems" value={stats.totalProblems} icon={Swords} color="#FF6B35" glow="rgba(255,107,53,0.4)" />
              <StatCard label="DAU (24h)" value={stats.dailyActiveUsers} icon={Activity} color="#E873C3" glow="rgba(232,115,195,0.4)" />
            </div>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-sm text-red-400">
              Failed to load platform statistics.
            </div>
          )}
        </div>

        {}
        <div>
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex items-start gap-4 hover:bg-white/[0.06] hover:border-white/[0.14] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${link.color}20`, border: `1px solid ${link.color}40` }}
                  >
                    <Icon size={18} style={{ color: link.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm mb-1">{link.label}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{link.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors mt-1 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
