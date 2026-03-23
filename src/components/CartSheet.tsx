// src/components/CartSheet.tsx
'use client';

import { useState, useTransition, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { useCartStore } from "@/store/useCartStore";
import { Trash2, Loader2, WifiOff, QrCode, MapPin, ShoppingBag, CheckCircle2, Navigation } from "lucide-react";
import { usePathname, useRouter } from "next/navigation"; // Ajout de useRouter
import { Button } from "@/components/ui/button";
import { submitOrder } from "@/actions/checkout";

const DELIVERY_FEE = 1000;

export function CartSheet() {
  const pathname = usePathname(); 
  const router = useRouter(); // Initialisation du router
  
  const { 
    items, 
    removeItem, 
    getTotal, 
    clearCart, 
    pendingOrders, 
    enqueueOrder, 
    dequeueOrder,
    customerId,
    setCustomer
  } = useCartStore();

  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState<'TAKEAWAY' | 'DELIVERY'>('TAKEAWAY');
  const [address, setAddress] = useState("");
  
  // États de géolocalisation
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  
  const isPosInterface = pathname.startsWith('/war-room/pos'); 
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const finalTotal = orderType === 'DELIVERY' ? getTotal() + DELIVERY_FEE : getTotal();

  useEffect(() => {
    const syncOrders = async () => {
      if (pendingOrders.length === 0 || !navigator.onLine) return;

      for (const order of pendingOrders) {
        try {
          const result = await submitOrder({
            phone: order.phone,
            items: order.items.map(item => ({ id: item.id, price: item.price, quantity: item.quantity })),
            totalAmount: order.totalAmount, 
            customerId: order.customerId,
            orderType: order.orderType || 'TAKEAWAY',
            deliveryAddress: order.deliveryAddress,
            deliveryLat: order.deliveryLat,
            deliveryLng: order.deliveryLng,
          });

          if (result.success) {
            dequeueOrder(order.id);
          }
        } catch {
          console.error("Échec synchro");
        }
      }
    };

    syncOrders();
    window.addEventListener('online', syncOrders);
    return () => window.removeEventListener('online', syncOrders);
  }, [pendingOrders, dequeueOrder]);

  const handleGeolocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
          if (!address) setAddress("Position GPS capturée via le navigateur");
        },
        () => {
          setIsLocating(false);
          alert("Impossible d'obtenir votre position. Veuillez vérifier vos permissions GPS.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsLocating(false);
      alert("La géolocalisation n'est pas supportée par votre appareil.");
    }
  };

  const handleCheckout = () => {
    if (!isPosInterface && phone.length < 8) return alert("Veuillez saisir votre numéro pour la commande.");
    if (isPosInterface && !customerId && phone.length < 8) return alert("Saisissez un numéro valide ou scannez un client.");
    if (orderType === 'DELIVERY' && address.trim().length < 5) return alert("Veuillez saisir une adresse de livraison précise.");
    
    if (!navigator.onLine) {
      enqueueOrder({
        phone: phone || "HORS-LIGNE",
        items: items.map(item => ({ ...item })),
        totalAmount: finalTotal, 
        customerId: customerId || undefined,
        orderType,
        deliveryAddress: orderType === 'DELIVERY' ? address : undefined,
        deliveryLat: orderType === 'DELIVERY' ? location?.lat : undefined,
        deliveryLng: orderType === 'DELIVERY' ? location?.lng : undefined,
      });
      clearCart(); 
      setPhone("");
      setAddress("");
      setLocation(null);
      setSuccessOrder("HORS-LIGNE");
      return;
    }

    startTransition(async () => {
      const result = await submitOrder({
        phone,
        items: items.map(item => ({ id: item.id, price: item.price, quantity: item.quantity })),
        totalAmount: finalTotal, 
        customerId: customerId || undefined, 
        orderType,
        deliveryAddress: orderType === 'DELIVERY' ? address : undefined,
        deliveryLat: orderType === 'DELIVERY' ? location?.lat : undefined,
        deliveryLng: orderType === 'DELIVERY' ? location?.lng : undefined,
      });

      if (result.success && result.orderId) { // Vérification de orderId
        clearCart(); 
        setPhone("");
        setAddress("");
        setLocation(null);
        
        // REDIRECTION MAGIQUE (Uniquement pour le client, pas pour la caisse)
        if (!isPosInterface) {
          setIsOpen(false); // On ferme le panneau
          router.push(`/suivi/${result.orderId}`); // On propulse vers le tracker
        } else {
          // Comportement classique pour la caisse
          setSuccessOrder(result.orderId.split('-')[0].toUpperCase());
        }
      } else {
        alert(result.error || "Une erreur est survenue.");
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => setSuccessOrder(null), 300); 
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white">
          🛒
          {totalItems > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
              {totalItems}
            </span>
          )}
          {pendingOrders.length > 0 && (
            <span className="absolute -bottom-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
              <WifiOff className="h-3 w-3" />
            </span>
          )}
        </button>
      </SheetTrigger>
      
      <SheetContent className="flex w-full flex-col border-l border-white/5 bg-card text-foreground sm:max-w-md">
        
        {successOrder ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">C&apos;est validé !</h3>
            
            {successOrder === "HORS-LIGNE" ? (
              <p className="text-slate-400 font-medium leading-relaxed">
                Mode Hors-Ligne 📶 activé.<br/>Votre commande a été sauvegardée et sera synchronisée au retour du réseau.
              </p>
            ) : (
              <p className="text-slate-400 font-medium leading-relaxed">
                Commande <span className="text-emerald-400 font-black px-1">#{successOrder}</span> enregistrée.<br/>Elle a été transmise en cuisine.
              </p>
            )}

            <Button 
              onClick={() => handleOpenChange(false)} 
              className="w-full mt-8 h-14 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-lg uppercase tracking-widest transition-all"
            >
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <SheetHeader className="border-b border-white/5 pb-4">
              <SheetTitle className="text-xl font-bold text-white flex items-center justify-between">
                Votre Panier
              </SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto py-4 pr-2">
              {items.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                  Votre panier est vide.
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.price} FCFA x {item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-primary">{item.price * item.quantity} F</span>
                        <button onClick={() => removeItem(item.id)} disabled={isPending} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {items.length > 0 && (
              <SheetFooter className="border-t border-white/5 pt-6 flex flex-col gap-4">
                
                <div className="w-full space-y-2 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between text-sm font-medium text-slate-400">
                    <span>Sous-total</span>
                    <span>{getTotal()} FCFA</span>
                  </div>
                  {orderType === 'DELIVERY' && (
                    <div className="flex justify-between text-sm font-medium text-purple-400">
                      <span>Frais de livraison</span>
                      <span>+ {DELIVERY_FEE} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-black text-white pt-2 border-t border-white/10 mt-2">
                    <span>Total</span>
                    <span className="text-primary">{finalTotal} FCFA</span>
                  </div>
                </div>

                <div className="flex bg-slate-900 rounded-xl p-1 border border-white/10">
                  <button
                    onClick={() => setOrderType('TAKEAWAY')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${orderType === 'TAKEAWAY' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                  >
                    <ShoppingBag className="w-4 h-4" /> À Emporter
                  </button>
                  <button
                    onClick={() => setOrderType('DELIVERY')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${orderType === 'DELIVERY' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                  >
                    <MapPin className="w-4 h-4" /> Livraison
                  </button>
                </div>
                
                <div className="w-full space-y-4">
                  {orderType === 'DELIVERY' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-purple-400">Adresse exacte</label>
                      <textarea 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Quartier, rue, repère exact..."
                        className="w-full rounded-xl border border-purple-500/30 bg-purple-950/20 px-4 py-3 text-white placeholder-purple-700/50 focus:border-purple-500 focus:outline-none min-h-[80px]"
                        disabled={isPending}
                      />
                      
                      <button
                        type="button"
                        onClick={handleGeolocation}
                        disabled={isLocating}
                        className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/30 text-purple-300 rounded-xl font-bold transition-all text-xs uppercase tracking-widest"
                      >
                        {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                        {location ? "Position GPS capturée ✓" : "Me géolocaliser (GPS)"}
                      </button>
                    </div>
                  )}

                  {isPosInterface ? (
                    <div className="space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                          <QrCode className="w-4 h-4" /> Scan Fidélité (Optionnel)
                        </label>
                        <input 
                          type="text" 
                          value={customerId || ""}
                          onChange={(e) => setCustomer(e.target.value)}
                          placeholder="Scannez le QR Code..."
                          className="w-full rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-white placeholder-emerald-700/50 focus:border-emerald-500 focus:outline-none"
                          disabled={isPending}
                          autoComplete="off"
                        />
                      </div>
                      {!customerId && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Téléphone client</label>
                          <input 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ex: 0102030405"
                            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white focus:border-primary focus:outline-none"
                            disabled={isPending}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Votre numéro de téléphone</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 0102030405"
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4 text-white font-bold text-center text-lg focus:border-primary focus:outline-none"
                        disabled={isPending}
                      />
                    </div>
                  )}

                  <Button 
                    onClick={handleCheckout} 
                    disabled={isPending || (!phone && !customerId) || (orderType === 'DELIVERY' && address.trim().length < 5)}
                    className={`h-14 w-full rounded-2xl text-lg font-black text-white transition-all shadow-xl disabled:opacity-50 ${
                      orderType === 'DELIVERY' 
                        ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20' 
                        : 'bg-primary hover:bg-orange-600 shadow-primary/10'
                    }`}
                  >
                    {isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      isPosInterface ? "Valider l'encaissement" : "Commander maintenant"
                    )}
                  </Button>
                </div>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
