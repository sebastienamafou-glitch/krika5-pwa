'use client';

import Image from 'next/image';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/useCartStore';
import { ShoppingBasket } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
}

export function ProductCard({ id, name, description, price, imageUrl }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({ id, name, price });
  };

  return (
    // Carte style "Widget ImmoFacile" : bordure très fine, fond ardoise, hover subtil
    <Card className="flex flex-col overflow-hidden border-white/5 bg-card rounded-2xl shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 group">
      
      {/* Zone image propre et intégrée */}
      <div className="relative h-48 w-full bg-slate-800/50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
            Photo indisponible
          </div>
        )}
        {/* Badge de prix flottant et élégant */}
        <Badge className="absolute right-3 top-3 bg-black/40 backdrop-blur-md text-white border border-white/10 px-3 py-1 font-bold rounded-lg">
          {price} FCFA
        </Badge>
      </div>
      
      {/* Textes alignés à gauche pour une lecture fluide (standard web) */}
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-xl font-bold text-white tracking-tight">
          {name}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {description || 'Aucune description disponible.'}
        </CardDescription>
      </CardHeader>
      
      <CardFooter className="mt-auto p-5 pt-2">
        <Button 
          onClick={handleAddToCart} 
          className="w-full font-semibold text-sm bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 rounded-xl h-11 transition-all gap-2"
        >
          <ShoppingBasket className="h-4 w-4" />
          Ajouter
        </Button>
      </CardFooter>
    </Card>
  );
}
