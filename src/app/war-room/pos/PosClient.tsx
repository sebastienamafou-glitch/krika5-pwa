// src/app/war-room/pos/PosClient.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Banknote, 
  CheckCircle2, 
  QrCode, 
  Search, 
  X,
  Loader2,
  Camera,
  Receipt,
  UserCircle,
  Smartphone
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { BRAND_NAME } from '@/lib/constants';
import { useCartStore } from '@/store/useCartStore';

import { processPayment } from '@/actions/pos';
import { TicketReceipt, TicketProps } from '@/components/TicketReceipt';

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
  user: { id: string; phone: string; } | null;
  items: OrderItem[];
}

interface PosPageProps {
  orders?: PosOrder[];
}

export default function PosClient({ orders = [] }: PosPageProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  const setCustomer = useCartStore((state) => state.setCustomer);

  const [isPending, startTransition] = useTransition();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<TicketProps | null>(null);

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, false);
      scanner.render((decodedText: string) => {
        setSearchQuery(decodedText);
        setCustomer(decodedText); 
        setIsScannerOpen(false);
      }, () => {});
      scannerRef.current = scanner;
    }
    return () => {
      if (scannerRef.current) scannerRef.current.clear().catch(() => {});
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
      const result = await processPayment(order.id, method);
      
      if (result && result.success) {
        setTicketData({
          orderId: order.id,
          date: new Date(),
          items: order.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.unitPrice, 
          })),
          total: order.totalAmount,
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
      <main className="min-h-screen bg-slate-950 p-6 md:p-10 print:hidden">
        <header className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <Link href="/hub" className="inline-flex items-center text-slate-500 hover:text-white mb-4 font-bold transition-colors group text-sm uppercase tracking-widest">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Retour au Hub
            </Link>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <Banknote className="h-10 w-10 text-emerald-500" /> Caisse <span dangerouslySetInnerHTML={{ __html: BRAND_NAME }} />
            </h1>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input 
                type="text" placeholder="Tel, N° Commande ou Scan..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:border-primary outline-none transition-all placeholder:text-slate-600"
              />
            </div>
            <button onClick={() => setIsScannerOpen(true)} className="bg-primary hover:bg-primary/80 text-white p-4 rounded-2xl transition-all shadow-lg flex items-center gap-2">
              <QrCode className="h-6 w-6" /> <span className="hidden md:inline font-black uppercase text-xs">Scanner</span>
            </button>
          </div>
        </header>

        {/* LA MODALE DU SCANNER RESTAURÉE */}
        {isScannerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-primary/30 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative">
              <button 
                onClick={() => setIsScannerOpen(false)} 
                className="absolute right-6 top-6 z-10 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="p-8 text-center">
                <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4">
                  <Camera className="text-primary w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white">Scanner Fidélité</h3>
                <p className="text-slate-400 text-sm mt-1">Placez le QR Code client dans le cadre</p>
              </div>

              <div className="px-8 pb-8">
                <div id="reader" className="overflow-hidden rounded-3xl border-2 border-primary/20 bg-black aspect-square flex items-center justify-center">
                     <div className="text-center text-primary flex flex-col items-center">
                       <Loader2 className="h-8 w-8 animate-spin mb-2" />
                       <span className="text-xs font-bold uppercase tracking-widest">Caméra...</span>
                     </div>
                </div>
                <button 
                  onClick={() => setIsScannerOpen(false)}
                  className="w-full mt-6 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all uppercase text-xs tracking-widest"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-slate-900/50 border-2 border-dashed border-white/5 rounded-[2.5rem] p-16 text-center flex flex-col items-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 opacity-20 mb-6" />
              <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tight">Caisse vide</h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 hover:border-primary/50 transition-colors">
                  
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
                        </div>
                      </div>
                    </div>
                    <p className="font-black text-primary text-2xl">{order.totalAmount.toLocaleString()} F</p>
                  </div>
                  
                  {order.paymentStatus !== 'PAID' && (
                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => handlePayment(order, 'ESPECES')}
                        disabled={isPending && processingOrderId === order.id}
                        className="flex-1 flex justify-center items-center py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all uppercase text-xs"
                      >
                        {isPending && processingOrderId === order.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Banknote className="mr-2 h-5 w-5" /> Espèces</>}
                      </button>
                      <button 
                        onClick={() => handlePayment(order, 'MOBILE_MONEY')}
                        disabled={isPending && processingOrderId === order.id}
                        className="flex-1 flex justify-center items-center py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl transition-all uppercase text-xs"
                      >
                        {isPending && processingOrderId === order.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Smartphone className="mr-2 h-5 w-5" /> Mobile</>}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {ticketData && <TicketReceipt {...ticketData} />}
    </>
  );
}
