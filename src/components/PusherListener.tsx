// src/components/PusherListener.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';

// Configuration du client Pusher
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

export function PusherListener() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Si les clés ne sont pas configurées ou si on écoute déjà, on sort
    if (!pusherKey || !pusherCluster || isListening) return;

    // Instanciation du client Pusher
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    // Souscription au canal KDS
    const channel = pusher.subscribe('kds-channel');

    // Écoute de l'événement 'new-order'
    channel.bind('new-order', (data: { message: string; orderId: string }) => {
      console.log('Notification KDS reçue via Pusher:', data);
      
      // On déclenche un rafraîchissement Next.js silencieux pour récupérer les nouvelles données
      router.refresh();
      
      // Optionnel : Tu pourrais ajouter un son ou une notification toast ici
    });

    setIsListening(true);

    // Nettoyage lors du démontage du composant
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
      setIsListening(false);
    };
  }, [router, isListening]);

  // Ce composant est purement logique, il ne rend rien visuellement
  return null; 
}
