import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getAllBlogs, createBlog } from '@/lib/blogs';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  try {
    const blogs = await getAllBlogs();
    return NextResponse.json({ success: true, blogs });
  } catch (err) {
    console.error('[GET /api/admin/blogs] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const blog = await createBlog(body);
    return NextResponse.json({ success: true, blog }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/blogs] Error:', err);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}
