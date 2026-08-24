import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

export { SESSION_COOKIE };

export type AdminRole = 'super_admin' | 'learning_admin' | 'arena_admin';

export interface SessionUser {
  userId: string;
  username: string;
  email: string;
  role: string;
}

interface CachedAdmin {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  expiresAt: number;
}

const adminUserCache = new Map<string, CachedAdmin>();
const CACHE_TTL_MS = 15_000;

export async function verifyAdminSession(
  req: NextRequest,
  allowedRoles: AdminRole[]
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const sessionCookie = req.cookies.get(SESSION_COOKIE);
  const session = await verifySession(sessionCookie?.value);

  if (!session || !session.userId || !session.role) {
    return {
      error: NextResponse.json({ error: 'Not authenticated or invalid session' }, { status: 401 }),
    };
  }

  const now = Date.now();
  let dbUser = adminUserCache.get(session.userId);

  if (!dbUser || dbUser.expiresAt < now) {
    const freshUser = await prisma.users.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, email: true, role: true, is_active: true },
    });

    if (!freshUser) {
      adminUserCache.delete(session.userId);
      return {
        error: NextResponse.json({ error: 'Account not found' }, { status: 403 }),
      };
    }

    dbUser = {
      id: freshUser.id,
      username: freshUser.username,
      email: freshUser.email,
      role: freshUser.role ?? 'student',
      is_active: Boolean(freshUser.is_active),
      expiresAt: now + CACHE_TTL_MS,
    };
    adminUserCache.set(session.userId, dbUser);
  }

  if (!dbUser.is_active) {
    adminUserCache.delete(session.userId);
    return {
      error: NextResponse.json({ error: 'Account suspended' }, { status: 403 }),
    };
  }

  const dbRole = dbUser.role;

  if (!allowedRoles.includes(dbRole as AdminRole)) {
    return {
      error: NextResponse.json(
        { error: `Forbidden: requires one of [${allowedRoles.join(', ')}]` },
        { status: 403 }
      ),
    };
  }

  return {
    user: {
      userId: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbRole,
    },
  };
}

export async function logAdminActivity(..._args: unknown[]) {
  void _args;
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
