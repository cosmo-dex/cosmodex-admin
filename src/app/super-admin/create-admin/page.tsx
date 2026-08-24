'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'learning_admin', label: 'Learning Admin', desc: 'Manages courses, modules, topics, and exercises.' },
  { value: 'arena_admin', label: 'Battle Arena Admin', desc: 'Manages battle problems, ELO ratings, and match monitoring.' },
];

export default function CreateAdminPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'learning_admin' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/super/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to create admin');
      } else {
        setSuccess(`Admin account "${data.admin.username}" created successfully! Share the credentials securely.`);
        setForm({ username: '', email: '', password: '', role: 'learning_admin' });
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        {}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={20} className="text-[#4ECDC4]" />
            <h1 className="text-2xl font-black text-white">Create Admin Account</h1>
          </div>
          <p className="text-sm text-white/40">
            Provision a new Learning Admin or Battle Arena Admin account. You will need to share the login credentials with them directly.
          </p>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, role: opt.value }))}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                form.role === opt.value
                  ? 'bg-[#4ECDC4]/10 border-[#4ECDC4]/50 shadow-[0_0_20px_rgba(78,205,196,0.15)]'
                  : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.05]'
              }`}
            >
              <p className="font-bold text-sm text-white mb-1">{opt.label}</p>
              <p className="text-xs text-white/40 leading-relaxed">{opt.desc}</p>
              {form.role === opt.value && (
                <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#4ECDC4]">
                  <CheckCircle size={11} />
                  Selected
                </div>
              )}
            </button>
          ))}
        </div>

        {}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. learning_admin_alex"
                required
                disabled={loading}
                className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#4ECDC4] focus:shadow-[0_0_0_3px_rgba(78,205,196,0.12)] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
                disabled={loading}
                className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#4ECDC4] focus:shadow-[0_0_0_3px_rgba(78,205,196,0.12)] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Initial Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  disabled={loading}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#4ECDC4] focus:shadow-[0_0_0_3px_rgba(78,205,196,0.12)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-white/30">Share this password securely with the admin. They can change it after logging in.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                disabled={loading}
                className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4ECDC4] transition-all cursor-pointer"
              >
                {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#0c0818]">{o.label}</option>)}
              </select>
            </div>

            {error && <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>}
            {success && <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-400">{success}</div>}

            <button
              type="submit"
              disabled={loading}
              className="py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#4ECDC4] to-[#1A7A74] shadow-[0_0_20px_rgba(78,205,196,0.25)] hover:shadow-[0_0_30px_rgba(78,205,196,0.45)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Creating Account…' : 'Create Admin Account'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
