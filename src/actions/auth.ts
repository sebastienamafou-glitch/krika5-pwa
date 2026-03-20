// src/actions/auth.ts
'use server';

import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'krika5-super-secret-key-prod');

export async function login(formData: FormData) {
  // Le .trim() supprime les espaces tapés par erreur avant ou après le texte
  const phone = (formData.get('phone') as string)?.trim();
  const password = (formData.get('password') as string)?.trim();

  if (!phone || !password) return { error: 'Veuillez remplir tous les champs.' };

  // Vérification en base de données
  const user = await prisma.user.findUnique({ where: { phone } });

  // Audit d'architecture (s'affichera dans le terminal VS Code)
  console.log("Tentative de connexion :", `"${phone}"`, `"${password}"`);
  console.log("Utilisateur trouvé :", user);

  if (!user || user.password !== password || (user.role !== Role.ADMIN && user.role !== Role.STAFF)) {
    return { error: 'Identifiants invalides ou accès refusé.' };
  }

  // Création du JWT
  const token = await new SignJWT({ userId: user.id, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h') // Session valide 12 heures
    .sign(SECRET_KEY);

  // Écriture du cookie sécurisé
  cookies().set('kds_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12h
  });

  return { success: true };
}
