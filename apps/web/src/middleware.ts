import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'ugcx_session';

interface SessionData {
  token?: string;
  role?: string;
  userId?: string;
}

function parseSessionCookie(raw: string | undefined): SessionData | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith('{')) {
      return JSON.parse(decoded) as SessionData;
    }
    const parts = decoded.split('.');
    if (parts.length >= 2) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(base64);
      const payload = JSON.parse(json);
      return { token: decoded, role: payload.role, userId: payload.sub };
    }
  } catch {
    return null;
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = parseSessionCookie(rawCookie);
  const isAuthenticated = Boolean(session?.token);
  const userRole = session?.role;

  // If visiting login while authenticated, redirect to workspace
  if (pathname === '/login') {
    if (isAuthenticated) {
      if (userRole === 'brand') {
        return NextResponse.redirect(new URL('/brand/dashboard', request.url));
      }
      if (userRole === 'creator') {
        return NextResponse.redirect(new URL('/creator/home', request.url));
      }
    }
    return NextResponse.next();
  }

  // Protect /brand routes
  if (pathname.startsWith('/brand')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'brand' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/creator/home', request.url));
    }
    return NextResponse.next();
  }

  // Protect /creator routes
  if (pathname.startsWith('/creator')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'creator' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/brand/dashboard', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/brand/:path*', '/creator/:path*', '/login'],
};
