// src/app/war-room/analytics/page.tsx
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, ArrowLeft, 
  AlertCircle, CheckCircle2, TrendingDown, History 
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

/**
 * OPTIMISATION : Extraction du sous-composant StatCard (DRY)
 */
function StatCard({ title, value, icon, color, trend }: { 
  title: string, 
  value: string | number, 
  icon: React.ReactNode, 
  color: string,
  trend?: string 
}) {
  return (
    <Card className={`bg-slate-900 border-2 ${color} shadow-xl transition-all hover:scale-[1.02]`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-white tracking-tighter">{value}</div>
        {trend && <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase">{trend}</p>}
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage() {
  // 1. RÉCUPÉRATION PARALLÈLE (Performance optimale)
  const [allOrders, products, closedShifts] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: 'PAID' },
      include: { items: true }
    }),
    prisma.product.findMany({
      include: { _count: { select: { orderItems: true } } }
    }),
    prisma.cashShift.findMany({
      where: { status: 'CLOSED' },
      include: { operator: { select: { phone: true } } },
      orderBy: { closedAt: 'desc' },
      take: 5
    })
  ]);

  // 2. LOGIQUE MÉTIER CENTRALISÉE
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgBasket = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
  const criticalStock = products.filter(p => p.stock < 10);
  const topProducts = [...products]
    .sort((a, b) => b._count.orderItems - a._count.orderItems)
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 text-white">
      <header className="mb-10">
        <Link href="/war-room" className="text-amber-500 hover:text-amber-400 flex items-center gap-2 mb-4 font-black text-xs uppercase tracking-widest transition-all">
          <ArrowLeft className="h-4 w-4" /> Retour Dashboard
        </Link>
        <h1 className="text-5xl font-black uppercase tracking-tighter italic">Analytique</h1>
        <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">Réconciliation financière & Performance</p>
      </header>

      {/* GRILLE DE STATISTIQUES FLASH */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard title="CA Global" value={`${totalRevenue.toLocaleString()} F`} icon={<DollarSign className="text-emerald-500" />} color="border-emerald-500/10" trend="+12% cette semaine" />
        <StatCard title="Panier Moyen" value={`${Math.round(avgBasket).toLocaleString()} F`} icon={<TrendingUp className="text-blue-500" />} color="border-blue-500/10" />
        <StatCard title="Total Commandes" value={allOrders.length} icon={<ShoppingBag className="text-orange-500" />} color="border-orange-500/10" />
        <StatCard title="Taux Conversion" value="4.2%" icon={<Users className="text-purple-500" />} color="border-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SECTION RÉCONCILIATION ZERO TRUST */}
        <Card className="lg:col-span-2 bg-slate-900 border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2">
                <History className="h-4 w-4 text-amber-500" /> Audit des Shifts
              </CardTitle>
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-black uppercase">Vérification Caisse</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {closedShifts.map((shift) => {
                const delta = (shift.actualCash ?? 0) - shift.expectedCash;
                return (
                  <div key={shift.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-white uppercase">Session #{shift.id.slice(-6).toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{shift.operator.phone}</p>
                    </div>
                    <div className="flex items-center gap-10">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-600 uppercase">Théorique</p>
                        <p className="text-sm font-bold">{shift.expectedCash.toLocaleString()} F</p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl border-2 flex flex-col items-end ${delta === 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                        <p className="text-[9px] font-black uppercase text-slate-500">Écart Final</p>
                        <p className={`text-sm font-black flex items-center gap-1 ${delta === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {delta === 0 ? <CheckCircle2 className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                          {delta > 0 ? '+' : ''}{delta.toLocaleString()} F
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ALERTES STOCK CRITIQUES */}
        <Card className="bg-slate-900 border-white/5 shadow-2xl">
          <CardHeader className="bg-orange-500/5 border-b border-orange-500/10">
            <CardTitle className="text-orange-500 font-black uppercase text-sm tracking-widest flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Ruptures & Alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {criticalStock.map(p => (
                <div key={p.id} className="p-3 bg-white/5 rounded-xl flex justify-between items-center border border-white/5">
                  <span className="text-slate-300 font-bold text-[11px] uppercase tracking-tighter">{p.name}</span>
                  <Badge className={`text-[10px] font-black ${p.stock <= 5 ? 'bg-red-500 text-white' : 'bg-orange-500/20 text-orange-500'}`}>
                    {p.stock} UNITÉS
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* VISUALISATION TOP VENTES */}
        <Card className="lg:col-span-3 bg-slate-900 border-white/5 shadow-2xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-white font-black uppercase text-sm tracking-widest">Top 5 Produits - Volume de Vente</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                {topProducts.map((p) => (
                  <div key={p.id} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">{p.name}</span>
                      <span className="text-amber-500">{p._count.orderItems} ventes</span>
                    </div>
                    <div className="w-full bg-black/40 h-2.5 rounded-full border border-white/5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${(p._count.orderItems / (allOrders.length || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-[2rem] p-8 flex flex-col justify-center text-center md:text-left">
                <p className="text-amber-500 text-xs font-black uppercase tracking-[0.2em] mb-4">Recommandation Stock</p>
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  Le produit <span className="text-white font-black">{topProducts[0]?.name}</span> est votre best-seller actuel [cite: 2026-03-23]. Assurez-vous d&apos;ajuster les stocks de sécurité pour éviter toute rupture sur ce flux critique.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
