import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyAdminSession, logAdminActivity, getClientIp } from '@/lib/adminAuth';

const SALT_ROUNDS = 12;
const ADMIN_ROLES = ['learning_admin', 'arena_admin'];

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req, ['super_admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { username, email, password, role } = body as {
      username?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (!ADMIN_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${ADMIN_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    const [emailConflict, usernameConflict] = await Promise.all([
      prisma.users.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
      prisma.users.findFirst({
        where: { username: { equals: normalizedUsername, mode: 'insensitive' } },
        select: { id: true },
      }),
    ]);

    if (emailConflict) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    if (usernameConflict) {
      return NextResponse.json({ error: 'This username is already taken.' }, { status: 409 });
    }

    const passwordHash = await hash(password, SALT_ROUNDS);

    const newAdmin = await prisma.users.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password_hash: passwordHash,
        auth_provider: 'email',
        role,
        is_active: true,
        xp_total: 0,
        level: 1,
        interests: [],
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    await logAdminActivity({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      section: 'admin_management',
      action: 'create_admin',
      targetTable: 'users',
      targetId: newAdmin.id,
      oldValue: null,
      newValue: { username: newAdmin.username, email: newAdmin.email, role: newAdmin.role },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (err) {
    console.error('[admin/super/create-admin] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
