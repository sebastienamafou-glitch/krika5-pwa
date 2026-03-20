// src/actions/order.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function completeOrder(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });
    
    // Rafraîchit instantanément la vue du KDS
    revalidatePath('/kds'); 
    return { success: true };
  } catch (error) {
    console.error("Erreur KDS:", error);
    return { success: false, error: "Impossible de mettre à jour la commande." };
  }
}
