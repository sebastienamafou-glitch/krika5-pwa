// src/app/api/export/csv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'krika5-super-secret-key-prod');

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('kds_session')?.value;
  
  if (!token) {
    return new NextResponse('Accès non autorisé', { status: 401 });
  }

  try {
    await jwtVerify(token, SECRET_KEY);
  } catch {
    return new NextResponse('Jeton invalide ou expiré', { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Réplication de la logique de date de la War Room (Aujourd'hui par défaut)
    const start = startDateParam ? startOfDay(parseISO(startDateParam)) : startOfDay(new Date());
    const end = endDateParam ? endOfDay(parseISO(endDateParam)) : endOfDay(new Date());

    // Utilisation d'un type strict Prisma pour éviter le type 'any'
    const whereClause: Prisma.OrderWhereInput = {
      paymentStatus: 'PAID',
      createdAt: {
        gte: start,
        lte: end
      }
    };

    const paidOrders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' } 
    });

    const headers = [
      'ID Commande', 
      'Date', 
      'Heure', 
      'Client', 
      'Type', 
      'Adresse de Livraison', 
      'Montant (FCFA)', 
      'Méthode', 
      'Détail Articles'
    ];

    const rows = paidOrders.map(order => {
      const date = new Date(order.createdAt).toLocaleDateString('fr-FR');
      const time = new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      const itemsStr = order.items.map(i => `${i.quantity}x ${i.product.name}`).join(' | ');
      
      const safeAddress = order.deliveryAddress 
        ? `"${order.deliveryAddress.replace(/"/g, '""')}"` 
        : 'N/A';
        
      const orderTypeLabel = order.orderType === 'DELIVERY' ? 'Livraison' : 'À Emporter';

      return [
        order.id.split('-')[0].toUpperCase(),
        date,
        time,
        order.user?.phone || 'Anonyme',
        orderTypeLabel,
        safeAddress,
        order.totalAmount,
        order.paymentMethod || 'Non spécifié',
        `"${itemsStr}"` 
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    const fileDate = startDateParam === endDateParam && startDateParam
      ? startDateParam 
      : new Date().toISOString().split('T')[0];

    const response = new NextResponse(csvContent);
    response.headers.set('Content-Type', 'text/csv; charset=utf-8');
    response.headers.set('Content-Disposition', `attachment; filename="KRIKA5_Export_Compta_${fileDate}.csv"`);

    return response;
    
  } catch {
    return new NextResponse("Erreur lors de la génération de l'export", { status: 500 });
  }
}
