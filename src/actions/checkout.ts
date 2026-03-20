// src/actions/checkout.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache'; 

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
    // 1. Gérer le client (Création s'il n'existe pas, récupération sinon)
    const user = await prisma.user.upsert({
      where: { phone: payload.phone },
      update: {}, 
      create: { phone: payload.phone },
    });

    // 2. Créer la commande et les lignes (Transaction implicite)
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        totalAmount: payload.totalAmount,
        status: 'PENDING',
        paymentMethod: 'CASH', // V1 : Paiement à la caisse
        items: {
          create: payload.items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price, // Historisation du prix
          })),
        },
      },
    });

    revalidatePath('/kds'); // <-- 3. Invalidation du cache pour le KDS

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Erreur Checkout:", error);
    return { success: false, error: "Échec de l'enregistrement en base." };
  }
}
