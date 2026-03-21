// src/components/CartHeader.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Gift } from 'lucide-react';
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
    <header className="fixed top-0 left-0 w-full bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-between border-b border-white/5">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">

        {/* Lien de retour à l'accueil optimisé pour Next.js */}
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <Image
            src="/logo-krika5.png" 
            alt="Logo KRIKA'5" 
            width={70}  // Ajusté légèrement pour ne pas déformer le header de 80px (h-20)
            height={70} 
            className="drop-shadow-2xl rounded-2xl" 
            priority 
          />
        </Link>

        <div className="flex items-center gap-3 md:gap-5">
          
          {/* Nouveau Bouton d'accès au programme de fidélité */}
          <Link 
            href="/fidelite" 
            className="flex items-center gap-2 text-sm font-bold text-emerald-400 bg-emerald-400/10 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors shadow-sm"
          >
            <Gift className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Mon Club</span>
          </Link>

          {isMounted ? (
            <>
              {/* Infos panier (masquées sur petit mobile pour gagner de la place) */}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{totalItems} article(s)</span>
                <span className="text-lg font-bold text-white">
                  {getTotal()} FCFA
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
