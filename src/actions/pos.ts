// src/actions/pos.ts
'use server';
import { Prisma } from '@prisma/client'; // Ajout de l'import Prisma
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function processPayment(orderId: string, paymentMethod: string) {
  try {
    // Sécurité : on force la condition 'paymentStatus: UNPAID'
    // Cela empêche le double-encaissement (ex: double clic du caissier)
    await prisma.order.update({
      where: { 
        id: orderId,
        paymentStatus: 'UNPAID' 
      },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod, // ex: "ESPECES", "WAVE_MANUEL"
      },
    });
    
    // Rafraîchissement des écrans
    revalidatePath('/war-room/pos');
    revalidatePath('/war-room');
    
    return { success: true };
  } catch (error) {
    console.error("Erreur d'encaissement:", error);
    
    // Utilisation du Type Guard Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: "Commande introuvable ou déjà encaissée." };
      }
    }
    
    return { success: false, error: "Échec de l'encaissement." };
  }
}
