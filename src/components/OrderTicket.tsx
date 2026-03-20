// src/components/OrderTicket.tsx
'use client';

import { useTransition } from 'react';
import { completeOrder } from '@/actions/order';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';

// Typage minimaliste pour le composant
type OrderTicketProps = {
  order: any; // Nous utilisons any ici pour la rapidité, mais en prod on typera avec Prisma
};

export function OrderTicket({ order }: OrderTicketProps) {
  const [isPending, startTransition] = useTransition();

  const handleComplete = () => {
    startTransition(async () => {
      await completeOrder(order.id);
    });
  };

  // Formatage de l'heure
  const time = new Date(order.createdAt).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Card className="flex flex-col border-white/10 bg-slate-900 shadow-xl transition-all">
      <CardHeader className="border-b border-white/5 pb-3 bg-slate-800/50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-black text-white">
            #{order.id.split('-')[0].toUpperCase()}
          </CardTitle>
          <span className="text-primary font-black text-xl">{time}</span>
        </div>
        <p className="text-sm font-medium text-slate-400">Client: {order.user.phone}</p>
      </CardHeader>
      
      <CardContent className="flex-1 py-4">
        <ul className="space-y-3">
          {order.items.map((item: any) => (
            <li key={item.id} className="flex justify-between text-white text-lg font-medium border-b border-white/5 pb-2 last:border-0">
              <span>
                <span className="text-primary font-black mr-2">{item.quantity}x</span> 
                {item.product.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="border-t border-white/5 pt-4">
        <Button 
          onClick={handleComplete} 
          disabled={isPending}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-14 rounded-xl text-lg"
        >
          {isPending ? (
             <Loader2 className="h-6 w-6 animate-spin" /> 
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-6 w-6" /> 
              Servir la commande
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
