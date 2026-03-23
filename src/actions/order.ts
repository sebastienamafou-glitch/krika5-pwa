// src/actions/order.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Action existante
export async function completeOrder(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });
    
    revalidatePath('/kds'); 
    return { success: true };
  } catch (error) {
    console.error("Erreur KDS:", error);
    return { success: false, error: "Impossible de mettre à jour la commande." };
  }
}

// NOUVELLE ACTION POUR LE RADAR
export async function checkOrderStatusForRadar(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true }
    });
    
    // Si la commande n'existe plus ou est livrée/annulée, on dit au radar de se détruire
    if (!order || order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return { isActive: false };
    }
    
    return { isActive: true };
  } catch {
    return { isActive: false };
  }
}
