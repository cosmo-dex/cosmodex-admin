'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Shield,
  BookOpen,
  Swords,
  LayoutDashboard,
  Users,
  UserPlus,
  Key,
  LogOut,
  Menu,
  X,
  ChevronRight,
  CalendarDays,
  Bell,
  Layers,
  FileQuestion,
} from 'lucide-react';

interface AdminUser {
  userId: string;
  username: string;
  email: string;
  role: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  super_admin: [
    { label: 'Overview', href: '/super-admin', icon: LayoutDashboard },
    { label: 'User Management', href: '/super-admin/users', icon: Users },
    { label: 'Notifications', href: '/super-admin/notifications', icon: Bell },
    { label: 'Events', href: '/super-admin/events', icon: CalendarDays },
    { label: 'Create Admin', href: '/super-admin/create-admin', icon: UserPlus },
    { label: 'Change Password', href: '/super-admin/change-password', icon: Key },
  ],
  learning_admin: [
    { label: 'Overview', href: '/learning-admin', icon: LayoutDashboard },
    { label: 'Courses & Tracks', href: '/learning-admin/courses', icon: BookOpen },
    { label: 'Modules & Stations', href: '/learning-admin/modules', icon: Layers },
    { label: 'Exercise Bank', href: '/learning-admin/questions', icon: FileQuestion },
    { label: 'Change Password', href: '/learning-admin/change-password', icon: Key },
  ],
  arena_admin: [
    { label: 'Overview', href: '/arena-admin', icon: LayoutDashboard },
    { label: 'Battle Problems', href: '/arena-admin/problems', icon: Swords },
    { label: 'Change Password', href: '/arena-admin/change-password', icon: Key },
  ],
};

const ROLE_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; glow: string }> = {
  super_admin: {
    label: 'Super Admin',
    icon: Shield,
    color: '#E873C3',
    glow: 'rgba(232,115,195,0.3)',
  },
  learning_admin: {
    label: 'Learning Admin',
    icon: BookOpen,
    color: '#4ECDC4',
    glow: 'rgba(78,205,196,0.3)',
  },
  arena_admin: {
    label: 'Battle Arena Admin',
    icon: Swords,
    color: '#FF6B35',
    glow: 'rgba(255,107,53,0.3)',
  },
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.user && ['super_admin', 'learning_admin', 'arena_admin'].includes(data.user.role)) {
          setUser(data.user);
        } else {
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#06020f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#E873C3] border-t-transparent animate-spin" />
      </div>
    );
  }

  const navItems = NAV_BY_ROLE[user.role] ?? [];
  const roleMeta = ROLE_META[user.role] ?? ROLE_META.super_admin;
  const RoleIcon = roleMeta.icon;

  return (
    <div className="min-h-screen bg-[#06020f] flex text-white">
      {}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 flex flex-col bg-[#0c0818]/95 backdrop-blur-xl border-r border-white/[0.07] transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {}
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <Link href="/login" className="flex items-center gap-2.5 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${roleMeta.color}, #8D37D6)`, boxShadow: `0 0 16px ${roleMeta.glow}` }}
            >
              <RoleIcon size={16} />
            </div>
            <span className="font-black text-white text-base tracking-wide">CosmoDex Admin</span>
          </Link>

          {}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ background: `${roleMeta.glow}`, borderColor: roleMeta.color + '40' }}
          >
            <span style={{ color: roleMeta.color, display: 'flex' }}>
              <RoleIcon size={14} />
            </span>
            <span className="text-xs font-bold" style={{ color: roleMeta.color }}>
              {roleMeta.label}
            </span>
          </div>
        </div>

        {}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }`}
                style={isActive ? { background: `${roleMeta.glow}`, color: roleMeta.color } : {}}
              >
                <Icon size={16} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {}
        <div className="px-3 py-4 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] mb-2">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${roleMeta.glow} 0%, transparent 100%)`, border: `1px solid ${roleMeta.color}40` }}
            >
              <RoleIcon size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user.username}</p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 cursor-pointer"
          >
            <LogOut size={16} />
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {}
        <header className="sticky top-0 z-20 flex items-center gap-4 px-5 py-3.5 bg-[#06020f]/90 backdrop-blur-xl border-b border-white/[0.07] md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <span style={{ color: roleMeta.color, display: 'flex' }}>
              <RoleIcon size={16} />
            </span>
            <span className="font-bold text-sm" style={{ color: roleMeta.color }}>
              {roleMeta.label}
            </span>
          </div>
        </header>

        {}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
