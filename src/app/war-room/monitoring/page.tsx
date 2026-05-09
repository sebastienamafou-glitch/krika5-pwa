// src/app/war-room/monitoring/page.tsx
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, Smartphone, Globe, ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MonitoringPage() {
  // 1. RÉCUPÉRATION DES MÉTRIQUES (Performance Réelle)
  const stats = await prisma.performanceLog.groupBy({
    by: ['metric'],
    _avg: { value: true },
    _count: true,
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 text-white">
      <header className="mb-10">
        <Link href="/war-room" className="text-amber-500 hover:text-amber-400 flex items-center gap-2 mb-4 font-black text-xs uppercase tracking-widest">
          <ArrowLeft className="h-4 w-4" /> Retour Dashboard
        </Link>
        <h1 className="text-5xl font-black uppercase tracking-tighter italic">Vitals & Network</h1>
        <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">Optimisation Connectivité Côte d&apos;Ivoire</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <MetricCard 
          title="LCP (Chargement)" 
          value={`${(stats.find(s => s.metric === 'LCP')?._avg.value || 0).toFixed(2)}s`} 
          status={ (stats.find(s => s.metric === 'LCP')?._avg.value || 0) < 2.5 ? 'GOOD' : 'POOR' }
          icon={<Zap className="text-amber-500" />} 
        />
        <MetricCard 
          title="CLS (Stabilité)" 
          value={(stats.find(s => s.metric === 'CLS')?._avg.value || 0).toFixed(3)} 
          status={ (stats.find(s => s.metric === 'CLS')?._avg.value || 0) < 0.1 ? 'GOOD' : 'POOR' }
          icon={<Activity className="text-emerald-500" />} 
        />
        <MetricCard 
          title="Sessions Actives" 
          value={stats.reduce((acc, s) => acc + s._count, 0)} 
          status="NEUTRAL"
          icon={<Globe className="text-blue-500" />} 
        />
      </div>

      <Card className="bg-slate-900 border-white/5 shadow-2xl">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-purple-500" /> Analyse par Appareil (Mobile vs Desktop)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-slate-500 font-medium">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>Les données de segmentation réseau (Orange/MTN) apparaîtront après les 100 premières sessions réelles.</p>
        </CardContent>
      </Card>
    </main>
  );
}

function MetricCard({ title, value, status, icon }: { title: string, value: string | number, status: 'GOOD' | 'POOR' | 'NEUTRAL', icon: React.ReactNode }) {
  const statusColor = status === 'GOOD' ? 'text-emerald-500' : status === 'POOR' ? 'text-red-500' : 'text-slate-400';
  return (
    <Card className="bg-slate-900 border-white/5 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-white tracking-tighter">{value}</div>
        <p className={`text-[10px] font-bold mt-1 uppercase ${statusColor}`}>
          {status === 'GOOD' ? '● Performance Optimale' : status === 'POOR' ? '▲ Attention Requise' : '○ Données en cours'}
        </p>
      </CardContent>
    </Card>
  );
}
