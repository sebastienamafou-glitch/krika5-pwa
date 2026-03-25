// src/app/menu-board/MenuBoardClient.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { BRAND_NAME } from '@/lib/constants';
// IMPORT NEXT/FONT : Solution propre pour éliminer l'erreur ESLint
import { Bebas_Neue, DM_Sans } from 'next/font/google';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap' });

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

// STRUCTURE POUR LA PAGINATION
interface Slide {
  categoryId: string;
  categoryName: string;
  products: Product[];
  pageIndex: number;
  totalPages: number;
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function formatPrice(price: number) {
  return price.toLocaleString('fr-FR');
}

/* ─────────────────────────────────────────
   PRODUCT CARD  (full-bleed image + overlay)
───────────────────────────────────────── */
function ProductCard({ product, index, isFeatured = false }: {
  product: Product;
  index: number;
  isFeatured?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl group h-full w-full"
      style={{ boxShadow: '0 32px 64px -16px rgba(0,0,0,0.7)' }}
    >
      {/* ── IMAGE FULL-BLEED ── */}
      <div className="absolute inset-0">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-[4000ms] ease-out group-hover:scale-105"
            priority={index < 2}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <Image src="/icon-512x512.png" alt="K5" width={80} height={80} className="opacity-10 grayscale" />
          </div>
        )}
      </div>

      {/* ── CINEMATIC OVERLAY ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
      {/* Side vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* ── PRICE BADGE (top-right) ── */}
      <div
        className="absolute top-5 right-5 px-4 py-2 rounded-2xl backdrop-blur-md"
        style={{
          background: 'linear-gradient(135deg, #f5a623, #e8860f)',
          boxShadow: '0 8px 24px rgba(245,166,35,0.35)',
        }}
      >
        <span 
          className={`${bebasNeue.className} text-slate-950 tracking-[0.04em] ${isFeatured ? 'text-4xl' : 'text-3xl'}`}
        >
          {formatPrice(product.price)}<span className="text-base ml-0.5">F</span>
        </span>
      </div>

      {/* ── BOTTOM TEXT ── */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3
          className={`${bebasNeue.className} text-white uppercase tracking-[0.03em] leading-none ${isFeatured ? 'text-5xl' : 'text-3xl'}`}
        >
          {product.name}
        </h3>
        {product.description && (
          <p className="text-white/60 mt-1.5 line-clamp-2 text-sm font-medium italic leading-relaxed">
            {product.description}
          </p>
        )}
        {/* Thin accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: index * 0.12 + 0.4 }}
          className="h-0.5 mt-3 w-12 origin-left rounded-full"
          style={{ background: 'linear-gradient(90deg, #f5a623, transparent)' }}
        />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export function MenuBoardClient({ initialCategories }: { initialCategories: Category[] }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentYear = new Date().getFullYear();
  const ROTATION_DURATION = 20; // secondes
  const ITEMS_PER_PAGE = 5; // 1 vedette + 4 secondaires

  // RÉSOLUTION PAGINATION : On découpe les catégories en "Diapositives" (Slides)
  const slides: Slide[] = useMemo(() => {
    const generatedSlides: Slide[] = [];
    
    initialCategories.forEach((category) => {
      const products = category.products ?? [];
      const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE) || 1;
      
      for (let i = 0; i < totalPages; i++) {
        const start = i * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        generatedSlides.push({
          categoryId: category.id,
          categoryName: category.name,
          products: products.slice(start, end),
          pageIndex: i + 1,
          totalPages: totalPages
        });
      }
    });
    
    return generatedSlides;
  }, [initialCategories]);

  // ROTATION DES DIAPOSITIVES
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, ROTATION_DURATION * 1000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlide = slides[currentSlideIndex];
  if (!currentSlide) return null;

  /* Layout : 1 vedette à gauche + reste à droite */
  const featured = currentSlide.products[0];
  const secondary = currentSlide.products.slice(1, 5); 

  return (
    <>
      {/* ── STYLES POUR L'ARRIÈRE-PLAN (Sans Import @url) ── */}
      <style>{`
        * { box-sizing: border-box; }
        
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2%, -3%); }
          20% { transform: translate(2%, 2%); }
          30% { transform: translate(-1%, 3%); }
          40% { transform: translate(3%, -1%); }
          50% { transform: translate(-3%, 1%); }
          60% { transform: translate(1%, -2%); }
          70% { transform: translate(-2%, 3%); }
          80% { transform: translate(2%, -3%); }
          90% { transform: translate(-1%, 2%); }
        }
        
        .grain-overlay::before {
          content: '';
          position: fixed;
          inset: -50%;
          width: 200%;
          height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.035;
          animation: grain 8s steps(10) infinite;
          pointer-events: none;
          z-index: 99;
        }

        @keyframes meshFloat {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(2%, -3%) scale(1.05); }
          66% { transform: translate(-2%, 2%) scale(0.98); }
        }
      `}</style>

      <div
        className={`grain-overlay h-screen w-full text-white flex flex-col relative overflow-hidden ${dmSans.className}`}
        style={{ background: '#080810' }}
      >
        {/* ── ANIMATED BACKGROUND MESH ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute rounded-full blur-[160px] opacity-20"
            style={{
              width: '60vw', height: '60vw',
              background: 'radial-gradient(circle, #f5a623 0%, transparent 70%)',
              top: '-20vw', right: '-10vw',
              animation: 'meshFloat 18s ease-in-out infinite',
            }}
          />
          <div
            className="absolute rounded-full blur-[200px] opacity-10"
            style={{
              width: '50vw', height: '50vw',
              background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
              bottom: '-15vw', left: '-10vw',
              animation: 'meshFloat 24s ease-in-out infinite reverse',
            }}
          />
        </div>

        {/* ══════════════════════════════════
            HEADER
        ══════════════════════════════════ */}
        <header
          className="relative z-10 px-12 py-6 flex justify-between items-center"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          {/* ── Left : Logo + Brand ── */}
          <div className="flex items-center gap-8">
            <div
              className="relative flex-shrink-0"
              style={{
                width: 80, height: 80,
                filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.4))',
              }}
            >
              <Image src="/icon-512x512.png" alt="Logo" fill className="object-contain rounded-[1.6rem]" priority />
            </div>

            <div>
              <h1
                className={`${bebasNeue.className} text-6xl text-white tracking-[0.06em] leading-none`}
              >
                KRIKA<span style={{ color: '#f5a623' }}>&apos;</span>5
              </h1>
              <p
                className="text-[10px] font-bold uppercase mt-1 text-primary tracking-[0.3em]"
              >
                Premium Fast Food • Abidjan
              </p>
            </div>

            {/* ── Divider ── */}
            <div className="w-px h-14 mx-4" style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)' }} />

