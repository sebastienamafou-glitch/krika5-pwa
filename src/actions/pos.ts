// src/actions/pos.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function processPayment(orderId: string, paymentMethod: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod, // ex: "ESPECES", "WAVE_MANUEL"
      },
    });
    
    // Rafraîchissement des écrans
    revalidatePath('/war-room/pos');
    revalidatePath('/war-room');
    
    return { success: true };
  } catch (error) {
    console.error("Erreur d'encaissement:", error);
    return { success: false, error: "Échec de l'encaissement." };
  }
}
