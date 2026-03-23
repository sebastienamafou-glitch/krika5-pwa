// src/components/OrderRadar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Radar } from 'lucide-react';
import { checkOrderStatusForRadar } from '@/actions/order';

export function OrderRadar() {
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Récupération de l'ID
    const saved = localStorage.getItem('krika_last_order');
    if (!saved) return;
    
    setLastOrderId(saved);

    // 2. Vérification silencieuse du statut
    const verifyStatus = async () => {
      const result = await checkOrderStatusForRadar(saved);
      if (!result.isActive) {
        localStorage.removeItem('krika_last_order');
        setLastOrderId(null);
      }
    };

    verifyStatus();
    
    // On vérifie toutes les 30 secondes tant que le composant est monté
    const interval = setInterval(verifyStatus, 30000);
    return () => clearInterval(interval);
    
  }, []);

  if (!lastOrderId) return null;

  return (
    <Link 
      href={`/suivi/${lastOrderId}`}
      className="fixed bottom-8 right-6 z-50 group transition-all active:scale-90"
    >
      <div className="relative">
        <span className="absolute inset-0 rounded-2xl bg-primary/40 animate-ping"></span>
        <div className="relative bg-slate-900 border border-primary/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 group-hover:bg-primary transition-all duration-300">
           <Radar className="w-5 h-5 text-primary group-hover:text-white animate-pulse" />
           <div className="flex flex-col items-start leading-none pr-1">
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white/80">Commande</span>
             <span className="text-xs font-black uppercase tracking-tight">En cours</span>
           </div>
        </div>
      </div>
    </Link>
  );
}
