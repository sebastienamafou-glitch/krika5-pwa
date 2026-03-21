// src/actions/checkout.ts
'use server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache'; 
import Pusher from 'pusher';

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
  customerId?: string;
};

export async function submitOrder(payload: CheckoutPayload) {
  if (!payload.phone || payload.items.length === 0) {
    return { success: false, error: "Données invalides." };
  }

  try {
    const orderResult = await prisma.$transaction(async (tx) => {
      const user = payload.customerId 
        ? await tx.user.findUniqueOrThrow({ where: { id: payload.customerId } })
        : await tx.user.upsert({
            where: { phone: payload.phone },
            update: {}, 
            create: { phone: payload.phone },
          });

      let finalAmount = payload.totalAmount;
      
      // Utilisation du type strict Prisma pour éviter l'erreur d'inférence
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
          totalAmount: finalAmount,
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

    try {
      await pusher.trigger('kds-channel', 'new-order', {
        message: 'Nouvelle commande à préparer',
        orderId: orderResult.id
      });
    } catch {
      // Erreur Pusher silencieuse pour ne pas bloquer la transaction
    }

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
