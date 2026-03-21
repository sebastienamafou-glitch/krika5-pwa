// src/app/api/export/csv/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

// Clé secrète identique à celle du middleware
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'krika5-super-secret-key-prod');

export async function GET() {
  // 1. Sécurité : Vérification stricte du jeton Staff
  const token = cookies().get('kds_session')?.value;
  
  if (!token) {
    return new NextResponse('Accès non autorisé', { status: 401 });
  }

  try {
    // Validation cryptographique (bloque les faux cookies)
    await jwtVerify(token, SECRET_KEY);
  } catch {
    return new NextResponse('Jeton invalide ou expiré', { status: 403 });
  }

  // 2. Requête : Uniquement les commandes PAYÉES
  const paidOrders = await prisma.order.findMany({
    where: { paymentStatus: 'PAID' },
    include: {
      user: true,
      items: { include: { product: true } }
    },
    orderBy: { createdAt: 'desc' } 
  });

  // 3. Formatage CSV
  const headers = ['ID Commande', 'Date', 'Heure', 'Client', 'Montant (FCFA)', 'Méthode', 'Détail Articles'];

  const rows = paidOrders.map(order => {
    const date = new Date(order.createdAt).toLocaleDateString('fr-FR');
    const time = new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const itemsStr = order.items.map(i => `${i.quantity}x ${i.product.name}`).join(' | ');

    return [
      order.id.split('-')[0].toUpperCase(),
      date,
      time,
      order.user.phone,
      order.totalAmount,
      order.paymentMethod || 'Non spécifié',
      `"${itemsStr}"` 
    ].join(',');
  });

  // 4. Assemblage final (BOM UTF-8 pour Excel)
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

  // 5. Envoi du fichier
  const response = new NextResponse(csvContent);
  response.headers.set('Content-Type', 'text/csv; charset=utf-8');
  response.headers.set('Content-Disposition', `attachment; filename="KRIKA5_Export_Compta_${new Date().toISOString().split('T')[0]}.csv"`);

  return response;
}
