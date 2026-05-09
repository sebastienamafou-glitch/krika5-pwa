// /src/components/CartSheet.tsx
'use client';

import { useState, useTransition, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { usePosStore } from "@/store/usePosStore";
import { Trash2, Loader2, WifiOff, MapPin, ShoppingBag, CheckCircle2, Navigation, QrCode, Camera, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitOrder } from "@/actions/checkout";
import { createPosOrder } from "@/actions/pos"; 
import { Html5Qrcode } from 'html5-qrcode';

const DELIVERY_FEE = 1000;

function SuccessView({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </div>
      <h3 className="text-3xl font-black text-white tracking-tight">C&apos;est validé !</h3>
      
      {orderId === "HORS-LIGNE" ? (
        <p className="text-slate-400 font-medium leading-relaxed">
          Mode Hors-Ligne 📶 activé.<br/>Votre commande sera synchronisée au retour du réseau.
        </p>
      ) : (
        <p className="text-slate-400 font-medium leading-relaxed">
          Commande <span className="text-emerald-400 font-black px-1">#{orderId}</span> enregistrée.
        </p>
      )}

      <Button onClick={onClose} className="w-full mt-8 h-14 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-lg uppercase tracking-widest transition-all">
        Fermer
      </Button>
    </div>
  );
}

export function CartSheet() {
  const pathname = usePathname(); 
  const router = useRouter(); 
  
  const { 
    cart, 
    removeFromCart, 
    cartTotal, 
    clearCart, 
    syncQueue, 
    enqueueOrder, 
    dequeueOrder, 
    customerId, 
    setCustomer,
    activeShift 
  } = usePosStore();

  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState<'TAKEAWAY' | 'DELIVERY'>('TAKEAWAY');
  const [address, setAddress] = useState(""); 
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null); 
  const [isLocating, setIsLocating] = useState(false); 
  
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const isPosInterface = pathname.startsWith('/war-room/pos'); 
  const totalItems = cart.reduce((acc, item) => acc + item.cartQuantity, 0);
  const finalTotal = orderType === 'DELIVERY' ? cartTotal + DELIVERY_FEE : cartTotal;

  const handleLocateMe = () => {
    if (!navigator.geolocation) return alert("Géolocalisation non supportée.");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddress(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setIsLocating(false);
      },
      () => {
        alert("Localisation impossible.");
        setIsLocating(false);
      }
    );
  };

  useEffect(() => {
    const syncOfflineOrders = async () => {
      if (!navigator.onLine || syncQueue.length === 0) return;
      const orderToSync = syncQueue[0];
      const res = await createPosOrder(orderToSync);
      if (res.success) {
        dequeueOrder(0); 
      }
    };
    window.addEventListener('online', syncOfflineOrders);
    return () => window.removeEventListener('online', syncOfflineOrders);
  }, [syncQueue, dequeueOrder]);

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5Qrcode("cart-reader");
      scannerRef.current = scanner;
      scanner.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText: string) => {
          setCustomer(decodedText); 
          setIsScannerOpen(false);
        },
        () => {}
      ).catch(() => {
        setIsScannerOpen(false);
      });
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScannerOpen, setCustomer]);

  const handleCheckout = async () => {
    if (!isPosInterface && phone.length < 8) return alert("Numéro requis.");
    if (orderType === 'DELIVERY' && address.trim().length < 5) return alert("Adresse requise.");
    if (isPosInterface && !activeShift) return alert("Caisse fermée.");

    startTransition(async () => {
      if (isPosInterface && activeShift) {
        const posPayload = {
          operatorId: activeShift.operatorId,
          shiftId: activeShift.id,
          totalAmount: finalTotal,
          paymentMethod: "CASH" as const,
          orderType,
          items: cart.map(item => ({ productId: item.id, quantity: item.cartQuantity, unitPrice: item.price }))
        };

        if (!navigator.onLine) {
          enqueueOrder(posPayload);
          clearCart(); setSuccessOrder("HORS-LIGNE"); return;
        }

        const res = await createPosOrder(posPayload);
        if (res.success && res.data) {
          clearCart(); setSuccessOrder(res.data.id.split('-')[0].toUpperCase());
        }
      } else {
        const clientPayload = {
          phone,
          items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.cartQuantity })),
          totalAmount: finalTotal,
          customerId: customerId || undefined,
          orderType,
          deliveryAddress: address,
          deliveryLat: location?.lat,
          deliveryLng: location?.lng,
        };

        const result = await submitOrder(clientPayload);
        if (result.success && result.orderId) {
          clearCart();
          if (!isPosInterface) {
            setIsOpen(false);
            router.push(`/suivi/${result.orderId}`);
          } else {
            setSuccessOrder(result.orderId.split('-')[0].toUpperCase());
          }
        }
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setTimeout(() => setSuccessOrder(null), 300); 
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white">
            🛒
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
                {totalItems}
              </span>
            )}
            {/* RÉSOLUTION LINT : Utilisation de WifiOff pour le badge hors-ligne */}
            {syncQueue.length > 0 && (
              <span className="absolute -bottom-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm animate-pulse">
                <WifiOff className="h-3 w-3" />
              </span>
            )}
          </button>
        </SheetTrigger>
        
        <SheetContent className="flex w-full flex-col border-l border-white/5 bg-card text-foreground sm:max-w-md">
          {successOrder ? (
            <SuccessView orderId={successOrder} onClose={() => handleOpenChange(false)} />
          ) : (
            <>
              <SheetHeader className="border-b border-white/5 pb-4">
                <SheetTitle className="text-xl font-bold text-white">Votre Panier</SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto py-4 pr-2">
                {cart.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Panier vide.</div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{item.name}</span>
                          <span className="text-sm text-muted-foreground">{item.price} FCFA x {item.cartQuantity}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary">{item.price * item.cartQuantity} F</span>
                          <button onClick={() => removeFromCart(item.id)} disabled={isPending} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {cart.length > 0 && (
                <SheetFooter className="border-t border-white/5 pt-6 flex flex-col gap-4">
                  <div className="w-full space-y-2 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-sm text-slate-400"><span>Sous-total</span><span>{cartTotal} FCFA</span></div>
                    <div className="flex justify-between text-xl font-black text-white pt-2 border-t border-white/10 mt-2"><span>Total</span><span className="text-primary">{finalTotal} FCFA</span></div>
                  </div>

                  <div className="flex bg-slate-900 rounded-xl p-1 border border-white/10">
                    <button onClick={() => setOrderType('TAKEAWAY')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${orderType === 'TAKEAWAY' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-white'}`}><ShoppingBag className="w-4 h-4" /> À Emporter</button>
                    <button onClick={() => setOrderType('DELIVERY')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${orderType === 'DELIVERY' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}><MapPin className="w-4 h-4" /> Livraison</button>
                  </div>
                  
                  <div className="w-full space-y-4">
                    {orderType === 'DELIVERY' && (
                      <div className="relative">
                        <input 
                          type="text" 
                          value={address} 
                          onChange={(e) => setAddress(e.target.value)} 
                          placeholder="Adresse de livraison" 
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white text-sm"
                        />
                        <button 
                          onClick={handleLocateMe}
                          disabled={isLocating}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-white/5 rounded-lg transition-colors"
                        >
                          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                        </button>
                      </div>
                    )}

                    {isPosInterface ? (
                      <div className="space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                        {customerId ? (
                          <div className="w-full flex items-center justify-between rounded-xl bg-emerald-950/30 border border-emerald-500/50 px-4 py-3">
                            <span className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5" /> Client Identifié
                            </span>
                            <button onClick={() => setCustomer(null)} className="text-slate-400 hover:text-white text-xs underline">Annuler</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setIsScannerOpen(true)} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 border border-white/10 hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg">
                            <QrCode className="h-5 w-5 text-emerald-500" /> Scanner Fidélité
                          </button>
                        )}
                      </div>
                    ) : (
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Votre numéro" className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4 text-white font-bold text-center text-lg" disabled={isPending} />
                    )}

                    <Button onClick={handleCheckout} disabled={isPending || cart.length === 0} className={`h-14 w-full rounded-2xl text-lg font-black transition-all ${orderType === 'DELIVERY' ? 'bg-purple-600' : 'bg-primary'}`}>
                      {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : "Valider l'encaissement"}
                    </Button>
                  </div>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {isScannerOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            <button onClick={() => setIsScannerOpen(false)} className="absolute right-6 top-6 z-10 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
            <div className="p-8 text-center flex flex-col items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Camera className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-white">Scanner la carte</h3>
            </div>
            <div className="px-8 pb-8">
              <div id="cart-reader" className="overflow-hidden rounded-3xl border-2 border-emerald-500/20 bg-black aspect-square w-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
