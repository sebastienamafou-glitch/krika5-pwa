// src/app/suivi/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import { LiveTracker } from './LiveTracker';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function TrackingPage({ params }: PageProps) {
 // On sécurise l'ID en forçant les minuscules
  const safeId = params.id.toLowerCase();

  // On va chercher la commande dans la base de données
  const order = await prisma.order.findUnique({
    where: { id: safeId },
    select: { id: true, status: true, orderType: true }
  });

  // Si l'ID dans l'URL n'existe pas, on affiche une page 404
  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md mb-8">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-white font-bold transition-colors text-xs uppercase tracking-widest">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour au menu
        </Link>
      </div>

      <Image 
        src="/icon-512x512.png"
        alt="Logo KRIKA&apos;5" 
        width={80} 
        height={80} 
        className="mb-8 drop-shadow-2xl rounded-2xl" 
        priority
      />

      {/* On injecte le composant Client avec les données réelles de la BD */}
      <LiveTracker orderId={order.id} initialStatus={order.status} />

      {order.orderType === 'DELIVERY' && (
        <p className="mt-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xs leading-relaxed">
          Une fois prête, votre commande sera remise à notre livreur.
        </p>
      )}
    </main>
  );
}
