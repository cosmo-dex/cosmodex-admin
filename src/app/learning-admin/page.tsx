'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import {
  BookOpen,
  Layers,
  FileQuestion,
  Users,
  ChevronRight,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface LearningStats {
  totalLanguages: number;
  totalModules: number;
  totalTopics: number;
  totalQuestions: number;
  totalEnrollments: number;
  totalSubmissions: number;
  recentCompletions: number;
  activeLearners: number;
}

const MANAGEMENT_SECTIONS = [
  {
    label: 'Courses & Tracks',
    href: '/learning-admin/courses',
    icon: BookOpen,
    color: '#4ECDC4',
    desc: 'Manage language learning tracks, active statuses, and display orders.',
  },
  {
    label: 'Modules & Stations',
    href: '/learning-admin/modules',
    icon: Layers,
    color: '#8D37D6',
    desc: 'Configure curriculum stations, milestones, and skip tests per language.',
  },
  {
    label: 'Exercise Bank',
    href: '/learning-admin/questions',
    icon: FileQuestion,
    color: '#F5A623',
    desc: 'Manage code exercises, test cases, starter stubs, and JSON curriculum import.',
  },
];

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
    <div className="relative bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 overflow-hidden hover:border-white/[0.14] hover:-translate-y-0.5 transition-all duration-300">
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-xl pointer-events-none"
        style={{ background: glow }}
      />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: glow, border: `1px solid ${color}30` }}
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

export default function LearningAdminPage() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    fetch('/api/admin/learning/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const load = async () => {
      fetchStats();
    };
    void load();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={22} className="text-[#4ECDC4]" />
              <h1 className="text-2xl font-black text-white">Learning Platform Admin</h1>
            </div>
            <p className="text-sm text-white/40">
              Control center for programming languages, modules, stations, exercises, and learner progress.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Refresh stats"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              href="/learning-admin/courses"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4ECDC4] to-[#38BDF8] hover:opacity-95 text-white text-sm font-semibold transition-all shadow-lg shadow-[#4ECDC4]/20 cursor-pointer"
            >
              <Plus size={16} />
              Manage Courses
            </Link>
          </div>
        </div>

        {}
        <div>
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">
            Curriculum & Learner Overview
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Language Tracks"
                value={stats.totalLanguages}
                icon={BookOpen}
                color="#4ECDC4"
                glow="rgba(78,205,196,0.4)"
              />
              <StatCard
                label="Curriculum Modules"
                value={stats.totalModules}
                icon={Layers}
                color="#8D37D6"
                glow="rgba(141,55,214,0.4)"
              />
              <StatCard
                label="Total Exercises"
                value={stats.totalQuestions}
                icon={FileQuestion}
                color="#F5A623"
                glow="rgba(245,166,35,0.4)"
              />
              <StatCard
                label="Enrolled Learners"
                value={stats.activeLearners}
                icon={Users}
                color="#3DCB7F"
                glow="rgba(61,203,127,0.4)"
              />
            </div>
          ) : null}
        </div>

        {}
        <div>
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">
            Curriculum Management Hub
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MANAGEMENT_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.label}
                  href={section.href}
                  className="relative group bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15] hover:-translate-y-1 shadow-xl flex flex-col justify-between cursor-pointer"
                >
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-15 blur-2xl transition-opacity pointer-events-none"
                    style={{ background: section.color }}
                  />

                  <div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `${section.color}20`, border: `1px solid ${section.color}40` }}
                    >
                      <Icon size={22} style={{ color: section.color }} />
                    </div>
                    <h3 className="font-bold text-white text-base mb-1.5">{section.label}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{section.desc}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold" style={{ color: section.color }}>
                    <span>Open Manager</span>
                    <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-bold text-white text-sm">Account Security</p>
            <p className="text-xs text-white/40 mt-0.5">Manage your Learning Admin credentials.</p>
          </div>
          <Link
            href="/learning-admin/change-password"
            className="px-4 py-2 rounded-xl text-sm font-bold text-[#4ECDC4] bg-[#4ECDC4]/10 border border-[#4ECDC4]/30 hover:bg-[#4ECDC4]/20 transition-all cursor-pointer"
          >
            Change Password
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
