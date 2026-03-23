// src/actions/upload.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { v2 as cloudinary } from 'cloudinary';

// Configuration de Cloudinary avec tes variables d'environnement
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadProductImage(productId: string, base64Image: string) {
  // 1. Sécurité : Vérification du Staff
  const isStaff = cookies().has('kds_session');
  if (!isStaff) return { success: false, error: "Non autorisé." };

  try {
    // 2. Envoi de l'image (Base64) vers Cloudinary
    // On la place dans un dossier spécifique pour que ton Cloudinary reste propre
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: 'krika5_menu',
      transformation: [
        { width: 800, height: 600, crop: "fill", gravity: "center" }, // Redimensionnement automatique pour alléger le poids
        { quality: "auto", fetch_format: "auto" } // Optimisation automatique (WebP)
      ]
    });

    // 3. Sauvegarde de l'URL sécurisée fournie par Cloudinary dans ta base Prisma
    await prisma.product.update({
      where: { id: productId },
      data: { imageUrl: uploadResponse.secure_url }
    });
    
    // 4. Invalidation du cache pour mettre à jour la page en temps réel
    revalidatePath('/carte'); 
    return { success: true };

  } catch (error: unknown) {
    console.error("Erreur Cloudinary:", error);
    return { success: false, error: "Échec de l'upload vers Cloudinary." };
  }
}
