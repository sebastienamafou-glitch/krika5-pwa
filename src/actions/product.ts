// src/actions/product.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProductStock(id: string, stock: number, isAvailable: boolean) {
  try {
    await prisma.product.update({
      where: { id },
      data: { stock, isAvailable },
    });
    
    // On force le rafraîchissement du back-office ET de la vitrine
    revalidatePath('/war-room/catalogue');
    revalidatePath('/'); 
    
    return { success: true };
  } catch (error) {
    console.error("Erreur mise à jour catalogue:", error);
    return { success: false, error: "Impossible de mettre à jour le produit." };
  }
}
