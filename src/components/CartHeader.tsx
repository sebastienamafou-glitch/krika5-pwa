// /src/components/CartHeader.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Gift } from 'lucide-react';
import { usePosStore } from '@/store/usePosStore';
import { useEffect, useState } from 'react';
import { CartSheet } from './CartSheet'; 

export function CartHeader() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Utilisation des nouvelles propriétés du store POS
  const cart = usePosStore((state) => state.cart);
  const cartTotal = usePosStore((state) => state.cartTotal);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calcul basé sur cartQuantity (le nouveau nom du champ quantity)
  const totalItems = cart.reduce((acc, item) => acc + item.cartQuantity, 0);

  return (
    <header className="fixed top-0 left-0 w-full bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-between border-b border-white/5">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <Image src="/logo-krika5.png" alt="Logo KRIKA'5" width={70} height={70} className="drop-shadow-2xl rounded-2xl" priority />
        </Link>

        <div className="flex items-center gap-3 md:gap-5">
          <Link href="/fidelite" className="flex items-center gap-2 text-sm font-bold text-emerald-400 bg-emerald-400/10 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors shadow-sm">
            <Gift className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Mon Club</span>
          </Link>

          {isMounted ? (
            <>
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{totalItems} article(s)</span>
                <span className="text-lg font-bold text-white">
                  {cartTotal} FCFA
                </span>
              </div>
              <CartSheet />
            </>
          ) : (
            <div className="flex items-center gap-4 opacity-0">
               <div className="hidden md:flex flex-col items-end">
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
