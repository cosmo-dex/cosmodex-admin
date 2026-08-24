'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  X,
  Trash2,
  Pencil,
} from 'lucide-react';

interface Language {
  id: string;
  code: string;
  name: string;
  icon_url: string | null;
  display_order: number;
  is_active: boolean;
  _count?: {
    modules: number;
    enrollments: number;
  };
}

const EMPTY_FORM = {
  code: '',
  name: '',
  icon_url: '',
  display_order: 0,
  is_active: true,
};

export default function LearningCoursesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Language | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Language | null>(null);

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/learning/languages');
      if (res.ok) {
        const data = await res.json();
        setLanguages(data.languages || []);
      }
    } catch {
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchLanguages();
    };
    void load();
  }, [fetchLanguages]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setModal('create');
    setEditTarget(null);
  };

  const openEdit = (lang: Language) => {
    setForm({
      code: lang.code,
      name: lang.name,
      icon_url: lang.icon_url || '',
      display_order: lang.display_order,
      is_active: lang.is_active,
    });
    setFormError('');
    setModal('edit');
    setEditTarget(lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const url =
        modal === 'edit' && editTarget
          ? `/api/admin/learning/languages/${editTarget.id}`
          : '/api/admin/learning/languages';
      const method = modal === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || 'Failed to save course');
        return;
      }

      setModal(null);
      fetchLanguages();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/admin/learning/languages/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchLanguages();
    } catch {
      
    }
  };

  const filtered = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#4ECDC4]/10 text-[#4ECDC4] border border-[#4ECDC4]/20">
                <BookOpen size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Language Tracks & Courses</h1>
                <p className="text-sm text-white/50">Manage all programming learning tracks on Cosmodex.</p>
              </div>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4ECDC4] to-[#38BDF8] hover:opacity-95 text-white text-sm font-semibold transition-all shadow-lg shadow-[#4ECDC4]/20 cursor-pointer"
          >
            <Plus size={16} />
            Add Language Track
          </button>
        </div>

        {}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search language tracks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#4ECDC4]/50 transition-all"
            />
          </div>
          <button
            onClick={fetchLanguages}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {}
        <div className="bg-[#120D24]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="bg-white/5 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-6 py-4">Language Track</th>
                <th className="px-6 py-4">Identifier Code</th>
                <th className="px-6 py-4">Modules</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    <RefreshCw className="animate-spin inline mr-2" size={16} />
                    Loading courses...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    No language tracks found. Click &quot;Add Language Track&quot; to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((lang) => (
                  <tr key={lang.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[#4ECDC4] text-xs uppercase">
                          {lang.code.slice(0, 3)}
                        </div>
                        <div>
                          <div>{lang.name}</div>
                          <div className="text-xs text-white/40 font-normal">Order: #{lang.display_order}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[#38BDF8]">
                      <code>{lang.code}</code>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-bold text-white/80">{lang._count?.modules || 0}</span> modules
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          lang.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}
                      >
                        {lang.is_active ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(lang)}
                          className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all cursor-pointer"
                          title="Edit track"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(lang)}
                          className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all cursor-pointer"
                          title="Delete track"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {}
        {modal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#120D24] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-lg text-white">
                  {modal === 'edit' ? 'Edit Language Track' : 'Create Language Track'}
                </h3>
                <button onClick={() => setModal(null)} className="text-white/40 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-white/60">Language Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Python, TypeScript"
                    className="w-full mt-1.5 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#4ECDC4]/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-white/60">Code Slug *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toLowerCase() }))}
                    placeholder="e.g. python, cpp, javascript"
                    className="w-full mt-1.5 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#4ECDC4]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Display Order</label>
                    <input
                      type="number"
                      value={form.display_order}
                      onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))}
                      className="w-full mt-1.5 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Status</label>
                    <select
                      value={form.is_active ? 'true' : 'false'}
                      onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}
                      className="w-full mt-1.5 px-3.5 py-2 bg-[#1B1438] border border-white/10 rounded-xl text-sm text-white cursor-pointer"
                    >
                      <option value="true">Active</option>
                      <option value="false">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white/70 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 bg-[#4ECDC4] hover:bg-[#3dbdb4] rounded-xl text-sm font-bold text-black shadow-lg shadow-[#4ECDC4]/25 cursor-pointer disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : modal === 'edit' ? 'Save Changes' : 'Create Track'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#120D24] border border-white/15 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
              <div className="size-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Delete Track</h3>
                <p className="text-xs text-white/60 mt-1">
                  Are you sure you want to delete track <strong className="text-white">&quot;{deleteTarget.name}&quot;</strong>?
                  All associated modules and questions will be removed.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white/70 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
