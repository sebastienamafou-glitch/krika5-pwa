// src/app/war-room/pos/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Banknote, CheckCircle2 } from 'lucide-react';
import { PosTicket } from './PosTicket'; 

export const dynamic = 'force-dynamic';

export default async function PosPage() {
  // On ne récupère que les commandes du jour qui ne sont pas encore payées
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const unpaidOrders = await prisma.order.findMany({
    where: { 
      createdAt: { gte: today },
      paymentStatus: 'UNPAID'
    },
    include: { 
      user: true,
      items: { include: { product: true } }
    },
    orderBy: { createdAt: 'asc' } // La plus ancienne en premier
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <header className="mb-8 border-b border-white/10 pb-6 flex justify-between items-end">
        <div>
          <Link href="/war-room" className="inline-flex items-center text-primary hover:text-primary/80 mb-4 font-bold transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la War Room
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Banknote className="h-8 w-8 text-green-500" /> Caisse Enregistreuse
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Encaissement et validation des commandes</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-500 uppercase">En attente de paiement</div>
          <div className="text-4xl font-black text-white">{unpaidOrders.length}</div>
        </div>
      </header>

      {unpaidOrders.length === 0 ? (
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Toutes les commandes sont réglées</h2>
          <p className="text-slate-400">En attente de nouveaux clients...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {unpaidOrders.map((order) => (
            <PosTicket key={order.id} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}
