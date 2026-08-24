import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';
import { broadcastNotificationEvent } from '@/lib/notificationEvents';

const isValidUuid = (val?: string | null): boolean =>
  typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const notification = await prisma.notifications.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true, email: true } },
        target_user: { select: { id: true, username: true, email: true } },
        _count: { select: { user_notification_states: true } },
      },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json(notification);
  } catch (err) {
    console.error('[GET /api/admin/super/notifications/[id]] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      title,
      description,
      type,
      link,
      target_type,
      target_role,
      target_user_id,
      is_active,
    } = body;

    const existing = await prisma.notifications.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const cleanTargetUserId =
      target_type === 'user' && target_user_id && isValidUuid(target_user_id)
        ? target_user_id.trim()
        : target_type !== undefined && target_type !== 'user'
        ? null
        : undefined;

    const cleanTargetRole =
      target_type === 'role' && target_role
        ? String(target_role).trim()
        : target_type !== undefined && target_type !== 'role'
        ? null
        : undefined;

    const updated = await prisma.notifications.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(type !== undefined && { type }),
        ...(link !== undefined && { link: link?.trim() || null }),
        ...(target_type !== undefined && { target_type }),
        ...(cleanTargetRole !== undefined && { target_role: cleanTargetRole }),
        ...(cleanTargetUserId !== undefined && { target_user_id: cleanTargetUserId }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date(),
      },
    });

    try {
      broadcastNotificationEvent({
        type: 'notification:updated',
        notification: {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          type: updated.type,
          link: updated.link,
          target_type: updated.target_type,
          target_role: updated.target_role,
          target_user_id: updated.target_user_id,
          created_at: updated.created_at?.toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (broadcastErr) {
      console.warn('[PUT /api/admin/super/notifications/[id]] Broadcast warning:', broadcastErr);
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error('[PUT /api/admin/super/notifications/[id]] Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to update notification';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.notifications.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await prisma.notifications.delete({ where: { id } });

    try {
      broadcastNotificationEvent({
        type: 'notification:deleted',
        notificationId: id,
        timestamp: new Date().toISOString(),
      });
    } catch (broadcastErr) {
      console.warn('[DELETE /api/admin/super/notifications/[id]] Broadcast warning:', broadcastErr);
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (err: unknown) {
    console.error('[DELETE /api/admin/super/notifications/[id]] Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
