// src/lib/pusher.ts
import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// 1. Instance Serveur (Backend) : Pour DÉCLENCHER des événements
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// 2. Instance Client (Frontend React) : Pour ÉCOUTER des événements
export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});
