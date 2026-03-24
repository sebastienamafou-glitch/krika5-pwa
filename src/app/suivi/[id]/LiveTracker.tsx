// src/app/suivi/[id]/LiveTracker.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { pusherClient } from '@/lib/pusher';
import { CheckCircle2, Clock, Flame, Volume2, VolumeX } from 'lucide-react';
import Pusher from 'pusher-js';

Pusher.logToConsole = false;

interface TrackerProps {
  orderId: string;
  initialStatus: string;
}

export function LiveTracker({ orderId, initialStatus }: TrackerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [audioEnabled, setAudioEnabled] = useState(false); // État pour le déverrouillage
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialisation de l'objet Audio une seule fois
  useEffect(() => {
    audioRef.current = new Audio('/ding.mp3');
  }, []);

  const enableAudio = () => {
    if (audioRef.current) {
      // On joue un son vide ou très court pour déverrouiller l'audio context
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        setAudioEnabled(true);
      }).catch(() => {
        console.log("Interaction requise pour l'audio");
      });
    }
  };

  useEffect(() => {
    const channel = pusherClient.subscribe(`order-${orderId}`);

    channel.bind('status-updated', (data: { status: string }) => {
      setStatus(data.status);
      
      // Jouer le son si activé
      if (audioEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      // Vibreur pour mobile
      if (data.status === 'COMPLETED' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 500, 100, 200]); 
      }
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`order-${orderId}`);
    };
  }, [orderId, audioEnabled]);

  const isPreparing = status === 'PREPARING' || status === 'COMPLETED';
  const isReady = status === 'COMPLETED';

  return (
    <div className="w-full max-w-md space-y-8">
      
      {/* BANDEAU D'ACTIVATION AUDIO (Si pas encore activé) */}
      {!audioEnabled && (
        <button 
          onClick={enableAudio}
          className="w-full flex items-center justify-between bg-orange-500/20 border border-orange-500/50 p-4 rounded-2xl animate-pulse"
        >
          <div className="flex items-center gap-3">
            <VolumeX className="text-orange-500 w-5 h-5" />
            <span className="text-orange-500 text-xs font-bold uppercase tracking-wider text-left">
              Cliquez pour activer l&apos;alerte sonore
            </span>
          </div>
          <Volume2 className="text-orange-500 w-5 h-5" />
        </button>
      )}

      <div className="relative flex items-center justify-between px-4">
        {/* Barre de progression en arrière-plan */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-primary transition-all duration-1000 -translate-y-1/2" 
          style={{ width: isReady ? '100%' : isPreparing ? '50%' : '0%' }}
        />

        {/* Étapes */}
        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-500 ${true ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-slate-800 text-slate-500'}`}>
          <Clock className="w-5 h-5" />
        </div>
        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-500 ${isPreparing ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-slate-800 text-slate-500'}`}>
          <Flame className="w-5 h-5" />
        </div>
        <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-500 ${isReady ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/50 scale-110' : 'bg-slate-800 text-slate-500'}`}>
          <CheckCircle2 className="w-8 h-8" />
        </div>
      </div>

      <div className="text-center bg-slate-950/50 p-5 rounded-3xl border border-white/5">
        {isReady ? (
          <p className="text-emerald-400 font-black text-sm uppercase tracking-widest animate-bounce mt-2">
            Rendez-vous au comptoir !
          </p>
        ) : isPreparing ? (
          <p className="text-slate-300 font-medium text-sm">Chef Krika prépare votre commande...</p>
        ) : (
          <p className="text-slate-500 text-sm">Commande enregistrée...</p>
        )}
      </div>
    </div>
  );
}
