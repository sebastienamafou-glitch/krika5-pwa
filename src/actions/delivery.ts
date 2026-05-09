// src/actions/delivery.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { OrderStatus, PaymentStatus, PaymentMethodType } from '@prisma/client';
import { ActionResponse } from '@/types/dto'; // Typage strict DTO

/**
 * VALIDATION DE LIVRAISON (Atomic Transaction)
 */
export async function markAsDelivered(orderId: string): Promise<ActionResponse<void>> {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Vérification sécurisée
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { paymentStatus: true }
      });

      const isUnpaid = order.paymentStatus === PaymentStatus.UNPAID;

      // 2. Mise à jour atomique
      await tx.order.update({
        where: { id: orderId },
        data: { 
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          // Encaissement terrain tracé spécifiquement
          ...(isUnpaid && { paymentMethod: PaymentMethodType.CASH_DELIVERY })
        }
      });
    });

    revalidatePath('/livraison');
    revalidatePath('/war-room/analytics'); // Pour mettre à jour les écarts de caisse
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la validation de la livraison." };
  }
}

/**
 * LIAISON CLIENT & FIDÉLITÉ (Atomic Reward)
 */
export async function linkCustomerToOrder(orderId: string, customerId: string): Promise<ActionResponse<{ phone: string }>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Vérifier et incrémenter les points (1 commande = 1 point)
      const customer = await tx.user.update({
        where: { id: customerId },
        data: { loyaltyPoints: { increment: 1 } },
        select: { id: true, phone: true }
      });

      // 2. Liaison à la commande
      await tx.order.update({
        where: { id: orderId },
        data: { userId: customer.id }
      });

      return { phone: customer.phone };
    });

    revalidatePath('/livraison');
    return { success: true, data: result };
  } catch {
    return { success: false, error: "Carte de fidélité non reconnue." };
  }
}
