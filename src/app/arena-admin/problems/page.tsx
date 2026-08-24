'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Swords,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Trash2,
  Pencil,
  FileCode2,
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Code2,
  ListChecks,
} from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'BOSS';
  base_points: number;
  time_limit_sec: number;
  memory_limit_mb: number;
  starter_codes_json?: Record<string, string>;
  tags_json?: string[];
  created_at: string;
  publicTestCases: number;
  hiddenTestCases: number;
  totalTestCases: number;
  test_cases?: Array<{ id?: string; input: string; expected: string; is_public: boolean }>;
}

interface McqQuestion {
  id: string;
  question: string;
  options_json: string[] | string;
  correct_index: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  created_at: string;
}

interface ProblemsResponse {
  problems: Problem[];
  total: number;
  page: number;
  totalPages: number;
}

interface McqResponse {
  questions: McqQuestion[];
  total: number;
  page: number;
  totalPages: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: '#3DCB7F',
  easy: '#3DCB7F',
  MEDIUM: '#F5A623',
  medium: '#F5A623',
  HARD: '#E85D5D',
  hard: '#E85D5D',
  BOSS: '#A855F7',
  boss: '#A855F7',
};

const EMPTY_PROBLEM_FORM = {
  title: '',
  description: '',
  difficulty: 'EASY',
  base_points: 100,
  time_limit_sec: 2,
  memory_limit_mb: 128,
};

const EMPTY_TC = { input: '', expected: '', is_public: true };

const EMPTY_MCQ_FORM = {
  question: '',
  options: ['', '', '', ''],
  correct_index: 0,
  difficulty: 'easy',
  category: 'Data Structures',
};

