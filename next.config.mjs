// next.config.mjs
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  // On désactive la PWA en mode développement pour éviter les conflits de cache
  disable: process.env.NODE_ENV === "development", 
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optionnel : si tu as des images externes (ex: Supabase), il faudra les déclarer ici
  images: {
    remotePatterns: [],
  },
};

export default withPWA(nextConfig);
