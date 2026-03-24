// src/actions/checkout.ts
'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache'; 
import { pusherServer } from '@/lib/pusher'; // IMPORT DU SINGLETON

export type CheckoutPayload = {
  phone: string;
  items: { id: string; price: number; quantity: number }[];
  totalAmount: number;
  customerId?: string;
  orderType: 'TAKEAWAY' | 'DELIVERY';
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
};

export async function submitOrder(payload: CheckoutPayload) {
  if (payload.items.length === 0) return { success: false, error: "Données de commande invalides (panier vide)." };
  if (payload.orderType === 'DELIVERY' && (!payload.deliveryAddress || payload.deliveryAddress.trim().length < 5)) return { success: false, error: "Une adresse précise est requise pour la livraison." };

  try {
    const orderResult = await prisma.$transaction(async (tx) => {
      let finalAmount = payload.totalAmount;
      let targetUserId: string | null = null;

      if (payload.customerId) {
        const user = await tx.user.findUniqueOrThrow({ where: { id: payload.customerId } });
        targetUserId = user.id;
      } else if (payload.phone && payload.phone.length >= 8) {
        const user = await tx.user.upsert({
          where: { phone: payload.phone },
          update: {}, 
          create: { phone: payload.phone },
        });
        targetUserId = user.id;
      }

      if (targetUserId) {
        const user = await tx.user.findUniqueOrThrow({ where: { id: targetUserId } });
        if (user.loyaltyPoints >= 10) {
          finalAmount = 0; 
          await tx.user.update({ where: { id: targetUserId }, data: { loyaltyPoints: { decrement: 10 } } });
        } else {
          await tx.user.update({ where: { id: targetUserId }, data: { loyaltyPoints: { increment: 1 } } });
        }
      }

      for (const item of payload.items) {
        await tx.product.update({
          where: { id: item.id, stock: { gte: item.quantity }, isAvailable: true },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return await tx.order.create({
        data: {
          userId: targetUserId,
          totalAmount: finalAmount,
          status: 'PENDING',
          paymentMethod: 'CASH',
          orderType: payload.orderType,
          deliveryAddress: payload.orderType === 'DELIVERY' ? payload.deliveryAddress : null,
          deliveryLat: payload.orderType === 'DELIVERY' ? payload.deliveryLat : null,
          deliveryLng: payload.orderType === 'DELIVERY' ? payload.deliveryLng : null,
          items: {
            create: payload.items.map((item) => ({ productId: item.id, quantity: item.quantity, unitPrice: item.price })),
          },
        },
      });
    });

    // NOTIFICATION TEMPS RÉEL (Non bloquante)
    try {
      await pusherServer.trigger('kds-channel', 'new-order', {
        message: payload.orderType === 'DELIVERY' ? 'Nouvelle commande en LIVRAISON' : 'Nouvelle commande À EMPORTER',
        orderId: orderResult.id
      });
    } catch (pusherError) {
      console.error("Avertissement Pusher (Checkout):", pusherError);
    }

    revalidatePath('/kds'); 
    revalidatePath('/war-room/catalogue'); 
    return { success: true, orderId: orderResult.id };

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return { success: false, error: "Stock insuffisant ou erreur client." };
    return { success: false, error: "Échec de l'enregistrement en base." };
  }
}
