import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const search = searchParams.get('search')?.trim() ?? '';

  try {
    let userIdFilter: string[] | null = null;
    if (search) {
      const matchingUsers = await prisma.users.findMany({
        where: {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      userIdFilter = matchingUsers.map((u) => u.id);
    }

    const statWhere: NonNullable<Parameters<typeof prisma.battle_user_stats.findMany>[0]>['where'] = {};
    if (userIdFilter !== null) {
      statWhere.user_id = { in: userIdFilter };
    }

    const [stats, total] = await Promise.all([
      prisma.battle_user_stats.findMany({
        where: statWhere,
        include: {
          users: {
            select: { username: true, email: true, is_active: true },
          },
        },
        orderBy: { elo_rating: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.battle_user_stats.count({ where: statWhere }),
    ]);

    return NextResponse.json({
      stats,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error('[admin/arena/stats GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { userId, elo_rating, mcq_elo_rating, reason } = body as {
      userId?: string;
      elo_rating?: number;
      mcq_elo_rating?: number;
      reason?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const existing = await prisma.battle_user_stats.findUnique({
      where: { user_id: userId },
      select: { elo_rating: true, mcq_elo_rating: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Battle stats not found for this user' }, { status: 404 });
    }

    const updateData: { elo_rating?: number; mcq_elo_rating?: number } = {};
    if (elo_rating !== undefined) updateData.elo_rating = Math.max(0, elo_rating);
    if (mcq_elo_rating !== undefined) updateData.mcq_elo_rating = Math.max(0, mcq_elo_rating);

    const updated = await prisma.battle_user_stats.update({
      where: { user_id: userId },
      data: updateData,
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'battle_arena',
      action: 'adjust_elo',
      targetTable: 'battle_user_stats',
      targetId: userId,
      oldValue: existing,
      newValue: { ...updateData, reason: reason ?? 'Manual adjustment' },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, stats: updated });
  } catch (err) {
    console.error('[admin/arena/stats PATCH] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
