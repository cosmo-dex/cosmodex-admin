'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import DateTimePicker from '@/components/admin/DateTimePicker';
import {
  CalendarDays, Plus, Trash2, Save, UsersRound, Trophy, Layers,
  FileText, Link as LinkIcon, Globe, HelpCircle, CheckSquare, Code2,
  ListChecks, Lightbulb, Scale, Sparkles, FileCode, Clock, Lock, Eye, EyeOff
} from 'lucide-react';

interface TimelineEntry { label: string; date: string; done: boolean }
interface RuleEntry { text: string }
interface FaqEntry { question: string; answer: string }
interface SponsorEntry { name: string; tier: string; logo_url: string }

interface TrackEntry { title: string; description: string; prize: string }
interface JudgingCriteriaEntry { criteria: string; weight: string; description: string }

interface MCQOption { id: string; text: string; isCorrect: boolean }
interface MCQQuestion {
  id: string;
  type: 'mcq';
  title: string;
  questionText: string;
  codeSnippet?: string;
  options: MCQOption[];
  explanation?: string;
  marks: number;
  timeLimitMin?: number;
}

interface TestCase { input: string; output: string; explanation?: string; isPublic: boolean }
interface CodingQuestion {
  id: string;
  type: 'coding';
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  timeLimitSec: number;
  memoryLimitMb: number;
  points: number;
  timeLimitMin?: number;
  sampleTestCases: TestCase[];
}

type QuestionItem = MCQQuestion | CodingQuestion;

interface RoundEntry {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'coding' | 'submission' | 'interview' | 'custom';
  assessmentMode?: 'mcq_only' | 'coding_only' | 'mixed';
  starts_at: string;
  ends_at: string;
  action_url: string;
}

interface PrizeEntry { rank: string; prize: string; perks: string; badge_name: string }
type SubmissionMode = 'platform' | 'google_form' | 'external_link';

