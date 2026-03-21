// src/app/kds/page.tsx
import { prisma } from "@/lib/prisma";
import { OrderTicket } from "@/components/OrderTicket";
import { PusherListener } from '@/components/PusherListener';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';

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
      <PusherListener/> 
      
      <header className="mb-8 border-b border-white/10 pb-6">
        {/* Bouton de retour vers le Hub */}
        <Link 
          href="/hub" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 font-bold text-sm uppercase tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour au Hub
        </Link>

        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              KDS <span className="text-primary" dangerouslySetInnerHTML={{ __html: BRAND_NAME }} />
            </h1>
            <p className="text-slate-400 mt-1 font-medium text-lg">Écran de contrôle cuisine</p>
          </div>
          <div className="bg-primary/20 text-primary border border-primary/30 px-6 py-3 rounded-xl font-black shadow-lg shadow-primary/5">
            {pendingOrders.length} en attente
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pendingOrders.map(order => (
          <OrderTicket key={order.id} order={order} />
        ))}
        
        {pendingOrders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center text-slate-600 py-32 border-2 border-dashed border-white/5 rounded-3xl">
            <span className="text-7xl mb-6 grayscale opacity-50">🍽️</span>
            <p className="text-xl font-bold uppercase tracking-widest">Aucune commande en attente.</p>
            <p className="text-sm mt-2 font-medium">Tout est sous contrôle en cuisine.</p>
          </div>
        )}
      </div>
    </main>
  );
}
