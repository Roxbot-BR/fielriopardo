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

  // Public bolão pages (accessible to all visitors without redirect)
  const isPublicBolaoPath =
    pathname === '/bolao' ||
    pathname === '/bolao/' ||
    pathname.startsWith('/bolao/ranking') ||
    pathname.startsWith('/bolao/entrar') ||
    pathname.startsWith('/bolao/cadastro') ||
    pathname.startsWith('/bolao/redefinir-senha') ||
    pathname.startsWith('/bolao/acertadores') ||
    pathname.startsWith('/bolao/resultado');

  if (isPublicBolaoPath) {
    return NextResponse.next();
  }

  const isAdminPath  = pathname.startsWith('/admin');
  const isMasterPath = pathname.startsWith('/master');
  const isProtectedBolaoPath = pathname.startsWith('/bolao/perfil');

  if (!isAdminPath && !isMasterPath && !isProtectedBolaoPath) {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/bolao/:path*',
    '/admin/:path*',
    '/master/:path*',
  ],
};