export default function CreateEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<'hackathon' | 'coding_contest'>('hackathon');
  const [bannerUrl] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [regDeadline, setRegDeadline] = useState('');
  const [tags, setTags] = useState('');

  const [participationType, setParticipationType] = useState('individual');
  const [minTeamSize, setMinTeamSize] = useState('1');
  const [maxTeamSize, setMaxTeamSize] = useState('4');
  const [eligibility, setEligibility] = useState('Open to All');
  const [registrationFee] = useState('Free');

  const [problemStatement, setProblemStatement] = useState('');
  const [tracks, setTracks] = useState<TrackEntry[]>([]);
  const [judgingCriteria, setJudgingCriteria] = useState<JudgingCriteriaEntry[]>([]);

  const [assessmentMode, setAssessmentMode] = useState<'mcq_only' | 'coding_only' | 'mixed'>('mixed');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);

  const [regFieldsConfig, setRegFieldsConfig] = useState<Record<string, { enabled: boolean; required: boolean }>>({
    phone: { enabled: true, required: true },
    college_org: { enabled: true, required: true },
    degree: { enabled: true, required: false },
    branch: { enabled: true, required: false },
    year_of_study: { enabled: true, required: false },
    city_state: { enabled: true, required: true },
    gender: { enabled: true, required: false },
    github_url: { enabled: true, required: false },
    linkedin_url: { enabled: true, required: false },
    portfolio_url: { enabled: false, required: false },
    resume_url: { enabled: false, required: false },
    coding_handle: { enabled: true, required: false },
    preferred_language: { enabled: true, required: false },
    referral_source: { enabled: true, required: false },
  });

  const [isPrivate, setIsPrivate] = useState(false);
  const [secretId, setSecretId] = useState("");
  const [secretPassword, setSecretPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const generateRandomSecretId = () => {
    setSecretId("PVT-" + Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecretPassword(pass);
  };

  const [submissionMode, setSubmissionMode] = useState<SubmissionMode>('platform');
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [externalLinkUrl, setExternalLinkUrl] = useState('');
  const [requiredFields, setRequiredFields] = useState({
    submission_url: true, demo_url: true, video_url: false,
    tech_stack: true, description: true,
  });

  const [rounds, setRounds] = useState<RoundEntry[]>([]);
  const [prizes, setPrizes] = useState<PrizeEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [rules] = useState<RuleEntry[]>([]);
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [sponsors] = useState<SponsorEntry[]>([]);

  const [activeQuestionTab, setActiveQuestionTab] = useState<'all' | 'mcq' | 'coding'>('all');
  const [contestDurationMinutes, setContestDurationMinutes] = useState<number>(60);

  const addMCQQuestion = () => {
    const newMCQ: MCQQuestion = {
      id: `mcq-${Date.now()}`,
      type: 'mcq',
      title: `MCQ Question #${questions.filter(q => q.type === 'mcq').length + 1}`,
      questionText: '',
      options: [
        { id: '1', text: 'Option A', isCorrect: false },
        { id: '2', text: 'Option B', isCorrect: false },
        { id: '3', text: 'Option C', isCorrect: false },
        { id: '4', text: 'Option D', isCorrect: false },
      ],
      marks: 5,
      timeLimitMin: 2,
    };
    setQuestions([...questions, newMCQ]);
  };

  const addCodingQuestion = () => {
    const newCoding: CodingQuestion = {
      id: `code-${Date.now()}`,
      type: 'coding',
      title: `Coding Problem #${questions.filter(q => q.type === 'coding').length + 1}`,
      difficulty: 'Easy',
      description: '',
      inputFormat: '',
      outputFormat: '',
      constraints: '1 <= N <= 10^5',
      timeLimitSec: 1,
      timeLimitMin: 30,
      memoryLimitMb: 256,
      points: 50,
      sampleTestCases: [{ input: '', output: '', isPublic: true }]
    };
    setQuestions([...questions, newCoding]);
  };

  const updateQuestion = (index: number, updated: QuestionItem) => {
    const updatedList = [...questions];
    updatedList[index] = updated;
    setQuestions(updatedList);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const buildSubmissionConfig = () => {
    const config: Record<string, unknown> = {
      mode: eventType === 'hackathon' ? submissionMode : 'platform',
      required_fields: Object.entries(requiredFields).filter(([, v]) => v).map(([k]) => k),
      private_access: {
        is_private: isPrivate,
        secret_id: isPrivate ? secretId.trim() : '',
        secret_password: isPrivate ? secretPassword.trim() : '',
      },
      hackathon_details: eventType === 'hackathon' ? {
        problem_statement: problemStatement,
        tracks: tracks,
        judging_criteria: judgingCriteria,
      } : undefined,
      assessment_details: eventType === 'coding_contest' ? {
        assessment_mode: assessmentMode,
        duration_minutes: contestDurationMinutes,
        total_questions: questions.length,
        questions: questions,
      } : undefined
    };
    if (submissionMode === 'google_form' && eventType === 'hackathon') config.google_form_url = googleFormUrl;
    if (submissionMode === 'external_link' && eventType === 'hackathon') config.external_link_url = externalLinkUrl;
    return config;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventType) { setError('Title and event type are required'); return; }
    setSaving(true);
    setError('');

    const body = {
      title, tagline, description,
      event_type: eventType,
      banner_url: bannerUrl || null,
      prize_pool: prizePool || null,
      max_participants: maxParticipants ? Number(maxParticipants) : null,
      registration_open: registrationOpen,
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      registration_deadline: regDeadline || null,
      tags_json: tags.split(',').map(t => t.trim()).filter(Boolean),
      participation_type: participationType,
      min_team_size: Number(minTeamSize) || 1,
      max_team_size: Number(maxTeamSize) || 4,
      enter_event_url: null,
      eligibility: eligibility || 'Open to All',
      registration_fee: registrationFee || 'Free',
      registration_fields_config: regFieldsConfig,
      submission_config: buildSubmissionConfig(),
      private_access: {
        is_private: isPrivate,
        secret_id: isPrivate ? secretId.trim() : '',
        secret_password: isPrivate ? secretPassword.trim() : '',
      },
      rounds_json: eventType === 'hackathon' ? rounds.filter(r => r.title) : [],
      prizes_json: prizes.filter(p => p.rank),
      timeline_json: timeline.filter(t => t.label),
      rules_json: rules.filter(r => r.text).map(r => r.text),
      faqs_json: faqs.filter(f => f.question),
      sponsors_json: sponsors,
    };

    try {
      const res = await fetch('/api/admin/super/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to create event'); }
      else { router.push(`/super-admin/events/${data.event.id}`); }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const ic = 'w-full px-4 py-2.5 bg-[#0e0a1c] border border-white/[0.12] rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3] transition-colors [color-scheme:dark]';
  const selectStyle = 'w-full px-4 py-2.5 bg-[#0e0a1c] text-white border border-white/[0.12] rounded-xl text-sm focus:outline-none focus:border-[#E873C3] transition-colors [color-scheme:dark] cursor-pointer';
  const lc = 'text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5 block';
  const sc = 'bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-4';

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto flex flex-col gap-6">
        {}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays size={22} className="text-[#E873C3]" />
              <h1 className="text-2xl font-black text-white">Create Event</h1>
            </div>
            <p className="text-sm text-white/40 mt-0.5">Setup Hackathons with problem statements/tracks or Coding Contests with integrated MCQs & coding challenges.</p>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:-translate-y-0.5 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #E873C3, #8D37D6)', boxShadow: '0 4px 20px rgba(232,115,195,0.4)' }}>
            <Save size={15} />{saving ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">{error}</div>}

        {}
        <div className={sc}>
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">1. Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={lc}>Event Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. CosmoDex National AI Hackathon 2026" className={ic} required />
            </div>
            <div className="md:col-span-2">
              <label className={lc}>Tagline</label>
              <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Build futuristic AI & web applications in 48 hours" className={ic} />
            </div>

            <div>
              <label className={lc}>Event Type *</label>
              <select value={eventType} onChange={e => setEventType(e.target.value as 'hackathon' | 'coding_contest')} className={selectStyle}>
                <option value="hackathon" className="bg-[#0c0818] text-white">🚀 Hackathon (Themes, Problem Statements, Tracks)</option>
                <option value="coding_contest" className="bg-[#0c0818] text-white">⌨️ Coding Contest (MCQs & Coding Problems in Built-in IDE)</option>
              </select>
            </div>

            <div>
              <label className={lc}>Overall Prize Pool Display</label>
              <input value={prizePool} onChange={e => setPrizePool(e.target.value)} placeholder="e.g. ₹1,50,000 + Internship Offer" className={ic} />
            </div>
            <div>
              <label className={lc}>Tags (comma-separated)</label>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="ai, dsa, web3, beginner-friendly" className={ic} />
            </div>
          </div>
          <div>
            <label className={lc}>Full Event Description & Overview</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Provide a comprehensive introduction to the event..."
              className={ic + ' resize-none leading-relaxed'} />
          </div>
        </div>

        {}
        {eventType === 'hackathon' && (
          <div className={sc + ' border-[#E873C3]/30 bg-[#E873C3]/[0.02]'}>
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-[#E873C3]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Hackathon Problem Statements & Tracks</h2>
            </div>
            <p className="text-xs text-white/50">Upload or compose problem statements, select themes/tracks, and define evaluation rubrics.</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className={lc}>Main Problem Statement / Theme Details</label>
                <textarea
                  value={problemStatement}
                  onChange={e => setProblemStatement(e.target.value)}
                  rows={5}
                  placeholder="Detail the core challenge, objectives, and domain expectations for participants..."
                  className={ic + ' resize-none font-sans leading-relaxed'}
                />
              </div>

              {}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#E873C3] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} /> Competition Tracks / Themes
                  </span>
                  <button type="button"
                    onClick={() => setTracks([...tracks, { title: '', description: '', prize: '' }])}
                    className="text-xs font-bold text-[#E873C3] hover:underline flex items-center gap-1 cursor-pointer">
                    <Plus size={13} /> Add Track
                  </button>
                </div>
                {tracks.length === 0 ? (
                  <p className="text-xs text-white/30 italic">No custom tracks added yet. Click &quot;Add Track&quot; above to create themes.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {tracks.map((tr, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl relative">
                        <input value={tr.title} onChange={e => setTracks(tracks.map((t, idx) => idx === i ? { ...t, title: e.target.value } : t))} placeholder="Track Name (e.g. AI/ML)" className={ic} />
                        <input value={tr.description} onChange={e => setTracks(tracks.map((t, idx) => idx === i ? { ...t, description: e.target.value } : t))} placeholder="Short Track Description" className={ic} />
                        <div className="flex items-center gap-2">
                          <input value={tr.prize} onChange={e => setTracks(tracks.map((t, idx) => idx === i ? { ...t, prize: e.target.value } : t))} placeholder="Track Prize (e.g. ₹20k)" className={ic} />
                          <button type="button" onClick={() => setTracks(tracks.filter((_, idx) => idx !== i))} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#4ECDC4] uppercase tracking-wider flex items-center gap-1.5">
                    <Scale size={14} /> Judging Rubrics & Evaluation Criteria
                  </span>
                  <button type="button"
                    onClick={() => setJudgingCriteria([...judgingCriteria, { criteria: '', weight: '', description: '' }])}
                    className="text-xs font-bold text-[#4ECDC4] hover:underline flex items-center gap-1 cursor-pointer">
                    <Plus size={13} /> Add Criterion
                  </button>
                </div>
                {judgingCriteria.length === 0 ? (
                  <p className="text-xs text-white/30 italic">No evaluation rubrics added yet. Click &quot;Add Criterion&quot; to define rubrics.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {judgingCriteria.map((jc, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                        <input value={jc.criteria} onChange={e => setJudgingCriteria(judgingCriteria.map((item, idx) => idx === i ? { ...item, criteria: e.target.value } : item))} placeholder="Criteria Name (e.g. Innovation)" className={ic} />
                        <input value={jc.weight} onChange={e => setJudgingCriteria(judgingCriteria.map((item, idx) => idx === i ? { ...item, weight: e.target.value } : item))} placeholder="Weight % (e.g. 30%)" className={ic} />
                        <div className="md:col-span-2 flex items-center gap-2">
                          <input value={jc.description} onChange={e => setJudgingCriteria(judgingCriteria.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item))} placeholder="What judges look for..." className={ic} />
                          <button type="button" onClick={() => setJudgingCriteria(judgingCriteria.filter((_, idx) => idx !== i))} className="text-red-400 p-2 cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {}
        {eventType === 'coding_contest' && (
          <div className={sc + ' border-[#4ECDC4]/30 bg-[#4ECDC4]/[0.02]'}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-[#4ECDC4]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Contest Question Bank (Coding & MCQs)</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60 font-bold">Assessment Type:</span>
                <select value={assessmentMode} onChange={e => setAssessmentMode(e.target.value as 'mixed' | 'coding_only' | 'mcq_only')}
                  className="px-3 py-1.5 bg-[#0c0818] text-[#4ECDC4] border border-[#4ECDC4]/40 text-xs font-bold rounded-lg focus:outline-none [color-scheme:dark] cursor-pointer">
                  <option value="mixed" className="bg-[#0c0818] text-white">Mixed (Coding + MCQ)</option>
                  <option value="coding_only" className="bg-[#0c0818] text-white">Coding Problems Only</option>
                  <option value="mcq_only" className="bg-[#0c0818] text-white">MCQ Questions Only</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-white/50">Add questions for this contest. Questions will load automatically inside CosmoDex&apos;s built-in online IDE and test engine.</p>

            <div className="bg-gradient-to-r from-purple-950/40 to-[#0c0818] p-4 rounded-2xl border border-purple-500/30 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    Complete Contest Timing
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                      Global Timer
                    </span>
                  </h4>
                  <p className="text-xs text-white/50">Total time allowed for participants in the contest arena.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-white/60">Duration:</label>
                <div className="flex items-center gap-1.5 bg-[#05020a] border border-white/15 px-3 py-1.5 rounded-xl">
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={contestDurationMinutes}
                    onChange={(e) => setContestDurationMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-16 bg-transparent text-center font-bold text-white text-sm focus:outline-none"
                  />
                  <span className="text-xs text-white/40 font-bold">Minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  {[30, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setContestDurationMinutes(mins)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${contestDurationMinutes === mins
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setActiveQuestionTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeQuestionTab === 'all' ? 'bg-[#4ECDC4]/20 text-[#4ECDC4] border border-[#4ECDC4]/40' : 'text-white/40 hover:text-white'}`}>
                  All ({questions.length})
                </button>
                <button type="button" onClick={() => setActiveQuestionTab('mcq')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeQuestionTab === 'mcq' ? 'bg-[#4ECDC4]/20 text-[#4ECDC4] border border-[#4ECDC4]/40' : 'text-white/40 hover:text-white'}`}>
                  MCQs ({questions.filter(q => q.type === 'mcq').length})
                </button>
                <button type="button" onClick={() => setActiveQuestionTab('coding')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeQuestionTab === 'coding' ? 'bg-[#4ECDC4]/20 text-[#4ECDC4] border border-[#4ECDC4]/40' : 'text-white/40 hover:text-white'}`}>
                  Coding ({questions.filter(q => q.type === 'coding').length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                {(assessmentMode === 'mcq_only' || assessmentMode === 'mixed') && (
                  <button type="button" onClick={addMCQQuestion}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#E873C3] bg-[#E873C3]/10 border border-[#E873C3]/30 hover:bg-[#E873C3]/20 transition-all cursor-pointer">
                    <ListChecks size={13} /> + Add MCQ
                  </button>
                )}
                {(assessmentMode === 'coding_only' || assessmentMode === 'mixed') && (
                  <button type="button" onClick={addCodingQuestion}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#4ECDC4] bg-[#4ECDC4]/10 border border-[#4ECDC4]/30 hover:bg-[#4ECDC4]/20 transition-all cursor-pointer">
                    <FileCode size={13} /> + Add Coding Problem
                  </button>
                )}
              </div>
            </div>

            {}
            {questions.length === 0 ? (
              <div className="py-8 text-center text-white/30 text-xs italic border border-dashed border-white/10 rounded-xl">
                No questions added to the contest yet. Use the buttons above to add MCQs or Coding problems.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {questions
                  .filter(q => activeQuestionTab === 'all' ? true : q.type === activeQuestionTab)
                  .map((q) => {
                    const globalIdx = questions.indexOf(q);

                    if (q.type === 'mcq') {
                      return (
                        <div key={q.id} className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl flex flex-col gap-3">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E873C3]/20 text-[#E873C3] border border-[#E873C3]/30">MCQ</span>
                              <input
                                value={q.title}
                                onChange={e => {
                                  const updated = { ...q, title: e.target.value };
                                  updateQuestion(globalIdx, updated);
                                }}
                                className="bg-transparent font-bold text-sm text-white focus:outline-none focus:border-b border-[#E873C3]"
                                placeholder="MCQ Question Title"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-white/40">Points:</span>
                                <input
                                  type="number"
                                  value={q.marks ?? 5}
                                  onChange={e => updateQuestion(globalIdx, { ...q, marks: Number(e.target.value) })}
                                  className="w-14 px-2 py-0.5 bg-[#0e0a1c] border border-white/[0.1] rounded text-xs text-center text-white"
                                />
                              </div>
                              <button type="button" onClick={() => removeQuestion(globalIdx)} className="text-red-400 hover:text-red-300 cursor-pointer">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {}
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={q.questionText}
                              onChange={e => updateQuestion(globalIdx, { ...q, questionText: e.target.value })}
                              rows={2}
                              placeholder="Enter the question text..."
                              className={ic + ' resize-none'}
                            />
                            <input
                              value={q.codeSnippet || ''}
                              onChange={e => updateQuestion(globalIdx, { ...q, codeSnippet: e.target.value })}
                              placeholder="Optional code snippet for question..."
                              className={ic + ' font-mono text-xs text-purple-300'}
                            />
                          </div>

                          {}
                          <div className="flex flex-col gap-2 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-white/50 uppercase">
                                Question Options (A, B, C, D) <span className="text-white/30 font-normal normal-case">— Answer key is configured after event ends</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextNum = (q.options?.length || 0) + 1;
                                  const letter = String.fromCharCode(64 + nextNum);
                                  const newOpts = [...(q.options || []), { id: String(Date.now()), text: `Option ${letter}`, isCorrect: false }];
                                  updateQuestion(globalIdx, { ...q, options: newOpts });
                                }}
                                className="text-[11px] font-bold text-[#E873C3] hover:underline cursor-pointer"
                              >
                                + Add Option
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={opt.id || optIdx} className="flex items-center gap-2 bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-white/10 text-white/70 border border-white/10">
                                    {String.fromCharCode(65 + optIdx)}
                                  </div>
                                  <input
                                    value={opt.text}
                                    onChange={e => {
                                      const newOpts = q.options.map((o, idx) => idx === optIdx ? { ...o, text: e.target.value } : o);
                                      updateQuestion(globalIdx, { ...q, options: newOpts });
                                    }}
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                    className="w-full bg-transparent text-xs text-white focus:outline-none"
                                  />
                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newOpts = q.options.filter((_, idx) => idx !== optIdx);
                                        updateQuestion(globalIdx, { ...q, options: newOpts });
                                      }}
                                      className="text-red-400/60 hover:text-red-400 p-1 cursor-pointer"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={q.id} className="p-4 bg-white/[0.02] border border-[#4ECDC4]/20 rounded-xl flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#4ECDC4]/20 text-[#4ECDC4] border border-[#4ECDC4]/30">CODING</span>
                            <input
                              value={q.title}
                              onChange={e => updateQuestion(globalIdx, { ...q, title: e.target.value })}
                              className="bg-transparent font-bold text-sm text-white focus:outline-none focus:border-b border-[#4ECDC4]"
                              placeholder="Coding Problem Title"
                            />
                            <select
                              value={q.difficulty}
                              onChange={e => updateQuestion(globalIdx, { ...q, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' })}
                              className="px-2 py-1 bg-[#0c0818] text-white border border-white/10 rounded text-xs [color-scheme:dark] cursor-pointer"
                            >
                              <option value="Easy" className="bg-[#0c0818] text-white">Easy</option>
                              <option value="Medium" className="bg-[#0c0818] text-white">Medium</option>
                              <option value="Hard" className="bg-[#0c0818] text-white">Hard</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-white/40">Points:</span>
                              <input
                                type="number"
                                value={q.points ?? 50}
                                onChange={e => updateQuestion(globalIdx, { ...q, points: Number(e.target.value) })}
                                className="w-14 px-2 py-0.5 bg-[#0e0a1c] border border-white/[0.1] rounded text-xs text-center text-white"
                              />
                            </div>
                            <button type="button" onClick={() => removeQuestion(globalIdx)} className="text-red-400 hover:text-red-300 cursor-pointer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                            <label className={lc}>Problem Description</label>
                            <textarea
                              value={q.description}
                              onChange={e => updateQuestion(globalIdx, { ...q, description: e.target.value })}
                              rows={3}
                              placeholder="Write problem statement details..."
                              className={ic + ' resize-none'}
                            />
                          </div>
                          <div>
                            <label className={lc}>Input Format</label>
                            <input value={q.inputFormat} onChange={e => updateQuestion(globalIdx, { ...q, inputFormat: e.target.value })} placeholder="e.g. Line 1: N integers" className={ic} />
                          </div>
                          <div>
                            <label className={lc}>Output Format</label>
                            <input value={q.outputFormat} onChange={e => updateQuestion(globalIdx, { ...q, outputFormat: e.target.value })} placeholder="e.g. Single integer output" className={ic} />
                          </div>
                          <div>
                            <label className={lc}>Constraints</label>
                            <input value={q.constraints} onChange={e => updateQuestion(globalIdx, { ...q, constraints: e.target.value })} placeholder="1 <= N <= 10^5" className={ic} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className={lc}>Time Limit (sec)</label>
                              <input type="number" value={q.timeLimitSec} onChange={e => updateQuestion(globalIdx, { ...q, timeLimitSec: Number(e.target.value) })} className={ic} />
                            </div>
                            <div>
                              <label className={lc}>Memory Limit (MB)</label>
                              <input type="number" value={q.memoryLimitMb} onChange={e => updateQuestion(globalIdx, { ...q, memoryLimitMb: Number(e.target.value) })} className={ic} />
                            </div>
                          </div>
                        </div>

                        {}
                        <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-lg flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white/50 uppercase">Sample Test Cases</span>
                            <button
                              type="button"
                              onClick={() => {
                                const tc = [...q.sampleTestCases, { input: '', output: '', isPublic: true }];
                                updateQuestion(globalIdx, { ...q, sampleTestCases: tc });
                              }}
                              className="text-[11px] text-[#4ECDC4] font-bold hover:underline cursor-pointer"
                            >
                              + Add Sample Testcase
                            </button>
                          </div>
                          {q.sampleTestCases.map((tc, tcIdx) => (
                            <div key={tcIdx} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center bg-white/[0.02] p-2 rounded border border-white/[0.04]">
                              <input
                                value={tc.input}
                                onChange={e => {
                                  const newTc = q.sampleTestCases.map((item, idx) => idx === tcIdx ? { ...item, input: e.target.value } : item);
                                  updateQuestion(globalIdx, { ...q, sampleTestCases: newTc });
                                }}
                                placeholder="Sample Input"
                                className={ic + ' font-mono text-xs'}
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  value={tc.output}
                                  onChange={e => {
                                    const newTc = q.sampleTestCases.map((item, idx) => idx === tcIdx ? { ...item, output: e.target.value } : item);
                                    updateQuestion(globalIdx, { ...q, sampleTestCases: newTc });
                                  }}
                                  placeholder="Sample Output"
                                  className={ic + ' font-mono text-xs'}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newTc = q.sampleTestCases.filter((_, idx) => idx !== tcIdx);
                                    updateQuestion(globalIdx, { ...q, sampleTestCases: newTc });
                                  }}
                                  className="text-red-400 p-1 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {}
        <div className={sc}>
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">3. Schedule & Deadlines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <DateTimePicker label="Starts At" value={startsAt} onChange={setStartsAt} />
            <DateTimePicker label="Ends At" value={endsAt} onChange={setEndsAt} />
            <DateTimePicker label="Reg Deadline" value={regDeadline} onChange={setRegDeadline} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Max Registrations</label>
              <input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} placeholder="Leave blank for unlimited" className={ic} />
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button type="button" onClick={() => setRegistrationOpen(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${registrationOpen ? 'bg-[#E873C3]' : 'bg-white/10'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${registrationOpen ? 'left-7' : 'left-1'}`} />
              </button>
              <span className="text-sm text-white/60 font-medium">Open Registrations Immediately</span>
            </div>
          </div>
        </div>

        {}
        <div className={sc}>
          <h2 className="text-xs font-bold text-[#E873C3] uppercase tracking-widest flex items-center gap-1.5">
            <UsersRound size={14} /> 4. Participation & Eligibility
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={lc}>Participation Mode</label>
              <select value={participationType} onChange={e => setParticipationType(e.target.value)} className={selectStyle}>
                <option value="individual" className="bg-[#0c0818] text-white">👤 Individual (Solo)</option>
                <option value="team" className="bg-[#0c0818] text-white">👥 Team Event</option>
              </select>
            </div>
            {participationType === 'team' && (<>
              <div>
                <label className={lc}>Min Team Size</label>
                <input type="number" value={minTeamSize} onChange={e => setMinTeamSize(e.target.value)} min="1" max="10" className={ic} />
              </div>
              <div>
                <label className={lc}>Max Team Size</label>
                <input type="number" value={maxTeamSize} onChange={e => setMaxTeamSize(e.target.value)} min="1" max="10" className={ic} />
              </div>
            </>)}
            <div>
              <label className={lc}>Eligibility</label>
              <input value={eligibility} onChange={e => setEligibility(e.target.value)} placeholder="Open to All Students & Professionals" className={ic} />
            </div>
          </div>
        </div>

        {}
        <div className={sc}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-[#E873C3] uppercase tracking-widest flex items-center gap-1.5">
                <ListChecks size={14} /> Candidate Registration Form Fields
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Configure which fields candidates will see and fill in the registration modal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
            {[
              { key: 'phone', label: 'Mobile / Phone Number', description: 'Collect candidate phone number for contact and updates' },
              { key: 'college_org', label: 'College / Organization Name', description: 'Institute, university, or company name' },
              { key: 'degree', label: 'Degree', description: 'Degree title (e.g. B.Tech, B.Sc)' },
              { key: 'branch', label: 'Branch / Specialization', description: 'Field of study (e.g. Computer Science, AI)' },
              { key: 'year_of_study', label: 'Year of Study', description: 'Current academic year' },
              { key: 'city_state', label: 'City & State', description: 'Location details' },
              { key: 'gender', label: 'Gender', description: 'Candidate gender selection' },
              { key: 'github_url', label: 'GitHub Profile URL', description: 'Link to candidate GitHub profile' },
              { key: 'linkedin_url', label: 'LinkedIn Profile URL', description: 'Link to candidate LinkedIn profile' },
              { key: 'portfolio_url', label: 'Portfolio Website URL', description: 'Link to personal website or portfolio' },
              { key: 'resume_url', label: 'Resume Drive Link', description: 'Google Drive or PDF link to candidate resume' },
              { key: 'coding_handle', label: 'Coding Handle', description: 'Codeforces / LeetCode username' },
              { key: 'preferred_language', label: 'Preferred Primary Language', description: 'Choice of primary programming language' },
              { key: 'referral_source', label: 'Referral Source', description: 'How candidate discovered the event' },
            ].map(({ key, label, description }) => {
              const isEnabled = regFieldsConfig[key]?.enabled ?? true;
              const isRequired = regFieldsConfig[key]?.required ?? false;
              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-xl border transition-all ${isEnabled ? 'bg-white/[0.03] border-white/[0.12]' : 'bg-white/[0.01] border-white/[0.05] opacity-60'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{label}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setRegFieldsConfig((prev) => ({
                              ...prev,
                              [key]: {
                                enabled: checked,
                                required: checked ? (prev[key]?.required ?? false) : false,
                              },
                            }));
                          }}
                          className="rounded accent-[#E873C3] cursor-pointer"
                        />
                        Enabled
                      </label>

                      {isEnabled && (
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#E873C3] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isRequired}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setRegFieldsConfig((prev) => ({
                                ...prev,
                                [key]: {
                                  enabled: true,
                                  required: checked,
                                },
                              }));
                            }}
                            className="rounded accent-[#E873C3] cursor-pointer"
                          />
                          Required *
                        </label>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-white/40">{description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {}
        {eventType === 'hackathon' && (
          <div className={sc}>
            <h2 className="text-xs font-bold text-[#4ECDC4] uppercase tracking-widest flex items-center gap-1.5">
              <FileText size={14} /> 5. Project Submission Method
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {([
                { mode: 'platform', icon: CheckSquare, label: 'Platform Project Form', desc: 'CosmoDex built-in project submission form (GitHub, demo, video, description)' },
                { mode: 'google_form', icon: Globe, label: 'Google Form', desc: 'Redirect participants to an external Google Form' },
                { mode: 'external_link', icon: LinkIcon, label: 'External Portal', desc: 'DevPost, Unstop, or custom external portal' },
              ] as { mode: SubmissionMode; icon: typeof FileText; label: string; desc: string }[]).map(({ mode, icon: Icon, label, desc }) => (
                <button key={mode} type="button" onClick={() => setSubmissionMode(mode)}
                  className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-all cursor-pointer ${submissionMode === mode
                    ? 'border-[#4ECDC4]/60 bg-[#4ECDC4]/10'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'}`}>
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={submissionMode === mode ? 'text-[#4ECDC4]' : 'text-white/40'} />
                    <span className={`text-sm font-bold ${submissionMode === mode ? 'text-[#4ECDC4]' : 'text-white/70'}`}>{label}</span>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">{desc}</p>
                </button>
              ))}
            </div>

            {submissionMode === 'google_form' && (
              <div>
                <label className={lc}>Google Form URL *</label>
                <input value={googleFormUrl} onChange={e => setGoogleFormUrl(e.target.value)}
                  placeholder="https://forms.gle/xxxxxxxxxxxx" className={ic} />
              </div>
            )}
            {submissionMode === 'external_link' && (
              <div>
                <label className={lc}>External Submission URL *</label>
                <input value={externalLinkUrl} onChange={e => setExternalLinkUrl(e.target.value)}
                  placeholder="https://unstop.com/your-event" className={ic} />
              </div>
            )}
            {submissionMode === 'platform' && (
              <div>
                <label className={lc}>Required Fields on Project Form</label>
                <div className="flex flex-wrap gap-3">
                  {(Object.entries(requiredFields) as [keyof typeof requiredFields, boolean][]).map(([field, enabled]) => (
                    <button key={field} type="button"
                      onClick={() => setRequiredFields(f => ({ ...f, [field]: !f[field] }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${enabled
                        ? 'border-[#4ECDC4]/60 bg-[#4ECDC4]/10 text-[#4ECDC4]'
                        : 'border-white/[0.08] bg-white/[0.02] text-white/40'}`}>
                      {field.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {}
        {eventType === 'hackathon' && (
          <div className={sc}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#E873C3] uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={14} /> Competition Rounds
              </h2>
              <button type="button"
                onClick={() => setRounds(r => [...r, { id: `r${r.length + 1}`, title: '', description: '', type: 'coding', assessmentMode: 'mixed', starts_at: '', ends_at: '', action_url: '' }])}
                className="flex items-center gap-1 text-xs font-bold text-[#E873C3] hover:underline cursor-pointer">
                <Plus size={13} /> Add Round
              </button>
            </div>
            {rounds.length === 0 ? (
              <p className="text-xs text-white/30 italic">No custom rounds configured. Click &quot;Add Round&quot; above to create competition stages.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {rounds.map((round, i) => (
                  <div key={i} className="p-4 bg-white/[0.03] border border-white/[0.07] rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#E873C3]">Round {i + 1}</span>
                      <button type="button" onClick={() => setRounds(r => r.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={round.title}
                        onChange={e => setRounds(r => r.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                        placeholder="Round Title (e.g. Round 1: Online Screening)" className={ic} />
                      <select value={round.type}
                        onChange={e => setRounds(r => r.map((x, j) => j === i ? { ...x, type: e.target.value as RoundEntry['type'] } : x))}
                        className={selectStyle}>
                        <option value="coding" className="bg-[#0c0818] text-white">Coding Challenge</option>
                        <option value="quiz" className="bg-[#0c0818] text-white">Online Quiz / MCQ</option>
                        <option value="submission" className="bg-[#0c0818] text-white">Project Submission</option>
                        <option value="interview" className="bg-[#0c0818] text-white">Presentation / Finale</option>
                        <option value="custom" className="bg-[#0c0818] text-white">Custom Stage</option>
                      </select>
                    </div>
                    <input value={round.description}
                      onChange={e => setRounds(r => r.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                      placeholder="Short round instructions..." className={ic} />
                    <div className="grid grid-cols-2 gap-3">
                      <DateTimePicker label="Round Starts At" value={round.starts_at}
                        onChange={v => setRounds(r => r.map((x, j) => j === i ? { ...x, starts_at: v } : x))} />
                      <DateTimePicker label="Round Ends At" value={round.ends_at}
                        onChange={v => setRounds(r => r.map((x, j) => j === i ? { ...x, ends_at: v } : x))} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {}
        <div className={sc}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#FFD700] uppercase tracking-widest flex items-center gap-1.5">
              <Trophy size={14} /> Prizes & Rewards
            </h2>
            <button type="button" onClick={() => setPrizes(p => [...p, { rank: '', prize: '', perks: '', badge_name: '' }])}
              className="flex items-center gap-1 text-xs font-bold text-[#FFD700] hover:underline cursor-pointer">
              <Plus size={13} /> Add Prize Tier
            </button>
          </div>
          {prizes.length === 0 ? (
            <p className="text-xs text-white/30 italic">No prize tiers added. Click &quot;Add Prize Tier&quot; above.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {prizes.map((p, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                  <input value={p.rank} onChange={e => setPrizes(pr => pr.map((x, j) => j === i ? { ...x, rank: e.target.value } : x))}
                    placeholder="Rank (e.g. 1st Place)" className={ic} />
                  <input value={p.prize} onChange={e => setPrizes(pr => pr.map((x, j) => j === i ? { ...x, prize: e.target.value } : x))}
                    placeholder="Prize (e.g. ₹50,000)" className={ic} />
                  <input value={p.perks} onChange={e => setPrizes(pr => pr.map((x, j) => j === i ? { ...x, perks: e.target.value } : x))}
                    placeholder="Perks & Certificates" className={ic} />
                  <div className="flex items-center gap-2">
                    <input value={p.badge_name} onChange={e => setPrizes(pr => pr.map((x, j) => j === i ? { ...x, badge_name: e.target.value } : x))}
                      placeholder="Badge Name" className={ic} />
                    <button type="button" onClick={() => setPrizes(pr => pr.filter((_, j) => j !== i))} className="text-red-400 cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={sc}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#F5A623] uppercase tracking-widest flex items-center gap-1.5">
                <CalendarDays size={14} /> Timeline
              </h2>
              <button type="button" onClick={() => setTimeline(t => [...t, { label: '', date: '', done: false }])}
                className="text-xs font-bold text-[#F5A623] hover:underline flex items-center gap-1 cursor-pointer">
                <Plus size={13} /> Add Milestone
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {timeline.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={entry.label}
                    onChange={e => setTimeline(t => t.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                    placeholder="Milestone label" className={ic + ' flex-1'} />
                  <input type="datetime-local" value={entry.date}
                    onChange={e => setTimeline(t => t.map((x, j) => j === i ? { ...x, date: e.target.value } : x))}
                    className={ic + ' flex-1'} />
                  <button type="button" onClick={() => setTimeline(t => t.filter((_, j) => j !== i))} className="text-red-400 cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={sc}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <HelpCircle size={13} /> FAQs
              </h2>
              <button type="button" onClick={() => setFaqs(f => [...f, { question: '', answer: '' }])}
                className="text-xs font-bold text-white/50 hover:text-white flex items-center gap-1 cursor-pointer">
                <Plus size={13} /> Add FAQ
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq, i) => (
                <div key={i} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <input value={faq.question}
                      onChange={e => setFaqs(f => f.map((x, j) => j === i ? { ...x, question: e.target.value } : x))}
                      placeholder="Question..." className={ic} />
                    <button type="button" onClick={() => setFaqs(f => f.filter((_, j) => j !== i))} className="text-red-400 ml-2 cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <input value={faq.answer}
                    onChange={e => setFaqs(f => f.map((x, j) => j === i ? { ...x, answer: e.target.value } : x))}
                    placeholder="Answer..." className={ic} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {}
        <div className="flex justify-end gap-3 pb-8">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/50 bg-white/[0.04] hover:bg-white/[0.08] transition-all cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:-translate-y-0.5 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #E873C3, #8D37D6)', boxShadow: '0 4px 20px rgba(232,115,195,0.4)' }}>
            <Save size={15} />{saving ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
