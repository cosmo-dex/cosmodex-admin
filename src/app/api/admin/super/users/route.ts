import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const search = searchParams.get('search')?.trim() ?? '';
  const roleFilter = searchParams.get('role') ?? '';
  const statusFilter = searchParams.get('status') ?? '';

  const where: NonNullable<Parameters<typeof prisma.users.findMany>[0]>['where'] = {};

  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (roleFilter) {
    where.role = roleFilter;
  }

  if (statusFilter === 'active') where.is_active = true;
  else if (statusFilter === 'banned') where.is_active = false;

  try {
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          is_active: true,
          xp_total: true,
          level: true,
          created_at: true,
          last_login_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.users.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error('[admin/super/users GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  const body = await req.json();
  const { userId, action, role } = body as {
    userId?: string;
    action?: 'set_role' | 'ban' | 'unban';
    role?: string;
  };

  if (!userId || !action) {
    return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
  }

  if (userId === auth.user.userId) {
    return NextResponse.json({ error: 'You cannot modify your own account from here' }, { status: 400 });
  }

  try {
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, is_active: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldValue = { role: targetUser.role, is_active: targetUser.is_active };
    const updateData: { role?: string; is_active?: boolean } = {};
    let auditAction = '';

    if (action === 'set_role') {
      const VALID_ROLES = ['student', 'learning_admin', 'arena_admin', 'super_admin'];
      if (!role || !VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
      }
      updateData.role = role;
      auditAction = `set_role:${role}`;
    } else if (action === 'ban') {
      updateData.is_active = false;
      auditAction = 'ban_user';
    } else if (action === 'unban') {
      updateData.is_active = true;
      auditAction = 'unban_user';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, role: true, is_active: true },
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'user_management',
      action: auditAction,
      targetTable: 'users',
      targetId: userId,
      oldValue,
      newValue: { role: updatedUser.role, is_active: updatedUser.is_active },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('[admin/super/users PATCH] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
