// src/app/war-room/orders/page.tsx
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Search, Receipt } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: {
    q?: string;
  };
}

export default async function OrderHistoryPage({ searchParams }: Props) {
  const searchQuery = searchParams.q || '';

  // 1. Requête Prisma avec Recherche Intégrée
  const orders = await prisma.order.findMany({
    where: searchQuery ? {
      OR: [
        { id: { contains: searchQuery, mode: 'insensitive' } },
        { user: { phone: { contains: searchQuery } } }
      ]
    } : undefined,
    include: { 
      user: true, 
      items: { include: { product: true } } 
    },
    orderBy: { createdAt: 'desc' },
    take: 50 // Limitation de sécurité
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;700&display=swap');
      `}</style>

      <main 
        className="min-h-screen text-white p-6 md:p-10"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: 'linear-gradient(135deg, #07070f 0%, #0d0d1a 50%, #070710 100%)',
        }}
      >
        <header className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-white/5 pb-8">
          <div>
            <Link href="/war-room" className="text-primary hover:text-white transition-colors flex items-center gap-2 mb-4 font-bold uppercase tracking-widest text-xs">
              <ArrowLeft className="h-4 w-4" /> Retour War Room
            </Link>
            <h1 
              className="text-5xl text-white leading-none"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em' }}
            >
              HISTORIQUE DES <span style={{ color: '#f5a623' }}>VENTES</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mt-2">
              Les 50 dernières transactions enregistrées
            </p>
          </div>
          
          <div className="flex gap-4">
            {/* 2. Formulaire de Recherche Fonctionnel (Server-Side) */}
            <form method="GET" className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                name="q"
                defaultValue={searchQuery}
                placeholder="N° Commande ou Téléphone..." 
                className="bg-slate-900/80 border border-white/10 rounded-xl h-12 pl-12 pr-4 text-white text-sm font-medium focus:outline-none focus:border-primary w-full md:w-80 transition-all placeholder:text-slate-600 shadow-inner"
              />
              <button type="submit" className="hidden">Rechercher</button>
            </form>
          </div>
        </header>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
          {orders.length === 0 ? (
             <div className="py-24 flex flex-col items-center gap-4 text-center">
               <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                 <Search className="h-12 w-12 text-slate-600" />
               </div>
               <p className="text-slate-500 font-black uppercase text-xs tracking-[0.3em]">
                 Aucune commande trouvée
               </p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-950/50 border-b border-white/10">
                  <tr>
                    {['#ID', 'Date & Heure', 'Client', 'Articles', 'Paiement', 'Montant'].map((h, i) => (
                      <th 
                        key={h} 
                        className={`p-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ${i === 5 ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {orders.map((order) => {
                    // Création d'un résumé des articles ("2x Smash Burger, 1x Coca...")
                    const itemsSummary = order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
                    
                    return (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* ID */}
                        <td className="p-5">
                          <span className="text-sm font-black text-white" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        
                        {/* DATE */}
                        <td className="p-5">
                          <div className="text-slate-300 font-bold text-sm">
                            {format(order.createdAt, 'dd MMMM yyyy', { locale: fr })}
                          </div>
                          <div className="text-slate-500 text-xs mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {format(order.createdAt, 'HH:mm:ss')}
                          </div>
                        </td>

                        {/* CLIENT */}
                        <td className="p-5">
                          {order.user?.phone ? (
                            <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                              {order.user.phone}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-xs font-medium">Anonyme (Comptoir)</span>
                          )}
                        </td>

                        {/* ARTICLES */}
                        <td className="p-5">
                          <div className="flex items-center gap-2 max-w-[250px] lg:max-w-md">
                            <Receipt className="h-4 w-4 text-slate-600 flex-shrink-0" />
                            <span className="text-xs text-slate-400 truncate" title={itemsSummary}>
                              {itemsSummary || 'Aucun article'}
                            </span>
                          </div>
                        </td>

                        {/* STATUT PAIEMENT */}
                        <td className="p-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.15em] border ${
                            order.paymentStatus === 'PAID' 
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}>
                            {order.paymentStatus === 'PAID' ? 'Payé' : 'Impayé'}
                          </span>
                        </td>

                        {/* MONTANT */}
                        <td className="p-5 text-right">
                          <span 
                            className="text-xl font-black text-white" 
                            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em' }}
                          >
                            {/* CORRECTION ICI : Forçage du cast en Number natif */}
                            {Number(order.totalAmount).toLocaleString('fr-FR')} 
                            <span className="text-sm ml-1 text-slate-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>F</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
