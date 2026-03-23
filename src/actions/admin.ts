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
  if (!data.phone || !data.role) {
    return { success: false, error: "Le numéro de téléphone et le rôle sont requis." };
  }

  if ((data.role === Role.ADMIN || data.role === Role.STAFF) && !data.password) {
    return { success: false, error: "Un mot de passe est obligatoire pour les accès restreints." };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone }
    });

    if (existingUser) {
      return { success: false, error: "Ce numéro de téléphone est déjà enregistré." };
    }

    let hashedPassword = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.create({
      data: {
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
      }
    });

    revalidatePath('/admin');
    return { success: true };
    
  } catch (error) {
    console.error("Erreur création utilisateur :", error);
    return { success: false, error: "Échec technique lors de la création de l'utilisateur." };
  }
}

// CORRECTION : On force le retour à Promise<void> pour satisfaire l'attribut "action" du formulaire
export async function deleteStaffUser(formData: FormData): Promise<void> {
  const userId = formData.get('userId') as string;

  if (!userId) return;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role === Role.CUSTOMER) return;

    await prisma.user.delete({
      where: { id: userId }
    });

    revalidatePath('/admin');
  } catch (error) {
    console.error("Erreur lors de la révocation :", error);
  }
}
