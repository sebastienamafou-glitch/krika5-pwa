import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, ShoppingBag, DollarSign, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  // 1. Récupération des données globales
  const allOrders = await prisma.order.findMany({
    where: { paymentStatus: 'PAID' },
    include: { items: true }
  });

  const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgBasket = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

  // 2. Performance par produit (Top Sellers)
  const products = await prisma.product.findMany({
    include: { _count: { select: { orderItems: true } } }
  });
  const topProducts = products
    .sort((a, b) => b._count.orderItems - a._count.orderItems)
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <header className="mb-10">
        <Link href="/war-room" className="text-primary hover:underline flex items-center gap-2 mb-4 font-bold">
          <ArrowLeft className="h-4 w-4" /> Retour Dashboard
        </Link>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Analytique Business</h1>
      </header>

      {/* Cartes de Performance Flash */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard title="CA Total" value={`${totalRevenue.toLocaleString()} F`} icon={<DollarSign className="text-green-500" />} color="border-green-500/20" />
        <StatCard title="Panier Moyen" value={`${Math.round(avgBasket)} F`} icon={<TrendingUp className="text-blue-500" />} color="border-blue-500/20" />
        <StatCard title="Commandes" value={allOrders.length} icon={<ShoppingBag className="text-orange-500" />} color="border-orange-500/20" />
        <StatCard title="Clients Uniques" value="..." icon={<Users className="text-purple-500" />} color="border-purple-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graphique de Performance Produits */}
        <Card className="bg-slate-900 border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white font-black uppercase text-sm tracking-widest">Top 5 - Meilleures Ventes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {topProducts.map((p, index) => (
              <div key={p.id} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-300">{index + 1}. {p.name}</span>
                  <span className="text-white">{p._count.orderItems} ventes</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-1000" 
                    style={{ width: `${(p._count.orderItems / (allOrders.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* État des Stocks Critique */}
        <Card className="bg-slate-900 border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white font-black uppercase text-sm tracking-widest text-orange-500">Alertes Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-white/5">
              {products.filter(p => p.stock < 10).map(p => (
                <div key={p.id} className="py-3 flex justify-between items-center">
                  <span className="text-slate-300 font-medium">{p.name}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${p.stock <= 5 ? 'bg-red-500 text-white' : 'bg-orange-500/20 text-orange-500'}`}>
                    {p.stock} RESTANTS
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <Card className={`bg-slate-900 border-2 ${color} shadow-xl`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-white">{value}</div>
      </CardContent>
    </Card>
  );
}
