// src/actions/kds.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher'; // NOUVEAU : Import de Pusher

export async function markOrderAsReady(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' } 
    });

    // NOUVEAU : On prévient le reste du restaurant que c'est prêt
    await pusherServer.trigger('kds-channel', 'order-ready', {
      orderId: orderId,
    });

    revalidatePath('/kds');
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la validation KDS:", error);
    return { success: false, error: "Impossible de valider la commande." };
  }
}
