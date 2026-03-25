// src/components/OrderTicket.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Clock, MapPin, Truck, ShoppingBag,
  CheckCircle2, Loader2, Navigation,
} from 'lucide-react';
import { markOrderAsReady } from '@/actions/kds';

/* ─── TYPES (exportés pour page.tsx) ────────────────────────── */
export interface OrderItem {
  id: string;
  quantity: number;
  product: { name: string };
}

export interface KdsOrder {
  id: string;
  createdAt: Date;
  orderType: 'TAKEAWAY' | 'DELIVERY';
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  user: { phone: string } | null;
  items: OrderItem[];
}

/* ─── CHRONO HOOK ────────────────────────────────────────────── */
function useElapsedMinutes(createdAt: Date): number {
  const calc = () =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);

  const [elapsed, setElapsed] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setElapsed(calc), 60_000);
    return () => clearInterval(id);
  }, [createdAt]); // eslint-disable-line react-hooks/exhaustive-deps

  return elapsed;
}

/* ─── COMPOSANT TICKET ───────────────────────────────────────── */
export function OrderTicket({ order }: { order: KdsOrder }) {
  const [isPending, setIsPending] = useState(false);
  const elapsed   = useElapsedMinutes(order.createdAt);
  const isDelivery = order.orderType === 'DELIVERY';

  // Niveaux d'urgence basés sur le temps écoulé
  const urgency: 'ok' | 'warn' | 'late' =
    elapsed >= 20 ? 'late' : elapsed >= 12 ? 'warn' : 'ok';

  const mapsUrl =
    order.deliveryLat !== null && order.deliveryLng !== null
      ? `https://www.google.com/maps/search/?api=1&query=${order.deliveryLat},${order.deliveryLng}`
      : null;

  const handleComplete = async () => {
    setIsPending(true);
    const result = await markOrderAsReady(order.id);
    if (!result.success) {
      alert(result.error);
      setIsPending(false);
    }
    // Si succès, PusherListener ou revalidation supprime la carte
  };

  /* ── Couleurs selon type + urgence ── */
  const accent =
    urgency === 'late'
      ? '#ef4444'
      : isDelivery
      ? '#a855f7'
      : '#f5a623';

  const accentBg =
    urgency === 'late'
      ? 'rgba(239,68,68,0.08)'
      : isDelivery
      ? 'rgba(168,85,247,0.07)'
      : 'rgba(245,166,35,0.07)';

  const accentBorder =
    urgency === 'late'
      ? 'rgba(239,68,68,0.25)'
      : isDelivery
      ? 'rgba(168,85,247,0.2)'
      : 'rgba(245,166,35,0.2)';

  const chronoColor =
    urgency === 'late'
      ? '#ef4444'
      : urgency === 'warn'
      ? '#f59e0b'
      : 'rgba(255,255,255,0.35)';

  const btnGradient = isDelivery
    ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
    : 'linear-gradient(135deg, #059669, #047857)';

  const btnShadow = isDelivery
    ? '0 8px 24px rgba(124,58,237,0.3)'
    : '0 8px 24px rgba(5,150,105,0.3)';

  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-3xl"
      style={{
        background: 'rgba(10,10,20,0.95)',
        border: `1px solid ${accentBorder}`,
        boxShadow:
          urgency === 'late'
            ? '0 0 0 2px rgba(239,68,68,0.15), 0 16px 40px rgba(0,0,0,0.5)'
            : '0 16px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── Ligne d'accent haut ── */}
      <div
        className="h-[3px] w-full"
        style={{
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          opacity: urgency === 'late' ? 1 : 0.8,
        }}
      />

      {/* ══ HEADER : ID + TYPE + CHRONO ══ */}
      <div
        className="px-5 pt-4 pb-4 flex items-start justify-between gap-3"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
      >
        {/* ID + type + client */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className="text-3xl leading-none text-white"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
            >
              #{order.id.slice(-6).toUpperCase()}
            </span>

            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase"
              style={{
                background: accentBg,
                border: `1px solid ${accentBorder}`,
                color: accent,
                letterSpacing: '0.18em',
              }}
            >
              {isDelivery
                ? <Truck className="h-3 w-3" />
                : <ShoppingBag className="h-3 w-3" />
              }
              {isDelivery ? 'Livraison' : 'Emporter'}
            </span>
          </div>

          <p
            className="text-xs font-medium"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            {order.user?.phone ?? 'Anonyme'}
          </p>
        </div>

        {/* Chronomètre */}
        <div
          className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl ${
            urgency === 'late' ? 'late-blink urgent-pulse' : ''
          }`}
          style={{
            background: urgency === 'late'
              ? 'rgba(239,68,68,0.12)'
              : urgency === 'warn'
              ? 'rgba(245,158,11,0.1)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${
              urgency === 'late'
                ? 'rgba(239,68,68,0.3)'
                : urgency === 'warn'
                ? 'rgba(245,158,11,0.2)'
                : 'rgba(255,255,255,0.07)'
            }`,
          }}
        >
          <Clock className="h-3.5 w-3.5" style={{ color: chronoColor }} />
          <span
            className="font-black text-sm leading-none"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              color: chronoColor,
            }}
          >
            {elapsed} min
          </span>
        </div>
      </div>

      {/* ══ ZONE GPS (si livraison) ══ */}
      {isDelivery && (order.deliveryAddress || mapsUrl) && (
        <div
          className="px-5 py-3.5 flex flex-col gap-3"
          style={{
            background: 'rgba(168,85,247,0.04)',
            borderBottom: '1px solid rgba(168,85,247,0.1)',
          }}
        >
          {order.deliveryAddress && (
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <p
                className="text-sm font-medium leading-snug"
                style={{ color: 'rgba(196,157,255,0.8)' }}
              >
                {order.deliveryAddress}
              </p>
            </div>
          )}

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[11px] font-black uppercase transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#c084fc',
                letterSpacing: '0.18em',
              }}
            >
              <Navigation className="h-3.5 w-3.5" />
              Ouvrir le GPS
            </a>
          )}
        </div>
      )}

      {/* ══ LISTE DES PLATS — LE CŒUR DU KDS ══ */}
      <div className="flex-1 px-5 py-4">
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4">
              {/* Quantité — énorme pour lecture rapide à distance */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-xl"
                style={{
                  width: 48,
                  height: 48,
                  background: accentBg,
                  border: `1px solid ${accentBorder}`,
                }}
              >
                <span
                  className="leading-none"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1.8rem',
                    letterSpacing: '0.04em',
                    color: accent,
                  }}
                >
                  {item.quantity}
                </span>
              </div>

              {/* Nom du plat */}
              <span
                className="text-lg font-black text-white leading-tight"
                style={{ letterSpacing: '-0.01em' }}
              >
                {item.product.name}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ══ BOUTON VALIDATION ══ */}
      <div
        className="px-5 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <button
          onClick={handleComplete}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-base uppercase transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            background: isPending ? 'rgba(255,255,255,0.05)' : btnGradient,
            boxShadow: isPending ? 'none' : btnShadow,
            color: 'white',
            letterSpacing: '0.12em',
          }}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>En cours…</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              {isDelivery ? 'Prêt · Livreur' : 'Commande Prête'}
            </>
          )}
        </button>
      </div>
    </article>
  );
}
