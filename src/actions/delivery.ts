// src/actions/delivery.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function markAsDelivered(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' }
    });

    revalidatePath('/livraison');
    revalidatePath('/war-room'); 
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la validation de la livraison." };
  }
}
