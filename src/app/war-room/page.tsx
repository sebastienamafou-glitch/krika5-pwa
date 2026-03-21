// src/app/war-room/page.tsx
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, DollarSign, Package, ChefHat } from 'lucide-react';
import Link from 'next/link';

// Pas de cache, données en temps réel
export const dynamic = 'force-dynamic';

export default async function WarRoomPage() {
  // Récupération des statistiques du jour (depuis minuit)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ordersToday = await prisma.order.findMany({
    where: { createdAt: { gte: today } },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  const revenue = ordersToday
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const pendingOrders = ordersToday.filter(o => o.status === 'PENDING').length;
  const completedOrders = ordersToday.filter(o => o.status === 'COMPLETED').length;

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">War Room</h1>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-400 uppercase">Chiffre d&apos;Affaires (Jour)</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Nouveau Bouton : CAISSE */}
          <Link href="/war-room/pos" className="bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-xl font-bold flex items-center transition-colors">
            <DollarSign className="mr-2 h-5 w-5" /> Caisse (POS)
          </Link>

          <Link href="/kds" className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-3 rounded-xl font-bold flex items-center transition-colors">
            <ChefHat className="mr-2 h-5 w-5" /> Écran Cuisine
          </Link>

          <Link href="/war-room/catalogue" className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold flex items-center transition-colors">
            <Package className="mr-2 h-5 w-5" /> Stocks
          </Link>
          
          {/* Nouveau Bouton : EXPORT CSV */}
          <a href="/api/export/csv" download className="bg-white hover:bg-slate-200 text-slate-900 px-5 py-3 rounded-xl font-black flex items-center transition-colors shadow-lg">
            <Activity className="mr-2 h-5 w-5" /> Export Excel
          </a>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="bg-slate-900 border-white/10 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-400 uppercase">Chiffre d&apos;Affaires (Jour)</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{revenue.toLocaleString('fr-FR')} FCFA</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/10 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-400 uppercase">Commandes Servies (Jour)</CardTitle>
            <Activity className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{completedOrders}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/10 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-400 uppercase">En Attente Cuisine</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{pendingOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Dernières Commandes */}
      <Card className="bg-slate-900 border-white/10 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-slate-800/50">
          <CardTitle className="text-xl font-bold text-white">Activité Récente</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ordersToday.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-medium">Aucune commande pour le moment aujourd&apos;hui.</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">ID</th>
                  <th className="px-6 py-4 font-bold">Heure</th>
                  <th className="px-6 py-4 font-bold">Client</th>
                  <th className="px-6 py-4 font-bold">Montant</th>
                  <th className="px-6 py-4 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ordersToday.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">#{order.id.split('-')[0].toUpperCase()}</td>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4 font-medium">{order.user.phone}</td>
                    <td className="px-6 py-4 font-bold text-white">{order.totalAmount} FCFA</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
