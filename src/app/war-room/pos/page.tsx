// src/app/war-room/pos/page.tsx
import { prisma } from '@/lib/prisma';
import PosClient from './PosClient';

export const dynamic = 'force-dynamic';

export default async function PosServerPage() {
  const pendingOrders = await prisma.order.findMany({
    where: { paymentStatus: 'UNPAID' },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, phone: true, loyaltyPoints: true } },
      items: { include: { product: { select: { name: true, price: true } } } }
    }
  });

  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,    // ← visuel pour les cartes produits
          description: true, // ← sous-titre optionnel sur la carte
        }
      }
    }
  });

  return <PosClient orders={pendingOrders} categories={categories} />;
}
