// src/app/livraison/page.tsx
import { prisma } from '@/lib/prisma';
import { DeliveryTicket, type DeliveryOrder } from './DeliveryTicket';
import { Bike, ArrowLeft, AlertCircle, Package } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DeliveryDashboardPage() {
  const rawOrders = await prisma.order.findMany({
    where: { orderType: 'DELIVERY', status: 'COMPLETED' },
    include: {
      user: { select: { phone: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Typage strict — pas de cast silencieux
  const orders: DeliveryOrder[] = rawOrders.map((order) => ({
    id: order.id,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus as 'PAID' | 'UNPAID',
    deliveryAddress: order.deliveryAddress,
    deliveryLat: order.deliveryLat,
    deliveryLng: order.deliveryLng,
    user: order.user ? { phone: order.user.phone } : null,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: { name: item.product.name },
    })),
  }));

  const cashToCollect = orders
    .filter((o) => o.paymentStatus === 'UNPAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;700&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap');

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slideUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .live-dot { animation: blink 2s ease-in-out infinite; }
      `}</style>

      <main
        style={{
          minHeight: '100dvh',
          fontFamily: "'DM Sans', sans-serif",
          background: 'linear-gradient(160deg, #07070f 0%, #0e0b1e 55%, #07070f 100%)',
          color: 'white',
        }}
      >
        {/* ══ STICKY HEADER ══ */}
        <header
          className="sticky top-0 z-30 px-5 py-4"
          style={{
            background: 'rgba(7,7,15,0.95)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/hub"
                className="group p-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <ArrowLeft className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
              </Link>

              <div>
                <h1
                  className="text-4xl leading-none"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', color: '#c084fc' }}
                >
                  LIVRAISON
                </h1>
                <p
                  className="text-[10px] font-bold uppercase mt-0.5"
                  style={{ letterSpacing: '0.25em', color: 'rgba(255,255,255,0.18)' }}
                >
                  Espace livreur · KRIKA&apos;5
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
              style={{
                background: 'rgba(168,85,247,0.07)',
                border: '1px solid rgba(168,85,247,0.18)',
              }}
            >
              <span className="h-2 w-2 rounded-full bg-purple-500 live-dot" />
              <span
                className="text-[10px] font-black uppercase text-purple-400"
                style={{ letterSpacing: '0.25em' }}
              >
                {orders.length} course{orders.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">

          {/* ══ STATS BAR (visible seulement si des courses existent) ══ */}
          {orders.length > 0 && (
            <div className="grid grid-cols-2 gap-3 slide-up" style={{ animationDelay: '0.05s' }}>
              <div
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{
                  background: 'rgba(168,85,247,0.07)',
                  border: '1px solid rgba(168,85,247,0.15)',
                }}
              >
                <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: 'rgba(168,85,247,0.12)' }}>
                  <Bike className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p
                    className="text-2xl font-black leading-none text-white"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em' }}
                  >
                    {orders.length}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-purple-600 mt-0.5" style={{ letterSpacing: '0.2em' }}>
                    En attente
                  </p>
                </div>
              </div>

              <div
                className="rounded-2xl p-4 flex items-center gap-3"
                style={
                  cashToCollect > 0
                    ? { background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }
                    : { background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }
                }
              >
                <div
                  className="p-2.5 rounded-xl flex-shrink-0"
                  style={{ background: cashToCollect > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)' }}
                >
                  <AlertCircle
                    className="h-5 w-5"
                    style={{ color: cashToCollect > 0 ? '#f87171' : '#34d399' }}
                  />
                </div>
                <div>
                  <p
                    className="text-2xl font-black leading-none"
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      letterSpacing: '0.04em',
                      color: cashToCollect > 0 ? '#f87171' : '#34d399',
                    }}
                  >
                    {cashToCollect > 0 ? `${cashToCollect.toLocaleString('fr-FR')} F` : 'Tout OK'}
                  </p>
                  <p
                    className="text-[10px] font-bold uppercase mt-0.5"
                    style={{
                      letterSpacing: '0.2em',
                      color: cashToCollect > 0 ? 'rgba(248,113,113,0.55)' : 'rgba(52,211,153,0.55)',
                    }}
                  >
                    {cashToCollect > 0 ? 'À encaisser' : 'Déjà payé'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══ LISTE DES TICKETS OU EMPTY STATE ══ */}
          {orders.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-24 rounded-3xl text-center slide-up"
              style={{
                background: 'rgba(255,255,255,0.015)',
                border: '1px dashed rgba(255,255,255,0.05)',
              }}
            >
              <div
                className="p-8 rounded-3xl mb-6"
                style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.08)' }}
              >
                <Bike className="h-14 w-14" style={{ color: 'rgba(168,85,247,0.25)' }} />
              </div>
              <h2
                className="text-3xl text-white mb-2"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
              >
                AUCUNE COURSE
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                La cuisine prépare les prochaines commandes.
              </p>
              <div
                className="flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(168,85,247,0.05)',
                  border: '1px solid rgba(168,85,247,0.08)',
                }}
              >
                <Package className="h-3.5 w-3.5" style={{ color: 'rgba(168,85,247,0.4)' }} />
                <span
                  className="text-[10px] font-black uppercase"
                  style={{ letterSpacing: '0.25em', color: 'rgba(168,85,247,0.4)' }}
                >
                  En attente de la cuisine
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, i) => (
                <div
                  key={order.id}
                  className="slide-up"
                  style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  <DeliveryTicket order={order} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
