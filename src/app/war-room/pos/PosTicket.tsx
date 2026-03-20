// src/app/war-room/pos/PosTicket.tsx
'use client';

import { useTransition } from 'react';
import { processPayment } from '@/actions/pos';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Banknote, Smartphone } from 'lucide-react';

type PosTicketProps = {
  order: {
    id: string;
    createdAt: Date;
    totalAmount: number;
    user: { phone: string };
    items: {
      id: string;
      quantity: number;
      product: { name: string };
    }[];
  };
};

export function PosTicket({ order }: PosTicketProps) {
  const [isPending, startTransition] = useTransition();

  const handlePayment = (method: string) => {
    startTransition(async () => {
      await processPayment(order.id, method);
    });
  };

  return (
    <Card className="bg-slate-900 border-white/10 shadow-xl flex flex-col h-full">
      <CardHeader className="border-b border-white/5 bg-slate-800/50 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-black text-white">Cmd #{order.id.split('-')[0].toUpperCase()}</CardTitle>
            <p className="text-sm text-slate-400 font-medium mt-1">Client: {order.user.phone}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-green-400">{order.totalAmount} F</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 py-4">
        <ul className="space-y-2 text-sm text-slate-300">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>{item.quantity}x {item.product.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="flex gap-3 pt-4 border-t border-white/5">
        <Button 
          onClick={() => handlePayment('ESPECES')}
          disabled={isPending}
          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Banknote className="mr-2 h-5 w-5" /> Espèces</>}
        </Button>
        <Button 
          onClick={() => handlePayment('MOBILE_MONEY')}
          disabled={isPending}
          className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Smartphone className="mr-2 h-5 w-5" /> Mobile</>}
        </Button>
      </CardFooter>
    </Card>
  );
}
