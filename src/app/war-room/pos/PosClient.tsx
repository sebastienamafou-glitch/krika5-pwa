// src/app/war-room/pos/PosClient.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Banknote, CheckCircle2, QrCode, Search, X, Loader2,
  Smartphone, Plus, ShoppingBag, Zap, Receipt, UserCircle, Star, Lock, Power, Gift
} from 'lucide-react'; 
import { Html5Qrcode } from 'html5-qrcode';
import { BRAND_NAME } from '@/lib/constants';
import { usePosStore } from '@/store/usePosStore';
import { createPosOrder, openShift, closeShift } from '@/actions/pos'; 
import { processLoyaltyReward } from '@/actions/loyalty'; // Importation de la logique de récompense
import { TicketReceipt, TicketProps } from '@/components/TicketReceipt';
import { CartSheet } from '@/components/CartSheet';
import { ProductDTO, ActiveShiftDTO } from '@/types/dto';
import { Button } from '@/components/ui/button';

/* ─── TYPES ─────────────────────────────────────────────────── */
interface Category {
  id: string;
  name: string;
  products: ProductDTO[];
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; price: number };
}

interface PosOrder {
  id: string;
  userId: string | null; // ID nécessaire pour la fidélité
  totalAmount: number;
  createdAt: Date | string;
  status: string;
  paymentStatus: 'PAID' | 'UNPAID';
  user: { id: string; phone: string; loyaltyPoints: number } | null;
  items: OrderItem[];
}

interface PosPageProps {
  orders?: PosOrder[];
  categories?: Category[];
  operatorId: string;
}

/* ─── COMPOSANTS INTERNES ────────────────────────────────────── */

