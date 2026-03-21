import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Search,} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OrderHistoryPage() {
  const orders = await prisma.order.findMany({
    include: { user: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50 // On limite aux 50 dernières pour la performance
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link href="/war-room" className="text-primary hover:underline flex items-center gap-2 mb-4 font-bold">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Historique des Ventes</h1>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Rechercher un client..." 
              className="bg-slate-900 border border-white/10 rounded-xl h-12 pl-10 pr-4 text-white focus:outline-none focus:border-primary w-64"
            />
          </div>
        </div>
      </header>

      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 border-b border-white/5">
            <tr>
              <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date & Heure</th>
              <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Client</th>
              <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Détails</th>
              <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Statut</th>
              <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="text-white font-bold">{format(order.createdAt, 'dd MMMM', { locale: fr })}</div>
                  <div className="text-slate-500 text-xs">{format(order.createdAt, 'HH:mm')}</div>
                </td>
                <td className="p-4 text-slate-300 font-medium">{order.user.phone}</td>
                <td className="p-4">
                  <div className="text-xs text-slate-400 line-clamp-1">
                    {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    order.paymentStatus === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="p-4 text-right text-white font-black">{order.totalAmount.toLocaleString()} F</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
