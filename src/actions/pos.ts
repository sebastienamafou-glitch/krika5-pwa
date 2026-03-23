// src/actions/pos.ts
'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher'; // NOUVEAU : Import de Pusher

export async function processPayment(orderId: string, paymentMethod: string) {
  try {
    await prisma.order.update({
      where: { 
        id: orderId,
        paymentStatus: 'UNPAID' 
      },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod,
      },
    });
    
    // NOUVEAU : On fait sonner la cloche en cuisine !
    await pusherServer.trigger('kds-channel', 'new-order', {
      orderId: orderId,
    });
    
    revalidatePath('/war-room/pos');
    revalidatePath('/war-room');
    
    return { success: true };
  } catch (error) {
    console.error("Erreur d'encaissement:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: "Commande introuvable ou déjà encaissée." };
      }
    }
    
    return { success: false, error: "Échec de l'encaissement." };
  }
}
