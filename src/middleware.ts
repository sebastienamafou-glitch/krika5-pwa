// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'krika5-super-secret-key-prod');

// J'ai gardé '/livraison' pour qu'il bénéficie du même "passage secret" que '/war-room'
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
    } catch {
      isValidToken = false;
    }
  }

  // A. Redirection intelligente (ANCIENNE CONFIGURATION RESTAURÉE) : 
  // Employé déjà connecté -> Envoi direct sur le Hub, interdiction de voir l'accueil (/) ou le login.
  if (isValidToken && (pathname === '/' || pathname === '/login')) {
    return NextResponse.redirect(new URL('/hub', request.url));
  }

  // B. Protection standard : Non connecté sur une route protégée -> Envoi au Login (Le passage secret)
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !isValidToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // C. Sécurité de niveau 2 : Blocage strict des employés sur les routes Admin
  if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/hub', request.url));
  }

  return NextResponse.next();
}

// Optimisation : On ne fait pas tourner le middleware sur les fichiers statiques
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
