// next.config.mjs
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Désactive le Service Worker en développement pour éviter les conflits de cache intempestifs
  disable: process.env.NODE_ENV === "development",
  // Stratégies d'optimisation agressives pour App Router
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
    // Exclure les routes API des caches statiques pour forcer systématiquement le Network First
    exclude: [/\/api\//],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default withPWA(nextConfig);
