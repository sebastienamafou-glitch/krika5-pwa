// src/components/MenuCard.tsx
'use client';

import { useTransition } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { ShoppingBasket, Camera, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { uploadProductImage } from '@/actions/upload';

interface ProductProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl?: string | null;
}

export function MenuCard({ product, isStaff }: { product: ProductProps, isStaff: boolean }) {
  const addItem = useCartStore((state) => state.addItem);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, price: product.price });
  };

  // Logique d'importation de l'image (Live Edit)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convertit l'image en Base64 pour l'envoi au serveur
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      startTransition(async () => {
        const res = await uploadProductImage(product.id, base64String);
        if (!res.success) alert(res.error);
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all duration-300 group hover:-translate-y-1 shadow-xl">
      
      {/* ZONE IMAGE */}
      <div className="relative h-48 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="text-slate-800 font-bold uppercase tracking-widest text-xs flex flex-col items-center gap-2">
            <Camera className="w-8 h-8" />
            Aucune photo
          </div>
        )}

        {/* OVERLAY D'UPLOAD (Visible uniquement par le Staff) */}
        {isStaff && (
          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm z-10">
            {isPending ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-white mb-2" />
                <span className="text-white text-xs font-bold uppercase tracking-widest bg-primary/80 px-4 py-2 rounded-xl">
                  {product.imageUrl ? "Modifier la photo" : "Ajouter une photo"}
                </span>
                <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleImageUpload} disabled={isPending} />
              </>
            )}
          </label>
        )}
      </div>

      {/* ZONE TEXTE ET BOUTON */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4 gap-4">
          <h3 className="text-xl font-black text-white leading-tight">{product.name}</h3>
          <span className="bg-slate-950 text-white font-black text-sm px-3 py-1.5 rounded-xl border border-white/10 whitespace-nowrap shadow-inner">
            {product.price} F
          </span>
        </div>
        {product.description && (
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
            {product.description}
          </p>
        )}
        
        <button
          onClick={handleAdd}
          className="w-full mt-auto py-4 bg-slate-800 hover:bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all group-hover:shadow-lg group-hover:shadow-primary/20"
        >
          <ShoppingBasket className="w-5 h-5" /> Ajouter au panier
        </button>
      </div>
    </div>
  );
}
