// src/app/menu-board/page.tsx
import { prisma } from '@/lib/prisma';
import { MenuBoardClient } from './MenuBoardClient';

export const dynamic = 'force-dynamic';

export default async function MenuBoardPage() {
  // Requête optimisée : on ne sélectionne QUE ce qui est utile pour l'écran
  const categories = await prisma.category.findMany({
    where: {
        products: { some: { isAvailable: true } }
    },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      products: {
        where: { isAvailable: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true, 
          description: true
        }
      }
    }
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <MenuBoardClient initialCategories={categories} />
    </main>
  );
}
