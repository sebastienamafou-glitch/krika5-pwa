// src/components/CartSheet.tsx
'use client';

import { useState, useTransition, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { useCartStore } from "@/store/useCartStore";
import { Trash2, Loader2, WifiOff, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitOrder } from "@/actions/checkout";

export function CartSheet() {
  const { items, removeItem, getTotal, clearCart, pendingOrders, enqueueOrder, dequeueOrder } = useCartStore();
  const [phone, setPhone] = useState("");
  const [customerId, setCustomerId] = useState(""); // Nouvel état pour le scan
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const syncOrders = async () => {
      if (pendingOrders.length === 0 || !navigator.onLine) return;

      for (const order of pendingOrders) {
        try {
          const result = await submitOrder({
            phone: order.phone,
            items: order.items.map(item => ({ id: item.id, price: item.price, quantity: item.quantity })),
            totalAmount: order.totalAmount,
            // (Note: La fidélité offline nécessite une synchro complexe, on l'omet en mode dégradé)
          });

          if (result.success) {
            dequeueOrder(order.id);
          }
        } catch (error) {
          console.error("Échec synchro", error);
        }
      }
    };

    syncOrders();
    window.addEventListener('online', syncOrders);
    return () => window.removeEventListener('online', syncOrders);
  }, [pendingOrders, dequeueOrder]);

  const handleCheckout = () => {
    // Si on a un CUID scanné, le téléphone devient facultatif (il sera récupéré via le CUID côté serveur)
    if (!customerId && phone.length < 8) return alert("Saisissez un numéro valide ou scannez un client.");
    
    if (!navigator.onLine) {
      enqueueOrder({
        phone: phone || "HORS-LIGNE",
        items: items.map(item => ({ ...item })),
        totalAmount: getTotal(),
      });
      clearCart();
      setIsOpen(false);
      setPhone("");
      setCustomerId("");
      alert("Mode Hors-Ligne 📶 : Commande sauvegardée. La fidélité ne s'applique pas en mode hors-ligne.");
      return;
    }

    startTransition(async () => {
      const result = await submitOrder({
        phone,
        items: items.map(item => ({ id: item.id, price: item.price, quantity: item.quantity })),
        totalAmount: getTotal(),
        customerId: customerId || undefined, // Transmission du scan
      });

      if (result.success) {
        clearCart();
        setIsOpen(false);
        setPhone("");
        setCustomerId("");
        alert(`Commande #${result.orderId?.split('-')[0]} enregistrée avec succès !`);
      } else {
        alert(result.error || "Une erreur est survenue.");
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
          <SheetFooter className="border-t border-white/5 pt-6">
            <div className="w-full space-y-4">
              <div className="flex justify-between text-lg font-bold text-white">
                <span>Total</span>
                <span className="text-primary">{getTotal()} FCFA</span>
              </div>
              
              {/* Zone de scan Fidélité (Douchette) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> Scan Fidélité (Optionnel)
                </label>
                <input 
                  type="text" 
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Scannez le QR Code client ici..."
                  className="w-full rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-white placeholder-emerald-700/50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  disabled={isPending}
                  autoComplete="off"
                />
              </div>

              {/* Saisie manuelle (désactivée si scan réussi) */}
              {!customerId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Téléphone client (si pas de QR)</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 0102030405"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={isPending}
                  />
                </div>
              )}

              <Button 
                onClick={handleCheckout} 
                disabled={isPending || (!phone && !customerId)}
                className="h-12 w-full rounded-xl bg-primary text-base font-bold text-white transition-all hover:bg-orange-600 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Valider l'encaissement"}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
