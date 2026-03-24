// src/app/war-room/page.tsx
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Clock, 
  DollarSign, 
  Package, 
  ChefHat, 
  TrendingUp, 
  ShoppingBag, 
  CalendarIcon,
  Filter,
  PieChart,
  X
} from 'lucide-react';
import Link from 'next/link';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { 
    startDate?: string; 
    endDate?: string;
    status?: string;
    payment?: string;
    type?: string;
  };
}

export default async function WarRoomPage({ searchParams }: Props) {
  // 1. Gestion des dates pour la requête globale
  const start = searchParams.startDate ? startOfDay(parseISO(searchParams.startDate)) : startOfDay(new Date());
  const end = searchParams.endDate ? endOfDay(parseISO(searchParams.endDate)) : endOfDay(new Date());

  // 2. Récupération des données ultra-optimisée pour les KPIs
  const [orders, lowStockProducts] = await prisma.$transaction([
    prisma.order.findMany({
      where: { 
        createdAt: { gte: start, lte: end } 
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.findMany({
      where: { 
        stock: { lte: 5 },
        isAvailable: true 
      }
    })
  ]);

  // 3. Calcul de la Business Intelligence (BI) - Reste intact malgré les filtres du tableau
  const revenue = orders
    .filter(o => o.status === 'COMPLETED' && o.paymentStatus === 'PAID')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
  
  const deliveryOrders = orders.filter(o => o.orderType === 'DELIVERY').length;
  const takeawayOrders = orders.filter(o => o.orderType === 'TAKEAWAY').length;

  // 4. Filtrage dynamique pour le tableau (En mémoire pour ne pas casser la BI)
  let filteredTableOrders = orders;
  if (searchParams.status) {
    filteredTableOrders = filteredTableOrders.filter(o => o.status === searchParams.status);
  }
  if (searchParams.payment) {
    filteredTableOrders = filteredTableOrders.filter(o => o.paymentStatus === searchParams.payment);
  }
  if (searchParams.type) {
    filteredTableOrders = filteredTableOrders.filter(o => o.orderType === searchParams.type);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 text-white">
      {/* HEADER PRINCIPAL */}
      <header className="mb-10 border-b border-white/10 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <Activity className="h-10 w-10 text-primary" />
              War Room
            </h1>
            <p className="text-slate-400 mt-2 font-medium italic uppercase tracking-widest text-xs">
              Centre de commandement KRIKA&apos;5
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/war-room/pos" className="bg-emerald-600 hover:bg-emerald-500 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-widest flex items-center transition-all hover:-translate-y-1 shadow-lg shadow-emerald-900/20 text-white">
              <DollarSign className="mr-2 h-5 w-5" /> Caisse (POS)
            </Link>
            <Link href="/kds" className="bg-orange-600 hover:bg-orange-500 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-widest flex items-center transition-all hover:-translate-y-1 shadow-lg shadow-orange-900/20 text-white">
              <ChefHat className="mr-2 h-5 w-5" /> Cuisine
            </Link>
            <Link href="/war-room/catalogue" className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-widest flex items-center transition-all text-white">
              <Package className="mr-2 h-5 w-5" /> Stocks
            </Link>
            <a href="/api/export/csv" download className="bg-white hover:bg-slate-200 text-slate-950 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-widest flex items-center transition-all shadow-xl hover:-translate-y-1 border border-transparent">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" /> Export Excel
            </a>
          </div>
        </div>

        {/* BARRE DE FILTRAGE PAR DATE */}
        <div className="mt-8 bg-slate-900/80 p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest">
            <Filter className="h-5 w-5" /> Période d&apos;analyse
          </div>
          <form className="flex flex-wrap items-center gap-3">
            <input 
              type="date" 
              name="startDate"
              defaultValue={searchParams.startDate || new Date().toISOString().split('T')[0]}
              className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none text-white"
            />
            <span className="text-slate-500 font-bold uppercase text-xs">au</span>
            <input 
              type="date" 
              name="endDate"
              defaultValue={searchParams.endDate || new Date().toISOString().split('T')[0]}
              className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none text-white"
            />
            <button type="submit" className="bg-primary text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-primary/20">
              Mettre à jour
            </button>
            <Link href="/war-room" className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors ml-2 px-4">
              Reset
            </Link>
          </form>
        </div>
      </header>

      {/* ALERTE STOCKS CRITIQUES */}
      {lowStockProducts.length > 0 && (
        <div className="mb-10 bg-red-500/10 border border-red-500/50 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xl shadow-red-500/5">
          <div className="flex items-center gap-5">
            <div className="bg-red-500 p-4 rounded-2xl shadow-lg shadow-red-900/40 animate-pulse">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-red-500 font-black uppercase text-lg tracking-tight">Rupture Imminente</h3>
              <p className="text-slate-300 text-sm font-medium mt-1">
                <span className="text-white font-bold">{lowStockProducts.length} produit(s)</span> en stock critique (&le; 5 unités).
              </p>
            </div>
          </div>
          <Link href="/war-room/catalogue" className="w-full md:w-auto text-center bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg">
            Réapprovisionner
          </Link>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        <Card className="bg-slate-900 border-white/10 shadow-2xl relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="h-32 w-32 text-white" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5 mb-4 z-10 relative">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Chiffre d&apos;Affaires</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign className="h-5 w-5 text-emerald-500" /></div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-4xl font-black text-white">{revenue.toLocaleString('fr-FR')} F</div>
            <p className="text-[10px] text-emerald-400 mt-2 font-black uppercase tracking-widest bg-emerald-500/10 inline-block px-2 py-1 rounded-md">Ventes Encaissées</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/10 shadow-2xl hover:border-blue-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5 mb-4">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Servies</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Activity className="h-5 w-5 text-blue-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{completedOrders}</div>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Commandes terminées</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/10 shadow-2xl hover:border-orange-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5 mb-4">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">En Attente</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg"><Clock className="h-5 w-5 text-orange-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{pendingOrders}</div>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">En cours de préparation</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/10 shadow-2xl hover:border-purple-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5 mb-4">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Canaux de Vente</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg"><PieChart className="h-5 w-5 text-purple-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-black text-purple-400">{deliveryOrders}</div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Livraisons</p>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="text-right">
                <div className="text-2xl font-black text-primary">{takeawayOrders}</div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">À Emporter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ACTIVITÉ RÉCENTE (AVEC NOUVEAUX FILTRES) */}
      <Card className="bg-slate-900 border-white/10 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-slate-800/30 py-6 px-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Flux des commandes</CardTitle>
            <CalendarIcon className="h-5 w-5 text-slate-500" />
          </div>

          {/* NOUVEAU : BARRE DE FILTRES DU TABLEAU */}
          <form method="GET" className="flex flex-wrap items-center gap-3">
            {/* Conservation des dates actuelles dans l'URL */}
            {searchParams.startDate && <input type="hidden" name="startDate" value={searchParams.startDate} />}
            {searchParams.endDate && <input type="hidden" name="endDate" value={searchParams.endDate} />}

            <select name="type" defaultValue={searchParams.type || ""} className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-primary uppercase tracking-widest appearance-none">
              <option value="">🛒 Tous types</option>
              <option value="TAKEAWAY">À Emporter</option>
              <option value="DELIVERY">Livraison</option>
            </select>

            <select name="payment" defaultValue={searchParams.payment || ""} className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-primary uppercase tracking-widest appearance-none">
              <option value="">💰 Tous paiements</option>
              <option value="PAID">Payé</option>
              <option value="UNPAID">Non Payé</option>
            </select>

            <select name="status" defaultValue={searchParams.status || ""} className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-primary uppercase tracking-widest appearance-none">
              <option value="">⏳ Tous statuts</option>
              <option value="PENDING">En attente</option>
              <option value="COMPLETED">Terminé</option>
            </select>

            <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg">
              Filtrer
            </button>
            
            {/* Bouton Reset uniquement si un filtre tableau est actif */}
            {(searchParams.type || searchParams.payment || searchParams.status) && (
              <Link 
                href={`/war-room?${searchParams.startDate ? `startDate=${searchParams.startDate}&` : ''}${searchParams.endDate ? `endDate=${searchParams.endDate}` : ''}`} 
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2.5 rounded-xl transition-colors"
                title="Effacer les filtres"
              >
                <X className="w-4 h-4" />
              </Link>
            )}
          </form>
        </CardHeader>
        
        <CardContent className="p-0">
          {filteredTableOrders.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <ShoppingBag className="h-16 w-16 text-slate-800" />
              <p className="text-slate-500 font-bold uppercase text-sm tracking-widest">Aucune commande pour ces critères</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 whitespace-nowrap">
                <thead className="bg-slate-950/80 text-[10px] uppercase font-black text-slate-500 tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Commande</th>
                    <th className="px-8 py-5">Date & Heure</th>
                    <th className="px-8 py-5">Client</th>
                    <th className="px-8 py-5">Type</th>
                    <th className="px-8 py-5">Montant</th>
                    <th className="px-8 py-5">Paiement</th>
                    <th className="px-8 py-5 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {filteredTableOrders.slice(0, 15).map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-8 py-5 text-white font-black">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="px-8 py-5">
                        <span className="block text-slate-300">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{new Date(order.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-8 py-5">
                        {order.user?.phone ? (
                          order.user.phone
                        ) : (
                      <span className="text-slate-500 italic text-xs">Anonyme</span>
    )}
                      </td>
                      <td className="px-8 py-5 font-black text-white">{order.totalAmount.toLocaleString()} F</td>
                      <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                          order.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          order.status === 'COMPLETED' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTableOrders.length > 15 && (
                <div className="p-6 bg-slate-950/50 text-center border-t border-white/5">
                  <Link href="/war-room/orders" className="text-xs font-black text-primary hover:text-white transition-colors uppercase tracking-widest inline-flex items-center gap-2">
                    Voir les {filteredTableOrders.length - 15} autres commandes filtrées &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
