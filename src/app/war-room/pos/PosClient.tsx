// src/app/war-room/pos/PosClient.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Banknote, CheckCircle2, QrCode, Search, X, Loader2,
  Camera, Receipt, UserCircle, Smartphone, Plus, ShoppingBag, Gift
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { BRAND_NAME } from '@/lib/constants';
import { useCartStore } from '@/store/useCartStore';
// Importe la nouvelle action
import { processPayment, processFreeRewardOrder } from '@/actions/pos'; 
import { TicketReceipt, TicketProps } from '@/components/TicketReceipt';
import { CartSheet } from '@/components/CartSheet';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; price: number; };
}

interface PosOrder {
  id: string;
  totalAmount: number;
  createdAt: Date | string;
  status: string;
  paymentStatus: 'PAID' | 'UNPAID';
  // Ajout de loyaltyPoints dans le type
  user: { id: string; phone: string; loyaltyPoints: number; } | null; 
  items: OrderItem[];
}

interface PosPageProps {
  orders?: PosOrder[];
  categories?: Category[];
}

export default function PosClient({ orders = [], categories = [] }: PosPageProps) {
  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'PAYMENTS'>('NEW_ORDER');
  const addItem = useCartStore((state) => state.addItem);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const setCustomer = useCartStore((state) => state.setCustomer);
  const [isPending, startTransition] = useTransition();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<TicketProps | null>(null);

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText: string) => {
          setSearchQuery(decodedText);
          setCustomer(decodedText); 
          setIsScannerOpen(false);
        },
        () => {}
      ).catch((err: unknown) => {
        console.error("Erreur de permission caméra :", err);
        alert("Impossible d'accéder à la caméra. Vérifiez vos permissions navigateur.");
        setIsScannerOpen(false);
      });
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(() => {});
        } catch {}
      }
    };
  }, [isScannerOpen, setCustomer]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const query = searchQuery.toLowerCase().trim();
    return orders.filter(order => 
      order.id.toLowerCase().includes(query) || 
      (order.user && order.user.phone.includes(query)) ||
      (order.user && order.user.id.toLowerCase() === query)
    );
  }, [orders, searchQuery]);

  const handlePayment = (order: PosOrder, method: string) => {
    setProcessingOrderId(order.id);
    startTransition(async () => {
      // Sélectionne l'action en fonction de la méthode choisie
      const result = method === 'REWARD_FREE_MENU' 
        ? await processFreeRewardOrder(order.id)
        : await processPayment(order.id, method);
      
      if (result && result.success) {
        setTicketData({
          orderId: order.id,
          date: new Date(),
          items: order.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.unitPrice, 
          })),
          total: method === 'REWARD_FREE_MENU' ? 0 : order.totalAmount, // Le ticket affiche 0 si offert
          paymentMethod: method,
        });

        setTimeout(() => {
          window.print();
          setTicketData(null);
          setProcessingOrderId(null);
        }, 150);
      } else {
        alert(result?.error || "Échec de l'encaissement.");
        setProcessingOrderId(null);
      }
    });
  };

  return (
    <>
      <main className="min-h-screen bg-slate-950 p-6 md:p-10 print:hidden flex flex-col">
        {/* ... (Header et barre de recherche identiques) ... */}
        <header className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <div>
            <Link href="/hub" className="inline-flex items-center text-slate-500 hover:text-white mb-4 font-bold transition-colors group text-sm uppercase tracking-widest">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Retour au Hub
            </Link>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <Banknote className="h-10 w-10 text-emerald-500" /> Caisse <span dangerouslySetInnerHTML={{ __html: BRAND_NAME }} />
            </h1>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="flex flex-1 bg-slate-900 rounded-2xl p-1 border border-white/10">
              <button
                onClick={() => setActiveTab('NEW_ORDER')}
                className={`flex-1 lg:px-8 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${activeTab === 'NEW_ORDER' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                <ShoppingBag className="w-4 h-4" /> Commander
              </button>
              <button
                onClick={() => setActiveTab('PAYMENTS')}
                className={`flex-1 lg:px-8 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${activeTab === 'PAYMENTS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                <Receipt className="w-4 h-4" /> Encaisser
              </button>
            </div>
            
            <CartSheet />
          </div>
        </header>

        <div className="border-t border-white/10 mb-6"></div>

        {activeTab === 'NEW_ORDER' && (
           <div className="flex-1 overflow-y-auto pb-24">
           {categories.length === 0 ? (
             <div className="bg-slate-900/50 border-2 border-dashed border-white/5 rounded-[2.5rem] p-16 text-center">
               <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Catalogue vide.</p>
             </div>
           ) : (
             <div className="flex flex-col gap-8">
               {categories.map((category) => {
                 if (category.products.length === 0) return null;
                 return (
                   <div key={category.id}>
                     <h2 className="text-lg font-black text-slate-500 uppercase tracking-widest mb-4">
                       {category.name}
                     </h2>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                       {category.products.map((product) => (
                         <button
                           key={product.id}
                           onClick={() => addItem({ id: product.id, name: product.name, price: product.price })}
                           className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-left hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95 flex flex-col justify-between h-32 shadow-lg group"
                         >
                           <span className="font-bold text-white leading-tight text-sm">
                             {product.name}
                           </span>
                           <div className="flex items-center justify-between w-full mt-2">
                             <span className="text-primary font-black">{product.price} F</span>
                             <div className="bg-slate-800 p-2 rounded-xl text-white group-hover:bg-primary transition-colors">
                               <Plus className="w-4 h-4" />
                             </div>
                           </div>
                         </button>
                       ))}
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
         </div>
        )}

        {activeTab === 'PAYMENTS' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input 
                  type="text" placeholder="Tel, N° Commande ou Scan..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
              <button onClick={() => setIsScannerOpen(true)} className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white p-4 rounded-2xl transition-all shadow-lg flex items-center gap-2">
                <QrCode className="h-6 w-6" /> <span className="hidden md:inline font-black uppercase text-xs tracking-widest">Scanner</span>
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-slate-900/50 border-2 border-dashed border-white/5 rounded-[2.5rem] p-16 text-center flex flex-col items-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 opacity-20 mb-6" />
                <h2 className="text-xl font-black text-slate-400 uppercase tracking-tight">Aucune commande en attente</h2>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredOrders.map(order => {
                  // Vérifie si le client a droit à son menu offert (10 points ou plus)
                  const hasFreeMenuReward = order.user && order.user.loyaltyPoints >= 10;

                  return (
                    <div key={order.id} className={`bg-slate-900 border rounded-3xl p-6 flex flex-col gap-4 transition-colors ${hasFreeMenuReward ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/10 hover:border-emerald-500/50'}`}>
                      
                      <div className="flex justify-between items-start border-b border-white/5 pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                            <Receipt className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-lg tracking-tight">CMD #{order.id.slice(-6).toUpperCase()}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <UserCircle className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-400">{order.user?.phone || 'Client Anonyme'}</span>
                              {order.user && (
                                <span className={`text-xs font-bold ml-2 px-2 py-0.5 rounded-full ${hasFreeMenuReward ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'}`}>
                                  {order.user.loyaltyPoints}/10 pts
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className={`font-black text-2xl ${hasFreeMenuReward ? 'text-primary' : 'text-emerald-400'}`}>
                          {order.totalAmount.toLocaleString()} F
                        </p>
                      </div>
                      
                      {order.paymentStatus !== 'PAID' && (
                        <div className="flex flex-col gap-3 pt-2">
                          
                          {/* LE BOUTON MAGIQUE DE RÉCOMPENSE */}
                          {hasFreeMenuReward && (
                            <button 
                              onClick={() => handlePayment(order, 'REWARD_FREE_MENU')}
                              disabled={isPending && processingOrderId === order.id}
                              className="w-full flex justify-center items-center py-4 bg-primary hover:bg-orange-500 text-white font-black rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-primary/20 animate-pulse"
                            >
                              {isPending && processingOrderId === order.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Gift className="mr-2 h-5 w-5" /> Offrir un Menu (Utiliser 10 pts)</>}
                            </button>
                          )}

                          <div className="flex gap-3">
                            <button 
                              onClick={() => handlePayment(order, 'ESPECES')}
                              disabled={isPending && processingOrderId === order.id}
                              className="flex-1 flex justify-center items-center py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all uppercase tracking-widest text-xs"
                            >
                              {isPending && processingOrderId === order.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Banknote className="mr-2 h-5 w-5" /> Espèces</>}
                            </button>
                            <button 
                              onClick={() => handlePayment(order, 'MOBILE_MONEY')}
                              disabled={isPending && processingOrderId === order.id}
                              className="flex-1 flex justify-center items-center py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl transition-all uppercase tracking-widest text-xs"
                            >
                              {isPending && processingOrderId === order.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Smartphone className="mr-2 h-5 w-5" /> Mobile</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ... (Modale Scanner identique) ... */}
        {isScannerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative">
              <button onClick={() => setIsScannerOpen(false)} className="absolute right-6 top-6 z-10 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
              <div className="p-8 text-center">
                <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl mb-4">
                  <Camera className="text-emerald-500 w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white">Scanner Fidélité</h3>
                <p className="text-slate-400 text-sm mt-1">Placez le QR Code client dans le cadre</p>
              </div>
              <div className="px-8 pb-8">
                <div id="reader" className="overflow-hidden rounded-3xl border-2 border-emerald-500/20 bg-black aspect-square flex items-center justify-center w-full">
                </div>
                <button onClick={() => setIsScannerOpen(false)} className="w-full mt-6 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all uppercase text-xs tracking-widest">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      {ticketData && <TicketReceipt {...ticketData} />}
    </>
  );
}
