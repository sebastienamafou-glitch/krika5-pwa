// src/app/war-room/catalogue/page.tsx
import { prisma } from '@/lib/prisma';
import { ProductTableRow } from '@/components/ProductTableRow';
import { CreateCatalogueItem } from '@/components/CreateCatalogueItem';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function CataloguePage() {
  const categories = await prisma.category.findMany({
    include: {
      products: {
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  });

  // Extraction propre des catégories pour le sélecteur du formulaire
  const simpleCategories = categories.map(c => ({ id: c.id, name: c.name }));

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <header className="mb-8 border-b border-white/10 pb-6">
        <Link href="/hub" className="inline-flex items-center text-slate-500 hover:text-white mb-4 font-bold transition-colors text-sm uppercase tracking-widest">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour au Hub
        </Link>
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          Catalogue & Stocks
        </h1>
        <p className="text-slate-400 mt-2 font-medium italic">
          Gestion de la carte <span dangerouslySetInnerHTML={{ __html: BRAND_NAME }} /> en temps réel
        </p>
      </header>

      {/* INJECTION DES BOUTONS DE CRÉATION */}
      <CreateCatalogueItem categories={simpleCategories} />

      <div className="space-y-12">
        {categories.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
            <p className="text-slate-500 font-bold uppercase tracking-widest">Le catalogue est vide</p>
            <p className="text-sm text-slate-600 mt-2">Commencez par créer une catégorie.</p>
          </div>
        ) : (
          categories.map((category) => (
            <section key={category.id}>
              <h2 className="text-2xl font-black text-white mb-6 px-2 uppercase tracking-tight flex items-center gap-3">
                <span className="w-2 h-8 bg-primary rounded-full"></span>
                {category.name}
                <span className="text-sm font-bold text-slate-600 bg-white/5 px-3 py-1 rounded-lg ml-2">{category.products.length} réf.</span>
              </h2>
              
              {category.products.length > 0 ? (
                <div className="bg-slate-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-500 tracking-widest border-b border-white/10">
                        <tr>
                          <th className="px-6 py-5 font-black">Produit</th>
                          <th className="px-6 py-5 font-black">Prix</th>
                          <th className="px-6 py-5 font-black">Stock Actuel</th>
                          <th className="px-6 py-5 font-black">Disponibilité</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.products.map((product) => (
                          <ProductTableRow key={product.id} product={product} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="px-6 py-4 text-slate-500 italic bg-slate-900/50 rounded-2xl border border-white/5">
                  Aucun produit dans cette catégorie.
                </p>
              )}
            </section>
          ))
        )}
      </div>
    </main>
  );
}
