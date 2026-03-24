// src/actions/pos.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';

export async function processPayment(orderId: string, paymentMethod: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, select: { id: true, userId: true, paymentStatus: true } });
      if (!order || order.paymentStatus !== 'UNPAID') throw new Error('ALREADY_PAID_OR_NOT_FOUND');

      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PAID', paymentMethod: paymentMethod },
      });

      if (order.userId) {
        await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { increment: 1 } } });
      }
    });
    
    // NOTIFICATION TEMPS RÉEL (Non bloquante)
    try {
      await pusherServer.trigger('kds-channel', 'new-order', { orderId: orderId });
    } catch (pusherError) {
      console.error("Avertissement Pusher (POS Payment):", pusherError);
    }
    
    revalidatePath('/war-room/pos');
    revalidatePath('/war-room');
    return { success: true };

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'ALREADY_PAID_OR_NOT_FOUND') return { success: false, error: "Commande introuvable ou déjà encaissée." };
    return { success: false, error: "Échec de l'encaissement et de l'attribution des points." };
  }
}

export async function processFreeRewardOrder(orderId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, select: { id: true, userId: true, paymentStatus: true } });
      if (!order || order.paymentStatus !== 'UNPAID' || !order.userId) throw new Error('INVALID_ORDER_OR_USER');

      const user = await tx.user.findUnique({ where: { id: order.userId }, select: { loyaltyPoints: true } });
      if (!user || user.loyaltyPoints < 10) throw new Error('INSUFFICIENT_POINTS');

      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PAID', paymentMethod: 'REWARD_FREE_MENU' },
      });

      await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { decrement: 10 } } });
    });
    
    // NOTIFICATION TEMPS RÉEL (Non bloquante)
    try {
      await pusherServer.trigger('kds-channel', 'new-order', { orderId: orderId });
    } catch (pusherError) {
      console.error("Avertissement Pusher (POS Reward):", pusherError);
    }
    
    revalidatePath('/war-room/pos');
    revalidatePath('/war-room');
    return { success: true };

  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'INSUFFICIENT_POINTS') return { success: false, error: "Le client n'a pas assez de points." };
      if (error.message === 'INVALID_ORDER_OR_USER') return { success: false, error: "Commande ou utilisateur invalide." };
    }
    return { success: false, error: "Échec de l'application de la récompense." };
  }
}
