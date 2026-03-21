// src/app/war-room/catalogue/page.tsx
import { prisma } from '@/lib/prisma';
import { ProductTableRow } from '@/components/ProductTableRow';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <header className="mb-8 border-b border-white/10 pb-6">
        <Link href="/war-room" className="inline-flex items-center text-primary hover:text-primary/80 mb-4 font-bold transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la War Room
        </Link>
        <h1 className="text-3xl font-black text-white tracking-tight">Catalogue & Stocks</h1>
        <p className="text-slate-400 mt-1 font-medium">Contrôle en temps réel de la carte KRIKA&apos;5</p>
      </header>

      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category.id}>
            <h2 className="text-2xl font-black text-primary mb-4 px-2 uppercase tracking-wide">{category.name}</h2>
            <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-xs uppercase text-slate-500 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-black tracking-wider">Produit</th>
                      <th className="px-6 py-4 font-black tracking-wider">Prix</th>
                      <th className="px-6 py-4 font-black tracking-wider">Stock Actuel</th>
                      <th className="px-6 py-4 font-black tracking-wider">En Vente</th>
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
          </section>
        ))}
      </div>
    </main>
  );
}
