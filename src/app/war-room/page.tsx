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
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { startDate?: string; endDate?: string };
}

export default async function WarRoomPage({ searchParams }: Props) {
  // 1. Gestion des dates pour le filtrage
  const start = searchParams.startDate ? startOfDay(parseISO(searchParams.startDate)) : startOfDay(new Date());
  const end = searchParams.endDate ? endOfDay(parseISO(searchParams.endDate)) : endOfDay(new Date());

  // 2. Récupération des données (Prisma)
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

  // 3. Calcul des KPIs 
  const revenue = orders
    .filter(o => o.status === 'COMPLETED' && o.paymentStatus === 'PAID')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 text-white">
      {/* HEADER PRINCIPAL */}
      <header className="mb-10 border-b border-white/10 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">War Room</h1>
            <p className="text-slate-400 mt-1 font-medium italic">Pilotage stratégique KRIKA&apos;5</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/war-room/pos" className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-xl font-bold flex items-center transition-all hover:scale-105 shadow-lg shadow-green-900/20 text-white">
              <DollarSign className="mr-2 h-5 w-5" /> Caisse (POS)
            </Link>
            <Link href="/kds" className="bg-orange-600 hover:bg-orange-500 px-5 py-3 rounded-xl font-bold flex items-center transition-all hover:scale-105 shadow-lg shadow-orange-900/20 text-white">
              <ChefHat className="mr-2 h-5 w-5" /> Cuisine
            </Link>
            <Link href="/war-room/catalogue" className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl font-bold flex items-center transition-all text-white">
              <Package className="mr-2 h-5 w-5" /> Stocks
            </Link>
            <Link href="/war-room/analytics" className="bg-purple-600 hover:bg-purple-500 px-5 py-3 rounded-xl font-bold flex items-center transition-all text-white">
              <TrendingUp className="mr-2 h-5 w-5" /> Analytics
            </Link>
            <Link href="/war-room/orders" className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-bold flex items-center transition-all text-white">
              <ShoppingBag className="mr-2 h-5 w-5" /> Historique
            </Link>
            <a href="/api/export/csv" download className="bg-white hover:bg-slate-200 text-slate-950 px-5 py-3 rounded-xl font-black flex items-center transition-all shadow-xl">
              <Activity className="mr-2 h-5 w-5" /> Export Excel
            </a>
          </div>
        </div>

        {/* BARRE DE FILTRAGE PAR DATE */}
        <div className="mt-8 bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase">
            <Filter className="h-4 w-4" /> Filtrer la période :
          </div>
          <form className="flex flex-wrap items-center gap-3">
            <input 
              type="date" 
              name="startDate"
              defaultValue={searchParams.startDate || new Date().toISOString().split('T')[0]}
              className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
            />
            <span className="text-slate-600">au</span>
            <input 
              type="date" 
              name="endDate"
              defaultValue={searchParams.endDate || new Date().toISOString().split('T')[0]}
              className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
            />
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-primary/80 transition-colors">
              Appliquer
            </button>
            <Link href="/war-room" className="text-slate-500 text-xs font-bold hover:text-white transition-colors ml-2">
              Réinitialiser
            </Link>
          </form>
        </div>
      </header>

      {/* ALERTE STOCKS CRITIQUES */}
      {lowStockProducts.length > 0 && (
        <div className="mb-10 bg-red-500/10 border-2 border-red-500/50 animate-pulse rounded-2xl p-5 flex items-center gap-5">
          <div className="bg-red-500 p-3 rounded-xl shadow-lg shadow-red-900/40">
            <Package className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-red-500 font-black uppercase text-sm tracking-widest">Alerte Rupture Imminente</h3>
            <p className="text-slate-200 text-sm font-medium mt-1">
              Produits critiques (&le; 5 unités) : <span className="text-white font-bold">{lowStockProducts.map(p => p.name).join(', ')}</span>
            </p>
          </div>
          <Link href="/war-room/catalogue" className="hidden md:block bg-white text-red-600 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-tighter hover:bg-slate-100 transition-all shadow-lg">
            Gérer les stocks
          </Link>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-slate-900 border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="h-24 w-24 text-white" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5 mb-4">
            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Chiffre d&apos;Affaires</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{revenue.toLocaleString('fr-FR')} FCFA</div>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase italic">* Basé sur les commandes COMPLETED & PAID</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/10 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5 mb-4">
            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Commandes Servies</CardTitle>
            <Activity className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{completedOrders}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/10 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5 mb-4">
            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">En Attente Cuisine</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{pendingOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* ACTIVITÉ RÉCENTE */}
      <Card className="bg-slate-900 border-white/10 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-slate-800/30 py-6 px-8">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Activité sur la période</CardTitle>
            <CalendarIcon className="h-5 w-5 text-slate-500" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <ShoppingBag className="h-12 w-12 text-slate-800" />
              <p className="text-slate-500 font-bold uppercase text-sm tracking-widest">Aucune donnée pour cette période</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] uppercase font-black text-slate-500 tracking-widest">
                  <tr>
                    <th className="px-8 py-5">ID Commande</th>
                    <th className="px-8 py-5">Date & Heure</th>
                    <th className="px-8 py-5">Client</th>
                    <th className="px-8 py-5">Montant</th>
                    <th className="px-8 py-5">Paiement</th>
                    <th className="px-8 py-5 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {orders.slice(0, 15).map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-8 py-5 text-white font-black">#{order.id.split('-')[0].toUpperCase()}</td>
                      <td className="px-8 py-5">
                        <span className="block text-slate-300">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                        <span className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleTimeString('fr-FR')}</span>
                      </td>
                      <td className="px-8 py-5">{order.user.phone}</td>
                      <td className="px-8 py-5 font-black text-white">{order.totalAmount.toLocaleString()} F</td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                          order.paymentStatus === 'PAID' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          order.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length > 15 && (
                <div className="p-4 bg-slate-950/50 text-center">
                  <Link href="/war-room/orders" className="text-xs font-black text-primary hover:underline uppercase tracking-widest">
                    Voir les {orders.length - 15} autres commandes dans l&apos;historique &rarr;
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
