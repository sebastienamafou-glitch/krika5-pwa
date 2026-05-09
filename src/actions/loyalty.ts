// src/actions/loyalty.ts
'use server';

import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/types/dto';
import { z } from 'zod';

const phoneSchema = z.string()
  .min(8, { message: "Le numéro doit contenir au moins 8 chiffres." })
  .regex(/^\d+$/, { message: "Le numéro ne doit contenir que des chiffres." });

/**
 * RÉCUPÉRATION / CRÉATION DU PROFIL
 */
export async function getLoyaltyProfile(phone: string): Promise<ActionResponse<{ id: string; points: number }>> {
  try {
    const cleanPhone = phone.trim();
    const validatedPhone = phoneSchema.parse(cleanPhone);

    const user = await prisma.user.upsert({
      where: { phone: validatedPhone },
      update: {}, 
      create: { 
        phone: validatedPhone,
        role: 'CUSTOMER',
        loyaltyPoints: 0 
      },
      select: { id: true, loyaltyPoints: true }
    });

    return { success: true, data: { id: user.id, points: user.loyaltyPoints } };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message };
    return { success: false, error: "Erreur technique lors de l'accès au profil." };
  }
}

/**
 * REWARD LOGIC : CONSOMMATION DES POINTS (10 points = 1 Gratuité)
 * Utilise une transaction pour garantir que le solde ne devient jamais négatif.
 */
export async function processLoyaltyReward(userId: string): Promise<ActionResponse<{ newBalance: number }>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Vérification du solde actuel (Zero Trust)
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { loyaltyPoints: true }
      });

      if (user.loyaltyPoints < 10) {
        throw new Error("Solde de points insuffisant (10 points requis).");
      }

      // 2. Déduction des points
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { decrement: 10 } },
        select: { loyaltyPoints: true }
      });

      return { newBalance: updatedUser.loyaltyPoints };
    });

    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur lors de la conversion des points.";
    return { success: false, error: message };
  }
}
