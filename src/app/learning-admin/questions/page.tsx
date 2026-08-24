'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  FileQuestion,
  Plus,
  Search,
  RefreshCw,
  X,
  Trash2,
  Pencil,
  FileJson,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ModuleOption {
  id: string;
  title: string;
  module_number: number;
  languages?: {
    name: string;
    code: string;
  };
}

interface QuestionItem {
  id: string;
  module_id: string;
  title: string;
  problem_text: string;
  difficulty: string;
  section: string | null;
  starter_code: string | null;
  xp_reward: number;
  display_order: number;
  test_cases_json?: unknown;
  modules?: {
    id: string;
    title: string;
    languages?: {
      name: string;
      code: string;
    };
  };
}

const EMPTY_FORM = {
  module_id: '',
  title: '',
  problem_text: '',
  difficulty: 'easy',
  section: 'Core',
  starter_code: '',
  xp_reward: 55,
  display_order: 1,
};

const EMPTY_TC = { input: '', expected: '', is_public: true };

export default function LearningQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState('');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<QuestionItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [testCases, setTestCases] = useState([{ ...EMPTY_TC }]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<QuestionItem | null>(null);

  const [jsonModal, setJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonValidationErrors, setJsonValidationErrors] = useState<string[]>([]);
  const [jsonValidationSuccess, setJsonValidationSuccess] = useState<string | null>(null);
  const [jsonUploading, setJsonUploading] = useState(false);

  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/learning/modules');
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
      }
    } catch {
      
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (selectedModule) params.set('moduleId', selectedModule);
      if (search) params.set('search', search);
      if (difficulty) params.set('difficulty', difficulty);

      const res = await fetch(`/api/admin/learning/questions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {
      
    } finally {
      setLoading(false);
    }
  }, [page, selectedModule, search, difficulty]);

  useEffect(() => {
    const load = async () => {
      await fetchModules();
    };
    void load();
  }, [fetchModules]);

  useEffect(() => {
    const load = async () => {
      await fetchQuestions();
    };
    void load();
  }, [fetchQuestions]);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      module_id: selectedModule || (modules[0]?.id ?? ''),
      display_order: questions.length + 1,
    });
    setTestCases([{ ...EMPTY_TC }]);
    setFormError('');
    setModal('create');
    setEditTarget(null);
  };

  const openEdit = (q: QuestionItem) => {
    setForm({
      module_id: q.module_id,
      title: q.title,
      problem_text: q.problem_text,
      difficulty: q.difficulty || 'easy',
      section: q.section || 'Core',
      starter_code: q.starter_code || '',
      xp_reward: q.xp_reward || 55,
      display_order: q.display_order || 1,
    });

    let tcs = [{ ...EMPTY_TC }];
    if (Array.isArray(q.test_cases_json) && q.test_cases_json.length > 0) {
      tcs = (q.test_cases_json as Array<{ input?: string; expected?: string; is_public?: boolean }>).map((tc) => ({
        input: tc.input || '',
        expected: tc.expected || '',
        is_public: tc.is_public !== false,
      }));
    }
    setTestCases(tcs);
    setFormError('');
    setModal('edit');
    setEditTarget(q);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const payload = {
      ...form,
      test_cases_json: testCases.filter((tc) => tc.input.trim() || tc.expected.trim()),
    };

    try {
      const url =
        modal === 'edit' && editTarget
          ? `/api/admin/learning/questions/${editTarget.id}`
          : '/api/admin/learning/questions';
      const method = modal === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || 'Failed to save exercise');
        return;
      }

      setModal(null);
      fetchQuestions();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/admin/learning/questions/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchQuestions();
    } catch {
      
    }
  };

  const validateJson = () => {
    setJsonValidationErrors([]);
    setJsonValidationSuccess(null);

    if (!jsonInput.trim()) {
      setJsonValidationErrors(['JSON input is empty.']);
      return false;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const errors: string[] = [];

      if (parsed.language_code && Array.isArray(parsed.chapters)) {
        parsed.chapters.forEach((ch: { title?: string }, i: number) => {
          if (!ch.title) errors.push(`Chapter #${i + 1}: missing "title".`);
        });
        if (errors.length > 0) {
          setJsonValidationErrors(errors);
          return false;
        }
        setJsonValidationSuccess(`✓ Valid Course Curriculum: Ready to import ${parsed.chapters.length} chapters.`);
        return true;
      } else if (parsed.module_id && Array.isArray(parsed.questions)) {
        parsed.questions.forEach((q: { title?: string }, i: number) => {
          if (!q.title) errors.push(`Question #${i + 1}: missing "title".`);
        });
        if (errors.length > 0) {
          setJsonValidationErrors(errors);
          return false;
        }
        setJsonValidationSuccess(`✓ Valid Exercise Batch: Ready to import ${parsed.questions.length} questions.`);
        return true;
      } else {
        setJsonValidationErrors(['Invalid format. Expected a course object with "chapters" or a "{ module_id, questions }" batch.']);
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Parse error';
      setJsonValidationErrors([`Invalid JSON Syntax: ${msg}`]);
      return false;
    }
  };

  const handleBulkUploadSubmit = async () => {
    if (!validateJson()) return;
    setJsonUploading(true);

    try {
      const parsed = JSON.parse(jsonInput);
      const res = await fetch('/api/admin/learning/bulk-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const json = await res.json();
      if (!res.ok) {
        setJsonValidationErrors(json.details || [json.error || 'Failed to import curriculum']);
        return;
      }

      setJsonModal(false);
      setJsonInput('');
      setJsonValidationSuccess(null);
      fetchQuestions();
      fetchModules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setJsonValidationErrors([`Upload error: ${msg}`]);
    } finally {
      setJsonUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20">
                <FileQuestion size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Exercise Bank & Missions</h1>
                <p className="text-sm text-white/50">Manage coding missions, test cases, and curriculum imports.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setJsonModal(true);
                setJsonInput('');
                setJsonValidationErrors([]);
                setJsonValidationSuccess(null);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-sm font-semibold transition-all cursor-pointer shadow-md"
            >
              <FileJson size={16} className="text-[#F5A623]" />
              Import Curriculum JSON
            </button>

            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F5A623] to-[#FF8C42] hover:opacity-95 text-white text-sm font-semibold transition-all shadow-lg shadow-[#F5A623]/20 cursor-pointer"
            >
              <Plus size={16} />
              Add Exercise
            </button>
          </div>
        </div>

        {}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search exercises by title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#F5A623]/50 transition-all"
            />
          </div>

          <select
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-56 px-3.5 py-2.5 bg-[#120D24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#F5A623]/50 cursor-pointer"
          >
            <option value="">All Stations & Modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.languages?.name ? `[${m.languages.name}] ` : ''}
                {m.title}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-36 px-3.5 py-2.5 bg-[#120D24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#F5A623]/50 cursor-pointer"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <button
            onClick={fetchQuestions}
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
                <th className="px-6 py-4">Exercise Title</th>
                <th className="px-6 py-4">Module Station</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">XP Reward</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    <RefreshCw className="animate-spin inline mr-2" size={16} />
                    Loading exercises...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    No exercises found. Click &quot;Add Exercise&quot; or &quot;Import Curriculum JSON&quot; to seed.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-[#F5A623] text-xs">
                          #{q.display_order}
                        </div>
                        <div>
                          <div>{q.title}</div>
                          <div className="text-xs text-white/40 line-clamp-1 max-w-sm font-normal">
                            {q.problem_text}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-[#8D37D6]">
                      {q.modules?.title || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-400 text-xs">
                      +{q.xp_reward} XP
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(q)}
                          className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all cursor-pointer"
                          title="Edit exercise"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(q)}
                          className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all cursor-pointer"
                          title="Delete exercise"
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

          {}
          {totalPages > 1 && (
            <div className="px-6 py-3.5 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
              <div>
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-mono font-bold text-white/70">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {}
        {modal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#120D24] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-lg text-white">
                  {modal === 'edit' ? 'Edit Exercise' : 'Create New Exercise'}
                </h3>
                <button onClick={() => setModal(null)} className="text-white/40 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Module / Station *</label>
                    <select
                      required
                      value={form.module_id}
                      onChange={(e) => setForm((p) => ({ ...p, module_id: e.target.value }))}
                      className="w-full mt-1.5 px-3 py-2 bg-[#1B1438] border border-white/10 rounded-xl text-sm text-white cursor-pointer"
                    >
                      <option value="">Select Module</option>
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.languages?.name ? `[${m.languages.name}] ` : ''}
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Exercise Title *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Setting Up, Hello World"
                      className="w-full mt-1.5 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-white/60">Task Instructions *</label>
                  <textarea
                    rows={2}
                    required
                    value={form.problem_text}
                    onChange={(e) => setForm((p) => ({ ...p, problem_text: e.target.value }))}
                    placeholder="Print 'Hello, World!' to the terminal."
                    className="w-full mt-1.5 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Difficulty</label>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                      className="w-full mt-1.5 px-3 py-2 bg-[#1B1438] border border-white/10 rounded-xl text-sm text-white cursor-pointer"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">XP Reward</label>
                    <input
                      type="number"
                      value={form.xp_reward}
                      onChange={(e) => setForm((p) => ({ ...p, xp_reward: Number(e.target.value) }))}
                      className="w-full mt-1.5 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Display Order</label>
                    <input
                      type="number"
                      value={form.display_order}
                      onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))}
                      className="w-full mt-1.5 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-white/60">Initial Starter Code Template</label>
                  <textarea
                    rows={3}
                    value={form.starter_code}
                    onChange={(e) => setForm((p) => ({ ...p, starter_code: e.target.value }))}
                    placeholder="# Write your code below..."
                    className="w-full mt-1.5 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-emerald-300"
                  />
                </div>

                {}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase text-white/60">Test Cases ({testCases.length})</label>
                    <button
                      type="button"
                      onClick={() => setTestCases((p) => [...p, { ...EMPTY_TC }])}
                      className="text-xs text-[#F5A623] hover:underline font-semibold cursor-pointer"
                    >
                      + Add Test Case
                    </button>
                  </div>
                  <div className="space-y-2">
                    {testCases.map((tc, idx) => (
                      <div key={idx} className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span className="font-mono font-bold">Case #{idx + 1}</span>
                          {testCases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setTestCases((p) => p.filter((_, i) => i !== idx))}
                              className="text-rose-400 hover:text-rose-300 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <textarea
                            rows={1}
                            placeholder="Input (stdin)"
                            value={tc.input}
                            onChange={(e) =>
                              setTestCases((prev) =>
                                prev.map((c, i) => (i === idx ? { ...c, input: e.target.value } : c))
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white"
                          />
                          <textarea
                            rows={1}
                            placeholder="Expected Output (stdout)"
                            value={tc.expected}
                            onChange={(e) =>
                              setTestCases((prev) =>
                                prev.map((c, i) => (i === idx ? { ...c, expected: e.target.value } : c))
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white"
                          />
                        </div>
                      </div>
                    ))}
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
                    className="px-5 py-2 bg-[#F5A623] hover:bg-[#e09419] rounded-xl text-sm font-bold text-black shadow-lg shadow-[#F5A623]/25 cursor-pointer disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : modal === 'edit' ? 'Save Changes' : 'Create Exercise'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {}
        {jsonModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#120D24] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileJson size={20} className="text-[#F5A623]" />
                  <h3 className="font-bold text-lg text-white">Import Learning Curriculum via JSON</h3>
                </div>
                <button onClick={() => setJsonModal(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <p className="text-xs text-white/60 leading-relaxed">
                  Upload a complete course curriculum JSON (with chapters and exercises) or a batch of questions for a module.
                </p>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase text-white/60">Paste JSON Content:</label>
                    <button
                      type="button"
                      onClick={() => {
                        setJsonInput(
                          JSON.stringify(
                            {
                              language_code: 'python',
                              language_name: 'Python 3',
                              chapters: [
                                {
                                  module_number: 1,
                                  title: 'HELLO WORLD',
                                  exercises: [
                                    {
                                      title: 'Setting Up',
                                      instruction: "Print 'Setting up Python 3.11...'",
                                      initialCode: "print('Setting up Python 3.11...')",
                                      xp_reward: 55,
                                    },
                                  ],
                                },
                              ],
                            },
                            null,
                            2
                          )
                        );
                      }}
                      className="text-xs text-[#F5A623] hover:underline font-semibold cursor-pointer"
                    >
                      Insert Curriculum Template
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      setJsonValidationErrors([]);
                      setJsonValidationSuccess(null);
                    }}
                    placeholder='{ "language_code": "python", "chapters": [...] }'
                    className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white/90 focus:outline-none focus:border-[#F5A623]/50"
                  />
                </div>

                {jsonValidationErrors.length > 0 && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                      <AlertCircle size={15} />
                      Validation Failed ({jsonValidationErrors.length} issues):
                    </div>
                    <ul className="list-disc list-inside text-xs text-rose-300 pl-1 space-y-0.5 max-h-28 overflow-y-auto">
                      {jsonValidationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {jsonValidationSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    {jsonValidationSuccess}
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={validateJson}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold text-white border border-white/10 cursor-pointer"
                  >
                    Validate JSON
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setJsonModal(false)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white/70 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={jsonUploading}
                      onClick={handleBulkUploadSubmit}
                      className="px-5 py-2 bg-gradient-to-r from-[#F5A623] to-[#FF8C42] hover:opacity-95 rounded-xl text-sm font-bold text-black shadow-lg shadow-[#F5A623]/25 cursor-pointer disabled:opacity-50"
                    >
                      {jsonUploading ? 'Importing...' : 'Validate & Import'}
                    </button>
                  </div>
                </div>
              </div>
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
                <h3 className="font-bold text-lg text-white">Delete Exercise</h3>
                <p className="text-xs text-white/60 mt-1">
                  Are you sure you want to delete <strong className="text-white">&quot;{deleteTarget.title}&quot;</strong>?
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
