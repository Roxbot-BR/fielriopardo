import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never protect the login page itself
  if (pathname.startsWith('/bolao/entrar') || pathname.startsWith('/bolao/cadastro')) {
    return NextResponse.next();
  }

  const isAdminPath  = pathname.startsWith('/admin');
  const isMasterPath = pathname.startsWith('/master');
  const isBolaoPath  = pathname.startsWith('/bolao');

  if (!isBolaoPath && !isAdminPath && !isMasterPath) {
    return NextResponse.next();
  }

  // Read token from cookie (set by AuthContext on login)
  const token = request.cookies.get('fiel_token')?.value ?? null;

  if (!token) {
    const loginUrl = new URL('/bolao/entrar', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    const loginUrl = new URL('/bolao/entrar', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Roles are in the JWT as array (sub, email only in our JWT)
  // Client-side role checks are done in page components - just verify token exists here
  // For master/admin routes, we'll let the page component handle role validation
  // (since roles aren't in the JWT payload, only sub+email)

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/bolao/:path*',
    '/admin/:path*',
    '/master/:path*',
  ],
};
