// src/app/page.tsx
import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/ProductCard';
import { CartHeader } from '@/components/CartHeader';
import { Flame } from 'lucide-react';
import Image from 'next/image';

// On s'assure que la page reflète les stocks en temps réel
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Récupération des catégories et de leurs produits depuis Neon
  const categories = await prisma.category.findMany({
    include: {
      products: {
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  });

  return (
    <div className="min-h-screen bg-slate-950 pb-24 font-sans">
      <CartHeader />
      
      {/* Hero Section Brandée KRIKA'5 */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-slate-950/50 to-slate-950 z-0"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
          <Image 
            src="/icon-512x512.png" 
            alt="Logo KRIKA'5" 
            width={140} 
            height={140} 
            className="mb-8 drop-shadow-2xl rounded-3xl" 
            priority 
          />
          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
            La Street-Food <br/>
            <span className="text-primary flex items-center justify-center gap-3 mt-2">
              Premium <Flame className="h-10 w-10 md:h-14 md:w-14" />
            </span>
          </h2>
          <p className="text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            Garba clean, Smash Burgers et spécialités maison. Commandez en ligne, récupérez sans faire la queue.
          </p>
        </div>
      </section>

      {/* Boucle des Catégories (Menus, Boissons, etc.) */}
      <main className="max-w-6xl mx-auto px-6 space-y-20 relative z-10 mt-8">
        {categories.map((category) => (
          <section key={category.id} id={category.slug} className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-3xl font-black text-white uppercase tracking-tight">{category.name}</h3>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-primary/50 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
