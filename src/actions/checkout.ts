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

// 1. Mise à jour du typage strict avec les champs de livraison
export type CheckoutPayload = {
  phone: string;
  items: { id: string; price: number; quantity: number }[];
  totalAmount: number;
  customerId?: string;
  orderType: 'TAKEAWAY' | 'DELIVERY'; // Obligatoire pour savoir comment traiter la commande
  deliveryAddress?: string;           // Optionnel, requis uniquement si DELIVERY
};

export async function submitOrder(payload: CheckoutPayload) {
  // 2. Validation renforcée des données entrantes
  if (!payload.phone || payload.items.length === 0) {
    return { success: false, error: "Données de commande invalides." };
  }

  if (payload.orderType === 'DELIVERY' && (!payload.deliveryAddress || payload.deliveryAddress.trim().length < 5)) {
    return { success: false, error: "Une adresse précise est requise pour la livraison." };
  }

  try {
    const orderResult = await prisma.$transaction(async (tx) => {
      // A. Identification ou création du client
      const user = payload.customerId 
        ? await tx.user.findUniqueOrThrow({ where: { id: payload.customerId } })
        : await tx.user.upsert({
            where: { phone: payload.phone },
            update: {}, 
            create: { phone: payload.phone },
          });

      let finalAmount = payload.totalAmount;
      
      // B. Gestion de la fidélité (10ème commande offerte)
      const pointsUpdate: Prisma.IntFieldUpdateOperationsInput = user.loyaltyPoints >= 10 
        ? { decrement: 10 } 
        : { increment: 1 };

      if (user.loyaltyPoints >= 10) {
        finalAmount = 0; 
      }

      await tx.user.update({
        where: { id: user.id },
        data: { loyaltyPoints: pointsUpdate }
      });

      // C. Décrémentation stricte des stocks
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

      // D. Création de la commande avec le type et l'adresse
      const order = await tx.order.create({
        data: {
          userId: user.id,
          totalAmount: finalAmount,
          status: 'PENDING',
          paymentMethod: 'CASH',
          orderType: payload.orderType, // Enregistrement du type (TAKEAWAY / DELIVERY)
          deliveryAddress: payload.orderType === 'DELIVERY' ? payload.deliveryAddress : null,
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

    // 3. Notification temps réel à la cuisine (KDS)
    try {
      await pusher.trigger('kds-channel', 'new-order', {
        message: payload.orderType === 'DELIVERY' ? 'Nouvelle commande en LIVRAISON' : 'Nouvelle commande À EMPORTER',
        orderId: orderResult.id
      });
    } catch {
      // Erreur Pusher silencieuse pour ne pas bloquer la transaction
    }

    // 4. Invalidation du cache pour rafraîchir les écrans
    revalidatePath('/kds'); 
    revalidatePath('/war-room/catalogue'); 

    return { success: true, orderId: orderResult.id };

  } catch (error) {
    console.error("Erreur Checkout:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, error: "Stock insuffisant ou client introuvable." };
    }
    return { success: false, error: "Échec de l'enregistrement en base." };
  }
}
