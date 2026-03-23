// src/components/OrderTicket.tsx
'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, ShoppingBag, Utensils, CheckCircle2, Loader2, Navigation } from 'lucide-react';
import { markOrderAsReady } from '@/actions/kds'; 

interface OrderItem {
  id: string;
  quantity: number;
  product: { name: string; };
}

interface KdsOrder {
  id: string;
  createdAt: Date;
  orderType: 'TAKEAWAY' | 'DELIVERY'; 
  deliveryAddress: string | null;     
  deliveryLat: number | null; // CORRECTION : Ajout du typage
  deliveryLng: number | null; // CORRECTION : Ajout du typage
  user: { phone: string; } | null;
  items: OrderItem[];
}

interface OrderTicketProps {
  order: KdsOrder;
}

export function OrderTicket({ order }: OrderTicketProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const isDelivery = order.orderType === 'DELIVERY';
  const isLate = elapsed > 15; 

  useEffect(() => {
    const calculateElapsed = () => {
      const diff = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
      setElapsed(diff);
    };
    calculateElapsed();
    const timer = setInterval(calculateElapsed, 60000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const handleComplete = async () => {
    setIsPending(true);
    const result = await markOrderAsReady(order.id);
    
    if (!result.success) {
      alert(result.error);
      setIsPending(false);
    }
  };

  return (
    <div className={`flex flex-col rounded-[2rem] border-2 overflow-hidden shadow-xl transition-all ${
      isDelivery 
        ? 'bg-purple-950/20 border-purple-500/30 shadow-purple-900/20' 
        : 'bg-slate-900 border-white/10'                               
    }`}>
      
      {/* EN-TÊTE DU TICKET */}
      <div className={`p-5 border-b flex justify-between items-start ${
        isDelivery ? 'bg-purple-500/10 border-purple-500/20' : 'bg-white/5 border-white/5'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-black text-white tracking-tight">
              #{order.id.slice(-5).toUpperCase()}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
              isDelivery ? 'bg-purple-500 text-white' : 'bg-primary text-white'
            }`}>
              {isDelivery ? <ShoppingBag className="w-3 h-3" /> : <Utensils className="w-3 h-3" />}
              {isDelivery ? 'Livraison' : 'À Emporter'}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-400">Client: {order.user?.phone || 'Anonyme'}</p>
        </div>

        {/* CHRONOMÈTRE */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm ${
          isLate ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-950/50 text-slate-300'
        }`}>
          <Clock className="w-4 h-4" />
          {elapsed} min
        </div>
      </div>

      {/* ZONE ADRESSE (CORRIGÉE ET DÉDUPLIQUÉE) */}
      {isDelivery && (order.deliveryAddress || order.deliveryLat) && (
        <div className="px-5 py-3 bg-purple-950/40 border-b border-purple-500/20 flex flex-col gap-2">
          {order.deliveryAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-sm text-purple-200 font-medium leading-snug">
                {order.deliveryAddress}
              </p>
            </div>
          )}
          
          {/* BOUTON GOOGLE MAPS AVEC URL VALIDE */}
          {order.deliveryLat && order.deliveryLng && (
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLat},${order.deliveryLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 mt-2 py-2 px-4 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Ouvrir le GPS (Maps)
            </a>
          )}
        </div>
      )}

      {/* LISTE DES PLATS */}
      <div className="flex-1 p-5">
        <ul className="space-y-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start gap-4">
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg font-black text-lg shrink-0 ${
                isDelivery ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-white'
              }`}>
                {item.quantity}
              </span>
              <span className="text-white font-bold text-lg leading-tight pt-0.5">
                {item.product.name}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* BOUTON DE VALIDATION CUISINE */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <button 
          onClick={handleComplete}
          disabled={isPending}
          className={`w-full py-4 rounded-xl font-black text-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm ${
            isDelivery 
              ? 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20' 
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
          }`}
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {isDelivery ? 'Prêt pour le livreur' : 'Commande Prête'}
            </>
          )}
        </button>
      </div>

    </div>
  );
}
