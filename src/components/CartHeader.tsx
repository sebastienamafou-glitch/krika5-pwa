'use client';

import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { useEffect, useState } from 'react';
import { CartSheet } from './CartSheet'; 
export function CartHeader() {
  const [isMounted, setIsMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    // Effet Glassmorphism : semi-transparent avec flou d'arrière-plan
    <header className="fixed top-0 left-0 w-full bg-slate-950/90 backdrop-blur-sm z-50 px-6 py-4 flex items-center justify-between border-b border-white/5">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">

        <a href="#" className="inline-block transition-transform hover:scale-105">
          <Image
            src="/logo-krika5.png" // Assure-toi que ce fichier est dans ton dossier public
            alt="Logo KRIKA'5" 
            width={100}  // Précédemment 140
            height={100} // Précédemment 140
            className="mb-8 drop-shadow-2xl rounded-3xl" 
            priority 
          />
        </a>

        <div className="flex items-center gap-4">
          {isMounted ? (
            <>
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{totalItems} article(s)</span>
                <span className="text-lg font-bold text-white">
                  {getTotal()} FCFA
                </span>
              </div>
              {/* Le bouton statique est remplacé par le composant Sheet */}
              <CartSheet />
            </>
          ) : (
            <div className="flex items-center gap-4 opacity-0">
               <div className="flex flex-col items-end">
                <span className="text-xs font-semibold">0 article(s)</span>
                <span className="text-lg font-bold">0 FCFA</span>
              </div>
              <div className="h-11 w-11"></div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
