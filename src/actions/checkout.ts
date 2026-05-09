// src/actions/checkout.ts
'use server';

import { Prisma, PaymentMethodType, OrderStatus, PaymentStatus, OrderType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache'; 
import { pusherServer } from '@/lib/pusher';

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
  
  if (payload.orderType === 'DELIVERY' && (!payload.deliveryAddress || payload.deliveryAddress.trim().length < 5)) {
    return { success: false, error: "Une adresse précise est requise pour la livraison." };
  }

  try {
    const orderResult = await prisma.$transaction(async (tx) => {
      let finalAmount = payload.totalAmount;
      let targetUserId: string | null = null;

      // 1. Identification du client et gestion de la fidélité
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
          await tx.user.update({ 
            where: { id: targetUserId }, 
            data: { loyaltyPoints: { decrement: 10 } } 
          });
        } else {
          await tx.user.update({ 
            where: { id: targetUserId }, 
            data: { loyaltyPoints: { increment: 1 } } 
          });
        }
      }

      // 2. Mise à jour des stocks (Verification Zero Trust)
      for (const item of payload.items) {
        await tx.product.update({
          where: { id: item.id, stock: { gte: item.quantity }, isAvailable: true },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 3. Création de la commande (operatorId et shiftId sont null car commande Web)
      return await tx.order.create({
        data: {
          userId: targetUserId,
          operatorId: null, // Commande client directe [cite: 14, 15]
          shiftId: null,    // Pas de session de caisse [cite: 16, 17]
          totalAmount: finalAmount,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          paymentMethod: PaymentMethodType.CASH, // Mode de paiement par défaut
          orderType: payload.orderType as OrderType,
          deliveryAddress: payload.orderType === 'DELIVERY' ? payload.deliveryAddress : null,
          deliveryLat: payload.orderType === 'DELIVERY' ? payload.deliveryLat : null,
          deliveryLng: payload.orderType === 'DELIVERY' ? payload.deliveryLng : null,
          items: {
            create: payload.items.map((item) => ({ 
              productId: item.id, 
              quantity: item.quantity, 
              unitPrice: item.price 
            })),
          },
        },
      });
    });

    // 4. Notification KDS en temps réel
    try {
      await pusherServer.trigger('kds-channel', 'new-order', {
        message: payload.orderType === 'DELIVERY' ? 'Nouvelle commande en LIVRAISON' : 'Nouvelle commande À EMPORTER',
        orderId: orderResult.id
      });
    } catch {
      // Échec Pusher silencieux pour ne pas bloquer l'utilisateur [cite: 10, 11]
    }

    revalidatePath('/kds'); 
    revalidatePath('/war-room/catalogue'); 
    return { success: true, orderId: orderResult.id };

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, error: "Stock insuffisant ou erreur client." };
    }
    return { success: false, error: "Échec de l'enregistrement en base." };
  }
}
