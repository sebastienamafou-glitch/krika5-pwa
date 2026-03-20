// src/app/kds/page.tsx
import { prisma } from "@/lib/prisma";
import { OrderTicket } from "@/components/OrderTicket";
import { AutoRefresh } from "@/components/AutoRefresh"; // <-- 1. Ajout de l'import
// Directive Next.js stricte : On force le rendu dynamique à chaque requête (pas de cache)
export const dynamic = 'force-dynamic';

export default async function KDSPage() {
  const pendingOrders = await prisma.order.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      user: true,
      items: {
        include: { product: true }
      }
    }
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <AutoRefresh intervalMs={10000} /> {/* <-- 2. Injection du poll (10 secondes) */}
      <header className="mb-8 flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            KDS <span className="text-primary">KRIKA'5</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Écran de contrôle cuisine</p>
        </div>
        <div className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-lg font-bold">
          {pendingOrders.length} en attente
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pendingOrders.map(order => (
          <OrderTicket key={order.id} order={order} />
        ))}
        
        {pendingOrders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-24">
            <span className="text-6xl mb-4">🍽️</span>
            <p className="text-xl font-medium">Aucune commande en attente.</p>
          </div>
        )}
      </div>
    </main>
  );
}
