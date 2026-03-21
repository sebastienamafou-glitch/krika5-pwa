// src/actions/loyalty.ts
'use server';

import { prisma } from '@/lib/prisma';

export async function getLoyaltyProfile(phone: string) {
  const cleanPhone = phone.trim();
  if (!cleanPhone || cleanPhone.length < 8) {
    return { success: false, error: "Numéro de téléphone invalide." };
  }

  try {
    // Upsert sécurisé : on récupère le client s'il existe, on le crée sinon
    const user = await prisma.user.upsert({
      where: { phone: cleanPhone },
      update: {}, 
      create: { phone: cleanPhone },
      select: { id: true, loyaltyPoints: true }
    });

    return { 
      success: true, 
      data: { id: user.id, points: user.loyaltyPoints } 
    };
  } catch (error) {
    console.error("Erreur récupération fidélité :", error);
    return { success: false, error: "Impossible de récupérer le profil." };
  }
}
