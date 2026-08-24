import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { signSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/session';

const ALLOWED_ADMIN_ROLES = ['super_admin', 'learning_admin', 'arena_admin'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        username: true,
        email: true,
        password_hash: true,
        auth_provider: true,
        role: true,
        is_active: true,
        avatar_url: true,
        xp_total: true,
        level: true,
        experience_level: true,
        interests: true,
        created_at: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    if (!user.role || !ALLOWED_ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Access denied. This portal is for authorized administrators only.' }, { status: 403 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'This admin account has been suspended.' }, { status: 403 });
    }

    if (!user.password_hash) {
      return NextResponse.json({ error: 'Password login is not configured for this account.' }, { status: 400 });
    }

    const passwordMatch = await compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const signedToken = await signSession({
      userId: user.id,
      username: user.username,
      email: user.email,
      avatarId: user.avatar_url ?? null,
      experienceLevel: user.experience_level ?? null,
      interests: user.interests ?? [],
      xpTotal: user.xp_total ?? 0,
      level: user.level ?? 1,
      role: user.role,
      createdAt: user.created_at?.toISOString() ?? new Date().toISOString(),
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, signedToken, SESSION_COOKIE_OPTIONS);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[admin-login] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
