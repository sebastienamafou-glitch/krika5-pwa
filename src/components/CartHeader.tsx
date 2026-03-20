'use client';

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
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        
        <h1 className="text-2xl font-black tracking-tight text-white">
          KRIKA<span className="text-primary">'5</span>
        </h1>
        
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
