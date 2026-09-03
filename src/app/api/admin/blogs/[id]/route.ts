import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { updateBlog, deleteBlog } from '@/lib/blogs';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const updated = await updateBlog(id, body);
    return NextResponse.json({ success: true, blog: updated });
  } catch (err) {
    console.error('[PUT /api/admin/blogs/[id]] Error:', err);
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    await deleteBlog(id);
    return NextResponse.json({ success: true, deleted: id });
  } catch (err) {
    console.error('[DELETE /api/admin/blogs/[id]] Error:', err);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
