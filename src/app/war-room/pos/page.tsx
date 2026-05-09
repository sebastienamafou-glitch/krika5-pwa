// src/app/war-room/pos/page.tsx
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PosClient from './PosClient';
// Remplace 'auth' par ton utilitaire de session réel (ex: NextAuth ou ton action auth.ts)
// import { getServerSession } from "next-auth"; 

export const dynamic = 'force-dynamic';

export default async function PosServerPage() {
  // 1. RÉCUPÉRATION DE LA SESSION (Simulation du flux Zero Trust)
  // Ici, nous récupérons l'utilisateur connecté pour l'identifier comme opérateur.
  // Si aucune session n'est trouvée, nous redirigeons vers le login.
  
  // NOTE : Pour cet exemple, je simule la récupération d'un staff. 
  // Tu devras lier cela à ton système d'authentification (NextAuth, etc.)
  const sessionUser = await prisma.user.findFirst({
    where: { role: { in: ['STAFF', 'ADMIN'] } } // Seul le staff peut accéder au POS
  });

  if (!sessionUser) {
    redirect('/login');
  }

  // 2. RÉCUPÉRATION DES COMMANDES EN ATTENTE (PENDING)
  const pendingOrders = await prisma.order.findMany({
    where: { 
      paymentStatus: 'UNPAID',
      status: 'PENDING'
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, phone: true, loyaltyPoints: true } },
      items: { include: { product: { select: { name: true, price: true } } } }
    }
  });

  // 3. RÉCUPÉRATION DU CATALOGUE (Typage ProductDTO)
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
          imageUrl: true,
          stock: true,       
          isAvailable: true, 
          categoryId: true,  
        }
      }
    }
  });

  // 4. INJECTION DANS LE CLIENT POS
  // On passe l'ID de l'opérateur pour verrouiller le cycle de vie du Shift.
  return (
    <PosClient 
      orders={pendingOrders} 
      categories={categories} 
      operatorId={sessionUser.id} 
    />
  );
}
