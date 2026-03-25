// src/app/livraison/DeliveryTicket.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MapPin, Phone, CheckCircle2, Loader2, Navigation,
  Banknote, QrCode, Camera, X, Star, Package,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { markAsDelivered, linkCustomerToOrder } from '@/actions/delivery';
import { Html5Qrcode } from 'html5-qrcode';

/* ─── TYPES (exportés pour page.tsx) ────────────────────────── */
export interface OrderItem {
  id: string;
  quantity: number;
  product: { name: string };
}

export interface DeliveryOrder {
  id: string;
  totalAmount: number;
  paymentStatus: 'PAID' | 'UNPAID';
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  user: { phone: string } | null;
  items: OrderItem[];
}

/* ─── SOUS-COMPOSANTS ────────────────────────────────────────── */

/** Badge de statut de paiement */
function PaymentBadge({ status }: { status: 'PAID' | 'UNPAID' }) {
  const isPaid = status === 'PAID';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase"
      style={{
        letterSpacing: '0.18em',
        background: isPaid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${isPaid ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.3)'}`,
        color: isPaid ? '#34d399' : '#f87171',
      }}
    >
      {isPaid ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <Banknote className="h-3 w-3" />
      )}
      {isPaid ? 'Déjà payé' : 'À encaisser'}
    </span>
  );
}

