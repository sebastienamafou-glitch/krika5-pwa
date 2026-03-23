// src/actions/kds.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';

export async function markOrderAsReady(orderId: string) {
  try {
    // 1. Mise à jour en base de données
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' } 
    });

    // 2. Communication Interne : On prévient les autres écrans (Caisse, Hub)
    await pusherServer.trigger('kds-channel', 'order-ready', {
      orderId: orderId,
    });

    // 3. LA KILLER FEATURE (Buzzer) : On cible le téléphone exact du client
    await pusherServer.trigger(`order-${orderId}`, 'status-updated', { 
      status: 'COMPLETED' 
    });

    revalidatePath('/kds');
    revalidatePath('/war-room');
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la validation KDS:", error);
    return { success: false, error: "Impossible de valider la commande." };
  }
}
