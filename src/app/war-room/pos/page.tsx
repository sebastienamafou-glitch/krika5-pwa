// src/app/war-room/pos/page.tsx
import { prisma } from '@/lib/prisma';
import PosClient from './PosClient';

export const dynamic = 'force-dynamic';

export default async function PosServerPage() {
  const pendingOrders = await prisma.order.findMany({
    where: {
      paymentStatus: 'UNPAID', 
    },
    orderBy: { 
      createdAt: 'desc' 
    },
    include: {
      user: {
        select: { id: true, phone: true }
      },
      items: {
        include: { 
          product: {
            select: { name: true, price: true }
          }
        }
      }
    }
  });

  return <PosClient orders={pendingOrders} />;
}
