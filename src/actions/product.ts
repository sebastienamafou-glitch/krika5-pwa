// src/actions/product.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProductStock(id: string, newStock: number, newAvailability: boolean) {
  try {
    await prisma.product.update({
      where: { id },
      data: { stock: Math.max(0, newStock), isAvailable: newAvailability }
    });
    revalidatePath('/war-room/catalogue');
    revalidatePath('/'); 
    return { success: true };
  } catch {
    return { success: false, error: "Erreur de mise à jour." };
  }
}

export async function createCategory(name: string) {
  if (!name.trim()) return { success: false, error: "Le nom est requis." };
  
  const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  try {
    const lastCategory = await prisma.category.findFirst({ orderBy: { order: 'desc' } });
    const nextOrder = lastCategory ? lastCategory.order + 1 : 0;

    await prisma.category.create({
      data: { name: name.trim(), slug, order: nextOrder }
    });
    
    revalidatePath('/war-room/catalogue');
    return { success: true };
  } catch {
    return { success: false, error: "Cette catégorie existe probablement déjà." };
  }
}

export async function createProduct(data: { name: string, price: number, categoryId: string, description?: string }) {
  if (!data.name.trim() || data.price < 0 || !data.categoryId) {
    return { success: false, error: "Données invalides." };
  }

  try {
    await prisma.product.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null, // INTÉGRATION DE LA DESCRIPTION
        price: data.price,
        categoryId: data.categoryId,
        stock: 50, 
        isAvailable: true
      }
    });
    
    revalidatePath('/war-room/catalogue');
    revalidatePath('/'); // Invalide aussi la vitrine client pour afficher le nouveau plat
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la création du produit." };
  }
}

export async function updateProduct(id: string, data: { name: string, price: number, categoryId: string, description?: string }) {
  if (!data.name.trim() || data.price < 0 || !data.categoryId) return { success: false, error: "Données invalides." };
  
  try {
    await prisma.product.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: data.price,
        categoryId: data.categoryId,
      }
    });
    revalidatePath('/war-room/catalogue');
    revalidatePath('/carte'); // Mise à jour de la vitrine client
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath('/war-room/catalogue');
    revalidatePath('/carte');
    return { success: true };
  } catch {
    // Si la suppression échoue, c'est que le produit est lié à une commande existante (Contrainte de clé étrangère)
    return { 
      success: false, 
      error: "Ce produit figure déjà dans l'historique des commandes. Veuillez simplement le désactiver." 
    };
  }
}

