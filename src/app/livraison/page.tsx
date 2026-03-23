// src/app/livraison/page.tsx
import { prisma } from '@/lib/prisma';
import { DeliveryTicket } from './DeliveryTicket';
import { Bike, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DeliveryDashboardPage() {
  // On récupère uniquement les livraisons qui sortent de la cuisine (COMPLETED)
  const readyOrders = await prisma.order.findMany({
    where: {
      orderType: 'DELIVERY',
      status: 'COMPLETED' 
    },
    include: {
      user: { select: { phone: true } },
      items: { include: { product: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'asc' } // Les plus anciennes en premier
  });

  // On filtre manuellement le typage de prisma pour l'interface DeliveryTicket
  const formattedOrders = readyOrders.map(order => ({
    id: order.id,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    deliveryAddress: order.deliveryAddress,
    deliveryLat: order.deliveryLat,
    deliveryLng: order.deliveryLng,
    user: order.user,
    items: order.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product: { name: item.product.name }
    }))
  }));

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8">
      <header className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href="/hub" className="inline-flex items-center text-slate-500 hover:text-white mb-4 font-bold transition-colors text-xs uppercase tracking-widest">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour au Hub
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Bike className="h-8 w-8 text-purple-500" /> Espace Livreur
          </h1>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl">
          <span className="text-purple-400 font-black text-sm uppercase tracking-widest">{formattedOrders.length} courses en attente</span>
        </div>
      </header>

      {formattedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[3rem]">
          <Bike className="w-20 h-20 text-slate-800 mb-6" />
          <h2 className="text-xl font-black text-slate-500 uppercase tracking-widest">Aucune course</h2>
          <p className="text-slate-600 font-medium mt-2 text-sm">La cuisine prépare les prochaines commandes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedOrders.map(order => (
            <DeliveryTicket key={order.id} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}
