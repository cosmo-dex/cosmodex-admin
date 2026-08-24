import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';
import { broadcastNotificationEvent } from '@/lib/notificationEvents';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type') ?? '';
  const target = searchParams.get('target') ?? '';
  const search = searchParams.get('search')?.trim() ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const PAGE_SIZE = 20;

  const where: NonNullable<Parameters<typeof prisma.notifications.findMany>[0]>['where'] = {};
  if (type) where.type = type;
  if (target) where.target_type = target;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const [notificationsList, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          link: true,
          target_type: true,
          target_role: true,
          target_user_id: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          creator: {
            select: { id: true, username: true, email: true },
          },
          target_user: {
            select: { id: true, username: true, email: true },
          },
          _count: {
            select: { user_notification_states: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.notifications.count({ where }),
    ]);

    return NextResponse.json({
      notifications: notificationsList,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (err) {
    console.error('[GET /api/admin/super/notifications] Error:', err);
    return NextResponse.json({
      notifications: [],
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      totalPages: 1,
      warning: 'Database server temporarily unreachable',
    });
  }
}

const isValidUuid = (val?: string | null): boolean =>
  typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const {
      title,
      description,
      type = 'info',
      link,
      target_type = 'all',
      target_role,
      target_user_id,
      is_active = true,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Notification title is required' }, { status: 400 });
    }

    const cleanTargetUserId =
      target_type === 'user' && target_user_id && isValidUuid(target_user_id)
        ? target_user_id.trim()
        : null;

    const cleanTargetRole = target_type === 'role' && target_role ? String(target_role).trim() : null;

    const cleanCreatedBy =
      auth.user?.userId && isValidUuid(auth.user.userId) ? auth.user.userId : null;

    const created = await prisma.notifications.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type: type || 'info',
        link: link?.trim() || null,
        target_type: target_type || 'all',
        target_role: cleanTargetRole,
        target_user_id: cleanTargetUserId,
        is_active: is_active ?? true,
        created_by: cleanCreatedBy,
      },
      include: {
        creator: {
          select: { id: true, username: true, email: true },
        },
        target_user: {
          select: { id: true, username: true, email: true },
        },
        _count: {
          select: { user_notification_states: true },
        },
      },
    });

    try {
      broadcastNotificationEvent({
        type: 'notification:created',
        notification: {
          id: created.id,
          title: created.title,
          description: created.description,
          type: created.type,
          link: created.link,
          target_type: created.target_type,
          target_role: created.target_role,
          target_user_id: created.target_user_id,
          created_at: created.created_at?.toISOString(),
          read: false,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (broadcastErr) {
      console.warn('[POST /api/admin/super/notifications] Broadcast warning:', broadcastErr);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/admin/super/notifications] Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to create notification';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
