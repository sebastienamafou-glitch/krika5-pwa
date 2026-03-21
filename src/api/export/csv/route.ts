// src/app/api/export/csv/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Pas de cache, on veut l'export à la seconde près
export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Sécurité : Vérification du jeton Staff
  const token = cookies().get('kds_session');
  if (!token) return new NextResponse('Accès non autorisé', { status: 401 });

  // 2. Requête : Uniquement les commandes PAYÉES
  const paidOrders = await prisma.order.findMany({
    where: { paymentStatus: 'PAID' },
    include: {
      user: true,
      items: { include: { product: true } }
    },
    orderBy: { createdAt: 'desc' } // De la plus récente à la plus ancienne
  });

  // 3. Formatage CSV
  const headers = ['ID Commande', 'Date', 'Heure', 'Client', 'Montant (FCFA)', 'Méthode', 'Détail Articles'];

  const rows = paidOrders.map(order => {
    const date = new Date(order.createdAt).toLocaleDateString('fr-FR');
    const time = new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    // Concaténation des articles (ex: "2x Garba | 1x Coca")
    const itemsStr = order.items.map(i => `${i.quantity}x ${i.product.name}`).join(' | ');

    return [
      order.id.split('-')[0].toUpperCase(),
      date,
      time,
      order.user.phone,
      order.totalAmount,
      order.paymentMethod || 'Non spécifié',
      `"${itemsStr}"` // Guillemets cruciaux pour ne pas casser les colonnes si un produit contient une virgule
    ].join(',');
  });

  // 4. Assemblage final avec encodage universel (BOM UTF-8 pour Excel)
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

  // 5. Envoi du fichier au navigateur
  const response = new NextResponse(csvContent);
  response.headers.set('Content-Type', 'text/csv; charset=utf-8');
  response.headers.set('Content-Disposition', `attachment; filename="KRIKA5_Export_Compta_${new Date().toISOString().split('T')[0]}.csv"`);

  return response;
}