            {/* ── Category Name & Page Indicator ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentSlide?.categoryId}-${currentSlide.pageIndex}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-6"
              >
                <div>
                  <p className="text-[10px] uppercase font-bold mb-1 tracking-[0.25em] text-white/30">
                    Catégorie
                  </p>
                  <p
                    className={`${bebasNeue.className} text-white tracking-[0.06em] text-[2.2rem] leading-none`}
                  >
                    {currentSlide?.categoryName}
                  </p>
                </div>
                {/* Indicateur de page si plus de 5 produits */}
                {currentSlide.totalPages > 1 && (
                  <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary tracking-widest uppercase">
                       Page {currentSlide.pageIndex}/{currentSlide.totalPages}
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Right : Nav Dots + Tagline ── */}
          <div className="flex flex-col items-end gap-4">
            <p className="text-3xl font-bold italic text-white/80">
              Goûtez l&apos;excellence
            </p>
            {/* Slide dots */}
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: i === currentSlideIndex ? 28 : 8,
                    height: 8,
                    background: i === currentSlideIndex
                      ? 'linear-gradient(90deg, #f5a623, #e8860f)'
                      : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════
            CATEGORY WATERMARK
        ══════════════════════════════════ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`wm-${currentSlide?.categoryId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute pointer-events-none select-none overflow-hidden"
            style={{ top: '12%', left: '0', right: '0', zIndex: 0 }}
          >
            <p
              className={`${bebasNeue.className} text-transparent`}
              style={{
                fontSize: 'clamp(8rem, 18vw, 22rem)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                WebkitTextStroke: '1px rgba(255,255,255,0.03)',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                paddingLeft: '2rem',
              }}
            >
              {currentSlide?.categoryName?.toUpperCase()}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* ══════════════════════════════════
            MAIN CONTENT : ASYMMETRIC LAYOUT
        ══════════════════════════════════ */}
        <main className="relative z-10 flex-1 px-12 pb-10 pt-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentSlide?.categoryId}-${currentSlide.pageIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full flex gap-8"
            >
              {/* ── FEATURED (left, 45%) ── */}
              {featured && (
                <div className="w-[45%] flex-shrink-0">
                  <ProductCard product={featured} index={0} isFeatured />
                </div>
              )}

              {/* ── SECONDARY GRID (right, 55%) ── */}
              {secondary.length > 0 && (
                <div
                  className="flex-1 grid gap-6"
                  style={{
                    gridTemplateColumns: secondary.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                    gridTemplateRows: secondary.length <= 2 ? '1fr' : 'repeat(2, 1fr)',
                  }}
                >
                  {secondary.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i + 1} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ══════════════════════════════════
            FOOTER
        ══════════════════════════════════ */}
        <footer
          className="relative z-10 px-12 py-4 flex justify-between items-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <p className="text-xs font-medium text-white/20 tracking-[0.15em]">
            © {currentYear} {BRAND_NAME.replace(/&apos;/g, "'")} — Premium Fast Food Abidjan
          </p>
          <div className="flex items-center gap-2 opacity-30">
            <Image src="/logo-webappci.png" alt="webapp.ci" width={16} height={16} className="grayscale" />
            <span className="text-[10px] font-bold uppercase text-white/40 tracking-[0.2em]">
              webapp.ci
            </span>
          </div>
        </footer>

        {/* ══════════════════════════════════
            PROGRESS BAR
        ══════════════════════════════════ */}
        <motion.div
          key={`pb-${currentSlideIndex}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: ROTATION_DURATION, ease: 'linear' }}
          className="absolute bottom-0 left-0 h-0.5 w-full origin-left z-50"
          style={{ background: 'linear-gradient(90deg, #f5a623, #f59e0b, #fbbf24)' }}
        />
      </div>
    </>
  );
}
