// src/actions/checkout.ts
'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache'; 
import Pusher from 'pusher';

// Initialisation de Pusher pour le KDS
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID as string,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY as string,
  secret: process.env.PUSHER_SECRET as string,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
  useTLS: true,
});

export type CheckoutPayload = {
  phone: string; // Accepte "" pour les clients anonymes
  items: { id: string; price: number; quantity: number }[];
  totalAmount: number;
  customerId?: string;
  orderType: 'TAKEAWAY' | 'DELIVERY';
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
};

export async function submitOrder(payload: CheckoutPayload) {
  // 1. Validation assouplie : On vérifie juste le panier et l'adresse si livraison
  if (payload.items.length === 0) {
    return { success: false, error: "Données de commande invalides (panier vide)." };
  }

  if (payload.orderType === 'DELIVERY' && (!payload.deliveryAddress || payload.deliveryAddress.trim().length < 5)) {
    return { success: false, error: "Une adresse précise est requise pour la livraison." };
  }

  try {
    const orderResult = await prisma.$transaction(async (tx) => {
      let finalAmount = payload.totalAmount;
      let targetUserId: string | null = null;

      // 2. Logique Client & Fidélité (Bypass si anonyme)
      // Si on a un customerId explicite (Scan QR)
      if (payload.customerId) {
        const user = await tx.user.findUniqueOrThrow({ where: { id: payload.customerId } });
        targetUserId = user.id;
      } 
      // Si on a un numéro tapé manuellement (Tél >= 8 chars)
      else if (payload.phone && payload.phone.length >= 8) {
        const user = await tx.user.upsert({
          where: { phone: payload.phone },
          update: {}, 
          create: { phone: payload.phone },
        });
        targetUserId = user.id;
      }

      // 3. Gestion de la fidélité UNIQUEMENT si le client est identifié
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

      // 4. Décrémentation stricte des stocks
      for (const item of payload.items) {
        await tx.product.update({
          where: { 
            id: item.id,
            stock: { gte: item.quantity },
            isAvailable: true 
          },
          data: { 
            stock: { decrement: item.quantity } 
          },
        });
      }

      // 5. Création de la commande avec ou sans userId
      const order = await tx.order.create({
        data: {
          userId: targetUserId, // Sera null si client anonyme
          totalAmount: finalAmount,
          status: 'PENDING',
          paymentMethod: 'CASH',
          orderType: payload.orderType,
          deliveryAddress: payload.orderType === 'DELIVERY' ? payload.deliveryAddress : null,
          deliveryLat: payload.orderType === 'DELIVERY' ? payload.deliveryLat : null,
          deliveryLng: payload.orderType === 'DELIVERY' ? payload.deliveryLng : null,
          items: {
            create: payload.items.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
              unitPrice: item.price, 
            })),
          },
        },
      });

      return order;
    });

    // 6. Notification temps réel à la cuisine (KDS)
    try {
      await pusher.trigger('kds-channel', 'new-order', {
        message: payload.orderType === 'DELIVERY' ? 'Nouvelle commande en LIVRAISON' : 'Nouvelle commande À EMPORTER',
        orderId: orderResult.id
      });
    } catch {
      // Erreur Pusher silencieuse pour ne pas bloquer la transaction
    }

    // 7. Invalidation du cache pour rafraîchir les écrans
    revalidatePath('/kds'); 
    revalidatePath('/war-room/catalogue'); 

    return { success: true, orderId: orderResult.id };

  } catch (error) {
    console.error("Erreur Checkout:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, error: "Stock insuffisant ou erreur client." };
    }
    return { success: false, error: "Échec de l'enregistrement en base." };
  }
}
