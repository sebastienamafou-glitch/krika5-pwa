// src/app/war-room/page.tsx
import { prisma } from '@/lib/prisma';
import {
  Activity, Clock, DollarSign, Package,
  ChefHat, TrendingUp, ShoppingBag,
  Filter, PieChart, X, Zap,
  ArrowUpRight, AlertTriangle, CheckCircle2,
  Truck, ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { startOfDay, endOfDay, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: {
    startDate?: string;
    endDate?: string;
    status?: string;
    payment?: string;
    type?: string;
  };
}

/* ─── HELPERS ──────────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    COMPLETED: { label: 'Terminé',   cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
    PENDING:   { label: 'En attente', cls: 'bg-amber-500/10  text-amber-400  border-amber-500/25'  },
    CANCELLED: { label: 'Annulé',    cls: 'bg-red-500/10    text-red-400    border-red-500/25'    },
  };
  const s = map[status] ?? { label: status, cls: 'bg-slate-800 text-slate-400 border-white/10' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.15em] border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function PaymentPill({ status }: { status: string }) {
  const paid = status === 'PAID';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.15em] border ${
      paid ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
    }`}>
      {paid ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
      {paid ? 'Payé' : 'Impayé'}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const delivery = type === 'DELIVERY';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${
      delivery ? 'text-purple-400' : 'text-amber-400'
    }`}>
      {delivery ? <Truck className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
      {delivery ? 'Livraison' : 'Emporter'}
    </span>
  );
}

/* ─── KPI CARD ─────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, accent, icon: Icon, subAccent, fill,
}: {
  label: string; value: string; sub: string;
  accent: string; icon: React.ElementType;
  subAccent?: string; fill?: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/5 p-6 flex flex-col gap-3 group transition-all duration-300 hover:border-white/10"
      style={{ background: 'rgba(15,15,22,0.9)' }}
    >
      <div className="absolute -right-4 -top-4 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity">
        <Icon className="h-32 w-32" style={{ color: accent }} />
      </div>

      <div className="absolute top-0 left-0 h-0.5 w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

      <div className="flex items-center justify-between z-10 relative">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{label}</p>
        <div className="p-2 rounded-xl" style={{ background: `${accent}15` }}>
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
      </div>

      <div className="z-10 relative">
        <p className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>
          {value}
        </p>
        <p className="text-[10px] mt-2 font-bold uppercase tracking-widest" style={{ color: subAccent ?? '#64748b' }}>
          {sub}
        </p>
      </div>

      {fill !== undefined && (
        <div className="z-10 relative mt-1">
          <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${fill}%`, background: `linear-gradient(90deg, ${accent}, ${accent}80)` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PAGE ──────────────────────────────────────────────────── */
export default async function WarRoomPage({ searchParams }: Props) {
  const start = searchParams.startDate
    ? startOfDay(parseISO(searchParams.startDate))
    : startOfDay(new Date());
  const end = searchParams.endDate
    ? endOfDay(parseISO(searchParams.endDate))
    : endOfDay(new Date());

  const [orders, lowStockProducts] = await prisma.$transaction([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      where: { stock: { lte: 5 }, isAvailable: true },
    }),
  ]);

  /* BI */
  const revenue         = orders.filter(o => o.status === 'COMPLETED' && o.paymentStatus === 'PAID').reduce((s, o) => s + o.totalAmount, 0);
  const pendingOrders   = orders.filter(o => o.status === 'PENDING').length;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
  const deliveryOrders  = orders.filter(o => o.orderType === 'DELIVERY').length;
  const takeawayOrders  = orders.filter(o => o.orderType === 'TAKEAWAY').length;
  const totalOrders     = orders.length;
  const completionRate  = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const deliveryRate    = totalOrders > 0 ? Math.round((deliveryOrders / totalOrders) * 100) : 0;

  /* Filtered table */
  let filteredOrders = orders;
  if (searchParams.status)  filteredOrders = filteredOrders.filter(o => o.status === searchParams.status);
  if (searchParams.payment) filteredOrders = filteredOrders.filter(o => o.paymentStatus === searchParams.payment);
  if (searchParams.type)    filteredOrders = filteredOrders.filter(o => o.orderType === searchParams.type);

  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const hasTableFilters = !!(searchParams.status || searchParams.payment || searchParams.type);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;700&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap');

        .wr-scan::before {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          );
          pointer-events: none;
          z-index: 9999;
        }

        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        .blink { animation: blink 1.2s step-end infinite; }

        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        .pulse-ring { animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite; }
      `}</style>

      <main
        className="wr-scan min-h-screen text-white"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: 'linear-gradient(135deg, #07070f 0%, #0d0d1a 50%, #070710 100%)',
        }}
      >
        <header
          className="sticky top-0 z-50 px-8 py-5 flex items-center justify-between"
          style={{
            background: 'rgba(7,7,15,0.92)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 blink" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Live</span>
            </div>

            <div>
              <h1
                className="text-5xl text-white leading-none"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
              >
                WAR <span style={{ color: '#f5a623' }}>ROOM</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 mt-0.5">
                KRIKA&apos;5 · Centre de commandement
              </p>
            </div>

            <div
              className="hidden lg:block px-4 py-2 rounded-xl border border-white/5"
              style={{ background: 'rgba(255,255,255,0.02)', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{today}</p>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/war-room/pos"
              className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
                boxShadow: '0 4px 20px rgba(5,150,105,0.25)',
                color: 'white',
              }}
            >
              <DollarSign className="h-4 w-4" />
              Caisse
              <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>

            <Link
              href="/kds"
              className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #f5a623, #e8860f)',
                boxShadow: '0 4px 20px rgba(245,166,35,0.2)',
                color: '#0d0d0d',
              }}
            >
              <ChefHat className="h-4 w-4" /> Cuisine
            </Link>

            <Link
              href="/war-room/catalogue"
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border border-white/8 text-slate-300 hover:text-white hover:border-white/15 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <Package className="h-4 w-4" /> Stocks
            </Link>

            <a
              href="/api/export/csv"
              download
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border border-white/8 text-slate-300 hover:text-white hover:border-white/15 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <TrendingUp className="h-4 w-4" style={{ color: '#f5a623' }} /> Export
            </a>
          </nav>
        </header>

        <div className="px-8 py-8 space-y-8">
          <div
            className="rounded-2xl border border-white/5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(8px)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(245,166,35,0.1)' }}>
                <Filter className="h-4 w-4" style={{ color: '#f5a623' }} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Période d&apos;analyse</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {searchParams.startDate
                    ? `${searchParams.startDate} → ${searchParams.endDate ?? searchParams.startDate}`
                    : "Aujourd'hui"}
                </p>
              </div>
            </div>

            <form className="flex flex-wrap items-center gap-3">
              {['startDate', 'endDate'].map((name) => (
                <input
                  key={name}
                  type="date"
                  name={name}
                  defaultValue={
                    (name === 'startDate' ? searchParams.startDate : searchParams.endDate)
                    ?? new Date().toISOString().split('T')[0]
                  }
                  className="rounded-xl px-4 py-2.5 text-sm font-bold outline-none transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'white',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                />
              ))}
              <span className="text-slate-600 font-bold text-xs uppercase tracking-widest">→</span>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #f5a623, #e8860f)',
                  boxShadow: '0 4px 16px rgba(245,166,35,0.2)',
                  color: '#0d0d0d',
                }}
              >
                Analyser
              </button>
              <Link
                href="/war-room"
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors border border-white/5 hover:border-white/10"
              >
                Reset
              </Link>
            </form>
          </div>

          {lowStockProducts.length > 0 && (
            <div
              className="rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-5 p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(239,68,68,0.02))',
                borderColor: 'rgba(239,68,68,0.2)',
              }}
            >
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-red-600 pulse-ring flex-shrink-0">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3
                    className="text-red-400 text-xl"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                  >
                    RUPTURE IMMINENTE
                  </h3>
                  <p className="text-slate-300 text-sm mt-1">
                    <span className="font-black text-white">{lowStockProducts.length} produit{lowStockProducts.length > 1 ? 's' : ''}</span>
                    {' '}en stock critique
                    <span className="ml-2 text-slate-500 font-mono text-xs">
                      [{lowStockProducts.map(p => p.name).join(', ')}]
                    </span>
                  </p>
                </div>
              </div>
              <Link
                href="/war-room/catalogue"
                className="flex-shrink-0 px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  boxShadow: '0 4px 20px rgba(220,38,38,0.3)',
                  color: 'white',
                }}
              >
                → Réapprovisionner
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Chiffre d'Affaires"
              value={`${revenue.toLocaleString('fr-FR')} F`}
              sub="Ventes encaissées · période"
              accent="#10b981"
              icon={DollarSign}
              subAccent="#10b981"
              fill={completionRate}
            />
            <KpiCard
              label="Commandes Terminées"
              value={String(completedOrders)}
              sub={`${completionRate}% du total · ${totalOrders} cmd`}
              accent="#3b82f6"
              icon={Activity}
              fill={completionRate}
            />
            <KpiCard
              label="En Attente"
              value={String(pendingOrders)}
              sub="En cours de préparation"
              accent="#f59e0b"
              icon={Clock}
              fill={totalOrders > 0 ? Math.round((pendingOrders / totalOrders) * 100) : 0}
            />
            <KpiCard
              label="Canaux de Vente"
              value={`${deliveryOrders} / ${takeawayOrders}`}
              sub={`Livraison · Emporter · ${deliveryRate}% livré`}
              accent="#a855f7"
              icon={PieChart}
              fill={deliveryRate}
            />
          </div>

          <div
            className="rounded-2xl border border-white/5 overflow-hidden"
            style={{ background: 'rgba(10,10,18,0.8)' }}
          >
            <div
              className="px-8 py-5 flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-white/5"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(245,166,35,0.1)' }}>
                  <Zap className="h-5 w-5" style={{ color: '#f5a623' }} />
                </div>
                <div>
                  <h2
                    className="text-xl text-white"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                  >
                    FLUX DES COMMANDES
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    {filteredOrders.length} résultat{filteredOrders.length !== 1 ? 's' : ''}
                    {hasTableFilters && ' · filtres actifs'}
                  </p>
                </div>
              </div>

              {/* CORRECTION DU TYPAGE DES FILTRES ICI */}
              <form method="GET" className="flex flex-wrap items-center gap-2.5">
                {searchParams.startDate && <input type="hidden" name="startDate" value={searchParams.startDate} />}
                {searchParams.endDate   && <input type="hidden" name="endDate"   value={searchParams.endDate}   />}

                <select
                  name="type"
                  defaultValue={searchParams.type || ''}
                  className="rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider outline-none appearance-none cursor-pointer transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: '#94a3b8',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  <option value="">Tous types</option>
                  <option value="TAKEAWAY">Emporter</option>
                  <option value="DELIVERY">Livraison</option>
                </select>

                <select
                  name="payment"
                  defaultValue={searchParams.payment || ''}
                  className="rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider outline-none appearance-none cursor-pointer transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: '#94a3b8',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  <option value="">Paiement</option>
                  <option value="PAID">Payé</option>
                  <option value="UNPAID">Impayé</option>
                </select>

                <select
                  name="status"
                  defaultValue={searchParams.status || ''}
                  className="rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider outline-none appearance-none cursor-pointer transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: '#94a3b8',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  <option value="">Statut</option>
                  <option value="PENDING">Attente</option>
                  <option value="COMPLETED">Terminé</option>
                </select>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-white/8 text-slate-300 hover:text-white hover:border-white/15 transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  Filtrer
                </button>

                {hasTableFilters && (
                  <Link
                    href={`/war-room?${searchParams.startDate ? `startDate=${searchParams.startDate}&` : ''}${searchParams.endDate ? `endDate=${searchParams.endDate}` : ''}`}
                    className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                    title="Effacer les filtres"
                  >
                    <X className="h-4 w-4" />
                  </Link>
                )}
              </form>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-24 flex flex-col items-center gap-4 text-center">
                <div className="p-6 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <ShoppingBag className="h-12 w-12 text-slate-700" />
                </div>
                <p className="text-slate-600 font-black uppercase text-xs tracking-[0.3em]">
                  Aucune commande pour ces critères
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.3)' }}>
                      {['#ID', 'Date · Heure', 'Client', 'Type', 'Montant', 'Paiement', 'Statut'].map((h, i) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-[10px] font-black uppercase text-slate-600"
                          style={{
                            letterSpacing: '0.2em',
                            fontFamily: "'IBM Plex Mono', monospace",
                            textAlign: i === 6 ? 'right' : 'left',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.slice(0, 15).map((order) => (
                      <tr
                        key={order.id}
                        className="group transition-colors duration-150 hover:bg-white/[0.025]"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                      >
                        <td className="px-6 py-4">
                          <span
                            className="text-sm font-black text-white"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className="block text-sm text-slate-300 font-medium"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                          <span
                            className="text-[10px] text-slate-600"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-300">
                            {order.user?.phone ?? (
                              <span className="text-slate-600 italic text-xs">Anonyme</span>
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <TypeBadge type={order.orderType} />
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className="text-base font-black text-white"
                            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em' }}
                          >
                            {order.totalAmount.toLocaleString('fr-FR')}
                            <span className="text-xs ml-0.5 text-slate-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>F</span>
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <PaymentPill status={order.paymentStatus} />
                        </td>

                        <td className="px-6 py-4 text-right">
                          <StatusPill status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredOrders.length > 15 && (
                  <div
                    className="px-8 py-5 flex justify-between items-center border-t border-white/5"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                      Affichage 15 / {filteredOrders.length}
                    </p>
                    <Link
                      href="/war-room/orders"
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors hover:-translate-y-0.5 transition-transform"
                      style={{ color: '#f5a623' }}
                    >
                      Voir {filteredOrders.length - 15} de plus
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="py-4 flex justify-between items-center border-t border-white/[0.03]">
            <p className="text-[10px] font-bold uppercase text-slate-700 tracking-widest">
              KRIKA&apos;5 · War Room v2
            </p>
            <p
              className="text-[10px] text-slate-700"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {totalOrders} cmd · {completedOrders} terminées · {revenue.toLocaleString('fr-FR')} F CA
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
