// src/components/PusherListener.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';

export function PusherListener() {
  const router = useRouter();

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSER_KEY; // Vérifie bien l'orthographe ici (PUSER vs PUSHER)
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn("⚠️ Configuration Pusher manquante dans le .env");
      return;
    }

    // 1. Initialisation unique
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channel = pusher.subscribe('kds-channel');

    // 2. Écoute de l'événement
    channel.bind('new-order', (data: { orderId: string }) => {
      console.log('🔔 Nouvelle commande KDS :', data.orderId);
      router.refresh(); // Mise à jour des données serveur
    });

    // 3. Nettoyage (Cleanup) : Crucial pour éviter les connexions multiples
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [router]); // Ne dépend que du router, s'exécute une seule fois au montage

  return null; 
}
