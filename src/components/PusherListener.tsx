// src/components/PusherListener.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';

export function PusherListener() {
  const router = useRouter();
  // Utilisation d'une ref pour s'assurer qu'on n'instancie Pusher qu'une seule fois
  const pusherInstance = useRef<Pusher | null>(null);

  useEffect(() => {
    // CORRECTION DE LA FAUTE DE FRAPPE ICI
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY; 
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn("⚠️ Configuration Pusher manquante dans le .env");
      return;
    }

    if (!pusherInstance.current) {
      pusherInstance.current = new Pusher(pusherKey, {
        cluster: pusherCluster,
      });

      const channel = pusherInstance.current.subscribe('kds-channel');

      channel.bind('new-order', (data: { orderId: string }) => {
        console.log('🔔 Nouvelle commande reçue sur le KDS :', data.orderId);
        
        // Jouer un petit son "ding"
        try {
          const audio = new Audio('/ding.mp3'); // Assure-toi d'avoir un fichier ding.mp3 dans /public
          audio.play().catch(() => {}); // Le catch évite l'erreur si le navigateur bloque l'autoplay
        } catch (e) {
          // Ignorer si l'audio n'est pas supporté
        }

        router.refresh(); 
      });
    }

    return () => {
      if (pusherInstance.current) {
        pusherInstance.current.unsubscribe('kds-channel');
        pusherInstance.current.disconnect();
        pusherInstance.current = null;
      }
    };
  }, [router]); 

  return null; 
}
