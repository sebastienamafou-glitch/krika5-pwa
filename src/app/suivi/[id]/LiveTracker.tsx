// src/app/suivi/[id]/LiveTracker.tsx
'use client';

import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher';
import { CheckCircle2, ChefHat, Clock, Flame } from 'lucide-react';

interface TrackerProps {
  orderId: string;
  initialStatus: string;
}

export function LiveTracker({ orderId, initialStatus }: TrackerProps) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    // Si déjà terminé, on ne fait rien
    if (status === 'COMPLETED') return;

    // Abonnement au canal unique de CETTE commande
    const channel = pusherClient.subscribe(`order-${orderId}`);

    channel.bind('status-updated', (data: { status: string }) => {
      setStatus(data.status);
      
      // DÉCLENCHEMENT DU BUZZER NATIVE (Vibration si le téléphone le supporte)
      if (data.status === 'COMPLETED') {
        if ('vibrate' in navigator) {
          // Motif de vibration : Vibre, pause, vibre long, pause, vibre
          navigator.vibrate([200, 100, 500, 100, 200]); 
        }
      }
    });

    return () => {
      pusherClient.unsubscribe(`order-${orderId}`);
    };
  }, [orderId, status]);

  // Logique d'affichage selon le statut
  const isPreparing = status === 'PREPARING' || status === 'COMPLETED';
  const isReady = status === 'COMPLETED';

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl transition-all duration-500 relative overflow-hidden">
      
      {/* Effet lumineux de fond si prêt */}
      {isReady && <div className="absolute inset-0 bg-emerald-500/20 animate-pulse z-0 pointer-events-none"></div>}

      <div className="relative z-10">
        <div className="text-center mb-10">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">
            Commande <span className="text-white">#{orderId.slice(-6).toUpperCase()}</span>
          </p>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {isReady ? "C&apos;est prêt !" : isPreparing ? "En cuisine" : "Validée"}
          </h2>
        </div>

        {/* JAUGE DE PROGRESSION */}
        <div className="relative flex justify-between items-center mb-8 px-2">
          {/* Ligne de fond */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full z-0"></div>
          
          {/* Ligne de progression */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-1000"
            style={{ width: isReady ? '100%' : isPreparing ? '50%' : '0%' }}
          ></div>

          {/* Étapes */}
          <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-500 ${status ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-slate-800 text-slate-500'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-500 ${isPreparing ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-slate-800 text-slate-500'}`}>
            <Flame className="w-5 h-5" />
          </div>
          <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-500 ${isReady ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/50 scale-110' : 'bg-slate-800 text-slate-500'}`}>
            <CheckCircle2 className="w-8 h-8" />
          </div>
        </div>

        {/* MESSAGE DYNAMIQUE */}
        <div className="text-center bg-slate-950/50 p-5 rounded-3xl border border-white/5">
          {isReady ? (
            <p className="text-emerald-400 font-black text-sm uppercase tracking-widest animate-bounce mt-2">
              Rendez-vous au comptoir !
            </p>
          ) : isPreparing ? (
            <p className="text-slate-300 font-medium text-sm flex items-center justify-center gap-2">
              <ChefHat className="w-4 h-4 text-primary" /> Nos chefs préparent votre repas...
            </p>
          ) : (
            <p className="text-slate-400 font-medium text-sm">
              En attente de prise en charge.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
