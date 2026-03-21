// src/actions/admin.ts
'use server';

import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export type CreateUserInput = {
  phone: string;
  password?: string;
  role: Role;
};

export async function createStaffUser(data: CreateUserInput) {
  // 1. Validation stricte des entrées
  if (!data.phone || !data.role) {
    return { success: false, error: "Le numéro de téléphone et le rôle sont requis." };
  }

  // Règle métier : ADMIN et STAFF doivent avoir un mot de passe
  if ((data.role === Role.ADMIN || data.role === Role.STAFF) && !data.password) {
    return { success: false, error: "Un mot de passe est obligatoire pour les accès restreints." };
  }

  try {
    // 2. Prévention des doublons (Contrainte d'unicité sur le téléphone)
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone }
    });

    if (existingUser) {
      return { success: false, error: "Ce numéro de téléphone est déjà enregistré." };
    }

    // 3. Hachage asymétrique du mot de passe
    let hashedPassword = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // 4. Insertion sécurisée
    await prisma.user.create({
      data: {
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
      }
    });

    // 5. Invalidation du cache pour rafraîchir l'éventuelle liste des employés
    revalidatePath('/admin');

    return { success: true };
    
  } catch (error) {
    console.error("Erreur création utilisateur :", error);
    return { success: false, error: "Échec technique lors de la création de l'utilisateur." };
  }
}
