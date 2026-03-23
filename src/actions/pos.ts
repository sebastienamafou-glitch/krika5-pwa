// src/actions/pos.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';

export async function processPayment(orderId: string, paymentMethod: string) {
  try {
    // Utilisation d'une transaction pour garantir l'intégrité des données
    await prisma.$transaction(async (tx) => {
      // 1. On récupère la commande pour vérifier son statut
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, paymentStatus: true }
      });

      if (!order || order.paymentStatus !== 'UNPAID') {
        throw new Error('ALREADY_PAID_OR_NOT_FOUND');
      }

      // 2. On verrouille la commande comme payée
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: paymentMethod,
        },
      });

      // 3. Logique de Fidélité (Correction "KRIKA'5 Club") : 
      // 1 commande encaissée = +1 passage (tampon)
      if (order.userId) {
        await tx.user.update({
          where: { id: order.userId },
          data: {
            // Incrémente le compteur de 1, tout simplement
            loyaltyPoints: { increment: 1 } 
          }
        });
      }
    });
    
    // 4. On fait sonner la cloche en cuisine !
    await pusherServer.trigger('kds-channel', 'new-order', {
      orderId: orderId,
    });
    
    revalidatePath('/war-room/pos');
    revalidatePath('/war-room');
    
    return { success: true };

  } catch (error: unknown) {
    console.error("Erreur d'encaissement:", error);
    
    if (error instanceof Error && error.message === 'ALREADY_PAID_OR_NOT_FOUND') {
      return { success: false, error: "Commande introuvable ou déjà encaissée." };
    }
    
    return { success: false, error: "Échec de l'encaissement et de l'attribution des points." };
  }
}

// Ajoute ceci à la fin de src/actions/pos.ts

export async function processFreeRewardOrder(orderId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Récupération et vérification
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, paymentStatus: true }
      });

      if (!order || order.paymentStatus !== 'UNPAID' || !order.userId) {
        throw new Error('INVALID_ORDER_OR_USER');
      }

      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: { loyaltyPoints: true }
      });

      // Vérification stricte : le client doit avoir au moins 10 points
      if (!user || user.loyaltyPoints < 10) {
        throw new Error('INSUFFICIENT_POINTS');
      }

      // 2. On verrouille la commande comme payée avec la méthode spéciale
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'REWARD_FREE_MENU',
        },
      });

      // 3. On déduit les 10 points du compteur du client
      await tx.user.update({
        where: { id: order.userId },
        data: {
          loyaltyPoints: { decrement: 10 } 
        }
      });
    });
    
    // 4. On prévient la cuisine
    await pusherServer.trigger('kds-channel', 'new-order', {
      orderId: orderId,
    });
    
    revalidatePath('/war-room/pos');
    revalidatePath('/war-room');
    
    return { success: true };

  } catch (error: unknown) {
    console.error("Erreur de récompense:", error);
    
    if (error instanceof Error) {
      if (error.message === 'INSUFFICIENT_POINTS') return { success: false, error: "Le client n'a pas assez de points." };
      if (error.message === 'INVALID_ORDER_OR_USER') return { success: false, error: "Commande ou utilisateur invalide." };
    }
    
    return { success: false, error: "Échec de l'application de la récompense." };
  }
}
