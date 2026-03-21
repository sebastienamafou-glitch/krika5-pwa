// src/components/ProductCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { ShoppingBasket } from 'lucide-react';

type ProductProps = {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    isAvailable: boolean;
    imageUrl: string | null;
  };
};

export function ProductCard({ product }: ProductProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [imageError, setImageError] = useState(false);

  // Règles métier strictes : Indisponible si stock à 0 OU si bouton d'arrêt d'urgence activé
  const isOutOfStock = !product.isAvailable || product.stock <= 0;
  
  // Détermine si on doit afficher l'image ou le texte de remplacement
  const showImage = Boolean(product.imageUrl && !imageError);

  return (
    <div className={`flex flex-col bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-primary/50 ${isOutOfStock ? 'opacity-70 grayscale-[0.5]' : ''}`}>
      
      {/* Zone Image Optimisée */}
      <div className="h-56 bg-slate-800 relative group overflow-hidden flex items-center justify-center">
         
         {showImage ? (
           <Image 
             src={product.imageUrl as string} 
             alt={`Photo de ${product.name}`}
             fill
             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
             onError={() => setImageError(true)}
             className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? 'opacity-50' : 'opacity-90'}`}
           />
         ) : (
           <span className="text-slate-500 font-medium z-0 text-center px-4">
             En attente de photo
           </span>
         )}

         {/* Overlay Rupture de stock */}
         {isOutOfStock && (
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
             <span className="bg-red-600 text-white px-5 py-2 font-black rounded-lg uppercase tracking-widest rotate-[-10deg] border-2 border-white shadow-2xl">
               Épuisé
             </span>
           </div>
         )}
         
         {/* Badge Prix */}
         <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl z-20">
            <span className="text-white font-black">{product.price} FCFA</span>
         </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-black text-white mb-2 leading-tight">{product.name}</h3>
        
        {product.description && (
          <p className="text-slate-400 text-sm mb-6 leading-relaxed line-clamp-3">
            {product.description}
          </p>
        )}
        
        <Button 
          onClick={() => addItem({ id: product.id, name: product.name, price: product.price })}
          disabled={isOutOfStock}
          className="mt-auto w-full bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold h-14 rounded-xl text-lg transition-colors border border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingBasket className="mr-2 h-6 w-6" /> 
          {isOutOfStock ? 'Indisponible' : 'Ajouter au panier'}
        </Button>
      </div>
    </div>
  );
}
