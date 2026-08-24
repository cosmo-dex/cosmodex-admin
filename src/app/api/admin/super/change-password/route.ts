import { NextRequest, NextResponse } from 'next/server';
import { hash, compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

const SALT_ROUNDS = 12;

export async function PATCH(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin', 'learning_admin', 'arena_admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: auth.user.userId },
      select: { id: true, password_hash: true },
    });

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'User not found or no password configured.' }, { status: 404 });
    }

    const passwordMatch = await compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    const newHash = await hash(newPassword, SALT_ROUNDS);

    await prisma.users.update({
      where: { id: auth.user.userId },
      data: { password_hash: newHash },
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'account',
      action: 'change_password',
      targetTable: 'users',
      targetId: auth.user.userId,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/super/change-password] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
