// src/app/war-room/pos/PosClient.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Banknote, CheckCircle2, QrCode, Search, X, Loader2,
  Camera, Receipt, UserCircle, Smartphone, Plus, ShoppingBag, Gift,
  Star, Zap, 
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { BRAND_NAME } from '@/lib/constants';
import { useCartStore } from '@/store/useCartStore';
import { processPayment, processFreeRewardOrder } from '@/actions/pos';
import { TicketReceipt, TicketProps } from '@/components/TicketReceipt';
import { CartSheet } from '@/components/CartSheet';

/* ─── TYPES ─────────────────────────────────────────────────── */
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  description?: string | null;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; price: number };
}

interface PosOrder {
  id: string;
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
}

/* ─── PRODUCT CARD ───────────────────────────────────────────── */
function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="group relative overflow-hidden rounded-2xl text-left transition-all duration-200 active:scale-95 focus:outline-none"
      style={{
        background: 'rgba(10,10,18,0.9)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        aspectRatio: '3/4',
      }}
    >
      <div className="absolute inset-0">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0d0d1a, #1a1a2e)' }}
          >
            <ShoppingBag className="h-10 w-10 opacity-10 text-white" />
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10" />

      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: 'inset 0 0 0 1.5px rgba(245,166,35,0.5)' }}
      />

      <div
        className="absolute top-3 right-3 px-3 py-1.5 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #f5a623, #e8860f)',
          boxShadow: '0 4px 12px rgba(245,166,35,0.3)',
        }}
      >
        <span
          className="text-slate-950 font-black text-sm"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}
        >
          {product.price.toLocaleString('fr-FR')}<span className="text-xs ml-0.5">F</span>
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p
          className="text-white font-black leading-tight text-sm mb-2 line-clamp-2"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em', fontSize: '1rem' }}
        >
          {product.name.toUpperCase()}
        </p>
        {product.description && (
          <p className="text-white/40 text-[10px] line-clamp-1 mb-2 italic">
            {product.description}
          </p>
        )}
        <div
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
          style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)' }}
        >
          <Plus className="h-3.5 w-3.5" style={{ color: '#f5a623' }} />
          <span
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: '#f5a623' }}
          >
            Ajouter
          </span>
        </div>
      </div>
    </button>
  );
}

