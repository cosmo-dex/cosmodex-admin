export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Engineering' | 'Product' | 'Tutorials' | 'News';
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  coverImage: string;
  readTime: string;
  publishedAt: string;
  featured?: boolean;
  tags: string[];
}

export const BLOG_POSTS: BlogPost[] = [];