/* ─── COMPOSANT PRINCIPAL ────────────────────────────────────── */
export function DeliveryTicket({ order }: { order: DeliveryOrder }) {
  const [isDelivering, setIsDelivering] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkedPhone, setLinkedPhone] = useState<string | null>(
    order.user?.phone ?? null
  );
  const [showItems, setShowItems] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const mapsUrl =
    order.deliveryLat !== null && order.deliveryLng !== null
      ? `https://www.google.com/maps/search/?api=1&query=${order.deliveryLat},${order.deliveryLng}`
      : null;

  /* ── Scanner lifecycle ── */
  useEffect(() => {
    if (!isScannerOpen) return;

    const scannerId = `reader-${order.id}`;
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
        async (decoded: string) => {
          setIsScannerOpen(false);
          await handleScanSuccess(decoded);
        },
        () => { /* ignore frame errors */ }
      )
      .catch(() => {
        alert("Impossible d'accéder à la caméra.");
        setIsScannerOpen(false);
      });

    return () => {
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => { /* ignore cleanup errors */ });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScannerOpen, order.id]);

  /* ── Handlers ── */
  const handleScanSuccess = async (customerId: string) => {
    setIsLinking(true);
    const result = await linkCustomerToOrder(order.id, customerId);
    if (result.success && result.phone) {
      setLinkedPhone(result.phone);
      if ('vibrate' in navigator) navigator.vibrate(200);
    } else {
      alert(result.error ?? "Erreur lors de l'attribution des points.");
    }
    setIsLinking(false);
  };

  const handleDeliveryComplete = async () => {
    setIsDelivering(true);
    const result = await markAsDelivered(order.id);
    if (!result.success) {
      alert(result.error);
      setIsDelivering(false);
    }
    // Si succès, la page sera revalidée et la carte disparaîtra
  };

  return (
    <>
      <article
        className="relative overflow-hidden rounded-3xl flex flex-col"
        style={{
          background: 'rgba(10,10,20,0.92)',
          border: order.paymentStatus === 'UNPAID'
            ? '1px solid rgba(239,68,68,0.2)'
            : '1px solid rgba(168,85,247,0.2)',
          boxShadow: order.paymentStatus === 'UNPAID'
            ? '0 16px 48px rgba(239,68,68,0.07)'
            : '0 16px 48px rgba(168,85,247,0.07)',
        }}
      >
        {/* ── Ligne d'accent top ── */}
        <div
          className="h-0.5 w-full"
          style={{
            background: order.paymentStatus === 'UNPAID'
              ? 'linear-gradient(90deg, #ef4444, transparent)'
              : 'linear-gradient(90deg, #a855f7, transparent)',
          }}
        />

        {/* ── Overlay liaison en cours ── */}
        {isLinking && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-3xl"
            style={{ background: 'rgba(7,7,15,0.92)', backdropFilter: 'blur(8px)' }}
          >
            <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
            <p
              className="text-xs font-black uppercase text-purple-400"
              style={{ letterSpacing: '0.3em' }}
            >
              Liaison fidélité…
            </p>
          </div>
        )}

        {/* ══ SECTION 1 : IDENTITÉ + MONTANT ══ */}
        <div
          className="px-6 pt-5 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-start justify-between gap-4">
            {/* ID + téléphone */}
            <div>
              <p
                className="text-2xl text-white leading-none"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
              >
                #{order.id.slice(-6).toUpperCase()}
              </p>
              {linkedPhone ? (
                <a
                  href={`tel:${linkedPhone}`}
                  className="inline-flex items-center gap-2 mt-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {linkedPhone}
                </a>
              ) : (
                <p
                  className="text-xs text-slate-600 italic mt-2"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Client anonyme
                </p>
              )}
            </div>

            {/* Montant + badge paiement */}
            <div className="text-right flex-shrink-0">
              <p
                className="text-3xl font-black leading-none"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '0.05em',
                  color: order.paymentStatus === 'UNPAID' ? '#f87171' : '#c084fc',
                }}
              >
                {order.totalAmount.toLocaleString('fr-FR')}
                <span className="text-lg ml-0.5 opacity-60">F</span>
              </p>
              <div className="mt-2">
                <PaymentBadge status={order.paymentStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* ══ SECTION 2 : GPS / ADRESSE ══ */}
        {(order.deliveryAddress || mapsUrl) && (
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            {order.deliveryAddress && (
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {order.deliveryAddress}
                </p>
              </div>
            )}

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-sm uppercase transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                  letterSpacing: '0.12em',
                  color: 'white',
                }}
              >
                <Navigation className="h-5 w-5" />
                Démarrer la navigation
              </a>
            )}
          </div>
        )}

        {/* ══ SECTION 3 : ARTICLES (accordéon) ══ */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => setShowItems((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-2.5">
              <Package className="h-3.5 w-3.5 text-slate-600" />
              <span
                className="text-[11px] font-black uppercase text-slate-500"
                style={{ letterSpacing: '0.2em' }}
              >
                {order.items.length} article{order.items.length !== 1 ? 's' : ''}
              </span>
            </div>
            {showItems
              ? <ChevronUp className="h-4 w-4 text-slate-700" />
              : <ChevronDown className="h-4 w-4 text-slate-700" />
            }
          </button>

          {showItems && (
            <div
              className="px-6 pb-4 space-y-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}
            >
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-sm text-slate-400 font-medium">
                    {item.product.name}
                  </span>
                  <span
                    className="text-xs font-black text-slate-600 px-2 py-0.5 rounded-lg"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  >
                    ×{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ SECTION 4 : FIDÉLITÉ ══ */}
        <div
          className="px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          {linkedPhone ? (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{
                background: 'rgba(16,185,129,0.07)',
                border: '1px solid rgba(16,185,129,0.18)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span
                  className="text-xs font-black uppercase text-emerald-400"
                  style={{ letterSpacing: '0.15em' }}
                >
                  Client identifié
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest">
                Points activés
              </span>
            </div>
          ) : (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-black text-xs uppercase transition-all active:scale-[0.98] hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
                letterSpacing: '0.18em',
              }}
            >
              <QrCode className="h-4 w-4 text-emerald-600" />
              Scanner la carte fidélité
              <Star className="h-3.5 w-3.5 text-emerald-700" />
            </button>
          )}
        </div>

        {/* ══ SECTION 5 : BOUTON DE CONFIRMATION ══ */}
        <div className="px-6 py-5">
          <button
            onClick={handleDeliveryComplete}
            disabled={isDelivering || isLinking}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-base uppercase transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              background: isDelivering
                ? 'rgba(16,185,129,0.15)'
                : 'linear-gradient(135deg, #059669, #047857)',
              boxShadow: isDelivering ? 'none' : '0 8px 32px rgba(5,150,105,0.3)',
              color: 'white',
              letterSpacing: '0.12em',
            }}
          >
            {isDelivering ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Validation…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Confirmer la livraison
                {order.paymentStatus === 'UNPAID' && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-lg ml-1"
                    style={{ background: 'rgba(0,0,0,0.2)', letterSpacing: '0.1em' }}
                  >
                    + encaissement
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </article>

      {/* ══ MODALE SCANNER QR ══ */}
      {isScannerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(7,7,15,0.97)', backdropFilter: 'blur(24px)' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(10,10,20,0.99)',
              border: '1px solid rgba(168,85,247,0.2)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.9)',
            }}
          >
            {/* Modal header */}
            <div className="relative p-7 text-center">
              <button
                onClick={() => setIsScannerOpen(false)}
                className="absolute right-5 top-5 p-2 rounded-xl transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#64748b',
                }}
              >
                <X className="h-4 w-4" />
              </button>

              <div
                className="inline-flex p-4 rounded-2xl mb-4"
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  border: '1px solid rgba(168,85,247,0.2)',
                }}
              >
                <Camera className="h-7 w-7 text-purple-400" />
              </div>

              <h3
                className="text-3xl text-white"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
              >
                SCANNER FIDÉLITÉ
              </h3>
              <p className="text-slate-500 text-sm mt-1.5">
                Commande #{order.id.slice(-6).toUpperCase()}
              </p>
            </div>

            {/* QR viewport */}
            <div className="px-7 pb-7 space-y-3">
              <div
                id={`reader-${order.id}`}
                className="w-full aspect-square overflow-hidden rounded-2xl bg-black"
                style={{ border: '2px solid rgba(168,85,247,0.2)' }}
              />
              <button
                onClick={() => setIsScannerOpen(false)}
                className="w-full py-4 rounded-xl font-black text-xs uppercase transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#64748b',
                  letterSpacing: '0.2em',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
