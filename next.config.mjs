// next.config.mjs

import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public', // Le Service Worker sera compilé dans le dossier public
  disable: process.env.NODE_ENV === 'development', // Ne pas utiliser le cache PWA en dev pour faciliter le débug
  register: true, // Le client enregistre automatiquement le SW
  skipWaiting: true, // Mise à jour automatique de la PWA sans recharger manuellement
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Si tu utilises Supabase Storage pour les images de tes burgers plus tard
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Autorise le domaine Supabase
      },
    ],
  },
};

export default withPWA(nextConfig);
