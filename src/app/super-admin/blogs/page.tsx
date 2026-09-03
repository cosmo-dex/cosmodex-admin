'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import CustomSelect from '@/components/ui/CustomSelect';
import {
  Newspaper,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  Tag,
  CheckCircle2,
  X,
  Loader2,
  FileText,
} from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  coverImage: string;
  readTime: string;
  publishedAt: string;
  featured: boolean;
  tags: string[];
}

const CATEGORIES = ['All', 'Engineering', 'Tutorials', 'Product', 'News'];

const CATEGORY_SELECT_OPTIONS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Tutorials', label: 'Tutorials' },
  { value: 'Product', label: 'Product' },
  { value: 'News', label: 'News' },
];

const AVATAR_SELECT_OPTIONS = [
  { value: '/images/avatars/nebula.webp', label: 'Nebula Avatar', image: '/images/avatars/nebula.webp' },
  { value: '/images/avatars/nova.webp', label: 'Nova Avatar', image: '/images/avatars/nova.webp' },
  { value: '/images/avatars/quasar.webp', label: 'Quasar Avatar', image: '/images/avatars/quasar.webp' },
  { value: '/images/avatars/pulsar.webp', label: 'Pulsar Avatar', image: '/images/avatars/pulsar.webp' },
];

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('Engineering');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formAuthorName, setFormAuthorName] = useState('Shubham gharte');
  const [formAuthorRole, setFormAuthorRole] = useState('Lead Architect & Founder');
  const [formAuthorAvatar, setFormAuthorAvatar] = useState('/images/avatars/nebula.webp');
  const [formCoverImage, setFormCoverImage] = useState('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop');
  const [formReadTime, setFormReadTime] = useState('5 min read');
  const [formTags, setFormTags] = useState('System Design, Architecture');
  const [formFeatured, setFormFeatured] = useState(false);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blogs');
      const data = await res.json();
      if (data.blogs) {
        setBlogs(data.blogs);
      }
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/blogs')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        if (Array.isArray(data.blogs)) {
          setBlogs(data.blogs);
        }
      })
      .catch((err) => console.error('Failed to fetch blogs:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isModalOpen && typeof window !== 'undefined') {
      const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
      if (lenis) {
        lenis.stop();
        return () => {
          lenis.start();
        };
      }
    }
  }, [isModalOpen]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormTitle(val);
    if (!editingId) {
      setFormSlug(generateSlug(val));
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormSlug('');
    setFormCategory('Engineering');
    setFormExcerpt('');
    setFormContent('# New Article Title\n\nWrite your blog post content here using Markdown...');
    setFormAuthorName('Shubham gharte');
    setFormAuthorRole('Lead Architect & Founder');
    setFormAuthorAvatar('/images/avatars/nebula.webp');
    setFormCoverImage('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop');
    setFormReadTime('5 min read');
    setFormTags('WebSockets, System Design');
    setFormFeatured(false);
    setErrorMsg('');
    setActiveTab('write');
    setIsModalOpen(true);
  };

  const openEditModal = (blog: BlogPost) => {
    setEditingId(blog.id);
    setFormTitle(blog.title);
    setFormSlug(blog.slug);
    setFormCategory(blog.category);
    setFormExcerpt(blog.excerpt);
    setFormContent(blog.content);
    setFormAuthorName(blog.author.name);
    setFormAuthorRole(blog.author.role);
    setFormAuthorAvatar(blog.author.avatar);
    setFormCoverImage(blog.coverImage);
    setFormReadTime(blog.readTime);
    setFormTags(blog.tags ? blog.tags.join(', ') : '');
    setFormFeatured(Boolean(blog.featured));
    setErrorMsg('');
    setActiveTab('write');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formTitle.trim() ||
      !formSlug.trim() ||
      !formExcerpt.trim() ||
      !formContent.trim() ||
      !formCoverImage.trim() ||
      !formTags.trim() ||
      !formAuthorName.trim() ||
      !formAuthorRole.trim() ||
      !formReadTime.trim()
    ) {
      setErrorMsg('All fields marked with * are compulsory. Please fill out all required fields.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: formTitle,
      slug: formSlug || generateSlug(formTitle),
      category: formCategory,
      excerpt: formExcerpt,
      content: formContent,
      author: {
        name: formAuthorName,
        role: formAuthorRole,
        avatar: formAuthorAvatar,
      },
      coverImage: formCoverImage,
      readTime: formReadTime,
      featured: formFeatured,
      tags: tagsArray,
    };

    try {
      const url = editingId ? `/api/admin/blogs/${editingId}` : '/api/admin/blogs';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to save blog post');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(editingId ? 'Blog article updated successfully!' : 'New blog article created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsModalOpen(false);
      fetchBlogs();
    } catch (err) {
      console.error('Error saving blog:', err);
      setErrorMsg('An error occurred while saving the post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('Blog post deleted.');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchBlogs();
      }
    } catch (err) {
      console.error('Failed to delete blog:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchesCat = selectedCategory === 'All' || b.category === selectedCategory;
      const matchesQuery =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.tags && b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesCat && matchesQuery;
    });
  }, [blogs, selectedCategory, searchQuery]);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12">
        {/* Top Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#E873C3] uppercase tracking-widest mb-1">
              <Newspaper size={14} />
              <span>Content Management</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Blog & Articles Portal</h1>
            <p className="text-sm text-white/50">Publish, update, and manage technical articles and platform announcements.</p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#E873C3] via-[#D95FD1] to-[#8D37D6] shadow-[0_0_20px_rgba(232,115,195,0.4)] hover:shadow-[0_0_30px_rgba(232,115,195,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus size={18} />
            <span>Create New Article</span>
          </button>
        </div>

        {/* Global Alert Notification */}
        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400 animate-fadeIn">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Total Articles</p>
              <p className="text-3xl font-black text-white">{blogs.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#E873C3]/10 border border-[#E873C3]/30 flex items-center justify-center text-[#E873C3]">
              <FileText size={20} />
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Categories</p>
              <p className="text-3xl font-black text-white">{CATEGORIES.length - 1}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#8D37D6]/10 border border-[#8D37D6]/30 flex items-center justify-center text-[#8D37D6]">
              <Tag size={20} />
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Featured Article</p>
              <p className="text-sm font-bold text-[#38bdf8] truncate max-w-[180px]">
                {blogs.find((b) => b.featured)?.title || 'None Set'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
              <Sparkles size={20} />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#E873C3] text-white shadow-[0_0_12px_rgba(232,115,195,0.4)]'
                    : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles or tags..."
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3] transition-all"
            />
          </div>
        </div>

        {/* Blog Post List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-[#E873C3] animate-spin" />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <Newspaper size={40} className="mx-auto text-white/20 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No articles found</h3>
            <p className="text-xs text-white/40 mb-4">Try adjusting your search query or publish a new article.</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E873C3] cursor-pointer"
            >
              <Plus size={14} /> Create Article
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                className="group relative bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
              >
                {/* Cover Image */}
                <div className="relative h-44 w-full bg-black/40 overflow-hidden">
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06020f] via-transparent to-transparent" />

                  {/* Category & Featured Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/20 text-[#38bdf8]">
                      {blog.category}
                    </span>
                    {blog.featured && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#E873C3]/80 backdrop-blur-md text-white flex items-center gap-1 shadow-[0_0_10px_rgba(232,115,195,0.5)]">
                        <Sparkles size={10} /> Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#E873C3] transition-colors line-clamp-2 mb-2 leading-snug">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-white/50 line-clamp-2 mb-4 leading-relaxed">{blog.excerpt}</p>
                  </div>

                  {/* Footer Meta & Actions */}
                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={blog.author?.avatar || '/images/avatars/nebula.webp'}
                        alt={blog.author?.name}
                        className="w-6 h-6 rounded-full border border-white/20"
                      />
                      <span className="text-xs text-white/70 font-semibold">{blog.author?.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/blog/${blog.slug}`}
                        target="_blank"
                        className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-white/70 hover:text-white transition-colors"
                        title="View Live Article"
                      >
                        <ExternalLink size={14} />
                      </Link>

                      <button
                        onClick={() => openEditModal(blog)}
                        className="p-2 rounded-lg bg-[#E873C3]/10 hover:bg-[#E873C3]/20 text-[#E873C3] transition-colors cursor-pointer"
                        title="Edit Article"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => setDeletingId(blog.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        title="Delete Article"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Blog Modal ── */}
      {isModalOpen && (
        <div data-lenis-prevent className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div data-lenis-prevent className="relative w-full max-w-4xl bg-[#0b061a] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] my-auto max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header (Pinned) */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E873C3] to-[#8D37D6] flex items-center justify-center text-white">
                  <Newspaper size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    {editingId ? 'Edit Blog Article' : 'Publish New Blog Article'}
                  </h2>
                  <p className="text-xs text-white/50">Fill out details below. Markdown syntax is supported for main content.</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400 shrink-0">
                {errorMsg}
              </div>
            )}

            {/* Form wrapping scrollable content and pinned footer */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              {/* Scrollable Form Body */}
              <div data-lenis-prevent className="flex-1 overflow-y-auto space-y-5 pr-2.5 pb-4 scrollbar-thin">
                {/* Title & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Article Title *</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={handleTitleChange}
                      placeholder="e.g. Building Real-Time 1v1 Battle Arena"
                      required
                      className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">URL Slug *</label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="e.g. building-real-time-1v1-battle-arena"
                      required
                      className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]"
                    />
                  </div>
                </div>

                {/* Category, Read Time & Featured */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                      Category <span className="text-[#E873C3]">*</span>
                    </label>
                    <CustomSelect
                      value={formCategory}
                      onChange={(val) => setFormCategory(val)}
                      options={CATEGORY_SELECT_OPTIONS}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                      Estimated Read Time <span className="text-[#E873C3]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formReadTime}
                      onChange={(e) => setFormReadTime(e.target.value)}
                      placeholder="e.g. 5 min read"
                      required
                      className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-5">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formFeatured}
                        onChange={(e) => setFormFeatured(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E873C3]" />
                    </label>
                    <span className="text-xs font-bold text-white/80">Set as Featured Post</span>
                  </div>
                </div>

                {/* Excerpt */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                    Short Summary (Excerpt) <span className="text-[#E873C3]">*</span>
                  </label>
                  <textarea
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    rows={2}
                    required
                    placeholder="Brief 1-2 sentence overview shown in article cards..."
                    className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]"
                  />
                </div>

                {/* Cover Image & Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                      Cover Image URL <span className="text-[#E873C3]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formCoverImage}
                      onChange={(e) => setFormCoverImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      required
                      className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                      Tags (comma separated) <span className="text-[#E873C3]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="WebSockets, System Design, Architecture"
                      required
                      className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3]"
                    />
                  </div>
                </div>

                {/* Author Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                      Author Name <span className="text-[#E873C3]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formAuthorName}
                      onChange={(e) => setFormAuthorName(e.target.value)}
                      placeholder="Shubham gharte"
                      required
                      className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E873C3]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                      Author Role <span className="text-[#E873C3]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formAuthorRole}
                      onChange={(e) => setFormAuthorRole(e.target.value)}
                      placeholder="Lead Architect & Founder"
                      required
                      className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E873C3]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                      Author Avatar <span className="text-[#E873C3]">*</span>
                    </label>
                    <CustomSelect
                      value={formAuthorAvatar}
                      onChange={(val) => setFormAuthorAvatar(val)}
                      options={AVATAR_SELECT_OPTIONS}
                      direction="up"
                    />
                  </div>
                </div>

                {/* Article Content (Markdown) with Write & Preview Tabs */}
                <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Full Content (Markdown) *</label>

                    <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setActiveTab('write')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'write' ? 'bg-[#E873C3] text-white' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'preview' ? 'bg-[#E873C3] text-white' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {activeTab === 'write' ? (
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      rows={8}
                      required
                      placeholder="# Article Heading&#10;&#10;Write your markdown content here..."
                      className="w-full bg-[#06020f] border border-white/10 rounded-xl p-4 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E873C3] leading-relaxed resize-y"
                    />
                  ) : (
                    <div data-lenis-prevent className="w-full min-h-[220px] bg-[#06020f] border border-white/10 rounded-xl p-6 text-white text-sm leading-relaxed overflow-y-auto space-y-4">
                      <div className="prose prose-invert max-w-none">
                        {formContent.split('\n\n').map((block, idx) => {
                          if (block.startsWith('# ')) return <h1 key={idx} className="text-2xl font-bold text-white border-b border-white/10 pb-2">{block.replace('# ', '')}</h1>;
                          if (block.startsWith('## ')) return <h2 key={idx} className="text-xl font-bold text-[#38bdf8]">{block.replace('## ', '')}</h2>;
                          if (block.startsWith('### ')) return <h3 key={idx} className="text-lg font-bold text-[#E873C3]">{block.replace('### ', '')}</h3>;
                          return <p key={idx} className="text-white/80">{block}</p>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons (Pinned at Bottom) */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-2 shrink-0 bg-[#0b061a]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#E873C3] via-[#D95FD1] to-[#8D37D6] shadow-[0_0_20px_rgba(232,115,195,0.4)] hover:shadow-[0_0_30px_rgba(232,115,195,0.6)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingId ? 'Save Changes' : 'Publish Article'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0b061a] border border-white/15 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 mx-auto flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Delete Blog Article?</h3>
            <p className="text-xs text-white/50">This action cannot be undone. The article will be permanently removed from the database.</p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
