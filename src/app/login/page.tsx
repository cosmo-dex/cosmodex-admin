'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  BookOpen,
  Swords,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

const ADMIN_ROLES = [
  {
    key: 'super_admin',
    label: 'Super Admin',
    desc: 'Platform management, users, blogs, events, and notifications',
    icon: Shield,
    color: '#E873C3',
    glow: 'rgba(232,115,195,0.25)',
    borderHover: 'hover:border-[#E873C3]/60',
    dest: '/super-admin',
  },
  {
    key: 'learning_admin',
    label: 'Learning Admin',
    desc: 'Curriculum tracks, modules, coding exercises, and lessons',
    icon: BookOpen,
    color: '#4ECDC4',
    glow: 'rgba(78,205,196,0.25)',
    borderHover: 'hover:border-[#4ECDC4]/60',
    dest: '/learning-admin',
  },
  {
    key: 'arena_admin',
    label: 'Battle Arena Admin',
    desc: 'Coding arena challenges, MCQs, match monitoring, and ELO',
    icon: Swords,
    color: '#FF6B35',
    glow: 'rgba(255,107,53,0.25)',
    borderHover: 'hover:border-[#FF6B35]/60',
    dest: '/arena-admin',
  },
];

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [selectedRole, setSelectedRole] = useState(ADMIN_ROLES[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed. Check your credentials.');
        setLoading(false);
        return;
      }

      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        const dest =
          data.user?.role === 'super_admin'
            ? '/super-admin'
            : data.user?.role === 'learning_admin'
            ? '/learning-admin'
            : '/arena-admin';
        router.push(dest);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const SelectedIcon = selectedRole.icon;

  return (
    <div className="min-h-screen bg-[#06020f] relative overflow-hidden flex flex-col items-center justify-center p-4 selection:bg-[#E873C3]/30">
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 opacity-20"
        style={{ background: selectedRole.color }}
      />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#8D37D6]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] mb-4 text-xs font-semibold text-white/70">
          <Sparkles size={13} className="text-[#E873C3]" />
          <span>CosmoDex Mission Control</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Admin Portal Access
        </h1>
        <p className="text-white/40 text-sm mt-1.5 max-w-md mx-auto">
          Select your administrative division and sign in to manage operations.
        </p>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
          {ADMIN_ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole.key === role.key;
            return (
              <button
                key={role.key}
                type="button"
                onClick={() => {
                  setSelectedRole(role);
                  setError('');
                }}
                className={`text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-white/[0.08] border-white/30 shadow-lg'
                    : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05] hover:border-white/20'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: role.color + '70',
                        boxShadow: `0 0 25px ${role.glow}`,
                      }
                    : {}
                }
              >
                {isSelected && (
                  <div
                    className="absolute top-0 right-0 w-16 h-16 rounded-bl-full pointer-events-none opacity-20"
                    style={{ background: role.color }}
                  />
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105"
                  style={{
                    background: `${role.glow}`,
                    border: `1px solid ${role.color}40`,
                  }}
                >
                  <Icon size={20} style={{ color: role.color }} />
                </div>
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  {role.label}
                  {isSelected && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: role.color }}
                    />
                  )}
                </h3>
                <p className="text-white/40 text-xs mt-1 leading-relaxed line-clamp-2">
                  {role.desc}
                </p>
              </button>
            );
          })}
        </div>

        <div className="bg-[#0c0818]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-1 transition-all duration-500"
            style={{
              background: `linear-gradient(90deg, transparent, ${selectedRole.color}, transparent)`,
            }}
          />

          <div className="flex items-center gap-3 pb-6 border-b border-white/[0.07] mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: selectedRole.glow,
                border: `1px solid ${selectedRole.color}40`,
              }}
            >
              <SelectedIcon size={20} style={{ color: selectedRole.color }} />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">
                Sign in to {selectedRole.label}
              </h2>
              <p className="text-xs text-white/40">
                Authorized credentials required for division access
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-5 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cosmodex.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${selectedRole.color}, #8D37D6)`,
                boxShadow: `0 0 20px ${selectedRole.glow}`,
              }}
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Enter</span>
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06020f] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#E873C3] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
