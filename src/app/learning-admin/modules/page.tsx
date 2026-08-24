'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Layers,
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
}

interface ModuleItem {
  id: string;
  language_id: string;
  module_number: number;
  title: string;
  description: string | null;
  is_published: boolean;
  languages?: {
    name: string;
    code: string;
  };
  _count?: {
    questions: number;
    topics: number;
  };
}

const EMPTY_FORM = {
  language_id: '',
  module_number: 1,
  title: '',
  description: '',
  is_published: true,
};

export default function LearningModulesPage() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<ModuleItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ModuleItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [langRes, modRes] = await Promise.all([
        fetch('/api/admin/learning/languages'),
        fetch(
          selectedLanguage
            ? `/api/admin/learning/modules?languageId=${selectedLanguage}`
            : '/api/admin/learning/modules'
        ),
      ]);

      if (langRes.ok) {
        const langData = await langRes.json();
        setLanguages(langData.languages || []);
      }
      if (modRes.ok) {
        const modData = await modRes.json();
        setModules(modData.modules || []);
      }
    } catch {
      
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    void load();
  }, [fetchData]);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      language_id: selectedLanguage || (languages[0]?.id ?? ''),
      module_number: modules.length + 1,
    });
    setFormError('');
    setModal('create');
    setEditTarget(null);
  };

  const openEdit = (mod: ModuleItem) => {
    setForm({
      language_id: mod.language_id,
      module_number: mod.module_number,
      title: mod.title,
      description: mod.description || '',
      is_published: mod.is_published,
    });
    setFormError('');
    setModal('edit');
    setEditTarget(mod);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const url =
        modal === 'edit' && editTarget
          ? `/api/admin/learning/modules/${editTarget.id}`
          : '/api/admin/learning/modules';
      const method = modal === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || 'Failed to save module');
        return;
      }

      setModal(null);
      fetchData();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/admin/learning/modules/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchData();
    } catch {
      
    }
  };

  const filtered = modules.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.languages?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#8D37D6]/10 text-[#8D37D6] border border-[#8D37D6]/20">
                <Layers size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Modules & Galaxy Stations</h1>
                <p className="text-sm text-white/50">Manage curriculum stations, lessons, and chapter orders.</p>
              </div>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8D37D6] to-[#C453D6] hover:opacity-95 text-white text-sm font-semibold transition-all shadow-lg shadow-[#8D37D6]/20 cursor-pointer"
          >
            <Plus size={16} />
            Add Module
          </button>
        </div>

        {}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search modules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#8D37D6]/50 transition-all"
            />
          </div>

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full sm:w-56 px-3.5 py-2.5 bg-[#120D24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#8D37D6]/50 cursor-pointer"
          >
            <option value="">All Language Tracks</option>
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
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
                <th className="px-6 py-4">Station / Module</th>
                <th className="px-6 py-4">Track</th>
                <th className="px-6 py-4">Exercises</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    <RefreshCw className="animate-spin inline mr-2" size={16} />
                    Loading modules...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    No modules found. Click &quot;Add Module&quot; to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((mod) => (
                  <tr key={mod.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[#8D37D6] text-xs">
                          #{mod.module_number}
                        </div>
                        <div>
                          <div>{mod.title}</div>
                          <div className="text-xs text-white/40 line-clamp-1 max-w-sm font-normal">
                            {mod.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-[#4ECDC4]">
                      {mod.languages?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-bold text-white/80">{mod._count?.questions || 0}</span> exercises
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          mod.is_published
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}
                      >
                        {mod.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(mod)}
                          className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all cursor-pointer"
                          title="Edit module"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(mod)}
                          className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all cursor-pointer"
                          title="Delete module"
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
                  {modal === 'edit' ? 'Edit Module' : 'Create Module'}
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
                  <label className="text-xs font-bold uppercase text-white/60">Language Track *</label>
                  <select
                    required
                    value={form.language_id}
                    onChange={(e) => setForm((p) => ({ ...p, language_id: e.target.value }))}
                    className="w-full mt-1.5 px-3.5 py-2 bg-[#1B1438] border border-white/10 rounded-xl text-sm text-white cursor-pointer"
                  >
                    <option value="">Select Language Track</option>
                    {languages.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-white/60">Station Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. HELLO WORLD, VARIABLES"
                    className="w-full mt-1.5 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#8D37D6]/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-white/60">Description</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of this station"
                    className="w-full mt-1.5 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#8D37D6]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Station #</label>
                    <input
                      type="number"
                      required
                      value={form.module_number}
                      onChange={(e) => setForm((p) => ({ ...p, module_number: Number(e.target.value) }))}
                      className="w-full mt-1.5 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Status</label>
                    <select
                      value={form.is_published ? 'true' : 'false'}
                      onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.value === 'true' }))}
                      className="w-full mt-1.5 px-3.5 py-2 bg-[#1B1438] border border-white/10 rounded-xl text-sm text-white cursor-pointer"
                    >
                      <option value="true">Published</option>
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
                    className="px-5 py-2 bg-[#8D37D6] hover:bg-[#7b2fc2] rounded-xl text-sm font-bold text-white shadow-lg shadow-[#8D37D6]/25 cursor-pointer disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : modal === 'edit' ? 'Save Changes' : 'Create Module'}
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
                <h3 className="font-bold text-lg text-white">Delete Module</h3>
                <p className="text-xs text-white/60 mt-1">
                  Are you sure you want to delete <strong className="text-white">&quot;{deleteTarget.title}&quot;</strong>?
                  All exercises within this module will be deleted.
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
