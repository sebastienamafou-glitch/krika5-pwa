// src/actions/kds.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function markOrderAsReady(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' } 
    });

    // Invalidation du cache pour mettre à jour l'écran de la cuisine instantanément
    revalidatePath('/kds');
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la validation KDS:", error);
    return { success: false, error: "Impossible de valider la commande." };
  }
}
