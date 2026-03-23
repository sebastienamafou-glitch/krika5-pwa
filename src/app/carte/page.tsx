// src/app/carte/page.tsx
import { prisma } from '@/lib/prisma';
import { MenuCard } from '@/components/MenuCard';
import { Utensils, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function CartePage() {
  // Vérification silencieuse : l'utilisateur est-il un membre du staff ?
  const isStaff = cookies().has('kds_session');

  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { name: 'asc' }
      }
    }
  });

  return (
    <main className="min-h-screen bg-slate-950 pt-8 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* EN-TÊTE : BOUTON RETOUR + LOGO */}
        <header className="flex items-center justify-between mb-16 border-b border-white/5 pb-6">
          <Link href={isStaff ? "/hub" : "/"} className="text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors w-32">
            <ArrowLeft className="w-4 h-4" /> {isStaff ? "Hub" : "Accueil"}
          </Link>
          
          {/* Implémentation du logo nettoyé (style Landing Page / Hub) */}
          <Image 
            src="/icon-512x512.png" 
            alt="Logo KRIKA'5" 
            width={80} 
            height={80} 
            className="drop-shadow-2xl rounded-2xl"
            priority 
          />
          
          <div className="w-32 hidden md:block"></div> {/* Espaceur pour centrer le logo */}
        </header>

        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
            Notre <span className="text-primary">Carte</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Découvrez nos recettes exclusives. Tous nos plats sont préparés à la commande avec des ingrédients frais de première qualité.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center text-slate-500 font-bold uppercase tracking-widest py-20 border-2 border-dashed border-white/5 rounded-[3rem]">
            Aucun produit disponible pour le moment.
          </div>
        ) : (
          <div className="space-y-24">
            {categories.map((category) => {
              if (category.products.length === 0) return null; 

              return (
                <section key={category.id} className="scroll-mt-32" id={category.slug}>
                  <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
                    <div className="bg-primary/10 p-3 rounded-2xl">
                      <Utensils className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                      {category.name}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.products.map((product) => (
                      <MenuCard key={product.id} product={product} isStaff={isStaff} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
