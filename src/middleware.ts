import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/super-admin': ['super_admin'],
  '/learning-admin': ['super_admin', 'learning_admin'],
  '/arena-admin': ['super_admin', 'arena_admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  const session = await verifySession(sessionCookie?.value);

  if (pathname === '/' || pathname === '/login' || pathname === '/admin') {
    if (session && session.role) {
      if (session.role === 'super_admin') {
        return NextResponse.redirect(new URL('/super-admin', request.url));
      }
      if (session.role === 'learning_admin') {
        return NextResponse.redirect(new URL('/learning-admin', request.url));
      }
      if (session.role === 'arena_admin') {
        return NextResponse.redirect(new URL('/arena-admin', request.url));
      }
    }
    return NextResponse.next();
  }

  for (const [routePrefix, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
      if (!session || !session.userId || !session.role) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (!allowedRoles.includes(session.role)) {
        if (session.role === 'super_admin') {
          return NextResponse.redirect(new URL('/super-admin', request.url));
        }
        if (session.role === 'learning_admin') {
          return NextResponse.redirect(new URL('/learning-admin', request.url));
        }
        if (session.role === 'arena_admin') {
          return NextResponse.redirect(new URL('/arena-admin', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }

      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
