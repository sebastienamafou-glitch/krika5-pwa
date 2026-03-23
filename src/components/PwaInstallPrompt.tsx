// src/components/PwaInstallPrompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';

// Type strict pour l'événement d'installation natif (Chrome/Android)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [isMounted, setIsMounted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setIsMounted(true);

    // Vérifie si le client a déjà fermé la bannière ou s'il utilise déjà l'app installée
    const isDismissed = localStorage.getItem('krika5-pwa-dismissed') === 'true';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone);

    if (isDismissed || isStandalone) return;

    // Détection de l'OS pour appliquer la bonne stratégie
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isAppleDevice) {
      setIsIOS(true);
      // Sur iOS, on attend 3 secondes avant d'afficher le message pour ne pas être trop agressif
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Intercepte l'événement d'installation natif (Android / Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // On attend également un peu sur Android
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('krika5-pwa-dismissed', 'true');
    setShowPrompt(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!isMounted || !showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl flex flex-col gap-4">
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4 items-center pr-6">
          <div className="bg-primary/20 p-3 rounded-2xl shrink-0">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="text-white font-black leading-tight mb-1">
              Installer l&apos;application
            </h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Ajoutez la carte à votre écran d&apos;accueil pour commander plus vite !
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-slate-950/50 rounded-2xl p-4 flex flex-col gap-3 border border-white/5">
            <p className="text-xs text-slate-300 font-bold flex items-center gap-3">
              <span className="bg-slate-800 text-slate-400 w-5 h-5 flex items-center justify-center rounded-md">1</span> 
              Touchez l&apos;icône <Share className="w-4 h-4 text-blue-400 mx-1" /> en bas.
            </p>
            <p className="text-xs text-slate-300 font-bold flex items-center gap-3">
              <span className="bg-slate-800 text-slate-400 w-5 h-5 flex items-center justify-center rounded-md">2</span> 
              Choisissez <PlusSquare className="w-4 h-4 text-slate-400 mx-1" /> &quot;Sur l&apos;écran d&apos;accueil&quot;.
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 bg-primary hover:bg-orange-500 text-white font-black rounded-xl transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs"
          >
            Installer maintenant
          </button>
        )}
      </div>
    </div>
  );
}
