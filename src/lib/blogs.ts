import prisma from '@/lib/prisma';
import { BLOG_POSTS } from '@/data/blogData';

export interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Engineering' | 'Product' | 'Tutorials' | 'News' | string;
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
  createdAt?: string;
  updatedAt?: string;
}

interface RawDbBlog {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author_name: string;
  author_role: string;
  author_avatar: string;
  cover_image: string;
  read_time: string;
  published_at: string;
  featured: boolean;
  tags: string[];
  created_at?: Date;
  updated_at?: Date;
}

function mapDbToBlogPost(row: RawDbBlog): BlogPostItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    author: {
      name: row.author_name,
      role: row.author_role,
      avatar: row.author_avatar,
    },
    coverImage: row.cover_image,
    readTime: row.read_time,
    publishedAt: row.published_at,
    featured: Boolean(row.featured),
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

async function ensureTableAndSeed() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS blogs (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Engineering',
        author_name TEXT NOT NULL,
        author_role TEXT NOT NULL,
        author_avatar TEXT NOT NULL,
        cover_image TEXT NOT NULL,
        read_time TEXT NOT NULL,
        published_at TEXT NOT NULL,
        featured BOOLEAN NOT NULL DEFAULT false,
        tags TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const countRows = (await prisma.$queryRawUnsafe('SELECT count(*)::int as count FROM blogs;')) as { count: number }[];
    const count = countRows[0]?.count ?? 0;

    if (count === 0) {
      for (const p of BLOG_POSTS) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO blogs (
            id, slug, title, excerpt, content, category, author_name, author_role, author_avatar, cover_image, read_time, published_at, featured, tags
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (slug) DO NOTHING;`,
          p.id,
          p.slug,
          p.title,
          p.excerpt,
          p.content,
          p.category,
          p.author.name,
          p.author.role,
          p.author.avatar,
          p.coverImage,
          p.readTime,
          p.publishedAt,
          Boolean(p.featured),
          p.tags || []
        );
      }
    }
  } catch (err) {
    console.error('[blogs] ensureTableAndSeed error:', err);
  }
}

export async function getAllBlogs(): Promise<BlogPostItem[]> {
  try {
    await ensureTableAndSeed();
    const rows = (await prisma.$queryRawUnsafe(
      'SELECT * FROM blogs ORDER BY created_at DESC;'
    )) as RawDbBlog[];
    return rows.map(mapDbToBlogPost);
  } catch (err) {
    console.error('[getAllBlogs] error:', err);
    return BLOG_POSTS.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      category: p.category,
      author: p.author,
      coverImage: p.coverImage,
      readTime: p.readTime,
      publishedAt: p.publishedAt,
      featured: Boolean(p.featured),
      tags: p.tags,
    }));
  }
}

export async function getBlogBySlug(slug: string): Promise<BlogPostItem | null> {
  try {
    await ensureTableAndSeed();
    const rows = (await prisma.$queryRawUnsafe(
      'SELECT * FROM blogs WHERE slug = $1 LIMIT 1;',
      slug
    )) as RawDbBlog[];
    if (rows.length > 0) {
      return mapDbToBlogPost(rows[0]);
    }
  } catch (err) {
    console.error('[getBlogBySlug] error:', err);
  }
  const fallback = BLOG_POSTS.find((p) => p.slug === slug);
  if (fallback) {
    return {
      id: fallback.id,
      slug: fallback.slug,
      title: fallback.title,
      excerpt: fallback.excerpt,
      content: fallback.content,
      category: fallback.category,
      author: fallback.author,
      coverImage: fallback.coverImage,
      readTime: fallback.readTime,
      publishedAt: fallback.publishedAt,
      featured: Boolean(fallback.featured),
      tags: fallback.tags,
    };
  }
  return null;
}

export async function createBlog(data: Omit<BlogPostItem, 'id'> & { id?: string }): Promise<BlogPostItem> {
  await ensureTableAndSeed();
  const id = data.id || `post-${Date.now()}`;
  const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const publishedAt = data.publishedAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (data.featured) {
    await prisma.$executeRawUnsafe('UPDATE blogs SET featured = false WHERE featured = true;').catch(() => {});
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO blogs (
      id, slug, title, excerpt, content, category, author_name, author_role, author_avatar, cover_image, read_time, published_at, featured, tags
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`,
    id,
    slug,
    data.title,
    data.excerpt,
    data.content,
    data.category || 'Engineering',
    data.author?.name || 'CosmoDex Team',
    data.author?.role || 'Contributor',
    data.author?.avatar || '/images/avatars/nebula.webp',
    data.coverImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
    data.readTime || '4 min read',
    publishedAt,
    Boolean(data.featured),
    data.tags || []
  );

  const created = await getBlogBySlug(slug);
  if (!created) {
    throw new Error('Failed to retrieve newly created blog post');
  }
  return created;
}

export async function updateBlog(id: string, data: Partial<BlogPostItem>): Promise<BlogPostItem> {
  await ensureTableAndSeed();

  if (data.featured) {
    await prisma.$executeRawUnsafe('UPDATE blogs SET featured = false WHERE featured = true AND id != $1;', id).catch(() => {});
  }

  await prisma.$executeRawUnsafe(
    `UPDATE blogs SET
      title = COALESCE($1, title),
      slug = COALESCE($2, slug),
      excerpt = COALESCE($3, excerpt),
      content = COALESCE($4, content),
      category = COALESCE($5, category),
      author_name = COALESCE($6, author_name),
      author_role = COALESCE($7, author_role),
      author_avatar = COALESCE($8, author_avatar),
      cover_image = COALESCE($9, cover_image),
      read_time = COALESCE($10, read_time),
      published_at = COALESCE($11, published_at),
      featured = COALESCE($12, featured),
      tags = COALESCE($13, tags),
      updated_at = NOW()
    WHERE id = $14;`,
    data.title ?? null,
    data.slug ?? null,
    data.excerpt ?? null,
    data.content ?? null,
    data.category ?? null,
    data.author?.name ?? null,
    data.author?.role ?? null,
    data.author?.avatar ?? null,
    data.coverImage ?? null,
    data.readTime ?? null,
    data.publishedAt ?? null,
    data.featured !== undefined ? Boolean(data.featured) : null,
    data.tags ?? null,
    id
  );

  const rows = (await prisma.$queryRawUnsafe('SELECT * FROM blogs WHERE id = $1 LIMIT 1;', id)) as RawDbBlog[];
  if (rows.length === 0) {
    throw new Error('Blog not found after update');
  }
  return mapDbToBlogPost(rows[0]);
}

export async function deleteBlog(id: string): Promise<boolean> {
  await ensureTableAndSeed();
  await prisma.$executeRawUnsafe('DELETE FROM blogs WHERE id = $1;', id);
  return true;
}
