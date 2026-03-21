// src/actions/auth.ts
'use server';

import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'krika5-super-secret-key-prod');

export async function login(formData: FormData) {
  const phone = (formData.get('phone') as string)?.trim();
  const password = (formData.get('password') as string)?.trim();

  if (!phone || !password) return { error: 'Veuillez remplir tous les champs.' };

  const user = await prisma.user.findUnique({ where: { phone } });

  // Sécurité : Rejet immédiat si l'utilisateur n'existe pas ou n'a pas de mot de passe
  if (!user || !user.password) {
    return { error: 'Identifiants invalides ou accès refusé.' };
  }

  // Vérification asymétrique du mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid || (user.role !== Role.ADMIN && user.role !== Role.STAFF)) {
    return { error: 'Identifiants invalides ou accès refusé.' };
  }

  // Création du JWT (inchangé)
  const token = await new SignJWT({ userId: user.id, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h') 
    .sign(SECRET_KEY);

  cookies().set('kds_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return { success: true };
}
