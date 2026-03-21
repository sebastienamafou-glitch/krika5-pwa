// src/actions/checkout.ts
'use server';
import { Prisma } from '@prisma/client'; // Ajout de l'import Prisma
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache'; 
import Pusher from 'pusher';

// Initialisation du client Pusher côté serveur
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID as string,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY as string,
  secret: process.env.PUSHER_SECRET as string,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
  useTLS: true,
});

export type CheckoutPayload = {
  phone: string;
  items: { id: string; price: number; quantity: number }[];
  totalAmount: number;
};

export async function submitOrder(payload: CheckoutPayload) {
  if (!payload.phone || payload.items.length === 0) {
    return { success: false, error: "Données invalides." };
  }

  try {
    // 1 à 3. Transaction explicite pour sécuriser les stocks et créer la commande
    const orderResult = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { phone: payload.phone },
        update: {}, 
        create: { phone: payload.phone },
      });

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

      const order = await tx.order.create({
        data: {
          userId: user.id,
          totalAmount: payload.totalAmount,
          status: 'PENDING',
          paymentMethod: 'CASH', 
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

    // 4. Notification Temps Réel via Pusher (KDS)
    try {
      await pusher.trigger('kds-channel', 'new-order', {
        message: 'Nouvelle commande à préparer',
        orderId: orderResult.id
      });
    } catch (pusherError) {
      console.error("Échec de la notification Pusher, mais commande validée :", pusherError);
    }

    // 5. Invalidation des caches statiques Next.js
    revalidatePath('/kds'); 
    revalidatePath('/war-room/catalogue'); 

    return { success: true, orderId: orderResult.id };

  } catch (error) {
    console.error("Erreur Checkout:", error);
    
    // Type Guard pour éviter le type 'any'
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: "Un ou plusieurs articles sont en rupture de stock." };
      }
    }
    
    return { success: false, error: "Échec de l'enregistrement en base." };
  }
}
