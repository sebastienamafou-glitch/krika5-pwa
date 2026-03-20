// src/components/ProductTableRow.tsx
'use client';

import { useState, useTransition } from 'react';
import { updateProductStock } from '@/actions/product';
import { Button } from '@/components/ui/button';
import { Loader2, Power, PowerOff } from 'lucide-react';

type ProductProps = {
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    isAvailable: boolean;
  }
};

export function ProductTableRow({ product }: ProductProps) {
  const [stock, setStock] = useState(product.stock);
  const [isAvailable, setIsAvailable] = useState(product.isAvailable);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (newStock: number, newAvailability: boolean) => {
    // Optimistic UI : on met à jour l'affichage avant même la réponse du serveur
    setStock(newStock);
    setIsAvailable(newAvailability);
    
    startTransition(async () => {
      await updateProductStock(product.id, newStock, newAvailability);
    });
  };

  return (
    <tr className={`border-b border-white/5 transition-colors hover:bg-white/5 ${!isAvailable ? 'opacity-50 grayscale' : ''}`}>
      <td className="px-6 py-4 font-bold text-white">{product.name}</td>
      <td className="px-6 py-4 text-slate-300 font-medium">{product.price} FCFA</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full bg-slate-800 border-white/10 text-white hover:bg-slate-700"
            onClick={() => handleUpdate(Math.max(0, stock - 1), isAvailable)}
            disabled={isPending}
          >-</Button>
          <span className="w-8 text-center font-black text-white text-lg">{stock}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full bg-slate-800 border-white/10 text-white hover:bg-slate-700"
            onClick={() => handleUpdate(stock + 1, isAvailable)}
            disabled={isPending}
          >+</Button>
        </div>
      </td>
      <td className="px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleUpdate(stock, !isAvailable)}
          disabled={isPending}
          className={isAvailable ? "text-green-500 hover:text-green-400 hover:bg-green-500/10" : "text-red-500 hover:text-red-400 hover:bg-red-500/10"}
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : isAvailable ? <Power className="h-6 w-6" /> : <PowerOff className="h-6 w-6" />}
        </Button>
      </td>
    </tr>
  );
}
