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
export async function linkCustomerToOrder(orderId: string, customerId: string) {
  try {
    // 1. Vérifier que le client existe
    const customer = await prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return { success: false, error: "Carte de fidélité non reconnue." };
    }

    // 2. Lier la commande au client
    await prisma.order.update({
      where: { id: orderId },
      data: { userId: customer.id }
    });

    // 3. Rafraîchir l'interface du livreur
    revalidatePath('/livraison');
    
    return { success: true, phone: customer.phone };
  } catch (error) {
    console.error("Erreur linkCustomerToOrder:", error);
    return { success: false, error: "Erreur lors de la liaison." };
  }
}
