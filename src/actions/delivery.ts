// src/actions/delivery.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function markAsDelivered(orderId: string) {
  try {
    // 1. Vérification du statut de paiement initial
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentStatus: true }
    });

    if (!order) return { success: false, error: "Commande introuvable." };

    const isUnpaid = order.paymentStatus === 'UNPAID';

    // 2. Mise à jour avec sécurisation financière
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'DELIVERED',
        // Si non payé, on force le statut PAID et on trace l'encaissement par le livreur
        ...(isUnpaid ? { paymentStatus: 'PAID', paymentMethod: 'CASH_DELIVERY' } : {})
      }
    });

    revalidatePath('/livraison');
    revalidatePath('/war-room'); 
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la validation de la livraison." };
  }
}
