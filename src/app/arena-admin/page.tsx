'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { Swords, ChevronRight, Code2, ListChecks } from 'lucide-react';

interface ArenaStats {
  totalProblems: number;
  totalMcq: number;
}

const QUICK_LINKS = [
  {
    label: 'Battle Problems & Challenges',
    desc: 'Create, edit, import JSON, and manage coding challenges & MCQ battle questions.',
    href: '/arena-admin/problems',
    icon: Swords,
    color: '#FF6B35',
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

export default function ArenaAdminPage() {
  const [stats, setStats] = useState<ArenaStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch('/api/admin/arena/problems?page=1'),
      fetch('/api/admin/arena/mcq?page=1'),
    ])
      .then(async ([problemsRes, mcqRes]) => {
        const problemsData = problemsRes.ok ? await problemsRes.json() : { total: 0 };
        const mcqData = mcqRes.ok ? await mcqRes.json() : { total: 0 };

        if (isMounted) {
          setStats({
            totalProblems: problemsData.total || 0,
            totalMcq: mcqData.total || 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Swords size={20} className="text-[#FF6B35]" />
            <h1 className="text-2xl font-black text-white">Battle Arena Admin</h1>
          </div>
          <p className="text-sm text-white/40">
            Create, edit, import JSON, and manage coding challenges & MCQ battle questions.
          </p>
        </div>

        {}
        <div>
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">
            Arena Overview
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                label="Coding Problems"
                value={stats.totalProblems}
                icon={Code2}
                color="#FF6B35"
                glow="rgba(255,107,53,0.4)"
              />
              <StatCard
                label="MCQ Questions"
                value={stats.totalMcq}
                icon={ListChecks}
                color="#E873C3"
                glow="rgba(232,115,195,0.4)"
              />
            </div>
          ) : null}
        </div>

        {}
        <div>
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">
            Management
          </h2>
          <div className="flex flex-col gap-3">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.06] hover:border-white/[0.14] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${link.color}20`, border: `1px solid ${link.color}40` }}
                  >
                    <Icon size={18} style={{ color: link.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm mb-1">{link.label}</p>
                    <p className="text-xs text-white/40">{link.desc}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
