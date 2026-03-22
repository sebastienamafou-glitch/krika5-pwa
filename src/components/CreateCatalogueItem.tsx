// src/components/CreateCatalogueItem.tsx
'use client';

import { useState, useTransition } from 'react';
import { createCategory, createProduct } from '@/actions/product';
import { X, Loader2, FolderPlus, PackagePlus } from 'lucide-react';

type Category = {
  id: string;
  name: string;
};

export function CreateCatalogueItem({ categories }: { categories: Category[] }) {
  const [activeModal, setActiveModal] = useState<'NONE' | 'CATEGORY' | 'PRODUCT'>('NONE');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [catName, setCatName] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState(categories[0]?.id || '');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await createCategory(catName);
      if (result.success) {
        setCatName('');
        setActiveModal('NONE');
      } else {
        setError(result.error || 'Erreur inconnue');
      }
    });
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await createProduct({
        name: prodName,
        price: Number(prodPrice),
        categoryId: prodCategoryId
      });
      if (result.success) {
        setProdName('');
        setProdPrice('');
        setActiveModal('NONE');
      } else {
        setError(result.error || 'Erreur inconnue');
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={() => setActiveModal('CATEGORY')}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 rounded-xl font-bold transition-all text-sm uppercase tracking-widest"
        >
          <FolderPlus className="w-5 h-5" /> Nouvelle Catégorie
        </button>
        <button 
          onClick={() => setActiveModal('PRODUCT')}
          disabled={categories.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          title={categories.length === 0 ? "Créez d'abord une catégorie" : ""}
        >
          <PackagePlus className="w-5 h-5" /> Nouveau Produit
        </button>
      </div>

      {activeModal === 'CATEGORY' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-8 relative shadow-2xl">
            <button onClick={() => setActiveModal('NONE')} className="absolute right-6 top-6 text-slate-500 hover:text-white"><X /></button>
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><FolderPlus className="text-purple-500" /> Créer Catégorie</h3>
            
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nom (ex: Desserts)</label>
                <input 
                  type="text" required value={catName} onChange={e => setCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  placeholder="Saisir le nom..."
                />
              </div>
              {error && <p className="text-red-400 text-sm font-bold">{error}</p>}
              <button disabled={isPending || !catName} type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition-colors flex justify-center uppercase tracking-widest text-xs">
                {isPending ? <Loader2 className="animate-spin" /> : "Enregistrer la catégorie"}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'PRODUCT' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-8 relative shadow-2xl">
            <button onClick={() => setActiveModal('NONE')} className="absolute right-6 top-6 text-slate-500 hover:text-white"><X /></button>
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><PackagePlus className="text-primary" /> Créer Produit</h3>
            
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nom du produit</label>
                <input 
                  type="text" required value={prodName} onChange={e => setProdName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                  placeholder="Ex: Tacos Double"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Prix (FCFA)</label>
                  <input 
                    type="number" required min="0" value={prodPrice} onChange={e => setProdPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                    placeholder="2500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Catégorie</label>
                  <select 
                    required value={prodCategoryId} onChange={e => setProdCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none appearance-none"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm font-bold">{error}</p>}
              <button disabled={isPending || !prodName || !prodPrice} type="submit" className="w-full py-4 mt-2 bg-primary hover:bg-orange-500 text-white font-black rounded-xl transition-colors flex justify-center uppercase tracking-widest text-xs">
                {isPending ? <Loader2 className="animate-spin" /> : "Ajouter au catalogue"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
