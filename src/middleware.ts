// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // Décodage Base64 standard
    const [user, pwd] = atob(authValue).split(':');

    // Identifiants par défaut (à basculer dans ton fichier .env pour la production)
    const validUser = process.env.KDS_USER || 'admin';
    const validPass = process.env.KDS_PASSWORD || 'krika5';

    if (user === validUser && pwd === validPass) {
      return NextResponse.next();
    }
  }

  // Refus et déclenchement de la modale native du navigateur
  return new NextResponse('Accès non autorisé.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Panneau de contrôle KDS KRIKA\'5"',
    },
  });
}

// Le middleware ne s'exécute QUE sur la route /kds et ses sous-routes
export const config = {
  matcher: ['/kds/:path*'],
};