/* ─── ORDER PAYMENT CARD ─────────────────────────────────────── */
function OrderCard({
  order,
  isPending,
  processingOrderId,
  onPay,
}: {
  order: PosOrder;
  isPending: boolean;
  processingOrderId: string | null;
  onPay: (order: PosOrder, method: string) => void;
}) {
  const hasFreeMenuReward = order.user && order.user.loyaltyPoints >= 10;
  const isLoading = isPending && processingOrderId === order.id;

  return (
    <div
      className="rounded-2xl flex flex-col gap-0 overflow-hidden transition-all duration-200"
      style={{
        background: 'rgba(10,10,18,0.9)',
        border: hasFreeMenuReward
          ? '1px solid rgba(245,166,35,0.4)'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: hasFreeMenuReward
          ? '0 8px 32px rgba(245,166,35,0.12)'
          : '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Receipt className="w-5 h-5 text-slate-500" />
            </div>

            <div>
              <p
                className="font-black text-white text-lg"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
              >
                CMD #{order.id.slice(-6).toUpperCase()}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <UserCircle className="w-3.5 h-3.5 text-slate-600" />
                <span
                  className="text-xs font-medium text-slate-400"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {order.user?.phone ?? 'Anonyme'}
                </span>

                {order.user && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
                    style={hasFreeMenuReward
                      ? { background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.3)' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }
                    }
                  >
                    <Star className="h-2.5 w-2.5" />
                    {order.user.loyaltyPoints}/10 pts
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p
              className="font-black text-3xl leading-none"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: '0.04em',
                color: hasFreeMenuReward ? '#f5a623' : '#10b981',
              }}
            >
              {order.totalAmount.toLocaleString('fr-FR')}
              <span className="text-base ml-0.5 opacity-60">F</span>
            </p>
            <p className="text-[10px] text-slate-600 mt-1 font-bold uppercase tracking-widest">
              {order.items.length} article{order.items.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div
          className="mt-4 rounded-xl p-3 space-y-1"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">
                <span className="text-slate-600 mr-1.5 font-black">×{item.quantity}</span>
                {item.product.name}
              </span>
              <span
                className="text-xs font-black text-slate-500"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {(item.unitPrice * item.quantity).toLocaleString('fr-FR')} F
              </span>
            </div>
          ))}
        </div>
      </div>

      {order.paymentStatus !== 'PAID' && (
        <div className="p-4 flex flex-col gap-2.5">
          {hasFreeMenuReward && (
            <button
              onClick={() => onPay(order, 'REWARD_FREE_MENU')}
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2.5 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #f5a623, #e8860f)',
                boxShadow: '0 4px 20px rgba(245,166,35,0.3)',
                color: '#0d0d0d',
              }}
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><Gift className="h-4 w-4" /> Offrir un Menu · 10 pts</>
              }
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onPay(order, 'ESPECES')}
              disabled={isLoading}
              className="flex justify-center items-center gap-2 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
                boxShadow: '0 4px 16px rgba(5,150,105,0.2)',
                color: 'white',
              }}
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><Banknote className="h-4 w-4" /> Espèces</>
              }
            </button>
            <button
              onClick={() => onPay(order, 'MOBILE_MONEY')}
              disabled={isLoading}
              className="flex justify-center items-center gap-2 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
              }}
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><Smartphone className="h-4 w-4" /> Mobile</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function PosClient({ orders = [], categories = [] }: PosPageProps) {
  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'PAYMENTS'>('NEW_ORDER');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const addItem = useCartStore((s) => s.addItem);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const [isPending, startTransition] = useTransition();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<TicketProps | null>(null);

  useEffect(() => {
    if (!isScannerOpen) return;
    const scanner = new Html5Qrcode('reader');
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decoded: string) => {
          setSearchQuery(decoded);
          setCustomer(decoded);
          setIsScannerOpen(false);
        },
        () => {}
      )
      .catch((err: unknown) => {
        console.error(err);
        alert("Impossible d'accéder à la caméra.");
        setIsScannerOpen(false);
      });
    return () => {
      scannerRef.current?.stop().then(() => scannerRef.current?.clear()).catch(() => {});
    };
  }, [isScannerOpen, setCustomer]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        (o.user?.phone.includes(q)) ||
        (o.user?.id.toLowerCase() === q)
    );
  }, [orders, searchQuery]);

  const handlePayment = (order: PosOrder, method: string) => {
    setProcessingOrderId(order.id);
    startTransition(async () => {
      const result =
        method === 'REWARD_FREE_MENU'
          ? await processFreeRewardOrder(order.id)
          : await processPayment(order.id, method);

      if (result?.success) {
        setTicketData({
          orderId: order.id,
          date: new Date(),
          items: order.items.map((i) => ({
            name: i.product.name,
            quantity: i.quantity,
            price: i.unitPrice,
          })),
          total: method === 'REWARD_FREE_MENU' ? 0 : order.totalAmount,
          paymentMethod: method,
        });
        setTimeout(() => {
          window.print();
          setTicketData(null);
          setProcessingOrderId(null);
        }, 150);
      } else {
        alert(result?.error ?? "Échec de l'encaissement.");
        setProcessingOrderId(null);
      }
    });
  };

  const visibleCategory =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;700&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap');
      `}</style>

      <main
        className="min-h-screen print:hidden flex flex-col"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: 'linear-gradient(135deg, #07070f 0%, #0d0d1a 50%, #07070f 100%)',
          color: 'white',
        }}
      >
        <header
          className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between gap-4"
          style={{
            background: 'rgba(7,7,15,0.92)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-5">
            <Link
              href="/war-room"
              className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] hidden sm:inline">
                War Room
              </span>
            </Link>

            <div
              className="w-px h-8"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />

            <div>
              <h1
                className="text-4xl leading-none text-white"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
              >
                CAISSE <span style={{ color: '#f5a623' }} dangerouslySetInnerHTML={{ __html: BRAND_NAME }} />
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 mt-0.5">
                Point de vente
              </p>
            </div>
          </div>

          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {([
              { key: 'NEW_ORDER', label: 'Commander', icon: ShoppingBag, badge: null },
              { key: 'PAYMENTS', label: 'Encaisser', icon: Zap, badge: orders.length || null },
            ] as const).map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as 'NEW_ORDER' | 'PAYMENTS')}
                className="relative flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all duration-200"
                style={
                  activeTab === key
                    ? {
                        background: 'linear-gradient(135deg, #f5a623, #e8860f)',
                        color: '#0d0d0d',
                        boxShadow: '0 4px 16px rgba(245,166,35,0.25)',
                      }
                    : { color: '#64748b' }
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                {badge && (
                  <span
                    className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 min-w-[1.1rem] flex items-center justify-center rounded-full text-[9px] font-black"
                    style={{
                      background: activeTab === key ? '#0d0d0d' : '#f5a623',
                      color: activeTab === key ? '#f5a623' : '#0d0d0d',
                      padding: '0 4px',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <CartSheet />
        </header>

        {activeTab === 'NEW_ORDER' && (
          <div className="flex flex-col flex-1">
            {categories.length > 0 && (
              <div
                className="px-6 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className="flex-shrink-0 px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 whitespace-nowrap"
                    style={
                      activeCategoryId === cat.id
                        ? {
                            background: 'rgba(245,166,35,0.12)',
                            border: '1px solid rgba(245,166,35,0.35)',
                            color: '#f5a623',
                          }
                        : {
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: '#64748b',
                          }
                    }
                  >
                    {cat.name}
                    <span className="ml-2 opacity-50 font-normal">
                      {cat.products.length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 p-6 overflow-y-auto">
              {!visibleCategory || visibleCategory.products.length === 0 ? (
                <div
                  className="rounded-3xl p-16 text-center flex flex-col items-center gap-4"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed rgba(255,255,255,0.05)',
                  }}
                >
                  <ShoppingBag className="h-12 w-12 text-slate-700" />
                  <p className="text-slate-600 font-black uppercase text-xs tracking-[0.3em]">
                    Catalogue vide
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {visibleCategory.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={() => addItem({ id: product.id, name: product.name, price: product.price })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'PAYMENTS' && (
          <div className="flex-1 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600"
                />
                <input
                  type="text"
                  placeholder="Rechercher par tél, N° commande…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl font-medium text-sm outline-none transition-all placeholder:text-slate-700"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'white',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(245,166,35,0.4)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
                />
              </div>

              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#94a3b8',
                }}
              >
                <QrCode className="h-4 w-4" />
                <span className="hidden md:inline">Scanner</span>
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div
                className="rounded-2xl p-20 flex flex-col items-center gap-5 text-center"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.05)',
                }}
              >
                <div
                  className="p-5 rounded-2xl"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)' }}
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <p className="text-slate-600 font-black uppercase text-xs tracking-[0.3em]">
                  Aucune commande en attente
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isPending={isPending}
                    processingOrderId={processingOrderId}
                    onPay={handlePayment}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {isScannerOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(7,7,15,0.97)', backdropFilter: 'blur(24px)' }}
          >
            <div
              className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(10,10,18,0.98)',
                border: '1px solid rgba(245,166,35,0.2)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.8)',
              }}
            >
              <div className="p-8 text-center relative">
                <button
                  onClick={() => setIsScannerOpen(false)}
                  className="absolute right-5 top-5 p-2 rounded-xl transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: '#64748b',
                  }}
                >
                  <X className="h-5 w-5" />
                </button>

                <div
                  className="inline-flex p-4 rounded-2xl mb-5"
                  style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}
                >
                  <Camera className="h-7 w-7" style={{ color: '#f5a623' }} />
                </div>
                <h3
                  className="text-3xl text-white"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                >
                  SCANNER FIDÉLITÉ
                </h3>
                <p className="text-slate-500 text-sm mt-1.5">
                  Placez le QR Code client dans le cadre
                </p>
              </div>

              <div className="px-8 pb-8 space-y-4">
                <div
                  id="reader"
                  className="overflow-hidden rounded-2xl bg-black aspect-square w-full"
                  style={{ border: '2px solid rgba(245,166,35,0.2)' }}
                />
                <button
                  onClick={() => setIsScannerOpen(false)}
                  className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: '#64748b',
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {ticketData && <TicketReceipt {...ticketData} />}
    </>
  );
}