export default function ArenaProblemsPage() {
  
  const [activeTab, setActiveTab] = useState<'coding' | 'mcq'>('coding');

  const [data, setData] = useState<ProblemsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);

  const [mcqData, setMcqData] = useState<McqResponse | null>(null);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqSearch, setMcqSearch] = useState('');
  const [mcqCategory, setMcqCategory] = useState('');
  const [mcqDifficulty, setMcqDifficulty] = useState('');
  const [mcqPage, setMcqPage] = useState(1);

  const [problemModal, setProblemModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Problem | null>(null);
  const [problemForm, setProblemForm] = useState(EMPTY_PROBLEM_FORM);
  const [testCases, setTestCases] = useState([{ ...EMPTY_TC }]);
  const [starterPython, setStarterPython] = useState('');
  const [starterJs, setStarterJs] = useState('');
  const [starterCpp, setStarterCpp] = useState('');
  const [starterJava, setStarterJava] = useState('');

  const [mcqModal, setMcqModal] = useState<'create' | 'edit' | null>(null);
  const [editMcqTarget, setEditMcqTarget] = useState<McqQuestion | null>(null);
  const [mcqForm, setMcqForm] = useState(EMPTY_MCQ_FORM);

  const [jsonModal, setJsonModal] = useState<'coding' | 'mcq' | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonValidationErrors, setJsonValidationErrors] = useState<string[]>([]);
  const [jsonValidationSuccess, setJsonValidationSuccess] = useState<string | null>(null);
  const [jsonUploading, setJsonUploading] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'coding' | 'mcq' } | null>(null);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (difficulty) params.set('difficulty', difficulty);
      const res = await fetch(`/api/admin/arena/problems?${params}`);
      if (res.ok) setData(await res.json());
    } catch {
      
    } finally {
      setLoading(false);
    }
  }, [page, search, difficulty]);

  const fetchMcqQuestions = useCallback(async () => {
    setMcqLoading(true);
    try {
      const params = new URLSearchParams({ page: String(mcqPage) });
      if (mcqSearch) params.set('search', mcqSearch);
      if (mcqCategory) params.set('category', mcqCategory);
      if (mcqDifficulty) params.set('difficulty', mcqDifficulty);
      const res = await fetch(`/api/admin/arena/mcq?${params}`);
      if (res.ok) setMcqData(await res.json());
    } catch {
      
    } finally {
      setMcqLoading(false);
    }
  }, [mcqPage, mcqSearch, mcqCategory, mcqDifficulty]);

  useEffect(() => {
    const load = async () => {
      if (activeTab === 'coding') await fetchProblems();
      else await fetchMcqQuestions();
    };
    void load();
  }, [activeTab, fetchProblems, fetchMcqQuestions]);

  const openCreateProblem = () => {
    setProblemForm({ ...EMPTY_PROBLEM_FORM });
    setTestCases([{ ...EMPTY_TC }]);
    setStarterPython('');
    setStarterJs('');
    setStarterCpp('');
    setStarterJava('');
    setFormError('');
    setProblemModal('create');
    setEditTarget(null);
  };

  const openEditProblem = async (p: Problem) => {
    setFormError('');
    setFormLoading(true);
    setProblemModal('edit');
    setEditTarget(p);

    try {
      const res = await fetch(`/api/admin/arena/problems/${p.id}`);
      if (res.ok) {
        const full = await res.json();
        setProblemForm({
          title: full.title,
          description: full.description,
          difficulty: full.difficulty,
          base_points: full.base_points,
          time_limit_sec: full.time_limit_sec,
          memory_limit_mb: full.memory_limit_mb,
        });
        if (full.test_cases && full.test_cases.length > 0) {
          setTestCases(full.test_cases);
        } else {
          setTestCases([{ ...EMPTY_TC }]);
        }
        const sc = full.starter_codes_json || {};
        setStarterPython(sc.python || '');
        setStarterJs(sc.javascript || '');
        setStarterCpp(sc.cpp || '');
        setStarterJava(sc.java || '');
      }
    } catch {
      setFormError('Failed to load problem details');
    } finally {
      setFormLoading(false);
    }
  };

  const handleProblemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const starterCodes: Record<string, string> = {};
    if (starterPython.trim()) starterCodes.python = starterPython;
    if (starterJs.trim()) starterCodes.javascript = starterJs;
    if (starterCpp.trim()) starterCodes.cpp = starterCpp;
    if (starterJava.trim()) starterCodes.java = starterJava;

    const payload = {
      ...problemForm,
      starter_codes_json: starterCodes,
      test_cases: testCases.filter((tc) => tc.input.trim() || tc.expected.trim()),
    };

    try {
      const url =
        problemModal === 'edit' && editTarget
          ? `/api/admin/arena/problems/${editTarget.id}`
          : '/api/admin/arena/problems';
      const method = problemModal === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || 'Failed to save problem');
        return;
      }

      setProblemModal(null);
      fetchProblems();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const openCreateMcq = () => {
    setMcqForm({ ...EMPTY_MCQ_FORM });
    setFormError('');
    setMcqModal('create');
    setEditMcqTarget(null);
  };

  const openEditMcq = (q: McqQuestion) => {
    let opts = ['', '', '', ''];
    if (Array.isArray(q.options_json)) opts = q.options_json;
    else if (typeof q.options_json === 'string') {
      try {
        opts = JSON.parse(q.options_json);
      } catch {
        
      }
    }

    setMcqForm({
      question: q.question,
      options: opts,
      correct_index: q.correct_index,
      difficulty: q.difficulty,
      category: q.category,
    });
    setFormError('');
    setMcqModal('edit');
    setEditMcqTarget(q);
  };

  const handleMcqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const url =
        mcqModal === 'edit' && editMcqTarget
          ? `/api/admin/arena/mcq/${editMcqTarget.id}`
          : '/api/admin/arena/mcq';
      const method = mcqModal === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcqForm),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || 'Failed to save MCQ question');
        return;
      }

      setMcqModal(null);
      fetchMcqQuestions();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const url =
        deleteTarget.type === 'coding'
          ? `/api/admin/arena/problems/${deleteTarget.id}`
          : `/api/admin/arena/mcq/${deleteTarget.id}`;

      await fetch(url, { method: 'DELETE' });
      setDeleteTarget(null);
      if (deleteTarget.type === 'coding') fetchProblems();
      else fetchMcqQuestions();
    } catch {
      
    }
  };

  const validateJson = () => {
    setJsonValidationErrors([]);
    setJsonValidationSuccess(null);

    if (!jsonInput.trim()) {
      setJsonValidationErrors(['JSON input is empty. Please paste or upload JSON.']);
      return false;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const errors: string[] = [];

      if (jsonModal === 'coding') {
        let items: Array<{ title?: string; description?: string; difficulty?: string; base_points?: unknown }> = [];
        if (Array.isArray(parsed)) items = parsed;
        else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.problems)) items = parsed.problems;
        else if (parsed && typeof parsed === 'object' && parsed.title) items = [parsed];
        else {
          setJsonValidationErrors(['JSON must be an array of problems or an object with a "problems" array.']);
          return false;
        }

        items.forEach((item, i) => {
          const num = i + 1;
          if (!item.title) errors.push(`Item #${num}: missing "title".`);
          if (!item.description) errors.push(`Item #${num}: missing "description".`);
          if (!item.difficulty || !['EASY', 'MEDIUM', 'HARD', 'BOSS', 'easy', 'medium', 'hard', 'boss'].includes(item.difficulty)) {
            errors.push(`Item #${num}: "difficulty" must be EASY, MEDIUM, HARD, or BOSS.`);
          }
          if (item.base_points === undefined || isNaN(Number(item.base_points))) {
            errors.push(`Item #${num}: missing or invalid "base_points".`);
          }
        });

        if (errors.length > 0) {
          setJsonValidationErrors(errors);
          return false;
        }

        setJsonValidationSuccess(`✓ Valid JSON: Ready to upload ${items.length} coding challenge(s)!`);
        return true;
      } else {
        let items: Array<{ question?: string; options?: unknown[]; correct_index?: unknown; difficulty?: string }> = [];
        if (Array.isArray(parsed)) items = parsed;
        else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.questions)) items = parsed.questions;
        else if (parsed && typeof parsed === 'object' && parsed.question) items = [parsed];
        else {
          setJsonValidationErrors(['JSON must be an array of MCQ questions or an object with a "questions" array.']);
          return false;
        }

        items.forEach((item, i) => {
          const num = i + 1;
          if (!item.question) errors.push(`Item #${num}: missing "question".`);
          if (!Array.isArray(item.options) || item.options.length < 2) {
            errors.push(`Item #${num}: "options" must have at least 2 choices.`);
          }
          if (item.correct_index === undefined || isNaN(Number(item.correct_index))) {
            errors.push(`Item #${num}: missing or invalid "correct_index".`);
          }
          if (!item.difficulty || !['easy', 'medium', 'hard', 'EASY', 'MEDIUM', 'HARD'].includes(item.difficulty)) {
            errors.push(`Item #${num}: "difficulty" must be easy, medium, or hard.`);
          }
        });

        if (errors.length > 0) {
          setJsonValidationErrors(errors);
          return false;
        }

        setJsonValidationSuccess(`✓ Valid JSON: Ready to upload ${items.length} MCQ question(s)!`);
        return true;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Parse error';
      setJsonValidationErrors([`Invalid JSON Syntax: ${msg}`]);
      return false;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setJsonValidationErrors([]);
      setJsonValidationSuccess(null);
    };
    reader.readAsText(file);
  };

  const handleBulkUploadSubmit = async () => {
    if (!validateJson()) return;

    setJsonUploading(true);
    try {
      const parsed = JSON.parse(jsonInput);
      const url =
        jsonModal === 'coding'
          ? '/api/admin/arena/problems/bulk-json'
          : '/api/admin/arena/mcq/bulk-json';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const json = await res.json();
      if (!res.ok) {
        setJsonValidationErrors(json.details || [json.error || 'Upload failed']);
        return;
      }

      setJsonModal(null);
      setJsonInput('');
      setJsonValidationSuccess(null);
      if (jsonModal === 'coding') fetchProblems();
      else fetchMcqQuestions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
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
              <div className="p-2.5 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20">
                <Swords size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Battle Arena Management</h1>
                <p className="text-sm text-white/50">
                  Full control over Battle Arena coding challenges, MCQ question pools, and starter templates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setJsonModal(activeTab);
                setJsonInput('');
                setJsonValidationErrors([]);
                setJsonValidationSuccess(null);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-sm font-semibold transition-all cursor-pointer shadow-md"
            >
              <FileJson size={16} className="text-[#FF6B35]" />
              Import JSON
            </button>

            <button
              onClick={activeTab === 'coding' ? openCreateProblem : openCreateMcq}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:opacity-95 text-white text-sm font-semibold transition-all shadow-lg shadow-[#FF6B35]/20 cursor-pointer"
            >
              <Plus size={16} />
              {activeTab === 'coding' ? 'Add Problem' : 'Add MCQ Question'}
            </button>
          </div>
        </div>

        {}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('coding')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'coding'
                ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/25'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 size={16} />
            Coding Challenges ({data?.total ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('mcq')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'mcq'
                ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/25'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ListChecks size={16} />
            MCQ Questions ({mcqData?.total ?? 0})
          </button>
        </div>

        {}
        {activeTab === 'coding' && (
          <div className="space-y-4">
            {}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search coding challenges..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B35]/50 transition-all"
                />
              </div>

              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setPage(1);
                }}
                className="px-3.5 py-2.5 bg-[#120D24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35]/50"
              >
                <option value="">All Difficulties</option>
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
                <option value="BOSS">BOSS</option>
              </select>

              <button
                onClick={fetchProblems}
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {}
            <div className="bg-[#120D24]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/80">
                  <thead className="bg-white/5 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/60">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Difficulty</th>
                      <th className="px-6 py-4">Points</th>
                      <th className="px-6 py-4">Time / Mem</th>
                      <th className="px-6 py-4">Test Cases</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                          <RefreshCw className="animate-spin inline mr-2" size={16} />
                          Loading challenges...
                        </td>
                      </tr>
                    ) : !data || data.problems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                          No problems found. Click &quot;Add Problem&quot; or &quot;Import JSON&quot; to seed!
                        </td>
                      </tr>
                    ) : (
                      data.problems.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-semibold text-white">
                            <div>{p.title}</div>
                            <div className="text-xs text-white/40 line-clamp-1 max-w-sm font-normal">
                              {p.description}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
                              style={{
                                color: DIFFICULTY_COLORS[p.difficulty] || '#FF6B35',
                                backgroundColor: `${DIFFICULTY_COLORS[p.difficulty] || '#FF6B35'}15`,
                                borderColor: `${DIFFICULTY_COLORS[p.difficulty] || '#FF6B35'}40`,
                              }}
                            >
                              {p.difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-amber-400">
                            {p.base_points} XP
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-white/60">
                            {p.time_limit_sec}s / {p.memory_limit_mb}MB
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <span className="text-emerald-400 font-mono font-bold">
                              {p.publicTestCases} pub
                            </span>{' '}
                            /{' '}
                            <span className="text-white/40 font-mono">
                              {p.hiddenTestCases} hid ({p.totalTestCases} tot)
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditProblem(p)}
                                className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all cursor-pointer"
                                title="Edit challenge"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ id: p.id, type: 'coding' })}
                                className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all cursor-pointer"
                                title="Delete challenge"
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
              {data && data.totalPages > 1 && (
                <div className="px-6 py-3.5 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                  <div>
                    Showing {(data.page - 1) * 20 + 1}–{Math.min(data.page * 20, data.total)} of{' '}
                    {data.total}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={data.page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="px-2 font-mono font-bold text-white/70">
                      {data.page} / {data.totalPages}
                    </span>
                    <button
                      disabled={data.page >= data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {}
        {activeTab === 'mcq' && (
          <div className="space-y-4">
            {}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search MCQ questions..."
                  value={mcqSearch}
                  onChange={(e) => {
                    setMcqSearch(e.target.value);
                    setMcqPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B35]/50 transition-all"
                />
              </div>

              <input
                type="text"
                placeholder="Filter category (e.g. Algorithms)..."
                value={mcqCategory}
                onChange={(e) => {
                  setMcqCategory(e.target.value);
                  setMcqPage(1);
                }}
                className="w-48 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B35]/50"
              />

              <select
                value={mcqDifficulty}
                onChange={(e) => {
                  setMcqDifficulty(e.target.value);
                  setMcqPage(1);
                }}
                className="px-3.5 py-2.5 bg-[#120D24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35]/50"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <button
                onClick={fetchMcqQuestions}
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <RefreshCw size={16} className={mcqLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {}
            <div className="bg-[#120D24]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/80">
                  <thead className="bg-white/5 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/60">
                    <tr>
                      <th className="px-6 py-4">Question</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Difficulty</th>
                      <th className="px-6 py-4">Correct Answer</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {mcqLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                          <RefreshCw className="animate-spin inline mr-2" size={16} />
                          Loading MCQ questions...
                        </td>
                      </tr>
                    ) : !mcqData || mcqData.questions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                          No MCQ questions found. Click &quot;Add MCQ Question&quot; or &quot;Import JSON&quot; to add!
                        </td>
                      </tr>
                    ) : (
                      mcqData.questions.map((q) => {
                        let opts: string[] = [];
                        if (Array.isArray(q.options_json)) opts = q.options_json;
                        else if (typeof q.options_json === 'string') {
                          try {
                            opts = JSON.parse(q.options_json);
                          } catch {}
                        }
                        const correctText = opts[q.correct_index] || `Option #${q.correct_index + 1}`;

                        return (
                          <tr key={q.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 font-semibold text-white max-w-md">
                              <div>{q.question}</div>
                              <div className="text-xs text-white/40 mt-1 font-normal">
                                {opts.length} options provided
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white/80">
                                {q.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
                                style={{
                                  color: DIFFICULTY_COLORS[q.difficulty] || '#FF6B35',
                                  backgroundColor: `${DIFFICULTY_COLORS[q.difficulty] || '#FF6B35'}15`,
                                  borderColor: `${DIFFICULTY_COLORS[q.difficulty] || '#FF6B35'}40`,
                                }}
                              >
                                {q.difficulty}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-emerald-400">
                              <div className="line-clamp-1">✓ {correctText}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditMcq(q)}
                                  className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all cursor-pointer"
                                  title="Edit MCQ"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget({ id: q.id, type: 'mcq' })}
                                  className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all cursor-pointer"
                                  title="Delete MCQ"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {}
              {mcqData && mcqData.totalPages > 1 && (
                <div className="px-6 py-3.5 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                  <div>
                    Showing {(mcqData.page - 1) * 20 + 1}–
                    {Math.min(mcqData.page * 20, mcqData.total)} of {mcqData.total}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={mcqData.page <= 1}
                      onClick={() => setMcqPage((p) => p - 1)}
                      className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="px-2 font-mono font-bold text-white/70">
                      {mcqData.page} / {mcqData.totalPages}
                    </span>
                    <button
                      disabled={mcqData.page >= mcqData.totalPages}
                      onClick={() => setMcqPage((p) => p + 1)}
                      className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {}
        {problemModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#120D24] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-lg text-white">
                  {problemModal === 'edit' ? 'Edit Coding Challenge' : 'Create New Coding Challenge'}
                </h3>
                <button
                  onClick={() => setProblemModal(null)}
                  className="p-1 text-white/40 hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleProblemSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold uppercase text-white/60 tracking-wider">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={problemForm.title}
                    onChange={(e) => setProblemForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Reverse a String"
                    className="w-full mt-1.5 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35]/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-white/60 tracking-wider">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={problemForm.description}
                    onChange={(e) => setProblemForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Given an integer N, compute..."
                    className="w-full mt-1.5 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35]/50 resize-y"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Difficulty</label>
                    <select
                      value={problemForm.difficulty}
                      onChange={(e) =>
                        setProblemForm((p) => ({ ...p, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' | 'BOSS' }))
                      }
                      className="w-full mt-1.5 px-3 py-2 bg-[#1B1438] border border-white/10 rounded-xl text-sm text-white"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                      <option value="BOSS">BOSS</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">XP Points</label>
                    <input
                      type="number"
                      required
                      value={problemForm.base_points}
                      onChange={(e) =>
                        setProblemForm((p) => ({ ...p, base_points: Number(e.target.value) }))
                      }
                      className="w-full mt-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Time (s)</label>
                    <input
                      type="number"
                      value={problemForm.time_limit_sec}
                      onChange={(e) =>
                        setProblemForm((p) => ({ ...p, time_limit_sec: Number(e.target.value) }))
                      }
                      className="w-full mt-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Memory (MB)</label>
                    <input
                      type="number"
                      value={problemForm.memory_limit_mb}
                      onChange={(e) =>
                        setProblemForm((p) => ({ ...p, memory_limit_mb: Number(e.target.value) }))
                      }
                      className="w-full mt-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-mono"
                    />
                  </div>
                </div>

                {}
                <div className="pt-2">
                  <div className="text-xs font-bold uppercase text-[#FF6B35] tracking-wider mb-2 flex items-center gap-1.5">
                    <FileCode2 size={14} />
                    Starter Codes (Pre-written I/O + Function Stub)
                  </div>
                  <div className="space-y-3 bg-white/[0.02] border border-white/10 p-3.5 rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-white/70">Python 3:</span>
                      <textarea
                        rows={3}
                        value={starterPython}
                        onChange={(e) => setStarterPython(e.target.value)}
                        placeholder="import sys\ndef solve(x):\n    pass..."
                        className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-emerald-300"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white/70">JavaScript / Node:</span>
                      <textarea
                        rows={3}
                        value={starterJs}
                        onChange={(e) => setStarterJs(e.target.value)}
                        placeholder="const fs = require('fs');\nfunction solve()..."
                        className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-amber-300"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white/70">C++ (GCC):</span>
                      <textarea
                        rows={3}
                        value={starterCpp}
                        onChange={(e) => setStarterCpp(e.target.value)}
                        placeholder="#include <iostream>\nusing namespace std;..."
                        className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-cyan-300"
                      />
                    </div>
                  </div>
                </div>

                {}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-white/70 tracking-wider">
                      Test Cases ({testCases.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setTestCases((p) => [...p, { ...EMPTY_TC }])}
                      className="text-xs text-[#FF6B35] hover:underline font-semibold cursor-pointer"
                    >
                      + Add Test Case
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {testCases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span className="font-mono font-bold">Case #{idx + 1}</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tc.is_public}
                                onChange={(e) =>
                                  setTestCases((prev) =>
                                    prev.map((c, i) => (i === idx ? { ...c, is_public: e.target.checked } : c))
                                  )
                                }
                                className="rounded text-[#FF6B35]"
                              />
                              <span>Public</span>
                            </label>
                            {testCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setTestCases((p) => p.filter((_, i) => i !== idx))}
                                className="text-rose-400 hover:text-rose-300"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <textarea
                            rows={2}
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
                            rows={2}
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
                    onClick={() => setProblemModal(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white/70 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 bg-[#FF6B35] hover:bg-[#FF8C42] rounded-xl text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25 cursor-pointer disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : problemModal === 'edit' ? 'Save Changes' : 'Create Problem'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {}
        {mcqModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#120D24] border border-white/15 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-lg text-white">
                  {mcqModal === 'edit' ? 'Edit MCQ Question' : 'Create New MCQ Question'}
                </h3>
                <button
                  onClick={() => setMcqModal(null)}
                  className="p-1 text-white/40 hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleMcqSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold uppercase text-white/60 tracking-wider">
                    Question Text *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={mcqForm.question}
                    onChange={(e) => setMcqForm((p) => ({ ...p, question: e.target.value }))}
                    placeholder="e.g. What is the time complexity of searching in a Binary Search Tree?"
                    className="w-full mt-1.5 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Category *</label>
                    <input
                      type="text"
                      required
                      value={mcqForm.category}
                      onChange={(e) => setMcqForm((p) => ({ ...p, category: e.target.value }))}
                      placeholder="e.g. Data Structures"
                      className="w-full mt-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-white/60">Difficulty</label>
                    <select
                      value={mcqForm.difficulty}
                      onChange={(e) => setMcqForm((p) => ({ ...p, difficulty: e.target.value }))}
                      className="w-full mt-1.5 px-3 py-2 bg-[#1B1438] border border-white/10 rounded-xl text-sm text-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {}
                <div>
                  <label className="text-xs font-bold uppercase text-white/70 tracking-wider block mb-2">
                    Choices & Correct Answer *
                  </label>
                  <div className="space-y-2.5">
                    {mcqForm.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          mcqForm.correct_index === idx
                            ? 'bg-emerald-500/10 border-emerald-500/40'
                            : 'bg-white/[0.02] border-white/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="correct_choice"
                          checked={mcqForm.correct_index === idx}
                          onChange={() => setMcqForm((p) => ({ ...p, correct_index: idx }))}
                          className="size-4 text-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-white/50 w-6">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMcqForm((p) => ({
                              ...p,
                              options: p.options.map((o, i) => (i === idx ? val : o)),
                            }));
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
                        />
                        {mcqForm.correct_index === idx && (
                          <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">
                            Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setMcqModal(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white/70 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 bg-[#FF6B35] hover:bg-[#FF8C42] rounded-xl text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25 cursor-pointer disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : mcqModal === 'edit' ? 'Save Changes' : 'Create MCQ'}
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
                  <FileJson size={20} className="text-[#FF6B35]" />
                  <h3 className="font-bold text-lg text-white">
                    Import {jsonModal === 'coding' ? 'Coding Challenges' : 'MCQ Questions'} via JSON
                  </h3>
                </div>
                <button
                  onClick={() => setJsonModal(null)}
                  className="p-1 text-white/40 hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <p className="text-xs text-white/60 leading-relaxed">
                  Upload a JSON file or paste your raw JSON below. The data will be strictly validated
                  against the schema before anything is written to the database.
                </p>

                {}
                <div>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/15 hover:border-[#FF6B35]/50 bg-white/[0.02] hover:bg-white/[0.04] p-6 rounded-2xl cursor-pointer transition-all">
                    <Upload size={24} className="text-[#FF6B35] mb-2" />
                    <span className="text-xs font-bold text-white/80">Click to upload .json file</span>
                    <span className="text-[11px] text-white/40 mt-0.5">Supports UTF-8 JSON</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase text-white/60 tracking-wider">
                      Or Paste JSON Content:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (jsonModal === 'coding') {
                          setJsonInput(
                            JSON.stringify(
                              [
                                {
                                  title: 'Sum of Two Numbers',
                                  description: 'Given two integers, print their sum.',
                                  difficulty: 'EASY',
                                  base_points: 100,
                                  time_limit_sec: 2,
                                  starter_codes_json: {
                                    python: 'import sys\n\ndef solve(a, b):\n    pass\n',
                                  },
                                  test_cases: [
                                    { input: '3 5', expected: '8', is_public: true },
                                    { input: '10 -2', expected: '8', is_public: false },
                                  ],
                                },
                              ],
                              null,
                              2
                            )
                          );
                        } else {
                          setJsonInput(
                            JSON.stringify(
                              [
                                {
                                  question: 'Which data structure uses FIFO ordering?',
                                  options: ['Stack', 'Queue', 'Tree', 'Graph'],
                                  correct_index: 1,
                                  difficulty: 'easy',
                                  category: 'Data Structures',
                                },
                              ],
                              null,
                              2
                            )
                          );
                        }
                      }}
                      className="text-xs text-[#FF6B35] hover:underline font-semibold cursor-pointer"
                    >
                      Insert Example Template
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
                    placeholder={`[
  {
    "title": "Example Problem",
    "description": "...",
    "difficulty": "EASY",
    "base_points": 100,
    "test_cases": [{ "input": "1", "expected": "2", "is_public": true }]
  }
]`}
                    className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white/90 focus:outline-none focus:border-[#FF6B35]/50"
                  />
                </div>

                {}
                {jsonValidationErrors.length > 0 && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                      <AlertCircle size={15} />
                      Validation Failed ({jsonValidationErrors.length} issues found):
                    </div>
                    <ul className="list-disc list-inside text-xs text-rose-300/90 pl-1 max-h-32 overflow-y-auto space-y-0.5">
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
                      onClick={() => setJsonModal(null)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white/70 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={jsonUploading}
                      onClick={handleBulkUploadSubmit}
                      className="px-5 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:opacity-95 rounded-xl text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25 cursor-pointer disabled:opacity-50"
                    >
                      {jsonUploading ? 'Importing...' : 'Validate & Upload'}
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
                <h3 className="font-bold text-lg text-white">Delete Item</h3>
                <p className="text-xs text-white/60 mt-1">
                  Are you sure you want to permanently delete this {deleteTarget.type === 'coding' ? 'challenge' : 'MCQ question'}?
                  This cannot be undone.
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
