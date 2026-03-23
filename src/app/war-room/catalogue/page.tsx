// src/app/war-room/catalogue/page.tsx
import { prisma } from '@/lib/prisma';
import { ProductTableRow } from '@/components/ProductTableRow';
import { CreateCatalogueItem } from '@/components/CreateCatalogueItem';
import Link from 'next/link';
import { ArrowLeft, BookOpen, UtensilsCrossed, PackageOpen } from 'lucide-react';
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

  // Extraction propre des catégories pour le sélecteur du formulaire (création & édition)
  const simpleCategories = categories.map(c => ({ id: c.id, name: c.name }));

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 flex flex-col">
      
      {/* EN-TÊTE PREMIUM */}
      <header className="mb-10 border-b border-white/5 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <Link href="/hub" className="inline-flex items-center text-slate-500 hover:text-white mb-6 font-bold transition-colors group text-sm uppercase tracking-widest">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Retour au Hub
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-center gap-4">
            <div className="bg-blue-500/20 text-blue-400 p-3 rounded-2xl shadow-inner">
              <BookOpen className="w-8 h-8" />
            </div>
            Catalogue
          </h1>
          <p className="text-slate-400 mt-3 font-medium text-lg">
            Gestion de la carte <span dangerouslySetInnerHTML={{ __html: BRAND_NAME }} /> en temps réel
          </p>
        </div>
        
        {/* INJECTION DES BOUTONS DE CRÉATION */}
        <div className="lg:pb-2">
          <CreateCatalogueItem categories={simpleCategories} />
        </div>
      </header>

      {/* LISTE DES CATÉGORIES ET PRODUITS */}
      <div className="space-y-16 pb-24">
        {categories.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center bg-slate-900/20">
            <PackageOpen className="w-16 h-16 text-slate-600 mb-6 opacity-50" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-lg">Le catalogue est vide</p>
            <p className="text-sm text-slate-500 mt-2 font-medium">Commencez par créer une catégorie pour y ajouter vos plats.</p>
          </div>
        ) : (
          categories.map((category) => (
            <section key={category.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <span className="w-2 h-8 bg-blue-500 rounded-full shadow-lg shadow-blue-500/20"></span>
                  {category.name}
                </h2>
                <span className="text-xs font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl uppercase tracking-widest">
                  {category.products.length} {category.products.length > 1 ? 'Références' : 'Référence'}
                </span>
              </div>
              
              {category.products.length > 0 ? (
                <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-500 tracking-widest border-b border-white/5">
                        <tr>
                          <th className="px-6 py-5 font-black">Produit</th>
                          <th className="px-6 py-5 font-black">Prix</th>
                          <th className="px-6 py-5 font-black text-center">Stock</th>
                          <th className="px-6 py-5 font-black text-center">Disponibilité</th>
                          <th className="px-6 py-5 font-black text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {category.products.map((product) => (
                          <ProductTableRow 
                            key={product.id} 
                            product={product} 
                            categories={simpleCategories} 
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="px-8 py-8 text-slate-500 flex items-center gap-4 bg-slate-900/30 rounded-[2rem] border border-white/5">
                  <UtensilsCrossed className="w-6 h-6 opacity-50" />
                  <p className="font-medium text-sm">Aucun produit dans cette catégorie. Utilisez le bouton &quot;Nouveau Produit&quot;.</p>
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </main>
  );
}
