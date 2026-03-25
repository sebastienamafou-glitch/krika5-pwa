// src/app/kds/page.tsx
import { prisma } from '@/lib/prisma';
import { OrderTicket, type KdsOrder } from '@/components/OrderTicket';
import { PusherListener } from '@/components/PusherListener';
import Link from 'next/link';
import { ArrowLeft, ChefHat, Flame } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function KDSPage() {
  // Query optimisée : on sélectionne uniquement les champs nécessaires
  const rawOrders = await prisma.order.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      createdAt: true,
      orderType: true,
      deliveryAddress: true,
      deliveryLat: true,
      deliveryLng: true,
      user: { select: { phone: true } },
      items: {
        select: {
          id: true,
          quantity: true,
          product: { select: { name: true } },
        },
      },
    },
  });

  // Typage strict via le type exporté du composant
  const orders: KdsOrder[] = rawOrders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    orderType: o.orderType as 'TAKEAWAY' | 'DELIVERY',
    deliveryAddress: o.deliveryAddress,
    deliveryLat: o.deliveryLat,
    deliveryLng: o.deliveryLng,
    user: o.user ? { phone: o.user.phone } : null,
    items: o.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: { name: item.product.name },
    })),
  }));

  const deliveryCount  = orders.filter((o) => o.orderType === 'DELIVERY').length;
  const takeawayCount  = orders.filter((o) => o.orderType === 'TAKEAWAY').length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;700&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap');

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }

        @keyframes urgentPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        .urgent-pulse { animation: urgentPulse 1.8s ease-in-out infinite; }

        @keyframes tickerBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .late-blink { animation: tickerBlink 1s step-end infinite; }

        /* Scrollbar discrète */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
      `}</style>

      <main
        style={{
          minHeight: '100dvh',
          fontFamily: "'DM Sans', sans-serif",
          background: '#06060e',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PusherListener />

        {/* ══ STICKY HEADER ══ */}
        <header
          className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between"
          style={{
            background: 'rgba(6,6,14,0.96)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Left */}
          <div className="flex items-center gap-5">
            <Link
              href="/hub"
              className="group flex items-center gap-2 transition-colors"
              style={{ color: '#475569' }}
            >
              <ArrowLeft className="h-4 w-4 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] hidden sm:inline group-hover:text-white transition-colors">
                Hub
              </span>
            </Link>

            <div className="w-px h-7" style={{ background: 'rgba(255,255,255,0.07)' }} />

            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl"
                style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}
              >
                <ChefHat className="h-5 w-5" style={{ color: '#f5a623' }} />
              </div>
              <div>
                <h1
                  className="text-4xl leading-none text-white"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                >
                  KDS <span style={{ color: '#f5a623' }} dangerouslySetInnerHTML={{ __html: BRAND_NAME }} />
                </h1>
                <p
                  className="text-[10px] font-bold uppercase mt-0.5"
                  style={{ letterSpacing: '0.25em', color: 'rgba(255,255,255,0.2)' }}
                >
                  Écran cuisine
                </p>
              </div>
            </div>
          </div>

          {/* Right: stats pills */}
          <div className="flex items-center gap-2.5">
            {takeawayCount > 0 && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  background: 'rgba(245,166,35,0.08)',
                  border: '1px solid rgba(245,166,35,0.2)',
                }}
              >
                <span
                  className="text-xl font-black leading-none"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em', color: '#f5a623' }}
                >
                  {takeawayCount}
                </span>
                <span className="text-[10px] font-black uppercase text-amber-600" style={{ letterSpacing: '0.2em' }}>
                  Emporter
                </span>
              </div>
            )}

            {deliveryCount > 0 && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  background: 'rgba(168,85,247,0.08)',
                  border: '1px solid rgba(168,85,247,0.2)',
                }}
              >
                <span
                  className="text-xl font-black leading-none"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em', color: '#c084fc' }}
                >
                  {deliveryCount}
                </span>
                <span className="text-[10px] font-black uppercase text-purple-600" style={{ letterSpacing: '0.2em' }}>
                  Livraison
                </span>
              </div>
            )}

            {orders.length === 0 && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  background: 'rgba(16,185,129,0.07)',
                  border: '1px solid rgba(16,185,129,0.15)',
                }}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase text-emerald-600" style={{ letterSpacing: '0.2em' }}>
                  Cuisine libre
                </span>
              </div>
            )}
          </div>
        </header>

        {/* ══ GRILLE DES TICKETS ══ */}
        <div className="flex-1 p-6">
          {orders.length === 0 ? (
            <div
              className="h-full min-h-[60vh] flex flex-col items-center justify-center rounded-3xl text-center slide-up"
              style={{
                background: 'rgba(255,255,255,0.015)',
                border: '1px dashed rgba(255,255,255,0.05)',
              }}
            >
              <div
                className="p-8 rounded-3xl mb-6"
                style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.08)' }}
              >
                <Flame className="h-16 w-16" style={{ color: 'rgba(245,166,35,0.2)' }} />
              </div>
              <h2
                className="text-4xl text-white mb-3"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
              >
                CUISINE LIBRE
              </h2>
              <p className="text-slate-600 font-medium text-sm">
                Aucune commande en attente — tout est sous contrôle.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {orders.map((order, i) => (
                <div
                  key={order.id}
                  className="slide-up"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <OrderTicket order={order} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
