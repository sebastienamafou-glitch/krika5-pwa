// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'krika5-super-secret-key-prod');

const protectedRoutes = ['/admin', '/war-room', '/kds', '/hub', '/livraison'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('kds_session')?.value;

  let isValidToken = false;
  let userRole = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      isValidToken = true;
      userRole = payload.role;
    } catch (error) {
      // 🚨 CORRECTION ZERO TRUST : Ne jamais avaler une erreur d'authentification en silence en dev
      console.error('❌ [Middleware] Échec JWT sur la route:', pathname);
      console.error('❌ [Middleware] Motif exact:', error);
      isValidToken = false;
    }
  }

  if (isValidToken && (pathname === '/' || pathname === '/login')) {
    return NextResponse.redirect(new URL('/hub', request.url));
  }

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !isValidToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/hub', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