function OpenShiftOverlay({ operatorId, onOpen }: { operatorId: string, onOpen: (data: ActiveShiftDTO) => void }) {
  const [openingFloat, setOpeningFloat] = useState<string>("0");
  const [isPending, startTransition] = useTransition();

  const handleStart = () => {
    const amount = parseInt(openingFloat);
    if (isNaN(amount) || amount < 0) return alert("Montant invalide.");
    startTransition(async () => {
      const res = await openShift({ operatorId, openingFloat: amount });
      if (res.success && res.data) onOpen(res.data);
      else alert(res.error);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/20 rounded-[2.5rem] p-10 shadow-2xl text-center">
        <div className="inline-flex p-5 bg-amber-500/10 rounded-3xl mb-6"><Lock className="w-10 h-10 text-amber-500" /></div>
        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Ouverture Caisse</h2>
        <div className="space-y-6 mt-8">
          <input type="number" value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} className="w-full h-20 bg-black/40 border border-white/10 rounded-2xl text-center text-3xl font-black text-amber-500 focus:outline-none" />
          <Button onClick={handleStart} disabled={isPending} className="w-full h-16 bg-amber-500 text-black font-black rounded-2xl uppercase tracking-widest transition-all">
            {isPending ? <Loader2 className="animate-spin" /> : "Démarrer la session"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CloseShiftOverlay({ shiftId, onCloseSuccess, onCancel }: { shiftId: string, onCloseSuccess: () => void, onCancel: () => void }) {
  const [actualCash, setActualCash] = useState<string>("0");
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    const amount = parseInt(actualCash);
    if (isNaN(amount) || amount < 0) return alert("Montant invalide.");
    startTransition(async () => {
      const res = await closeShift({ shiftId, actualCash: amount });
      if (res.success) onCloseSuccess();
      else alert(res.error);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-red-500/20 rounded-[2.5rem] p-10 shadow-2xl text-center relative">
        <button onClick={onCancel} className="absolute top-6 right-6 text-slate-500"><X /></button>
        <div className="inline-flex p-5 bg-red-500/10 rounded-3xl mb-6"><Power className="w-10 h-10 text-red-500" /></div>
        <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-tight">Clôture Caisse</h2>
        <input type="number" value={actualCash} onChange={(e) => setActualCash(e.target.value)} className="w-full h-20 bg-black/40 border border-white/10 rounded-2xl text-center text-3xl font-black text-red-500 focus:outline-none" />
        <Button onClick={handleClose} disabled={isPending} className="w-full h-16 bg-red-600 text-white font-black rounded-2xl uppercase tracking-widest mt-6">
          {isPending ? <Loader2 className="animate-spin" /> : "Valider la clôture"}
        </Button>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function PosClient({ orders = [], categories = [], operatorId }: PosPageProps) {
  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'PAYMENTS'>('NEW_ORDER');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [ticketData, setTicketData] = useState<TicketProps | null>(null);
  const [isPending, startTransition] = useTransition();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const { addToCart, setCustomer, activeShift, setActiveShift, clearCart } = usePosStore();

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.user?.phone.includes(searchQuery)
    );
  }, [orders, searchQuery]);

  useEffect(() => {
    if (!isScannerOpen) return;
    const scanner = new Html5Qrcode('reader');
    scannerRef.current = scanner;
    scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, (decoded) => { setCustomer(decoded); setIsScannerOpen(false); }, () => {})
      .catch(() => setIsScannerOpen(false));
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, [isScannerOpen, setCustomer]);

  const handlePayment = (order: PosOrder, method: 'CASH' | 'MOBILE_MONEY') => {
    if (!activeShift) return;
    startTransition(async () => {
      const res = await createPosOrder({
        operatorId: activeShift.operatorId,
        shiftId: activeShift.id,
        totalAmount: order.totalAmount,
        paymentMethod: method,
        orderType: 'TAKEAWAY',
        items: order.items.map(i => ({ productId: i.id, quantity: i.quantity, unitPrice: i.unitPrice }))
      });
      if (res.success && res.data) {
        setTicketData({ orderId: res.data.id, date: new Date(), items: res.data.items.map(i => ({ name: i.productName, price: i.unitPrice, quantity: i.quantity })), total: res.data.totalAmount, paymentMethod: res.data.paymentMethod });
        setTimeout(() => { window.print(); setTicketData(null); }, 150);
      }
    });
  };

  /**
   * REWARD LOGIC : Conversion des points en caisse
   */
  const handleRedeemReward = (order: PosOrder) => {
    if (!activeShift || !order.userId) return;

    if (!confirm("Utiliser 10 points pour offrir cette commande ?")) return;

    startTransition(async () => {
      // 1. Déduction des points en base (Atomique)
      const rewardRes = await processLoyaltyReward(order.userId!);
      
      if (rewardRes.success) {
        // 2. Validation de la commande à 1 FCFA (Montant minimal pour le schéma)
        // Note: Le schéma impose un montant positif.
        const res = await createPosOrder({
          operatorId: activeShift.operatorId,
          shiftId: activeShift.id,
          totalAmount: 1, 
          paymentMethod: 'CASH',
          orderType: 'TAKEAWAY',
          items: order.items.map(i => ({ productId: i.id, quantity: i.quantity, unitPrice: i.unitPrice }))
        });

        if (res.success && res.data) {
          setTicketData({ 
            orderId: res.data.id, 
            date: new Date(), 
            items: res.data.items.map(i => ({ name: i.productName, price: i.unitPrice, quantity: i.quantity })), 
            total: 0, // Affichage 0 sur le ticket
            paymentMethod: 'CASH' 
          });
          setTimeout(() => { window.print(); setTicketData(null); }, 150);
        }
      } else {
        alert(rewardRes.error);
      }
    });
  };

  const visibleCategory = categories.find((c) => c.id === activeCategoryId) ?? categories[0];

  return (
    <>
      {!activeShift && <OpenShiftOverlay operatorId={operatorId} onOpen={setActiveShift} />}
      {isCloseModalOpen && activeShift && <CloseShiftOverlay shiftId={activeShift.id} onCloseSuccess={() => { setActiveShift(null); clearCart(); window.location.reload(); }} onCancel={() => setIsCloseModalOpen(false)} />}

      <main className={`min-h-screen print:hidden flex flex-col bg-slate-950 text-white ${!activeShift ? 'blur-md pointer-events-none' : ''}`}>
        <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/90 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Link href="/war-room" className="text-slate-500 hover:text-white transition-colors"><ArrowLeft /></Link>
            <h1 className="text-3xl font-black tracking-tighter uppercase">CAISSE <span className="text-amber-500" dangerouslySetInnerHTML={{ __html: BRAND_NAME }} /></h1>
          </div>
          <div className="flex bg-white/5 rounded-xl p-1">
            <button onClick={() => setActiveTab('NEW_ORDER')} className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-all ${activeTab === 'NEW_ORDER' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500'}`}><ShoppingBag className="inline mr-2 h-4 w-4" /> Vente</button>
            <button onClick={() => setActiveTab('PAYMENTS')} className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-all ${activeTab === 'PAYMENTS' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500'}`}><Zap className="inline mr-2 h-4 w-4" /> Attente</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsCloseModalOpen(true)} className="px-4 py-2 bg-red-600/10 border border-red-600/20 text-red-500 rounded-xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all"><Power className="inline mr-2 h-4 w-4" /> Fermer Service</button>
            <CartSheet />
          </div>
        </header>

        {activeTab === 'NEW_ORDER' ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-3 flex items-center gap-2 overflow-x-auto border-b border-white/5">
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`px-5 py-2 rounded-xl font-black text-xs uppercase transition-all whitespace-nowrap ${activeCategoryId === cat.id ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-inner' : 'bg-white/5 border border-white/5 text-slate-500'}`}>
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="flex-1 p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {visibleCategory?.products.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} className="group relative rounded-3xl overflow-hidden aspect-[3/4] bg-slate-900 border border-white/5 shadow-2xl transition-all active:scale-95">
                  {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill className="object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-4 flex flex-col justify-end">
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">{p.price}F</p>
                    <p className="text-xs font-black uppercase leading-tight mb-2">{p.name}</p>
                    <div className="flex items-center gap-1.5 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <Plus className="h-3 w-3 text-amber-500 ml-auto" />
                      <span className="text-[9px] font-black text-amber-500 mr-auto">AJOUTER</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div className="flex gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher par téléphone ou ID..." className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 focus:border-amber-500 outline-none transition-all" />
              </div>
              <button onClick={() => setIsScannerOpen(true)} className="h-14 w-14 bg-amber-500 text-black rounded-2xl flex items-center justify-center hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"><QrCode /></button>
            </div>

            {filteredOrders.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-500 opacity-20">
                  <Receipt className="h-20 w-20 mb-4" />
                  <p className="font-black uppercase tracking-widest text-[10px]">Aucune commande en attente</p>
               </div>
            ) : filteredOrders.map((o) => (
              <div key={o.id} className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex items-center justify-between hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    <UserCircle className="h-8 w-8 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-white flex items-center gap-2">
                       {o.user?.phone || "Au Comptoir"}
                       {o.user?.loyaltyPoints && o.user.loyaltyPoints >= 10 && <Star className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />}
                    </h3>
                    <p className="text-[10px] uppercase text-slate-500 font-bold">ID: #{o.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-xl font-black text-amber-500">{o.totalAmount}F</p>
                  <div className="flex gap-2">
                    {/* BOUTON CADEAU : Uniquement si points >= 10 */}
                    {o.user?.loyaltyPoints && o.user.loyaltyPoints >= 10 && (
                      <button 
                        disabled={isPending} 
                        onClick={() => handleRedeemReward(o)} 
                        className="h-12 w-12 bg-amber-500 text-black rounded-xl flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-amber-500/20"
                        title="Offrir une récompense"
                      >
                         {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Gift className="h-5 w-5" />}
                      </button>
                    )}
                    <button disabled={isPending} onClick={() => handlePayment(o, 'CASH')} className="h-12 w-24 bg-emerald-500 text-black font-black text-[10px] rounded-xl uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2">
                       {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Banknote className="h-4 w-4" /> Cash</>}
                    </button>
                    <button disabled={isPending} onClick={() => handlePayment(o, 'MOBILE_MONEY')} className="h-12 w-24 bg-blue-500 text-white font-black text-[10px] rounded-xl uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2">
                       {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Smartphone className="h-4 w-4" /> Mobile</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isScannerOpen && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="w-full max-w-md bg-slate-900 rounded-[3rem] p-8 relative border border-amber-500/20 shadow-2xl">
            <button onClick={() => setIsScannerOpen(false)} className="absolute top-8 right-8 p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X /></button>
            <div className="text-center mb-8">
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Scanner Client</h3>
               <div className="flex items-center justify-center gap-2 text-[10px] font-black text-emerald-500 mt-2">
                  <CheckCircle2 className="h-4 w-4" /> FOCUS AUTOMATIQUE ACTIF
               </div>
            </div>
            <div id="reader" className="rounded-3xl overflow-hidden border-4 border-amber-500/20 aspect-square shadow-inner bg-black" />
          </div>
        </div>
      )}
      {ticketData && <TicketReceipt {...ticketData} />}
    </>
  );
}
