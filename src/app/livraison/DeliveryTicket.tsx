// src/app/livraison/DeliveryTicket.tsx
'use client';

import { useState } from 'react';
import { MapPin, Phone, CheckCircle2, Loader2, Navigation, Banknote } from 'lucide-react';
import { markAsDelivered } from '@/actions/delivery';

interface OrderItem {
  id: string;
  quantity: number;
  product: { name: string; };
}

interface DeliveryOrder {
  id: string;
  totalAmount: number;
  paymentStatus: 'PAID' | 'UNPAID';
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  user: { phone: string; } | null;
  items: OrderItem[];
}

export function DeliveryTicket({ order }: { order: DeliveryOrder }) {
  const [isPending, setIsPending] = useState(false);

  const handleDeliveryComplete = async () => {
    setIsPending(true);
    const result = await markAsDelivered(order.id);
    if (!result.success) {
      alert(result.error);
      setIsPending(false);
    }
  };

  // URL Universelle Google Maps (Itinéraire direct depuis la position du livreur)
  const mapsUrl = order.deliveryLat && order.deliveryLng 
    ? `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLat},${order.deliveryLng}` 
    : undefined;

  return (
    <div className="bg-slate-900 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      
      {/* EN-TÊTE : PRIX ET STATUT DE PAIEMENT */}
      <div className="p-5 border-b border-white/5 bg-slate-800/50 flex justify-between items-center">
        <div>
          <span className="text-xl font-black text-white tracking-tight">#{order.id.slice(-5).toUpperCase()}</span>
          <div className="flex items-center gap-2 mt-1">
            <Phone className="w-4 h-4 text-slate-400" />
            <a href={`tel:${order.user?.phone}`} className="text-sm font-bold text-blue-400 hover:underline">
              {order.user?.phone || 'Anonyme'}
            </a>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">{order.totalAmount} F</div>
          {order.paymentStatus === 'UNPAID' ? (
            <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mt-1 border border-red-500/20">
              <Banknote className="w-3 h-3" /> À Encaisser
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mt-1 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Déjà Payé
            </span>
          )}
        </div>
      </div>

      {/* ZONE GPS / ADRESSE */}
      <div className="p-5 bg-purple-950/20 border-b border-purple-500/10 flex flex-col gap-3">
        {order.deliveryAddress && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <p className="text-sm text-purple-200 font-medium leading-relaxed">{order.deliveryAddress}</p>
          </div>
        )}
        
        {mapsUrl && (
          <a 
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 mt-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/50"
          >
            <Navigation className="w-5 h-5" />
            Démarrer le GPS
          </a>
        )}
      </div>

      {/* BOUTON DE VALIDATION */}
      <div className="p-4 bg-black/20 mt-auto">
        <button 
          onClick={handleDeliveryComplete}
          disabled={isPending}
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> Confirmer la livraison</>}
        </button>
      </div>

    </div>
  );
}
