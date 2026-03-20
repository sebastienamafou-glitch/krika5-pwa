// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'krika5-super-secret-key-prod');

// Les routes que nous voulons protéger
const protectedRoutes = ['/kds', '/admin', '/war-room'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  if (isProtectedRoute) {
    const token = req.cookies.get('kds_session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
      // Vérification cryptographique du jeton
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch (error) {
      // Jeton invalide ou expiré
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|.*\\.png$).*)'],
};
