// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt'; // Ajoute cet import

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Empêche le zoom auto sur iOS
};

export const metadata: Metadata = {
  title: "KRIKA'5",
  description: "Tous nos menus à 1500 FCFA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KRIKA'5",
  },
  icons: {
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
