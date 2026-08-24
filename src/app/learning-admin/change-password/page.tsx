'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Key, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LearningAdminChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match.'); return; }
    if (form.newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/super/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to change password'); }
      else { setSuccess('Password changed successfully.'); setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <AdminLayout>
      <div className="max-w-lg mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Key size={20} className="text-[#4ECDC4]" />
            <h1 className="text-2xl font-black text-white">Change Password</h1>
          </div>
          <p className="text-sm text-white/40">Update your Learning Admin account password.</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Current Password</label>
              <div className="relative">
                <input name="currentPassword" type={showCurrent ? 'text' : 'password'} value={form.currentPassword} onChange={handleChange} placeholder="Your current password" required disabled={loading}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#4ECDC4] focus:shadow-[0_0_0_3px_rgba(78,205,196,0.12)] transition-all" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors cursor-pointer">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <input name="newPassword" type={showNew ? 'text' : 'password'} value={form.newPassword} onChange={handleChange} placeholder="At least 8 characters" required minLength={8} disabled={loading}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#4ECDC4] focus:shadow-[0_0_0_3px_rgba(78,205,196,0.12)] transition-all" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors cursor-pointer">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Confirm New Password</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat new password" required disabled={loading}
                className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#4ECDC4] focus:shadow-[0_0_0_3px_rgba(78,205,196,0.12)] transition-all" />
            </div>

            {error && <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>}
            {success && <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-sm text-green-400"><ShieldCheck size={16} />{success}</div>}

            <button type="submit" disabled={loading} className="py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#4ECDC4] to-[#1A7A74] shadow-[0_0_20px_rgba(78,205,196,0.2)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {loading ? 'Updating Password…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
